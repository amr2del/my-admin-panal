// اختبار قاعدة البيانات
const db = require('./database');

async function test() {
    await db.initDatabase();
    
    // اختبار المصادقة
    console.log('\n🔍 اختبار المصادقة:');
    console.log('محاولة 1: admin/admin123');
    const result1 = db.authenticateUser('admin', 'admin123');
    console.log('النتيجة:', result1);
    
    console.log('\nمحاولة 2: admin/wrongpass');
    const result2 = db.authenticateUser('admin', 'wrongpass');
    console.log('النتيجة:', result2);
    
    db.closeDatabase();
    process.exit(0);
}

test();
