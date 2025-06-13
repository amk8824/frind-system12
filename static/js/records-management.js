// === وظائف إدارة السجلات والديون ===

// تبديل عرض جدول السجلات
function toggleRecordsView() {
    const container = document.getElementById('recordsTableContainer');
    const btn = document.getElementById('toggleRecordsBtn');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.innerHTML = '📋 إخفاء السجلات';
        loadRecords();
    } else {
        container.style.display = 'none';
        btn.innerHTML = '📋 عرض/إخفاء السجلات';
    }
}

// تحميل وعرض السجلات
async function loadRecords() {
    try {
        const response = await fetch('/get_records');
        const records = await response.json();
        
        const tbody = document.getElementById('recordsTableBody');
        tbody.innerHTML = '';
        
        records.forEach(record => {
            const row = tbody.insertRow();
            
            // حساب القيم إذا لم تكن محسوبة في API
            const fees = parseFloat(record.fees || 0);
            const advance = parseFloat(record.advance || 0);
            const clearanceCost = parseFloat(record.clearance_cost || 0);
            const myProfit = parseFloat(record.my_profit || 0);
            
            // حساب إجمالي الدين = الأجور + السلف + كلفة التخليص
            const totalDebt = record.total_debt || (fees + advance + clearanceCost);
            // حساب النبر = الأجور + السلف فقط (بدون التخليص)
            const naberAmount = record.naber_account_amount || (fees + advance);
            
            row.innerHTML = `
                <td>${record.date || '-'}</td>
                <td>${record.sender_merchant || '-'}</td>
                <td><strong>${record.merchant_name || '-'}</strong></td>
                <td>${record.foreign_driver || '-'}</td>
                <td>${record.local_driver || '-'}</td>
                <td>${record.goods_type || 'غير محدد'}</td>
                <td class="text-info">$${fees.toFixed(2)}</td>
                <td class="text-warning">$${advance.toFixed(2)}</td>
                <td class="text-danger"><strong>$${totalDebt.toFixed(2)}</strong></td>
                <td style="max-width: 150px; word-wrap: break-word;">${record.notes || 'لا توجد ملاحظات'}</td>
            `;
        });
        
        showAlert(`تم تحميل ${records.length} سجل`, 'success');
    } catch (error) {
        console.error('Error loading records:', error);
        showAlert('حدث خطأ في تحميل السجلات', 'danger');
    }
}

// فتح نافذة إدارة ديون التجار
async function openMerchantsDebtsManager() {
    try {
        const response = await fetch('/get_merchants_debts');
        const data = await response.json();
        
        let modalContent = `
            <div class="modal fade" id="debtsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">إدارة ديون التجار</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>اسم التاجر</th>
                                            <th>إجمالي الدين</th>
                                            <th>المدفوعات</th>
                                            <th>الرصيد المتبقي</th>
                                            <th>آخر معاملة</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
        `;
        
        data.forEach(merchant => {
            modalContent += `
                <tr>
                    <td><strong>${merchant.merchant_name}</strong></td>
                    <td>$${merchant.total_debt.toFixed(2)}</td>
                    <td>$${merchant.total_payments.toFixed(2)}</td>
                    <td class="${merchant.remaining_debt > 0 ? 'text-danger' : 'text-success'}">
                        <strong>$${merchant.remaining_debt.toFixed(2)}</strong>
                    </td>
                    <td>${merchant.last_transaction || 'لا يوجد'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openPaymentDialog('${merchant.merchant_name}')">
                            💰 تسديد
                        </button>
                        <button class="btn btn-sm btn-info" onclick="openMerchantDetailedStatement('${merchant.merchant_name}')">
                            📊 كشف حساب
                        </button>
                    </td>
                </tr>
            `;
        });
        
        modalContent += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('debtsModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        const modal = new bootstrap.Modal(document.getElementById('debtsModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading merchants debts:', error);
        showAlert('حدث خطأ في تحميل ديون التجار', 'danger');
    }
}

// فتح نافذة تسديد للتاجر
function openPaymentDialog(merchantName) {
    const modalContent = `
        <div class="modal fade" id="paymentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">تسديد للتاجر: ${merchantName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">المبلغ ($)</label>
                                <input type="number" class="form-control" id="paymentAmount" step="0.01" min="0">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">تاريخ التسديد</label>
                                <input type="date" class="form-control" id="paymentDate" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">الملاحظات</label>
                            <textarea class="form-control" id="paymentNotes" rows="3"></textarea>
                        </div>
                        <button class="btn btn-success w-100" onclick="processPayment('${merchantName}')">
                            💰 تسجيل التسديد
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('paymentModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

// معالجة التسديد
async function processPayment(merchantName) {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentDate = document.getElementById('paymentDate').value;
    const notes = document.getElementById('paymentNotes').value.trim();
    
    if (!amount || amount <= 0) {
        showAlert('يرجى إدخال مبلغ صحيح', 'warning');
        return;
    }
    
    if (!paymentDate) {
        showAlert('يرجى تحديد تاريخ التسديد', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/add_payment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                merchant_name: merchantName,
                amount: amount,
                payment_date: paymentDate,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`تم تسجيل تسديد $${amount.toFixed(2)} للتاجر ${merchantName}`, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
            if (modal) modal.hide();
            
            await updateStats();
            
            setTimeout(() => openMerchantsDebtsManager(), 500);
            
        } else {
            showAlert(result.message || 'حدث خطأ في تسجيل التسديد', 'danger');
        }
        
    } catch (error) {
        console.error('Error processing payment:', error);
        showAlert('حدث خطأ في تسجيل التسديد', 'danger');
    }
}

// فتح كشف حساب مفصل لتاجر محدد
function openMerchantDetailedStatement(merchantName) {
    const debtsModal = bootstrap.Modal.getInstance(document.getElementById('debtsModal'));
    if (debtsModal) debtsModal.hide();
    
    setTimeout(() => {
        openMerchantStatementDialog();
        setTimeout(() => {
            document.getElementById('statementMerchantName').value = merchantName;
        }, 100);
    }, 300);
}

// فتح نافذة كشف حساب تاجر
function openMerchantStatementDialog() {
    const modalContent = `
        <div class="modal fade" id="statementModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">كشف حساب تاجر مفصل</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">اسم التاجر</label>
                                <input type="text" class="form-control" id="statementMerchantName" placeholder="أدخل اسم التاجر">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">نوع التقرير</label>
                                <select class="form-control" id="statementReportType" onchange="handleReportTypeChange()">
                                    <option value="custom">فترة مخصصة</option>
                                    <option value="daily">يومي</option>
                                    <option value="weekly">أسبوعي</option>
                                    <option value="monthly">شهري</option>
                                    <option value="yearly">سنوي</option>
                                </select>
                            </div>
                        </div>
                        <div class="row" id="customDateRange">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">من تاريخ</label>
                                <input type="date" class="form-control" id="statementDateFrom">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">إلى تاريخ</label>
                                <input type="date" class="form-control" id="statementDateTo">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <button class="btn btn-primary w-100" onclick="generateMerchantStatement()">
                                    📊 إنشاء كشف الحساب
                                </button>
                            </div>
                            <div class="col-md-6 mb-3">
                                <button class="btn btn-success w-100" onclick="printMerchantDetailedStatement()" disabled id="printStatementBtn">
                                    🖨️ طباعة كشف الحساب
                                </button>
                            </div>
                        </div>
                        <div id="statementResults" style="display: none;">
                            <hr>
                            <div id="statementContent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('statementModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.getElementById('statementModal'));
    modal.show();
}

// التحكم في عرض حقول التاريخ حسب نوع التقرير
function handleReportTypeChange() {
    const reportType = document.getElementById('statementReportType').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (reportType === 'custom') {
        customDateRange.style.display = 'block';
    } else {
        customDateRange.style.display = 'none';
    }
}

// إنشاء كشف حساب مفصل للتاجر
async function generateMerchantStatement() {
    const merchantName = document.getElementById('statementMerchantName').value.trim();
    const reportType = document.getElementById('statementReportType').value;
    const dateFrom = document.getElementById('statementDateFrom').value;
    const dateTo = document.getElementById('statementDateTo').value;
    
    if (!merchantName) {
        showAlert('يرجى إدخال اسم التاجر', 'warning');
        return;
    }
    
    if (reportType === 'custom' && (!dateFrom || !dateTo)) {
        showAlert('يرجى تحديد فترة التقرير', 'warning');
        return;
    }
    
    try {
        const params = new URLSearchParams({
            merchant_name: merchantName,
            report_type: reportType
        });
        
        if (reportType === 'custom') {
            params.append('date_from', dateFrom);
            params.append('date_to', dateTo);
        }
        
        const response = await fetch(`/get_merchant_detailed_statement?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayMerchantStatement(data);
            document.getElementById('printStatementBtn').disabled = false;
            window.currentStatementData = data;
        } else {
            showAlert(data.message || 'حدث خطأ في إنشاء كشف الحساب', 'danger');
        }
        
    } catch (error) {
        console.error('Error generating merchant statement:', error);
        showAlert('حدث خطأ في إنشاء كشف الحساب', 'danger');
    }
}

// عرض كشف حساب التاجر
function displayMerchantStatement(data) {
    const resultsDiv = document.getElementById('statementResults');
    const contentDiv = document.getElementById('statementContent');
    
    let content = `
        <div class="alert alert-primary">
            <h6>كشف حساب: ${data.merchant_name}</h6>
            <p>الفترة: من ${data.period.from} إلى ${data.period.to} (${getReportTypeText(data.period.type)})</p>
        </div>
        
        <div class="row">
            <div class="col-md-3">
                <div class="alert alert-info text-center">
                    <h6>إجمالي المعاملات</h6>
                    <h4>${(data.summary?.records_count || 0)}</h4>
                </div>
            </div>
            <div class="col-md-3">
                <div class="alert alert-warning text-center">
                    <h6>المبلغ المستحق</h6>
                    <h4>$${(data.summary?.total_debt || 0).toFixed(2)}</h4>
                </div>
            </div>
            <div class="col-md-3">
                <div class="alert alert-success text-center">
                    <h6>المبلغ المسدد</h6>
                    <h4>$${(data.summary?.total_payments || 0).toFixed(2)}</h4>
                </div>
            </div>
            <div class="col-md-3">
                <div class="alert alert-${(data.summary?.final_balance || 0) > 0 ? 'danger' : 'success'} text-center">
                    <h6>الرصيد المتبقي</h6>
                    <h4>$${(data.summary?.final_balance || 0).toFixed(2)}</h4>
                </div>
            </div>
        </div>
    `;
    
    if (data.records.length > 0) {
        content += `
            <h6>السجلات (${data.records.length})</h6>
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>التاريخ</th>
                            <th>نوع البضاعة</th>
                            <th>الأجور</th>
                            <th>السلف</th>
                            <th>التخليص</th>
                            <th>إجمالي الدين</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.records.forEach(record => {
            content += `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.goods_type}</td>
                    <td>$${record.fees.toFixed(2)}</td>
                    <td>$${record.advance.toFixed(2)}</td>
                    <td>$${record.clearance_cost.toFixed(2)}</td>
                    <td><strong>$${record.total_debt.toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        content += '</tbody></table></div>';
    }
    
    contentDiv.innerHTML = content;
    resultsDiv.style.display = 'block';
}

// تحويل نوع التقرير إلى نص
function getReportTypeText(type) {
    const types = {
        'daily': 'يومي',
        'weekly': 'أسبوعي',
        'monthly': 'شهري',
        'yearly': 'سنوي',
        'custom': 'فترة مخصصة'
    };
    return types[type] || 'غير محدد';
}

// طباعة كشف الحساب المفصل
function printMerchantDetailedStatement() {
    if (!window.currentStatementData) {
        showAlert('لا توجد بيانات للطباعة', 'warning');
        return;
    }
    
    const data = window.currentStatementData;
    const printContent = `
        <div style="direction: rtl; font-family: 'Cairo', Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2>كشف حساب مفصل - ${data.merchant_name}</h2>
                <p>الفترة: من ${data.period.from} إلى ${data.period.to}</p>
                <p>نوع التقرير: ${getReportTypeText(data.period.type)}</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            ${document.getElementById('statementContent').innerHTML}
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>كشف حساب - ${data.merchant_name}</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f8f9fa; }
                    .alert { padding: 10px; margin: 10px 0; border-radius: 5px; }
                    .alert-info { background-color: #d1ecf1; }
                    .alert-warning { background-color: #fff3cd; }
                    .alert-success { background-color: #d4edda; }
                    .alert-danger { background-color: #f8d7da; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>${printContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// تحديث الإحصائيات
async function updateStats() {
    try {
        const response = await fetch('/get_stats');
        const stats = await response.json();
        
        // تحديث القيم في واجهة المستخدم
        document.getElementById('totalRecords').textContent = stats.total_records;
        document.getElementById('totalProfit').textContent = '$' + stats.gross_profit_from_clearance.toFixed(2);
        document.getElementById('totalWithdrawals').textContent = '$' + stats.total_withdrawals.toFixed(2);
        document.getElementById('naberAccountTotal').textContent = '$' + stats.naber_account_total.toFixed(2);
        document.getElementById('availableBalance').textContent = '$' + stats.available_balance.toFixed(2);
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}