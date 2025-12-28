// ============================================
// PDF Export Functions - Using HTML2PDF
// ============================================

// تصدير المخزون PDF
async function exportInventoryPDF() {
    // إحصائيات سريعة
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const lowStock = products.filter(p => p.quantity <= p.minStock).length;
    const totalCapital = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
    
    // إنشاء HTML للتقرير
    const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
                h1 { text-align: center; color: #16a34a; margin-bottom: 10px; }
                .date { text-align: center; color: #666; margin-bottom: 30px; }
                .stats { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .stats div { margin: 10px 0; font-size: 14px; }
                .stats strong { color: #16a34a; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #16a34a; color: white; padding: 12px; text-align: right; }
                td { padding: 10px; border-bottom: 1px solid #ddd; text-align: right; }
                tr:nth-child(even) { background: #f9f9f9; }
                .total { background: #16a34a; color: white; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>📦 تقرير المخزون</h1>
            <div class="date">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
            
            <div class="stats">
                <div><strong>إجمالي المنتجات:</strong> ${totalProducts}</div>
                <div><strong>قيمة المخزون:</strong> ${totalValue.toFixed(2)} ج.م</div>
                <div><strong>رأس المال المستثمر:</strong> ${totalCapital.toFixed(2)} ج.م</div>
                <div><strong>منتجات منخفضة:</strong> ${lowStock}</div>
                <div><strong>الربح المتوقع:</strong> ${(totalValue - totalCapital).toFixed(2)} ج.م</div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>سعر الشراء</th>
                        <th>سعر البيع</th>
                        <th>القيمة الإجمالية</th>
                        <th>الفئة</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.quantity}</td>
                            <td>${p.purchasePrice.toFixed(2)} ج.م</td>
                            <td>${p.sellingPrice.toFixed(2)} ج.م</td>
                            <td>${(p.sellingPrice * p.quantity).toFixed(2)} ج.م</td>
                            <td>${p.category || '-'}</td>
                        </tr>
                    `).join('')}
                    <tr class="total">
                        <td colspan="4">الإجمالي</td>
                        <td>${totalValue.toFixed(2)} ج.م</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // إنشاء عنصر مؤقت
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    // خيارات PDF
    const opt = {
        margin: 10,
        filename: `inventory_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // تحويل إلى PDF
    html2pdf().set(opt).from(element).save();
    showAlert('success', '✅ تم تصدير المخزون PDF بنجاح!');
}

// تصدير المبيعات PDF
async function exportSalesPDF() {
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0);
    const todaySales = sales.filter(s => {
        const saleDate = new Date(s.date);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    
    const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
                h1 { text-align: center; color: #3b82f6; margin-bottom: 10px; }
                .date { text-align: center; color: #666; margin-bottom: 30px; }
                .stats { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .stats div { margin: 10px 0; font-size: 14px; }
                .stats strong { color: #3b82f6; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th { background: #3b82f6; color: white; padding: 10px; text-align: right; }
                td { padding: 8px; border-bottom: 1px solid #ddd; text-align: right; }
                tr:nth-child(even) { background: #f9f9f9; }
                .total { background: #3b82f6; color: white; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>💰 تقرير المبيعات</h1>
            <div class="date">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
            
            <div class="stats">
                <div><strong>إجمالي المبيعات:</strong> ${sales.length} فاتورة</div>
                <div><strong>إجمالي الإيرادات:</strong> ${totalSales.toFixed(2)} ج.م</div>
                <div><strong>إجمالي الخصومات:</strong> ${totalDiscount.toFixed(2)} ج.م</div>
                <div><strong>مبيعات اليوم:</strong> ${todayRevenue.toFixed(2)} ج.م (${todaySales.length} فاتورة)</div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>رقم الفاتورة</th>
                        <th>التاريخ</th>
                        <th>العميل</th>
                        <th>عدد الأصناف</th>
                        <th>الإجمالي</th>
                        <th>طريقة الدفع</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.slice(-50).reverse().map(s => `
                        <tr>
                            <td>#${s.id}</td>
                            <td>${new Date(s.date).toLocaleDateString('ar-EG')}</td>
                            <td>${s.customer}</td>
                            <td>${s.items.length}</td>
                            <td>${s.total.toFixed(2)} ج.م</td>
                            <td>${s.paymentMethod === 'cash' ? 'نقدي' : s.paymentMethod === 'card' ? 'بطاقة' : 'تقسيط'}</td>
                        </tr>
                    `).join('')}
                    <tr class="total">
                        <td colspan="4">الإجمالي</td>
                        <td>${totalSales.toFixed(2)} ج.م</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
        margin: 10,
        filename: `sales_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
    showAlert('success', '✅ تم تصدير المبيعات PDF بنجاح!');
}

// تصدير تقرير مالي شامل PDF
async function exportFinancialReportPDF() {
    const totalCapital = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0);
    const expectedProfit = totalInventoryValue - totalCapital;
    
    const today = new Date();
    const todaySales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate.toDateString() === today.toDateString();
    });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    
    const thisMonth = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    });
    const monthRevenue = thisMonth.reduce((sum, s) => sum + s.total, 0);
    
    const profitMargin = totalInventoryValue > 0 ? ((expectedProfit / totalInventoryValue) * 100) : 0;
    const averageSaleValue = sales.length > 0 ? (totalSales / sales.length) : 0;
    const turnoverRate = totalCapital > 0 ? ((totalSales / totalCapital) * 100) : 0;
    
    // حساب أفضل المنتجات
    const productSales = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = { quantity: 0, revenue: 0 };
            }
            productSales[item.name].quantity += item.quantity;
            productSales[item.name].revenue += item.price * item.quantity;
        });
    });
    
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);
    
    const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
                h1 { text-align: center; color: #8b5cf6; margin-bottom: 10px; font-size: 24px; }
                .date { text-align: center; color: #666; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .section-title { background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; padding: 12px; border-radius: 8px; font-size: 16px; margin-bottom: 15px; }
                .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
                .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; border-right: 4px solid #8b5cf6; }
                .stat-label { font-size: 12px; color: #666; margin-bottom: 5px; }
                .stat-value { font-size: 18px; font-weight: bold; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
                th { background: #8b5cf6; color: white; padding: 10px; text-align: right; font-size: 12px; }
                td { padding: 8px; border-bottom: 1px solid #ddd; text-align: right; }
                tr:nth-child(even) { background: #f9f9f9; }
                .highlight { background: #fef3c7; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>📊 التقرير المالي الشامل</h1>
            <div class="date">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
            
            <div class="section">
                <div class="section-title">💰 المخزون ورأس المال</div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">رأس المال المستثمر</div>
                        <div class="stat-value">${totalCapital.toFixed(2)} ج.م</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">قيمة المخزون الحالية</div>
                        <div class="stat-value">${totalInventoryValue.toFixed(2)} ج.م</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">عدد المنتجات</div>
                        <div class="stat-value">${products.length}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">الربح المتوقع</div>
                        <div class="stat-value">${expectedProfit.toFixed(2)} ج.م</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📈 المبيعات</div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">إجمالي المبيعات</div>
                        <div class="stat-value">${sales.length} فاتورة</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">إجمالي الإيرادات</div>
                        <div class="stat-value">${totalSales.toFixed(2)} ج.م</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">مبيعات اليوم</div>
                        <div class="stat-value">${todayRevenue.toFixed(2)} ج.م</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">مبيعات هذا الشهر</div>
                        <div class="stat-value">${monthRevenue.toFixed(2)} ج.م</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">إجمالي الخصومات</div>
                        <div class="stat-value">${totalDiscount.toFixed(2)} ج.م</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">متوسط قيمة الفاتورة</div>
                        <div class="stat-value">${averageSaleValue.toFixed(2)} ج.م</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📊 مؤشرات الأداء</div>
                <div class="stats-grid">
                    <div class="stat-box highlight">
                        <div class="stat-label">هامش الربح</div>
                        <div class="stat-value">${profitMargin.toFixed(2)}%</div>
                    </div>
                    <div class="stat-box highlight">
                        <div class="stat-label">معدل دوران رأس المال</div>
                        <div class="stat-value">${turnoverRate.toFixed(2)}%</div>
                    </div>
                </div>
            </div>
            
            ${topProducts.length > 0 ? `
            <div class="section">
                <div class="section-title">🏆 أفضل 10 منتجات مبيعاً</div>
                <table>
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية المباعة</th>
                            <th>إجمالي الإيراد</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topProducts.map(([name, data]) => `
                            <tr>
                                <td>${name}</td>
                                <td>${data.quantity}</td>
                                <td>${data.revenue.toFixed(2)} ج.م</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </body>
        </html>
    `;
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
        margin: 10,
        filename: `financial_report_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
    showAlert('success', '✅ تم تصدير التقرير المالي PDF بنجاح!');
}
