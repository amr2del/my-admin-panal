// ============ نظام التخزين المحلي SQLite والمزامنة مع Google Sheets ============

/*
📋 استراتيجية التخزين والمزامنة:

1. ⭐ Google Sheets = المصدر الرئيسي للحقيقة (Source of Truth)
   - كل البيانات المهمة محفوظة في Google Sheets
   - عند الاتصال بالنت، نحمل دائماً من Google Sheets أولاً
   
2. 💾 SQLite = Cache سريع + حماية Offline
   - للوصول السريع للبيانات بدون انتظار
   - نسخة محلية تُحدّث من Google Sheets
   - تُستخدم فقط عند فصل النت
   
3. 📂 localStorage = Fallback نهائي
   - للمتصفحات التي لا تدعم SQLite
   - نسخة احتياطية إضافية
   
4. 🔄 آلية المزامنة:
   - عند الإضافة/التعديل → حفظ محلي + رفع للسحابة
   - عند فتح البرنامج → تحميل من Google Sheets (إذا متصل)
   - عند الـ Sync → رفع التغييرات ثم تحميل من Google Sheets
   - عند فصل النت → استخدام SQLite/localStorage
*/

// مفاتيح التخزين للنسخ الاحتياطي في localStorage
const STORAGE_KEYS = {
    LAST_SYNC: 'spareparts_last_sync',
    IS_ONLINE: 'spareparts_is_online',
    MIGRATION_DONE: 'spareparts_migration_done'
};

// حالة الاتصال
let isOnline = navigator.onLine;
let isSyncing = false;

// ✅ تفعيل SQLite - قاعدة بيانات محلية سليمة
const hasDatabase = typeof window.db !== 'undefined';

console.log('📊 نظام التخزين: Google Sheets (رئيسي) → SQLite (cache) → localStorage (fallback)');

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
    console.log('🚀 بدء التحميل السريع...');
    
    // 💾 التحميل من SQLite فقط - Google Sheets للـ backup فقط
    console.log('💾 تحميل البيانات من قاعدة البيانات المحلية...');
    
    // تحميل من SQLite
    if (!hasDatabase) {
        console.warn('⚠️ قاعدة البيانات غير متوفرة، استخدام localStorage');
        return quickLoadFromLocalStorage();
    }
    
    try {
        console.log('💾 تحميل البيانات من SQLite...');
        // تحميل فوري من SQLite
        products = await window.db.getAllProducts();
        sales = await window.db.getAllSales();
        
        console.log(`📦 تم تحميل ${products.length} منتج من SQLite`);
        console.log(`💰 تم تحميل ${sales.length} عملية بيع من SQLite`);
        
        const settings = await window.db.getAllSettings();
        
        // تطبيق الإعدادات
        if (settings && Object.keys(settings).length > 0) {
            applySettings(settings);
        }
        
        // تحميل البيانات الإضافية
        if (window.db.getAllExpenses) {
            const loadedExpenses = await window.db.getAllExpenses();
            window.expenses = loadedExpenses || [];
            console.log(`💸 تم تحميل ${window.expenses.length} مصروف من SQLite`);
        }
        if (window.db.getAllCapitalTransactions) {
            window.capitalTransactions = await window.db.getAllCapitalTransactions();
            console.log(`💵 تم تحميل ${window.capitalTransactions?.length || 0} معاملة رأس مال من SQLite`);
        }
        
        console.log('✅ تم تحميل البيانات من SQLite بنجاح');
        
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
    console.log('📦 تحميل البيانات من localStorage...');
    
    products = JSON.parse(localStorage.getItem('spareparts_products') || '[]');
    
    // ✅ Validate products data
    products = products.map(p => ({
        ...p,
        purchasePrice: parseFloat(p.purchasePrice) || 0,
        sellingPrice: parseFloat(p.sellingPrice) || 0,
        quantity: parseInt(p.quantity) || 0,
        minStock: parseInt(p.minStock) || 3
    }));
    
    sales = JSON.parse(localStorage.getItem('spareparts_sales') || '[]');
    const settings = JSON.parse(localStorage.getItem('spareparts_settings') || '{}');
    
    console.log(`✅ تم تحميل ${products.length} منتج من localStorage`);
    console.log(`✅ تم تحميل ${sales.length} عملية بيع من localStorage`);
    
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
    if (isSyncing) {
        console.log('⏳ المزامنة جارية بالفعل...');
        return;
    }
    
    if (!isOnline || !navigator.onLine) {
        console.log('📵 لا يوجد اتصال بالإنترنت - تم إلغاء المزامنة');
        return;
    }
    
    isSyncing = true;
    
    try {
        console.log('🔄 بدء المزامنة مع السحابة...');
        
        // 1️⃣ رفع التغييرات المعلقة للسحابة
        await uploadPendingChanges();
        
        // 2️⃣ تحميل من Google Sheets (المصدر الرئيسي)
        const cloudSuccess = await downloadFromCloud();
        
        if (cloudSuccess) {
            // 3️⃣ تحديث وقت آخر مزامنة
            localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
            console.log('✅ تمت المزامنة بنجاح - Google Sheets هو المصدر الرئيسي الآن');
        } else {
            console.warn('⚠️ فشلت المزامنة - البيانات المحلية محفوظة');
        }
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
    // ✅ فحص الاتصال قبل المتابعة
    if (!isOnline || !navigator.onLine) {
        console.log('⚠️ لا يوجد اتصال - تم إلغاء تنزيل البيانات');
        return false;
    }
    
    try {
        console.log('📥 تنزيل البيانات من Google Sheets...');
        
        // تحميل البيانات من API (بالتوازي للسرعة)
        const [productsData, salesData, settingsData, expensesData] = await Promise.all([
            loadProductsFromAPI(),
            loadSalesFromAPI(),
            loadSettingsFromAPI(),
            loadDataFromAPI('expenses')
        ]);
        
        console.log(`📦 Products from API: ${productsData?.length || 0}`);
        console.log(`💰 Sales from API: ${salesData?.length || 0}`);
        console.log(`📋 Expenses from API: ${expensesData?.length || 0}`);
        
        // ⚠️ إذا فشل التحميل (بيانات null أو فارغة)، ارجع false
        if (productsData === null && salesData === null && expensesData === null) {
            console.warn('⚠️ فشل الاتصال بـ Google Sheets - استخدام البيانات المحلية');
            return false;
        }
        
        // إذا كانت البيانات فارغة (مش null)، يعني النت شغال لكن Google Sheets فاضي
        if (productsData !== null && salesData !== null && 
            productsData.length === 0 && salesData.length === 0) {
            console.warn('⚠️ Google Sheets فارغ - البيانات المحلية محفوظة');
            return false;
        }
        
        // 🔄 دمج البيانات من السحابة مع المحلية
        if (productsData && Array.isArray(productsData)) {
            products = productsData;
            
            // ✅ دمج في SQLite (تحديث الموجود، إضافة الجديد)
            if (hasDatabase && productsData.length > 0) {
                try {
                    let addedCount = 0;
                    let updatedCount = 0;
                    
                    for (const cloudProduct of productsData) {
                        const existingProduct = await window.db.getProductById(cloudProduct.id);
                        
                        if (existingProduct) {
                            // المنتج موجود - تحديث
                            await window.db.updateProduct(cloudProduct.id, cloudProduct);
                            updatedCount++;
                        } else {
                            // منتج جديد - إضافة
                            await window.db.addProduct(cloudProduct);
                            addedCount++;
                        }
                    }
                    
                    console.log(`✅ دمج المنتجات: ${addedCount} جديد، ${updatedCount} محدّث`);
                } catch (err) {
                    console.error('❌ خطأ في دمج المنتجات:', err);
                }
            }
            
            // حفظ في localStorage كنسخة احتياطية
            saveProductsLocally(products);
            console.log(`✅ تم دمج ${products.length} منتج من Google Sheets`);
        }
        
        if (salesData && Array.isArray(salesData)) {
            sales = salesData;
            
            // ✅ دمج في SQLite (تحديث الموجود، إضافة الجديد)
            if (hasDatabase && salesData.length > 0) {
                try {
                    let addedCount = 0;
                    let updatedCount = 0;
                    
                    for (const cloudSale of salesData) {
                        const existingSale = await window.db.getSaleById(cloudSale.id);
                        
                        if (existingSale) {
                            // البيع موجود - تحديث
                            await window.db.updateSale(cloudSale.id, cloudSale);
                            updatedCount++;
                        } else {
                            // بيع جديد - إضافة
                            await window.db.addSale(cloudSale);
                            addedCount++;
                        }
                    }
                    
                    console.log(`✅ دمج المبيعات: ${addedCount} جديد، ${updatedCount} محدّث`);
                } catch (err) {
                    console.error('❌ خطأ في دمج المبيعات:', err);
                }
            }
            
            // حفظ في localStorage كنسخة احتياطية
            saveSalesLocally(sales);
            console.log(`✅ تم دمج ${sales.length} عملية بيع من Google Sheets`);
        }
        
        if (settingsData && Object.keys(settingsData).length > 0) {
            // ⚠️ SQLite معطل - حفظ في localStorage فقط
            saveSettingsLocally(settingsData);
        }
        
        // تحميل البيانات الإضافية
        if (typeof loadExpensesFromAPI === 'function') {
            const expenses = await loadExpensesFromAPI();
            console.log(`📋 تم جلب ${expenses?.length || 0} مصروف من Google Sheets`);
            if (expenses && Array.isArray(expenses)) {
                window.expenses = expenses;
                
                // ✅ دمج في SQLite (تحديث الموجود، إضافة الجديد)
                if (hasDatabase && expenses.length > 0 && typeof window.db.getAllExpenses === 'function') {
                    try {
                        let addedCount = 0;
                        let updatedCount = 0;
                        
                        for (const cloudExpense of expenses) {
                            const existingExpense = await window.db.getExpenseById(cloudExpense.id);
                            
                            if (existingExpense) {
                                // المصروف موجود - تحديث
                                await window.db.updateExpense(cloudExpense.id, cloudExpense);
                                updatedCount++;
                            } else {
                                // مصروف جديد - إضافة
                                await window.db.addExpense(cloudExpense);
                                addedCount++;
                            }
                        }
                        
                        console.log(`✅ دمج المصروفات: ${addedCount} جديد، ${updatedCount} محدّث`);
                    } catch (err) {
                        console.error('❌ خطأ في دمج المصروفات:', err);
                    }
                }
                
                // حفظ في localStorage كنسخة احتياطية
                saveExpensesLocally(expenses);
            }
        }
        
        // ✅ نجح التحميل من Google Sheets
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في تنزيل البيانات من Google Sheets:', error);
        console.log('📂 استخدام البيانات المحلية كـ fallback');
        return false;
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
    showAlert('success', '✅ تم الاتصال بالإنترنت - البيانات المحلية محفوظة ✅');
    
    // ❌ لا مزامنة تلقائية - النظام SQLite-First
    // الرفع للسحابة فقط من خلال الـ backup اليومي التلقائي
});

window.addEventListener('offline', () => {
    isOnline = false;
    isSyncing = false; // ✅ إيقاف أي مزامنة جارية
    console.log('📵 تم قطع الاتصال بالإنترنت');
    updateConnectionUI('offline');
    showAlert('warning', '📵 وضع بدون اتصال - بياناتك محفوظة محلياً ✅');
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
        console.log(`💾 تم حفظ ${Array.isArray(data) ? data.length : 'البيانات'} في ${key}`);
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
        return false;
    }
}

// ============ مزامنة دورية (كل 5 دقائق) ============

// ❌ تم تعطيل المزامنة التلقائية كل 5 دقائق
// النظام الآن SQLite-First - الرفع للسحابة فقط من خلال الـ backup اليومي
// setInterval(() => {
//     if (isOnline && !isSyncing) {
//         console.log('🔄 مزامنة تلقائية...');
//         syncWithCloud();
//     }
// }, 5 * 60 * 1000);

// حفظ SQLite عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    // ❌ لا مزامنة مع السحابة - فقط حفظ محلي
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
