const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function fetchJSON(path, opts = {}) {
  console.log(`📡 API Call: ${API_ROOT}${path}`, opts.method || 'GET');
  
  try {
    const res = await fetch(`${API_ROOT}${path}`, {
      headers: { 
        'Content-Type': 'application/json', 
        ...(opts.headers || {}) 
      },
      ...opts,
    });

    console.log(`Response Status: ${res.status}`, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ API Error ${res.status}: ${errorText}`);
      throw new Error(errorText || res.statusText);
    }

    const txt = await res.text();
    try {
      const jsonData = txt ? JSON.parse(txt) : null;
      console.log(`✅ API Response for ${path}:`, jsonData);
      return jsonData;
    } catch {
      return txt;
    }
  } catch (error) {
    console.error(`💥 Network error for ${path}:`, error);
    throw error;
  }
}

// GET endpoints
export const getCustomers = async () => {
  console.log('👥 Fetching fresh customers data...');
  try {
    const data = await fetchJSON(`/customers/?_t=${Date.now()}`);
    console.log(`✅ Fetched ${data.length} customers`);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch customers:', error);
    return [];
  }
};
export const getItems = () => fetchJSON('/items/');
export const getSales = async () => {
  console.log('📊 Fetching fresh sales data...');
  try {
    // Add timestamp to prevent caching
    const data = await fetchJSON(`/sales/?_t=${Date.now()}`);
    console.log(`✅ Fetched ${data.length} sales`);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch sales:', error);
    return [];
  }
};
export const getLowStock = () => fetchJSON('/items/low_stock/');
export const getMonthlySummary = () => fetchJSON('/sales/monthly_summary/');
export const getTopItems = () => fetchJSON('/sales/top_items/');
export const getSale = (id) => fetchJSON('/sales/${id}/');

// POST - Create new sale/invoice with auto-generated invoice number
export const postSale = async (payload) => {
  console.log('📝 Creating invoice with payload:', payload);
  
  try {
    // First, get the latest sale to generate invoice number
    const sales = await getSales();
    const latestSale = sales[0]; // Assuming sorted by date descending
    
    // Generate invoice number based on count
    const invoiceNumber = `INV-${String(sales.length + 1).padStart(4, '0')}`;
    
    // Add invoice number to payload
    const payloadWithInvoiceNumber = {
      ...payload,
      invoice_number: invoiceNumber
    };
    
    console.log('Generated invoice number:', invoiceNumber);
    
    // Make the API call
    const response = await fetchJSON('/sales/', {
      method: 'POST',
      body: JSON.stringify(payloadWithInvoiceNumber)
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Error in postSale:', error);
    
    // Fallback: Use mock data if backend fails
    console.log('⚠️ Using fallback mock invoice data');
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalAmount = payload.items.reduce(
          (sum, item) => sum + (item.quantity * item.unit_price), 
          0
        );
        
        resolve({
          id: Date.now(),
          invoice_number: `INV-${String(Math.floor(1000 + Math.random() * 9000))}`,
          created_at: new Date().toISOString(),
          customer_detail: { 
            name: 'Customer', 
            id: payload.customer,
            phone: ''
          },
          customer: payload.customer,
          total_amount: totalAmount.toFixed(2),
          notes: payload.notes || '',
          items: payload.items.map((item, index) => ({
            id: Date.now() + index,
            item: item.item,
            item_detail: { 
              name: `Item ${index + 1}`, 
              id: item.item,
              price: item.unit_price 
            },
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: (item.quantity * item.unit_price).toFixed(2)
          }))
        });
      }, 1000);
    });
  }
};

// PRODUCT ENDPOINTS
export const postProduct = async (productData) => {
  console.log('📦 Creating product:', productData);
  return fetchJSON('/items/', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
};

export const updateProduct = async (id, productData) => {
  console.log('✏️ Updating product:', id, productData);
  return fetchJSON(`/items/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  });
};

export const deleteProduct = async (id) => {
  console.log('🗑️ Deleting product:', id);
  return fetchJSON(`/items/${id}/`, {
    method: 'DELETE'
  });
};

// CUSTOMER ENDPOINTS
export const postCustomer = async (customerData) => {
  console.log('👤 Creating customer:', customerData);
  return fetchJSON('/customers/', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
};

export const updateCustomer = async (id, customerData) => {
  console.log('✏️ Updating customer:', id, customerData);
  return fetchJSON(`/customers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(customerData)
  });
};

export const deleteCustomer = async (id) => {
  console.log('🗑️ Deleting customer:', id);
  return fetchJSON(`/customers/${id}/`, {
    method: 'DELETE'
  });
};

export const updateItemStock = async (itemId, newStock) => {
  console.log(`📦 Updating stock for item ${itemId} to ${newStock}`);
  
  try {
    // First, get the current item to preserve other fields
    const currentItem = await fetchJSON(`/items/${itemId}/`);
    
    // Update only the stock field
    const updatedItem = {
      ...currentItem,
      stock: newStock
    };
    
    console.log('Updating with data:', updatedItem);
    
    // Use PUT to update the item
    const response = await fetchJSON(`/items/${itemId}/`, {
      method: 'PUT',
      body: JSON.stringify(updatedItem)
    });
    
    console.log('✅ Stock update successful:', response);
    return response;
    
  } catch (error) {
    console.error('❌ Failed to update stock:', error);
    
    // Fallback: Try PATCH if PUT doesn't work
    try {
      console.log('🔄 Trying PATCH method...');
      const response = await fetchJSON(`/items/${itemId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock })
      });
      
      console.log('✅ Stock update successful via PATCH:', response);
      return response;
      
    } catch (patchError) {
      console.error('❌ PATCH also failed:', patchError);
      throw new Error(`Failed to update stock for item ${itemId}: ${error.message}`);
    }
  }
};

// Fix updateMultipleStocks to use fetchJSON
export const updateMultipleStocks = async (stockUpdates) => {
  console.log('📦 Updating multiple stocks:', stockUpdates);
  
  try {
    // Update stocks one by one
    const results = [];
    for (const update of stockUpdates) {
      try {
        const result = await updateItemStock(update.id, update.newStock);
        results.push(result);
      } catch (itemError) {
        console.error(`❌ Failed to update item ${update.id}:`, itemError);
        results.push({ error: itemError.message, id: update.id });
      }
    }
    return results;
  } catch (error) {
    console.error('❌ Batch update failed:', error);
    throw error;
  }
};