// نظام إدارة الطباعة المتقدم - منع about:blank نهائياً
class PrintManager {
    constructor() {
        this.isBlocked = false;
        this.originalMethods = {};
        this.init();
    }

    init() {
        // حفظ الطرق الأصلية
        this.originalMethods.open = window.open;
        this.originalMethods.createElement = document.createElement;
        
        // تخصيص أحداث الطباعة
        this.setupPrintEvents();
    }

    setupPrintEvents() {
        // منع أي محاولة لفتح نوافذ أثناء الطباعة
        window.addEventListener('beforeprint', () => {
            this.blockPopups();
        });

        window.addEventListener('afterprint', () => {
            this.restoreMethods();
        });
    }

    blockPopups() {
        this.isBlocked = true;
        
        // منع window.open
        window.open = () => {
            console.log('Popup blocked during print');
            return null;
        };

        // منع إنشاء iframe
        document.createElement = (tagName) => {
            if (tagName && tagName.toLowerCase() === 'iframe' && this.isBlocked) {
                console.log('iframe creation blocked during print');
                return document.createDocumentFragment();
            }
            return this.originalMethods.createElement.call(document, tagName);
        };
    }

    restoreMethods() {
        setTimeout(() => {
            this.isBlocked = false;
            window.open = this.originalMethods.open;
            document.createElement = this.originalMethods.createElement;
        }, 2000);
    }

    safePrint() {
        this.blockPopups();
        
        // استخدام طرق متعددة للطباعة
        try {
            // الطريقة الأولى: execCommand
            if (document.execCommand) {
                if (document.execCommand('print', false, null)) {
                    this.restoreMethods();
                    return;
                }
            }
        } catch (e) {}

        try {
            // الطريقة الثانية: keyboard shortcut simulation
            const printEvent = new KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true
            });
            document.dispatchEvent(printEvent);
        } catch (e) {}

        // الطريقة الأخيرة: window.print
        setTimeout(() => {
            window.print();
            this.restoreMethods();
        }, 100);
    }
}

// إنشاء مدير الطباعة العام
window.printManager = new PrintManager();

// دوال الطباعة المحدثة
function printRecords() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.remove('print-merchants', 'print-statement', 'print-withdrawals', 'print-partners', 'print-partner-statement');
    document.body.classList.add('print-records');
    
    setTimeout(() => {
        window.printManager.safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-records');
        }, 1000);
    }, 200);
}

function printMerchantsDebts() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-merchants');
    setTimeout(() => {
        window.printManager.safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-merchants');
        }, 1000);
    }, 100);
}

function printMerchantStatement() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-statement');
    setTimeout(() => {
        window.printManager.safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-statement');
        }, 1000);
    }, 100);
}

function printWithdrawals() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-withdrawals');
    setTimeout(() => {
        window.printManager.safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-withdrawals');
        }, 1000);
    }, 100);
}

function printPartnersReport() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-partners');
    setTimeout(() => {
        window.printManager.safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-partners');
        }, 1000);
    }, 100);
}

function printPartnerStatement() {
    document.body.setAttribute('data-print-date', new Date().toLocaleString('ar-EG'));
    document.body.classList.add('print-partner-statement');
    setTimeout(() => {
        window.printManager.safePrint();
        setTimeout(() => {
            document.body.classList.remove('print-partner-statement');
        }, 1000);
    }, 100);
}

function printMerchants() {
    printMerchantsDebts();
}