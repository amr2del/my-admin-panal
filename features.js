// ============================================
// Advanced Features JavaScript
// ============================================

// Global data arrays for new features
let expenses = [];
let customers = [];
let suppliers = [];
let debts = [];
let purchaseInvoices = [];

// Chart instances
let salesChartInstance = null;
let categoryChartInstance = null;
let topProductsChartInstance = null;
let monthlyChartInstance = null;

// ============================================
// 1. ADVANCED ANALYTICS
// ============================================

function updateAnalytics() {
    // Calculate total sales and profit
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCost = sales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
            const product = products.find(p => p.id === item.id);
            return itemSum + ((product?.purchasePrice || 0) * item.quantity);
        }, 0);
    }, 0);
    const totalProfit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : 0;

    // Update stats
    document.getElementById('analyticsAllTimeSales').textContent = totalSales.toFixed(2) + ' ج.م';
    document.getElementById('analyticsTotalProfit').textContent = totalProfit.toFixed(2) + ' ج.م';
    document.getElementById('analyticsProfitMargin').textContent = profitMargin + '%';

    // Update charts
    updateSalesChart();
    updateCategoryChart();
    updateTopProductsChart();
    updateMonthlyComparisonChart();
}

function updateSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // Get last 7 days data
    const last7Days = [];
    const salesByDay = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        last7Days.push(dateStr);
        salesByDay[dateStr] = 0;
    }

    sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dateStr = saleDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        if (salesByDay.hasOwnProperty(dateStr)) {
            salesByDay[dateStr] += sale.total;
        }
    });

    const data = last7Days.map(day => salesByDay[day]);

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'المبيعات',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Calculate sales by category
    const categoryData = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.id);
            const category = product?.category || 'غير محدد';
            if (!categoryData[category]) {
                categoryData[category] = 0;
            }
            categoryData[category] += item.price * item.quantity;
        });
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateTopProductsChart() {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;

    // Calculate product sales
    const productSales = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = 0;
            }
            productSales[item.name] += item.price * item.quantity;
        });
    });

    const sorted = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = sorted.map(([name]) => name);
    const data = sorted.map(([, value]) => value);

    if (topProductsChartInstance) {
        topProductsChartInstance.destroy();
    }

    topProductsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'المبيعات',
                data: data,
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateMonthlyComparisonChart() {
    const ctx = document.getElementById('monthlyComparisonChart');
    if (!ctx) return;

    // Get last 6 months
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });
        monthlyData[monthStr] = 0;
    }

    sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const monthStr = saleDate.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });
        if (monthlyData.hasOwnProperty(monthStr)) {
            monthlyData[monthStr] += sale.total;
        }
    });

    const labels = Object.keys(monthlyData);
    const data = Object.values(monthlyData);

    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'المبيعات',
                data: data,
                backgroundColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ============================================
// 2. EXPENSES MANAGEMENT
// ============================================

function openAddExpenseModal() {
    document.getElementById('addExpenseModal').style.display = 'flex';
    document.getElementById('expenseDate').valueAsDate = new Date();
}

function closeExpenseModal() {
    document.getElementById('addExpenseModal').style.display = 'none';
    document.getElementById('expenseForm').reset();
}

async function addExpense(event) {
    event.preventDefault();
    
    const expense = {
        id: Date.now(),
        type: document.getElementById('expenseType').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value,
        createdAt: new Date().toISOString()
    };

    expenses.push(expense);
    await saveExpensesToAPI();
    
    showAlert('success', '✅ تم إضافة المصروف بنجاح!');
    closeExpenseModal();
    displayExpenses();
    updateExpenseStats();
}

function displayExpenses() {
    const container = document.getElementById('expensesList');
    if (!container) return;

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><h3>لا توجد مصروفات مسجلة</h3></div>';
        return;
    }

    const expenseTypes = {
        rent: 'إيجار',
        electricity: 'كهرباء',
        water: 'مياه',
        salaries: 'رواتب',
        maintenance: 'صيانة',
        transportation: 'مواصلات',
        other: 'أخرى'
    };

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--primary); color: white;">
                    <th style="padding: 12px; text-align: right;">التاريخ</th>
                    <th style="padding: 12px; text-align: right;">النوع</th>
                    <th style="padding: 12px; text-align: right;">الوصف</th>
                    <th style="padding: 12px; text-align: right;">المبلغ</th>
                    <th style="padding: 12px; text-align: center;">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${expenses.map(exp => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">${new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                        <td style="padding: 12px;">${expenseTypes[exp.type] || exp.type}</td>
                        <td style="padding: 12px;">${exp.description}</td>
                        <td style="padding: 12px; color: var(--danger); font-weight: 600;">${exp.amount.toFixed(2)} ج.م</td>
                        <td style="padding: 12px; text-align: center;">
                            <button class="btn btn-danger btn-icon" onclick="deleteExpense(${exp.id})" style="padding: 5px 10px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function updateExpenseStats() {
    const today = new Date();
    const todayExpenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.toDateString() === today.toDateString();
    }).reduce((sum, e) => sum + e.amount, 0);

    const monthExpenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    // Calculate net profit (total sales - total expenses)
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    document.getElementById('expensesToday').textContent = todayExpenses.toFixed(2) + ' ج.م';
    document.getElementById('expensesMonth').textContent = monthExpenses.toFixed(2) + ' ج.م';
    document.getElementById('netProfit').textContent = netProfit.toFixed(2) + ' ج.م';
}

async function deleteExpense(id) {
    const confirmed = await customConfirm('هل تريد حذف هذا المصروف؟', 'حذف مصروف', 'warning');
    if (confirmed) {
        expenses = expenses.filter(e => e.id !== id);
        await saveExpensesToAPI();
        showAlert('success', '✅ تم حذف المصروف بنجاح!');
        displayExpenses();
        updateExpenseStats();
    }
}

function filterExpenses() {
    displayExpenses();
}

// ============================================
// 3. CUSTOMERS MANAGEMENT
// ============================================

function openAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'flex';
}

function closeCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'none';
    document.getElementById('customerForm').reset();
}

async function addCustomer(event) {
    event.preventDefault();
    
    const customer = {
        id: Date.now(),
        name: document.getElementById('newCustomerName').value,
        phone: document.getElementById('newCustomerPhone').value,
        email: document.getElementById('newCustomerEmail').value || '',
        address: document.getElementById('newCustomerAddress').value || '',
        type: document.getElementById('newCustomerType').value,
        totalPurchases: 0,
        debt: 0,
        createdAt: new Date().toISOString()
    };

    customers.push(customer);
    await saveCustomersToAPI();
    
    showAlert('success', '✅ تم إضافة العميل بنجاح!');
    closeCustomerModal();
    displayCustomers();
    updateCustomerStats();
}

function displayCustomers() {
    const container = document.getElementById('customersList');
    if (!container) return;

    if (customers.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><h3>لا يوجد عملاء مسجلين</h3></div>';
        return;
    }

    container.innerHTML = `
        <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
            ${customers.map(customer => `
                <div class="product-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 50px; height: 50px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                                ${customer.name.charAt(0)}
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 18px;">${customer.name}</h3>
                                ${customer.type === 'vip' ? '<span class="product-badge badge-success" style="font-size: 10px;">⭐ مميز</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
                        <div><i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i> ${customer.phone}</div>
                        ${customer.email ? `<div><i class="fas fa-envelope" style="color: var(--primary); width: 20px;"></i> ${customer.email}</div>` : ''}
                        <div><i class="fas fa-dollar-sign" style="color: var(--success); width: 20px;"></i> مشتريات: ${customer.totalPurchases.toFixed(2)} ج.م</div>
                        ${customer.debt > 0 ? `<div><i class="fas fa-exclamation-circle" style="color: var(--danger); width: 20px;"></i> دين: ${customer.debt.toFixed(2)} ج.م</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="viewCustomerHistory(${customer.id})" style="flex: 1; font-size: 13px;">
                            <i class="fas fa-history"></i> السجل
                        </button>
                        <button class="btn btn-danger btn-icon" onclick="deleteCustomer(${customer.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateCustomerStats() {
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter(c => c.type === 'vip').length;
    const debtorsCount = customers.filter(c => c.debt > 0).length;

    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('vipCustomers').textContent = vipCustomers;
    document.getElementById('debtorsCount').textContent = debtorsCount;
}

async function deleteCustomer(id) {
    const confirmed = await customConfirm('هل تريد حذف هذا العميل؟', 'حذف عميل', 'warning');
    if (confirmed) {
        customers = customers.filter(c => c.id !== id);
        await saveCustomersToAPI();
        showAlert('success', '✅ تم حذف العميل بنجاح!');
        displayCustomers();
        updateCustomerStats();
    }
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.phone.includes(searchTerm)
    );
    
    // Display filtered results (simplified)
    displayCustomers();
}

function viewCustomerHistory(customerId) {
    const customer = customers.find(c => c.id === customerId);
    const customerSales = sales.filter(s => s.customer === customer.name);
    
    showAlert('info', `العميل ${customer.name} لديه ${customerSales.length} فاتورة`);
}

// ============================================
// 4. SUPPLIERS MANAGEMENT
// ============================================

function openAddSupplierModal() {
    document.getElementById('addSupplierModal').style.display = 'flex';
}

function closeSupplierModal() {
    document.getElementById('addSupplierModal').style.display = 'none';
    document.getElementById('supplierForm').reset();
}

async function addSupplier(event) {
    event.preventDefault();
    
    const supplier = {
        id: Date.now(),
        name: document.getElementById('supplierName').value,
        phone: document.getElementById('supplierPhone').value,
        email: document.getElementById('supplierEmail').value || '',
        category: document.getElementById('supplierCategory').value || '',
        address: document.getElementById('supplierAddress').value || '',
        totalPurchases: 0,
        debt: 0,
        createdAt: new Date().toISOString()
    };

    suppliers.push(supplier);
    await saveSuppliersToAPI();
    updatePurchaseSupplierSelect();
    
    showAlert('success', '✅ تم إضافة المورد بنجاح!');
    closeSupplierModal();
    displaySuppliers();
    updateSupplierStats();
}

function displaySuppliers() {
    const container = document.getElementById('suppliersList');
    if (!container) return;

    if (suppliers.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚚</div><h3>لا يوجد موردين مسجلين</h3></div>';
        return;
    }

    container.innerHTML = `
        <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
            ${suppliers.map(supplier => `
                <div class="product-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 50px; height: 50px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 18px;">${supplier.name}</h3>
                                ${supplier.category ? `<p style="margin: 0; font-size: 12px; color: #666;">${supplier.category}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
                        <div><i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i> ${supplier.phone}</div>
                        ${supplier.email ? `<div><i class="fas fa-envelope" style="color: var(--primary); width: 20px;"></i> ${supplier.email}</div>` : ''}
                        <div><i class="fas fa-dollar-sign" style="color: var(--orange); width: 20px;"></i> مشتريات: ${supplier.totalPurchases.toFixed(2)} ج.م</div>
                        ${supplier.debt > 0 ? `<div><i class="fas fa-exclamation-circle" style="color: var(--danger); width: 20px;"></i> دين له: ${supplier.debt.toFixed(2)} ج.م</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="viewSupplierHistory(${supplier.id})" style="flex: 1; font-size: 13px;">
                            <i class="fas fa-history"></i> السجل
                        </button>
                        <button class="btn btn-danger btn-icon" onclick="deleteSupplier(${supplier.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateSupplierStats() {
    const totalSuppliers = suppliers.length;
    const totalPurchases = purchaseInvoices.reduce((sum, p) => sum + p.total, 0);
    const supplierDebts = suppliers.reduce((sum, s) => sum + s.debt, 0);

    document.getElementById('totalSuppliers').textContent = totalSuppliers;
    document.getElementById('totalPurchases').textContent = totalPurchases.toFixed(2) + ' ج.م';
    document.getElementById('supplierDebts').textContent = supplierDebts.toFixed(2) + ' ج.م';
}

async function deleteSupplier(id) {
    const confirmed = await customConfirm('هل تريد حذف هذا المورد؟', 'حذف مورد', 'warning');
    if (confirmed) {
        suppliers = suppliers.filter(s => s.id !== id);
        await saveSuppliersToAPI();
        showAlert('success', '✅ تم حذف المورد بنجاح!');
        displaySuppliers();
        updateSupplierStats();
        updatePurchaseSupplierSelect();
    }
}

function filterSuppliers() {
    displaySuppliers();
}

function viewSupplierHistory(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    const supplierPurchases = purchaseInvoices.filter(p => p.supplierId === supplierId);
    
    showAlert('info', `المورد ${supplier.name} لديه ${supplierPurchases.length} فاتورة شراء`);
}

// ============================================
// 5. DEBTS & INSTALLMENTS
// ============================================

function updateDebtsDisplay() {
    // Customer debts
    const customerDebtsContainer = document.getElementById('customerDebts');
    const debtorCustomers = customers.filter(c => c.debt > 0);
    
    if (customerDebtsContainer) {
        if (debtorCustomers.length === 0) {
            customerDebtsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>لا توجد ديون على العملاء</h3></div>';
        } else {
            customerDebtsContainer.innerHTML = debtorCustomers.map(customer => `
                <div style="display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <div>
                        <strong>${customer.name}</strong>
                        <p style="margin: 5px 0; font-size: 13px; color: #666;">${customer.phone}</p>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-size: 18px; font-weight: bold; color: var(--danger);">${customer.debt.toFixed(2)} ج.م</div>
                        <button class="btn btn-success" onclick="payCustomerDebt(${customer.id})" style="font-size: 12px; padding: 5px 10px; margin-top: 5px;">
                            <i class="fas fa-check"></i> تسديد
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Update stats
    const totalDebts = customers.reduce((sum, c) => sum + c.debt, 0);
    if (document.getElementById('totalDebts')) {
        document.getElementById('totalDebts').textContent = totalDebts.toFixed(2) + ' ج.م';
    }
}

function payCustomerDebt(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        customer.debt = 0;
        saveCustomersToAPI();
        showAlert('success', '✅ تم تسديد الدين بنجاح!');
        updateDebtsDisplay();
        updateCustomerStats();
    }
}

// ============================================
// 6. PURCHASE INVOICES
// ============================================

function openAddPurchaseModal() {
    document.getElementById('addPurchaseModal').style.display = 'flex';
    document.getElementById('purchaseDate').valueAsDate = new Date();
    updatePurchaseSupplierSelect();
    // Add first item
    document.getElementById('purchaseItemsList').innerHTML = '';
    addPurchaseItem();
}

function closePurchaseModal() {
    document.getElementById('addPurchaseModal').style.display = 'none';
    document.getElementById('purchaseForm').reset();
}

function updatePurchaseSupplierSelect() {
    const select = document.getElementById('purchaseSupplier');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر المورد</option>' + 
        suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

let purchaseItemsCount = 0;

function addPurchaseItem() {
    purchaseItemsCount++;
    const itemHtml = `
        <div class="purchase-item" id="purchaseItem${purchaseItemsCount}" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; align-items: end;">
            <div class="form-group" style="margin: 0;">
                <select class="form-control purchase-item-product" onchange="updatePurchaseTotal()" required>
                    <option value="">اختر المنتج</option>
                    ${products.map(p => `<option value="${p.id}" data-price="${p.purchasePrice}">${p.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="margin: 0;">
                <input type="number" class="form-control purchase-item-quantity" placeholder="الكمية" min="1" value="1" onchange="updatePurchaseTotal()" required>
            </div>
            <div class="form-group" style="margin: 0;">
                <input type="number" class="form-control purchase-item-price" placeholder="السعر" step="0.01" onchange="updatePurchaseTotal()" required>
            </div>
            <div class="form-group" style="margin: 0;">
                <input type="number" class="form-control purchase-item-total" placeholder="الإجمالي" readonly>
            </div>
            <button type="button" class="btn btn-danger btn-icon" onclick="removePurchaseItem(${purchaseItemsCount})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    document.getElementById('purchaseItemsList').insertAdjacentHTML('beforeend', itemHtml);
    
    // Auto-fill price when product is selected
    const newItem = document.getElementById(`purchaseItem${purchaseItemsCount}`);
    const productSelect = newItem.querySelector('.purchase-item-product');
    const priceInput = newItem.querySelector('.purchase-item-price');
    
    productSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        if (price) {
            priceInput.value = price;
            updatePurchaseTotal();
        }
    });
}

function removePurchaseItem(itemId) {
    const item = document.getElementById(`purchaseItem${itemId}`);
    if (item) {
        item.remove();
        updatePurchaseTotal();
    }
}

function updatePurchaseTotal() {
    const items = document.querySelectorAll('.purchase-item');
    let total = 0;
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('.purchase-item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.purchase-item-price').value) || 0;
        const itemTotal = quantity * price;
        item.querySelector('.purchase-item-total').value = itemTotal.toFixed(2);
        total += itemTotal;
    });
    
    document.getElementById('purchaseTotal').value = total.toFixed(2);
}

async function addPurchaseInvoice(event) {
    event.preventDefault();
    
    const items = [];
    document.querySelectorAll('.purchase-item').forEach(item => {
        const productId = parseInt(item.querySelector('.purchase-item-product').value);
        const quantity = parseFloat(item.querySelector('.purchase-item-quantity').value);
        const price = parseFloat(item.querySelector('.purchase-item-price').value);
        
        if (productId && quantity && price) {
            const product = products.find(p => p.id === productId);
            items.push({
                productId: productId,
                productName: product.name,
                quantity: quantity,
                price: price,
                total: quantity * price
            });
            
            // Update product quantity
            product.quantity += quantity;
        }
    });
    
    if (items.length === 0) {
        showAlert('error', '⚠️ يجب إضافة منتج واحد على الأقل!');
        return;
    }
    
    const invoice = {
        id: Date.now(),
        supplierId: parseInt(document.getElementById('purchaseSupplier').value),
        date: document.getElementById('purchaseDate').value,
        invoiceNumber: document.getElementById('purchaseInvoiceNumber').value || `INV-${Date.now()}`,
        items: items,
        total: parseFloat(document.getElementById('purchaseTotal').value),
        paymentStatus: document.getElementById('purchasePaymentStatus').value,
        createdAt: new Date().toISOString()
    };
    
    purchaseInvoices.push(invoice);
    
    // Update supplier total purchases
    const supplier = suppliers.find(s => s.id === invoice.supplierId);
    if (supplier) {
        supplier.totalPurchases += invoice.total;
        if (invoice.paymentStatus === 'unpaid') {
            supplier.debt += invoice.total;
        }
    }
    
    await savePurchaseInvoicesToAPI();
    await saveProductsToAPI();
    await saveSuppliersToAPI();
    
    showAlert('success', '✅ تم إضافة فاتورة الشراء بنجاح!');
    closePurchaseModal();
    displayPurchaseInvoices();
    updateSupplierStats();
    updatePurchaseStats();
    displayProducts();
    displayPOSProducts();
}

function displayPurchaseInvoices() {
    const container = document.getElementById('purchasesList');
    if (!container) return;

    if (purchaseInvoices.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><h3>لا توجد فواتير شراء</h3></div>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background: var(--primary); color: white;">
                    <th style="padding: 12px; text-align: right;">رقم الفاتورة</th>
                    <th style="padding: 12px; text-align: right;">التاريخ</th>
                    <th style="padding: 12px; text-align: right;">المورد</th>
                    <th style="padding: 12px; text-align: right;">عدد الأصناف</th>
                    <th style="padding: 12px; text-align: right;">الإجمالي</th>
                    <th style="padding: 12px; text-align: center;">الحالة</th>
                    <th style="padding: 12px; text-align: center;">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${purchaseInvoices.slice().reverse().map(invoice => {
                    const supplier = suppliers.find(s => s.id === invoice.supplierId);
                    const statusColors = {
                        paid: 'success',
                        unpaid: 'danger',
                        partial: 'warning'
                    };
                    const statusTexts = {
                        paid: 'مدفوع',
                        unpaid: 'غير مدفوع',
                        partial: 'جزئي'
                    };
                    
                    return `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;">#${invoice.invoiceNumber}</td>
                            <td style="padding: 12px;">${new Date(invoice.date).toLocaleDateString('ar-EG')}</td>
                            <td style="padding: 12px;">${supplier?.name || 'غير محدد'}</td>
                            <td style="padding: 12px;">${invoice.items.length}</td>
                            <td style="padding: 12px; font-weight: 600;">${invoice.total.toFixed(2)} ج.م</td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="product-badge badge-${statusColors[invoice.paymentStatus]}">${statusTexts[invoice.paymentStatus]}</span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <button class="btn btn-primary btn-icon" onclick="viewPurchaseDetails(${invoice.id})" style="padding: 5px 10px;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function updatePurchaseStats() {
    const totalInvoices = purchaseInvoices.length;
    const totalValue = purchaseInvoices.reduce((sum, p) => sum + p.total, 0);
    
    const today = new Date();
    const thisMonthPurchases = purchaseInvoices.filter(p => {
        const pDate = new Date(p.date);
        return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
    }).reduce((sum, p) => sum + p.total, 0);
    
    if (document.getElementById('totalPurchaseInvoices')) {
        document.getElementById('totalPurchaseInvoices').textContent = totalInvoices;
    }
    if (document.getElementById('purchasesValue')) {
        document.getElementById('purchasesValue').textContent = totalValue.toFixed(2) + ' ج.م';
    }
    if (document.getElementById('purchasesThisMonth')) {
        document.getElementById('purchasesThisMonth').textContent = thisMonthPurchases.toFixed(2) + ' ج.م';
    }
}

function filterPurchases() {
    displayPurchaseInvoices();
}

function viewPurchaseDetails(invoiceId) {
    const invoice = purchaseInvoices.find(p => p.id === invoiceId);
    const supplier = suppliers.find(s => s.id === invoice.supplierId);
    
    let details = `
        <strong>فاتورة رقم:</strong> ${invoice.invoiceNumber}<br>
        <strong>المورد:</strong> ${supplier?.name || 'غير محدد'}<br>
        <strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleDateString('ar-EG')}<br><br>
        <strong>المنتجات:</strong><br>
    `;
    
    invoice.items.forEach(item => {
        details += `- ${item.productName}: ${item.quantity} × ${item.price.toFixed(2)} = ${item.total.toFixed(2)} ج.م<br>`;
    });
    
    details += `<br><strong>الإجمالي:</strong> ${invoice.total.toFixed(2)} ج.م`;
    
    showAlert('info', details);
}

// ============================================
// API INTEGRATION
// ============================================

async function saveExpensesToAPI() {
    if (typeof saveDataToAPI === 'function') {
        await saveDataToAPI('expenses', expenses);
    } else {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }
}

async function loadExpensesFromAPI() {
    try {
        if (typeof loadDataFromAPI === 'function') {
            expenses = await loadDataFromAPI('expenses') || [];
        } else {
            expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
    }
}

async function saveCustomersToAPI() {
    if (typeof saveDataToAPI === 'function') {
        await saveDataToAPI('customers', customers);
    } else {
        localStorage.setItem('customers', JSON.stringify(customers));
    }
}

async function loadCustomersFromAPI() {
    try {
        if (typeof loadDataFromAPI === 'function') {
            customers = await loadDataFromAPI('customers') || [];
        } else {
            customers = JSON.parse(localStorage.getItem('customers') || '[]');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        customers = [];
    }
}

async function saveSuppliersToAPI() {
    if (typeof saveDataToAPI === 'function') {
        await saveDataToAPI('suppliers', suppliers);
    } else {
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
    }
}

async function loadSuppliersFromAPI() {
    try {
        if (typeof loadDataFromAPI === 'function') {
            suppliers = await loadDataFromAPI('suppliers') || [];
        } else {
            suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        }
    } catch (error) {
        console.error('Error loading suppliers:', error);
        suppliers = [];
    }
}

async function savePurchaseInvoicesToAPI() {
    if (typeof saveDataToAPI === 'function') {
        await saveDataToAPI('purchaseInvoices', purchaseInvoices);
    } else {
        localStorage.setItem('purchaseInvoices', JSON.stringify(purchaseInvoices));
    }
}

async function loadPurchaseInvoicesFromAPI() {
    try {
        if (typeof loadDataFromAPI === 'function') {
            purchaseInvoices = await loadDataFromAPI('purchaseInvoices') || [];
        } else {
            purchaseInvoices = JSON.parse(localStorage.getItem('purchaseInvoices') || '[]');
        }
    } catch (error) {
        console.error('Error loading purchase invoices:', error);
        purchaseInvoices = [];
    }
}

// Initialize all features on app load
async function initializeFeatures() {
    await loadExpensesFromAPI();
    await loadCustomersFromAPI();
    await loadSuppliersFromAPI();
    await loadPurchaseInvoicesFromAPI();
    
    // Update all displays
    displayExpenses();
    updateExpenseStats();
    displayCustomers();
    updateCustomerStats();
    displaySuppliers();
    updateSupplierStats();
    displayPurchaseInvoices();
    updatePurchaseStats();
    updateDebtsDisplay();
    updateAnalytics();
}

// Call initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFeatures);
} else {
    initializeFeatures();
}
