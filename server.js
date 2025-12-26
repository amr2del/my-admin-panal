const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // زيادة حد حجم البيانات
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// مسار ملف البيانات
const DATA_FILE = path.join(__dirname, 'database.json');

// قراءة البيانات من الملف
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = {
                products: [],
                sales: [],
                settings: {
                    userName: 'Admin',
                    userRole: 'مدير النظام',
                    storeName: 'قطع الغيار',
                    shopName: 'محل قطع غيار الموتوسيكلات',
                    shopAddress: 'القاهرة، مصر',
                    shopPhone: '01234567890',
                    taxRate: 0,
                    currency: 'ج.م',
                    installDate: new Date().toLocaleDateString('ar-EG')
                }
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('خطأ في قراءة البيانات:', error);
        return { products: [], sales: [], settings: {} };
    }
}

// كتابة البيانات إلى الملف
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('خطأ في كتابة البيانات:', error);
        return false;
    }
}

// ============ المنتجات ============

// الحصول على جميع المنتجات
app.get('/api/products', (req, res) => {
    const data = readData();
    res.json({ success: true, products: data.products });
});

// إضافة منتج جديد
app.post('/api/products', (req, res) => {
    const data = readData();
    const product = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    data.products.push(product);
    
    if (writeData(data)) {
        res.json({ success: true, product, message: 'تم إضافة المنتج بنجاح' });
    } else {
        res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
    }
});

// تحديث منتج
app.put('/api/products/:id', (req, res) => {
    const data = readData();
    const productId = parseInt(req.params.id);
    const index = data.products.findIndex(p => p.id === productId);
    
    if (index !== -1) {
        data.products[index] = {
            ...data.products[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        if (writeData(data)) {
            res.json({ success: true, product: data.products[index], message: 'تم تحديث المنتج بنجاح' });
        } else {
            res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
        }
    } else {
        res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
});

// حذف منتج
app.delete('/api/products/:id', (req, res) => {
    const data = readData();
    const productId = parseInt(req.params.id);
    const index = data.products.findIndex(p => p.id === productId);
    
    if (index !== -1) {
        const deletedProduct = data.products.splice(index, 1)[0];
        
        if (writeData(data)) {
            res.json({ success: true, product: deletedProduct, message: 'تم حذف المنتج بنجاح' });
        } else {
            res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
        }
    } else {
        res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
});

// ============ المبيعات ============

// الحصول على جميع المبيعات
app.get('/api/sales', (req, res) => {
    const data = readData();
    res.json({ success: true, sales: data.sales });
});

// إضافة عملية بيع
app.post('/api/sales', (req, res) => {
    const data = readData();
    const sale = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    // تحديث كميات المنتجات
    sale.items.forEach(item => {
        const product = data.products.find(p => p.id === item.productId);
        if (product) {
            product.quantity -= item.quantity;
        }
    });
    
    data.sales.push(sale);
    
    if (writeData(data)) {
        res.json({ success: true, sale, message: 'تمت عملية البيع بنجاح' });
    } else {
        res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
    }
});

// حذف عملية بيع
app.delete('/api/sales/:id', (req, res) => {
    const data = readData();
    const saleId = parseInt(req.params.id);
    const index = data.sales.findIndex(s => s.id === saleId);
    
    if (index !== -1) {
        const deletedSale = data.sales.splice(index, 1)[0];
        
        if (writeData(data)) {
            res.json({ success: true, sale: deletedSale, message: 'تم حذف العملية بنجاح' });
        } else {
            res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
        }
    } else {
        res.status(404).json({ success: false, message: 'العملية غير موجودة' });
    }
});

// ============ الإعدادات ============

// الحصول على الإعدادات
app.get('/api/settings', (req, res) => {
    const data = readData();
    res.json({ success: true, settings: data.settings });
});

// تحديث الإعدادات
app.put('/api/settings', (req, res) => {
    const data = readData();
    data.settings = {
        ...data.settings,
        ...req.body
    };
    
    if (writeData(data)) {
        res.json({ success: true, settings: data.settings, message: 'تم تحديث الإعدادات بنجاح' });
    } else {
        res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
    }
});

// نقل البيانات من LocalStorage
app.post('/api/migrate', (req, res) => {
    const { products, sales } = req.body;
    const data = readData();
    
    if (products && Array.isArray(products)) {
        data.products = products;
    }
    if (sales && Array.isArray(sales)) {
        data.sales = sales;
    }
    
    if (writeData(data)) {
        res.json({ success: true, message: 'تم نقل البيانات بنجاح' });
    } else {
        res.status(500).json({ success: false, message: 'خطأ في نقل البيانات' });
    }
});

// بدء السيرفر
app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل على http://localhost:${PORT}`);
    console.log(`📁 قاعدة البيانات: ${DATA_FILE}`);
});
