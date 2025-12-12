import React, { useEffect, useState } from 'react';
import { getSales, getItems, getMonthlySummary, getTopItems, getCustomers } from '../services/api';
import InvoiceModal from '../components/InvoiceModal';

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // Add customers state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, filter]);

  const loadData = async () => {
    setLoading(true);
    console.log('🔄 Loading dashboard data...');
    
    try {
      const [salesData, itemsData, monthlyData, topItemsData, customersData] = await Promise.all([
        getSales(),
        getItems(),
        getMonthlySummary(),
        getTopItems(),
        getCustomers() // Add customers to the Promise.all
      ]);
      
      // Filter sales based on timeframe
      const filteredSales = filterSalesByTime(salesData, filter);
      setSales(filteredSales);
      
      setItems(itemsData);
      setMonthly(monthlyData);
      setTopItems(topItemsData);
      setAllCustomers(customersData);
      
      console.log('✅ Dashboard data loaded successfully:', {
        sales: filteredSales.length,
        items: itemsData.length,
        customers: customersData.length
      });
    } catch (error) {
      console.error('❌ Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSalesByTime = (data, timeframe) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    return data.filter(sale => {
      const saleDate = new Date(sale.created_at);
      switch (timeframe) {
        case 'today':
          return saleDate >= today;
        case 'week':
          return saleDate >= weekAgo;
        case 'month':
          return saleDate >= monthAgo;
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const handleInvoiceCreated = (newInvoice) => {
    console.log('✅ New invoice created, refreshing dashboard...', newInvoice);
    
    // Show immediate success message
    alert(`✅ Invoice ${newInvoice.invoice_number} created successfully!`);
    
    // Immediately update local state for instant UI update
    setSales(prevSales => {
      // Avoid duplicates
      const exists = prevSales.some(sale => sale.id === newInvoice.id);
      if (!exists) {
        return [newInvoice, ...prevSales];
      }
      return prevSales;
    });
    
    // Update customers count if it's a new customer
    if (newInvoice.customer_detail) {
      setAllCustomers(prevCustomers => {
        const exists = prevCustomers.some(customer => customer.id === newInvoice.customer);
        if (!exists) {
          return [...prevCustomers, newInvoice.customer_detail];
        }
        return prevCustomers;
      });
    }
    
    // Force refresh from server after a short delay
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 500);
    
    // Close modal
    setShowInvoiceModal(false);
  };

  // Calculate statistics with better accuracy
  const calculateStats = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Count unique customers from ALL customers, not just from sales
    const uniqueCustomers = allCustomers.length;
    
    // Total items sold from filtered sales
    const itemsSold = sales.reduce((sum, sale) => 
      sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0);
    
    return { totalSales, totalRevenue, avgSale, uniqueCustomers, itemsSold };
  };

  const stats = calculateStats();
  const lowStock = items.filter(it => it.stock <= it.reorder_threshold);

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Dashboard Overview
          </h2>
          <p style={{ color: '#6b7280', marginTop: '8px', marginBottom: 0, fontSize: '15px' }}>
            {loading ? 'Updating data...' : 'Real-time sales and inventory insights'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Time Filter */}
          <div style={{ display: 'flex', gap: '8px', background: '#f3f4f6', padding: '6px', borderRadius: '8px' }}>
            {['all', 'today', 'week', 'month'].map((time) => (
              <button
                key={time}
                onClick={() => setFilter(time)}
                style={{
                  padding: '8px 16px',
                  background: filter === time ? 'white' : 'transparent',
                  color: filter === time ? '#111827' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: filter === time ? '600' : '500',
                  textTransform: 'capitalize',
                  boxShadow: filter === time ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
                disabled={loading}
              >
                {time === 'all' ? 'All Time' : time}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button 
            onClick={() => {
              setRefreshTrigger(prev => prev + 1);
              console.log('🔄 Manual refresh triggered');
            }}
            disabled={loading}
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#2563eb')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#3b82f6')}
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
                Refreshing...
              </>
            ) : (
              <>
                <span style={{ fontSize: '18px' }}>↻</span>
                Refresh
              </>
            )}
          </button>
          
          {/* Create Invoice Button */}
          <button 
            onClick={() => setShowInvoiceModal(true)}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => e.target.style.background = '#059669'}
            onMouseLeave={(e) => e.target.style.background = '#10b981'}
          >
            <span style={{ fontSize: '20px', fontWeight: '700' }}>+</span>
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards - 4 Cards Only */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {/* Total Sales Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          borderLeft: '6px solid #3b82f6',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              📊
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Total Sales</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                {stats.totalSales}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}</span>
            <span style={{ 
              color: '#10b981', 
              fontWeight: '600',
              fontSize: '12px',
              background: '#d1fae5',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {loading ? 'Updating...' : 'Live'}
            </span>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          borderLeft: '6px solid #10b981',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              💰
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                ₹{stats.totalRevenue.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Average: ₹{stats.avgSale.toFixed(2)}</span>
            <span style={{ 
              color: stats.totalRevenue > 0 ? '#10b981' : '#6b7280', 
              fontWeight: '600',
              fontSize: '12px',
              background: stats.totalRevenue > 0 ? '#d1fae5' : '#f3f4f6',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {stats.totalRevenue > 0 ? 'Active' : 'No Sales'}
            </span>
          </div>
        </div>

        {/* Customers Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          borderLeft: '6px solid #8b5cf6',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Customers</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                {stats.uniqueCustomers}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6'
          }}>
            Total registered customers
            {allCustomers.length > 0 && (
              <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px' }}>
                Last added: {allCustomers[allCustomers.length - 1]?.name || 'N/A'}
              </div>
            )}
          </div>
        </div>

        {/* Items Sold Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          borderLeft: '6px solid #f59e0b',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Items Sold</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                {stats.itemsSold}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6'
          }}>
            Total units sold {filter !== 'all' ? `(${filter})` : ''}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Recent Transactions
          </h3>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
          >
            <span style={{ fontSize: '18px' }}>↻</span>
            Refresh
          </button>
        </div>

        {sales.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#f3f4f6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '32px', color: '#9ca3af' }}>💰</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              No sales recorded {filter !== 'all' ? `for ${filter}` : 'yet'}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              {filter !== 'all' 
                ? `Try selecting "All Time" or create new sales`
                : 'Create your first sale to get started'}
            </p>
            <button 
              onClick={() => setShowInvoiceModal(true)}
              style={{
                background: '#10b981',
                color: 'white',
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              <span style={{ fontSize: '20px' }}>+</span>
              Create First Sale
            </button>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              background: '#f9fafb',
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {['Invoice', 'Customer', 'Date', 'Items', 'Status', 'Amount'].map((header) => (
                <div key={header} style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'left'
                }}>
                  {header}
                </div>
              ))}
            </div>
            
            {sales.slice(0, 8).map((sale, index) => (
              <div 
                key={sale.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  padding: '16px 24px',
                  borderBottom: index < Math.min(7, sales.length - 1) ? '1px solid #f3f4f6' : 'none',
                  background: index % 2 === 0 ? 'white' : '#f9fafb',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb'}
              >
                {/* Invoice */}
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>
                    {sale.invoice_number}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    ID: {sale.id}
                  </div>
                </div>
                
                {/* Customer */}
                <div>
                  <div style={{ fontWeight: '500', color: '#111827' }}>
                    {sale.customer_detail?.name || 'Walk-in'}
                  </div>
                  {sale.customer_detail?.phone && (
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {sale.customer_detail.phone}
                    </div>
                  )}
                </div>
                
                {/* Date */}
                <div>
                  <div>{new Date(sale.created_at).toLocaleDateString('en-IN')}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(sale.created_at).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                {/* Items */}
                <div>
                  <div style={{ fontWeight: '500', color: '#111827' }}>
                    {sale.items?.length || 0} items
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} units
                  </div>
                </div>
                
                {/* Status */}
                <div>
                  <span style={{
                    padding: '4px 10px',
                    background: '#d1fae5',
                    color: '#065f46',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Completed
                  </span>
                </div>
                
                {/* Amount */}
                <div>
                  <div style={{ fontWeight: '700', color: '#111827', fontSize: '16px' }}>
                    ₹{Number(sale.total_amount || 0).toFixed(2)}
                  </div>
                  {sale.items?.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Avg: ₹{(Number(sale.total_amount || 0) / (sale.items?.length || 1)).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Stock and Top Items Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Low Stock */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Low Stock Alert
            </h3>
            <span style={{
              padding: '4px 12px',
              background: lowStock.length > 0 ? '#fef3c7' : '#d1fae5',
              color: lowStock.length > 0 ? '#92400e' : '#065f46',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {lowStock.length} items
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lowStock.slice(0, 5).map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: item.stock === 0 ? '#fef2f2' : '#fffbeb',
                borderRadius: '8px',
                border: `1px solid ${item.stock === 0 ? '#fecaca' : '#fde68a'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: item.stock === 0 ? '#fee2e2' : '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.stock === 0 ? '#dc2626' : '#d97706',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    {item.stock === 0 ? '!' : '⚠️'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Reorder at: {item.reorder_threshold}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontWeight: '600',
                  color: item.stock === 0 ? '#dc2626' : '#ea580c'
                }}>
                  {item.stock} left
                </span>
              </div>
            ))}
            
            {lowStock.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                ✅ All items are sufficiently stocked
              </div>
            )}
            
            {lowStock.length > 5 && (
              <button 
                onClick={() => window.location.href = '/products'}
                style={{
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                View All {lowStock.length} Items →
              </button>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Top Selling Items
            </h3>
            <span style={{
              padding: '4px 12px',
              background: '#f0f9ff',
              color: '#0369a1',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              Best Sellers
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topItems.slice(0, 5).map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: index === 0 ? '#fef3c7' : 
                               index === 1 ? '#f3f4f6' : 
                               index === 2 ? '#ffedd5' : '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: index === 0 ? '#92400e' : 
                           index === 1 ? '#374151' : 
                           index === 2 ? '#9a3412' : '#0369a1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: '#111827' }}>
                      {item['items__item__name'] || item.item_name || `Item ${index + 1}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {item.qty || item.quantity || 0} sold
                    </div>
                  </div>
                </div>
                <span style={{ fontWeight: '600', color: '#111827' }}>
                  ₹{((item.qty || item.quantity || 0) * 100).toFixed(2)}
                </span>
              </div>
            ))}
            
            {topItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                No sales data available
              </div>
            )}
          </div>
        </div>
      </div>

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}