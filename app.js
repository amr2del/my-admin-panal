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
    
    // 🌐 مزامنة مع السحابة في الخلفية (بدون انتظار)
    if (navigator.onLine) {
        syncWithCloud().then(() => {
            console.log('✅ تمت المزامنة مع السحابة');
            // تحديث الواجهة بعد المزامنة
            updateDashboard();
            displayProducts();
            displayPOSProducts();
        }).catch(err => {
            console.log('⚠️ لم تتم المزامنة:', err.message);
        });
    }
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
                <div class="empty-state-icon">📦</div>
                <h3>لا توجد منتجات بعد</h3>
                <p>ابدأ بإضافة منتج من تبويب "إضافة منتج"</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const stockStatus = product.quantity <= 0 ? 'danger' : 
                          product.quantity <= product.minStock ? 'warning' : 'success';
        const stockBadge = product.quantity <= 0 ? 'نفذ من المخزون' : 
                          product.quantity <= product.minStock ? 'كمية منخفضة' : 'متوفر';
        
        return `
        <div class="product-card">
            <div class="product-header">
                <div style="flex: 1; min-width: 0;">
                    <h3 class="product-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</h3>
                    ${product.barcode ? `<p style="color: #94a3b8; font-size: 11px;"><i class="fas fa-barcode"></i> ${product.barcode}</p>` : ''}
                </div>
                <span class="product-badge badge-${stockStatus}" style="font-size: 10px; padding: 3px 8px;">${stockBadge}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-cubes" style="color: #6366f1; font-size: 11px;"></i>
                    <span style="color: ${product.quantity <= product.minStock ? 'var(--danger)' : 'var(--success)'}; font-weight: bold;">${product.quantity}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-layer-group" style="color: #8b5cf6; font-size: 11px;"></i>
                    <span style="color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.category || '-'}</span>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 11px; color: #64748b;">شراء:</span>
                    <span style="font-size: 12px; color: #1e293b; font-weight: 600;">${product.purchasePrice.toFixed(0)} ج</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 11px; color: #64748b;">بيع:</span>
                    <span style="font-size: 12px; color: var(--success); font-weight: 600;">${product.sellingPrice.toFixed(0)} ج</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; color: #64748b;">ربح:</span>
                    <span style="font-size: 12px; color: var(--primary); font-weight: 700;">${(product.sellingPrice - product.purchasePrice).toFixed(0)} ج</span>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 5px; margin-top: auto;">
                <button class="btn btn-primary btn-icon" onclick="editProduct(${product.id})" style="width: 32px; height: 32px; padding: 0; font-size: 12px; background: var(--primary);">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteProduct(${product.id})" style="width: 32px; height: 32px; padding: 0; font-size: 12px;">
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
                <div class="empty-state-icon">🔍</div>
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
                <span class="card-value" style="color: #48bb78; font-weight: bold;">${product.sellingPrice} ج.م</span>
            </div>

            <div class="product-actions">
                <button class="btn btn-success" onclick="sellProduct(${product.id})">🛒 بيع</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

// حذف منتج
async function deleteProduct(id) {
    if (await customConfirm('سيتم حذف هذا المنتج نهائياً من النظام', 'حذف المنتج', 'danger')) {
        // ✅ حذف فوري من LocalStorage
        products = products.filter(p => p.id !== id);
        saveProductsLocally(products);
        
        showAlert('success', '✅ تم حذف المنتج بنجاح');
        displayProducts();
        updateDashboard();
        updateCapitalDisplay();
        
        // 🌐 حذف من السحابة في الخلفية
        if (navigator.onLine) {
            deleteProductFromAPI(id).catch(() => {
                addPendingChange('product', 'delete', { id });
            });
        } else {
            addPendingChange('product', 'delete', { id });
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
    // إجمالي المنتجات
    document.getElementById('totalProducts').textContent = products.length;

    // قيمة المخزون
    const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    document.getElementById('totalValue').textContent = totalValue.toFixed(2) + ' ج.م';

    // المنتجات المنخفضة
    const lowStock = products.filter(p => p.quantity <= p.minStock);
    document.getElementById('lowStockCount').textContent = lowStock.length;

    // مبيعات اليوم
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
    document.getElementById('todaySales').textContent = todaySalesTotal.toFixed(2) + ' ج.م';

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
            confirmIcon.textContent = '⚠️';
        } else if (type === 'info') {
            confirmHeader.classList.add('info');
            confirmIcon.textContent = '❓';
        } else {
            confirmIcon.textContent = '🗑️';
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
                <div class="empty-state-icon">📦</div>
                <h3 style="color: #64748b; margin-bottom: 10px;">لا توجد منتجات متاحة</h3>
                <p style="color: #94a3b8; margin-bottom: 20px;">قم بإضافة منتجات لبدء البيع</p>
                <button class="btn btn-primary" onclick="showTab('products')">
                    <i class="fas fa-plus"></i> أضف منتجات
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = availableProducts.map(product => {
        let stockClass = 'high';
        let stockText = 'متوفر';
        
        if (product.quantity === 0) {
            stockClass = 'out';
            stockText = 'نفذ';
        } else if (product.quantity <= product.minStock) {
            stockClass = 'low';
            stockText = 'منخفض';
        }
        
        return `
            <div class="pos-product-card ${product.quantity === 0 ? 'out-of-stock' : ''}" 
                 onclick="${product.quantity > 0 ? `addToCart(${product.id})` : ''}">
                <div class="pos-product-icon">
                    <i class="fas fa-box"></i>
                </div>
                <div class="pos-product-name" title="${product.name}">${product.name}</div>
                <div class="pos-product-price">${product.sellingPrice.toFixed(2)} ج.م</div>
                <div class="pos-product-stock ${stockClass}">
                    ${stockText}: ${product.quantity}
                </div>
            </div>
        `;
    }).join('');
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
        const stockStatus = product.quantity <= product.minStock ? 'low' : 'good';
        const stockColor = stockStatus === 'low' ? 'var(--warning)' : 'var(--success)';
        
        return `
        <div style="padding: 16px; border: 2px solid var(--light); border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease; cursor: pointer; background: white;" 
             onmouseover="this.style.borderColor='var(--primary)'; this.style.background='linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))'; this.style.transform='translateX(-3px)'; this.style.boxShadow='0 4px 12px rgba(99, 102, 241, 0.15)'"
             onmouseout="this.style.borderColor='var(--light)'; this.style.background='white'; this.style.transform='translateX(0)'; this.style.boxShadow='none'">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: var(--dark); font-size: 15px; font-weight: 600;">${product.name}</h4>
                    <span style="background: ${stockColor}; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                        ${product.quantity} متاح
                    </span>
                </div>
                <div style="display: flex; gap: 15px; align-items: center;">
                    <span style="color: #64748b; font-size: 13px;">
                        <i class="fas fa-barcode" style="color: var(--primary);"></i> ${product.barcode}
                    </span>
                    <span style="color: var(--primary); font-size: 15px; font-weight: 700;">
                        ${product.sellingPrice} ج.م
                    </span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="addToCart(${product.id}); event.stopPropagation();" style="padding: 12px 20px; font-weight: 600;">
                <i class="fas fa-cart-plus"></i> أضف
            </button>
        </div>
    `}).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.quantity < product.quantity) {
            cartItem.quantity++;
        } else {
            showAlert('error', 'الكمية المتاحة غير كافية!');
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
    }
    
    displayCart();
    showAlert('success', 'تم إضافة المنتج للسلة');
}

function displayCart() {
    const container = document.getElementById('cartItems');
    
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
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-header">
                <div class="cart-item-name">${item.name}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="حذف">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-quantity">
                    <button class="cart-qty-btn" onclick="updateCartItemQuantity(${item.id}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cart-qty-value">${item.quantity}</span>
                    <button class="cart-qty-btn" onclick="updateCartItemQuantity(${item.id}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-price">${(item.price * item.quantity).toFixed(2)} ج.م</div>
            </div>
        </div>
    `).join('');
    
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
        items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        subtotal: subtotal,
        discount: discount,
        total: total,
        paymentMethod: paymentMethod
    };
    
    // حفظ البيع في API
    const result = await saveSaleToAPI(sale);
    
    if (result.success) {
        // تحديث المخزون في قاعدة البيانات
        for (const cartItem of cart) {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                const newQuantity = product.quantity - cartItem.quantity;
                await updateProductInAPI(product.id, { quantity: newQuantity });
                product.quantity = newQuantity;
            }
        }
        
        sales.push(result.sale);
        
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
                        <div class="logo-icon">🏍️</div>
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
                    <p class="footer-message">✨ شكراً لتعاملكم معنا ✨</p>
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
    const totalProfit = totalSales - totalCost;
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
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">لا توجد عمليات بيع بعد</p>';
        return;
    }
    
    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--light); border-bottom: 2px solid var(--primary);">
                    <th style="padding: 12px; text-align: right;">رقم الفاتورة</th>
                    <th style="padding: 12px; text-align: right;">التاريخ</th>
                    <th style="padding: 12px; text-align: right;">العميل</th>
                    <th style="padding: 12px; text-align: right;">عدد الأصناف</th>
                    <th style="padding: 12px; text-align: right;">المبلغ</th>
                    <th style="padding: 12px; text-align: right;">طريقة الدفع</th>
                </tr>
            </thead>
            <tbody>
                ${recentSales.map(sale => `
                    <tr style="border-bottom: 1px solid var(--light);">
                        <td style="padding: 12px;">#${sale.id}</td>
                        <td style="padding: 12px;">${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
                        <td style="padding: 12px;">${sale.customer}</td>
                        <td style="padding: 12px;">${sale.items.length}</td>
                        <td style="padding: 12px; font-weight: 700; color: var(--success);">${sale.total.toFixed(2)} ج.م</td>
                        <td style="padding: 12px;">${sale.paymentMethod === 'cash' ? '💵 نقدي' : sale.paymentMethod === 'card' ? '💳 بطاقة' : '📅 تقسيط'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
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
    const savedName = settings.userName || 'Admin';
    const savedRole = settings.userRole || 'مدير النظام';
    
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
    const settings = await loadSettingsFromAPI();
    
    const data = {
        products: products,
        sales: sales,
        settings: settings,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${Date.now()}.json`;
    link.click();
    
    showAlert('success', 'تم تصدير البيانات بنجاح!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // نقل البيانات إلى API
            const result = await apiRequest('/migrate', {
                method: 'POST',
                body: JSON.stringify({
                    products: data.products || [],
                    sales: data.sales || []
                })
            });
            
            if (result.success) {
                // حفظ الإعدادات إذا وجدت
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
                
                // تحميل البيانات من API
                await loadProductsFromAPI();
                await loadSalesFromAPI();
                
                displayProducts();
                updateDashboard();
                updateSettings();
                
                showAlert('success', 'تم استيراد البيانات بنجاح!');
            } else {
                showAlert('error', '❌ فشل في استيراد البيانات');
            }
        } catch (error) {
            showAlert('error', 'خطأ في قراءة الملف!');
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

// تصدير البيانات
function exportAllData() {
    const data = {
        products: products,
        sales: sales,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showAlert('success', '✅ تم تصدير البيانات بنجاح!');
}

// استيراد البيانات
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    customConfirm('سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة', 'تأكيد الاستيراد', 'warning').then(result => {
        if (!result) {
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // نقل البيانات إلى API
                const result = await apiRequest('/migrate', {
                    method: 'POST',
                    body: JSON.stringify({
                        products: data.products || [],
                        sales: data.sales || []
                    })
                });
                
                if (result.success) {
                    // تحميل البيانات من API
                    await loadProductsFromAPI();
                    await loadSalesFromAPI();
                    
                    displayProducts();
                    updateDashboard();
                    updateReports();
                    
                    showAlert('success', `✅ تم استيراد البيانات بنجاح! (${products.length} منتج، ${sales.length} عملية بيع)`);
                } else {
                    showAlert('error', '❌ فشل في استيراد البيانات');
                }
            } catch (error) {
                showAlert('error', 'خطأ في قراءة الملف!');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    });
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

    // ✅ تحديث محلياً فوراً
    products[productIndex] = { ...products[productIndex], ...updates, id: productId };
    saveProductsLocally(products);
    
    showAlert('success', `✅ تم تحديث "${updates.name}" بنجاح!`);
    closeEditProductModal();
    displayProducts();
    updateDashboard();
    updateCapitalDisplay();
    
    // 🌐 رفع للسحابة في الخلفية
    if (navigator.onLine) {
        updateProductInAPI(productId, updates).catch(() => {
            addPendingChange('product', 'update', { id: productId, ...updates });
        });
    } else {
        addPendingChange('product', 'update', { id: productId, ...updates });
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
