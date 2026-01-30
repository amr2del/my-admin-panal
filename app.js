// ============ حماية التطبيق - التحقق من تسجيل الدخول ============
window.addEventListener('DOMContentLoaded', async () => {
    // التحقق من تسجيل الدخول
    let isLoggedIn = false;
    let username = '';
    
    // في تطبيق Electron، استخدام IPC للتحقق من المستخدم الحالي
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getCurrentUser) {
        try {
            const currentUser = await window.electronAPI.getCurrentUser();
            if (currentUser) {
                isLoggedIn = true;
                username = currentUser.username;
                console.log('✅ المستخدم مسجل دخول:', username);
            } else {
                console.log('⚠️  لا يوجد مستخدم مسجل دخول');
            }
        } catch (error) {
            console.error('❌ خطأ في التحقق من المستخدم:', error);
        }
    } else {
        // في المتصفح، استخدام localStorage
        isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        username = localStorage.getItem('username') || '';
    }
    
    // إذا لم يكن المستخدم مسجل دخول، إعادة توجيهه لصفحة تسجيل الدخول
    if (!isLoggedIn) {
        console.log('❌ المستخدم غير مسجل دخول، إعادة التوجيه...');
        window.location.href = 'login.html';
        return;
    }
    
    // عرض اسم المستخدم في الهيدر
    if (username) {
        const userNameElements = document.querySelectorAll('#userName, .user-name');
        userNameElements.forEach(el => {
            el.textContent = username;
        });
    }
    
    console.log('✅ التطبيق جاهز للاستخدام');
});

// تسجيل الخروج
async function logout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        // في Electron، استخدام IPC
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.logout) {
            await window.electronAPI.logout();
        }
        
        // مسح localStorage أيضاً
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
        
        window.location.href = 'login.html';
    }
}

// ============ البيانات الأساسية ============

// تخزين البيانات (سيتم تحميلها من الباك اند)
let products = [];
let sales = [];

// دالة لتعطيل/تفعيل الأزرار أثناء العمليات
function setButtonLoading(button, isLoading, loadingText = 'جاري التنفيذ...') {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// Loading Progress Functions
function showLoading(message = 'جاري تحميل البيانات...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay.querySelector('.loading-text');
    const progressBar = document.getElementById('loadingProgressBar');
    
    if (text) text.textContent = message;
    if (progressBar) progressBar.style.width = '0%';
    
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
}

function updateLoadingProgress(percent) {
    const progressBar = document.getElementById('loadingProgressBar');
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('loadingProgressBar');
    
    if (progressBar) progressBar.style.width = '100%';
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 400);
    }, 300);
}

// تهيئة البيانات عند تحميل الصفحة
async function initializeApp() {
    showLoading('جاري تهيئة التطبيق...');
    updateLoadingProgress(10);
    
    // Hide sidebar on mobile by default
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('collapsed');
    }
    
    // إخفاء النوافذ المنبثقة بشكل صريح
    const addModal = document.getElementById('addProductModal');
    const editModal = document.getElementById('editProductModal');
    if (addModal) addModal.style.display = 'none';
    if (editModal) editModal.style.display = 'none';
    
    updateLoadingProgress(30);
    
    // ⚡ تحميل سريع من LocalStorage (فوري بدون انتظار)
    showLoading('جاري تحميل البيانات...');
    await quickLoadData();
    updateLoadingProgress(60);
    updateLoadingProgress(60);
    
    // تحميل بيانات features إذا كانت الدالة موجودة
    try {
        if (typeof initializeFeatures === 'function') {
            showLoading('جاري تحميل البيانات...');
            await initializeFeatures();
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
    updateLoadingProgress(80);
    
    // تحديث العرض
    showLoading('جاري تحديث واجهة المستخدم...');
    try {
        updateDashboard();
        displayProducts();
        displayPOSProducts(); // تحديث عرض الكاشير
        updateCapitalDisplay();
        updateAvatarDisplay();
    } catch (error) {
        console.error('خطأ في تحديث الواجهة:', error);
    }
    updateLoadingProgress(95);
    
    // إضافة بيانات تجريبية إذا كانت القائمة فارغة
    if (products.length === 0) {
        showAlert('success', '👋 مرحباً! ابدأ بإضافة منتجات من تبويب "إضافة منتج"');
    }
    
    // فحص المخزون المنخفض وتنبيه
    checkLowStockAlert();
    
    updateLoadingProgress(100);
    hideLoading();
    
    // � جدولة الرفع اليومي التلقائي لـ Google Sheets
    scheduleDailyBackup();
}

// تحميل التطبيق عند فتح الصفحة
window.addEventListener('DOMContentLoaded', initializeApp);

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    // On larger screens, remove collapsed class and hide overlay
    if (window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        // On mobile, ensure sidebar is collapsed by default
        sidebar.classList.add('collapsed');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const header = document.getElementById('header');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('collapsed');
    header.classList.toggle('full-width');
    mainContent.classList.toggle('full-width');
    
    // Show/hide overlay on mobile
    if (window.innerWidth <= 768) {
        overlay.classList.toggle('active');
        // Prevent body scroll when sidebar is open
        if (!sidebar.classList.contains('collapsed')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Close Sidebar (for mobile)
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.add('collapsed');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// عرض التبويب
async function showTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // عرض التبويب المطلوب
    document.getElementById(tabName).classList.add('active');
    
    // تحديث القائمة الجانبية لإظهار القسم النشط
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkOnClick = link.getAttribute('onclick');
        if (linkOnClick && linkOnClick.includes(`'${tabName}'`)) {
            link.classList.add('active');
        }
    });
    
    // Close sidebar on mobile after selecting a tab
    if (window.innerWidth <= 768) {
        closeSidebar();
    }

    // تحديث البيانات
    if (tabName === 'dashboard') {
        updateDashboard();
        updateCapitalDisplay();
    } else if (tabName === 'products') {
        displayProducts();
    } else if (tabName === 'sales') {
        // تأكد من تحميل المنتجات قبل عرض الكاشير
        if (products.length === 0) {
            await loadProductsFromAPI();
        }
        displayPOSProducts();
        displayCart();
        updateCapitalDisplay();
    } else if (tabName === 'reports') {
        updateReports();
    } else if (tabName === 'settings') {
        updateSettings();
    } else if (tabName === 'analytics') {
        if (typeof updateAnalytics === 'function') {
            updateAnalytics();
        }
    } else if (tabName === 'expenses') {
        if (typeof displayExpenses === 'function') {
            displayExpenses();
            updateExpenseStats();
        }
    } else if (tabName === 'customers') {
        if (typeof displayCustomers === 'function') {
            displayCustomers();
            updateCustomerStats();
        }
    } else if (tabName === 'suppliers') {
        if (typeof displaySuppliers === 'function') {
            displaySuppliers();
            updateSupplierStats();
        }
    } else if (tabName === 'debts') {
        if (typeof updateDebtsDisplay === 'function') {
            updateDebtsDisplay();
        }
    } else if (tabName === 'purchases') {
        if (typeof displayPurchaseInvoices === 'function') {
            displayPurchaseInvoices();
            updatePurchaseStats();
        }
    }
}

// إضافة منتج جديد
async function addProduct(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'جاري الإضافة...');

    const product = {
        name: document.getElementById('productName').value,
        barcode: document.getElementById('barcode').value,
        description: document.getElementById('description').value,
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
        sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
        quantity: parseInt(document.getElementById('quantity').value),
        minStock: parseInt(document.getElementById('minStock').value) || 3,
        category: document.getElementById('category').value,
        supplier: document.getElementById('supplier').value
    };

    // إضافة ID للمنتج
    product.id = Date.now();
    product.createdAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    
    // ✅ حفظ فوري في LocalStorage
    products.push(product);
    saveProductsLocally(products);
    
    console.log('💾 تم حفظ المنتج محلياً، جاري الرفع لـ Google Sheets...');
    
    setButtonLoading(submitBtn, false);
    showAlert('success', `✅ تم إضافة "${product.name}" بنجاح!`);
    document.getElementById('productForm').reset();
    displayProducts();
    updateDashboard();
    
    // 🌐 رفع للسحابة في الخلفية
    if (navigator.onLine) {
        saveProductToAPI(product).catch(() => {
            addPendingChange('product', 'add', product);
        });
    } else {
        addPendingChange('product', 'add', product);
    }
    
    // الانتقال لعرض المنتجات
    setTimeout(() => {
        showTab('products');
        document.querySelector('[onclick="showTab(\'products\')"]').classList.add('active');
    }, 500);
}

// عرض المنتجات
function displayProducts() {
    loadUserProfile(); // تحميل بيانات المستخدم
    updateCapitalDisplay(); // تحديث رأس المال
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-box" style="font-size: 48px; color: #cbd5e0;"></i></div>
                <h3>لا توجد منتجات بعد</h3>
                <p>ابدأ بإضافة منتج من تبويب "إضافة منتج"</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const stockStatus = product.quantity <= 0 ? 'danger' : 
                          product.quantity <= product.minStock ? 'warning' : 'success';
        const stockBadge = product.quantity <= 0 ? 'نفذ' : 
                          product.quantity <= product.minStock ? 'منخفض' : 'متوفر';
        const profit = (product.sellingPrice || 0) - (product.purchasePrice || 0);
        
        return `
        <div class="product-card" style="padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; flex-direction: column; gap: 10px; min-height: 180px;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px;">
                <div style="flex: 1; min-width: 0;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</h3>
                    ${product.barcode ? `<p style="margin: 3px 0 0; color: #94a3b8; font-size: 10px;"><i class="fas fa-barcode"></i> ${product.barcode}</p>` : ''}
                </div>
                <span class="badge-${stockStatus}" style="font-size: 9px; padding: 3px 6px; border-radius: 4px; white-space: nowrap;">${stockBadge}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-cubes" style="color: #6366f1; font-size: 10px;"></i>
                    <span style="color: ${product.quantity <= product.minStock ? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">${product.quantity}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; min-width: 0;">
                    <i class="fas fa-layer-group" style="color: #8b5cf6; font-size: 10px;"></i>
                    <span style="color: #64748b; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.category || '-'}</span>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 8px; border-radius: 6px; flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #64748b;">شراء:</span>
                    <span style="font-size: 11px; color: #1e293b; font-weight: 600;">${(product.purchasePrice || 0).toFixed(0)}ج</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #64748b;">بيع:</span>
                    <span style="font-size: 11px; color: var(--success); font-weight: 600;">${(product.sellingPrice || 0).toFixed(0)}ج</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 4px; border-top: 1px solid #e2e8f0;">
                    <span style="font-size: 10px; color: #64748b;">ربح:</span>
                    <span style="font-size: 11px; color: ${profit > 0 ? 'var(--primary)' : '#ef4444'}; font-weight: 700;">${profit.toFixed(0)}ج</span>
                </div>
            </div>

            <div style="display: flex; gap: 4px; margin-top: auto;">
                <button class="btn btn-primary" onclick="editProduct(${product.id})" style="flex: 1; height: 30px; font-size: 11px; padding: 0 8px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <i class="fas fa-edit"></i>
                    <span>تعديل</span>
                </button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})" style="width: 30px; height: 30px; padding: 0; font-size: 11px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

// تصفية المنتجات
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        (p.barcode && p.barcode.includes(searchTerm)) ||
        (p.category && p.category.toLowerCase().includes(searchTerm))
    );

    const container = document.getElementById('productsList');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-search" style="font-size: 48px; color: #cbd5e0;"></i></div>
                <h3>لا توجد نتائج</h3>
                <p>لم نجد منتجات تطابق بحثك</p>
            </div>
        `;
        return;
    }

    // نفس كود displayProducts لكن بـ filtered
    container.innerHTML = filtered.map(product => `
        <div class="card">
            <h3>${product.name}</h3>
            ${product.barcode ? `<p style="color: #999; margin-bottom: 10px;">باركود: ${product.barcode}</p>` : ''}
            
            <div class="card-info">
                <span class="card-label">التصنيف:</span>
                <span class="card-value">${product.category || 'غير محدد'}</span>
            </div>
            
            <div class="card-info">
                <span class="card-label">الكمية:</span>
                <span class="card-value" style="color: ${product.quantity <= product.minStock ? '#f56565' : '#48bb78'}; font-weight: bold;">
                    ${product.quantity} قطعة
                </span>
            </div>
            
            <div class="card-info">
                <span class="card-label">سعر البيع:</span>
                <span class="card-value" style="color: #48bb78; font-weight: bold;">${(product.sellingPrice || 0).toFixed(2)} ج.م</span>
            </div>

            <div class="product-actions">
                <button class="btn btn-success" onclick="sellProduct(${product.id})"><i class="fas fa-shopping-cart"></i> بيع</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i> حذف</button>
            </div>
        </div>
    `).join('');
}

// حذف منتج
async function deleteProduct(id) {
    if (await customConfirm('سيتم حذف هذا المنتج نهائياً من النظام', 'حذف المنتج', 'danger')) {
        // ✅ حذف من SQLite أولاً
        if (typeof window.db !== 'undefined') {
            await window.db.deleteProduct(id);
        }
        
        // ✅ حذف من LocalStorage
        products = products.filter(p => p.id !== id);
        saveProductsLocally(products);
        
        showAlert('success', '✅ تم حذف المنتج بنجاح');
        displayProducts();
        if (typeof displayPOSProducts === 'function') displayPOSProducts();
        updateDashboard();
        updateCapitalDisplay();
        
        // 🌐 حذف من السحابة في الخلفية
        if (navigator.onLine && typeof deleteProductFromAPI === 'function') {
            deleteProductFromAPI(id).catch(() => {
                console.warn('❌ فشل رفع الحذف للسحابة');
            });
        }
    }
}

// بيع منتج
async function sellProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (product.quantity <= 0) {
        showAlert('error', '❌ المنتج غير متوفر في المخزون');
        return;
    }

    const quantity = prompt(`كم قطعة تريد بيعها من "${product.name}"؟ (متوفر: ${product.quantity})`, '1');
    if (!quantity || quantity <= 0) return;

    const qty = parseInt(quantity);
    if (qty > product.quantity) {
        showAlert('error', '❌ الكمية المطلوبة أكبر من المتوفر');
        return;
    }

    // تحديث الكمية محلياً
    product.quantity -= qty;
    product.updatedAt = new Date().toISOString();
    saveProductsLocally(products);
    
    // إضافة عملية البيع
    const sale = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: product.sellingPrice,
        cost: product.purchasePrice,
        total: product.sellingPrice * qty,
        profit: (product.sellingPrice - product.purchasePrice) * qty,
        date: new Date().toISOString()
    };
    
    // ✅ حفظ البيع محلياً
    sales.push(sale);
    saveSalesLocally(sales);
    
    showAlert('success', `✅ تم بيع ${qty} قطعة من "${product.name}" بقيمة ${sale.total} ج.م`);
    displayProducts();
    updateDashboard();
    
    // 🌐 رفع للسحابة في الخلفية
    if (navigator.onLine) {
        Promise.all([
            updateProductInAPI(product.id, { quantity: product.quantity }),
            saveSaleToAPI(sale)
        ]).catch(() => {
            addPendingChange('product', 'update', product);
            addPendingChange('sale', 'add', sale);
        });
    } else {
        addPendingChange('product', 'update', product);
        addPendingChange('sale', 'add', sale);
    }
}

// تحديث لوحة التحكم
function updateDashboard() {
    // الحصول على البيانات المحفوظة من اليوم السابق
    const yesterdayData = JSON.parse(localStorage.getItem('yesterdayStats') || '{}');
    const today = new Date().toDateString();
    
    // إجمالي المنتجات
    const totalProductsCount = products.length;
    document.getElementById('totalProducts').textContent = totalProductsCount;
    
    // حساب نسبة التغيير في عدد المنتجات
    if (yesterdayData.totalProducts) {
        const productChange = ((totalProductsCount - yesterdayData.totalProducts) / yesterdayData.totalProducts * 100).toFixed(1);
        updateTrendIndicator('productsTrend', 'productsTrendIcon', 'productsTrendValue', productChange);
    }

    // قيمة المخزون
    const totalValue = products.reduce((sum, p) => {
        const price = parseFloat(p.sellingPrice) || 0;
        const qty = parseFloat(p.quantity) || 0;
        return sum + (price * qty);
    }, 0);
    document.getElementById('totalValue').textContent = totalValue.toFixed(2) + ' ج.م';
    
    // حساب نسبة التغيير في قيمة المخزون
    if (yesterdayData.totalValue) {
        const valueChange = ((totalValue - yesterdayData.totalValue) / yesterdayData.totalValue * 100).toFixed(1);
        updateTrendIndicator('inventoryValueTrend', 'inventoryValueTrendIcon', 'inventoryValueTrendValue', valueChange);
    }

    // المنتجات المنخفضة
    const lowStock = products.filter(p => p.quantity <= p.minStock);
    const lowStockCount = lowStock.length;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    
    // تحديث عدد المنتجات المنخفضة في المؤشر
    const lowStockTrendValue = document.getElementById('lowStockTrendValue');
    if (lowStockTrendValue) lowStockTrendValue.textContent = lowStockCount;
    
    // تحديث اتجاه المنتجات المنخفضة
    if (yesterdayData.lowStockCount !== undefined) {
        const lowStockChange = lowStockCount - yesterdayData.lowStockCount;
        const lowStockTrendEl = document.getElementById('lowStockTrend');
        const lowStockTrendIcon = document.getElementById('lowStockTrendIcon');
        
        if (lowStockTrendEl && lowStockTrendIcon) {
            if (lowStockChange > 0) {
                lowStockTrendEl.className = 'stat-trend down';
                lowStockTrendIcon.className = 'fas fa-arrow-up';
            } else if (lowStockChange < 0) {
                lowStockTrendEl.className = 'stat-trend up';
                lowStockTrendIcon.className = 'fas fa-arrow-down';
            }
        }
    }

    // مبيعات اليوم
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
    document.getElementById('todaySales').textContent = todaySalesTotal.toFixed(2) + ' ج.م';
    
    // حساب نسبة التغيير في المبيعات
    if (yesterdayData.todaySales) {
        const salesChange = yesterdayData.todaySales > 0 
            ? ((todaySalesTotal - yesterdayData.todaySales) / yesterdayData.todaySales * 100).toFixed(1)
            : (todaySalesTotal > 0 ? 100 : 0);
        updateTrendIndicator('salesTodayTrend', 'salesTodayTrendIcon', 'salesTodayTrendValue', salesChange);
    }

    // حساب العملاء (من features.js)
    const customers = window.customers || [];
    const totalCustomers = customers.length;
    const dashTotalCustomersEl = document.getElementById('dashTotalCustomers');
    if (dashTotalCustomersEl) dashTotalCustomersEl.textContent = totalCustomers;

    // حساب المصروفات اليوم
    const expenses = window.expenses || [];
    const todayExpenses = expenses.filter(e => {
        if (!e.date) return false;
        try {
            return new Date(e.date).toDateString() === today;
        } catch (err) {
            return false;
        }
    });
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const dashExpensesEl = document.getElementById('dashExpensesToday');
    if (dashExpensesEl) dashExpensesEl.textContent = todayExpensesTotal.toFixed(2) + ' ج.م';

    // 💰 حساب مكسب رأس المال (الفرق بين سعر البيع والشراء فقط)
    const todayCapitalGain = todaySales.reduce((sum, sale) => {
        // التحقق من وجود items
        if (!sale.items || !Array.isArray(sale.items)) {
            console.warn('⚠️ المبيعة لا تحتوي على items:', sale.id);
            return sum;
        }
        
        return sum + sale.items.reduce((itemSum, item) => {
            // استخدام purchasePrice المحفوظ في item أولاً
            let purchasePrice = item.purchasePrice || item.cost || 0;
            
            // إذا purchasePrice = 0، حاول البحث عن المنتج
            if (purchasePrice === 0) {
                console.log(`🔎 البحث عن المنتج لـ ${item.name}`);
                console.log(`   - item.productId: ${item.productId}`);
                console.log(`   - item.id: ${item.id}`);
                console.log(`   - عدد المنتجات المتاحة: ${products.length}`);
                
                const product = products.find(p => {
                    const match = p.id === (item.productId || item.id) || 
                                  p.id === item.name || 
                                  p.name === item.name;
                    if (match) {
                        console.log(`   ✅ وجدنا المنتج: ${p.name} (ID: ${p.id})`);
                    }
                    return match;
                });
                
                if (product) {
                    purchasePrice = product.purchasePrice || product.cost || 0;
                    console.log(`   📌 استرجاع سعر الشراء من المنتج: ${purchasePrice} ج.م`);
                } else {
                    console.log(`   ❌ لم نجد المنتج في قائمة المنتجات!`);
                    if (products.length > 0) {
                        console.log(`   📋 المنتجات المتاحة:`, products.map(p => `${p.name} (${p.id})`));
                    }
                }
            }
            
            const sellingPrice = item.sellingPrice || item.price || 0;
            const profit = (sellingPrice - purchasePrice) * item.quantity;
            
            // عرض التفاصيل الكاملة للتحقق
            console.log(`🔍 تحليل ${item.name}:`);
            console.log(`   - سعر البيع: ${sellingPrice} ج.م`);
            console.log(`   - سعر الشراء: ${purchasePrice} ج.م`);
            console.log(`   - الكمية: ${item.quantity}`);
            console.log(`   - المكسب: (${sellingPrice} - ${purchasePrice}) × ${item.quantity} = ${profit.toFixed(2)} ج.م`);
            
            return itemSum + profit;
        }, 0);
    }, 0);
    
    console.log(`✅ إجمالي مكسب رأس المال اليوم: ${todayCapitalGain.toFixed(2)} ج.م`);
    
    const dashCapitalGainEl = document.getElementById('dashCapitalGain');
    if (dashCapitalGainEl) {
        dashCapitalGainEl.textContent = todayCapitalGain.toFixed(2) + ' ج.م';
        
        // تغيير لون البطاقة حسب المكسب
        const capitalCard = dashCapitalGainEl.closest('.stat-card');
        if (capitalCard) {
            if (todayCapitalGain < 0) {
                capitalCard.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            } else if (todayCapitalGain === 0) {
                capitalCard.style.background = 'linear-gradient(135deg, #64748b, #475569)';
            } else {
                capitalCard.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
            }
        }
    }

    // حساب صافي الربح (مبيعات اليوم - مصروفات اليوم)
    const netProfit = todaySalesTotal - todayExpensesTotal;
    const netProfitElement = document.getElementById('dashNetProfit');
    if (netProfitElement) {
        netProfitElement.textContent = netProfit.toFixed(2) + ' ج.م';
        
        // تغيير لون البطاقة حسب الربح
        const profitCard = netProfitElement.closest('.stat-card');
        if (profitCard) {
            if (netProfit < 0) {
                profitCard.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            } else if (netProfit === 0) {
                profitCard.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            } else {
                profitCard.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            }
        }
    }

    // حساب الديون
    const debts = window.debts || [];
    const totalDebts = debts.reduce((sum, d) => sum + (parseFloat(d.remainingAmount) || 0), 0);
    const dashDebtsEl = document.getElementById('dashTotalDebts');
    if (dashDebtsEl) dashDebtsEl.textContent = totalDebts.toFixed(2) + ' ج.م';

    // عرض المنتجات المنخفضة
    const lowStockContainer = document.getElementById('lowStockProducts');
    if (lowStock.length === 0) {
        lowStockContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-box-open" style="color: var(--success);"></i></div>
                <h3>رائع! جميع المنتجات متوفرة</h3>
                <p style="color: #64748b;">لا توجد منتجات تحتاج إلى إعادة تخزين</p>
            </div>
        `;
    } else {
        lowStockContainer.innerHTML = lowStock.map(product => `
            <div class="product-card" style="border-color: var(--danger);">
                <div class="product-header">
                    <h3 class="product-title" style="color: var(--danger);">
                        <i class="fas fa-exclamation-circle"></i> ${product.name}
                    </h3>
                    <span class="product-badge badge-danger">
                        ${product.quantity} قطعة متبقية
                    </span>
                </div>
                <div class="card-info">
                    <span class="card-label">الكمية المتبقية:</span>
                    <span class="card-value" style="color: var(--danger); font-weight: bold;">
                        ${product.quantity} قطعة
                    </span>
                </div>
                <div class="card-info">
                    <span class="card-label">الحد الأدنى:</span>
                    <span class="card-value">${product.minStock} قطعة</span>
                </div>
                <button class="btn btn-primary" onclick="showTab('products')" style="margin-top: 15px; width: 100%;">
                    <i class="fas fa-box"></i> إدارة المنتج
                </button>
            </div>
        `).join('');
    }

    // عرض آخر المبيعات
    displayRecentSalesInDashboard();
    
    // تحديث عداد التنبيهات
    document.getElementById('notificationCount').textContent = lowStock.length;
    
    // حفظ بيانات اليوم للمقارنة غداً
    saveTodayStats(totalProductsCount, totalValue, todaySalesTotal, lowStockCount);
}

// دالة لتحديث مؤشر الاتجاه
function updateTrendIndicator(trendId, iconId, valueId, changePercent) {
    const trendElement = document.getElementById(trendId);
    const iconElement = document.getElementById(iconId);
    const valueElement = document.getElementById(valueId);
    
    if (!trendElement || !iconElement || !valueElement) return;
    
    const change = parseFloat(changePercent);
    
    if (change > 0) {
        trendElement.className = 'stat-trend up';
        iconElement.className = 'fas fa-arrow-up';
        valueElement.textContent = change + '%';
    } else if (change < 0) {
        trendElement.className = 'stat-trend down';
        iconElement.className = 'fas fa-arrow-down';
        valueElement.textContent = Math.abs(change) + '%';
    } else {
        // عرض 0% بدلاً من الإخفاء
        trendElement.className = 'stat-trend';
        iconElement.className = 'fas fa-minus';
        valueElement.textContent = '0%';
    }
}

// دالة لحفظ بيانات اليوم
function saveTodayStats(totalProducts, totalValue, todaySales, lowStockCount) {
    const lastSaveDate = localStorage.getItem('lastStatsSaveDate');
    const today = new Date().toDateString();
    
    // إذا كان يوم جديد، احفظ بيانات الأمس
    if (lastSaveDate && lastSaveDate !== today) {
        const currentStats = JSON.parse(localStorage.getItem('currentStats') || '{}');
        localStorage.setItem('yesterdayStats', JSON.stringify(currentStats));
    }
    
    // احفظ البيانات الحالية
    localStorage.setItem('currentStats', JSON.stringify({
        totalProducts,
        totalValue,
        todaySales,
        lowStockCount
    }));
    localStorage.setItem('lastStatsSaveDate', today);
}

// عرض آخر المبيعات في لوحة التحكم
function displayRecentSalesInDashboard() {
    const recentSalesContainer = document.getElementById('recentSales');
    if (!recentSalesContainer) return;

    console.log('عدد المبيعات الكلي:', sales.length);
    console.log('بيانات المبيعات:', sales);

    // آخر 5 مبيعات (نفس كود التقارير)
    const recentSales = sales.slice().reverse().slice(0, 5);

    console.log('آخر 5 مبيعات:', recentSales);

    if (recentSales.length === 0) {
        recentSalesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>لا توجد مبيعات بعد</h3>
                <p style="color: #64748b;">ستظهر هنا آخر 5 مبيعات تمت</p>
            </div>
        `;
        return;
    }

    recentSalesContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--light); border-bottom: 2px solid var(--primary);">
                    <th style="padding: 12px; text-align: right;">رقم الفاتورة</th>
                    <th style="padding: 12px; text-align: right;">التاريخ</th>
                    <th style="padding: 12px; text-align: right;">العميل</th>
                    <th style="padding: 12px; text-align: right;">الأصناف</th>
                    <th style="padding: 12px; text-align: right;">المبلغ</th>
                </tr>
            </thead>
            <tbody>
                ${recentSales.map(sale => `
                    <tr style="border-bottom: 1px solid var(--light); transition: background-color 0.2s;">
                        <td style="padding: 12px; font-weight: 600; color: var(--primary);">#${sale.id}</td>
                        <td style="padding: 12px; font-size: 13px; color: #64748b;">${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
                        <td style="padding: 12px;">${sale.customer || 'عميل نقدي'}</td>
                        <td style="padding: 12px;">${sale.items.length} منتج</td>
                        <td style="padding: 12px; font-weight: 700; color: var(--success); font-size: 16px;">${sale.total.toFixed(2)} ج.م</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// حساب الوقت المنقضي
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG');
}

// عرض رسالة تنبيه
function showAlert(type, message) {
    const alertType = type === 'success' ? 'successAlert' : type === 'warning' ? 'warningAlert' : 'errorAlert';
    const alert = document.getElementById(alertType);
    if (!alert) return;
    
    alert.textContent = message;
    alert.classList.add('show');
    
    // إخفاء الرسالة بعد 4 ثواني
    setTimeout(() => {
        alert.classList.remove('show');
    }, 4000);
}

// Custom Confirm Dialog
function customConfirm(message, title = 'تأكيد الإجراء', type = 'danger') {
    return new Promise((resolve) => {
        const confirmDialog = document.getElementById('customConfirm');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmIcon = document.getElementById('confirmIcon');
        const confirmHeader = document.getElementById('confirmHeader');
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');
        
        // تعيين المحتوى
        confirmMessage.textContent = message;
        confirmTitle.textContent = title;
        
        // تعيين النوع والأيقونة
        confirmHeader.className = 'confirm-header';
        if (type === 'warning') {
            confirmHeader.classList.add('warning');
            confirmIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        } else if (type === 'info') {
            confirmHeader.classList.add('info');
            confirmIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
        } else {
            confirmIcon.innerHTML = '<i class="fas fa-trash-alt"></i>';
        }
        
        // عرض النافذة
        confirmDialog.classList.add('active');
        
        // معالجة الأزرار
        const handleYes = () => {
            confirmDialog.classList.remove('active');
            cleanup();
            resolve(true);
        };
        
        const handleNo = () => {
            confirmDialog.classList.remove('active');
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            confirmYes.removeEventListener('click', handleYes);
            confirmNo.removeEventListener('click', handleNo);
        };
        
        confirmYes.addEventListener('click', handleYes);
        confirmNo.addEventListener('click', handleNo);
        
        // إغلاق عند الضغط على الخلفية
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                handleNo();
            }
        });
    });
}

// ===== POS Functions =====
let cart = [];

// متغير لحفظ وضع العرض (جدول أو كاردز)
let posViewMode = localStorage.getItem('posViewMode') || 'cards'; // 'table' or 'cards'

function togglePOSView() {
    posViewMode = posViewMode === 'table' ? 'cards' : 'table';
    localStorage.setItem('posViewMode', posViewMode);
    displayPOSProducts();
    
    // تحديث أيقونة الزر
    const btn = document.getElementById('toggleViewBtn');
    if (btn) {
        btn.innerHTML = posViewMode === 'table' 
            ? '<i class="fas fa-th-large"></i> كاردز' 
            : '<i class="fas fa-table"></i> جدول';
    }
}

function displayPOSProducts() {
    const container = document.getElementById('posProductsList');
    if (!container) {
        console.error('❌ عنصر posProductsList غير موجود!');
        return;
    }
    
    const countElement = document.getElementById('productsCount');
    const availableProducts = products.filter(p => p.quantity > 0);
    
    if (countElement) {
        countElement.innerHTML = `<i class="fas fa-cube"></i> ${availableProducts.length} منتج`;
    }
    
    if (availableProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-box" style="font-size: 48px; color: #cbd5e0;"></i></div>
                <h3 style="color: #64748b; margin-bottom: 10px;">لا توجد منتجات متاحة</h3>
                <p style="color: #94a3b8; margin-bottom: 20px;">قم بإضافة منتجات لبدء البيع</p>
                <button class="btn btn-primary" onclick="showTab('products')">
                    <i class="fas fa-plus"></i> أضف منتجات
                </button>
            </div>
        `;
        return;
    }
    
    // عرض جدول أو كاردز حسب الوضع
    if (posViewMode === 'table') {
        displayPOSProductsTable(availableProducts, container);
    } else {
        displayPOSProductsCards(availableProducts, container);
    }
}

// عرض جدول
function displayPOSProductsTable(products, container) {
    container.innerHTML = `
        <div style="overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <th style="padding: 12px 8px; text-align: right; font-weight: 600; border-bottom: 2px solid #e2e8f0;">
                            <i class="fas fa-box"></i> المنتج
                        </th>
                        <th style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #e2e8f0;">
                            <i class="fas fa-barcode"></i> باركود
                        </th>
                        <th style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #e2e8f0;">
                            <i class="fas fa-layer-group"></i> التصنيف
                        </th>
                        <th style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #e2e8f0;">
                            <i class="fas fa-cubes"></i> الكمية
                        </th>
                        <th style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #e2e8f0;">
                            <i class="fas fa-coins"></i> السعر
                        </th>
                        <th style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #e2e8f0; width: 100px;">
                            <i class="fas fa-shopping-cart"></i> إضافة
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map((product, index) => {
                        const inCart = cart.find(item => item.id === product.id);
                        const stockStatus = product.quantity <= product.minStock ? 'warning' : 'success';
                        const rowBg = index % 2 === 0 ? '#f8fafc' : 'white';
                        
                        return `
                            <tr style="background: ${rowBg}; border-bottom: 1px solid #e2e8f0; transition: all 0.2s;" 
                                onmouseover="this.style.background='#f1f5f9'" 
                                onmouseout="this.style.background='${rowBg}'">
                                <td style="padding: 10px 8px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                                            <i class="fas fa-box"></i>
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; color: #1e293b;">${product.name}</div>
                                            ${inCart ? '<span style="font-size: 10px; color: #10b981; font-weight: 600;"><i class="fas fa-check-circle"></i> في السلة</span>' : ''}
                                        </div>
                                    </div>
                                </td>
                                <td style="padding: 10px 8px; text-align: center; color: #64748b; font-family: monospace;">
                                    ${product.barcode || '-'}
                                </td>
                                <td style="padding: 10px 8px; text-align: center;">
                                    <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 11px; color: #64748b;">
                                        ${product.category || '-'}
                                    </span>
                                </td>
                                <td style="padding: 10px 8px; text-align: center;">
                                    <span style="font-weight: 600; color: ${stockStatus === 'warning' ? 'var(--warning)' : 'var(--success)'}; font-size: 14px;">
                                        ${product.quantity}
                                    </span>
                                </td>
                                <td style="padding: 10px 8px; text-align: center;">
                                    <span style="font-weight: 700; color: var(--primary); font-size: 15px;">
                                        ${(product.sellingPrice || 0).toFixed(0)}ج
                                    </span>
                                </td>
                                <td style="padding: 10px 8px; text-align: center;">
                                    <button onclick="addToCart(${product.id})" 
                                            style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 4px rgba(16,185,129,0.3);" 
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(16,185,129,0.4)'" 
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(16,185,129,0.3)'">
                                        <i class="fas fa-plus"></i> إضافة
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// عرض كاردز محسّن
function displayPOSProductsCards(products, container) {
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; padding: 4px;">
            ${products.map(product => {
                const inCart = cart.find(item => item.id === product.id);
                const stockStatus = product.quantity <= product.minStock ? 'warning' : 'success';
                const profit = (product.sellingPrice || 0) - (product.purchasePrice || 0);
                
                return `
                    <div onclick="addToCart(${product.id})" 
                         style="background: white; border-radius: 12px; padding: 12px; border: 2px solid ${inCart ? '#10b981' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.1); hover: transform: translateY(-4px); hover: box-shadow: 0 4px 12px rgba(0,0,0,0.15);" 
                         onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'; this.style.borderColor='#667eea'" 
                         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'; this.style.borderColor='${inCart ? '#10b981' : '#e2e8f0'}'">
                        
                        ${inCart ? '<div style="position: absolute; top: 8px; left: 8px; background: #10b981; color: white; padding: 3px 6px; border-radius: 6px; font-size: 9px; font-weight: 600;"><i class="fas fa-check"></i></div>' : ''}
                        
                        <div style="width: 50px; height: 50px; margin: 0 auto 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">
                            <i class="fas fa-box"></i>
                        </div>
                        
                        <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #1e293b; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${product.name}">
                            ${product.name}
                        </h4>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px; background: #f8fafc; border-radius: 8px;">
                            <div style="text-align: center; flex: 1;">
                                <div style="font-size: 9px; color: #64748b; margin-bottom: 2px;">الكمية</div>
                                <div style="font-size: 13px; font-weight: 700; color: ${stockStatus === 'warning' ? 'var(--warning)' : 'var(--success)'};">${product.quantity}</div>
                            </div>
                            <div style="width: 1px; height: 30px; background: #e2e8f0;"></div>
                            <div style="text-align: center; flex: 1;">
                                <div style="font-size: 9px; color: #64748b; margin-bottom: 2px;">ربح</div>
                                <div style="font-size: 12px; font-weight: 600; color: var(--primary);">${profit.toFixed(0)}ج</div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px; border-radius: 8px; color: white;">
                            <div style="font-size: 10px; opacity: 0.9; margin-bottom: 2px;">سعر البيع</div>
                            <div style="font-size: 16px; font-weight: 700;">${(product.sellingPrice || 0).toFixed(0)}<span style="font-size: 11px;">ج</span></div>
                        </div>
                        
                        ${product.category ? `<div style="text-align: center; margin-top: 6px; font-size: 10px; color: #64748b;"><i class="fas fa-tag"></i> ${product.category}</div>` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function filterPOSProducts() {
    const searchTerm = document.getElementById('posSearch').value.toLowerCase();
    const container = document.getElementById('posProductsList');
    const countElement = document.getElementById('productsCount');
    
    const availableProducts = products.filter(p => 
        p.quantity > 0 && 
        (p.name.toLowerCase().includes(searchTerm) || 
         p.barcode.toLowerCase().includes(searchTerm) ||
         (p.category && p.category.toLowerCase().includes(searchTerm)))
    );
    
    if (countElement) {
        countElement.textContent = `${availableProducts.length} منتج`;
    }
    
    if (availableProducts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-search" style="font-size: 48px; color: #cbd5e1; margin-bottom: 15px;"></i>
                <p style="color: #64748b; font-size: 15px; margin: 0;">لا توجد نتائج للبحث "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = availableProducts.map(product => {
        const stockStatus = product.quantity <= 0 ? 'نفذ' : product.quantity <= product.minStock ? 'منخفض' : 'متوفر';
        const stockColor = product.quantity <= 0 ? 'var(--danger)' : product.quantity <= product.minStock ? 'var(--warning)' : 'var(--success)';
        const isOutOfStock = product.quantity <= 0;
        
        // حساب الربح المتوقع
        const expectedProfit = (product.sellingPrice - product.purchasePrice) || 0;
        const profitPercentage = product.purchasePrice > 0 ? ((expectedProfit / product.purchasePrice) * 100).toFixed(0) : 0;
        
        // الحصول على المنتج في السلة
        const inCart = cart.find(item => item.id === product.id);
        
        return `
        <div class="product-card-pro ${isOutOfStock ? 'out-of-stock' : ''} ${inCart ? 'in-cart' : ''}">
            ${inCart ? '<div class="cart-indicator"><i class="fas fa-check-circle"></i> في السلة</div>' : ''}
            
            <div class="product-image-placeholder">
                <i class="fas fa-box-open"></i>
            </div>
            
            <div class="product-details-pro">
                <h4 class="product-name-pro">${product.name}</h4>
                
                ${product.description ? `<p class="product-desc-pro">${product.description.substring(0, 60)}${product.description.length > 60 ? '...' : ''}</p>` : ''}
                
                <div class="product-meta-pro">
                    ${product.barcode ? `
                    <div class="meta-item">
                        <i class="fas fa-barcode"></i>
                        <span>${product.barcode}</span>
                    </div>
                    ` : ''}
                    ${product.category ? `
                    <div class="meta-item category">
                        <i class="fas fa-tag"></i>
                        <span>${product.category}</span>
                    </div>
                    ` : ''}
                    ${product.supplier ? `
                    <div class="meta-item">
                        <i class="fas fa-truck"></i>
                        <span>${product.supplier}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="product-stock-info">
                    <div class="stock-badge-pro" style="background: ${stockColor};">
                        <i class="fas fa-${product.quantity <= 0 ? 'times-circle' : product.quantity <= product.minStock ? 'exclamation-triangle' : 'check-circle'}"></i>
                        <span>${product.quantity} قطعة ${stockStatus}</span>
                    </div>
                    ${product.minStock ? `<div class="min-stock-info">الحد الأدنى: ${product.minStock}</div>` : ''}
                </div>
                
                <div class="product-pricing-pro">
                    <div class="price-main">
                        <span class="price-label">سعر البيع</span>
                        <span class="price-value">${(product.sellingPrice || 0).toFixed(0)} ج.م</span>
                    </div>
                    ${expectedProfit > 0 ? `
                    <div class="price-profit">
                        <span class="profit-badge">
                            <i class="fas fa-chart-line"></i>
                            ربح ${expectedProfit.toFixed(0)} ج.م (${profitPercentage}%)
                        </span>
                    </div>
                    ` : ''}
                </div>
                
                <button class="btn-add-to-cart-pro ${isOutOfStock ? 'disabled' : ''} ${inCart ? 'in-cart-btn' : ''}" 
                        onclick="${!isOutOfStock ? `addToCart(${product.id}); event.stopPropagation();` : ''}" 
                        ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fas fa-${isOutOfStock ? 'ban' : inCart ? 'check' : 'cart-plus'}"></i>
                    <span>${isOutOfStock ? 'نفذ من المخزون' : inCart ? `في السلة (${inCart.quantity})` : 'أضف للسلة'}</span>
                </button>
            </div>
        </div>
    `}).join('');
}

function addToCart(productId) {
    // البحث عن المنتج بدون تحديد نوع المعرف (string أو number)
    const product = products.find(p => p.id == productId); // استخدام == بدلاً من === للمقارنة المرنة
    
    if (!product) {
        console.error(`❌ المنتج غير موجود: ${productId}`, {
            searchId: productId,
            searchIdType: typeof productId,
            availableProducts: products.map(p => ({ id: p.id, idType: typeof p.id, name: p.name }))
        });
        showAlert('error', '❌ المنتج غير موجود!');
        return;
    }
    
    if (product.quantity <= 0) {
        showAlert('error', '❌ المنتج نفذ من المخزون!');
        return;
    }
    
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.quantity < product.quantity) {
            cartItem.quantity++;
            showAlert('success', `✅ تم زيادة الكمية: ${product.name} (${cartItem.quantity})`);
        } else {
            showAlert('error', `⚠️ الكمية المتاحة: ${product.quantity} فقط!`);
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.sellingPrice,
            quantity: 1,
            maxQuantity: product.quantity
        });
        showAlert('success', `✅ ${product.name} • ${product.sellingPrice.toFixed(0)} ج.م`);
    }
    
    displayCart();
    
    // تأثير بصري على زر السلة
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.style.transform = 'scale(1.3)';
        setTimeout(() => cartCountEl.style.transform = 'scale(1)', 200);
    }
}

function displayCart() {
    const container = document.getElementById('cartItems');
    
    // تحديث فوري لعدد السلة
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
        // تأثير بصري
        cartCountEl.style.transform = 'scale(1.2)';
        setTimeout(() => cartCountEl.style.transform = 'scale(1)', 200);
    }
    
    // إعادة رسم المنتجات لتحديث حالة "في السلة"
    if (typeof displayPOSProducts === 'function') {
        displayPOSProducts();
    }
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3 style="color: #64748b; margin: 0 0 8px 0; font-size: 16px;">السلة فارغة</h3>
                <p style="color: #94a3b8; margin: 0; font-size: 14px;">اختر منتجات من القائمة</p>
            </div>
        `;
        document.getElementById('cartCount').textContent = '0';
        updateCartTotal();
        return;
    }
    
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        const product = products.find(p => p.id === item.id);
        const itemProfit = product ? (item.price - product.purchasePrice) * item.quantity : 0;
        
        return `
        <div class="cart-item">
            <div class="cart-item-header">
                <div class="cart-item-info">
                    <div class="cart-item-name">
                        <i class="fas fa-box"></i>
                        ${item.name}
                    </div>
                    <div class="cart-item-meta">
                        <span class="cart-unit-price">${item.price.toFixed(0)} ج.م × ${item.quantity}</span>
                        ${itemProfit > 0 ? `<span class="cart-profit-tag"><i class="fas fa-chart-line"></i> +${itemProfit.toFixed(0)} ربح</span>` : ''}
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="حذف من السلة">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="cart-item-footer">
                <div class="cart-item-quantity">
                    <button class="cart-qty-btn" onclick="updateCartItemQuantity(${item.id}, -1)" title="تقليل">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cart-qty-value">
                        <span class="qty-number">${item.quantity}</span>
                        <span class="qty-label">قطعة</span>
                    </span>
                    <button class="cart-qty-btn" onclick="updateCartItemQuantity(${item.id}, 1)" title="زيادة" ${item.quantity >= item.maxQuantity ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    <span class="total-label">الإجمالي</span>
                    <span class="total-value">${itemTotal.toFixed(0)} ج.م</span>
                </div>
            </div>
        </div>
    `}).join('');
    
    document.getElementById('cartCount').textContent = cart.length;
    updateCartTotal();
}

function updateCartItemQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;
    
    const newQuantity = cartItem.quantity + change;
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > cartItem.maxQuantity) {
        showAlert('error', 'الكمية المتاحة غير كافية!');
        return;
    }
    
    cartItem.quantity = newQuantity;
    displayCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    displayCart();
    showAlert('success', 'تم حذف المنتج من السلة');
}

function clearCart() {
    if (cart.length === 0) return;
    customConfirm('سيتم حذف جميع المنتجات من السلة', 'إفراغ السلة', 'warning').then(result => {
        if (result) {
            cart = [];
            displayCart();
            showAlert('success', 'تم إفراغ السلة');
        }
    });
}

function updateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount')?.value || 0);
    const total = subtotal - discount;
    
    if (document.getElementById('subtotal')) {
        document.getElementById('subtotal').textContent = subtotal.toFixed(2) + ' ج.م';
    }
    if (document.getElementById('totalAmount')) {
        document.getElementById('totalAmount').textContent = Math.max(0, total).toFixed(2) + ' ج.م';
    }
}

async function completeSale() {
    if (cart.length === 0) {
        showAlert('error', 'السلة فارغة!');
        return;
    }
    
    // العثور على زر إتمام البيع
    const saleBtn = document.querySelector('.complete-sale-btn');
    setButtonLoading(saleBtn, true, 'جاري إتمام البيع...');
    
    const customerName = document.getElementById('customerName').value || 'عميل نقدي';
    const customerPhone = document.getElementById('customerPhone').value || '';
    const paymentMethod = document.getElementById('paymentMethod').value;
    const discount = parseFloat(document.getElementById('discount').value || 0);
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;
    
    // إنشاء الفاتورة
    const sale = {
        date: new Date().toISOString(),
        customer: customerName,
        phone: customerPhone,
        items: cart.map(item => {
            // البحث عن المنتج لحفظ purchasePrice
            const product = products.find(p => p.id === item.id);
            return {
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                purchasePrice: product?.purchasePrice || product?.cost || 0
            };
        }),
        subtotal: subtotal,
        discount: discount,
        total: total,
        paymentMethod: paymentMethod
    };
    
    // حفظ البيع في API (Google Sheets أو SQLite)
    const result = await saveSaleToAPI(sale);
    
    if (result.success) {
        // تحديث المخزون محلياً أولاً
        for (const cartItem of cart) {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                const newQuantity = product.quantity - cartItem.quantity;
                product.quantity = newQuantity;
                
                // تحديث في Google Sheets
                await updateProductInAPI(product.id, { quantity: newQuantity });
            }
        }
        
        sales.push(result.sale);
        window.sales = sales;
        
        // تحديث لوحة التحكم
        updateDashboard();
        
        // إعادة تعيين النموذج
        cart = [];
        displayCart();
        displayPOSProducts();
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('discount').value = '0';
        
        setButtonLoading(saleBtn, false);
        showAlert('success', `✅ تم إتمام عملية البيع بنجاح! المبلغ الإجمالي: ${total.toFixed(2)} ج.م`);
        
        // طباعة الفاتورة
        customConfirm('هل تريد طباعة فاتورة البيع الآن؟', 'طباعة الفاتورة', 'info').then(confirmResult => {
            if (confirmResult) {
                printInvoice(result.sale);
            }
        });
    } else {
        setButtonLoading(saleBtn, false);
        showAlert('error', '❌ فشل في إتمام عملية البيع');
    }
}

async function printInvoice(sale) {
    const settings = await loadSettingsFromAPI();
    const shopName = settings.shopName || 'محل قطع غيار الموتوسيكلات';
    const shopAddress = settings.shopAddress || 'القاهرة، مصر';
    const shopPhone = settings.shopPhone || '01234567890';
    
    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>فاتورة رقم ${sale.id}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
            <style>
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                
                body { 
                    font-family: 'Cairo', Arial, sans-serif; 
                    padding: 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                
                .invoice { 
                    max-width: 850px; 
                    margin: 0 auto; 
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center; 
                    padding: 30px 25px;
                    position: relative;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>');
                    opacity: 0.3;
                }
                
                .header-content {
                    position: relative;
                    z-index: 1;
                }
                
                .logo-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                    display: inline-block;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .header h1 { 
                    font-size: 32px;
                    font-weight: 900;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                }
                
                .header p {
                    font-size: 15px;
                    opacity: 0.95;
                    margin: 5px 0;
                }
                
                .invoice-body {
                    padding: 30px 35px;
                }
                
                .invoice-header-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    padding-bottom: 25px;
                    border-bottom: 3px solid #f0f0f0;
                }
                
                .info-section {
                    flex: 1;
                }
                
                .info-section h3 {
                    color: #667eea;
                    font-size: 16px;
                    margin-bottom: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .info-item {
                    display: flex;
                    margin: 8px 0;
                    font-size: 14px;
                }
                
                .info-item strong {
                    color: #555;
                    min-width: 80px;
                    font-weight: 600;
                }
                
                .info-item span {
                    color: #333;
                }
                
                .invoice-number {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 8px 20px;
                    border-radius: 25px;
                    font-size: 18px;
                    font-weight: 700;
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                
                .items-section {
                    margin: 25px 0;
                }
                
                .section-title {
                    color: #333;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 15px;
                    padding-right: 15px;
                    border-right: 4px solid #667eea;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse;
                    margin: 15px 0;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.08);
                    border-radius: 10px;
                    overflow: hidden;
                }
                
                thead {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                th { 
                    color: white;
                    padding: 15px 12px;
                    text-align: center;
                    font-weight: 700;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                td { 
                    padding: 15px 12px;
                    text-align: center;
                    border-bottom: 1px solid #f0f0f0;
                    font-size: 14px;
                }
                
                tbody tr {
                    transition: background 0.2s;
                }
                
                tbody tr:hover {
                    background: #f8f9ff;
                }
                
                tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .item-number {
                    background: #667eea;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 12px;
                }
                
                .item-name {
                    font-weight: 600;
                    color: #333;
                }
                
                .summary {
                    background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
                    padding: 25px;
                    border-radius: 12px;
                    margin: 25px 0;
                    border: 2px solid #e8eaff;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    font-size: 15px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .summary-row:last-child {
                    border-bottom: none;
                }
                
                .summary-row.subtotal {
                    color: #555;
                }
                
                .summary-row.discount {
                    color: #f59e0b;
                    font-weight: 600;
                }
                
                .summary-row.discount .value {
                    color: #dc2626;
                }
                
                .summary-row.total {
                    font-size: 22px;
                    font-weight: 900;
                    color: #16a34a;
                    padding: 15px 0;
                    margin-top: 10px;
                    border-top: 3px solid #667eea;
                }
                
                .summary-row .label {
                    font-weight: 600;
                }
                
                .summary-row .value {
                    font-weight: 700;
                }
                
                .payment-method {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    color: #667eea;
                    font-weight: 600;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-top: 10px;
                }
                
                .footer { 
                    text-align: center; 
                    padding: 25px;
                    background: #f8f9ff;
                    border-top: 3px solid #e8eaff;
                }
                
                .footer-message {
                    font-size: 18px;
                    color: #667eea;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                
                .footer-note {
                    font-size: 14px;
                    color: #666;
                    margin: 5px 0;
                }
                
                .divider {
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #667eea, transparent);
                    margin: 20px 0;
                }
                
                @media print { 
                    body { 
                        padding: 0;
                        background: white;
                    }
                    
                    .invoice {
                        box-shadow: none;
                        border-radius: 0;
                    }
                    
                    tbody tr:hover {
                        background: transparent;
                    }
                    
                    @page {
                        margin: 15mm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice">
                <div class="header">
                    <div class="header-content">
                        <div class="logo-icon"><i class="fas fa-motorcycle"></i></div>
                        <h1>${shopName}</h1>
                        <p><i class="fas fa-map-marker-alt"></i> ${shopAddress}</p>
                        <p><i class="fas fa-phone"></i> ${shopPhone}</p>
                    </div>
                </div>
                
                <div class="invoice-body">
                    <div class="invoice-header-info">
                        <div class="info-section">
                            <h3><i class="fas fa-file-invoice"></i> معلومات الفاتورة</h3>
                            <div class="info-item">
                                <strong>رقم الفاتورة:</strong>
                                <span class="invoice-number">#${sale.id}</span>
                            </div>
                            <div class="info-item">
                                <strong>التاريخ:</strong>
                                <span>${new Date(sale.date).toLocaleDateString('ar-EG', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                        </div>
                        
                        <div class="info-section">
                            <h3><i class="fas fa-user"></i> معلومات العميل</h3>
                            <div class="info-item">
                                <strong>الاسم:</strong>
                                <span>${sale.customer}</span>
                            </div>
                            <div class="info-item">
                                <strong>الهاتف:</strong>
                                <span>${sale.phone || 'غير محدد'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="items-section">
                        <h2 class="section-title">الأصناف المباعة</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px;">#</th>
                                    <th style="width: 40%;">اسم المنتج</th>
                                    <th>سعر الوحدة</th>
                                    <th>الكمية</th>
                                    <th>الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sale.items.map((item, index) => `
                                    <tr>
                                        <td><span class="item-number">${index + 1}</span></td>
                                        <td style="text-align: right;"><span class="item-name">${item.name}</span></td>
                                        <td>${item.price.toFixed(2)} ج.م</td>
                                        <td><strong>${item.quantity}</strong></td>
                                        <td><strong>${(item.price * item.quantity).toFixed(2)} ج.م</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="summary">
                        <div class="summary-row subtotal">
                            <span class="label">المجموع الفرعي:</span>
                            <span class="value">${sale.subtotal.toFixed(2)} ج.م</span>
                        </div>
                        ${sale.discount > 0 ? `
                        <div class="summary-row discount">
                            <span class="label"><i class="fas fa-tag"></i> الخصم:</span>
                            <span class="value">- ${sale.discount.toFixed(2)} ج.م</span>
                        </div>
                        ` : ''}
                        <div class="summary-row total">
                            <span class="label"><i class="fas fa-receipt"></i> الإجمالي النهائي:</span>
                            <span class="value">${sale.total.toFixed(2)} ج.م</span>
                        </div>
                        <div style="text-align: center;">
                            <div class="payment-method">
                                <i class="fas fa-${sale.paymentMethod === 'cash' ? 'money-bill-wave' : sale.paymentMethod === 'card' ? 'credit-card' : 'calendar-alt'}"></i>
                                <span>طريقة الدفع: ${sale.paymentMethod === 'cash' ? 'نقدي' : sale.paymentMethod === 'card' ? 'بطاقة' : 'تقسيط'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p class="footer-message"><i class="fas fa-star" style="color: #fbbf24;"></i> شكراً لتعاملكم معنا <i class="fas fa-star" style="color: #fbbf24;"></i></p>
                    <p class="footer-note">نتمنى لكم تجربة ممتعة وخدمة مميزة</p>
                    <p class="footer-note" style="margin-top: 15px; font-size: 12px; color: #999;">
                        <i class="fas fa-print"></i> تمت الطباعة بواسطة نظام إدارة قطع الغيار
                    </p>
                </div>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `);
    invoiceWindow.document.close();
}

// ===== Reports Functions =====
function updateReports() {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    const totalCost = sales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
            const product = products.find(p => p.id === item.id);
            return itemSum + ((product?.purchasePrice || 0) * item.quantity);
        }, 0);
    }, 0);
    
    // 💰 Calculate total profit (مكسب رأس المال - الفرق فقط بين سعر البيع والشراء)
    const totalProfit = sales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
            // البحث عن المنتج باستخدام item.productId أو item.id
            const product = products.find(p => p.id === (item.productId || item.id));
            if (!product) return itemSum;
            // الفرق = (سعر البيع - سعر الشراء) × الكمية
            const profit = (item.price - (product.purchasePrice || 0)) * item.quantity;
            return itemSum + profit;
        }, 0);
    }, 0);
    
    const avgInvoice = sales.length > 0 ? totalSales / sales.length : 0;
    
    document.getElementById('reportTotalSales').textContent = totalSales.toFixed(2) + ' ج.م';
    document.getElementById('reportTotalProfit').textContent = totalProfit.toFixed(2) + ' ج.م';
    document.getElementById('reportTotalInvoices').textContent = sales.length;
    document.getElementById('reportAvgInvoice').textContent = avgInvoice.toFixed(2) + ' ج.م';
    
    drawSalesChart();
    displayRecentSales();
}

function drawSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = 300;
    canvas.width = width;
    canvas.height = height;
    
    // حساب المبيعات لآخر 7 أيام
    const today = new Date();
    const last7Days = [];
    const salesByDay = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }));
        
        const daySales = sales.filter(sale => {
            const saleDate = new Date(sale.date).toISOString().split('T')[0];
            return saleDate === dateStr;
        });
        
        const dayTotal = daySales.reduce((sum, sale) => sum + sale.total, 0);
        salesByDay.push(dayTotal);
    }
    
    const maxSale = Math.max(...salesByDay, 100);
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / 7 - 20;
    
    // مسح Canvas
    ctx.clearRect(0, 0, width, height);
    
    // رسم الخلفية
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // رسم الأعمدة
    salesByDay.forEach((sale, index) => {
        const barHeight = (sale / maxSale) * chartHeight;
        const x = padding + index * (barWidth + 20);
        const y = height - padding - barHeight;
        
        // رسم العمود
        const gradient = ctx.createLinearGradient(x, y, x, height - padding);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // رسم القيمة
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px Cairo, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(sale.toFixed(0), x + barWidth / 2, y - 5);
        
        // رسم اليوم
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Cairo, Arial';
        ctx.fillText(last7Days[index], x + barWidth / 2, height - padding + 20);
    });
    
    // رسم عنوان المحور
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px Cairo, Arial';
    ctx.textAlign = 'right';
    ctx.fillText('المبيعات (ج.م)', width - 10, 30);
}

function displayRecentSales() {
    const container = document.getElementById('recentSalesList');
    const recentSales = sales.slice().reverse().slice(0, 20);
    
    if (recentSales.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                <i class="fas fa-inbox" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="margin: 0 0 10px 0; color: #64748b;">لا توجد عمليات بيع بعد</h3>
                <p style="margin: 0;">ابدأ بإضافة أول عملية بيع من نقطة البيع</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentSales.map((sale, index) => {
        const saleDate = new Date(sale.date);
        const saleTime = saleDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        const saleDay = saleDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // حساب الربح لهذه الفاتورة
        const saleProfit = sale.items.reduce((sum, item) => {
            const product = products.find(p => p.id === (item.productId || item.id));
            if (!product) return sum;
            return sum + ((item.price - (product.purchasePrice || 0)) * item.quantity);
        }, 0);
        
        return `
        <div class="sale-report-card">
            <div class="sale-card-header">
                <div class="sale-info-primary">
                    <div class="sale-number">
                        <i class="fas fa-receipt"></i>
                        <span>فاتورة #${sale.id}</span>
                    </div>
                    <div class="sale-customer">
                        <i class="fas fa-user"></i>
                        <span>${sale.customer || 'عميل نقدي'}</span>
                        ${sale.phone ? `<small>${sale.phone}</small>` : ''}
                    </div>
                </div>
                <div class="sale-meta">
                    <div class="sale-date">
                        <i class="fas fa-calendar"></i>
                        <span>${saleDay}</span>
                    </div>
                    <div class="sale-time">
                        <i class="fas fa-clock"></i>
                        <span>${saleTime}</span>
                    </div>
                    <div class="sale-payment">
                        ${sale.paymentMethod === 'cash' ? '<i class="fas fa-money-bill-wave"></i> نقدي' : 
                          sale.paymentMethod === 'card' ? '<i class="fas fa-credit-card"></i> بطاقة' : 
                          '<i class="fas fa-calendar-days"></i> تقسيط'}
                    </div>
                </div>
            </div>
            
            <div class="sale-products-section">
                <div class="products-header">
                    <i class="fas fa-box-open"></i>
                    <span>المنتجات المباعة (${sale.items.length})</span>
                </div>
                <div class="products-list">
                    ${sale.items.map(item => {
                        const product = products.find(p => p.id === (item.productId || item.id));
                        const itemProfit = product ? (item.price - (product.purchasePrice || 0)) * item.quantity : 0;
                        return `
                        <div class="product-item-row">
                            <div class="product-info">
                                <span class="product-name">${item.name}</span>
                                <span class="product-qty">× ${item.quantity}</span>
                            </div>
                            <div class="product-pricing">
                                <span class="product-unit-price">${item.price.toFixed(0)} ج.م</span>
                                <span class="product-total">${(item.price * item.quantity).toFixed(0)} ج.م</span>
                                ${itemProfit > 0 ? `<span class="product-profit">+${itemProfit.toFixed(0)}</span>` : ''}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="sale-footer">
                <div class="sale-summary">
                    <div class="summary-row">
                        <span>المجموع الفرعي</span>
                        <span>${(sale.subtotal || sale.total).toFixed(0)} ج.م</span>
                    </div>
                    ${sale.discount > 0 ? `
                    <div class="summary-row discount">
                        <span><i class="fas fa-tag"></i> الخصم</span>
                        <span>-${sale.discount.toFixed(0)} ج.م</span>
                    </div>
                    ` : ''}
                    ${saleProfit > 0 ? `
                    <div class="summary-row profit">
                        <span><i class="fas fa-chart-line"></i> مكسب رأس المال</span>
                        <span>+${saleProfit.toFixed(0)} ج.م</span>
                    </div>
                    ` : ''}
                    <div class="summary-row total">
                        <span>الإجمالي النهائي</span>
                        <span>${sale.total.toFixed(0)} ج.م</span>
                    </div>
                </div>
                <button class="btn-print-invoice" onclick="printInvoice(sales[${sales.length - 1 - index}])" title="طباعة الفاتورة">
                    <i class="fas fa-print"></i>
                    <span>طباعة</span>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function exportSales() {
    if (sales.length === 0) {
        showAlert('error', 'لا توجد مبيعات لتصديرها!');
        return;
    }
    
    let csv = 'رقم الفاتورة,التاريخ,العميل,الهاتف,المبلغ,الخصم,الإجمالي,طريقة الدفع\n';
    sales.forEach(sale => {
        csv += `${sale.id},${new Date(sale.date).toLocaleDateString('ar-EG')},${sale.customer},${sale.phone || '-'},${sale.subtotal},${sale.discount},${sale.total},${sale.paymentMethod}\n`;
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_${Date.now()}.csv`;
    link.click();
    
    showAlert('success', 'تم تصدير المبيعات بنجاح!');
}

// ===== Settings Functions =====

// تحميل ذكي للإعدادات: من SQLite أولاً ثم Google Sheets
async function loadSettings() {
    // محاولة التحميل من SQLite أولاً (سريع)
    if (typeof window.db !== 'undefined') {
        const localSettings = await window.db.getAllSettings();
        if (localSettings && Object.keys(localSettings).length > 0) {
            return localSettings;
        }
    }
    
    // إذا لم توجد في SQLite، تحميل من Google Sheets
    const apiSettings = await loadSettingsFromAPI();
    
    // حفظ في SQLite للمرة القادمة
    if (typeof window.db !== 'undefined' && apiSettings) {
        await window.db.saveAllSettings(apiSettings);
    }
    
    return apiSettings || {};
}

async function updateSettings() {
    const settings = await loadSettings();
    
    document.getElementById('shopName').value = settings.shopName || 'محل قطع غيار الموتوسيكلات';
    document.getElementById('shopAddress').value = settings.shopAddress || 'القاهرة، مصر';
    document.getElementById('shopPhone').value = settings.shopPhone || '01234567890';
    
    document.getElementById('statsProducts').textContent = products.length;
    document.getElementById('statsSales').textContent = sales.length;
    
    const dataSize = (JSON.stringify({products, sales}).length / 1024).toFixed(2);
    document.getElementById('statsDataSize').textContent = dataSize + ' KB';
    
    const installDate = settings.installDate || new Date().toLocaleDateString('ar-EG');
    document.getElementById('statsInstallDate').textContent = installDate;
}

async function saveUserProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('adminName').value;
    const role = document.getElementById('adminRole').value;
    
    const settings = await loadSettings();
    settings.userName = name;
    settings.userRole = role;
    
    const result = await saveSettingsToAPI(settings);
    
    if (result.success) {
        // تحديث العرض في الهيدر
        document.getElementById('userName').textContent = name;
        showAlert('success', 'تم حفظ بيانات المستخدم بنجاح!');
    } else {
        showAlert('error', '❌ فشل في حفظ البيانات');
    }
    updateAvatarDisplay();
    
    showAlert('success', 'تم حفظ البيانات الشخصية بنجاح!');
}

// 🗑️ وظيفة حذف قاعدة البيانات المحلية
// � دمج من السحابة (يجلب البيانات من Google Sheets ويدمجها مع المحلية)
async function mergeFromCloud() {
    const confirmed = await customConfirm(
        '🔄 دمج البيانات من السحابة\n\nسيتم:\n✅ جلب البيانات من Google Sheets\n✅ دمجها مع البيانات المحلية\n✅ حفظ النتيجة في SQLite\n\n⚠️ تأكد من الاتصال بالإنترنت!',
        'تأكيد الدمج',
        'info'
    );
    
    if (!confirmed) return;
    
    if (!navigator.onLine) {
        showAlert('error', '❌ يجب الاتصال بالإنترنت للدمج');
        return;
    }
    
    try {
        console.log('🔄 بدء الدمج من Google Sheets...');
        showAlert('info', '🔄 جاري جلب البيانات من Google Sheets...');
        
        // 1️⃣ جلب البيانات من السحابة ودمجها
        if (typeof downloadFromCloud === 'function') {
            await downloadFromCloud();
        } else {
            throw new Error('وظيفة التحميل غير متوفرة');
        }
        
        console.log('✅ تم دمج البيانات بنجاح');
        
        // 2️⃣ تحديث الواجهة
        updateDashboard();
        displayProducts();
        if (typeof displayPOSProducts === 'function') displayPOSProducts();
        
        showAlert('success', '✅ تم دمج البيانات من Google Sheets بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في الدمج:', error);
        showAlert('error', '❌ فشل الدمج: ' + error.message);
    }
}

// ⭕ الوظائف القديمة - للتوافق العكسي
async function importFromCloud() {
    return mergeFromCloud();
}

async function clearLocalDatabase() {
    return mergeFromCloud();
}

// 📤 وظيفة الرفع اليومي التلقائي لـ Google Sheets
function scheduleDailyBackup() {
    console.log('📅 تفعيل الرفع اليومي التلقائي لـ Google Sheets');
    
    // فحص آخر رفع
    const lastBackup = localStorage.getItem('lastDailyBackup');
    const today = new Date().toDateString();
    
    // تنفيذ الرفع إذا لم يتم اليوم
    async function performBackup() {
        if (!navigator.onLine) {
            console.log('⚠️ لا يوجد اتصال - سيتم المحاولة لاحقاً');
            return;
        }
        
        const lastBackupDate = localStorage.getItem('lastDailyBackup');
        if (lastBackupDate === today) {
            console.log('✅ تم الرفع اليومي مسبقاً اليوم');
            return;
        }
        
        console.log('📤 بدء الرفع اليومي لـ Google Sheets...');
        
        try {
            // رفع جميع البيانات المحلية
            if (typeof window.db !== 'undefined') {
                // رفع المنتجات
                const localProducts = await window.db.getAllProducts();
                for (const product of localProducts) {
                    await appsScriptRequest('addProduct', product);
                }
                console.log(`✅ تم رفع ${localProducts.length} منتج`);
                
                // رفع المبيعات
                const localSales = await window.db.getAllSales();
                for (const sale of localSales) {
                    await appsScriptRequest('addSale', sale);
                }
                console.log(`✅ تم رفع ${localSales.length} عملية بيع`);
                
                // رفع المصروفات
                if (window.db.getAllExpenses) {
                    const localExpenses = await window.db.getAllExpenses();
                    for (const expense of localExpenses) {
                        await appsScriptRequest('saveExpenses', expense);
                    }
                    console.log(`✅ تم رفع ${localExpenses.length} مصروف`);
                }
                
                // حفظ تاريخ آخر رفع
                localStorage.setItem('lastDailyBackup', today);
                console.log('✅ اكتمل الرفع اليومي بنجاح');
                
                showAlert('success', '✅ تم رفع البيانات إلى Google Sheets بنجاح');
            }
        } catch (error) {
            console.error('❌ فشل الرفع اليومي:', error);
        }
    }
    
    // محاولة الرفع عند البدء
    if (lastBackup !== today && navigator.onLine) {
        setTimeout(performBackup, 5000); // بعد 5 ثواني من بدء التطبيق
    }
    
    // جدولة الرفع كل 24 ساعة
    setInterval(() => {
        performBackup();
    }, 24 * 60 * 60 * 1000); // 24 ساعة
}

// ⭐ وظيفة المزامنة اليدوية مع Google Sheets
// 📤 رفع يدوي للسحابة (Backup فقط - لا تحميل)
async function manualBackupToCloud() {
    if (!navigator.onLine) {
        showAlert('error', '❌ لا يوجد اتصال بالإنترنت');
        return;
    }
    
    const btn = event.target;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
    btn.disabled = true;
    
    try {
        console.log('☁️ بدء الرفع اليدوي للسحابة...');
        
        // 1️⃣ رفع المنتجات
        const products = await window.db.getAllProducts();
        if (products.length > 0) {
            await window.sheetsAPI.uploadAllProducts(products);
            console.log(`✅ تم رفع ${products.length} منتج`);
        }
        
        // 2️⃣ رفع المبيعات
        const sales = await window.db.getAllSales();
        if (sales.length > 0) {
            await window.sheetsAPI.uploadAllSales(sales);
            console.log(`✅ تم رفع ${sales.length} عملية بيع`);
        }
        
        // 3️⃣ رفع المصروفات
        if (window.db.getAllExpenses) {
            const expenses = await window.db.getAllExpenses();
            if (expenses.length > 0) {
                await window.sheetsAPI.uploadAllExpenses(expenses);
                console.log(`✅ تم رفع ${expenses.length} مصروف`);
            }
        }
        
        // حفظ تاريخ آخر رفع
        localStorage.setItem('lastDailyBackup', new Date().toDateString());
        
        showAlert('success', '✅ تم رفع جميع البيانات للسحابة بنجاح');
        
    } catch (error) {
        console.error('خطأ في الرفع:', error);
        showAlert('error', '❌ فشل الرفع: ' + error.message);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// ⭕ الوظيفة القديمة - للتوافق العكسي
async function manualSyncWithCloud() {
    // تحويل إلى الوظيفة الجديدة
    return manualBackupToCloud();
}

async function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const avatarData = e.target.result;
            
            const settings = await loadSettingsFromAPI();
            settings.adminAvatar = avatarData;
            await saveSettingsToAPI(settings);
            
            updateAvatarDisplay();
        };
        reader.readAsDataURL(file);
    }
}

async function updateAvatarDisplay() {
    const settings = await loadSettings();
    const savedName = settings.userName || 'Admin';
    const savedAvatar = settings.adminAvatar;
    
    const imgElement = document.getElementById('userAvatarImg');
    const textElement = document.getElementById('userAvatarText');
    
    if (savedAvatar && imgElement && textElement) {
        imgElement.src = savedAvatar;
        imgElement.style.display = 'block';
        textElement.style.display = 'none';
    } else if (textElement) {
        textElement.textContent = savedName.charAt(0).toUpperCase();
        if (imgElement) imgElement.style.display = 'none';
        textElement.style.display = 'flex';
    }
}

async function loadUserProfile() {
    const settings = await loadSettingsFromAPI();
    
    // ⚠️ التحقق من نجاح التحميل - fallback للبيانات المحلية
    const savedName = settings?.userName || localStorage.getItem('userName') || 'Admin';
    const savedRole = settings?.userRole || localStorage.getItem('userRole') || 'مدير النظام';
    
    // تحديث الحقول في الإعدادات
    const adminNameInput = document.getElementById('adminName');
    const adminRoleInput = document.getElementById('adminRole');
    if (adminNameInput) adminNameInput.value = savedName;
    if (adminRoleInput) adminRoleInput.value = savedRole;
    
    // تحديث العرض في الهيدر
    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = savedName;
    
    updateAvatarDisplay();
}

async function saveShopInfo(event) {
    event.preventDefault();
    
    const settings = await loadSettings();
    settings.shopName = document.getElementById('shopName').value;
    settings.shopAddress = document.getElementById('shopAddress').value;
    settings.shopPhone = document.getElementById('shopPhone').value;
    
    // حفظ في SQLite أولاً (فوري)
    if (typeof window.db !== 'undefined') {
        await window.db.saveAllSettings(settings);
    }
    
    // حفظ في Google Sheets (في الخلفية)
    const result = await saveSettingsToAPI(settings);
    
    if (result.success) {
        showAlert('success', 'تم حفظ معلومات المحل بنجاح!');
    } else {
        showAlert('error', '❌ فشل في حفظ البيانات');
    }
}

function updateCapitalDisplay() {
    // حساب إجمالي رأس المال = إجمالي قيمة المشتريات لجميع المنتجات
    const totalCapital = products.reduce((sum, product) => {
        const purchasePrice = parseFloat(product.purchasePrice) || 0;
        const quantity = parseInt(product.quantity) || 0;
        return sum + (purchasePrice * quantity);
    }, 0);
    
    const capitalElement = document.getElementById('totalCapital');
    if (capitalElement) {
        capitalElement.textContent = totalCapital.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ج.م';
    }
    
    // Update modal values
    const modalCapital = document.getElementById('modalTotalCapital');
    const modalProducts = document.getElementById('modalTotalProducts');
    const modalQuantity = document.getElementById('modalTotalQuantity');
    const modalAvgPrice = document.getElementById('modalAvgPrice');
    
    if (modalCapital) {
        modalCapital.textContent = totalCapital.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ج.م';
    }
    
    if (modalProducts) {
        modalProducts.textContent = products.length.toLocaleString('en-US');
    }
    
    const totalQuantity = products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
    if (modalQuantity) {
        modalQuantity.textContent = totalQuantity.toLocaleString('en-US');
    }
    
    const avgPrice = products.length > 0 ? totalCapital / totalQuantity : 0;
    if (modalAvgPrice) {
        modalAvgPrice.textContent = avgPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ج.م';
    }
}

// Toggle Capital Modal
function toggleCapitalModal() {
    const modal = document.getElementById('capitalModal');
    if (modal) {
        if (modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            updateCapitalDisplay(); // Update values before showing
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

async function exportData() {
    try {
        showAlert('info', '<i class="fas fa-file-export"></i> جاري تصدير البيانات...');
        
        // 1️⃣ جلب البيانات من SQLite (المصدر الرئيسي)
        let exportProducts = [];
        let exportSales = [];
        let exportExpenses = [];
        
        if (typeof window.db !== 'undefined') {
            exportProducts = await window.db.getAllProducts();
            exportSales = await window.db.getAllSales();
            if (window.db.getAllExpenses) {
                exportExpenses = await window.db.getAllExpenses();
            }
        } else {
            // Fallback للمتغيرات العامة
            exportProducts = products || [];
            exportSales = sales || [];
            exportExpenses = window.expenses || [];
        }
        
        // 2️⃣ جلب الإعدادات
        const settings = await loadSettingsFromAPI();
        
        // 3️⃣ إنشاء ملف التصدير
        const data = {
            products: exportProducts,
            sales: exportSales,
            expenses: exportExpenses,
            settings: settings,
            exportDate: new Date().toISOString(),
            version: '2.0',
            source: 'SQLite'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_${Date.now()}.json`;
        link.click();
        
        showAlert('success', `✅ تم تصدير ${exportProducts.length} منتج و ${exportSales.length} عملية بيع و ${exportExpenses.length} مصروف`);
    } catch (error) {
        console.error('خطأ في التصدير:', error);
        showAlert('error', '❌ فشل تصدير البيانات: ' + error.message);
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            showAlert('info', '📥 جاري استيراد البيانات...');
            
            let importedProducts = 0;
            let importedSales = 0;
            let importedExpenses = 0;
            
            // 1️⃣ استيراد المنتجات إلى SQLite
            if (data.products && Array.isArray(data.products)) {
                for (const product of data.products) {
                    if (typeof window.db !== 'undefined') {
                        // فحص إذا المنتج موجود
                        const existing = await window.db.getProductById(product.id);
                        if (existing) {
                            await window.db.updateProduct(product.id, product);
                        } else {
                            await window.db.addProduct(product);
                        }
                    }
                    importedProducts++;
                }
                products = data.products;
            }
            
            // 2️⃣ استيراد المبيعات إلى SQLite
            if (data.sales && Array.isArray(data.sales)) {
                for (const sale of data.sales) {
                    if (typeof window.db !== 'undefined') {
                        const existing = await window.db.getSaleById(sale.id);
                        if (existing) {
                            await window.db.updateSale(sale.id, sale);
                        } else {
                            await window.db.addSale(sale);
                        }
                    }
                    importedSales++;
                }
                sales = data.sales;
            }
            
            // 3️⃣ استيراد المصروفات إلى SQLite
            if (data.expenses && Array.isArray(data.expenses)) {
                for (const expense of data.expenses) {
                    if (typeof window.db !== 'undefined' && window.db.getExpenseById) {
                        const existing = await window.db.getExpenseById(expense.id);
                        if (existing) {
                            await window.db.updateExpense(expense.id, expense);
                        } else {
                            await window.db.addExpense(expense);
                        }
                    }
                    importedExpenses++;
                }
                window.expenses = data.expenses;
            }
            
            // 4️⃣ حفظ الإعدادات
            if (data.settings) {
                await saveSettingsToAPI(data.settings);
            } else if (data.shopInfo) {
                // توافق مع الصيغة القديمة
                const settings = await loadSettingsFromAPI();
                settings.shopName = data.shopInfo.name || settings.shopName;
                settings.shopAddress = data.shopInfo.address || settings.shopAddress;
                settings.shopPhone = data.shopInfo.phone || settings.shopPhone;
                await saveSettingsToAPI(settings);
            }
            
            // 5️⃣ تحديث الواجهة
            displayProducts();
            if (typeof displayPOSProducts === 'function') displayPOSProducts();
            updateDashboard();
            updateSettings();
            
            showAlert('success', `✅ تم استيراد ${importedProducts} منتج و ${importedSales} عملية بيع و ${importedExpenses} مصروف`);
            
            // إعادة تعيين input
            event.target.value = '';
            
        } catch (error) {
            console.error('خطأ في الاستيراد:', error);
            showAlert('error', '❌ خطأ في قراءة الملف: ' + error.message);
        }
    };
    reader.readAsText(file);
}

async function clearAllData() {
    if (!await customConfirm('سيتم حذف جميع البيانات نهائياً (المنتجات، المبيعات، العملاء، الموردين، المصروفات، فواتير الشراء)! لا يمكن التراجع عن هذا الإجراء', 'تحذير خطير!', 'danger')) return;
    if (!await customConfirm('تحذير أخير! هذا الإجراء لا يمكن التراجع عنه أبداً!', 'تأكيد نهائي', 'danger')) return;
    
    try {
        showAlert('info', '⏳ جاري حذف جميع البيانات...');
        
        // حذف من SQLite أولاً (إذا كان متوفراً)
        if (typeof window.db !== 'undefined') {
            // حذف جميع المنتجات من SQLite
            for (const product of products) {
                await window.db.deleteProduct(product.id);
            }
            
            // حذف جميع المبيعات من SQLite
            for (const sale of sales) {
                await window.db.deleteSale(sale.id);
            }
            
            // حذف جميع المصروفات من SQLite
            if (typeof expenses !== 'undefined' && expenses.length > 0) {
                for (const expense of expenses) {
                    await window.db.deleteExpense(expense.id);
                }
            }
        }
        
        // حذف من Google Sheets API
        for (const product of products) {
            await deleteProductFromAPI(product.id);
        }
        
        for (const sale of sales) {
            await deleteSaleFromAPI(sale.id);
        }
        
        // مسح البيانات المحلية
        products = [];
        sales = [];
        cart = [];
        
        // مسح البيانات الجديدة من features.js
        if (typeof expenses !== 'undefined') expenses = [];
        if (typeof customers !== 'undefined') customers = [];
        if (typeof suppliers !== 'undefined') suppliers = [];
        if (typeof purchaseInvoices !== 'undefined') purchaseInvoices = [];
        
        // حفظ البيانات الفارغة إلى localStorage/SQLite
        if (typeof saveProductsLocally === 'function') await saveProductsLocally([]);
        if (typeof saveSalesLocally === 'function') await saveSalesLocally([]);
        if (typeof saveExpensesLocally === 'function') await saveExpensesLocally([]);
        
        // حفظ البيانات الفارغة إلى API
        if (typeof saveDataToAPI === 'function') {
            await saveDataToAPI('expenses', []);
            await saveDataToAPI('customers', []);
            await saveDataToAPI('suppliers', []);
            await saveDataToAPI('purchaseinvoices', []);
        }
        
        // تحديث جميع العروض
        displayProducts();
        updateDashboard();
        updateSettings();
        displayCart();
        
        // تحديث عروض البيانات الجديدة
        if (typeof displayExpenses === 'function') displayExpenses();
        if (typeof updateExpenseStats === 'function') updateExpenseStats();
        if (typeof displayCustomers === 'function') displayCustomers();
        if (typeof updateCustomerStats === 'function') updateCustomerStats();
        if (typeof displaySuppliers === 'function') displaySuppliers();
        if (typeof updateSupplierStats === 'function') updateSupplierStats();
        if (typeof displayPurchaseInvoices === 'function') displayPurchaseInvoices();
        if (typeof updatePurchaseStats === 'function') updatePurchaseStats();
        if (typeof updateAnalytics === 'function') updateAnalytics();
        
        showAlert('success', '✅ تم حذف جميع البيانات بنجاح');
    } catch (error) {
        console.error('خطأ في حذف البيانات:', error);
        showAlert('error', '❌ حدث خطأ أثناء حذف البيانات');
    }
}

// تصدير البيانات (وظيفة قديمة - تحول لـ exportData)
function exportAllData() {
    return exportData();
}


// Modal Functions
function openAddProductModal() {
    const modal = document.getElementById('addProductModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('productFormModal').reset();
}

// إضافة منتج من الـ Modal
async function addProductFromModal(event) {
    event.preventDefault();
    
    const product = {
        name: document.getElementById('productNameModal').value,
        barcode: document.getElementById('barcodeModal').value,
        description: document.getElementById('descriptionModal').value,
        purchasePrice: parseFloat(document.getElementById('purchasePriceModal').value),
        sellingPrice: parseFloat(document.getElementById('sellingPriceModal').value),
        quantity: parseInt(document.getElementById('quantityModal').value),
        minStock: parseInt(document.getElementById('minStockModal').value) || 3,
        category: document.getElementById('categoryModal').value,
        supplier: document.getElementById('supplierModal').value
    };

    const result = await saveProductToAPI(product);
    
    if (result.success) {
        products.push(result.product);
        showAlert('success', `✅ تم إضافة "${product.name}" بنجاح!`);
        closeAddProductModal();
        displayProducts();
        updateDashboard();
    } else {
        showAlert('error', '❌ فشل في إضافة المنتج');
    }
    updateCapitalDisplay();
}

// إغلاق الـ Modal عند الضغط خارجه
window.onclick = function(event) {
    const addModal = document.getElementById('addProductModal');
    const editModal = document.getElementById('editProductModal');
    if (event.target === addModal) {
        closeAddProductModal();
    }
    if (event.target === editModal) {
        closeEditProductModal();
    }
}

// فتح Modal التعديل
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editBarcode').value = product.barcode || '';
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editPurchasePrice').value = product.purchasePrice;
    document.getElementById('editSellingPrice').value = product.sellingPrice;
    document.getElementById('editQuantity').value = product.quantity;
    document.getElementById('editMinStock').value = product.minStock;
    document.getElementById('editCategory').value = product.category || '';
    document.getElementById('editSupplier').value = product.supplier || '';

    const modal = document.getElementById('editProductModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// إغلاق Modal التعديل
function closeEditProductModal() {
    const modal = document.getElementById('editProductModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// تحديث المنتج
async function updateProduct(event) {
    event.preventDefault();
    
    const productId = parseInt(document.getElementById('editProductId').value);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
        showAlert('error', 'المنتج غير موجود!');
        return;
    }

    const updates = {
        name: document.getElementById('editProductName').value,
        barcode: document.getElementById('editBarcode').value,
        description: document.getElementById('editDescription').value,
        purchasePrice: parseFloat(document.getElementById('editPurchasePrice').value),
        sellingPrice: parseFloat(document.getElementById('editSellingPrice').value),
        quantity: parseInt(document.getElementById('editQuantity').value),
        minStock: parseInt(document.getElementById('editMinStock').value) || 3,
        category: document.getElementById('editCategory').value,
        supplier: document.getElementById('editSupplier').value,
        updatedAt: new Date().toISOString()
    };

    // ✅ تحديث في SQLite أولاً
    if (typeof window.db !== 'undefined') {
        await window.db.updateProduct(productId, updates);
    }
    
    // ✅ تحديث محلياً
    products[productIndex] = { ...products[productIndex], ...updates, id: productId };
    saveProductsLocally(products);
    
    showAlert('success', `✅ تم تحديث "${updates.name}" بنجاح!`);
    closeEditProductModal();
    displayProducts();
    if (typeof displayPOSProducts === 'function') displayPOSProducts();
    updateDashboard();
    updateCapitalDisplay();
    
    // 🌐 رفع للسحابة في الخلفية
    if (navigator.onLine && typeof updateProductInAPI === 'function') {
        updateProductInAPI(productId, updates).catch(() => {
            console.warn('❌ فشل رفع التحديث للسحابة');
        });
    }
}

// ملاحظة: تم نقل تهيئة التطبيق إلى دالة initializeApp في بداية الملف

// فحص المخزون المنخفض
// نظام الإشعارات
let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

function addNotification(type, title, message) {
    const notification = {
        id: Date.now(),
        type: type, // 'warning', 'error', 'success', 'info'
        title: title,
        message: message,
        time: new Date().toLocaleString('ar-EG'),
        unread: true
    };
    
    notifications.unshift(notification);
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationCount();
    displayNotifications();
}

function updateNotificationCount() {
    const unreadCount = notifications.filter(n => n.unread).length;
    document.getElementById('notificationCount').textContent = unreadCount;
}

function displayNotifications() {
    const listContainer = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        listContainer.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>لا توجد إشعارات</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.unread ? 'unread' : ''}" onclick="markAsRead(${notif.id})">
            <div class="notification-icon ${notif.type}">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'warning': 'exclamation-triangle',
        'error': 'times-circle',
        'success': 'check-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'bell';
}

function markAsRead(notificationId) {
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
        notif.unread = false;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationCount();
        displayNotifications();
    }
}

function clearAllNotifications() {
    customConfirm('هل تريد مسح جميع الإشعارات؟', 'warning').then(result => {
        if (result) {
            notifications = [];
            localStorage.setItem('notifications', JSON.stringify(notifications));
            updateNotificationCount();
            displayNotifications();
            showAlert('success', 'تم مسح جميع الإشعارات');
        }
    });
}

// إظهار/إخفاء قائمة الإشعارات
document.getElementById('notificationBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('notificationsDropdown');
    dropdown.classList.toggle('show');
    displayNotifications();
});

// إغلاق القائمة عند النقر خارجها
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notificationsDropdown');
    if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
    }
    
    // Close capital modal when clicking outside
    const capitalModal = document.getElementById('capitalModal');
    if (capitalModal && capitalModal.classList.contains('active')) {
        const modalContent = capitalModal.querySelector('.capital-modal-content');
        if (!modalContent.contains(e.target) && !e.target.closest('.capital-display')) {
            toggleCapitalModal();
        }
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const capitalModal = document.getElementById('capitalModal');
        if (capitalModal && capitalModal.classList.contains('active')) {
            toggleCapitalModal();
        }
    }
});

function checkLowStockAlert() {
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock);
    const outOfStockProducts = products.filter(p => p.quantity === 0);
    
    if (outOfStockProducts.length > 0) {
        playAlertSound();
        showAlert('error', `⚠️ تحذير! ${outOfStockProducts.length} منتج نفذ من المخزون`);
        
        // إضافة إشعار
        outOfStockProducts.forEach(product => {
            addNotification('error', 'نفاذ مخزون', `المنتج "${product.name}" نفذ من المخزون`);
        });
    } else if (lowStockProducts.length > 0) {
        playAlertSound();
        showAlert('warning', `⚠️ تنبيه: ${lowStockProducts.length} منتج يحتاج إعادة تخزين`);
        
        // إضافة إشعار
        lowStockProducts.forEach(product => {
            addNotification('warning', 'مخزون منخفض', `المنتج "${product.name}" يحتاج إعادة تخزين (المتوفر: ${product.quantity})`);
        });
    }
}

// تشغيل صوت التنبيه
function playAlertSound() {
    try {
        // إنشاء صوت تنبيه بسيط باستخدام Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume audio context إذا كان suspended (بسبب autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('تعذر تشغيل الصوت:', error);
        // استخدام صوت بديل (beep) باستخدام HTML5 Audio
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuFzvLZiTYIGGe88OScTgwOUKnl8bFfGwU7ktjzzHkqBSd+Hv/7TwMaC1Ck5vGxXxsEOZLX88x5KgUofx//+08DGgtQpOXxr18aBDqS1/PMeSoFKH8f//tPAxkLUKTl8a9fGgQ6ktfzzHkqBSh/H//7TwMZC1Ck5fGvXxoEOpLX88x5KgUofx//+08DGQtQpOXxr18aBDqS1/PMeSoFKH8f//tPAxkLUKTl8a9fGgQ6ktfzzHkqBSh/H//7TwMZC1Ck5fGvXxoEOpLX88x5KgUofx//+08DGQtQpOXxr18aBDqS1/PMeSoFKH8f//tPAxkLUKTl8a9fGgQ6ktfzzHkqBSh/H//7TwMZC1Ck5fGvXxoEOpLX88x5KgUofx//+08DGQtQpOXxr18aBDqS1/PMeSoFKH8f//tPAxkLUKTl8a9fGgQ6ktfzzHkqBSh/H//7TwMZC1Ck5fGvXxoEOpLX88x5KgUofx//+08DGQs=');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('تعذر تشغيل الصوت البديل:', e));
        } catch (e) {
            console.log('تعذر تشغيل الصوت البديل:', e);
        }
    }
}
// ============ إدارة بيانات تسجيل الدخول ============

// تحميل بيانات المستخدم الحالي
async function loadCurrentUserCredentials() {
    try {
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getCurrentUser) {
            const user = await window.electronAPI.getCurrentUser();
            if (user && user.id) {
                // الحصول على بيانات المستخدم مع كلمة المرور
                const userWithPassword = await window.electronAPI.getUserWithPassword(user.id);
                
                if (userWithPassword) {
                    document.getElementById('currentUsername').value = userWithPassword.username || '';
                    document.getElementById('currentPassword').value = userWithPassword.password || '';
                }
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
    }
}

// إظهار/إخفاء كلمة المرور
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// تحديث بيانات تسجيل الدخول
async function updateLoginCredentials(event) {
    event.preventDefault();
    
    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    // التحقق من أن هناك تحديث
    if (!newUsername && !newPassword) {
        showAlert('يرجى إدخال اسم المستخدم أو كلمة المرور الجديدة', 'warning');
        return;
    }
    
    // التحقق من تطابق كلمات المرور
    if (newPassword && newPassword !== confirmPassword) {
        showAlert('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    // التحقق من طول اسم المستخدم
    if (newUsername && newUsername.length < 3) {
        showAlert('اسم المستخدم يجب أن لا يقل عن 3 أحرف', 'error');
        return;
    }
    
    // التحقق من طول كلمة المرور
    if (newPassword && newPassword.length < 6) {
        showAlert('كلمة المرور يجب أن لا تقل عن 6 أحرف', 'error');
        return;
    }
    
    try {
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getCurrentUser) {
            const user = await window.electronAPI.getCurrentUser();
            
            if (!user) {
                showAlert('لم يتم العثور على المستخدم الحالي', 'error');
                return;
            }
            
            // تحضير البيانات المحدثة
            const updates = {};
            if (newUsername) updates.username = newUsername;
            if (newPassword) updates.password = newPassword;
            
            // تحديث بيانات المستخدم
            const result = await window.electronAPI.updateUser(user.id, updates);
            
            if (result) {
                showAlert('✅ تم تحديث بيانات الدخول بنجاح', 'success');
                
                // تحديث القيم المعروضة
                if (newUsername) {
                    document.getElementById('currentUsername').value = newUsername;
                }
                if (newPassword) {
                    document.getElementById('currentPassword').value = newPassword;
                }
                
                // مسح الحقول
                document.getElementById('newUsername').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                
                // تنبيه المستخدم بتسجيل الدخول مرة أخرى
                setTimeout(() => {
                    if (confirm('تم تحديث بيانات الدخول. هل تريد تسجيل الخروج وإعادة تسجيل الدخول بالبيانات الجديدة؟')) {
                        logout();
                    }
                }, 1500);
            } else {
                showAlert('❌ فشل تحديث بيانات الدخول', 'error');
            }
        } else {
            showAlert('هذه الميزة متاحة فقط في تطبيق سطح المكتب', 'warning');
        }
    } catch (error) {
        console.error('خطأ في تحديث بيانات الدخول:', error);
        showAlert('❌ حدث خطأ: ' + error.message, 'error');
    }
}

// تحميل بيانات المستخدم عند فتح تبويب الإعدادات
document.addEventListener('DOMContentLoaded', () => {
    // إضافة حدث عند النقر على تبويب الإعدادات
    const settingsTab = document.querySelector('[onclick*="settings"]');
    if (settingsTab) {
        const originalOnClick = settingsTab.onclick;
        settingsTab.onclick = function() {
            if (originalOnClick) originalOnClick.call(this);
            loadCurrentUserCredentials();
        };
    }
});