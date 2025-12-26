// ============ Google Apps Script API ============
// رابط Web App من Google Apps Script
const APPS_SCRIPT_URL = 'ضع_هنا_رابط_Web_App_من_Google_Apps_Script';

// دالة مساعدة للطلبات
async function appsScriptRequest(action, data = {}) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                data: data
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('خطأ في الاتصال بـ Google Sheets:', error);
        showAlert('error', '❌ خطأ في الاتصال. تحقق من الإنترنت.');
        return { success: false, error: error.message };
    }
}

// ============ المنتجات API ============

async function loadProductsFromAPI() {
    const result = await appsScriptRequest('getProducts');
    if (result.success) {
        products = result.products || [];
        return products;
    }
    return [];
}

async function saveProductToAPI(product) {
    const result = await appsScriptRequest('addProduct', product);
    return result;
}

async function updateProductInAPI(productId, updates) {
    const result = await appsScriptRequest('updateProduct', {
        id: productId,
        updates: updates
    });
    return result;
}

async function deleteProductFromAPI(productId) {
    const result = await appsScriptRequest('deleteProduct', { id: productId });
    return result;
}

// ============ المبيعات API ============

async function loadSalesFromAPI() {
    const result = await appsScriptRequest('getSales');
    if (result.success) {
        sales = result.sales || [];
        return sales;
    }
    return [];
}

async function saveSaleToAPI(sale) {
    const result = await appsScriptRequest('addSale', sale);
    return result;
}

async function deleteSaleFromAPI(saleId) {
    const result = await appsScriptRequest('deleteSale', { id: saleId });
    return result;
}

// ============ الإعدادات API ============

async function loadSettingsFromAPI() {
    const result = await appsScriptRequest('getSettings');
    if (result.success) {
        return result.settings || {};
    }
    return {};
}

async function saveSettingsToAPI(settings) {
    const result = await appsScriptRequest('updateSettings', settings);
    return result;
}

// ============ ملء البيانات التجريبية ============

async function initializeSheets() {
    try {
        // 1. إضافة الإعدادات الافتراضية
        const defaultSettings = {
            userName: 'Admin',
            userRole: 'مدير النظام',
            storeName: 'قطع الغيار',
            shopName: 'محل قطع غيار الموتوسيكلات',
            shopAddress: 'القاهرة، مصر',
            shopPhone: '01234567890',
            currency: 'ج.م',
            taxRate: '0',
            installDate: new Date().toLocaleDateString('ar-EG')
        };
        
        await saveSettingsToAPI(defaultSettings);
        console.log('✅ تم إضافة الإعدادات');
        
        // 2. إضافة منتجات تجريبية
        const sampleProducts = [
            {
                name: 'إطار أمامي',
                barcode: '1001',
                description: 'إطار أمامي للموتوسيكل',
                purchasePrice: 150,
                sellingPrice: 200,
                quantity: 25,
                minStock: 5,
                category: 'إطارات',
                supplier: 'مورد 1'
            },
            {
                name: 'فرامل خلفية',
                barcode: '1002',
                description: 'فرامل خلفية أصلية',
                purchasePrice: 80,
                sellingPrice: 120,
                quantity: 15,
                minStock: 3,
                category: 'فرامل',
                supplier: 'مورد 2'
            },
            {
                name: 'زيت محرك',
                barcode: '1003',
                description: 'زيت محرك 10W-40',
                purchasePrice: 45,
                sellingPrice: 65,
                quantity: 50,
                minStock: 10,
                category: 'زيوت',
                supplier: 'مورد 1'
            },
            {
                name: 'شمعات احتراق',
                barcode: '1004',
                description: 'شمعات احتراق NGK',
                purchasePrice: 25,
                sellingPrice: 40,
                quantity: 30,
                minStock: 8,
                category: 'كهرباء',
                supplier: 'مورد 3'
            },
            {
                name: 'مرآة جانبية',
                barcode: '1005',
                description: 'مرآة جانبية يمين ويسار',
                purchasePrice: 35,
                sellingPrice: 55,
                quantity: 20,
                minStock: 5,
                category: 'إكسسوارات',
                supplier: 'مورد 2'
            }
        ];
        
        for (const product of sampleProducts) {
            await saveProductToAPI(product);
            console.log(`✅ تم إضافة: ${product.name}`);
        }
        
        showAlert('success', '🎉 تم ملء البيانات التجريبية بنجاح!');
        
        // إعادة تحميل البيانات
        await loadProductsFromAPI();
        displayProducts();
        displayPOSProducts();
        updateDashboard();
        
        return true;
    } catch (error) {
        console.error('خطأ في ملء البيانات:', error);
        showAlert('error', '❌ فشل في ملء البيانات');
        return false;
    }
}
