const { contextBridge, ipcRenderer } = require('electron');

// تصدير APIs آمنة إلى renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    versions: process.versions,
    
    // Authentication
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    resetDefaultUser: () => ipcRenderer.invoke('auth:resetDefaultUser'),
    getAllUsers: () => ipcRenderer.invoke('auth:getAllUsers'),
    addUser: (user) => ipcRenderer.invoke('auth:addUser', user),
    updateUser: (id, updates) => ipcRenderer.invoke('auth:updateUser', id, updates),
    deleteUser: (id) => ipcRenderer.invoke('auth:deleteUser', id)
});

// تصدير واجهة قاعدة البيانات
contextBridge.exposeInMainWorld('db', {
    // Products
    getAllProducts: () => ipcRenderer.invoke('db:getAllProducts'),
    getProductById: (id) => ipcRenderer.invoke('db:getProductById', id),
    addProduct: (product) => ipcRenderer.invoke('db:addProduct', product),
    updateProduct: (id, updates) => ipcRenderer.invoke('db:updateProduct', id, updates),
    deleteProduct: (id) => ipcRenderer.invoke('db:deleteProduct', id),
    searchProducts: (query) => ipcRenderer.invoke('db:searchProducts', query),
    
    // Sales
    getAllSales: () => ipcRenderer.invoke('db:getAllSales'),
    addSale: (sale) => ipcRenderer.invoke('db:addSale', sale),
    deleteSale: (id) => ipcRenderer.invoke('db:deleteSale', id),
    
    // Expenses
    getAllExpenses: () => ipcRenderer.invoke('db:getAllExpenses'),
    addExpense: (expense) => ipcRenderer.invoke('db:addExpense', expense),
    deleteExpense: (id) => ipcRenderer.invoke('db:deleteExpense', id),
    
    // Capital Transactions
    getAllCapitalTransactions: () => ipcRenderer.invoke('db:getAllCapitalTransactions'),
    addCapitalTransaction: (transaction) => ipcRenderer.invoke('db:addCapitalTransaction', transaction),
    
    // Settings
    getAllSettings: () => ipcRenderer.invoke('db:getAllSettings'),
    saveSetting: (key, value) => ipcRenderer.invoke('db:saveSetting', key, value),
    saveAllSettings: (settings) => ipcRenderer.invoke('db:saveAllSettings', settings),
    
    // Pending Changes
    getAllPendingChanges: () => ipcRenderer.invoke('db:getAllPendingChanges'),
    addPendingChange: (type, action, data) => ipcRenderer.invoke('db:addPendingChange', type, action, data),
    clearPendingChanges: () => ipcRenderer.invoke('db:clearPendingChanges'),
    
    // Stats & Reports
    getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
    
    // Backup & Save
    createBackup: () => ipcRenderer.invoke('db:createBackup'),
    save: () => ipcRenderer.invoke('db:save')
});

// منع الأخطاء في وحدة التحكم
window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron Desktop App with SQLite Database Loaded');
});
