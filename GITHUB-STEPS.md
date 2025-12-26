# خطوات رفع المشروع على GitHub

## تم ✅

1. ✅ إنشاء `.gitignore`
2. ✅ تهيئة Git
3. ✅ عمل commit أولي

## الخطوات التالية:

### 1. إنشاء Repository على GitHub:
- اذهب إلى https://github.com/new
- اسم Repository: `spare-parts-admin`
- اجعله Public أو Private
- **لا تضف** README أو .gitignore (موجودين بالفعل)
- اضغط "Create repository"

### 2. ربط المشروع بـ GitHub:

بعد إنشاء Repository، نفذ الأوامر التالية:

```bash
cd "d:\Coding\my admin"
git remote add origin https://github.com/[USERNAME]/spare-parts-admin.git
git branch -M main
git push -u origin main
```

**استبدل [USERNAME] باسم المستخدم الخاص بك على GitHub**

### 3. إذا كان عندك Git credentials:
قد يطلب منك Username & Password أو Token

---

## 🔒 ملاحظات أمان:

تم استبعاد الملفات التالية من Git (في .gitignore):
- ✅ `node_modules/` - المكتبات (كبيرة)
- ✅ `database.json` - قاعدة البيانات (بيانات خاصة)
- ✅ `.env` - متغيرات البيئة

---

## 📝 بعد الرفع:

يمكنك تحديث المشروع بـ:
```bash
git add .
git commit -m "وصف التغييرات"
git push
```

---

هل تريد مني تنفيذ الأوامر؟ أعطني username الخاص بك على GitHub
