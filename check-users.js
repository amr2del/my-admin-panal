// فحص المستخدمين في قاعدة البيانات
const fs = require('fs');
const path = require('path');
const os = require('os');

const DB_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'spare-parts-admin', 'spareparts.db');

console.log('🔍 فحص قاعدة البيانات...');
console.log('📁 المسار:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
    console.log('❌ قاعدة البيانات غير موجودة!');
    console.log('✨ سيتم إنشاء قاعدة بيانات جديدة عند تشغيل التطبيق');
    process.exit(0);
}

// تحميل sql.js
const initSqlJs = require('sql.js');

initSqlJs().then(SQL => {
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    
    console.log('\n✅ تم تحميل قاعدة البيانات');
    
    // عرض جميع المستخدمين
    const stmt = db.prepare('SELECT * FROM users');
    
    console.log('\n📋 جميع المستخدمين:');
    console.log('='.repeat(60));
    
    let count = 0;
    while (stmt.step()) {
        const user = stmt.getAsObject();
        count++;
        console.log(`\n👤 المستخدم #${count}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   اسم المستخدم: "${user.username}"`);
        console.log(`   كلمة المرور: "${user.password}"`);
        console.log(`   الاسم الكامل: ${user.fullName}`);
        console.log(`   الدور: ${user.role}`);
        console.log(`   نشط: ${user.isActive === 1 ? 'نعم' : 'لا'}`);
        console.log(`   آخر تسجيل دخول: ${user.lastLogin || 'لم يسجل دخول بعد'}`);
        console.log(`   تم الإنشاء: ${user.createdAt}`);
    }
    stmt.free();
    
    if (count === 0) {
        console.log('\n⚠️  لا يوجد مستخدمين في قاعدة البيانات!');
    } else {
        console.log('\n' + '='.repeat(60));
        console.log(`📊 إجمالي المستخدمين: ${count}`);
    }
    
    db.close();
}).catch(err => {
    console.error('❌ خطأ:', err);
});
