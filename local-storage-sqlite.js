// ============ نظام التخزين المحلي SQLite والمزامنة مع Google Sheets ============

// مفاتيح التخزين للنسخ الاحتياطي في localStorage
const STORAGE_KEYS = {
    LAST_SYNC: 'spareparts_last_sync',
    IS_ONLINE: 'spareparts_is_online',
    MIGRATION_DONE: 'spareparts_migration_done'
};

// حالة الاتصال
let isOnline = navigator.onLine;
let isSyncing = false;

// التحقق من وجود واجهة قاعدة البيانات
const hasDatabase = typeof window.db !== 'undefined';

// ============ ترحيل البيانات من localStorage إلى SQLite ============

async function migrateFromLocalStorage() {
    // التحقق إذا تم الترحيل مسبقاً
    if (localStorage.getItem(STORAGE_KEYS.MIGRATION_DONE) === 'true') {
        console.log('✅ البيانات مُرحّلة مسبقاً');
        return;
    }
    
    if (!hasDatabase) {
        console.warn('⚠️ قاعدة البيانات غير متوفرة');
        return;
    }
    
    console.log('📦 بدء ترحيل البيانات من localStorage إلى SQLite...');
    
    try {
        // ترحيل المنتجات
        const oldProducts = localStorage.getItem('spareparts_products');
        if (oldProducts) {
            const products = JSON.parse(oldProducts);
            for (const product of products) {
                await window.db.addProduct(product);
            }
            console.log(`✅ تم ترحيل ${products.length} منتج`);
        }
        
        // ترحيل المبيعات
        const oldSales = localStorage.getItem('spareparts_sales');
        if (oldSales) {
            const sales = JSON.parse(oldSales);
            for (const sale of sales) {
                await window.db.addSale(sale);
            }
            console.log(`✅ تم ترحيل ${sales.length} عملية بيع`);
        }
        
        // ترحيل المصروفات
        const oldExpenses = localStorage.getItem('spareparts_expenses');
        if (oldExpenses) {
            const expenses = JSON.parse(oldExpenses);
            for (const expense of expenses) {
                await window.db.addExpense(expense);
            }
            console.log(`✅ تم ترحيل ${expenses.length} مصروف`);
        }
        
        // ترحيل حركات رأس المال
        const oldCapital = localStorage.getItem('spareparts_capital_transactions');
        if (oldCapital) {
            const transactions = JSON.parse(oldCapital);
            for (const transaction of transactions) {
                await window.db.addCapitalTransaction(transaction);
            }
            console.log(`✅ تم ترحيل ${transactions.length} حركة رأس مال`);
        }
        
        // ترحيل الإعدادات
        const oldSettings = localStorage.getItem('spareparts_settings');
        if (oldSettings) {
            const settings = JSON.parse(oldSettings);
            await window.db.saveAllSettings(settings);
            console.log('✅ تم ترحيل الإعدادات');
        }
        
        // ترحيل التغييرات المعلقة
        const oldPending = localStorage.getItem('spareparts_pending_changes');
        if (oldPending) {
            const changes = JSON.parse(oldPending);
            for (const change of changes) {
                await window.db.addPendingChange(change.type, change.action, change.data);
            }
            console.log(`✅ تم ترحيل ${changes.length} تغيير معلق`);
        }
        
        // وضع علامة على اكتمال الترحيل
        localStorage.setItem(STORAGE_KEYS.MIGRATION_DONE, 'true');
        
        console.log('🎉 اكتمل ترحيل البيانات بنجاح!');
        showAlert('success', '✅ تم ترحيل بياناتك إلى قاعدة البيانات الجديدة بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في ترحيل البيانات:', error);
        showAlert('error', '❌ حدث خطأ في ترحيل البيانات');
    }
}

// ============ التحميل السريع من SQLite ============

async function quickLoadData() {
    if (!hasDatabase) {
        console.warn('⚠️ قاعدة البيانات غير متوفرة، استخدام localStorage');
        return quickLoadFromLocalStorage();
    }
    
    try {
        // تحميل فوري من SQLite
        products = await window.db.getAllProducts();
        sales = await window.db.getAllSales();
        
        const settings = await window.db.getAllSettings();
        
        // تطبيق الإعدادات
        if (settings && Object.keys(settings).length > 0) {
            applySettings(settings);
        }
        
        // تحميل البيانات الإضافية
        if (typeof window.expenses !== 'undefined') {
            window.expenses = await window.db.getAllExpenses();
        }
        if (typeof window.capitalTransactions !== 'undefined') {
            window.capitalTransactions = await window.db.getAllCapitalTransactions();
        }
        
        console.log('✅ تم تحميل البيانات من SQLite');
        
        return {
            products,
            sales,
            settings
        };
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        return { products: [], sales: [], settings: {} };
    }
}

// Fallback للتحميل من localStorage (للمتصفحات العادية)
function quickLoadFromLocalStorage() {
    products = JSON.parse(localStorage.getItem('spareparts_products') || '[]');
    sales = JSON.parse(localStorage.getItem('spareparts_sales') || '[]');
    const settings = JSON.parse(localStorage.getItem('spareparts_settings') || '{}');
    
    if (settings && Object.keys(settings).length > 0) {
        applySettings(settings);
    }
    
    return { products, sales, settings };
}

// ============ حفظ البيانات في SQLite ============

async function saveProductsLocally(products) {
    if (!hasDatabase) return saveToLocalStorage('spareparts_products', products);
    // البيانات محفوظة تلقائياً في SQLite
    await window.db.save();
    return true;
}

async function saveSalesLocally(sales) {
    if (!hasDatabase) return saveToLocalStorage('spareparts_sales', sales);
    await window.db.save();
    return true;
}

async function saveSettingsLocally(settings) {
    if (!hasDatabase) return saveToLocalStorage('spareparts_settings', settings);
    await window.db.saveAllSettings(settings);
    return true;
}

async function saveExpensesLocally(expenses) {
    if (!hasDatabase) return saveToLocalStorage('spareparts_expenses', expenses);
    await window.db.save();
    return true;
}

async function saveCapitalTransactionsLocally(transactions) {
    if (!hasDatabase) return saveToLocalStorage('spareparts_capital_transactions', transactions);
    await window.db.save();
    return true;
}

// ============ قراءة البيانات من SQLite ============

async function getProductsLocally() {
    if (!hasDatabase) return JSON.parse(localStorage.getItem('spareparts_products') || '[]');
    return await window.db.getAllProducts();
}

async function getSalesLocally() {
    if (!hasDatabase) return JSON.parse(localStorage.getItem('spareparts_sales') || '[]');
    return await window.db.getAllSales();
}

async function getSettingsLocally() {
    if (!hasDatabase) return JSON.parse(localStorage.getItem('spareparts_settings') || '{}');
    return await window.db.getAllSettings();
}

async function getExpensesLocally() {
    if (!hasDatabase) return JSON.parse(localStorage.getItem('spareparts_expenses') || '[]');
    return await window.db.getAllExpenses();
}

async function getCapitalTransactionsLocally() {
    if (!hasDatabase) return JSON.parse(localStorage.getItem('spareparts_capital_transactions') || '[]');
    return await window.db.getAllCapitalTransactions();
}

// ============ إدارة التغييرات المعلقة ============

async function addPendingChange(type, action, data) {
    if (!hasDatabase) {
        // Fallback للـ localStorage
        let pendingChanges = JSON.parse(localStorage.getItem('spareparts_pending_changes') || '[]');
        pendingChanges.push({
            id: Date.now() + Math.random(),
            type,
            action,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('spareparts_pending_changes', JSON.stringify(pendingChanges));
        return;
    }
    
    await window.db.addPendingChange(type, action, data);
}

async function getPendingChanges() {
    if (!hasDatabase) {
        return JSON.parse(localStorage.getItem('spareparts_pending_changes') || '[]');
    }
    return await window.db.getAllPendingChanges();
}

async function clearPendingChanges() {
    if (!hasDatabase) {
        localStorage.setItem('spareparts_pending_changes', '[]');
        return;
    }
    await window.db.clearPendingChanges();
}

// ============ المزامنة مع Google Sheets ============

async function syncWithCloud() {
    if (isSyncing) return;
    if (!isOnline) return;
    
    isSyncing = true;
    
    try {
        // 1. رفع التغييرات المعلقة أولاً
        await uploadPendingChanges();
        
        // 2. تنزيل آخر البيانات من السحابة
        await downloadFromCloud();
        
        // 3. تحديث وقت آخر مزامنة
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        
        console.log('✅ تمت المزامنة بنجاح');
    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);
    } finally {
        isSyncing = false;
    }
}

// رفع التغييرات المعلقة
async function uploadPendingChanges() {
    const pendingChanges = await getPendingChanges();
    
    if (pendingChanges.length === 0) return;
    
    console.log(`📤 رفع ${pendingChanges.length} تغيير معلق...`);
    
    for (const change of pendingChanges) {
        try {
            await executePendingChange(change);
        } catch (error) {
            console.error('خطأ في رفع التغيير:', error);
        }
    }
    
    await clearPendingChanges();
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
        // تحميل البيانات من API (بالتوازي للسرعة)
        const [productsData, salesData, settingsData] = await Promise.all([
            loadProductsFromAPI(),
            loadSalesFromAPI(),
            loadSettingsFromAPI()
        ]);
        
        // حفظ في SQLite - بدون تكرار
        if (productsData && hasDatabase) {
            // الحصول على المنتجات الموجودة
            const existingProducts = await window.db.getAllProducts();
            const existingIds = new Set(existingProducts.map(p => p.id));
            
            // إضافة أو تحديث المنتجات
            for (const product of productsData) {
                if (existingIds.has(product.id)) {
                    // تحديث المنتج الموجود
                    await window.db.updateProduct(product.id, product);
                } else {
                    // إضافة منتج جديد
                    await window.db.addProduct(product);
                }
            }
            products = productsData;
        }
        
        if (salesData && hasDatabase) {
            // الحصول على المبيعات الموجودة
            const existingSales = await window.db.getAllSales();
            const existingIds = new Set(existingSales.map(s => s.id));
            
            // إضافة المبيعات الجديدة فقط
            for (const sale of salesData) {
                if (!existingIds.has(sale.id)) {
                    await window.db.addSale(sale);
                }
            }
            sales = salesData;
        }
        
        if (settingsData && hasDatabase) {
            await window.db.saveAllSettings(settingsData);
        }
        
        // تحميل البيانات الإضافية
        if (typeof loadExpensesFromAPI === 'function') {
            const expenses = await loadExpensesFromAPI();
            if (expenses && hasDatabase) {
                for (const expense of expenses) {
                    await window.db.addExpense(expense);
                }
                window.expenses = expenses;
            }
        }
        
        if (typeof loadCapitalTransactionsFromAPI === 'function') {
            const transactions = await loadCapitalTransactionsFromAPI();
            if (transactions && hasDatabase) {
                for (const transaction of transactions) {
                    await window.db.addCapitalTransaction(transaction);
                }
                window.capitalTransactions = transactions;
            }
        }
        
    } catch (error) {
        console.error('خطأ في تنزيل البيانات:', error);
    }
}

// ============ مراقبة حالة الاتصال ============

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
    
    setTimeout(() => {
        updateConnectionUI('syncing');
        syncWithCloud().then(() => {
            updateConnectionUI('online');
            showAlert('success', '✅ تمت المزامنة بنجاح');
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
window.addEventListener('DOMContentLoaded', async () => {
    updateConnectionUI(navigator.onLine ? 'online' : 'offline');
    
    // ترحيل البيانات من localStorage إلى SQLite
    if (hasDatabase) {
        await migrateFromLocalStorage();
    }
});

// ============ دوال المساعدة ============

function getLastSyncTime() {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
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

// ============ دوال مساعدة للتوافق مع الكود القديم ============

// للاستخدام العام من الملفات الأخرى
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('خطأ في قراءة البيانات:', error);
        return defaultValue;
    }
}

function saveDataToLocal(key, data) {
    return saveToLocalStorage(key, data);
}

function getDataFromLocal(key, defaultValue = []) {
    return getFromLocalStorage(key, defaultValue);
}

// Fallback functions for localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        return false;
    }
}

// ============ مزامنة دورية (كل 5 دقائق) ============

setInterval(() => {
    if (isOnline && !isSyncing) {
        console.log('🔄 مزامنة تلقائية...');
        syncWithCloud();
    }
}, 5 * 60 * 1000);

// مزامنة عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (isOnline) {
        syncWithCloud();
    }
    if (hasDatabase) {
        window.db.save();
    }
});

// نسخ احتياطي تلقائي يومي
if (hasDatabase) {
    setInterval(() => {
        window.db.createBackup().then(path => {
            if (path) {
                console.log('✅ تم إنشاء نسخة احتياطية تلقائية:', path);
            }
        });
    }, 24 * 60 * 60 * 1000); // كل 24 ساعة
}
