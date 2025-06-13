// إصلاحات الوظائف المفقودة في النظام

// دالة فتح نافذة تسديد للتاجر
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
            setTimeout(() => openMerchantsDebts(), 500);
            
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
    const debtsModal = bootstrap.Modal.getInstance(document.getElementById('merchantsModal'));
    if (debtsModal) debtsModal.hide();
    
    setTimeout(() => {
        openMerchantStatementDialog();
        setTimeout(() => {
            if (document.getElementById('statementMerchantName')) {
                document.getElementById('statementMerchantName').value = merchantName;
            }
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
    const reportType = document.getElementById('statementReportType');
    const customDateRange = document.getElementById('customDateRange');
    
    if (reportType && customDateRange) {
        if (reportType.value === 'custom') {
            customDateRange.style.display = 'block';
        } else {
            customDateRange.style.display = 'none';
        }
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
    
    if (!data) {
        showAlert('لا توجد بيانات للعرض', 'warning');
        return;
    }
    
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
    
    if (data.records && data.records.length > 0) {
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
                    <td>$${(record.fees || 0).toFixed(2)}</td>
                    <td>$${(record.advance || 0).toFixed(2)}</td>
                    <td>$${(record.clearance_cost || 0).toFixed(2)}</td>
                    <td><strong>$${(record.total_debt || 0).toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        content += '</tbody></table></div>';
    }
    
    if (contentDiv) {
        contentDiv.innerHTML = content;
    }
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
    }
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
    
    try {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            // إذا فشل فتح النافذة، استخدم الطباعة المباشرة
            document.body.innerHTML = printContent;
            window.print();
            location.reload();
            return;
        }
        
        printWindow.document.open();
        printWindow.document.write(`
            <html>
                <head>
                    <title>كشف حساب - ${data.merchant_name}</title>
                    <meta charset="UTF-8">
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            font-family: 'Cairo', Arial, sans-serif; 
                            direction: rtl; 
                            margin: 20px; 
                            font-size: 14px;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 10px 0; 
                        }
                        th, td { 
                            border: 1px solid #ddd; 
                            padding: 8px; 
                            text-align: center; 
                        }
                        th { 
                            background-color: #f8f9fa; 
                            font-weight: bold;
                        }
                        .alert { 
                            padding: 10px; 
                            margin: 10px 0; 
                            border-radius: 5px; 
                        }
                        .alert-info { background-color: #d1ecf1; }
                        .alert-warning { background-color: #fff3cd; }
                        .alert-success { background-color: #d4edda; }
                        .alert-danger { background-color: #f8d7da; }
                        @media print { 
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">طباعة</button>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">إغلاق</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // انتظار تحميل المحتوى ثم الطباعة
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
        
    } catch (error) {
        console.error('Error in print function:', error);
        showAlert('حدث خطأ في الطباعة. جاري المحاولة بطريقة بديلة...', 'warning');
        
        // طريقة بديلة للطباعة
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        location.reload();
    }
}

// إصلاح وظيفة طباعة السجلات مع حماية أفضل
function printRecords() {
    try {
        const records = Array.from(document.querySelectorAll('#recordsTableBody tr'));
        
        if (records.length === 0) {
            showAlert('لا توجد سجلات للطباعة', 'warning');
            return;
        }
        
        let tableContent = '';
        records.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 8) {
                tableContent += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[0].textContent || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[1].textContent || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[2].textContent || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[3].textContent || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[4].textContent || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[5].textContent || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[6].textContent || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: #dc3545;">${cells[7].textContent || ''}</td>
                    </tr>
                `;
            }
        });
        
        const printContent = `
            <div style="font-family: 'Cairo', Arial, sans-serif; direction: rtl; padding: 15px; background: white; color: #333; line-height: 1.4;">
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #002147;">
                    <div style="font-size: 20px; font-weight: 800; color: #002147; margin-bottom: 8px;">شركة الأصدقاء للتخليص الكمركي</div>
                    <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 5px;">تقرير جميع السجلات</div>
                    <div style="font-size: 12px; color: #666; margin-top: 8px;">
                        تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} | الوقت: ${new Date().toLocaleTimeString('ar-SA')}
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #002147; color: white;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">التاريخ</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">اسم التاجر</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">السائق الأجنبي</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">السائق المحلي</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">نوع البضاعة</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الأجور</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">السلف</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">إجمالي الدين</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableContent}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; font-size: 12px; color: #666;">
                        عدد السجلات: ${records.length} | النظام المحاسبي الجديد
                    </div>
                </div>
            </div>
        `;
        
        // طريقة محسنة للطباعة مع معالجة أخطاء أفضل
        try {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (!printWindow || printWindow.closed) {
                // فشل في فتح النافذة، استخدم الطباعة المباشرة
                const originalContent = document.body.innerHTML;
                document.body.innerHTML = printContent;
                window.print();
                document.body.innerHTML = originalContent;
                showAlert('تم طباعة التقرير بنجاح', 'success');
                return;
            }
            
            printWindow.document.open();
            printWindow.document.write(`
                <html>
                    <head>
                        <title>تقرير السجلات</title>
                        <meta charset="UTF-8">
                        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
                        <style>
                            body { 
                                font-family: 'Cairo', Arial, sans-serif; 
                                direction: rtl; 
                                margin: 0; 
                            }
                            @media print { 
                                body { margin: 0; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                        <div class="no-print" style="text-align: center; margin-top: 20px;">
                            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">طباعة</button>
                            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">إغلاق</button>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            
            // انتظار تحميل المحتوى
            setTimeout(() => {
                try {
                    printWindow.focus();
                    printWindow.print();
                    showAlert('تم فتح نافذة الطباعة', 'success');
                } catch (e) {
                    console.error('Error in delayed print:', e);
                    showAlert('تم إنشاء التقرير، يرجى الضغط على زر الطباعة في النافذة الجديدة', 'info');
                }
            }, 500);
            
        } catch (printError) {
            console.error('Print window error:', printError);
            // طريقة بديلة - استبدال محتوى الصفحة مؤقتاً
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            showAlert('تم طباعة التقرير بالطريقة البديلة', 'success');
        }
        
    } catch (error) {
        console.error('Error printing records:', error);
        showAlert('حدث خطأ في طباعة السجلات: ' + error.message, 'danger');
    }
}

// إصلاح وظيفة تبديل عرض السجلات
function toggleRecordsView() {
    const container = document.getElementById('recordsTableContainer');
    const btn = document.getElementById('toggleRecordsBtn');
    
    if (container && btn) {
        if (container.style.display === 'none' || container.style.display === '') {
            container.style.display = 'block';
            btn.innerHTML = '📋 إخفاء السجلات';
            loadRecords();
        } else {
            container.style.display = 'none';
            btn.innerHTML = '📋 عرض/إخفاء السجلات';
        }
    }
}

// تحميل وعرض السجلات
async function loadRecords() {
    try {
        const response = await fetch('/get_records');
        const records = await response.json();
        
        const tbody = document.getElementById('recordsTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            
            records.forEach(record => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${record.date}</td>
                    <td>${record.merchant_name}</td>
                    <td>${record.foreign_driver}</td>
                    <td>${record.local_driver}</td>
                    <td>${record.goods_type}</td>
                    <td>$${record.fees.toFixed(2)}</td>
                    <td>$${record.advance.toFixed(2)}</td>
                    <td><strong>$${record.total_debt.toFixed(2)}</strong></td>
                `;
            });
            
            showAlert(`تم تحميل ${records.length} سجل`, 'success');
        }
    } catch (error) {
        console.error('Error loading records:', error);
        showAlert('حدث خطأ في تحميل السجلات', 'danger');
    }
}