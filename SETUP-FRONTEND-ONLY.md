# 🚀 تشغيل المشروع مع Google Sheets (فرونت اند فقط)

## الخطوات:

### 1️⃣ إنشاء Google Sheet:

1. اذهب إلى: https://sheets.google.com
2. اضغط "+ جديد"
3. سمّه: **Spare Parts Database**
4. انسخ الـ **Spreadsheet ID** من الرابط:
   ```
   https://docs.google.com/spreadsheets/d/[هنا_الـID]/edit
   ```

### 2️⃣ إنشاء الأوراق (Sheets):

#### ورقة 1: Products
**الصف الأول (عناوين):**
```
id | name | barcode | description | purchasePrice | sellingPrice | quantity | minStock | category | supplier | createdAt | updatedAt
```

#### ورقة 2: Sales
**الصف الأول (عناوين):**
```
id | date | customer | phone | items | subtotal | discount | total | paymentMethod
```

#### ورقة 3: Settings
**الصف الأول (عناوين):**
```
key | value
```

**أضف البيانات التالية:**
```
userName         Admin
userRole         مدير النظام
storeName        قطع الغيار
shopName         محل قطع غيار الموتوسيكلات
shopAddress      القاهرة، مصر
shopPhone        01234567890
currency         ج.م
installDate      26/12/2025
```

---

### 3️⃣ إنشاء Google Apps Script:

1. من Google Sheet → **Extensions** → **Apps Script**
2. احذف الكود الموجود
3. **انسخ كل محتوى ملف** `google-apps-script.gs`
4. الصق في Apps Script Editor
5. **عدّل السطر 8:** ضع الـ Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = 'ضع_هنا_ID_الـSheet';
   ```
6. احفظ المشروع: اسمه **Spare Parts API**

---

### 4️⃣ نشر Web App:

1. من Apps Script → اضغط **Deploy** → **New deployment**
2. اختر Type: **Web app**
3. الإعدادات:
   - **Description**: Spare Parts API
   - **Execute as**: Me
   - **Who has access**: **Anyone** (أو Anyone with Google account)
4. اضغط **Deploy**
5. اضغط **Authorize access** → اختر حسابك → **Allow**
6. **انسخ Web App URL** (مثل):
   ```
   https://script.google.com/macros/s/ABC123.../exec
   ```

---

### 5️⃣ تحديث ملف sheets-api.js:

1. افتح: `d:\Coding\my admin\sheets-api.js`
2. **عدّل السطر 3:** ضع Web App URL:
   ```javascript
   const APPS_SCRIPT_URL = 'الصق_هنا_Web_App_URL';
   ```
3. احفظ الملف

---

### 6️⃣ رفع المشروع على GitHub Pages:

```bash
cd "d:\Coding\my admin"
git add .
git commit -m "Convert to frontend-only with Google Sheets"
git push
```

ثم:
1. اذهب إلى GitHub Repository
2. **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** → Folder: **/ (root)**
5. اضغط **Save**
6. انتظر دقيقة واحدة
7. الموقع سيكون على:
   ```
   https://amr2del.github.io/my-admin-panal/
   ```

---

## ✅ انتهى!

الآن الموقع يعمل بالكامل من الفرونت اند مع Google Sheets! 🎉

**لا حاجة لسيرفر Node.js!**

---

## 🔧 اختبار محلي:

افتح `index.html` مباشرة في المتصفح (بدون سيرفر):
```
file:///d:/Coding/my admin/index.html
```

---

## 📝 ملاحظات:

- ✅ كل البيانات في Google Sheets
- ✅ يعمل من أي مكان (مع الإنترنت)
- ✅ لا يحتاج تثبيت npm أو Node.js
- ✅ مجاني 100%
- ✅ يعمل على GitHub Pages مباشرة
