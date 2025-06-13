// حل مشكلة about:blank في الطباعة
function safePrint() {
    // منع فتح نوافذ جديدة
    const originalOpen = window.open;
    window.open = function() {
        return null;
    };
    
    // تنفيذ الطباعة
    window.print();
    
    // إرجاع window.open لحالته الأصلية
    setTimeout(() => {
        window.open = originalOpen;
    }, 1000);
}

// استبدال جميع دوال الطباعة
function printRecords() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.remove('print-merchants', 'print-statement', 'print-withdrawals', 'print-partners', 'print-partner-statement');
    document.body.classList.add('print-records');
    setTimeout(() => {
        safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-records');
        }, 500);
    }, 200);
}

function printMerchantsDebts() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-merchants');
    setTimeout(() => {
        safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-merchants');
        }, 500);
    }, 100);
}

function printMerchantStatement() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-statement');
    setTimeout(() => {
        safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-statement');
        }, 500);
    }, 100);
}

function printWithdrawals() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-withdrawals');
    setTimeout(() => {
        safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-withdrawals');
        }, 500);
    }, 100);
}

function printPartnersReport() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-partners');
    setTimeout(() => {
        safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-partners');
        }, 500);
    }, 100);
}

function printPartnerStatement() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-partner-statement');
    setTimeout(() => {
        safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-partner-statement');
        }, 500);
    }, 100);
}