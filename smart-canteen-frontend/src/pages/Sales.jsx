import React, { useEffect, useState } from 'react';
import { getSales } from '../services/api';
import SimpleTable from '../components/SimpleTable';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await getSales();
      // Filter based on selected timeframe
      const filteredData = filterSalesByTime(data, filter);
      setSales(filteredData);
    } catch (error) {
      console.error('Failed to load sales:', error);
      setSales([]);
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

  useEffect(() => {
    loadSales();
  }, [filter]);

  const calculateStats = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Count unique customers
    const uniqueCustomers = new Set(sales.map(sale => sale.customer_detail?.name).filter(Boolean)).size;
    
    return { totalSales, totalRevenue, avgSale, uniqueCustomers };
  };

  const stats = calculateStats();

  const columns = [
    { 
      key: 'invoice_number', 
      title: 'Transaction',
      render: (r) => (
        <div>
          <div style={{ fontWeight: '600', color: '#111827' }}>{r.invoice_number}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            ID: {r.id}
          </div>
        </div>
      )
    },
    { 
      key: 'created_at', 
      title: 'Date & Time', 
      render: (r) => (
        <div>
          <div>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {new Date(r.created_at).toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
        </div>
      )
    },
    { 
      key: 'customer_detail', 
      title: 'Customer', 
      render: (r) => (
        <div>
          <div style={{ fontWeight: '500', color: '#111827' }}>
            {r.customer_detail?.name || 'Walk-in'}
          </div>
          {r.customer_detail?.phone && (
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              {r.customer_detail.phone}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'items', 
      title: 'Products Sold', 
      render: (r) => (
        <div>
          <div style={{ fontWeight: '500', color: '#111827' }}>
            {r.items?.length || 0} items
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {r.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} units
          </div>
        </div>
      )
    },
    { 
      key: 'total_amount', 
      title: 'Amount', 
      render: (r) => (
        <div>
          <div style={{ fontWeight: '700', color: '#111827', fontSize: '16px' }}>
            ₹{Number(r.total_amount || 0).toFixed(2)}
          </div>
          {r.items?.length > 0 && (
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              Avg: ₹{(Number(r.total_amount || 0) / (r.items?.length || 1)).toFixed(2)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (r) => (
        <span style={{
          padding: '4px 8px',
          background: '#d1fae5',
          color: '#065f46',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          Completed
        </span>
      )
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Header with Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Sales Transactions
          </h2>
          <p style={{ color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
            Track all sales and revenue
          </p>
        </div>
        
        {/* Time Filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'today', 'week', 'month'].map((time) => (
            <button
              key={time}
              onClick={() => setFilter(time)}
              style={{
                padding: '8px 16px',
                background: filter === time ? '#3b82f6' : 'white',
                color: filter === time ? 'white' : '#374151',
                border: `1px solid ${filter === time ? '#3b82f6' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {time === 'all' ? 'All Time' : time}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Sales</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            {stats.totalSales}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            ₹{stats.totalRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            Average: ₹{stats.avgSale.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Customers</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            {stats.uniqueCustomers}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Unique customers
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Items Sold</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            {sales.reduce((sum, sale) => 
              sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Total units sold
          </div>
        </div>
      </div>

      {/* Sales Table */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '3px solid #f3f4f6',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading sales data...</p>
        </div>
      ) : sales.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
              : 'Create your first sale from the Dashboard'}
          </p>
        </div>
      ) : (
        <SimpleTable 
          columns={columns} 
          data={sales}
          title={`Sales Transactions (${sales.length})`}
        />
      )}

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}