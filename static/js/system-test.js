// اختبار شامل لجميع وظائف النظام

// وظيفة اختبار شاملة
async function runSystemTest() {
    console.log('بدء اختبار النظام الشامل...');
    
    const results = {
        passed: 0,
        failed: 0,
        details: []
    };
    
    // اختبار 1: تحديث الإحصائيات
    try {
        await updateStats();
        results.passed++;
        results.details.push('✓ تحديث الإحصائيات');
    } catch (error) {
        results.failed++;
        results.details.push('✗ تحديث الإحصائيات: ' + error.message);
    }
    
    // اختبار 2: فتح السجلات
    try {
        await openRecords();
        results.passed++;
        results.details.push('✓ فتح السجلات');
    } catch (error) {
        results.failed++;
        results.details.push('✗ فتح السجلات: ' + error.message);
    }
    
    // اختبار 3: فتح ديون التجار
    try {
        await openMerchantsDebts();
        results.passed++;
        results.details.push('✓ فتح ديون التجار');
    } catch (error) {
        results.failed++;
        results.details.push('✗ فتح ديون التجار: ' + error.message);
    }
    
    // اختبار 4: فتح كشف حساب تاجر
    try {
        await openMerchantStatement();
        results.passed++;
        results.details.push('✓ فتح كشف حساب تاجر');
    } catch (error) {
        results.failed++;
        results.details.push('✗ فتح كشف حساب تاجر: ' + error.message);
    }
    
    // اختبار 5: فتح السحوبات الخارجية
    try {
        await openWithdrawal();
        results.passed++;
        results.details.push('✓ فتح السحوبات الخارجية');
    } catch (error) {
        results.failed++;
        results.details.push('✗ فتح السحوبات الخارجية: ' + error.message);
    }
    
    // اختبار 6: فتح إدارة الشراكة
    try {
        await openPartnersManagement();
        results.passed++;
        results.details.push('✓ فتح إدارة الشراكة');
    } catch (error) {
        results.failed++;
        results.details.push('✗ فتح إدارة الشراكة: ' + error.message);
    }
    
    // اختبار 7: زر عرض/إخفاء السجلات
    try {
        toggleRecordsView();
        results.passed++;
        results.details.push('✓ زر عرض/إخفاء السجلات');
    } catch (error) {
        results.failed++;
        results.details.push('✗ زر عرض/إخفاء السجلات: ' + error.message);
    }
    
    // اختبار 8: اختبار طباعة السجلات (محاكاة)
    try {
        // إنشاء جدول تجريبي للاختبار
        const testTable = document.createElement('div');
        testTable.id = 'recordsTableContainer';
        testTable.innerHTML = `
            <table>
                <tbody id="recordsTableBody">
                    <tr>
                        <td>2025-06-09</td>
                        <td>تاجر تجريبي</td>
                        <td>سائق أجنبي</td>
                        <td>سائق محلي</td>
                        <td>مواد غذائية</td>
                        <td>$100.00</td>
                        <td>$50.00</td>
                        <td>$230.00</td>
                    </tr>
                </tbody>
            </table>
        `;
        document.body.appendChild(testTable);
        
        // محاولة الطباعة
        printRecords();
        
        // تنظيف
        document.body.removeChild(testTable);
        
        results.passed++;
        results.details.push('✓ وظيفة طباعة السجلات');
    } catch (error) {
        results.failed++;
        results.details.push('✗ وظيفة طباعة السجلات: ' + error.message);
    }
    
    // اختبار 9: اختبار تحميل السجلات
    try {
        await loadRecords();
        results.passed++;
        results.details.push('✓ تحميل السجلات');
    } catch (error) {
        results.failed++;
        results.details.push('✗ تحميل السجلات: ' + error.message);
    }
    
    // اختبار 10: اختبار وظائف كشف الحساب
    try {
        openMerchantStatementDialog();
        handleReportTypeChange();
        results.passed++;
        results.details.push('✓ وظائف كشف الحساب');
    } catch (error) {
        results.failed++;
        results.details.push('✗ وظائف كشف الحساب: ' + error.message);
    }
    
    // عرض النتائج
    console.log('نتائج اختبار النظام:');
    console.log(`نجح: ${results.passed}`);
    console.log(`فشل: ${results.failed}`);
    console.log('التفاصيل:', results.details);
    
    // عرض النتائج في واجهة المستخدم
    const resultDiv = document.createElement('div');
    resultDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #002147;
        border-radius: 10px;
        padding: 20px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 10000;
        direction: rtl;
        font-family: 'Cairo', Arial, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    resultDiv.innerHTML = `
        <h3 style="color: #002147; text-align: center; margin-bottom: 20px;">
            نتائج اختبار النظام الشامل
        </h3>
        <div style="text-align: center; margin-bottom: 20px;">
            <span style="color: green; font-size: 18px; font-weight: bold;">✓ نجح: ${results.passed}</span>
            <span style="margin: 0 10px;">|</span>
            <span style="color: red; font-size: 18px; font-weight: bold;">✗ فشل: ${results.failed}</span>
        </div>
        <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
            ${results.details.map(detail => `<div style="margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 3px;">${detail}</div>`).join('')}
        </div>
        <div style="text-align: center;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #002147; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                إغلاق
            </button>
        </div>
    `;
    
    document.body.appendChild(resultDiv);
    
    return results;
}

// تشغيل الاختبار تلقائياً عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إنتظار 3 ثوان لضمان تحميل جميع العناصر
    setTimeout(() => {
        console.log('النظام جاهز للاختبار');
        // يمكن تشغيل الاختبار من وحدة التحكم عبر runSystemTest()
    }, 3000);
});

// اختبار سريع للوظائف الأساسية
function quickTest() {
    console.log('بدء الاختبار السريع...');
    
    const tests = [
        () => typeof updateStats === 'function',
        () => typeof openRecords === 'function',
        () => typeof openMerchantsDebts === 'function',
        () => typeof openMerchantStatement === 'function',
        () => typeof openWithdrawal === 'function',
        () => typeof openPartnersManagement === 'function',
        () => typeof toggleRecordsView === 'function',
        () => typeof printRecords === 'function',
        () => typeof openPaymentDialog === 'function',
        () => typeof openMerchantStatementDialog === 'function'
    ];
    
    const results = tests.map((test, index) => {
        try {
            return test() ? `✓ وظيفة ${index + 1}` : `✗ وظيفة ${index + 1}`;
        } catch (error) {
            return `✗ وظيفة ${index + 1}: ${error.message}`;
        }
    });
    
    console.log('نتائج الاختبار السريع:', results);
    return results;
}

// تصدير الوظائف للاستخدام العام
window.runSystemTest = runSystemTest;
window.quickTest = quickTest;