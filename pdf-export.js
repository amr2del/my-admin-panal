// ============================================
// PDF Export Functions
// ============================================

// تصدير المخزون PDF
async function exportInventoryPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // إضافة خط عربي (تحتاج تحميل)
    doc.setFont('helvetica');
    doc.setFontSize(20);
    
    // العنوان
    doc.text('تقرير المخزون', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, 105, 30, { align: 'center' });
    
    // إحصائيات سريعة
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const lowStock = products.filter(p => p.quantity <= p.minStock).length;
    const totalCapital = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
    
    doc.setFontSize(11);
    doc.text(`\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a: ${totalProducts}`, 20, 45);
    doc.text(`\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u062e\u0632\u0648\u0646: ${totalValue.toFixed(2)} \u062c.\u0645`, 20, 52);
    doc.text(`\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644: ${totalCapital.toFixed(2)} \u062c.\u0645`, 20, 59);
    doc.text(`\u0645\u0646\u062a\u062c\u0627\u062a \u0645\u0646\u062e\u0641\u0636\u0629: ${lowStock}`, 20, 66);
    
    // جدول المنتجات
    const tableData = products.map(p => [
        p.name,
        p.quantity.toString(),
        `${p.purchasePrice.toFixed(2)} \u062c.\u0645`,
        `${p.sellingPrice.toFixed(2)} \u062c.\u0645`,
        `${(p.sellingPrice * p.quantity).toFixed(2)} \u062c.\u0645`,
        p.category || '-'
    ]);
    
    doc.autoTable({
        startY: 75,
        head: [['\u0627\u0644\u0645\u0646\u062a\u062c', '\u0627\u0644\u0643\u0645\u064a\u0629', '\u0633\u0639\u0631 \u0627\u0644\u0634\u0631\u0627\u0621', '\u0633\u0639\u0631 \u0627\u0644\u0628\u064a\u0639', '\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629', '\u0627\u0644\u0641\u0626\u0629']],
        body: tableData,
        styles: { 
            font: 'helvetica',
            fontSize: 9,
            halign: 'right'
        },
        headStyles: { 
            fillColor: [22, 163, 74],
            fontSize: 10,
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 10 }
    });
    
    // حفظ PDF
    doc.save(`inventory_${new Date().getTime()}.pdf`);
    showAlert('success', '\u2705 \u062a\u0645 \u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0645\u062e\u0632\u0648\u0646 PDF \u0628\u0646\u062c\u0627\u062d!');
}

// تصدير المبيعات PDF
async function exportSalesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.text('\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`\u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${new Date().toLocaleDateString('ar-EG')}`, 105, 30, { align: 'center' });
    
    // إحصائيات
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const todaySales = sales.filter(s => {
        const saleDate = new Date(s.date);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, s) => sum + s.total, 0);
    
    doc.setFontSize(11);
    doc.text(`\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a: ${sales.length}`, 20, 45);
    doc.text(`\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a: ${totalSales.toFixed(2)} \u062c.\u0645`, 20, 52);
    doc.text(`\u0645\u0628\u064a\u0639\u0627\u062a \u0627\u0644\u064a\u0648\u0645: ${todaySales.toFixed(2)} \u062c.\u0645`, 20, 59);
    
    // جدول المبيعات
    const tableData = sales.slice(-50).reverse().map(s => [
        `#${s.id}`,
        new Date(s.date).toLocaleDateString('ar-EG'),
        s.customer,
        s.items.length.toString(),
        `${s.total.toFixed(2)} \u062c.\u0645`,
        s.paymentMethod === 'cash' ? '\u0646\u0642\u062f\u064a' : s.paymentMethod === 'card' ? '\u0628\u0637\u0627\u0642\u0629' : '\u062a\u0642\u0633\u064a\u0637'
    ]);
    
    doc.autoTable({
        startY: 70,
        head: [['\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629', '\u0627\u0644\u062a\u0627\u0631\u064a\u062e', '\u0627\u0644\u0639\u0645\u064a\u0644', '\u0639\u062f\u062f \u0627\u0644\u0623\u0635\u0646\u0627\u0641', '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a', '\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639']],
        body: tableData,
        styles: { 
            font: 'helvetica',
            fontSize: 9,
            halign: 'right'
        },
        headStyles: { 
            fillColor: [59, 130, 246],
            fontSize: 10,
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    doc.save(`sales_${new Date().getTime()}.pdf`);
    showAlert('success', '\u2705 \u062a\u0645 \u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a PDF \u0628\u0646\u062c\u0627\u062d!');
}

// تصدير تقرير مالي شامل PDF
async function exportFinancialReportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFont('helvetica');
    doc.setFontSize(22);
    doc.text('\u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0645\u0627\u0644\u064a \u0627\u0644\u0634\u0627\u0645\u0644', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`\u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${new Date().toLocaleDateString('ar-EG')}`, 105, 30, { align: 'center' });
    
    // حساب البيانات المالية
    const totalCapital = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0);
    const expectedProfit = totalInventoryValue - totalCapital;
    const actualRevenue = totalSales;
    
    // المبيعات اليوم
    const today = new Date();
    const todaySales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate.toDateString() === today.toDateString();
    });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    
    // المبيعات هذا الشهر
    const thisMonth = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    });
    const monthRevenue = thisMonth.reduce((sum, s) => sum + s.total, 0);
    
    // قسم المخزون
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text('\u0627\u0644\u0645\u062e\u0632\u0648\u0646', 20, 50);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0627\u0644\u0645\u0633\u062a\u062b\u0645\u0631: ${totalCapital.toFixed(2)} \u062c.\u0645`, 25, 60);
    doc.text(`\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u062e\u0632\u0648\u0646 \u0627\u0644\u062d\u0627\u0644\u064a\u0629: ${totalInventoryValue.toFixed(2)} \u062c.\u0645`, 25, 68);
    doc.text(`\u0639\u062f\u062f \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a: ${products.length}`, 25, 76);
    doc.text(`\u0627\u0644\u0631\u0628\u062d \u0627\u0644\u0645\u062a\u0648\u0642\u0639: ${expectedProfit.toFixed(2)} \u062c.\u0645`, 25, 84);
    
    // قسم المبيعات
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('\u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a', 20, 100);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a: ${sales.length} \u0641\u0627\u062a\u0648\u0631\u0629`, 25, 110);
    doc.text(`\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a: ${actualRevenue.toFixed(2)} \u062c.\u0645`, 25, 118);
    doc.text(`\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062e\u0635\u0648\u0645\u0627\u062a: ${totalDiscount.toFixed(2)} \u062c.\u0645`, 25, 126);
    doc.text(`\u0645\u0628\u064a\u0639\u0627\u062a \u0627\u0644\u064a\u0648\u0645: ${todayRevenue.toFixed(2)} \u062c.\u0645`, 25, 134);
    doc.text(`\u0645\u0628\u064a\u0639\u0627\u062a \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631: ${monthRevenue.toFixed(2)} \u062c.\u0645`, 25, 142);
    
    // قسم الأداء
    doc.setFontSize(16);
    doc.setTextColor(234, 179, 8);
    doc.text('\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621', 20, 158);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const profitMargin = totalInventoryValue > 0 ? ((expectedProfit / totalInventoryValue) * 100) : 0;
    const averageSaleValue = sales.length > 0 ? (actualRevenue / sales.length) : 0;
    const turnoverRate = totalCapital > 0 ? ((actualRevenue / totalCapital) * 100) : 0;
    
    doc.text(`\u0647\u0627\u0645\u0634 \u0627\u0644\u0631\u0628\u062d: ${profitMargin.toFixed(2)}%`, 25, 168);
    doc.text(`\u0645\u062a\u0648\u0633\u0637 \u0642\u064a\u0645\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629: ${averageSaleValue.toFixed(2)} \u062c.\u0645`, 25, 176);
    doc.text(`\u0645\u0639\u062f\u0644 \u062f\u0648\u0631\u0627\u0646 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644: ${turnoverRate.toFixed(2)}%`, 25, 184);
    
    // جدول أفضل المنتجات مبيعاً
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
        .slice(0, 10)
        .map(([name, data]) => [
            name,
            data.quantity.toString(),
            `${data.revenue.toFixed(2)} \u062c.\u0645`
        ]);
    
    if (topProducts.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('\u0623\u0641\u0636\u0644 10 \u0645\u0646\u062a\u062c\u0627\u062a \u0645\u0628\u064a\u0639\u0627\u064b', 105, 200, { align: 'center' });
        
        doc.autoTable({
            startY: 210,
            head: [['\u0627\u0644\u0645\u0646\u062a\u062c', '\u0627\u0644\u0643\u0645\u064a\u0629 \u0627\u0644\u0645\u0628\u0627\u0639\u0629', '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0625\u064a\u0631\u0627\u062f']],
            body: topProducts,
            styles: { 
                font: 'helvetica',
                fontSize: 9,
                halign: 'right'
            },
            headStyles: { 
                fillColor: [139, 92, 246],
                fontSize: 10,
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
    }
    
    doc.save(`financial_report_${new Date().getTime()}.pdf`);
    showAlert('success', '\u2705 \u062a\u0645 \u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0645\u0627\u0644\u064a PDF \u0628\u0646\u062c\u0627\u062d!');
}
