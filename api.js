// ============ API Client ============
const API_BASE_URL = 'http://localhost:3000/api';

// دالة مساعدة للطلبات
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('خطأ في الاتصال بالسيرفر:', error);
        showAlert('error', '❌ خطأ في الاتصال بالسيرفر. تأكد من تشغيل السيرفر.');
        return { success: false, error: error.message };
    }
}

// ============ المنتجات API ============

async function loadProductsFromAPI() {
    const result = await apiRequest('/products');
    if (result.success) {
        products = result.products;
        return products;
    }
    return [];
}

async function saveProductToAPI(product) {
    const result = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(product)
    });
    return result;
}

async function updateProductInAPI(productId, updates) {
    const result = await apiRequest(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
    return result;
}

async function deleteProductFromAPI(productId) {
    const result = await apiRequest(`/products/${productId}`, {
        method: 'DELETE'
    });
    return result;
}

// ============ المبيعات API ============

async function loadSalesFromAPI() {
    const result = await apiRequest('/sales');
    if (result.success) {
        sales = result.sales;
        return sales;
    }
    return [];
}

async function saveSaleToAPI(sale) {
    const result = await apiRequest('/sales', {
        method: 'POST',
        body: JSON.stringify(sale)
    });
    return result;
}

async function deleteSaleFromAPI(saleId) {
    const result = await apiRequest(`/sales/${saleId}`, {
        method: 'DELETE'
    });
    return result;
}

// ============ الإعدادات API ============

async function loadSettingsFromAPI() {
    const result = await apiRequest('/settings');
    if (result.success) {
        return result.settings;
    }
    return {};
}

async function saveSettingsToAPI(settings) {
    const result = await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
    });
    return result;
}
