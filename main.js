const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
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
        show: false // لا تظهر النافذة حتى تكون جاهزة
    });

    // تحميل الملف الرئيسي
    mainWindow.loadFile('index.html');

    // إظهار النافذة عندما تكون جاهزة
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
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
app.whenReady().then(createWindow);

// إنهاء التطبيق عند إغلاق جميع النوافذ (ما عدا macOS)
app.on('window-all-closed', () => {
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

// معالجة أخطاء غير متوقعة
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
