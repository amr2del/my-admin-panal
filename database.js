// ============ نظام قاعدة بيانات SQLite ============
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// مسار قاعدة البيانات
const DB_PATH = path.join(app.getPath('userData'), 'spareparts.db');

let SQL;
let db;

// ============ تهيئة قاعدة البيانات ============

async function initDatabase() {
    try {
        // تحميل مكتبة sql.js
        const initSqlJs = require('sql.js');
        SQL = await initSqlJs();
        
        // محاولة تحميل قاعدة بيانات موجودة
        if (fs.existsSync(DB_PATH)) {
            const buffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(buffer);
            console.log('✅ تم تحميل قاعدة البيانات الموجودة');
        } else {
            // إنشاء قاعدة بيانات جديدة
            db = new SQL.Database();
            console.log('✅ تم إنشاء قاعدة بيانات جديدة');
        }
        
        // إنشاء الجداول
        createTables();
        
        // حفظ قاعدة البيانات
        saveDatabase();
        
        return true;
    } catch (error) {
        console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
        return false;
    }
}

// ============ إنشاء الجداول ============

function createTables() {
    // جدول المنتجات
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            quantity INTEGER DEFAULT 0,
            price REAL DEFAULT 0,
            cost REAL DEFAULT 0,
            minStock INTEGER DEFAULT 0,
            barcode TEXT,
            supplier TEXT,
            notes TEXT,
            image TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // جدول المبيعات
    db.run(`
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            productName TEXT,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            total REAL NOT NULL,
            discount REAL DEFAULT 0,
            finalTotal REAL NOT NULL,
            customer TEXT,
            paymentMethod TEXT,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (productId) REFERENCES products(id)
        )
    `);
    
    // جدول المصروفات
    db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            category TEXT,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // جدول حركات رأس المال
    db.run(`
        CREATE TABLE IF NOT EXISTS capital_transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // جدول الإعدادات
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // جدول التغييرات المعلقة (للمزامنة)
    db.run(`
        CREATE TABLE IF NOT EXISTS pending_changes (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            action TEXT NOT NULL,
            data TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // جدول المستخدمين (للمصادقة)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullName TEXT,
            role TEXT DEFAULT 'user',
            isActive INTEGER DEFAULT 1,
            lastLogin TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // إنشاء فهارس لتحسين الأداء
    db.run('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(productId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    
    console.log('✅ تم إنشاء جميع الجداول والفهارس');
    
    // إنشاء مستخدم افتراضي إذا لم يوجد
    try {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
        if (stmt.step()) {
            const count = stmt.getAsObject().count;
            stmt.free();
            
            console.log(`📊 عدد المستخدمين الموجودين: ${count}`);
            
            if (count === 0) {
                console.log('📝 لم يتم العثور على مستخدمين، سيتم إنشاء المستخدم الافتراضي...');
                
                const insertStmt = db.prepare(`
                    INSERT INTO users (id, username, password, fullName, role, isActive, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `);
                
                insertStmt.run([
                    Date.now().toString(),
                    'admin',
                    'admin123',
                    'المدير',
                    'admin',
                    1
                ]);
                
                insertStmt.free();
                console.log('✅ تم إنشاء المستخدم الافتراضي: admin/admin123');
                saveDatabase(); // حفظ قاعدة البيانات فوراً
            } else {
                console.log(`✅ يوجد ${count} مستخدم في قاعدة البيانات`);
                
                // طباعة جميع المستخدمين للتشخيص
                const usersStmt = db.prepare('SELECT username, password, fullName, role, isActive FROM users');
                console.log('📋 المستخدمون الموجودون:');
                while (usersStmt.step()) {
                    const user = usersStmt.getAsObject();
                    console.log(`   - المستخدم: ${user.username}`);
                    console.log(`     الاسم: ${user.fullName}`);
                    console.log(`     الدور: ${user.role}`);
                    console.log(`     نشط: ${user.isActive === 1 ? 'نعم' : 'لا'}`);
                    console.log(`     كلمة المرور المحفوظة: ${user.password}`);
                }
                usersStmt.free();
            }
        }
    } catch (error) {
        console.error('❌ خطأ في إنشاء المستخدم الافتراضي:', error);
    }
}

// ============ حفظ قاعدة البيانات ============

function saveDatabase() {
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ قاعدة البيانات:', error);
        return false;
    }
}

// ============ عمليات المنتجات (Products CRUD) ============

function getAllProducts() {
    try {
        const stmt = db.prepare('SELECT * FROM products ORDER BY updatedAt DESC');
        const products = [];
        while (stmt.step()) {
            products.push(stmt.getAsObject());
        }
        stmt.free();
        return products;
    } catch (error) {
        console.error('خطأ في جلب المنتجات:', error);
        return [];
    }
}

function getProductById(id) {
    try {
        const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
        stmt.bind([id]);
        const result = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        return result;
    } catch (error) {
        console.error('خطأ في جلب المنتج:', error);
        return null;
    }
}

function addProduct(product) {
    try {
        const stmt = db.prepare(`
            INSERT INTO products (id, name, category, quantity, price, cost, minStock, barcode, supplier, notes, image, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);
        
        stmt.run([
            product.id || Date.now().toString(),
            product.name,
            product.category || '',
            product.quantity || 0,
            product.price || 0,
            product.cost || 0,
            product.minStock || 0,
            product.barcode || '',
            product.supplier || '',
            product.notes || '',
            product.image || ''
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
        return false;
    }
}

function updateProduct(id, updates) {
    try {
        const fields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        fields.push('updatedAt = datetime("now")');
        values.push(id);
        
        const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
        stmt.run(values);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في تحديث المنتج:', error);
        return false;
    }
}

function deleteProduct(id) {
    try {
        const stmt = db.prepare('DELETE FROM products WHERE id = ?');
        stmt.run([id]);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        return false;
    }
}

// ============ عمليات المبيعات (Sales CRUD) ============

function getAllSales() {
    try {
        const stmt = db.prepare('SELECT * FROM sales ORDER BY date DESC');
        const sales = [];
        while (stmt.step()) {
            sales.push(stmt.getAsObject());
        }
        stmt.free();
        return sales;
    } catch (error) {
        console.error('خطأ في جلب المبيعات:', error);
        return [];
    }
}

function addSale(sale) {
    try {
        const stmt = db.prepare(`
            INSERT INTO sales (id, productId, productName, quantity, price, total, discount, finalTotal, customer, paymentMethod, date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            sale.id || Date.now().toString(),
            sale.productId,
            sale.productName,
            sale.quantity,
            sale.price,
            sale.total,
            sale.discount || 0,
            sale.finalTotal,
            sale.customer || '',
            sale.paymentMethod || 'نقدي',
            sale.date || new Date().toISOString(),
            sale.notes || ''
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في إضافة المبيعة:', error);
        return false;
    }
}

function deleteSale(id) {
    try {
        const stmt = db.prepare('DELETE FROM sales WHERE id = ?');
        stmt.run([id]);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في حذف المبيعة:', error);
        return false;
    }
}

// ============ عمليات المصروفات (Expenses CRUD) ============

function getAllExpenses() {
    try {
        const stmt = db.prepare('SELECT * FROM expenses ORDER BY date DESC');
        const expenses = [];
        while (stmt.step()) {
            expenses.push(stmt.getAsObject());
        }
        stmt.free();
        return expenses;
    } catch (error) {
        console.error('خطأ في جلب المصروفات:', error);
        return [];
    }
}

function addExpense(expense) {
    try {
        const stmt = db.prepare(`
            INSERT INTO expenses (id, type, amount, description, category, date)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            expense.id || Date.now().toString(),
            expense.type,
            expense.amount,
            expense.description || '',
            expense.category || '',
            expense.date || new Date().toISOString()
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في إضافة المصروف:', error);
        return false;
    }
}

function deleteExpense(id) {
    try {
        const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
        stmt.run([id]);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في حذف المصروف:', error);
        return false;
    }
}

// ============ عمليات رأس المال (Capital Transactions CRUD) ============

function getAllCapitalTransactions() {
    try {
        const stmt = db.prepare('SELECT * FROM capital_transactions ORDER BY date DESC');
        const transactions = [];
        while (stmt.step()) {
            transactions.push(stmt.getAsObject());
        }
        stmt.free();
        return transactions;
    } catch (error) {
        console.error('خطأ في جلب حركات رأس المال:', error);
        return [];
    }
}

function addCapitalTransaction(transaction) {
    try {
        const stmt = db.prepare(`
            INSERT INTO capital_transactions (id, type, amount, description, date)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            transaction.id || Date.now().toString(),
            transaction.type,
            transaction.amount,
            transaction.description || '',
            transaction.date || new Date().toISOString()
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في إضافة حركة رأس المال:', error);
        return false;
    }
}

// ============ عمليات الإعدادات (Settings) ============

function getAllSettings() {
    try {
        const stmt = db.prepare('SELECT * FROM settings');
        const settings = {};
        while (stmt.step()) {
            const row = stmt.getAsObject();
            settings[row.key] = row.value;
        }
        stmt.free();
        return settings;
    } catch (error) {
        console.error('خطأ في جلب الإعدادات:', error);
        return {};
    }
}

function saveSetting(key, value) {
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO settings (key, value, updatedAt)
            VALUES (?, ?, datetime('now'))
        `);
        
        stmt.run([key, value]);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في حفظ الإعداد:', error);
        return false;
    }
}

function saveAllSettings(settings) {
    try {
        Object.keys(settings).forEach(key => {
            saveSetting(key, settings[key]);
        });
        return true;
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        return false;
    }
}

// ============ عمليات التغييرات المعلقة (Pending Changes) ============

function getAllPendingChanges() {
    try {
        const stmt = db.prepare('SELECT * FROM pending_changes ORDER BY timestamp ASC');
        const changes = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            row.data = JSON.parse(row.data);
            changes.push(row);
        }
        stmt.free();
        return changes;
    } catch (error) {
        console.error('خطأ في جلب التغييرات المعلقة:', error);
        return [];
    }
}

function addPendingChange(type, action, data) {
    try {
        const stmt = db.prepare(`
            INSERT INTO pending_changes (id, type, action, data, timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);
        
        stmt.run([
            Date.now().toString() + Math.random(),
            type,
            action,
            JSON.stringify(data)
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في إضافة التغيير المعلق:', error);
        return false;
    }
}

function clearPendingChanges() {
    try {
        const stmt = db.prepare('DELETE FROM pending_changes');
        stmt.run([]);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في مسح التغييرات المعلقة:', error);
        return false;
    }
}

// ============ إحصائيات وتقارير ============

function getDashboardStats() {
    try {
        const stats = {};
        
        // إجمالي المنتجات
        let stmt = db.prepare('SELECT COUNT(*) as count FROM products');
        if (stmt.step()) {
            stats.totalProducts = stmt.getAsObject().count;
        }
        stmt.free();
        
        // إجمالي المبيعات اليوم
        stmt = db.prepare(`
            SELECT SUM(finalTotal) as total 
            FROM sales 
            WHERE date(date) = date('now')
        `);
        if (stmt.step()) {
            stats.todaySales = stmt.getAsObject().total || 0;
        }
        stmt.free();
        
        // إجمالي المبيعات الشهر
        stmt = db.prepare(`
            SELECT SUM(finalTotal) as total 
            FROM sales 
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        `);
        if (stmt.step()) {
            stats.monthSales = stmt.getAsObject().total || 0;
        }
        stmt.free();
        
        // المنتجات قليلة المخزون
        stmt = db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity <= minStock');
        if (stmt.step()) {
            stats.lowStockProducts = stmt.getAsObject().count;
        }
        stmt.free();
        
        return stats;
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return {};
    }
}

// ============ البحث المتقدم ============

function searchProducts(query) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM products 
            WHERE name LIKE ? OR category LIKE ? OR barcode LIKE ?
            ORDER BY name
        `);
        
        const searchTerm = `%${query}%`;
        stmt.bind([searchTerm, searchTerm, searchTerm]);
        
        const products = [];
        while (stmt.step()) {
            products.push(stmt.getAsObject());
        }
        stmt.free();
        
        return products;
    } catch (error) {
        console.error('خطأ في البحث:', error);
        return [];
    }
}

// ============ النسخ الاحتياطي ============

function createBackup() {
    try {
        const backupPath = path.join(
            app.getPath('userData'),
            `backup-${new Date().toISOString().replace(/:/g, '-')}.db`
        );
        
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(backupPath, buffer);
        
        console.log('✅ تم إنشاء نسخة احتياطية:', backupPath);
        return backupPath;
    } catch (error) {
        console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
        return null;
    }
}

// ============ عمليات المصادقة ============

function authenticateUser(username, password) {
    try {
        console.log(`🔐 محاولة تسجيل الدخول:`);
        console.log(`   اسم المستخدم: "${username}" (طول: ${username.length})`);
        console.log(`   كلمة المرور: "${password}" (طول: ${password.length})`);
        
        // التحقق من جميع المستخدمين النشطين
        const allUsersStmt = db.prepare('SELECT username, password FROM users WHERE isActive = 1');
        console.log('   🔍 المستخدمون النشطون في قاعدة البيانات:');
        while (allUsersStmt.step()) {
            const user = allUsersStmt.getAsObject();
            const usernameMatch = user.username === username;
            const passwordMatch = user.password === password;
            console.log(`      - ${user.username} | pass: ${user.password}`);
            console.log(`        المطابقة: username=${usernameMatch}, password=${passwordMatch}`);
        }
        allUsersStmt.free();
        
        const stmt = db.prepare(`
            SELECT * FROM users 
            WHERE username = ? AND password = ? AND isActive = 1
        `);
        
        stmt.bind([username, password]);
        const result = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        
        if (result) {
            console.log(`✅ تم تسجيل الدخول بنجاح: ${username}`);
            
            // تحديث آخر تسجيل دخول
            const updateStmt = db.prepare(`
                UPDATE users SET lastLogin = datetime('now') WHERE id = ?
            `);
            updateStmt.run([result.id]);
            updateStmt.free();
            saveDatabase();
            
            return {
                success: true,
                user: {
                    id: result.id,
                    username: result.username,
                    fullName: result.fullName,
                    role: result.role
                }
            };
        }
        
        console.log(`❌ فشل تسجيل الدخول: ${username}`);
        console.log(`   السبب: اسم المستخدم أو كلمة المرور غير صحيحة`);
        
        return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    } catch (error) {
        console.error('❌ خطأ في المصادقة:', error);
        return { success: false, message: 'حدث خطأ في تسجيل الدخول' };
    }
}

function getAllUsers() {
    try {
        const stmt = db.prepare('SELECT id, username, fullName, role, isActive, lastLogin, createdAt FROM users');
        const users = [];
        while (stmt.step()) {
            users.push(stmt.getAsObject());
        }
        stmt.free();
        return users;
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        return [];
    }
}

function addUser(user) {
    try {
        const stmt = db.prepare(`
            INSERT INTO users (id, username, password, fullName, role, isActive, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        
        stmt.run([
            user.id || Date.now().toString(),
            user.username,
            user.password,
            user.fullName || '',
            user.role || 'user',
            user.isActive !== undefined ? user.isActive : 1
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        return false;
    }
}

function updateUser(id, updates) {
    try {
        const fields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        values.push(id);
        
        const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
        stmt.run(values);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        return false;
    }
}

function deleteUser(id) {
    try {
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        stmt.run([id]);
        stmt.free();
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        return false;
    }
}

// ============ الإغلاق ============

function closeDatabase() {
    try {
        if (db) {
            saveDatabase();
            db.close();
            console.log('✅ تم إغلاق قاعدة البيانات');
        }
    } catch (error) {
        console.error('❌ خطأ في إغلاق قاعدة البيانات:', error);
    }
}

// ============ التصدير ============

module.exports = {
    initDatabase,
    closeDatabase,
    saveDatabase,
    
    // Products
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    
    // Sales
    getAllSales,
    addSale,
    deleteSale,
    
    // Expenses
    getAllExpenses,
    addExpense,
    deleteExpense,
    
    // Capital
    getAllCapitalTransactions,
    addCapitalTransaction,
    
    // Settings
    getAllSettings,
    saveSetting,
    saveAllSettings,
    
    // Pending Changes
    getAllPendingChanges,
    addPendingChange,
    clearPendingChanges,
    
    // Stats
    getDashboardStats,
    
    // Backup
    createBackup,
    
    // Authentication
    authenticateUser,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    
    // Admin
    resetDefaultUser: () => {
        try {
            // حذف جميع المستخدمين
            db.run('DELETE FROM users');
            
            // إنشاء المستخدم الافتراضي من جديد
            const stmt = db.prepare(`
                INSERT INTO users (id, username, password, fullName, role, isActive, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `);
            
            stmt.run([
                Date.now().toString(),
                'admin',
                'admin123',
                'المدير',
                'admin',
                1
            ]);
            
            stmt.free();
            saveDatabase();
            
            console.log('✅ تم إعادة إنشاء المستخدم الافتراضي: admin/admin123');
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في إعادة إنشاء المستخدم:', error);
            return { success: false, error: error.message };
        }
    }
};
