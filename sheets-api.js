// ============ Google Apps Script API ============
// رابط Web App من Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyi7zcaMB-shC4n8VkV0jstpYczad5E9k2CSJyJTq0lZ5n8-K0h5Xp4jYgVdayvSdPdfA/exec';

// دالة مساعدة للطلبات
async function appsScriptRequest(action, data = {}) {
    try {
        // استخدام GET بدل POST
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', action);
        if (Object.keys(data).length > 0) {
            url.searchParams.append('data', JSON.stringify(data));
        }
        
        const response = await fetch(url.toString(), {
            method: 'GET'
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('خطأ في الاتصال بـ Google Sheets:', error);
        showAlert('error', '❌ خطأ في الاتصال. تحقق من الإنترنت.');
        return { success: false, error: error.message };
    }
}

// ============ المنتجات API ============

async function loadProductsFromAPI() {
    const result = await appsScriptRequest('getProducts');
    if (result.success) {
        products = result.products || [];
        return products;
    }
    return [];
}

async function saveProductToAPI(product) {
    const result = await appsScriptRequest('addProduct', product);
    return result;
}

async function updateProductInAPI(productId, updates) {
    const result = await appsScriptRequest('updateProduct', {
        id: productId,
        updates: updates
    });
    return result;
}

async function deleteProductFromAPI(productId) {
    const result = await appsScriptRequest('deleteProduct', { id: productId });
    return result;
}

// ============ المبيعات API ============

async function loadSalesFromAPI() {
    const result = await appsScriptRequest('getSales');
    if (result.success) {
        sales = result.sales || [];
        return sales;
    }
    return [];
}

async function saveSaleToAPI(sale) {
    const result = await appsScriptRequest('addSale', sale);
    return result;
}

async function deleteSaleFromAPI(saleId) {
    const result = await appsScriptRequest('deleteSale', { id: saleId });
    return result;
}

// ============ الإعدادات API ============

async function loadSettingsFromAPI() {
    const result = await appsScriptRequest('getSettings');
    if (result.success) {
        return result.settings || {};
    }
    return {};
}

async function saveSettingsToAPI(settings) {
    const result = await appsScriptRequest('updateSettings', settings);
    return result;
}

// ============ المصروفات API ============

async function loadDataFromAPI(dataType) {
    const result = await appsScriptRequest(`get${capitalizeFirstLetter(dataType)}`);
    if (result.success) {
        return result[dataType] || [];
    }
    return [];
}

async function saveDataToAPI(dataType, data) {
    const result = await appsScriptRequest(`save${capitalizeFirstLetter(dataType)}`, data);
    return result;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
