import React, { useEffect, useState } from 'react';
import { getSales } from '../services/api';
import SimpleTable from '../components/SimpleTable';

export default function Invoices() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await getSales();
      // Sort by date, newest first
      const sortedData = data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setSales(sortedData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleViewInvoice = (invoice) => {
    console.log('View invoice:', invoice);
    // You can open a modal to show invoice details here
    alert(`Invoice Details:\nInvoice: ${invoice.invoice_number}\nCustomer: ${invoice.customer_detail?.name || 'Unknown'}\nTotal: ₹${invoice.total_amount}`);
  };

  const columns = [
    { 
      key: 'invoice_number', 
      title: 'Invoice',
      render: (r) => (
        <div>
          <div style={{ fontWeight: '600', color: '#111827' }}>{r.invoice_number}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Items: {r.items?.length || 0}
          </div>
        </div>
      )
    },
    { 
      key: 'created_at', 
      title: 'Date', 
      render: (r) => (
        <div>
          <div>{new Date(r.created_at).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            {r.customer_detail?.name || 'Walk-in Customer'}
          </div>
          {r.customer_detail?.phone && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              📱 {r.customer_detail.phone}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'items', 
      title: 'Items', 
      render: (r) => (
        <div style={{ maxWidth: '200px' }}>
          {r.items?.slice(0, 3).map((item, index) => (
            <div key={index} style={{ 
              fontSize: '12px', 
              color: '#4b5563',
              padding: '2px 0',
              borderBottom: index < Math.min(r.items.length - 1, 2) ? '1px solid #f3f4f6' : 'none'
            }}>
              {item.item_detail?.name || 'Item'} × {item.quantity}
            </div>
          ))}
          {r.items?.length > 3 && (
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              +{r.items.length - 3} more items
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'total_amount', 
      title: 'Total', 
      render: (r) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>
          ₹{Number(r.total_amount || 0).toFixed(2)}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (r) => (
        <button
          onClick={() => handleViewInvoice(r)}
          style={{
            padding: '6px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          View Details
        </button>
      )
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Invoices
          </h2>
          <p style={{ color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
            All customer invoices and billing records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
          <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px' }}>
            Total: {sales.length}
          </div>
          <div style={{ padding: '8px 12px', background: '#f0fdf4', color: '#065f46', borderRadius: '6px' }}>
            ₹{sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Invoice Table */}
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
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading invoices...</p>
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
            <span style={{ fontSize: '32px', color: '#9ca3af' }}>🧾</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            No invoices yet
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Create your first invoice from the Dashboard
          </p>
        </div>
      ) : (
        <SimpleTable 
          columns={columns} 
          data={sales}
          title="All Invoices"
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