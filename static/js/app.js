// دالة حفظ السجل
async function saveEntry() {
    const formData = {
        date: document.getElementById('date').value,
        sender_merchant: document.getElementById('senderMerchant').value,
        recipient_merchant: document.getElementById('recipientMerchant').value,
        foreign_driver: document.getElementById('foreignDriver').value,
        foreign_car: document.getElementById('foreignCar').value,
        local_driver: document.getElementById('localDriver').value,
        local_car: document.getElementById('localCar').value,
        goods_type: document.getElementById('goodsType').value,
        fees: parseFloat(document.getElementById('fees').value) || 0,
        advance: parseFloat(document.getElementById('advance').value) || 0,
        clearance_cost: parseFloat(document.getElementById('clearanceCost').value) || 0,
        notes: document.getElementById('notes').value
    };

    // التحقق من البيانات المطلوبة
    if (!formData.date || !formData.recipient_merchant) {
        showAlert('يرجى ملء جميع البيانات المطلوبة', 'warning');
        return;
    }

    // التحقق من أن واحد على الأقل من الحقول المالية أكبر من الصفر
    if (formData.fees === 0 && formData.advance === 0 && formData.clearance_cost === 0) {
        showAlert('يجب إدخال قيمة لواحد على الأقل من الحقول المالية', 'warning');
        return;
    }

    try {
        const response = await fetch('/save_record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            document.getElementById('mainForm').reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            await refreshAllData(); // تحديث شامل لجميع البيانات
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error saving record:', error);
        showAlert('حدث خطأ في حفظ السجل', 'danger');
    }
}

// دالة تحديث الإحصائيات
async function updateStats() {
    try {
        const response = await fetch('/get_stats');
        const stats = await response.json();
        
        document.getElementById('totalRecords').textContent = stats.total_records;
        document.getElementById('totalGrossProfit').textContent = `$${stats.total_gross_profit.toFixed(2)}`;
        document.getElementById('totalMerchantDebt').textContent = `$${stats.total_merchant_debt.toFixed(2)}`;
        document.getElementById('totalWithdrawals').textContent = `$${stats.total_withdrawals.toFixed(2)}`;
        document.getElementById('availableBalance').textContent = `$${stats.available_balance.toFixed(2)}`;
        document.getElementById('finalNetProfit').textContent = `$${stats.final_net_profit.toFixed(2)}`;
        document.getElementById('availableForWithdraw').textContent = `$${stats.available_balance.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// دالة شاملة لتحديث جميع البيانات في النظام
async function refreshAllData() {
    try {
        console.log('بدء تحديث شامل لجميع البيانات...');
        
        // تحديث الإحصائيات العامة
        await updateStats();
        
        // تحديث حساب النبر إذا كان التبويب مفتوح
        const naberSection = document.getElementById('naberAccount');
        if (naberSection && !naberSection.classList.contains('d-none')) {
            await loadNaberAccount();
        }
        
        // تحديث إدارة الشراكة إذا كان التبويب مفتوح
        const partnersSection = document.getElementById('partnersManagement');
        if (partnersSection && !partnersSection.classList.contains('d-none')) {
            await loadPartnersData();
        }
        
        // تحديث السحوبات إذا كان التبويب مفتوح
        const withdrawalsSection = document.getElementById('withdrawals');
        if (withdrawalsSection && !withdrawalsSection.classList.contains('d-none')) {
            await loadWithdrawals();
        }
        
        console.log('تم تحديث جميع البيانات بنجاح');
        
    } catch (error) {
        console.error('خطأ في التحديث الشامل:', error);
    }
}

// دالة فتح سجلات الإدخالات
async function openRecords() {
    try {
        const response = await fetch('/get_records');
        const records = await response.json();
        
        const tbody = document.getElementById('recordsTableBody');
        tbody.innerHTML = '';
        
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td><strong>${record.merchant_name}</strong></td>
                <td>${record.goods_type || '-'}</td>
                <td>$${record.fees.toFixed(2)}</td>
                <td>$${record.advance.toFixed(2)}</td>
                <td>$${record.my_profit.toFixed(2)}</td>
                <td>$${record.addition.toFixed(2)}</td>
                <td>$${record.returned.toFixed(2)}</td>
                <td><strong>$${record.total_debt.toFixed(2)}</strong></td>
                <td class="${record.net_profit >= 0 ? 'text-success' : 'text-danger'}">
                    <strong>$${record.net_profit.toFixed(2)}</strong>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        new bootstrap.Modal(document.getElementById('recordsModal')).show();
    } catch (error) {
        console.error('Error loading records:', error);
        showAlert('حدث خطأ في تحميل السجلات', 'danger');
    }
}

// دالة فتح ديون التجار
async function openMerchantsDebts() {
    try {
        const response = await fetch('/get_merchants_debts');
        const merchants = await response.json();
        
        const tbody = document.getElementById('merchantsTableBody');
        tbody.innerHTML = '';
        
        merchants.forEach(merchant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${merchant.merchant_name}</strong></td>
                <td>$${merchant.total_debt.toFixed(2)}</td>
                <td class="text-success">$${merchant.total_payments.toFixed(2)}</td>
                <td class="${merchant.remaining_debt > 0 ? 'text-danger' : 'text-success'}">
                    <strong>$${merchant.remaining_debt.toFixed(2)}</strong>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="openMerchantStatement('${merchant.merchant_name}')">
                        <i class="fas fa-file-alt"></i> كشف الحساب
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        new bootstrap.Modal(document.getElementById('merchantsModal')).show();
    } catch (error) {
        console.error('Error loading merchants debts:', error);
        showAlert('حدث خطأ في تحميل ديون التجار', 'danger');
    }
}

// دالة فتح كشف حساب تاجر
async function openMerchantStatement(merchantName) {
    currentMerchant = merchantName;
    currentMerchantName = merchantName; // للاستخدام مع الإضافات والإرجاعات
    
    // تهيئة التاريخ الحالي في نموذج التعديل
    const today = new Date().toISOString().split('T')[0];
    const adjustmentDateField = document.getElementById('adjustmentDate');
    if (adjustmentDateField) {
        adjustmentDateField.value = today;
    }
    
    await loadMerchantStatement();
    await loadMerchantAdjustments(merchantName); // تحميل التعديلات
    new bootstrap.Modal(document.getElementById('merchantStatementModal')).show();
}

// دالة تحميل كشف حساب التاجر
async function loadMerchantStatement() {
    if (!currentMerchant) return;
    
    try {
        const response = await fetch(`/get_merchant_statement/${encodeURIComponent(currentMerchant)}`);
        const data = await response.json();
        
        // تحديث عنوان الكشف
        document.getElementById('merchantStatementTitle').textContent = `كشف حساب التاجر: ${currentMerchant}`;
        
        // تحديث الملخص
        document.getElementById('merchantTotalDebt').textContent = `$${(data.summary?.total_debt || 0).toFixed(2)}`;
        document.getElementById('merchantTotalPayments').textContent = `$${(data.summary?.total_payments || 0).toFixed(2)}`;
        document.getElementById('merchantRemainingDebt').textContent = `$${(data.summary?.current_balance || 0).toFixed(2)}`;
        
        // تحديث جدول السجلات
        const recordsTableBody = document.getElementById('merchantRecordsTableBody');
        recordsTableBody.innerHTML = '';
        
        data.records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.goods_type || '-'}</td>
                <td>$${record.fees.toFixed(2)}</td>
                <td>$${record.advance.toFixed(2)}</td>
                <td>$${record.clearance_cost.toFixed(2)}</td>
                <td><strong>$${record.total_debt.toFixed(2)}</strong></td>
                <td>${record.notes || '-'}</td>
            `;
            recordsTableBody.appendChild(row);
        });
        
        // تحديث جدول المدفوعات
        const paymentsTableBody = document.getElementById('merchantPaymentsTableBody');
        paymentsTableBody.innerHTML = '';
        
        data.payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.payment_date}</td>
                <td class="text-success"><strong>$${payment.amount.toFixed(2)}</strong></td>
                <td>$${payment.balance_before.toFixed(2)}</td>
                <td>$${payment.balance_after.toFixed(2)}</td>
                <td>${payment.notes || '-'}</td>
            `;
            paymentsTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading merchant statement:', error);
        showAlert('حدث خطأ في تحميل كشف الحساب', 'danger');
    }
}

// دالة إضافة تسديد
async function addPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentDate = document.getElementById('paymentDate').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('paymentNotes').value;
    
    if (!amount || amount <= 0) {
        showAlert('يرجى إدخال مبلغ صحيح', 'warning');
        return;
    }
    
    if (!currentMerchant) {
        showAlert('لم يتم تحديد التاجر', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/add_payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                merchant_name: currentMerchant,
                amount: amount,
                payment_date: paymentDate,
                notes: notes
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            // مسح النموذج
            document.getElementById('paymentAmount').value = '';
            document.getElementById('paymentNotes').value = '';
            // إعادة تحميل كشف الحساب
            loadMerchantStatement();
            await refreshAllData(); // تحديث شامل لجميع البيانات
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error adding payment:', error);
        showAlert('حدث خطأ في إضافة التسديد', 'danger');
    }
}

// دالة عرض كشف حساب تاجر في modal
function showMerchantStatement(merchantName) {
    openMerchantStatement(merchantName);
}

// دالة فتح السحوبات الخارجية
async function openWithdrawal() {
    await loadWithdrawals();
    showTab('withdrawals');
}

// دالة تحميل السحوبات
async function loadWithdrawals() {
    try {
        const response = await fetch('/get_withdrawals');
        const data = await response.json();
        
        if (data.success) {
            const withdrawals = data.withdrawals || [];
            
            // حساب إجمالي السحوبات للإحصائيات
            const totalWithdrawals = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);
            
            // تحديث الإحصائيات إذا كان العنصر موجود
            const totalWithdrawalsElement = document.getElementById('totalWithdrawalsAmount');
            if (totalWithdrawalsElement) {
                totalWithdrawalsElement.textContent = `$${totalWithdrawals.toFixed(2)}`;
            }
            
            const tbody = document.getElementById('withdrawalsTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                
                withdrawals.forEach(withdrawal => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${withdrawal.date}</td>
                        <td class="text-danger"><strong>$${parseFloat(withdrawal.amount).toFixed(2)}</strong></td>
                        <td><span class="badge bg-secondary">${withdrawal.expense_type}</span></td>
                        <td>${withdrawal.description || '-'}</td>
                        <td>${withdrawal.notes || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deleteWithdrawal(${withdrawal.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        } else {
            console.error('Error loading withdrawals:', data.message);
        }
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        showAlert('حدث خطأ في تحميل السحوبات', 'danger');
    }
}

// دالة إضافة سحب خارجي
async function addWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const withdrawDate = document.getElementById('withdrawDate').value || new Date().toISOString().split('T')[0];
    const expenseType = document.getElementById('expenseType').value || 'عام';
    const description = document.getElementById('withdrawDescription').value;
    const notes = document.getElementById('withdrawNotes').value;
    
    if (!amount || amount <= 0) {
        showAlert('يرجى إدخال مبلغ صحيح', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/save_withdrawal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                date: withdrawDate,
                expense_type: expenseType,
                description: description,
                notes: notes
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            // مسح النموذج
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('withdrawDescription').value = '';
            document.getElementById('withdrawNotes').value = '';
            // إعادة تحميل السحوبات
            loadWithdrawals();
            await refreshAllData(); // تحديث شامل لجميع البيانات
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error adding withdrawal:', error);
        showAlert('حدث خطأ في إضافة السحب', 'danger');
    }
}

// دالة حذف سحب خارجي
async function deleteWithdrawal(withdrawalId) {
    if (!confirm('هل أنت متأكد من حذف هذا السحب؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete_withdrawal/${withdrawalId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            loadWithdrawals();
            updateStats();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting withdrawal:', error);
        showAlert('حدث خطأ في حذف السحب', 'danger');
    }
}

// دوال الطباعة
async function printRecords() {
    try {
        // جلب البيانات من النظام
        const response = await fetch('/get_records');
        const data = await response.json();
        
        if (!data.success || !data.records) {
            showAlert('لا توجد سجلات للطباعة', 'warning');
            return;
        }
        
        const records = data.records;
        
        // تجميع البيانات حسب التاجر
        const merchantTotals = {};
        
        // إنشاء محتوى الجدول
        let tableContent = '';
        records.forEach(record => {
            const merchantName = record.recipient_merchant;
            
            // تجميع إجمالي الدين لكل تاجر
            if (!merchantTotals[merchantName]) {
                merchantTotals[merchantName] = 0;
            }
            merchantTotals[merchantName] += parseFloat(record.total_debt || 0);
            
            tableContent += `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.sender_merchant || ''}</td>
                    <td><strong>${record.recipient_merchant}</strong></td>
                    <td>${record.foreign_driver}/${record.foreign_car}</td>
                    <td>${record.local_driver}/${record.local_car}</td>
                    <td>${record.goods_type}</td>
                    <td>$${parseFloat(record.fees || 0).toFixed(2)}</td>
                    <td>$${parseFloat(record.advance || 0).toFixed(2)}</td>
                    <td>$${parseFloat(record.clearance_cost || 0).toFixed(2)}</td>
                    <td><strong>$${parseFloat(record.total_debt || 0).toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        // إنشاء جدول ملخص الديون لكل تاجر
        let merchantSummaryContent = '';
        let grandTotal = 0;
        Object.entries(merchantTotals).forEach(([merchant, total]) => {
            grandTotal += total;
            merchantSummaryContent += `
                <tr>
                    <td><strong>${merchant}</strong></td>
                    <td><strong>$${total.toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        const printContent = `
            <html>
            <head>
                <title>تقرير السجلات الشامل</title>
                <meta charset="UTF-8">
                <style>
                    @page {
                        size: A4;
                        margin: 15mm;
                        padding: 0;
                        @top-left { content: ""; }
                        @top-center { content: ""; }
                        @top-right { content: ""; }
                        @bottom-left { content: ""; }
                        @bottom-center { content: ""; }
                        @bottom-right { content: ""; }
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        direction: rtl; 
                        margin: 0;
                        padding: 0;
                        color: #000;
                        background: white;
                    }
                    body::before,
                    body::after,
                    html::before,
                    html::after {
                        display: none !important;
                        content: none !important;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: 10px;
                        margin: 0;
                        padding: 0;
                    }
                    th, td { 
                        border: 1px solid #000; 
                        padding: 2px; 
                        text-align: center;
                    }
                    th { 
                        background-color: #ddd; 
                        font-weight: bold;
                        font-size: 9px;
                    }
                    .no-print { display: none; }
                    @media print {
                        @page {
                            size: A4;
                            margin: 10mm;
                            @top-left { content: ""; }
                            @top-center { content: ""; }
                            @top-right { content: ""; }
                            @bottom-left { content: ""; }
                            @bottom-center { content: ""; }
                            @bottom-right { content: ""; }
                        }
                        body { 
                            margin: 0 !important;
                            padding: 0 !important;
                            font-size: 9px;
                        }
                        body::before,
                        body::after,
                        html::before,
                        html::after,
                        *::before,
                        *::after {
                            display: none !important;
                            content: none !important;
                            visibility: hidden !important;
                        }
                        table { 
                            font-size: 8px;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        th, td { 
                            padding: 1px; 
                            font-size: 8px;
                        }
                        th {
                            background-color: #ddd !important;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="main-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%;">التاريخ</th>
                                <th style="width: 10%;">التاجر المرسل</th>
                                <th style="width: 12%;">التاجر المستلم</th>
                                <th style="width: 12%;">السائق/السيارة الأجنبية</th>
                                <th style="width: 12%;">السائق/السيارة المحلية</th>
                                <th style="width: 12%;">نوع البضاعة</th>
                                <th style="width: 8%;">الأجور</th>
                                <th style="width: 8%;">السلفة</th>
                                <th style="width: 8%;">كلفة التخليص</th>
                                <th style="width: 10%;">إجمالي الدين</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableContent}
                        </tbody>
                    </table>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #002147; color: white; border: none; border-radius: 5px;">طباعة</button>
                    <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-right: 10px; background: #6c757d; color: white; border: none; border-radius: 5px;">إغلاق</button>
                </div>
            </body>
            </html>
        `;
        
        // طباعة بنافذة جديدة نظيفة بدون أي هيدر
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @page { 
                            margin: 10mm; 
                            size: A4 landscape;
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            direction: rtl; 
                            margin: 0; 
                            padding: 0;
                            background: white;
                            color: #000;
                            font-size: 9px;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            font-size: 7px; 
                        }
                        th, td { 
                            border: 1px solid #000; 
                            padding: 1px; 
                            text-align: center; 
                            font-size: 6px;
                        }
                        th { 
                            background-color: #f0f0f0; 
                            font-weight: bold; 
                        }
                    </style>
                </head>
                <body>
                    <table>
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>التاجر المرسل</th>
                                <th>التاجر المستلم</th>
                                <th>السائق/السيارة الأجنبية</th>
                                <th>السائق/السيارة المحلية</th>
                                <th>نوع البضاعة</th>
                                <th>الأجور</th>
                                <th>السلفة</th>
                                <th>كلفة التخليص</th>
                                <th>إجمالي الدين</th>
                            </tr>
                        </thead>
                        <tbody>
            `);
            
            // إضافة البيانات سطر بسطر
            records.forEach(record => {
                printWindow.document.write(`
                    <tr>
                        <td>${record.date}</td>
                        <td>${record.sender_merchant || ''}</td>
                        <td>${record.recipient_merchant}</td>
                        <td>${record.foreign_driver}/${record.foreign_car}</td>
                        <td>${record.local_driver}/${record.local_car}</td>
                        <td>${record.goods_type}</td>
                        <td>$${parseFloat(record.fees || 0).toFixed(2)}</td>
                        <td>$${parseFloat(record.advance || 0).toFixed(2)}</td>
                        <td>$${parseFloat(record.clearance_cost || 0).toFixed(2)}</td>
                        <td>$${parseFloat(record.total_debt || 0).toFixed(2)}</td>
                    </tr>
                `);
            });
            
            printWindow.document.write(`
                        </tbody>
                    </table>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
                showAlert('تم إنشاء التقرير بنجاح', 'success');
            }, 1000);
        } else {
            showAlert('لا يمكن فتح نافذة الطباعة - تأكد من السماح للنوافذ المنبثقة', 'warning');
        }
        
    } catch (error) {
        console.error('Error printing records:', error);
        showAlert('حدث خطأ في طباعة السجلات', 'danger');
    }
}

async function printMerchantsDebts() {
    try {
        // جلب بيانات ديون التجار من النظام
        const response = await fetch('/get_merchants_debts');
        const data = await response.json();
        
        if (!data.success || !data.merchants) {
            showAlert('لا توجد بيانات ديون للطباعة', 'warning');
            return;
        }
        
        const merchants = data.merchants;
        
        // إنشاء محتوى الجدول
        let tableContent = '';
        let grandTotalDebt = 0;
        let grandTotalPayments = 0;
        let grandTotalRemaining = 0;
        
        merchants.forEach(merchant => {
            const totalDebt = parseFloat(merchant.total_debt || 0);
            const totalPayments = parseFloat(merchant.total_payments || 0);
            const remaining = totalDebt - totalPayments;
            
            grandTotalDebt += totalDebt;
            grandTotalPayments += totalPayments;
            grandTotalRemaining += remaining;
            
            tableContent += `
                <tr>
                    <td><strong>${merchant.merchant_name}</strong></td>
                    <td>$${totalDebt.toFixed(2)}</td>
                    <td>$${totalPayments.toFixed(2)}</td>
                    <td class="${remaining > 0 ? 'debt-positive' : 'debt-zero'}">
                        <strong>$${remaining.toFixed(2)}</strong>
                    </td>
                </tr>
            `;
        });
        
        const printContent = `
            <html>
            <head>
                <title>تقرير ديون التجار</title>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: 'Cairo', Arial, sans-serif; 
                        direction: rtl; 
                        margin: 15px;
                        color: #333;
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 25px; 
                        padding-bottom: 15px; 
                        border-bottom: 3px solid #002147; 
                    }
                    .company-name { 
                        font-size: 20px; 
                        font-weight: bold; 
                        color: #002147; 
                        margin-bottom: 8px; 
                    }
                    .report-title { 
                        font-size: 16px; 
                        font-weight: 600; 
                        color: #333; 
                        margin-bottom: 5px; 
                    }
                    .print-date { 
                        font-size: 12px; 
                        color: #666; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 25px; 
                        font-size: 12px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: center; 
                    }
                    th { 
                        background-color: #002147; 
                        color: white; 
                        font-weight: bold;
                    }
                    .debt-positive { 
                        color: #dc3545; 
                        font-weight: bold; 
                    }
                    .debt-zero { 
                        color: #28a745; 
                        font-weight: bold; 
                    }
                    .total-row {
                        background-color: #f8f9fa;
                        font-weight: bold;
                        font-size: 13px;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">شركة الأصدقاء للتخليص الكمركي</div>
                    <div class="report-title">تقرير ديون التجار الشامل</div>
                    <div class="print-date">
                        تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} | الوقت: ${new Date().toLocaleTimeString('ar-SA')}
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>اسم التاجر</th>
                            <th>إجمالي الدين المستحق</th>
                            <th>إجمالي المدفوعات</th>
                            <th>الرصيد المتبقي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableContent}
                        <tr class="total-row">
                            <td><strong>المجموع الكلي</strong></td>
                            <td><strong>$${grandTotalDebt.toFixed(2)}</strong></td>
                            <td><strong>$${grandTotalPayments.toFixed(2)}</strong></td>
                            <td class="${grandTotalRemaining > 0 ? 'debt-positive' : 'debt-zero'}">
                                <strong>$${grandTotalRemaining.toFixed(2)}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center;">
                    <div style="font-size: 12px; color: #666;">
                        عدد التجار: ${merchants.length} | إجمالي الديون المستحقة: $${grandTotalRemaining.toFixed(2)} | النظام المحاسبي المتطور
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #002147; color: white; border: none; border-radius: 5px;">طباعة</button>
                    <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-right: 10px; background: #6c757d; color: white; border: none; border-radius: 5px;">إغلاق</button>
                </div>
            </body>
            </html>
        `;
        
        // طباعة محسنة
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.focus();
                showAlert('تم إنشاء تقرير ديون التجار بنجاح', 'success');
            }, 500);
        } else {
            // طريقة بديلة
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            showAlert('تم طباعة تقرير الديون', 'success');
        }
        
    } catch (error) {
        console.error('Error printing merchants debts:', error);
        showAlert('حدث خطأ في طباعة ديون التجار', 'danger');
    }
}

async function printMerchantStatement() {
    try {
        const selectedMerchant = document.getElementById('merchantFilter')?.value;
        
        if (!selectedMerchant || selectedMerchant === 'all') {
            showAlert('يرجى اختيار تاجر محدد أولاً', 'warning');
            return;
        }
        
        // جلب بيانات التاجر من النظام
        const response = await fetch(`/get_merchant_statement/${encodeURIComponent(selectedMerchant)}`);
        const data = await response.json();
        
        if (!data.success) {
            showAlert('خطأ في جلب بيانات التاجر', 'danger');
            return;
        }
        
        // إنشاء محتوى جدول السجلات
        let recordsContent = '';
        let totalDebt = 0;
        let totalFees = 0;
        let totalAdvance = 0;
        let totalClearance = 0;
        
        if (data.records && data.records.length > 0) {
            data.records.forEach(record => {
                totalDebt += parseFloat(record.total_debt || 0);
                totalFees += parseFloat(record.fees || 0);
                totalAdvance += parseFloat(record.advance || 0);
                totalClearance += parseFloat(record.clearance_cost || 0);
                
                recordsContent += `
                    <tr>
                        <td>${record.date}</td>
                        <td>${record.sender_merchant || ''}</td>
                        <td>${record.foreign_driver}/${record.foreign_car}</td>
                        <td>${record.local_driver}/${record.local_car}</td>
                        <td>${record.goods_type}</td>
                        <td>$${parseFloat(record.fees || 0).toFixed(2)}</td>
                        <td>$${parseFloat(record.advance || 0).toFixed(2)}</td>
                        <td>$${parseFloat(record.clearance_cost || 0).toFixed(2)}</td>
                        <td><strong>$${parseFloat(record.total_debt || 0).toFixed(2)}</strong></td>
                        <td>${record.notes || ''}</td>
                    </tr>
                `;
            });
        }
        
        // إنشاء محتوى جدول المدفوعات
        let paymentsContent = '';
        let totalPayments = 0;
        
        if (data.payments && data.payments.length > 0) {
            data.payments.forEach(payment => {
                totalPayments += parseFloat(payment.amount || 0);
                paymentsContent += `
                    <tr>
                        <td>${payment.payment_date}</td>
                        <td>$${parseFloat(payment.amount || 0).toFixed(2)}</td>
                        <td>$${parseFloat(payment.balance_before || 0).toFixed(2)}</td>
                        <td>$${parseFloat(payment.balance_after || 0).toFixed(2)}</td>
                        <td>${payment.notes || ''}</td>
                    </tr>
                `;
            });
        } else {
            paymentsContent = '<tr><td colspan="5" style="text-align: center; color: #666;">لا توجد مدفوعات مسجلة</td></tr>';
        }
        
        const remainingBalance = totalDebt - totalPayments;
        
        const printContent = `
            <html>
            <head>
                <title>كشف حساب التاجر - ${selectedMerchant}</title>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: 'Cairo', Arial, sans-serif; 
                        direction: rtl; 
                        margin: 15px;
                        color: #333;
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 25px; 
                        padding-bottom: 15px; 
                        border-bottom: 3px solid #002147; 
                    }
                    .company-name { 
                        font-size: 20px; 
                        font-weight: bold; 
                        color: #002147; 
                        margin-bottom: 8px; 
                    }
                    .merchant-name { 
                        font-size: 18px; 
                        font-weight: 600; 
                        color: #28a745; 
                        margin-bottom: 5px; 
                    }
                    .print-date { 
                        font-size: 12px; 
                        color: #666; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 25px; 
                        font-size: 11px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 6px; 
                        text-align: center; 
                    }
                    th { 
                        background-color: #002147; 
                        color: white; 
                        font-weight: bold;
                    }
                    .payments-table th {
                        background-color: #28a745;
                    }
                    .summary-table th {
                        background-color: #17a2b8;
                    }
                    .summary-row {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .section-title {
                        font-size: 14px;
                        font-weight: bold;
                        color: #002147;
                        margin: 20px 0 10px 0;
                        padding: 5px;
                        background-color: #f8f9fa;
                        border-right: 4px solid #002147;
                    }
                    .balance-positive { color: #28a745; }
                    .balance-negative { color: #dc3545; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">شركة الأصدقاء للتخليص الكمركي</div>
                    <div class="merchant-name">كشف حساب التاجر: ${selectedMerchant}</div>
                    <div class="print-date">
                        تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} | الوقت: ${new Date().toLocaleTimeString('ar-SA')}
                    </div>
                </div>
                
                <div class="section-title">📋 السجلات والمعاملات</div>
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>التاجر المرسل</th>
                            <th>السائق/السيارة الأجنبية</th>
                            <th>السائق/السيارة المحلية</th>
                            <th>نوع البضاعة</th>
                            <th>الأجور</th>
                            <th>السلفة</th>
                            <th>كلفة التخليص</th>
                            <th>إجمالي الدين</th>
                            <th>الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recordsContent}
                        <tr class="summary-row">
                            <td colspan="5"><strong>المجاميع</strong></td>
                            <td><strong>$${totalFees.toFixed(2)}</strong></td>
                            <td><strong>$${totalAdvance.toFixed(2)}</strong></td>
                            <td><strong>$${totalClearance.toFixed(2)}</strong></td>
                            <td><strong>$${totalDebt.toFixed(2)}</strong></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="section-title">💰 تاريخ المدفوعات</div>
                <table class="payments-table">
                    <thead>
                        <tr>
                            <th>تاريخ الدفع</th>
                            <th>المبلغ المدفوع</th>
                            <th>الرصيد قبل الدفع</th>
                            <th>الرصيد بعد الدفع</th>
                            <th>الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paymentsContent}
                    </tbody>
                </table>
                
                <div class="section-title">📊 ملخص الحساب</div>
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>البيان</th>
                            <th>المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>إجمالي الديون المستحقة</td>
                            <td><strong>$${totalDebt.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>إجمالي المدفوعات</td>
                            <td><strong>$${totalPayments.toFixed(2)}</strong></td>
                        </tr>
                        <tr class="summary-row ${remainingBalance >= 0 ? 'balance-negative' : 'balance-positive'}">
                            <td><strong>الرصيد المتبقي</strong></td>
                            <td><strong>$${remainingBalance.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center;">
                    <div style="font-size: 12px; color: #666;">
                        عدد المعاملات: ${data.records?.length || 0} | عدد المدفوعات: ${data.payments?.length || 0} | النظام المحاسبي المتطور
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #002147; color: white; border: none; border-radius: 5px;">طباعة</button>
                    <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-right: 10px; background: #6c757d; color: white; border: none; border-radius: 5px;">إغلاق</button>
                </div>
            </body>
            </html>
        `;
        
        // طباعة محسنة
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.focus();
                showAlert(`تم إنشاء كشف حساب ${selectedMerchant} بنجاح`, 'success');
            }, 500);
        } else {
            // طريقة بديلة
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            showAlert('تم طباعة كشف الحساب', 'success');
        }
        
    } catch (error) {
        console.error('Error printing merchant statement:', error);
        showAlert('حدث خطأ في طباعة كشف الحساب', 'danger');
    }
}

function printWithdrawals() {
    const printWindow = window.open('', '_blank');
    const tableContent = document.getElementById('withdrawalsTableBody').outerHTML;
    
    printWindow.document.write(`
        <html>
        <head>
            <title>السحوبات الخارجية</title>
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>السحوبات الخارجية</h2>
                <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>المبلغ</th>
                        <th>نوع المصروف</th>
                        <th>الوصف</th>
                        <th>الملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableContent}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// دوال إدارة الشراكة
async function openPartnersManagement() {
    try {
        await loadPartnersData();
        showTab('partners');
    } catch (error) {
        console.error('Error opening partners management:', error);
        showAlert('حدث خطأ في فتح إدارة الشراكة', 'danger');
    }
}

async function loadPartnersData() {
    try {
        // تحميل بيانات الشركاء والأرباح معاً
        const partnersResponse = await fetch('/get_partners');
        const partnersData = await partnersResponse.json();
        
        // تحميل تقرير توزيع الأرباح المحدث
        console.log('Fetching profit distribution report...');
        const profitsResponse = await fetch('/get_profit_distribution_report');
        const profitsData = await profitsResponse.json();
        
        console.log('Loaded partners data:', partnersData);
        console.log('Loaded profits data:', profitsData);
        console.log('Available for distribution:', profitsData.available_for_distribution);
        console.log('Total gross profit:', profitsData.total_gross_profit);
        
        if (partnersData.success && profitsData.success) {
            // تحديث إحصائيات الأرباح
            const availableProfits = profitsData.available_for_distribution || 0;
            const totalClearance = profitsData.total_gross_profit || 0;
            const totalBorderExpenses = profitsData.total_border_expenses || 0;
            const totalWithdrawals = profitsData.total_withdrawals || 0;
            const totalDistributed = profitsData.total_distributed || 0;
            
            // تحديث العناصر في الواجهة
            const distributableElement = document.getElementById('totalNetProfits');
            const clearanceElement = document.getElementById('totalClearanceProfits');
            const distributedElement = document.getElementById('totalDistributedProfits');
            
            console.log('Elements found:', {
                distributableElement: !!distributableElement,
                clearanceElement: !!clearanceElement,
                distributedElement: !!distributedElement
            });
            
            console.log('Updating values:', {
                availableProfits,
                totalClearance,
                totalDistributed
            });
            
            if (distributableElement) {
                distributableElement.textContent = `$${availableProfits.toFixed(2)}`;
                console.log('Updated distributableProfit to:', `$${availableProfits.toFixed(2)}`);
            } else {
                console.error('distributableProfit element not found!');
            }
            if (clearanceElement) {
                clearanceElement.textContent = `$${totalClearance.toFixed(2)}`;
                console.log('Updated totalClearanceProfit to:', `$${totalClearance.toFixed(2)}`);
            } else {
                console.error('totalClearanceProfit element not found!');
            }
            if (distributedElement) {
                distributedElement.textContent = `$${totalDistributed.toFixed(2)}`;
                console.log('Updated totalDistributedProfit to:', `$${totalDistributed.toFixed(2)}`);
            } else {
                console.error('totalDistributedProfit element not found!');
            }
            
            // تحديث جدول الشركاء
            const tbody = document.getElementById('partnersTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                
                if (profitsData.partners && profitsData.partners.length > 0) {
                    profitsData.partners.forEach(partner => {
                        const balanceClass = partner.current_balance >= 0 ? 'text-success' : 'text-danger';
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><strong>${partner.name}</strong></td>
                            <td>${partner.profit_percentage.toFixed(1)}%</td>
                            <td>$${partner.new_share.toFixed(2)}</td>
                            <td class="text-danger">$${partner.total_withdrawals.toFixed(2)}</td>
                            <td class="text-success">$${partner.total_additions.toFixed(2)}</td>
                            <td class="${balanceClass}">
                                <strong>$${partner.current_balance.toFixed(2)}</strong>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="showPartnerStatement('${partner.name}')">
                                    <i class="fas fa-file-alt"></i> كشف الحساب
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                }
            }
            
            // تحديث قائمة الشركاء في النموذج
            const partnerSelect = document.getElementById('partnerSelect');
            if (partnerSelect) {
                partnerSelect.innerHTML = '<option value="">-- اختر الشريك --</option>';
                
                if (partnersData.partners) {
                    partnersData.partners.forEach(partner => {
                        const option = document.createElement('option');
                        option.value = partner.id;
                        option.textContent = partner.name;
                        partnerSelect.appendChild(option);
                    });
                }
            }
            
            // إظهار رسالة نجاح التحميل
            const partnersCount = profitsData.partners ? profitsData.partners.length : 0;
            console.log(`تم تحميل ${partnersCount} شريك بنجاح`);
            showAlert(`تم تحميل ${partnersCount} شريك بنجاح`, 'success');
        }
        
    } catch (error) {
        console.error('Error loading partners data:', error);
        showAlert('حدث خطأ في تحميل بيانات الشركاء', 'danger');
    }
}

async function addPartnerTransaction() {
    const partnerName = document.getElementById('partnerSelect').value;
    const transactionType = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('partnerAmount').value);
    const transactionDate = document.getElementById('transactionDate').value || new Date().toISOString().split('T')[0];
    const description = document.getElementById('partnerDescription').value;
    
    if (!partnerName || !transactionType || !amount || amount <= 0) {
        showAlert('يرجى ملء جميع البيانات المطلوبة', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/add_partner_transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                partner_id: partnerName,
                transaction_type: transactionType,
                amount: amount,
                transaction_date: transactionDate,
                description: description
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            // مسح النموذج
            document.getElementById('partnerAmount').value = '';
            document.getElementById('partnerDescription').value = '';
            // إعادة تحميل البيانات
            await refreshAllData(); // تحديث شامل لجميع البيانات
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error adding partner transaction:', error);
        showAlert('حدث خطأ في إضافة المعاملة', 'danger');
    }
}

// متغير لتخزين اسم التاجر الحالي
let currentMerchant = '';
let currentPartner = '';

// دالة فتح كشف حساب شريك
async function openPartnerStatement(partnerName) {
    currentPartner = partnerName;
    await loadPartnerStatement();
    new bootstrap.Modal(document.getElementById('partnerStatementModal')).show();
}

// دالة تحميل كشف حساب الشريك
async function loadPartnerStatement() {
    if (!currentPartner) return;
    
    try {
        const response = await fetch(`/get_partner_statement/${encodeURIComponent(currentPartner)}`);
        const data = await response.json();
        
        // تحديث عنوان الكشف
        document.getElementById('partnerStatementTitle').textContent = `كشف حساب الشريك: ${currentPartner}`;
        
        // تحديث الملخص
        document.getElementById('partnerTotalShares').textContent = `$${data.summary.total_shares.toFixed(2)}`;
        document.getElementById('partnerTotalWithdrawals').textContent = `$${data.summary.total_withdrawals.toFixed(2)}`;
        document.getElementById('partnerCurrentBalance').textContent = `$${data.summary.current_balance.toFixed(2)}`;
        
        // تحديث جدول المعاملات
        const tbody = document.getElementById('partnerTransactionsTableBody');
        tbody.innerHTML = '';
        
        data.transactions.forEach(transaction => {
            const row = document.createElement('tr');
            const amountClass = transaction.transaction_type === 'share' ? 'text-success' : 'text-danger';
            const typeText = transaction.transaction_type === 'share' ? 'حصة أرباح' : 'سحب';
            
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td><span class="badge ${transaction.transaction_type === 'share' ? 'bg-success' : 'bg-danger'}">${typeText}</span></td>
                <td class="${amountClass}"><strong>$${transaction.amount.toFixed(2)}</strong></td>
                <td>${transaction.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deletePartnerTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading partner statement:', error);
        showAlert('حدث خطأ في تحميل كشف الحساب', 'danger');
    }
}

// دالة حذف معاملة شريك
async function deletePartnerTransaction(transactionId) {
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete_partner_transaction/${transactionId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            loadPartnerStatement();
            await loadPartnersData();
            updateStats();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting partner transaction:', error);
        showAlert('حدث خطأ في حذف المعاملة', 'danger');
    }
}

// دالة عرض كشف حساب شريك
function showPartnerStatement(partnerName) {
    openPartnerStatement(partnerName);
}

// دالة طباعة تقرير الشركاء
function printPartnersReport() {
    const printWindow = window.open('', '_blank');
    const tableContent = document.getElementById('partnersTableBody').outerHTML;
    
    printWindow.document.write(`
        <html>
        <head>
            <title>تقرير الشركاء</title>
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>تقرير الشركاء</h2>
                <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>اسم الشريك</th>
                        <th>النسبة</th>
                        <th>الحصة النظرية</th>
                        <th>السحوبات</th>
                        <th>الإيداعات</th>
                        <th>الرصيد الحالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableContent}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// دالة طباعة كشف حساب شريك
function printPartnerStatement() {
    const printWindow = window.open('', '_blank');
    const tableContent = document.getElementById('partnerTransactionsTableBody').outerHTML;
    
    printWindow.document.write(`
        <html>
        <head>
            <title>كشف حساب الشريك - ${currentPartner}</title>
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>كشف حساب الشريك: ${currentPartner}</h2>
                <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>نوع المعاملة</th>
                        <th>المبلغ</th>
                        <th>الوصف</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableContent}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// دالة عرض التنبيهات
function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alertsContainer') || document.body;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertsContainer.appendChild(alertDiv);
    
    // إزالة التنبيه تلقائياً بعد 5 ثوان
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// عرض أرشيف المصاريف والسحوبات
function showExpenseArchives() {
    fetch('/get_expense_archives')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayExpenseArchives(data);
            } else {
                showAlert('خطأ في تحميل أرشيف المصاريف: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('حدث خطأ في تحميل أرشيف المصاريف', 'danger');
        });
}

// عرض أرشيف المصاريف في نافذة جديدة
function displayExpenseArchives(data) {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('ar-EG');
    
    let withdrawalsHTML = '';
    if (data.withdrawal_archives && data.withdrawal_archives.length > 0) {
        withdrawalsHTML = data.withdrawal_archives.map(archive => `
            <tr>
                <td>${archive.date}</td>
                <td>${archive.description}</td>
                <td>${archive.expense_type}</td>
                <td>$${archive.amount.toFixed(2)}</td>
                <td>${archive.archived_at}</td>
                <td>${archive.notes || '-'}</td>
            </tr>
        `).join('');
    } else {
        withdrawalsHTML = '<tr><td colspan="6" class="text-center">لا توجد سحوبات مؤرشفة</td></tr>';
    }
    
    let borderExpensesHTML = '';
    if (data.border_expense_archives && data.border_expense_archives.length > 0) {
        borderExpensesHTML = data.border_expense_archives.map(archive => `
            <tr>
                <td>${archive.date}</td>
                <td>${archive.description}</td>
                <td>$${archive.amount.toFixed(2)}</td>
                <td>${archive.archived_at}</td>
                <td>${archive.notes || '-'}</td>
            </tr>
        `).join('');
    } else {
        borderExpensesHTML = '<tr><td colspan="5" class="text-center">لا توجد مصاريف حدود مؤرشفة</td></tr>';
    }
    
    const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>أرشيف المصاريف والسحوبات</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Cairo', sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #333;
                }
                .report-container {
                    background: white;
                    margin: 20px;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #007bff;
                    padding-bottom: 20px;
                }
                .company-name {
                    font-size: 28px;
                    font-weight: bold;
                    color: #002147;
                    margin-bottom: 10px;
                }
                .report-title {
                    font-size: 20px;
                    color: #666;
                    margin-bottom: 15px;
                }
                .summary-stats {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    border: 1px solid #dee2e6;
                }
                .table {
                    font-size: 14px;
                    border: 2px solid #007bff;
                }
                .table th {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                    text-align: center;
                    font-weight: 600;
                    border: 1px solid #0056b3;
                }
                .table td {
                    text-align: center;
                    border: 1px solid #dee2e6;
                    vertical-align: middle;
                }
                .section-title {
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 30px 0 20px 0;
                    text-align: center;
                    font-weight: bold;
                    font-size: 18px;
                }
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .report-container { margin: 0; box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="report-header">
                    <div class="company-name">🏢 شركة التخليص الجمركي</div>
                    <div class="report-title">📁 أرشيف المصاريف والسحوبات المؤرشفة</div>
                    <div class="text-muted">تاريخ التقرير: ${currentDate}</div>
                </div>

                <div class="summary-stats">
                    <div class="row text-center">
                        <div class="col-md-4">
                            <h5 class="text-primary">إجمالي السحوبات المؤرشفة</h5>
                            <h3 class="text-success">$${data.summary.total_archived_withdrawals.toFixed(2)}</h3>
                            <small class="text-muted">${data.summary.withdrawals_count} عملية</small>
                        </div>
                        <div class="col-md-4">
                            <h5 class="text-primary">إجمالي مصاريف الحدود المؤرشفة</h5>
                            <h3 class="text-warning">$${data.summary.total_archived_border_expenses.toFixed(2)}</h3>
                            <small class="text-muted">${data.summary.border_expenses_count} عملية</small>
                        </div>
                        <div class="col-md-4">
                            <h5 class="text-primary">إجمالي المبلغ المؤرشف</h5>
                            <h3 class="text-danger">$${data.summary.total_archived_amount.toFixed(2)}</h3>
                            <small class="text-muted">جميع المصاريف</small>
                        </div>
                    </div>
                </div>

                <div class="section-title">💸 السحوبات الخارجية المؤرشفة</div>
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>الوصف</th>
                                <th>نوع المصروف</th>
                                <th>المبلغ</th>
                                <th>تاريخ الأرشفة</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${withdrawalsHTML}
                        </tbody>
                    </table>
                </div>

                <div class="section-title">🏛️ مصاريف الحدود المؤرشفة</div>
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>الوصف</th>
                                <th>المبلغ</th>
                                <th>تاريخ الأرشفة</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${borderExpensesHTML}
                        </tbody>
                    </table>
                </div>

                <div class="text-center mt-4 no-print">
                    <button class="btn btn-primary" onclick="window.print()">🖨️ طباعة التقرير</button>
                    <button class="btn btn-secondary" onclick="window.close()">إغلاق</button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

// دوال الإضافة والإرجاعات للتجار
let currentMerchantName = '';

// تحميل تعديلات التاجر في كشف الحساب
async function loadMerchantAdjustments(merchantName) {
    try {
        const response = await fetch(`/get_merchant_adjustments/${encodeURIComponent(merchantName)}`);
        const data = await response.json();
        
        const tbody = document.getElementById('merchantAdjustmentsBody');
        tbody.innerHTML = '';
        
        if (data.success && data.adjustments.length > 0) {
            data.adjustments.forEach(adj => {
                const typeText = adj.adjustment_type === 'addition' ? 'إضافة' : 'إرجاع';
                const typeClass = adj.adjustment_type === 'addition' ? 'text-success' : 'text-danger';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${adj.date}</td>
                    <td class="${typeClass}"><strong>${typeText}</strong></td>
                    <td>$${adj.amount.toFixed(2)}</td>
                    <td>${adj.description || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteMerchantAdjustment(${adj.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد تعديلات</td></tr>';
        }
    } catch (error) {
        console.error('Error loading adjustments:', error);
        document.getElementById('merchantAdjustmentsBody').innerHTML = 
            '<tr><td colspan="5" class="text-center text-danger">خطأ في تحميل التعديلات</td></tr>';
    }
}

// إضافة تعديل جديد للتاجر
async function addMerchantAdjustment() {
    try {
        const merchantName = currentMerchantName;
        const adjustmentType = document.getElementById('adjustmentType').value;
        const amount = parseFloat(document.getElementById('adjustmentAmount').value);
        const description = document.getElementById('adjustmentDescription').value;
        const notes = document.getElementById('adjustmentNotes').value;
        const date = document.getElementById('adjustmentDate').value;

        if (!merchantName || !adjustmentType || !amount || amount <= 0) {
            showAlert('يرجى ملء جميع الحقول المطلوبة', 'warning');
            return;
        }

        const response = await fetch('/add_merchant_adjustment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                merchant_name: merchantName,
                adjustment_type: adjustmentType,
                amount: amount,
                description: description,
                notes: notes,
                date: date
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
            
            // تنظيف النموذج
            document.getElementById('adjustmentType').value = '';
            document.getElementById('adjustmentAmount').value = '';
            document.getElementById('adjustmentDescription').value = '';
            document.getElementById('adjustmentNotes').value = '';
            document.getElementById('adjustmentDate').value = new Date().toISOString().split('T')[0];
            
            // إعادة تحميل التعديلات وكشف الحساب
            loadMerchantAdjustments(merchantName);
            openMerchantStatement(merchantName); // إعادة تحميل كشف الحساب لتحديث الأرصدة
        } else {
            showAlert(result.message || 'حدث خطأ في حفظ التعديل', 'danger');
        }
    } catch (error) {
        console.error('Error saving adjustment:', error);
        showAlert('حدث خطأ في حفظ التعديل', 'danger');
    }
}

// حذف تعديل
async function deleteMerchantAdjustment(adjustmentId) {
    if (!confirm('هل أنت متأكد من حذف هذا التعديل؟')) {
        return;
    }

    try {
        const response = await fetch(`/delete_merchant_adjustment/${adjustmentId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
            loadMerchantAdjustments(currentMerchantName);
            openMerchantStatement(currentMerchantName); // إعادة تحميل كشف الحساب
        } else {
            showAlert(result.message || 'حدث خطأ في حذف التعديل', 'danger');
        }
    } catch (error) {
        console.error('Error deleting adjustment:', error);
        showAlert('حدث خطأ في حذف التعديل', 'danger');
    }
}