# 🚀 إعداد Google Sheets و Google Apps Script

## ✅ المعلومات الحالية:

- **Google Sheet URL:** https://docs.google.com/spreadsheets/d/1xiT2-lTmDLsDRI0KhouJhwlBMjbh5aYZzpPYYk-XRU0/edit
- **Spreadsheet ID:** `1xiT2-lTmDLsDRI0KhouJhwlBMjbh5aYZzpPYYk-XRU0`
- **Web App URL:** https://script.google.com/macros/s/AKfycbwJz1KunrpFnEy1KkQP1fWw4VnNfDvs9DNd7Hqm7cA2n8qlsfvMqegbpnSbysUb14jpWg/exec

---

## الخطوات:

### 1. إنشاء Google Sheet جديد:
1. اذهب إلى: https://sheets.google.com
2. اضغط "+ جديد" لإنشاء Sheet جديد
3. سمّه: **Spare Parts Database**

### 2. إنشاء 3 أوراق (Sheets):

#### Sheet 1: Products
**العناوين في الصف الأول:**
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| id | name | barcode | description | purchasePrice | sellingPrice | quantity | minStock | category | supplier | createdAt | updatedAt |

#### Sheet 2: Sales
**العناوين في الصف الأول:**
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| id | date | customer | phone | items | subtotal | discount | total | paymentMethod |

#### Sheet 3: Settings
**العناوين في الصف الأول:**
| A | B |
|---|---|
| key | value |

**أضف هذه الصفوف:**
```
userName         Admin
userRole         مدير النظام
storeName        قطع الغيار
shopName         محل قطع غيار الموتوسيكلات
shopAddress      القاهرة، مصر
shopPhone        01234567890
currency         ج.م
```

### 3. الحصول على Spreadsheet ID:
- من رابط Sheet: 
  `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
- انسخ الـ ID من الرابط
- **المستخدم حالياً:** `1xiT2-lTmDLsDRI0KhouJhwlBMjbh5aYZzpPYYk-XRU0`

### 4. إعداد Google Apps Script:

1. افتح Google Sheet الخاص بك
2. من القائمة: **Extensions** → **Apps Script**
3. امسح الكود الافتراضي
4. انسخ كل محتوى ملف `google-apps-script.gs` من المشروع
5. الصق الكود في Google Apps Script Editor
6. احفظ المشروع (Ctrl+S)
7. سمّ المشروع: **Spare Parts API**

### 5. نشر Web App:

1. اضغط "Deploy" → "New deployment"
2. اضغط على أيقونة الترس ⚙️ بجانب "Select type"
3. اختر **Web app**
4. الإعدادات:
   - **Description:** API للمشروع
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. اضغط "Deploy"
6. اضغط "Authorize access"
7. اختر حسابك في Google
8. اضغط "Advanced" → "Go to [Project Name] (unsafe)"
9. اضغط "Allow"
10. انسخ **Web app URL** (سيبدأ بـ `https://script.google.com/macros/s/...`)

### 6. تحديث الكود:

في ملف `google-apps-script.gs`:
```javascript
const SPREADSHEET_ID = '1xiT2-lTmDLsDRI0KhouJhwlBMjbh5aYZzpPYYk-XRU0';
```

في ملف `sheets-api.js`:
```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJz1KunrpFnEy1KkQP1fWw4VnNfDvs9DNd7Hqm7cA2n8qlsfvMqegbpnSbysUb14jpWg/exec';
```

---

## ⚠️ ملاحظات هامة:

- لا تحتاج إلى Google Cloud Console أو Service Account
- لا تحتاج إلى ملف credentials.json
- كل شيء يعمل من خلال Google Apps Script مباشرة
- التطبيق يعمل Frontend Only بدون سيرفر

---

## ✅ بعد الانتهاء:

افتح ملف `index.html` في المتصفح أو استخدم Live Server في VS Code:
```bash
# إذا كان لديك Live Server extension
# اضغط بزر الماوس الأيمن على index.html
# واختر "Open with Live Server"
```

الآن البيانات تُحفظ في Google Sheets! 🎉
