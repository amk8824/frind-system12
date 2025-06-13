// متغيرات التطبيق
let currentMerchant = '';

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // تعيين التاريخ الحالي
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('withdrawDate').value = today;
    document.getElementById('paymentDate').value = today;
    if (document.getElementById('partnerTransactionDate')) {
        document.getElementById('partnerTransactionDate').value = today;
    }
    
    // تحديث الإحصائيات
    updateStats();
    
    // إضافة مستمع لإرسال النموذج
    document.getElementById('mainForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEntry();
    });
});

// دالة حفظ السجل
async function saveEntry() {
    const formData = {
        merchant_name: document.getElementById('merchantName').value.trim(),
        foreign_driver: document.getElementById('foreignDriver').value.trim(),
        foreign_car: document.getElementById('foreignCar').value.trim(),
        local_driver: document.getElementById('localDriver').value.trim(),
        local_car: document.getElementById('localCar').value.trim(),
        date: document.getElementById('date').value,
        goods_type: document.getElementById('goodsType').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        fees: parseFloat(document.getElementById('fees').value) || 0,
        advance: parseFloat(document.getElementById('advance').value) || 0,
        my_profit: parseFloat(document.getElementById('myProfit').value) || 0,
        addition: parseFloat(document.getElementById('addition').value) || 0,
        returned: parseFloat(document.getElementById('returned').value) || 0
    };

    if (!formData.merchant_name || !formData.date) {
        showAlert('يرجى إدخال اسم التاجر والتاريخ على الأقل', 'warning');
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
        
        const tbody = document.getElementById('merchantsDebtsBody');
        tbody.innerHTML = '';
        
        merchants.forEach(merchant => {
            const row = document.createElement('tr');
            const balanceClass = merchant.current_balance > 0 ? 'text-danger' : 
                                 merchant.current_balance < 0 ? 'text-success' : 'text-muted';
            
            row.innerHTML = `
                <td><strong>${merchant.name}</strong></td>
                <td>${merchant.transaction_count}</td>
                <td>$${merchant.total_fees.toFixed(2)}</td>
                <td>$${merchant.total_advance.toFixed(2)}</td>
                <td><strong>$${merchant.total_debt.toFixed(2)}</strong></td>
                <td>$${merchant.total_payments.toFixed(2)}</td>
                <td class="${balanceClass}">
                    <strong>$${merchant.current_balance.toFixed(2)}</strong>
                </td>
                <td>${merchant.last_transaction || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showMerchantStatement('${merchant.name}')">
                        <i class="fas fa-file-invoice"></i> كشف الحساب
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
async function openMerchantStatement() {
    try {
        // تحميل قائمة التجار
        const response = await fetch('/get_merchants_debts');
        const merchants = await response.json();
        
        const select = document.getElementById('merchantSelect');
        select.innerHTML = '<option value="">-- اختر التاجر --</option>';
        
        merchants.forEach(merchant => {
            const option = document.createElement('option');
            option.value = merchant.name;
            option.textContent = merchant.name;
            select.appendChild(option);
        });
        
        document.getElementById('merchantStatementContent').style.display = 'none';
        new bootstrap.Modal(document.getElementById('merchantStatementModal')).show();
    } catch (error) {
        console.error('Error loading merchant statement:', error);
        showAlert('حدث خطأ في تحميل كشف الحساب', 'danger');
    }
}

// دالة تحميل كشف حساب التاجر المحدد
async function loadMerchantStatement() {
    const merchantName = document.getElementById('merchantSelect').value;
    if (!merchantName) {
        document.getElementById('merchantStatementContent').style.display = 'none';
        return;
    }

    currentMerchant = merchantName;

    try {
        const response = await fetch(`/get_merchant_statement/${encodeURIComponent(merchantName)}`);
        const data = await response.json();
        
        // تحديث معلومات التاجر
        document.getElementById('merchantStatementName').textContent = data.merchant_name;
        document.getElementById('merchantCurrentBalance').textContent = `$${data.current_balance.toFixed(2)}`;
        
        // تحديث جدول المعاملات
        const transactionsBody = document.getElementById('merchantTransactionsBody');
        transactionsBody.innerHTML = '';
        
        let totalClearance = 0, totalFees = 0, totalAdvance = 0;
        
        data.transactions.forEach(transaction => {
            totalClearance += transaction.my_profit + transaction.addition - transaction.returned;
            totalFees += transaction.fees;
            totalAdvance += transaction.advance;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.goods_type || '-'}</td>
                <td>$${transaction.my_profit.toFixed(2)}</td>
                <td>$${transaction.fees.toFixed(2)}</td>
                <td>$${transaction.advance.toFixed(2)}</td>
                <td>$${transaction.addition.toFixed(2)}</td>
                <td>$${transaction.returned.toFixed(2)}</td>
                <td><strong>$${transaction.total_debt.toFixed(2)}</strong></td>
            `;
            transactionsBody.appendChild(row);
        });
        
        // تحديث جدول التسديدات
        const paymentsBody = document.getElementById('merchantPaymentsBody');
        paymentsBody.innerHTML = '';
        
        let totalPayments = 0;
        let lastPaymentAmount = 0;
        let lastPaymentDate = '-';
        
        data.payments.forEach(payment => {
            totalPayments += payment.amount;
            lastPaymentAmount = payment.amount;
            lastPaymentDate = payment.payment_date;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.payment_date}</td>
                <td>$${payment.amount.toFixed(2)}</td>
                <td>$${payment.balance_before.toFixed(2)}</td>
                <td>$${payment.balance_after.toFixed(2)}</td>
                <td>${payment.notes || '-'}</td>
            `;
            paymentsBody.appendChild(row);
        });
        
        // تحديث الملخص المالي
        document.getElementById('totalClearance').textContent = totalClearance.toFixed(2);
        document.getElementById('totalFees').textContent = totalFees.toFixed(2);
        document.getElementById('totalAdvance').textContent = totalAdvance.toFixed(2);
        document.getElementById('totalDebts').textContent = (totalFees + totalAdvance).toFixed(2);
        document.getElementById('totalPayments').textContent = totalPayments.toFixed(2);
        document.getElementById('lastPaymentAmount').textContent = lastPaymentAmount.toFixed(2);
        document.getElementById('lastPaymentDate').textContent = lastPaymentDate;
        document.getElementById('currentBalance').textContent = data.current_balance.toFixed(2);
        
        // إظهار محتوى كشف الحساب
        document.getElementById('merchantStatementContent').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading merchant statement:', error);
        showAlert('حدث خطأ في تحميل كشف حساب التاجر', 'danger');
    }
}

// دالة إضافة تسديد
async function addPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentDate = document.getElementById('paymentDate').value;
    const notes = document.getElementById('paymentNotes').value.trim();
    
    if (!amount || amount <= 0) {
        showAlert('يرجى إدخال مبلغ التسديد', 'warning');
        return;
    }
    
    if (!paymentDate) {
        showAlert('يرجى إدخال تاريخ التسديد', 'warning');
        return;
    }
    
    if (!currentMerchant) {
        showAlert('يرجى اختيار التاجر أولاً', 'warning');
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

// دالة عرض كشف حساب تاجر محدد من جدول الديون
function showMerchantStatement(merchantName) {
    // إغلاق نافذة الديون
    bootstrap.Modal.getInstance(document.getElementById('merchantsModal')).hide();
    
    // فتح نافذة كشف الحساب
    setTimeout(() => {
        openMerchantStatement().then(() => {
            document.getElementById('merchantSelect').value = merchantName;
            loadMerchantStatement();
        });
    }, 500);
}

// دالة فتح نافذة السحوبات
async function openWithdrawal() {
    try {
        await loadWithdrawals();
        new bootstrap.Modal(document.getElementById('withdrawModal')).show();
    } catch (error) {
        console.error('Error opening withdrawal modal:', error);
        showAlert('حدث خطأ في فتح نافذة السحوبات', 'danger');
    }
}

// دالة تحميل السحوبات
async function loadWithdrawals() {
    try {
        const response = await fetch('/get_withdrawals');
        const withdrawals = await response.json();
        
        const tbody = document.getElementById('withdrawalsBody');
        tbody.innerHTML = '';
        
        let totalAmount = 0;
        
        withdrawals.forEach(withdrawal => {
            totalAmount += withdrawal.amount;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${withdrawal.withdrawal_date}</td>
                <td>$${withdrawal.amount.toFixed(2)}</td>
                <td>${withdrawal.reason}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteWithdrawal(${withdrawal.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.getElementById('totalWithdrawalsAmount').textContent = totalAmount.toFixed(2);
        
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        showAlert('حدث خطأ في تحميل السحوبات', 'danger');
    }
}

// دالة إضافة سحب جديد
async function addWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const withdrawDate = document.getElementById('withdrawDate').value;
    const reason = document.getElementById('withdrawReason').value.trim();
    
    if (!amount || amount <= 0) {
        showAlert('يرجى إدخال مبلغ السحب', 'warning');
        return;
    }
    
    if (!withdrawDate) {
        showAlert('يرجى إدخال تاريخ السحب', 'warning');
        return;
    }
    
    if (!reason) {
        showAlert('يرجى إدخال سبب السحب', 'warning');
        return;
    }

    try {
        const response = await fetch('/add_withdrawal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                withdrawal_date: withdrawDate,
                reason: reason
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            // مسح النموذج
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('withdrawReason').value = '';
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

// دالة حذف سحب
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
function printRecords() {
    document.body.classList.add('print-records');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-records');
    }, 1000);
}

function printMerchantsDebts() {
    document.body.classList.add('print-merchants');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-merchants');
    }, 1000);
}

function printMerchantStatement() {
    if (!currentMerchant) {
        showAlert('يرجى اختيار التاجر أولاً', 'warning');
        return;
    }
    
    document.body.classList.add('print-statement');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-statement');
    }, 1000);
}

function printWithdrawals() {
    document.body.classList.add('print-withdrawals');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-withdrawals');
    }, 1000);
}

// دوال الشراكة
async function openPartnersManagement() {
    try {
        await loadPartnersData();
        new bootstrap.Modal(document.getElementById('partnersModal')).show();
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
        const profitsResponse = await fetch('/get_profit_distribution_report');
        const profitsData = await profitsResponse.json();
        
        console.log('Loaded partners data:', partnersData);
        console.log('Loaded profits data:', profitsData);
        
        if (partnersData.success && profitsData.success) {
            // تحديث إحصائيات الأرباح
            const availableProfits = profitsData.available_for_distribution || 0;
            const totalClearance = profitsData.total_gross_profit || 0;
            const totalBorderExpenses = profitsData.total_border_expenses || 0;
            const totalWithdrawals = profitsData.total_withdrawals || 0;
            const totalDistributed = profitsData.total_distributed || 0;
            
            // تحديث العناصر في الواجهة
            const distributableElement = document.getElementById('distributableProfit');
            const clearanceElement = document.getElementById('totalClearanceProfit');
            const distributedElement = document.getElementById('totalDistributedProfit');
            
            if (distributableElement) {
                distributableElement.textContent = `$${availableProfits.toFixed(2)}`;
            }
            if (clearanceElement) {
                clearanceElement.textContent = `$${totalClearance.toFixed(2)}`;
            }
            if (distributedElement) {
                distributedElement.textContent = `$${totalDistributed.toFixed(2)}`;
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
                            <td><strong>${partner.partner_name}</strong></td>
                            <td>${partner.profit_percentage.toFixed(1)}%</td>
                            <td>$${partner.new_share.toFixed(2)}</td>
                            <td class="text-danger">$${partner.total_withdrawals.toFixed(2)}</td>
                            <td class="text-success">$${partner.total_additions.toFixed(2)}</td>
                            <td class="${balanceClass}">
                                <strong>$${partner.current_balance.toFixed(2)}</strong>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="showPartnerStatement('${partner.partner_name}')">
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
    const transactionDate = document.getElementById('partnerTransactionDate').value;
    const description = document.getElementById('partnerDescription').value.trim();
    
    if (!partnerName) {
        showAlert('يرجى اختيار الشريك', 'warning');
        return;
    }
    
    if (!amount || amount <= 0) {
        showAlert('يرجى إدخال مبلغ صحيح', 'warning');
        return;
    }
    
    if (!transactionDate) {
        showAlert('يرجى إدخال تاريخ المعاملة', 'warning');
        return;
    }

    try {
        const response = await fetch('/add_partner_transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                partner_name: partnerName,
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

async function openPartnerStatement() {
    try {
        // تحميل قائمة الشركاء
        const response = await fetch('/get_partners');
        const partners = await response.json();
        
        const select = document.getElementById('partnerStatementSelect');
        select.innerHTML = '<option value="">-- اختر الشريك --</option>';
        
        partners.forEach(partner => {
            const option = document.createElement('option');
            option.value = partner.partner_name;
            option.textContent = partner.partner_name;
            select.appendChild(option);
        });
        
        document.getElementById('partnerStatementContent').style.display = 'none';
        
        // إغلاق النافذة السابقة
        const partnersModal = bootstrap.Modal.getInstance(document.getElementById('partnersModal'));
        if (partnersModal) {
            partnersModal.hide();
        }
        
        // فتح نافذة كشف الحساب
        setTimeout(() => {
            new bootstrap.Modal(document.getElementById('partnerStatementModal')).show();
        }, 500);
        
    } catch (error) {
        console.error('Error opening partner statement:', error);
        showAlert('حدث خطأ في فتح كشف حساب الشريك', 'danger');
    }
}

async function loadPartnerStatement() {
    const partnerName = document.getElementById('partnerStatementSelect').value;
    if (!partnerName) {
        document.getElementById('partnerStatementContent').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/get_partner_statement/${encodeURIComponent(partnerName)}`);
        const data = await response.json();
        
        // تحديث معلومات الشريك
        document.getElementById('partnerStatementName').textContent = data.partner_summary.partner_name;
        document.getElementById('partnerPercentage').textContent = `${data.partner_summary.percentage.toFixed(1)}%`;
        document.getElementById('partnerTheoreticalShare').textContent = `$${data.partner_summary.theoretical_share.toFixed(2)}`;
        document.getElementById('partnerWithdrawals').textContent = `$${data.partner_summary.withdrawals.toFixed(2)}`;
        document.getElementById('partnerCurrentBalance').textContent = `$${data.partner_summary.current_balance.toFixed(2)}`;
        
        // تحديث جدول المعاملات
        const transactionsBody = document.getElementById('partnerTransactionsBody');
        transactionsBody.innerHTML = '';
        
        data.transactions.forEach(transaction => {
            const typeLabel = transaction.transaction_type === 'withdrawal' ? 'سحب' : 'إيداع';
            const typeClass = transaction.transaction_type === 'withdrawal' ? 'text-danger' : 'text-success';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.transaction_date}</td>
                <td><span class="${typeClass}">${typeLabel}</span></td>
                <td class="${typeClass}">$${transaction.amount.toFixed(2)}</td>
                <td>$${transaction.balance_before.toFixed(2)}</td>
                <td>$${transaction.balance_after.toFixed(2)}</td>
                <td>${transaction.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deletePartnerTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            `;
            transactionsBody.appendChild(row);
        });
        
        // إظهار محتوى كشف الحساب
        document.getElementById('partnerStatementContent').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading partner statement:', error);
        showAlert('حدث خطأ في تحميل كشف حساب الشريك', 'danger');
    }
}

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
            // إعادة تحميل كشف الحساب
            loadPartnerStatement();
            updateStats();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting partner transaction:', error);
        showAlert('حدث خطأ في حذف المعاملة', 'danger');
    }
}

function showPartnerStatement(partnerName) {
    // إغلاق نافذة الشركاء
    const partnersModal = bootstrap.Modal.getInstance(document.getElementById('partnersModal'));
    if (partnersModal) {
        partnersModal.hide();
    }
    
    // فتح نافذة كشف الحساب
    setTimeout(() => {
        openPartnerStatement().then(() => {
            document.getElementById('partnerStatementSelect').value = partnerName;
            loadPartnerStatement();
        });
    }, 500);
}

function printPartnersReport() {
    document.body.classList.add('print-partners');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-partners');
    }, 1000);
}

function printPartnerStatement() {
    document.body.classList.add('print-partner-statement');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-partner-statement');
    }, 1000);
}

// دالة عرض التنبيهات
function showAlert(message, type = 'info') {
    // إنشاء عنصر التنبيه
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 300px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // إضافة التنبيه للصفحة
    document.body.appendChild(alertDiv);
    
    // إزالة التنبيه تلقائياً بعد 5 ثوان
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
