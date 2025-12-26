# 🚀 إعداد Google Sheets للمشروع

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

### 4. إعداد Google Cloud Console:

1. اذهب إلى: https://console.cloud.google.com
2. اضغط "Select a project" → "New Project"
3. اسم المشروع: **Spare Parts Admin**
4. اضغط "Create"

### 5. تفعيل Google Sheets API:

1. من القائمة → "APIs & Services" → "Library"
2. ابحث عن: **Google Sheets API**
3. اضغط "Enable"

### 6. إنشاء Service Account:

1. "APIs & Services" → "Credentials"
2. "Create Credentials" → "Service Account"
3. الاسم: **sheets-api-service**
4. اضغط "Create and Continue"
5. Role: **Editor**
6. اضغط "Done"

### 7. إنشاء Key:

1. اضغط على Service Account الجديد
2. "Keys" → "Add Key" → "Create new key"
3. نوع: **JSON**
4. اضغط "Create"
5. سيتم تنزيل ملف JSON
6. أعد تسمية الملف إلى: **credentials.json**
7. ضعه في مجلد المشروع: `d:\Coding\my admin\`

### 8. مشاركة Sheet مع Service Account:

1. افتح Google Sheet
2. اضغط "مشاركة"
3. الصق الإيميل من Service Account (من ملف credentials.json)
   - يبدأ بـ: `sheets-api-service@...`
4. الصلاحية: **Editor**
5. اضغط "إرسال"

### 9. تحديث ملف .env:

أنشئ ملف `.env` في المشروع:
```
SPREADSHEET_ID=الصق_هنا_ID_الSheet
```

---

## ✅ بعد الانتهاء:

شغّل السيرفر:
```bash
npm start
```

الآن البيانات تُحفظ في Google Sheets! 🎉
