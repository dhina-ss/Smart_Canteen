import React, { useEffect, useState } from 'react';
import { getItems, deleteProduct } from '../services/api';
import SimpleTable from '../components/SimpleTable';
import ProductModal from '../components/ProductModal';

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductCreated = (newProduct) => {
    if (selectedProduct) {
      // Update existing product
      setItems(items.map(p => 
        p.id === newProduct.id ? newProduct : p
      ));
    } else {
      // Add new product
      setItems([newProduct, ...items]);
    }
    setSelectedProduct(null);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        // Remove from state
        setItems(items.filter(p => p.id !== productId));
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const columns = [
    { 
      key: 'name', 
      title: 'Name',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}, #${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {r.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div style={{ fontWeight: '500', color: '#111827' }}>{r.name}</div>
            {r.sku && <div style={{ fontSize: '12px', color: '#6b7280' }}>{r.sku}</div>}
          </div>
        </div>
      )
    },
    { 
      key: 'price', 
      title: 'Price', 
      render: (r) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>
          ₹{Number(r.price || 0).toFixed(2)}
        </div>
      )
    },
    { 
      key: 'stock', 
      title: 'Stock',
      render: (r) => {
        const stock = r.stock || 0;
        const threshold = r.reorder_threshold || 5;
        const isLow = stock <= threshold;
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontWeight: '600',
              color: isLow ? '#ef4444' : stock <= threshold * 2 ? '#f59e0b' : '#10b981'
            }}>
              {stock}
            </span>
            {isLow && (
              <span style={{
                padding: '2px 6px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                Low
              </span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'reorder_threshold', 
      title: 'Reorder At' 
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleEdit(r)}
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
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            style={{
              padding: '6px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Delete
          </button>
        </div>
      )
    },
  ];

  return (
    <div style={{padding: '10px 20px'}}>
      {/* Header with Add Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Products
          </h2>
          <p style={{ color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
            Manage your inventory items
          </p>
        </div>
        <button
          onClick={handleAddNew}
          style={{
            background: '#10b981',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          Add Product
        </button>
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
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Products</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{items.length}</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>In Stock</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
            {items.filter(item => (item.stock || 0) > 0).length}
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Low Stock</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef4444' }}>
            {items.filter(item => (item.stock || 0) <= (item.reorder_threshold || 5)).length}
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Out of Stock</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
            {items.filter(item => (item.stock || 0) === 0).length}
          </div>
        </div>
      </div>

      {/* Products Table */}
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
          <p style={{ color: '#6b7280' }}>Loading products...</p>
        </div>
      ) : items.length === 0 ? (
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
            <span style={{ fontSize: '32px', color: '#9ca3af' }}>📦</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            No products yet
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Get started by adding your first product
          </p>
          <button
            onClick={handleAddNew}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            Add Your First Product
          </button>
        </div>
      ) : (
        <SimpleTable 
          columns={columns} 
          data={items}
          title={`Products (${items.length})`}
        />
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
        }}
        productToEdit={selectedProduct}
        onProductCreated={handleProductCreated}
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