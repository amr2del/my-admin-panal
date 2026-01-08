const { contextBridge, ipcRenderer } = require('electron');

// تصدير APIs آمنة إلى renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // يمكنك إضافة وظائف مخصصة هنا للتواصل بين العمليات
    platform: process.platform,
    versions: process.versions
});

// منع الأخطاء في وحدة التحكم
window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron Desktop App Loaded');
});
