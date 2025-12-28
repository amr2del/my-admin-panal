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

// معالجة OPTIONS (CORS Preflight)
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// معالجة GET (للاختبار)
function doGet(e) {
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
      sales.push({
        id: row[0],
        date: row[1],
        customer: row[2] || '',
        phone: row[3] || '',
        items: JSON.parse(row[4] || '[]'),
        subtotal: parseFloat(row[5]) || 0,
        discount: parseFloat(row[6]) || 0,
        total: parseFloat(row[7]) || 0,
        paymentMethod: row[8] || ''
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
  
  // تنسيق الأصناف بشكل قابل للقراءة
  const itemsFormatted = sale.items.map(item => 
    `${item.name} (${item.price} ج.م × ${item.quantity})`
  ).join(' | ');
  
  sheet.appendRow([
    id,
    dateFormatted,
    sale.customer || 'عميل نقدي',
    sale.phone || '',
    itemsFormatted,
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
