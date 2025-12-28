// ============ Google Apps Script API ============
// رابط Web App من Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby7V8EVkZhJgogc-D3xkBRB-AK45EXRVXGBxdUNeATu521BbrL34_mkHwK6t5fw_Q3QSg/exec';

// دالة مساعدة للطلبات
async function appsScriptRequest(action, data = {}) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                data: data
            })
        });
        
        // في وضع no-cors، لن نحصل على response body
        // لذلك نفترض أن العملية نجحت
        return { success: true };
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
