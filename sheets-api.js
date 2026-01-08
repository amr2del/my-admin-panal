// ============ Google Apps Script API ============
// رابط Web App من Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyi7zcaMB-shC4n8VkV0jstpYczad5E9k2CSJyJTq0lZ5n8-K0h5Xp4jYgVdayvSdPdfA/exec';

// Cache للطلبات لتقليل الاستدعاءات
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30 ثانية

// دالة مساعدة للطلبات
async function appsScriptRequest(action, data = {}) {
    try {
        // التحقق من الـ cache أولاً للعمليات القراءة فقط
        const cacheKey = `${action}_${JSON.stringify(data)}`;
        if (action.startsWith('get') && requestCache.has(cacheKey)) {
            const cached = requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                console.log(`✅ استخدام cache لـ ${action}`);
                return cached.data;
            }
        }
        
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
        
        // حفظ في الـ cache للعمليات القراءة
        if (action.startsWith('get')) {
            requestCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }
        
        return result;
    } catch (error) {
        console.error('خطأ في الاتصال بـ Google Sheets:', error);
        return { success: false, error: error.message };
    }
}

// مسح الـ cache عند التحديث
function clearCache(action = null) {
    if (action) {
        // مسح cache محدد
        for (const key of requestCache.keys()) {
            if (key.startsWith(action)) {
                requestCache.delete(key);
            }
        }
    } else {
        // مسح كل الـ cache
        requestCache.clear();
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
    clearCache('getProducts');
    const result = await appsScriptRequest('addProduct', product);
    return result;
}

async function updateProductInAPI(productId, updates) {
    clearCache('getProducts');
    const result = await appsScriptRequest('updateProduct', {
        id: productId,
        updates: updates
    });
    return result;
}

async function deleteProductFromAPI(productId) {
    clearCache('getProducts');
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
    clearCache('getSales');
    const result = await appsScriptRequest('addSale', sale);
    return result;
}

async function deleteSaleFromAPI(saleId) {
    clearCache('getSales');
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
