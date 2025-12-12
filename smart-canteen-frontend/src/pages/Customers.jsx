import React, { useEffect, useState } from 'react';
import { getCustomers, deleteCustomer } from '../services/api';
import SimpleTable from '../components/SimpleTable';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      setError('');
      console.log('✅ Customers loaded:', data.length);
      
      // Log company names for debugging
      data.forEach((customer, index) => {
        console.log(`Customer ${index + 1}:`, {
          name: customer.name,
          company: customer.company,
          phone: customer.phone
        });
      });
    } catch (err) {
      console.error('❌ Failed to load customers:', err);
      setError('Failed to load customers. Please check backend connection.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 Customers component mounted');
    loadCustomers();
    
    // Listen for invoice creation events
    const handleInvoiceCreated = () => {
      console.log('🎯 invoiceCreated event received! Refreshing customers...');
      loadCustomers();
    };
    
    // Also listen for a backup event
    const handleRefreshCustomers = () => {
      console.log('🔄 refreshCustomers event received!');
      loadCustomers();
    };
    
    // Add event listeners
    window.addEventListener('invoiceCreated', handleInvoiceCreated);
    window.addEventListener('refreshCustomers', handleRefreshCustomers);
    
    // Debug: log all events
    const debugAllEvents = (event) => {
      if (event.type.includes('invoice') || event.type.includes('refresh')) {
        console.log('📡 Event captured:', event.type, event.detail || 'no details');
      }
    };
    
    window.addEventListener('invoiceCreated', debugAllEvents);
    window.addEventListener('refreshCustomers', debugAllEvents);
    
    // Cleanup
    return () => {
      window.removeEventListener('invoiceCreated', handleInvoiceCreated);
      window.removeEventListener('refreshCustomers', handleRefreshCustomers);
      window.removeEventListener('invoiceCreated', debugAllEvents);
      window.removeEventListener('refreshCustomers', debugAllEvents);
    };
  }, []);

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCustomer(customerId);
      setCustomers(customers.filter(customer => customer.id !== customerId));
      alert('Customer deleted successfully!');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      alert('Failed to delete customer. Please try again.');
    }
  };

  // Add S.No and format data for the table
  const tableData = customers.map((customer, index) => ({
    ...customer,
    sNo: index + 1,
    company: customer.company || customer.company_name || '—', // Check both field names
  }));

  const columns = [
    { key: 'sNo', title: 'S.No', width: '80px', align: 'center' },
    { key: 'name', title: 'Name' },
    { key: 'phone', title: 'Phone' },
    { key: 'company', title: 'Company Name' },
    { 
      key: 'actions', 
      title: 'Actions',
      render: (customer) => (
        <button
          onClick={() => handleDelete(customer.id)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          Delete
        </button>
      )
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
          Customers
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Total: {customers.length} customers
          </span>
          <button
            onClick={() => {
              console.log('Manual refresh clicked');
              loadCustomers();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            <span>↻</span>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: '20px',
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

      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: '24px',
            height: '24px',
            border: '3px solid rgba(107, 114, 128, 0.3)',
            borderTopColor: '#6b7280',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '12px'
          }} />
          Loading customers...
        </div>
      ) : (
        <>
          {customers.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                No Customers Found
              </div>
              <div style={{ fontSize: '14px' }}>
                Customers will appear here once they are added through invoices.
              </div>
              <button
                onClick={loadCustomers}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Refresh Now
              </button>
            </div>
          ) : (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <SimpleTable 
                columns={columns} 
                data={tableData}
                emptyMessage="No customers found"
              />
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}