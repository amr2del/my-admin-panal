// ============================================
// Google Apps Script - Web App Backend
// ============================================
// انسخ هذا الكود وضعه في Google Apps Script
// ============================================

// معرف Google Sheet
const SPREADSHEET_ID = '1xiT2-lTmDLsDRI0KhouJhwlBMjbh5aYZzpPYYk-XRU0';

// الحصول على Sheet
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

// معالجة الطلبات POST
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const data = request.data;
    
    let response = {};
    
    switch(action) {
      case 'getProducts':
        response = getProducts();
        break;
      case 'addProduct':
        response = addProduct(data);
        break;
      case 'updateProduct':
        response = updateProduct(data.id, data.updates);
        break;
      case 'deleteProduct':
        response = deleteProduct(data.id);
        break;
      case 'getSales':
        response = getSales();
        break;
      case 'addSale':
        response = addSale(data);
        break;
      case 'deleteSale':
        response = deleteSale(data.id);
        break;
      case 'getSettings':
        response = getSettings();
        break;
      case 'updateSettings':
        response = updateSettings(data);
        break;
      case 'getExpenses':
        response = getExpenses();
        break;
      case 'saveExpenses':
        response = saveExpenses(data);
        break;
      case 'getCustomers':
        response = getCustomers();
        break;
      case 'saveCustomers':
        response = saveCustomers(data);
        break;
      case 'getSuppliers':
        response = getSuppliers();
        break;
      case 'saveSuppliers':
        response = saveSuppliers(data);
        break;
      case 'getPurchaseinvoices':
        response = getPurchaseinvoices();
        break;
      case 'savePurchaseinvoices':
        response = savePurchaseinvoices(data);
        break;
        response = updateSettings(data);
        break;
      default:
        response = { success: false, message: 'إجراء غير معروف' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

// معالجة OPTIONS (CORS Preflight)
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

// معالجة GET (للاختبار والطلبات)
function doGet(e) {
  // إذا في parameters، نفذ الطلب
  if (e.parameter.action) {
    try {
      const action = e.parameter.action;
      const data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
      
      let response = {};
      
      switch(action) {
        case 'getProducts':
          response = getProducts();
          break;
        case 'addProduct':
          response = addProduct(data);
          break;
        case 'updateProduct':
          response = updateProduct(data.id, data.updates);
          break;
        case 'deleteProduct':
          response = deleteProduct(data.id);
          break;
        case 'getSales':
          response = getSales();
          break;
        case 'addSale':
          response = addSale(data);
          break;
        case 'deleteSale':
          response = deleteSale(data.id);
          break;
        case 'getSettings':
          response = getSettings();
          break;
        case 'updateSettings':
          response = updateSettings(data);
          break;
        case 'getExpenses':
          response = getExpenses();
          break;
        case 'saveExpenses':
          response = saveExpenses(data);
          break;
        case 'getCustomers':
          response = getCustomers();
          break;
        case 'saveCustomers':
          response = saveCustomers(data);
          break;
        case 'getSuppliers':
          response = getSuppliers();
          break;
        case 'saveSuppliers':
          response = saveSuppliers(data);
          break;
        case 'getPurchaseinvoices':
          response = getPurchaseinvoices();
          break;
        case 'savePurchaseinvoices':
          response = savePurchaseinvoices(data);
          break;
        default:
          response = { success: false, message: 'إجراء غير معروف' };
      }
      
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // إذا مفيش parameters، ارجع رسالة الاختبار
  return ContentService.createTextOutput('Google Apps Script is running!')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============ المنتجات ============

function getProducts() {
  const sheet = getSheet('Products');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const products = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // إذا كان ID موجود
      products.push({
        id: row[0],
        name: row[1] || '',
        barcode: row[2] || '',
        description: row[3] || '',
        purchasePrice: parseFloat(row[4]) || 0,
        sellingPrice: parseFloat(row[5]) || 0,
        quantity: parseInt(row[6]) || 0,
        minStock: parseInt(row[7]) || 3,
        category: row[8] || '',
        supplier: row[9] || '',
        createdAt: row[10] || '',
        updatedAt: row[11] || ''
      });
    }
  }
  
  return { success: true, products: products };
}

function addProduct(product) {
  const sheet = getSheet('Products');
  const id = Date.now();
  const now = new Date();
  const createdAt = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  
  sheet.appendRow([
    id,
    product.name,
    product.barcode || '',
    product.description || '',
    product.purchasePrice,
    product.sellingPrice,
    product.quantity,
    product.minStock || 3,
    product.category || '',
    product.supplier || '',
    createdAt,
    ''
  ]);
  
  product.id = id;
  product.createdAt = createdAt;
  
  return { success: true, product: product, message: 'تم إضافة المنتج بنجاح' };
}

function updateProduct(productId, updates) {
  const sheet = getSheet('Products');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == productId) {
      const rowIndex = i + 1;
      const now = new Date();
      const updatedAt = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      
      // تحديث البيانات
      if (updates.name !== undefined) sheet.getRange(rowIndex, 2).setValue(updates.name);
      if (updates.barcode !== undefined) sheet.getRange(rowIndex, 3).setValue(updates.barcode);
      if (updates.description !== undefined) sheet.getRange(rowIndex, 4).setValue(updates.description);
      if (updates.purchasePrice !== undefined) sheet.getRange(rowIndex, 5).setValue(updates.purchasePrice);
      if (updates.sellingPrice !== undefined) sheet.getRange(rowIndex, 6).setValue(updates.sellingPrice);
      if (updates.quantity !== undefined) sheet.getRange(rowIndex, 7).setValue(updates.quantity);
      if (updates.minStock !== undefined) sheet.getRange(rowIndex, 8).setValue(updates.minStock);
      if (updates.category !== undefined) sheet.getRange(rowIndex, 9).setValue(updates.category);
      if (updates.supplier !== undefined) sheet.getRange(rowIndex, 10).setValue(updates.supplier);
      sheet.getRange(rowIndex, 12).setValue(updatedAt);
      
      const product = {
        id: data[i][0],
        name: updates.name !== undefined ? updates.name : data[i][1],
        barcode: updates.barcode !== undefined ? updates.barcode : data[i][2],
        description: updates.description !== undefined ? updates.description : data[i][3],
        purchasePrice: updates.purchasePrice !== undefined ? updates.purchasePrice : data[i][4],
        sellingPrice: updates.sellingPrice !== undefined ? updates.sellingPrice : data[i][5],
        quantity: updates.quantity !== undefined ? updates.quantity : data[i][6],
        minStock: updates.minStock !== undefined ? updates.minStock : data[i][7],
        category: updates.category !== undefined ? updates.category : data[i][8],
        supplier: updates.supplier !== undefined ? updates.supplier : data[i][9],
        createdAt: data[i][10],
        updatedAt: updatedAt
      };
      
      return { success: true, product: product, message: 'تم تحديث المنتج بنجاح' };
    }
  }
  
  return { success: false, message: 'المنتج غير موجود' };
}

function deleteProduct(productId) {
  const sheet = getSheet('Products');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == productId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'تم حذف المنتج بنجاح' };
    }
  }
  
  return { success: false, message: 'المنتج غير موجود' };
}

// ============ المبيعات ============

function getSales() {
  const sheet = getSheet('Sales');
  const data = sheet.getDataRange().getValues();
  const sales = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      // التحقق من وجود عمود items JSON (العمود 6)
      let items = [];
      try {
        items = JSON.parse(row[5] || '[]');
      } catch (e) {
        // إذا فشل التحليل، نستخدم مصفوفة فارغة
        items = [];
      }
      
      sales.push({
        id: row[0],
        date: row[1],
        customer: row[2] || '',
        phone: row[3] || '',
        items: items,
        subtotal: parseFloat(row[6]) || 0,
        discount: parseFloat(row[7]) || 0,
        total: parseFloat(row[8]) || 0,
        paymentMethod: row[9] || ''
      });
    }
  }
  
  return { success: true, sales: sales };
}

function addSale(sale) {
  const sheet = getSheet('Sales');
  const id = Date.now();
  const now = new Date();
  
  // تنسيق التاريخ بشكل أكثر قابلية للقراءة
  const dateFormatted = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  
  // تنسيق الأصناف بشكل قابل للقراءة للعرض
  const itemsFormatted = sale.items.map(item => 
    `${item.name} (${item.price} ج.م × ${item.quantity})`
  ).join(' | ');
  
  // حفظ items كـ JSON في عمود منفصل للقراءة
  const itemsJSON = JSON.stringify(sale.items);
  
  sheet.appendRow([
    id,
    dateFormatted,
    sale.customer || 'عميل نقدي',
    sale.phone || '',
    itemsFormatted,      // للعرض في Google Sheets
    itemsJSON,           // للقراءة من التطبيق
    sale.subtotal,
    sale.discount || 0,
    sale.total,
    sale.paymentMethod || 'cash'
  ]);
  
  sale.id = id;
  sale.date = dateFormatted;
  
  return { success: true, sale: sale, message: 'تمت عملية البيع بنجاح' };
}

function deleteSale(saleId) {
  const sheet = getSheet('Sales');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == saleId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'تم حذف العملية بنجاح' };
    }
  }
  
  return { success: false, message: 'العملية غير موجودة' };
}

// ============ الإعدادات ============

function getSettings() {
  const sheet = getSheet('Settings');
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      settings[row[0]] = row[1];
    }
  }
  
  return { success: true, settings: settings };
}

function updateSettings(newSettings) {
  const sheet = getSheet('Settings');
  
  // مسح البيانات الحالية (ما عدا العناوين)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // إضافة الإعدادات الجديدة
  const rows = [];
  for (const [key, value] of Object.entries(newSettings)) {
    rows.push([key, value]);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
  
  return { success: true, settings: newSettings, message: 'تم تحديث الإعدادات بنجاح' };
}

// ============ المصروفات ============

function getExpenses() {
  const sheet = getSheet('Expenses');
  if (!sheet) {
    // إنشاء Sheet جديد إذا لم يكن موجوداً
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('Expenses');
    newSheet.appendRow(['ID', 'Type', 'Description', 'Amount', 'Date', 'CreatedAt']);
    return { success: true, expenses: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const expenses = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    expenses.push({
      id: row[0],
      type: row[1],
      description: row[2],
      amount: row[3],
      date: row[4],
      createdAt: row[5]
    });
  }
  
  return { success: true, expenses: expenses };
}

function saveExpenses(expensesData) {
  const sheet = getSheet('Expenses');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('Expenses');
    newSheet.appendRow(['ID', 'Type', 'Description', 'Amount', 'Date', 'CreatedAt']);
  }
  
  const finalSheet = getSheet('Expenses');
  const lastRow = finalSheet.getLastRow();
  if (lastRow > 1) {
    finalSheet.deleteRows(2, lastRow - 1);
  }
  
  const rows = expensesData.map(exp => [
    exp.id,
    exp.type,
    exp.description,
    exp.amount,
    exp.date,
    exp.createdAt
  ]);
  
  if (rows.length > 0) {
    finalSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  
  return { success: true, message: 'تم حفظ المصروفات بنجاح' };
}

// ============ العملاء ============

function getCustomers() {
  const sheet = getSheet('Customers');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('Customers');
    newSheet.appendRow(['ID', 'Name', 'Phone', 'Email', 'Address', 'Type', 'TotalPurchases', 'Debt', 'CreatedAt']);
    return { success: true, customers: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const customers = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    customers.push({
      id: row[0],
      name: row[1],
      phone: row[2],
      email: row[3],
      address: row[4],
      type: row[5],
      totalPurchases: row[6],
      debt: row[7],
      createdAt: row[8]
    });
  }
  
  return { success: true, customers: customers };
}

function saveCustomers(customersData) {
  const sheet = getSheet('Customers');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('Customers');
    newSheet.appendRow(['ID', 'Name', 'Phone', 'Email', 'Address', 'Type', 'TotalPurchases', 'Debt', 'CreatedAt']);
  }
  
  const finalSheet = getSheet('Customers');
  const lastRow = finalSheet.getLastRow();
  if (lastRow > 1) {
    finalSheet.deleteRows(2, lastRow - 1);
  }
  
  const rows = customersData.map(c => [
    c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.type,
    c.totalPurchases,
    c.debt,
    c.createdAt
  ]);
  
  if (rows.length > 0) {
    finalSheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
  
  return { success: true, message: 'تم حفظ العملاء بنجاح' };
}

// ============ الموردين ============

function getSuppliers() {
  const sheet = getSheet('Suppliers');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('Suppliers');
    newSheet.appendRow(['ID', 'Name', 'Phone', 'Email', 'Category', 'Address', 'TotalPurchases', 'Debt', 'CreatedAt']);
    return { success: true, suppliers: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const suppliers = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    suppliers.push({
      id: row[0],
      name: row[1],
      phone: row[2],
      email: row[3],
      category: row[4],
      address: row[5],
      totalPurchases: row[6],
      debt: row[7],
      createdAt: row[8]
    });
  }
  
  return { success: true, suppliers: suppliers };
}

function saveSuppliers(suppliersData) {
  const sheet = getSheet('Suppliers');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('Suppliers');
    newSheet.appendRow(['ID', 'Name', 'Phone', 'Email', 'Category', 'Address', 'TotalPurchases', 'Debt', 'CreatedAt']);
  }
  
  const finalSheet = getSheet('Suppliers');
  const lastRow = finalSheet.getLastRow();
  if (lastRow > 1) {
    finalSheet.deleteRows(2, lastRow - 1);
  }
  
  const rows = suppliersData.map(s => [
    s.id,
    s.name,
    s.phone,
    s.email,
    s.category,
    s.address,
    s.totalPurchases,
    s.debt,
    s.createdAt
  ]);
  
  if (rows.length > 0) {
    finalSheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
  
  return { success: true, message: 'تم حفظ الموردين بنجاح' };
}

// ============ فواتير الشراء ============

function getPurchaseinvoices() {
  const sheet = getSheet('PurchaseInvoices');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('PurchaseInvoices');
    newSheet.appendRow(['ID', 'SupplierID', 'Date', 'InvoiceNumber', 'Items', 'Total', 'PaymentStatus', 'CreatedAt']);
    return { success: true, purchaseinvoices: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const invoices = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    invoices.push({
      id: row[0],
      supplierId: row[1],
      date: row[2],
      invoiceNumber: row[3],
      items: JSON.parse(row[4] || '[]'),
      total: row[5],
      paymentStatus: row[6],
      createdAt: row[7]
    });
  }
  
  return { success: true, purchaseinvoices: invoices };
}

function savePurchaseinvoices(invoicesData) {
  const sheet = getSheet('PurchaseInvoices');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = ss.insertSheet('PurchaseInvoices');
    newSheet.appendRow(['ID', 'SupplierID', 'Date', 'InvoiceNumber', 'Items', 'Total', 'PaymentStatus', 'CreatedAt']);
  }
  
  const finalSheet = getSheet('PurchaseInvoices');
  const lastRow = finalSheet.getLastRow();
  if (lastRow > 1) {
    finalSheet.deleteRows(2, lastRow - 1);
  }
  
  const rows = invoicesData.map(inv => [
    inv.id,
    inv.supplierId,
    inv.date,
    inv.invoiceNumber,
    JSON.stringify(inv.items),
    inv.total,
    inv.paymentStatus,
    inv.createdAt
  ]);
  
  if (rows.length > 0) {
    finalSheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
  
  return { success: true, message: 'تم حفظ فواتير الشراء بنجاح' };
}
