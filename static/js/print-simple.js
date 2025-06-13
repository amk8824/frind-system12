// الحل البسيط والفعال لمنع about:blank نهائياً
(function() {
    // منع فتح أي نافذة جديدة عند الطباعة
    const originalPrint = window.print;
    
    window.print = function() {
        // منع popup blocker
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                * { -webkit-print-color-adjust: exact !important; }
            }
        `;
        document.head.appendChild(style);
        
        // تنفيذ الطباعة مع منع النوافذ الجديدة
        try {
            // استخدام الطريقة الأصلية مع تعطيل النوافذ
            const originalOpen = window.open;
            window.open = () => null;
            
            originalPrint.call(window);
            
            // إرجاع window.open بعد 2 ثانية
            setTimeout(() => {
                window.open = originalOpen;
                document.head.removeChild(style);
            }, 2000);
            
        } catch (e) {
            console.log('Print fallback');
            originalPrint.call(window);
        }
    };
})();

// دوال الطباعة المبسطة
function printRecords() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.remove('print-merchants', 'print-statement', 'print-withdrawals', 'print-partners', 'print-partner-statement');
    document.body.classList.add('print-records');
    setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('print-records'), 1000);
    }, 200);
}

function printMerchantsDebts() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-merchants');
    setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('print-merchants'), 1000);
    }, 100);
}

function printMerchantStatement() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-statement');
    setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('print-statement'), 1000);
    }, 100);
}

function printWithdrawals() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-withdrawals');
    setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('print-withdrawals'), 1000);
    }, 100);
}

function printPartnersReport() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-partners');
    setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('print-partners'), 1000);
    }, 100);
}

function printPartnerStatement() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-partner-statement');
    setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('print-partner-statement'), 1000);
    }, 100);
}

function printMerchants() {
    printMerchantsDebts();
}