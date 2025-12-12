import React, { useState, useEffect } from 'react';
import { postProduct, updateProduct } from '../services/api';

export default function ProductModal({ isOpen, onClose, onProductCreated, productToEdit }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    sku: '',
    reorder_threshold: '5'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form when productToEdit changes
  useEffect(() => {
    if (productToEdit) {
      setIsEditing(true);
      setFormData({
        name: productToEdit.name || '',
        price: productToEdit.price?.toString() || '',
        stock: productToEdit.stock?.toString() || '',
        sku: productToEdit.sku || '',
        reorder_threshold: productToEdit.reorder_threshold?.toString() || '5'
      });
    } else {
      setIsEditing(false);
      resetForm();
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }
    
    if (formData.reorder_threshold === '' || parseInt(formData.reorder_threshold) < 0) {
      newErrors.reorder_threshold = 'Reorder threshold must be 0 or greater';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku.trim(),
        reorder_threshold: parseInt(formData.reorder_threshold) || 5,
        active: true
      };
      
      console.log(`${isEditing ? 'Updating' : 'Creating'} product:`, productData);
      
      let response;
      
      if (isEditing && productToEdit) {
        // Update existing product
        response = await updateProduct(productToEdit.id, productData);
        console.log('Product updated:', response);
      } else {
        // Create new product
        response = await postProduct(productData);
        console.log('Product created:', response);
      }
      
      // Call the callback with the response data
      if (onProductCreated) {
        onProductCreated(response);
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
      
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} product:`, error);
      
      // Enhanced error handling
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || `Failed to ${isEditing ? 'update' : 'create'} product.`;
        alert(errorMessage);
        
        // Handle validation errors from server
        if (error.response.data?.errors) {
          setErrors(error.response.data.errors);
        }
      } else if (error.request) {
        // Request made but no response
        alert('Network error. Please check your connection and try again.');
      } else {
        // Something else happened
        alert(`Failed to ${isEditing ? 'update' : 'create'} product. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      stock: '',
      sku: '',
      reorder_threshold: '5'
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
              {isEditing ? 'Update product details' : 'Enter product details below'}
            </p>
          </div>
          <button
            onClick={handleClose}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Product Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Burger, Pizza, Coke"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = errors.name ? '#ef4444' : '#d1d5db'}
            />
            {errors.name && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Price and Stock - Side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Price (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}>
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 32px',
                    border: `1px solid ${errors.price ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              {errors.price && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                min="0"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.stock ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
              {errors.stock && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {errors.stock}
                </p>
              )}
            </div>
          </div>

          {/* SKU and Reorder Threshold */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                SKU (Optional)
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g., BG001, PZ001"
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

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Reorder Threshold *
              </label>
              <input
                type="number"
                name="reorder_threshold"
                value={formData.reorder_threshold}
                onChange={handleChange}
                placeholder="5"
                min="0"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.reorder_threshold ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
              {errors.reorder_threshold && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {errors.reorder_threshold}
                </p>
              )}
              <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                Alert when stock falls below this number
              </p>
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
              onClick={handleClose}
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
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: loading ? '#9ca3af' : (isEditing ? '#3b82f6' : '#10b981'),
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = isEditing ? '#2563eb' : '#059669';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = isEditing ? '#3b82f6' : '#10b981';
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
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <span style={{ fontSize: '18px' }}>{isEditing ? '✓' : '+'}</span>
                  {isEditing ? 'Update Product' : 'Add Product'}
                </>
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
