import React, { useState, useEffect } from 'react';
import { 
  getCustomers, 
  getItems, 
  postSale, 
  postCustomer, 
  getSales,
  updateItemStock,  // This should now work
  updateMultipleStocks  // Optional
} from '../services/api';
import { generateInvoicePDF } from '../services/InvoicePDFGenerator';


export default function InvoiceModal({ isOpen, onClose, onInvoiceCreated }) {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([{ itemId: '', quantity: 1, unitPrice: 0, availableStock: null }]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // New: Payment method state
  const [paymentStatus, setPaymentStatus] = useState('paid'); // New: Payment status state

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setInvoiceItems([{ itemId: '', quantity: 1, unitPrice: 0, availableStock: null }]);
      setNotes('');
      setPaymentMethod('cash');
      setPaymentStatus('paid');
      setError('');
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [customersData, itemsData, salesData] = await Promise.all([
        getCustomers(),
        getItems(),
        getSales()
      ]);
      setCustomers(customersData);
      setItems(itemsData);
      setSales(salesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data. Please check backend connection.');
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceItems];
    
    if (field === 'itemId') {
      const selectedItem = items.find(item => item.id == value);
      newItems[index] = {
        ...newItems[index],
        itemId: value,
        itemName: selectedItem?.name || '',
        unitPrice: selectedItem ? parseFloat(selectedItem.price) : 0,
        availableStock: selectedItem ? selectedItem.stock : null
      };
    } else if (field === 'quantity') {
      const qty = parseInt(value) || 0;
      newItems[index] = {
        ...newItems[index],
        quantity: qty
      };
    }
    
    setInvoiceItems(newItems);
  };

  const addItem = () => {
    setInvoiceItems([...invoiceItems, { itemId: '', quantity: 1, unitPrice: 0, availableStock: null }]);
  };

  const removeItem = (index) => {
    if (invoiceItems.length > 1) {
      const newItems = invoiceItems.filter((_, i) => i !== index);
      setInvoiceItems(newItems);
    }
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const validateItems = () => {
    for (const item of invoiceItems) {
      if (!item.itemId) {
        setError('Please select an item for all rows');
        return false;
      }
      if (item.quantity <= 0) {
        setError('Quantity must be greater than 0');
        return false;
      }
      if (item.availableStock !== null && item.quantity > item.availableStock) {
        setError(`Insufficient stock for "${item.itemName}". Available: ${item.availableStock}`);
        return false;
      }
    }
    return true;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const generateInvoiceNumber = () => {
    // Generate invoice number based on existing sales count
    const invoiceCount = sales.length + 1;
    const invoiceNumber = `INV-${String(invoiceCount).padStart(4, '0')}`;
    console.log('Generated invoice number:', invoiceNumber);
    return invoiceNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation (keep existing validation)
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!validatePhoneNumber(customerPhone.trim())) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!validateItems()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Starting invoice creation process...');
      
      let customerId;
      
      // Check if customer exists by phone number
      const existingCustomer = customers.find(c => 
        c.phone === customerPhone.trim()
      );
      
      if (existingCustomer) {
        // Use existing customer
        customerId = existingCustomer.id;
        console.log('✅ Using existing customer:', existingCustomer);
      } else {
        // Create new customer
        console.log('🆕 Creating new customer...');
        try {
          const newCustomer = await postCustomer({
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: ''
          });
          customerId = newCustomer.id;
          console.log('✅ New customer created:', newCustomer);
        } catch (customerError) {
          console.error('❌ Failed to create customer:', customerError);
          setError('Failed to create customer. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Prepare items payload
      const itemsPayload = invoiceItems
        .filter(item => item.itemId && item.quantity > 0)
        .map(item => ({
          item: parseInt(item.itemId),
          quantity: item.quantity,
          unit_price: item.unitPrice
        }));

      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber();

      const payload = {
        customer: customerId,
        items: itemsPayload,
        notes: notes.trim() || '',
        invoice_number: invoiceNumber,
        total_amount: calculateTotal().toFixed(2),
        payment_method: paymentMethod, // Added: Payment method
        payment_status: paymentStatus, // Added: Payment status
        tax_amount: 0, // Added: Placeholder for tax
        discount_amount: 0 // Added: Placeholder for discount
      };

      console.log('📦 Submitting invoice payload:', payload);

      // Create the invoice
      let result;
      try {
        result = await postSale(payload);
        console.log('✅ Invoice created successfully:', result);
        
        // ✅ STEP 1: Update product stocks
        await updateProductStocks();
        
        // ✅ STEP 2: Generate PDF
        generateInvoicePDF({
          invoice_number: invoiceNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          items: invoiceItems,
          total_amount: calculateTotal().toFixed(2),
          notes: notes.trim(),
          payment_method: paymentMethod, // Added to PDF
          payment_status: paymentStatus // Added to PDF
        });
        
      } catch (invoiceError) {
        console.error('❌ Failed to create invoice:', invoiceError);
        
        // Try fallback without invoice_number if backend rejects it
        if (invoiceError.message?.includes('invoice_number')) {
          console.log('🔄 Trying without invoice_number...');
          const { invoice_number, ...payloadWithoutInvoice } = payload;
          result = await postSale(payloadWithoutInvoice);
          
          // Still update stocks if sale succeeded
          if (result) {
            await updateProductStocks();
            generateInvoicePDF({
              invoice_number: `INV-${sales.length + 1}`, // Generate client-side number
              customer_name: customerName,
              customer_phone: customerPhone,
              items: invoiceItems,
              total_amount: calculateTotal().toFixed(2),
              notes: notes.trim(),
              payment_method: paymentMethod, // Added to PDF
              payment_status: paymentStatus // Added to PDF
            });
          }
        } else {
          throw invoiceError;
        }
      }

      alert('✅ Invoice created successfully! PDF downloaded automatically.');
      
      // Call the callback to refresh parent components
      if (onInvoiceCreated) {
        onInvoiceCreated(result);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('❌ Invoice creation error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to create invoice. Please check your data.';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // New function to update product stocks
  const updateProductStocks = async () => {
  try {
    console.log('🔄 Starting stock updates...');
    
    const stockUpdates = invoiceItems.map(item => {
      const selectedItem = items.find(it => it.id == item.itemId);
      if (!selectedItem) {
        console.warn(`⚠️ Item ${item.itemId} not found in items list`);
        return null;
      }
      
      const newStock = selectedItem.stock - item.quantity;
      console.log(`Item ${item.itemId}: ${selectedItem.stock} - ${item.quantity} = ${newStock}`);
      
      return {
        id: item.itemId,
        newStock: Math.max(0, newStock)
      };
    }).filter(update => update !== null);
    
    if (stockUpdates.length === 0) {
      console.warn('⚠️ No stock updates to process');
      return;
    }
    
    console.log('Stock updates to process:', stockUpdates);
    
    // Update stocks using the corrected API function
    for (const update of stockUpdates) {
      try {
        console.log(`Processing update for item ${update.id}...`);
        const updatedItem = await updateItemStock(update.id, update.newStock);
        console.log(`✅ Stock updated for item ${update.id}:`, updatedItem);
      } catch (itemError) {
        console.error(`❌ Failed to update stock for item ${update.id}:`, itemError);
        // Continue with other items even if one fails
      }
    }
    
    console.log('✅ Stock update process completed');
    
    // Refresh items data
    try {
      const updatedItems = await getItems();
      setItems(updatedItems);
      console.log('✅ Items list refreshed');
    } catch (refreshError) {
      console.warn('⚠️ Could not refresh items list:', refreshError);
      // Non-critical error
    }
    
  } catch (stockError) {
    console.error('❌ Stock update process failed:', stockError);
    throw new Error(`Stock update failed: ${stockError.message}`);
  }
};

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Create New Invoice
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
              Invoice #{generateInvoiceNumber()} • {sales.length + 1} invoices in system
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            &times;
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Customer Details Section */}
          <div style={{ 
            marginBottom: '32px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Customer Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Customer Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Phone Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }}>
                    📱
                  </span>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: `1px solid ${customerPhone && !validatePhoneNumber(customerPhone) ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                {customerPhone && !validatePhoneNumber(customerPhone) ? (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                    Please enter a valid 10-digit phone number
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Example: 9876543210
                  </p>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              {/* Payment Method */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Payment Status *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partially Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Customer Status Indicator */}
            {customerName.trim() && customerPhone.trim() && (
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                backgroundColor: customers.find(c => c.phone === customerPhone.trim()) ? '#f0fdf4' : '#eff6ff',
                border: customers.find(c => c.phone === customerPhone.trim()) ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {customers.find(c => c.phone === customerPhone.trim()) ? (
                  <>
                    <span style={{ color: '#059669', fontSize: '18px' }}>✓</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
                        Existing Customer
                      </div>
                      <div style={{ fontSize: '12px', color: '#047857' }}>
                        Customer found in database
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ color: '#3b82f6', fontSize: '18px' }}>+</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                        New Customer
                      </div>
                      <div style={{ fontSize: '12px', color: '#1d4ed8' }}>
                        New customer will be created
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Order Items *
                </label>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  Select items and quantities for this invoice
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                <span style={{ fontSize: '18px' }}>+</span>
                Add Item
              </button>
            </div>

            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Available Stock</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Unit Price</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => {
                    const selectedItem = items.find(it => it.id == item.itemId);
                    const availableStock = item.availableStock !== null ? item.availableStock : '--';
                    const isOutOfStock = item.availableStock === 0;
                    const isInsufficient = item.availableStock !== null && item.quantity > item.availableStock;
                    const hasSelectedItem = !!item.itemId;
                    
                    return (
                      <tr key={index} style={{ 
                        borderTop: '1px solid #e5e7eb',
                        backgroundColor: hasSelectedItem && isOutOfStock ? '#fef2f2' : 
                                       hasSelectedItem && isInsufficient ? '#fffbeb' : 
                                       'transparent'
                      }}>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={item.itemId}
                            onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: `1px solid ${hasSelectedItem && isOutOfStock ? '#ef4444' : '#d1d5db'}`,
                              borderRadius: '6px',
                              fontSize: '14px',
                              backgroundColor: hasSelectedItem && isOutOfStock ? '#fef2f2' : 'white'
                            }}
                          >
                            <option value="">Select item</option>
                            {items.map(it => (
                              <option key={it.id} value={it.id} disabled={it.stock === 0}>
                                {it.name} {it.stock === 0 ? '(Out of Stock)' : `(Stock: ${it.stock})`} - ₹{it.price}
                              </option>
                            ))}
                          </select>
                          {hasSelectedItem && isOutOfStock && (
                            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                              ⚠️ This item is out of stock
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: hasSelectedItem && isOutOfStock ? '#ef4444' : '#6b7280' }}>
                          {availableStock}
                          {hasSelectedItem && selectedItem?.stock !== undefined && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              Reorder at: {selectedItem.reorder_threshold || 5}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            min="1"
                            max={item.availableStock !== null ? item.availableStock : ''}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            required
                            style={{
                              width: '100px',
                              padding: '8px',
                              border: `1px solid ${hasSelectedItem && isInsufficient ? '#f59e0b' : '#d1d5db'}`,
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                            disabled={hasSelectedItem && isOutOfStock}
                          />
                          {hasSelectedItem && isInsufficient && (
                            <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                              Max: {item.availableStock}
                            </div>
                          )}
                          {hasSelectedItem && isOutOfStock && (
                            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                              Cannot order out-of-stock item
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#111827' }}>
                          ₹{(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {invoiceItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
              placeholder="Any additional notes about this invoice (e.g., special instructions, delivery address, etc.)"
            />
          </div>

          {/* Summary Section */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Invoice Summary
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  Total Amount
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Customer: {customerName || '--'} • 
                  Payment: {paymentMethod} ({paymentStatus}) • 
                  Items: {invoiceItems.filter(item => item.itemId).length} • 
                  Quantity: {invoiceItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                  ₹{calculateTotal().toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Invoice #{generateInvoiceNumber()}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !customerName.trim() || !customerPhone.trim() || !validatePhoneNumber(customerPhone) || invoiceItems.some(item => !item.itemId)}
              style={{
                padding: '10px 24px',
                background: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: loading || !customerName.trim() || !customerPhone.trim() || !validatePhoneNumber(customerPhone) || invoiceItems.some(item => !item.itemId) ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading && !e.target.disabled) e.target.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                if (!loading && !e.target.disabled) e.target.style.backgroundColor = '#10b981';
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating Invoice...
                </>
              ) : (
                'Create Invoice'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}