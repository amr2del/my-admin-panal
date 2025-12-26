const { google } = require('googleapis');

// إعداد Google Sheets API
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// معلومات الـ Sheet (سيتم تحديثها لاحقاً)
let SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';

// إنشاء client للمصادقة
async function getAuthClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json', // ملف credentials من Google Cloud
        scopes: SCOPES,
    });
    return await auth.getClient();
}

// الحصول على sheets API
async function getSheets() {
    const authClient = await getAuthClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

// ============ قراءة البيانات ============

async function readProducts() {
    try {
        const sheets = await getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Products!A2:L', // من الصف 2 (بعد العناوين)
        });
        
        const rows = response.data.values || [];
        const products = rows.map(row => ({
            id: parseInt(row[0]) || Date.now(),
            name: row[1] || '',
            barcode: row[2] || '',
            description: row[3] || '',
            purchasePrice: parseFloat(row[4]) || 0,
            sellingPrice: parseFloat(row[5]) || 0,
            quantity: parseInt(row[6]) || 0,
            minStock: parseInt(row[7]) || 3,
            category: row[8] || '',
            supplier: row[9] || '',
            createdAt: row[10] || new Date().toISOString(),
            updatedAt: row[11] || ''
        }));
        
        return products;
    } catch (error) {
        console.error('خطأ في قراءة المنتجات:', error);
        return [];
    }
}

async function readSales() {
    try {
        const sheets = await getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sales!A2:J',
        });
        
        const rows = response.data.values || [];
        const sales = rows.map(row => ({
            id: parseInt(row[0]) || Date.now(),
            date: row[1] || new Date().toISOString(),
            customer: row[2] || '',
            phone: row[3] || '',
            items: JSON.parse(row[4] || '[]'),
            subtotal: parseFloat(row[5]) || 0,
            discount: parseFloat(row[6]) || 0,
            total: parseFloat(row[7]) || 0,
            paymentMethod: row[8] || '',
        }));
        
        return sales;
    } catch (error) {
        console.error('خطأ في قراءة المبيعات:', error);
        return [];
    }
}

async function readSettings() {
    try {
        const sheets = await getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Settings!A2:B',
        });
        
        const rows = response.data.values || [];
        const settings = {};
        rows.forEach(row => {
            settings[row[0]] = row[1];
        });
        
        return settings;
    } catch (error) {
        console.error('خطأ في قراءة الإعدادات:', error);
        return {};
    }
}

// ============ كتابة البيانات ============

async function writeProduct(product) {
    try {
        const sheets = await getSheets();
        const values = [[
            product.id,
            product.name,
            product.barcode,
            product.description,
            product.purchasePrice,
            product.sellingPrice,
            product.quantity,
            product.minStock,
            product.category,
            product.supplier,
            product.createdAt,
            product.updatedAt || ''
        ]];
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Products!A:L',
            valueInputOption: 'RAW',
            resource: { values }
        });
        
        return true;
    } catch (error) {
        console.error('خطأ في كتابة المنتج:', error);
        return false;
    }
}

async function updateProduct(productId, updates) {
    try {
        const products = await readProducts();
        const index = products.findIndex(p => p.id === productId);
        
        if (index === -1) return false;
        
        const product = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
        const sheets = await getSheets();
        const rowIndex = index + 2; // +2 لأن الصف 1 عناوين والصفوف تبدأ من 1
        
        const values = [[
            product.id,
            product.name,
            product.barcode,
            product.description,
            product.purchasePrice,
            product.sellingPrice,
            product.quantity,
            product.minStock,
            product.category,
            product.supplier,
            product.createdAt,
            product.updatedAt
        ]];
        
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Products!A${rowIndex}:L${rowIndex}`,
            valueInputOption: 'RAW',
            resource: { values }
        });
        
        return product;
    } catch (error) {
        console.error('خطأ في تحديث المنتج:', error);
        return false;
    }
}

async function deleteProduct(productId) {
    try {
        const products = await readProducts();
        const index = products.findIndex(p => p.id === productId);
        
        if (index === -1) return false;
        
        const sheets = await getSheets();
        const rowIndex = index + 2;
        
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // Products sheet
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }]
            }
        });
        
        return true;
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        return false;
    }
}

async function writeSale(sale) {
    try {
        const sheets = await getSheets();
        const values = [[
            sale.id,
            sale.date,
            sale.customer,
            sale.phone,
            JSON.stringify(sale.items),
            sale.subtotal,
            sale.discount,
            sale.total,
            sale.paymentMethod
        ]];
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sales!A:J',
            valueInputOption: 'RAW',
            resource: { values }
        });
        
        return true;
    } catch (error) {
        console.error('خطأ في كتابة البيع:', error);
        return false;
    }
}

async function updateSettings(settings) {
    try {
        const sheets = await getSheets();
        const values = Object.entries(settings).map(([key, value]) => [key, value]);
        
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Settings!A2:B'
        });
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Settings!A2:B',
            valueInputOption: 'RAW',
            resource: { values }
        });
        
        return true;
    } catch (error) {
        console.error('خطأ في تحديث الإعدادات:', error);
        return false;
    }
}

// تعيين SPREADSHEET_ID
function setSpreadsheetId(id) {
    SPREADSHEET_ID = id;
}

module.exports = {
    setSpreadsheetId,
    readProducts,
    readSales,
    readSettings,
    writeProduct,
    updateProduct,
    deleteProduct,
    writeSale,
    updateSettings
};
