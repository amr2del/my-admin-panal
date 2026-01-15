// حذف قاعدة البيانات القديمة وإنشاء جديدة
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// يجب تشغيل هذا فقط في حالة electron
if (app) {
    const DB_PATH = path.join(app.getPath('userData'), 'spareparts.db');
    
    console.log('🗑️  مسار قاعدة البيانات:', DB_PATH);
    
    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('✅ تم حذف قاعدة البيانات القديمة');
    } else {
        console.log('⚠️  قاعدة البيانات غير موجودة');
    }
    
    console.log('✨ سيتم إنشاء قاعدة بيانات جديدة عند تشغيل التطبيق');
    
    process.exit(0);
} else {
    console.error('❌ يجب تشغيل هذا السكريبت من خلال electron');
    process.exit(1);
}
