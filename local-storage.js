// ============ نظام التخزين المحلي والمزامنة ============

// مفاتيح التخزين
const STORAGE_KEYS = {
    PRODUCTS: 'spareparts_products',
    SALES: 'spareparts_sales',
    SETTINGS: 'spareparts_settings',
    EXPENSES: 'spareparts_expenses',
    CAPITAL_TRANSACTIONS: 'spareparts_capital_transactions',
    LAST_SYNC: 'spareparts_last_sync',
    PENDING_CHANGES: 'spareparts_pending_changes',
    IS_ONLINE: 'spareparts_is_online'
};

// حالة الاتصال
let isOnline = navigator.onLine;
let isSyncing = false;

// ============ التخزين المحلي ============

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('خطأ في حفظ البيانات محلياً:', error);
        return false;
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('خطأ في قراءة البيانات محلياً:', error);
        return null;
    }
}

// ============ حفظ البيانات المحلية ============

function saveProductsLocally(products) {
    return saveToLocalStorage(STORAGE_KEYS.PRODUCTS, products);
}

function saveSalesLocally(sales) {
    return saveToLocalStorage(STORAGE_KEYS.SALES, sales);
}

function saveSettingsLocally(settings) {
    return saveToLocalStorage(STORAGE_KEYS.SETTINGS, settings);
}

function saveExpensesLocally(expenses) {
    return saveToLocalStorage(STORAGE_KEYS.EXPENSES, expenses);
}

function saveCapitalTransactionsLocally(transactions) {
    return saveToLocalStorage(STORAGE_KEYS.CAPITAL_TRANSACTIONS, transactions);
}

// ============ قراءة البيانات المحلية ============

function getProductsLocally() {
    return getFromLocalStorage(STORAGE_KEYS.PRODUCTS) || [];
}

function getSalesLocally() {
    return getFromLocalStorage(STORAGE_KEYS.SALES) || [];
}

function getSettingsLocally() {
    return getFromLocalStorage(STORAGE_KEYS.SETTINGS) || {};
}

function getExpensesLocally() {
    return getFromLocalStorage(STORAGE_KEYS.EXPENSES) || [];
}

function getCapitalTransactionsLocally() {
    return getFromLocalStorage(STORAGE_KEYS.CAPITAL_TRANSACTIONS) || [];
}

// حفظ بيانات إضافية (features)
function saveDataToLocal(key, data) {
    return saveToLocalStorage(key, data);
}

function getDataFromLocal(key, defaultValue = []) {
    return getFromLocalStorage(key) || defaultValue;
}

// ============ إدارة التغييرات المعلقة ============

function addPendingChange(type, action, data) {
    let pendingChanges = getFromLocalStorage(STORAGE_KEYS.PENDING_CHANGES) || [];
    
    pendingChanges.push({
        id: Date.now() + Math.random(),
        type: type, // 'product', 'sale', 'settings', etc.
        action: action, // 'add', 'update', 'delete'
        data: data,
        timestamp: new Date().toISOString()
    });
    
    saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, pendingChanges);
}

function getPendingChanges() {
    return getFromLocalStorage(STORAGE_KEYS.PENDING_CHANGES) || [];
}

function clearPendingChanges() {
    return saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, []);
}

// ============ التحميل السريع من LocalStorage ============

async function quickLoadData() {
    // تحميل فوري من LocalStorage (لا ينتظر الشبكة)
    products = getProductsLocally();
    sales = getSalesLocally();
    
    const settings = getSettingsLocally();
    
    // تطبيق الإعدادات إذا كانت موجودة
    if (settings && Object.keys(settings).length > 0) {
        applySettings(settings);
    }
    
    // تحميل البيانات الإضافية إن وجدت
    if (typeof window.expenses !== 'undefined') {
        window.expenses = getExpensesLocally();
    }
    if (typeof window.capitalTransactions !== 'undefined') {
        window.capitalTransactions = getCapitalTransactionsLocally();
    }
    
    return {
        products,
        sales,
        settings
    };
}

// ============ المزامنة مع Google Sheets ============

async function syncWithCloud() {
    if (isSyncing) return; // تجنب المزامنة المزدوجة
    if (!isOnline) return; // لا توجد إنترنت
    
    isSyncing = true;
    
    try {
        // 1. رفع التغييرات المعلقة أولاً
        await uploadPendingChanges();
        
        // 2. تنزيل آخر البيانات من السحابة
        await downloadFromCloud();
        
        // 3. تحديث وقت آخر مزامنة
        saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        
        console.log('✅ تمت المزامنة بنجاح');
    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);
    } finally {
        isSyncing = false;
    }
}

// رفع التغييرات المعلقة
async function uploadPendingChanges() {
    const pendingChanges = getPendingChanges();
    
    if (pendingChanges.length === 0) return;
    
    console.log(`📤 رفع ${pendingChanges.length} تغيير معلق...`);
    
    for (const change of pendingChanges) {
        try {
            await executePendingChange(change);
        } catch (error) {
            console.error('خطأ في رفع التغيير:', error);
        }
    }
    
    // مسح التغييرات المعلقة بعد الرفع
    clearPendingChanges();
}

// تنفيذ تغيير معلق
async function executePendingChange(change) {
    const { type, action, data } = change;
    
    switch (type) {
        case 'product':
            if (action === 'add') await saveProductToAPI(data);
            else if (action === 'update') await updateProductInAPI(data.id, data);
            else if (action === 'delete') await deleteProductFromAPI(data.id);
            break;
            
        case 'sale':
            if (action === 'add') await saveSaleToAPI(data);
            else if (action === 'delete') await deleteSaleFromAPI(data.id);
            break;
            
        case 'settings':
            await saveSettingsToAPI(data);
            break;
            
        case 'expense':
            if (typeof saveExpenseToAPI === 'function') {
                if (action === 'add') await saveExpenseToAPI(data);
                else if (action === 'delete') await deleteExpenseFromAPI(data.id);
            }
            break;
            
        case 'capital':
            if (typeof saveCapitalTransactionToAPI === 'function') {
                await saveCapitalTransactionToAPI(data);
            }
            break;
    }
}

// تنزيل البيانات من السحابة
async function downloadFromCloud() {
    try {
        // تحميل جميع البيانات من Google Sheets
        const [productsData, salesData, settingsData] = await Promise.all([
            loadProductsFromAPI(),
            loadSalesFromAPI(),
            loadSettingsFromAPI()
        ]);
        
        // حفظ في LocalStorage
        if (productsData) {
            products = productsData;
            saveProductsLocally(products);
        }
        
        if (salesData) {
            sales = salesData;
            saveSalesLocally(sales);
        }
        
        if (settingsData) {
            saveSettingsLocally(settingsData);
        }
        
        // تحميل البيانات الإضافية
        if (typeof loadExpensesFromAPI === 'function') {
            const expenses = await loadExpensesFromAPI();
            if (expenses) {
                window.expenses = expenses;
                saveExpensesLocally(expenses);
            }
        }
        
        if (typeof loadCapitalTransactionsFromAPI === 'function') {
            const transactions = await loadCapitalTransactionsFromAPI();
            if (transactions) {
                window.capitalTransactions = transactions;
                saveCapitalTransactionsLocally(transactions);
            }
        }
        
    } catch (error) {
        console.error('خطأ في تنزيل البيانات:', error);
    }
}

// ============ مراقبة حالة الاتصال ============

// تحديث واجهة حالة الاتصال
function updateConnectionUI(status) {
    const statusEl = document.getElementById('connectionStatus');
    const iconEl = document.getElementById('connectionIcon');
    const textEl = document.getElementById('connectionText');
    
    if (!statusEl || !iconEl || !textEl) return;
    
    statusEl.className = '';
    
    switch (status) {
        case 'online':
            statusEl.classList.add('online');
            iconEl.className = 'fas fa-wifi';
            textEl.textContent = 'متصل';
            break;
        case 'offline':
            statusEl.classList.add('offline');
            iconEl.className = 'fas fa-wifi-slash';
            textEl.textContent = 'بدون اتصال';
            break;
        case 'syncing':
            statusEl.classList.add('syncing');
            iconEl.className = 'fas fa-sync fa-spin';
            textEl.textContent = 'جاري المزامنة...';
            break;
    }
}

window.addEventListener('online', () => {
    isOnline = true;
    console.log('🌐 تم الاتصال بالإنترنت');
    updateConnectionUI('online');
    showAlert('success', '✅ تم الاتصال بالإنترنت - جاري المزامنة...');
    
    // بدء المزامنة التلقائية
    setTimeout(() => {
        updateConnectionUI('syncing');
        syncWithCloud().then(() => {
            updateConnectionUI('online');
            showAlert('success', '✅ تمت المزامنة بنجاح');
            // تحديث الواجهة
            updateDashboard();
            displayProducts();
            if (typeof displayPOSProducts === 'function') displayPOSProducts();
        }).catch(() => {
            updateConnectionUI('online');
        });
    }, 1000);
});

window.addEventListener('offline', () => {
    isOnline = false;
    console.log('📵 تم قطع الاتصال بالإنترنت');
    updateConnectionUI('offline');
    showAlert('warning', '📵 وضع بدون اتصال - ستتم المزامنة عند العودة');
});

// تحديث الحالة الأولية
window.addEventListener('DOMContentLoaded', () => {
    updateConnectionUI(navigator.onLine ? 'online' : 'offline');
});

// ============ دوال المساعدة ============

function getLastSyncTime() {
    const lastSync = getFromLocalStorage(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return 'لم تتم المزامنة بعد';
    
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now - syncDate) / 1000 / 60);
    
    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
}

function applySettings(settings) {
    // تطبيق الإعدادات على الواجهة
    const storeNameElements = document.querySelectorAll('.store-name, #storeName');
    storeNameElements.forEach(el => {
        if (settings.storeName) el.textContent = settings.storeName;
    });
    
    const userNameElements = document.querySelectorAll('.user-name, #userName');
    userNameElements.forEach(el => {
        if (settings.userName) el.textContent = settings.userName;
    });
    
    const shopNameElements = document.querySelectorAll('#shopName');
    shopNameElements.forEach(el => {
        if (settings.shopName) el.value = settings.shopName;
    });
}

// ============ مزامنة دورية (كل 5 دقائق) ============

setInterval(() => {
    if (isOnline && !isSyncing) {
        console.log('🔄 مزامنة تلقائية...');
        syncWithCloud();
    }
}, 5 * 60 * 1000); // 5 دقائق

// مزامنة عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (isOnline) {
        syncWithCloud();
    }
});
