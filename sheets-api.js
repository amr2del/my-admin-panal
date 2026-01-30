// ============ Google Apps Script API ============
// رابط Web App من Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyi7zcaMB-shC4n8VkV0jstpYczad5E9k2CSJyJTq0lZ5n8-K0h5Xp4jYgVdayvSdPdfA/exec';

// Cache للطلبات لتقليل الاستدعاءات
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30 ثانية

// تصدير الوظائف للاستخدام العالمي
window.sheetsAPI = window.sheetsAPI || {};

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
    return null; // فشل الاتصال
}

async function saveProductToAPI(product) {
    // 1️⃣ حفظ في SQLite أولاً
    if (!product.id) product.id = Date.now().toString();
    
    if (typeof window.db !== 'undefined' && window.db.addProduct) {
        try {
            await window.db.addProduct(product);
            console.log('✅ تم حفظ المنتج في SQLite');
        } catch (err) {
            console.error('❌ فشل حفظ المنتج:', err);
        }
    }
    
    // 2️⃣ رفع لـ Google Sheets (backup)
    clearCache('getProducts');
    appsScriptRequest('addProduct', product).then(result => {
        if (result.success) console.log('☁️ تم رفع المنتج لـ Google Sheets');
    }).catch(err => console.warn('⚠️ فشل رفع المنتج:', err));
    
    return { success: true, product };
}

async function updateProductInAPI(productId, updates) {
    // 1️⃣ تحديث في SQLite أولاً
    if (typeof window.db !== 'undefined' && window.db.updateProduct) {
        try {
            await window.db.updateProduct(productId, updates);
            console.log('✅ تم تحديث المنتج في SQLite');
        } catch (err) {
            console.error('❌ فشل تحديث المنتج:', err);
        }
    }
    
    // 2️⃣ رفع لـ Google Sheets (backup)
    clearCache('getProducts');
    appsScriptRequest('updateProduct', {
        id: productId,
        updates: updates
    }).then(result => {
        if (result.success) console.log('☁️ تم تحديث المنتج في Google Sheets');
    }).catch(err => console.warn('⚠️ فشل تحديث المنتج في السحابة:', err));
    
    return { success: true };
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
    return null; // فشل الاتصال
}

async function saveSaleToAPI(sale) {
    // 1️⃣ حفظ في SQLite أولاً (أساسي)
    if (!sale.id) sale.id = Date.now();
    
    if (typeof window.db !== 'undefined' && window.db.addSale) {
        try {
            await window.db.addSale(sale);
            console.log('✅ تم حفظ البيع في SQLite');
        } catch (err) {
            console.error('❌ فشل حفظ البيع في SQLite:', err);
            return { success: false, error: 'فشل الحفظ المحلي' };
        }
    }
    
    // 2️⃣ رفع لـ Google Sheets في الخلفية (backup)
    clearCache('getSales');
    appsScriptRequest('addSale', sale).then(result => {
        if (result.success) {
            console.log('☁️ تم رفع البيع لـ Google Sheets');
        } else {
            console.warn('⚠️ فشل رفع البيع لـ Google Sheets - المحفوظ محلياً آمن');
        }
    }).catch(err => {
        console.warn('⚠️ خطأ في رفع البيع:', err);
    });
    
    return { success: true, sale: sale };
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
    return null; // فشل الاتصال
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
    return null; // فشل الاتصال - ارجع null (ليس [])
}

async function saveDataToAPI(dataType, data) {
    const result = await appsScriptRequest(`save${capitalizeFirstLetter(dataType)}`, data);
    return result;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// ============ وظائف الرفع الجماعي (Batch Upload) ============

async function uploadAllProducts(products) {
    console.log(`📤 رفع ${products.length} منتج للسحابة...`);
    const result = await appsScriptRequest('uploadAllProducts', { products });
    if (result && result.success) {
        console.log('✅ تم رفع المنتجات بنجاح');
    }
    return result;
}

async function uploadAllSales(sales) {
    console.log(`📤 رفع ${sales.length} عملية بيع للسحابة...`);
    const result = await appsScriptRequest('uploadAllSales', { sales });
    if (result && result.success) {
        console.log('✅ تم رفع المبيعات بنجاح');
    }
    return result;
}

async function uploadAllExpenses(expenses) {
    console.log(`📤 رفع ${expenses.length} مصروف للسحابة...`);
    const result = await appsScriptRequest('saveExpenses', expenses);
    if (result && result.success) {
        console.log('✅ تم رفع المصروفات بنجاح');
    }
    return result;
}

// تسجيل الوظائف في window.sheetsAPI
window.sheetsAPI.uploadAllProducts = uploadAllProducts;
window.sheetsAPI.uploadAllSales = uploadAllSales;
window.sheetsAPI.uploadAllExpenses = uploadAllExpenses;

