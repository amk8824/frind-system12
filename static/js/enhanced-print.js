/**
 * نظام الطباعة المحسن - يدعم جميع المتصفحات
 */
class EnhancedPrintSystem {
    constructor() {
        this.printStyles = this.createPrintStyles();
        this.init();
    }

    init() {
        // إضافة الأنماط للطباعة
        this.addPrintStyles();
        
        // تحسين window.print لجميع المتصفحات
        this.enhanceWindowPrint();
    }

    createPrintStyles() {
        return `
            @media print {
                * {
                    font-family: 'Cairo', sans-serif !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                
                body {
                    margin: 0 !important;
                    padding: 20px !important;
                    background: white !important;
                    color: black !important;
                    direction: rtl !important;
                    font-size: 12pt !important;
                }
                
                .no-print, .btn, button, .modal-header, .modal-footer {
                    display: none !important;
                }
                
                table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin: 10px 0 !important;
                }
                
                th, td {
                    border: 1px solid #333 !important;
                    padding: 8px !important;
                    text-align: right !important;
                    font-size: 11pt !important;
                }
                
                th {
                    background-color: #f5f5f5 !important;
                    font-weight: bold !important;
                }
                
                .report-title {
                    font-size: 18pt !important;
                    font-weight: bold !important;
                    text-align: center !important;
                    margin-bottom: 20px !important;
                    color: #1e3a8a !important;
                }
                
                .calculation-display {
                    font-weight: bold !important;
                    color: #059669 !important;
                }
                
                .alert {
                    border: 1px solid #ccc !important;
                    padding: 10px !important;
                    margin: 10px 0 !important;
                    border-radius: 5px !important;
                }
                
                .text-success { color: #059669 !important; }
                .text-info { color: #0284c7 !important; }
                .text-warning { color: #d97706 !important; }
                .text-danger { color: #dc2626 !important; }
                
                @page {
                    margin: 1cm;
                    size: A4;
                }
            }
        `;
    }

    addPrintStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'enhanced-print-styles';
        styleElement.textContent = this.printStyles;
        document.head.appendChild(styleElement);
    }

    enhanceWindowPrint() {
        const originalPrint = window.print;
        
        window.print = () => {
            try {
                // إضافة كلاس للطباعة
                document.body.classList.add('printing');
                
                // انتظار قصير لتطبيق الأنماط
                setTimeout(() => {
                    originalPrint.call(window);
                    
                    // إزالة كلاس الطباعة بعد الانتهاء
                    setTimeout(() => {
                        document.body.classList.remove('printing');
                    }, 1000);
                }, 100);
                
            } catch (error) {
                console.error('Print error:', error);
                // في حالة الفشل، استخدم الطريقة الأصلية
                originalPrint.call(window);
            }
        };
    }

    /**
     * طباعة محتوى محدد
     */
    printContent(content, title = 'تقرير') {
        try {
            const printWindow = this.createPrintWindow();
            const printDocument = this.preparePrintDocument(content, title);
            
            printWindow.document.write(printDocument);
            printWindow.document.close();
            
            // انتظار تحميل المحتوى ثم الطباعة
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 500);
            };
            
        } catch (error) {
            console.error('Print window error:', error);
            // في حالة فشل النافذة الجديدة، استخدم الطباعة المباشرة
            this.fallbackPrint(content, title);
        }
    }

    createPrintWindow() {
        const features = [
            'width=800',
            'height=600',
            'scrollbars=yes',
            'resizable=yes',
            'toolbar=no',
            'menubar=no',
            'location=no',
            'status=no'
        ].join(',');

        return window.open('', 'print-window', features);
    }

    preparePrintDocument(content, title) {
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    ${this.printStyles}
                    
                    body {
                        font-family: 'Cairo', sans-serif;
                        direction: rtl;
                        margin: 20px;
                        background: white;
                        color: black;
                    }
                    
                    .print-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #1e3a8a;
                        padding-bottom: 15px;
                    }
                    
                    .print-date {
                        font-size: 12pt;
                        color: #666;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <div class="report-title">${title}</div>
                    <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
                </div>
                ${content}
            </body>
            </html>
        `;
    }

    /**
     * الطباعة الاحتياطية في حالة فشل النافذة الجديدة
     */
    fallbackPrint(content, title) {
        // إنشاء div مخفي للطباعة
        const printDiv = document.createElement('div');
        printDiv.id = 'fallback-print-content';
        printDiv.innerHTML = `
            <div class="print-header">
                <div class="report-title">${title}</div>
                <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
            </div>
            ${content}
        `;
        
        // إخفاء المحتوى الحالي
        const originalContent = document.body.innerHTML;
        const originalTitle = document.title;
        
        // استبدال المحتوى مؤقتاً
        document.body.innerHTML = printDiv.innerHTML;
        document.title = title;
        
        // الطباعة
        window.print();
        
        // استعادة المحتوى الأصلي
        setTimeout(() => {
            document.body.innerHTML = originalContent;
            document.title = originalTitle;
        }, 1000);
    }

    /**
     * طباعة جدول محدد
     */
    printTable(tableSelector, title = 'تقرير') {
        const table = document.querySelector(tableSelector);
        if (!table) {
            console.error('Table not found:', tableSelector);
            return;
        }
        
        const tableClone = table.cloneNode(true);
        this.printContent(tableClone.outerHTML, title);
    }

    /**
     * طباعة نتائج البحث أو التصفية
     */
    printFilteredData(data, columns, title = 'تقرير') {
        if (!data || data.length === 0) {
            alert('لا توجد بيانات للطباعة');
            return;
        }

        let tableHTML = '<table class="table table-bordered">';
        
        // رؤوس الأعمدة
        tableHTML += '<thead><tr>';
        columns.forEach(col => {
            tableHTML += `<th>${col.title}</th>`;
        });
        tableHTML += '</tr></thead>';
        
        // البيانات
        tableHTML += '<tbody>';
        data.forEach(row => {
            tableHTML += '<tr>';
            columns.forEach(col => {
                const value = row[col.field] || '-';
                tableHTML += `<td>${value}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        
        this.printContent(tableHTML, title);
    }
}

// إنشاء نسخة عامة من النظام
window.enhancedPrint = new EnhancedPrintSystem();

// دوال مساعدة للاستخدام السهل
window.printRecords = () => {
    window.enhancedPrint.printTable('#recordsTable', 'سجلات التجار');
};

window.printNaberAccount = () => {
    window.enhancedPrint.printTable('.table', 'حساب النبر');
};

window.printWithdrawals = () => {
    window.enhancedPrint.printTable('#withdrawalsTable', 'السحوبات الخارجية');
};

window.printMerchantsDebts = () => {
    window.enhancedPrint.printTable('#merchantsDebtsTable', 'ديون التجار');
};

window.printPartnersReport = () => {
    window.enhancedPrint.printTable('#partnersTable', 'تقرير الشراكة');
};

console.log('Enhanced Print System loaded successfully');