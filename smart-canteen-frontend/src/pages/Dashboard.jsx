import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api'; 
import InvoiceModal from '../components/InvoiceModal';

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    console.log('🏁 Dashboard component mounted');
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading dashboard stats from API...');
      
      const stats = await getDashboardStats();
      console.log('📊 API Response:', stats);
      console.log('📊 Data types:', {
        total_sales: typeof stats.total_sales,
        total_revenue: typeof stats.total_revenue,
        total_customers: typeof stats.total_customers,
        total_items_sold: typeof stats.total_items_sold
      });
      
      setDashboardStats(stats);
      
    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to load dashboard statistics. Please try again.');
      
      // Set default stats on error
      setDashboardStats({
        total_sales: 0,
        total_revenue: 0,
        total_customers: 0,
        total_items_sold: 0,
        avg_sale_value: 0,
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceCreated = () => {
    console.log('✅ Invoice created, refreshing stats...');
    // Refresh stats after a short delay
    setTimeout(() => {
      loadDashboardStats();
    }, 1000);
    setShowInvoiceModal(false);
  };

  // Debug: Log when dashboardStats changes
  useEffect(() => {
    if (dashboardStats) {
      console.log('🔄 dashboardStats state updated:', dashboardStats);
    }
  }, [dashboardStats]);

  // If still loading
  if (loading && !dashboardStats) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '6px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Loading Dashboard</h2>
          <p style={{ opacity: 0.8 }}>Fetching your sales data...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If error
  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>
            Error Loading Dashboard
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={loadDashboardStats}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have stats data
  const stats = dashboardStats || {
    total_sales: 0,
    total_revenue: 0,
    total_customers: 0,
    total_items_sold: 0,
    avg_sale_value: 0,
    last_updated: new Date().toISOString()
  };

  console.log('🎯 Rendering with stats:', stats);

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
            {loading ? 'Loading...' : `Last updated: ${new Date(stats.last_updated).toLocaleString()}`}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => loadDashboardStats()}
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
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
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
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: '700' }}>+</span>
            New Sale
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
          borderLeft: '6px solid #3b82f6'
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
                {stats.total_sales}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6'
          }}>
            All invoices created
          </div>
        </div>

        {/* Total Revenue Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          borderLeft: '6px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              display: '-flex',
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
                ₹{parseFloat(stats.total_revenue || 0).toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6'
          }}>
            Average: ₹{parseFloat(stats.avg_sale_value || 0).toFixed(2)}
          </div>
        </div>

        {/* Customers Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          borderLeft: '6px solid #8b5cf6'
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
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Total Customers</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                {stats.total_customers}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6'
          }}>
            Registered in system
          </div>
        </div>

        {/* Items Sold Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          borderLeft: '6px solid #f59e0b'
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
                {stats.total_items_sold}
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            paddingTop: '12px', 
            borderTop: '1px solid #f3f4f6'
          }}>
            Total units sold
          </div>
        </div>
      </div>

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  );
}