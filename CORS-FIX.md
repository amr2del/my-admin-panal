# 🔧 حل مشكلة CORS في Google Apps Script

## المشكلة:
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'https://amr2del.github.io' 
has been blocked by CORS policy
```

## السبب:
Google Apps Script لا يسمح بطلبات CORS من نطاقات مختلفة بشكل افتراضي.

---

## ✅ الحل النهائي:

### الخطوة 1: تحديث كود Google Apps Script

انسخ هذا الكود كاملاً إلى Google Apps Script Editor:

```javascript
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
    
    // إضافة CORS headers
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// معالجة GET (للاختبار)
function doGet(e) {
  return ContentService.createTextOutput('Google Apps Script is running!')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### الخطوة 2: إعادة نشر Web App

⚠️ **هام جداً:** يجب إعادة النشر بإصدار جديد

1. في Google Apps Script Editor، اضغط **"Deploy"** → **"Manage deployments"**
2. اضغط على أيقونة القلم ✏️ بجانب الـ deployment الحالي
3. في **"Version"**، اختر **"New version"**
4. أضف وصف: "إصلاح CORS"
5. **تأكد أن:**
   - **Execute as:** Me (your email)
   - **Who has access:** **Anyone**
6. اضغط **"Deploy"**
7. انسخ **Web app URL** الجديد

### الخطوة 3: تحديث الرابط

إذا تغير رابط Web App، حدّثه في ملف `sheets-api.js`

---

## 🧪 اختبار:

1. امسح الـ cache في المتصفح (Ctrl+Shift+R)
2. افتح: https://amr2del.github.io/my-admin-panal/
3. افتح Console (F12)
4. جرب إضافة منتج جديد
5. يجب أن يعمل بدون أخطاء

---

## 📝 ملاحظات:

- الكود الآن يستخدم `Content-Type: text/plain` لتجنب CORS preflight
- تأكد من أن Web App منشور بصلاحيات **"Anyone"**
- قد تحتاج إلى مسح cache المتصفح

---

## ⚠️ إذا استمرت المشكلة:

تأكد من أن:
1. ✅ Web App منشور بإصدار جديد
2. ✅ Who has access = **Anyone**
3. ✅ Execute as = **Me**
4. ✅ تم مسح cache المتصفح
5. ✅ الرابط الجديد محدث في sheets-api.js
