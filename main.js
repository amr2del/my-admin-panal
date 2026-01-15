const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const db = require('./database');

let mainWindow;
let loginWindow;

function createLoginWindow() {
    // منع فتح نافذة دخول جديدة إذا كانت موجودة
    if (loginWindow) {
        loginWindow.focus();
        return;
    }
    
    loginWindow = new BrowserWindow({
        width: 500,
        height: 700,
        minWidth: 450,
        minHeight: 650,
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png'),
        title: 'تسجيل الدخول - نظام إدارة قطع الغيار',
        show: false,
        frame: true,
        autoHideMenuBar: true,
        center: true
    });

    loginWindow.loadFile('login.html');

    loginWindow.once('ready-to-show', () => {
        loginWindow.show();
    });

    loginWindow.on('closed', () => {
        loginWindow = null;
    });
}

function createWindow() {
    // منع فتح نافذة رئيسية جديدة إذا كانت موجودة
    if (mainWindow) {
        mainWindow.focus();
        return;
    }
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png'),
        title: 'نظام إدارة قطع الغيار',
        backgroundColor: '#f5f7fa',
        show: false,
        center: true
    });

    // تحميل الملف الرئيسي
    mainWindow.loadFile('index.html');

    // إظهار النافذة عندما تكون جاهزة
    mainWindow.once('ready-to-show', () => {
        // إغلاق نافذة تسجيل الدخول أولاً
        if (loginWindow && !loginWindow.isDestroyed()) {
            loginWindow.close();
            loginWindow = null;
        }
        // ثم إظهار النافذة الرئيسية
        mainWindow.show();
        mainWindow.maximize();
    });

    // فتح أدوات المطور في وضع التطوير
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // إنشاء قائمة مخصصة
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'ملف',
            submenu: [
                {
                    label: 'تحديث',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                { type: 'separator' },
                {
                    label: 'خروج',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'تحرير',
            submenu: [
                { label: 'تراجع', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'إعادة', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'قص', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'نسخ', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'لصق', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: 'تحديد الكل', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
            ]
        },
        {
            label: 'عرض',
            submenu: [
                {
                    label: 'تكبير',
                    accelerator: 'CmdOrCtrl+Plus',
                    role: 'zoomIn'
                },
                {
                    label: 'تصغير',
                    accelerator: 'CmdOrCtrl+-',
                    role: 'zoomOut'
                },
                {
                    label: 'حجم طبيعي',
                    accelerator: 'CmdOrCtrl+0',
                    role: 'resetZoom'
                },
                { type: 'separator' },
                {
                    label: 'ملء الشاشة',
                    accelerator: 'F11',
                    role: 'togglefullscreen'
                }
            ]
        },
        {
            label: 'مساعدة',
            submenu: [
                {
                    label: 'حول التطبيق',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'حول التطبيق',
                            message: 'نظام إدارة قطع الغيار',
                            detail: 'الإصدار 1.0.0\nتطبيق سطح مكتب لإدارة المخزون والمبيعات',
                            buttons: ['موافق']
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'أدوات المطور',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// عند استعداد التطبيق
app.whenReady().then(async () => {
    try {
        // تهيئة قاعدة البيانات
        console.log('🔄 جاري تهيئة قاعدة البيانات...');
        const result = await db.initDatabase();
        
        if (!result) {
            console.error('❌ فشل في تهيئة قاعدة البيانات');
            app.quit();
            return;
        }
        
        console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
        
        // فتح نافذة تسجيل الدخول أولاً
        createLoginWindow();
    } catch (error) {
        console.error('❌ خطأ حرج في تهيئة التطبيق:', error);
        app.quit();
    }
});

// إنهاء التطبيق عند إغلاق جميع النوافذ (ما عدا macOS)
app.on('window-all-closed', () => {
    // حفظ وإغلاق قاعدة البيانات
    db.closeDatabase();
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// إنشاء نافذة جديدة عند تفعيل التطبيق في macOS
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ============ IPC Handlers لقاعدة البيانات ============

// متغير لتتبع حالة تسجيل الدخول
let currentUser = null;

// Authentication
ipcMain.handle('auth:login', async (event, username, password) => {
    try {
        console.log('📨 تلقي طلب تسجيل دخول من الواجهة');
        console.log(`   اسم المستخدم: ${username}`);
        
        const result = db.authenticateUser(username, password);
        
        if (result.success) {
            console.log('✅ تسجيل دخول ناجح، فتح النافذة الرئيسية...');
            // حفظ بيانات المستخدم
            currentUser = result.user;
            // فتح النافذة الرئيسية عند نجاح تسجيل الدخول
            createWindow();
        } else {
            console.log('❌ فشل تسجيل الدخول:', result.message);
        }
        
        return result;
    } catch (error) {
        console.error('❌ خطأ في معالج تسجيل الدخول:', error);
        return { 
            success: false, 
            message: 'حدث خطأ في معالجة طلب تسجيل الدخول: ' + error.message 
        };
    }
});

// الحصول على المستخدم الحالي
ipcMain.handle('auth:getCurrentUser', async () => {
    return currentUser;
});

// تسجيل الخروج
ipcMain.handle('auth:logout', async () => {
    currentUser = null;
    return { success: true };
});

// إعادة إنشاء المستخدم الافتراضي (للتشخيص)
ipcMain.handle('auth:resetDefaultUser', async () => {
    return db.resetDefaultUser();
});

ipcMain.handle('auth:getAllUsers', async () => {
    return db.getAllUsers();
});

ipcMain.handle('auth:getUserWithPassword', async (event, userId) => {
    return db.getUserWithPassword(userId);
});

ipcMain.handle('auth:addUser', async (event, user) => {
    return db.addUser(user);
});

ipcMain.handle('auth:updateUser', async (event, id, updates) => {
    return db.updateUser(id, updates);
});

ipcMain.handle('auth:deleteUser', async (event, id) => {
    return db.deleteUser(id);
});

// Products
ipcMain.handle('db:getAllProducts', async () => {
    return db.getAllProducts();
});

ipcMain.handle('db:getProductById', async (event, id) => {
    return db.getProductById(id);
});

ipcMain.handle('db:addProduct', async (event, product) => {
    return db.addProduct(product);
});

ipcMain.handle('db:updateProduct', async (event, id, updates) => {
    return db.updateProduct(id, updates);
});

ipcMain.handle('db:deleteProduct', async (event, id) => {
    return db.deleteProduct(id);
});

ipcMain.handle('db:searchProducts', async (event, query) => {
    return db.searchProducts(query);
});

// Sales
ipcMain.handle('db:getAllSales', async () => {
    return db.getAllSales();
});

ipcMain.handle('db:addSale', async (event, sale) => {
    return db.addSale(sale);
});

ipcMain.handle('db:deleteSale', async (event, id) => {
    return db.deleteSale(id);
});

// Expenses
ipcMain.handle('db:getAllExpenses', async () => {
    return db.getAllExpenses();
});

ipcMain.handle('db:addExpense', async (event, expense) => {
    return db.addExpense(expense);
});

ipcMain.handle('db:deleteExpense', async (event, id) => {
    return db.deleteExpense(id);
});

// Capital Transactions
ipcMain.handle('db:getAllCapitalTransactions', async () => {
    return db.getAllCapitalTransactions();
});

ipcMain.handle('db:addCapitalTransaction', async (event, transaction) => {
    return db.addCapitalTransaction(transaction);
});

// Settings
ipcMain.handle('db:getAllSettings', async () => {
    return db.getAllSettings();
});

ipcMain.handle('db:saveSetting', async (event, key, value) => {
    return db.saveSetting(key, value);
});

ipcMain.handle('db:saveAllSettings', async (event, settings) => {
    return db.saveAllSettings(settings);
});

// Pending Changes
ipcMain.handle('db:getAllPendingChanges', async () => {
    return db.getAllPendingChanges();
});

ipcMain.handle('db:addPendingChange', async (event, type, action, data) => {
    return db.addPendingChange(type, action, data);
});

ipcMain.handle('db:clearPendingChanges', async () => {
    return db.clearPendingChanges();
});

// Stats & Reports
ipcMain.handle('db:getDashboardStats', async () => {
    return db.getDashboardStats();
});

// Backup
ipcMain.handle('db:createBackup', async () => {
    return db.createBackup();
});

// Save Database
ipcMain.handle('db:save', async () => {
    return db.saveDatabase();
});

// معالجة أخطاء غير متوقعة
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // حفظ قاعدة البيانات قبل الإغلاق
    db.saveDatabase();
});
