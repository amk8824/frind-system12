// نظام التقارير المالية المتقدمة

// فتح لوحة التقارير المتقدمة
function openAdvancedReports() {
    const content = `
        <div class="advanced-reports-dashboard">
            <div class="reports-header text-center mb-4">
                <h4 style="color: #002147; font-weight: bold;">📊 التقارير المالية المتقدمة</h4>
                <p style="color: #666;">تقارير شاملة للتحليل المالي واتخاذ القرارات</p>
            </div>
            
            <div class="row g-3">
                <!-- تقرير الأداء المالي -->
                <div class="col-md-6">
                    <div class="report-card" onclick="generateFinancialPerformanceReport()">
                        <div class="report-icon">📈</div>
                        <h6>تقرير الأداء المالي</h6>
                        <p>تحليل شامل للأرباح والخسائر</p>
                    </div>
                </div>
                
                <!-- تقرير التدفق النقدي -->
                <div class="col-md-6">
                    <div class="report-card" onclick="generateCashFlowReport()">
                        <div class="report-icon">💰</div>
                        <h6>تقرير التدفق النقدي</h6>
                        <p>تتبع الأموال الداخلة والخارجة</p>
                    </div>
                </div>
                
                <!-- تحليل ربحية التجار -->
                <div class="col-md-6">
                    <div class="report-card" onclick="generateMerchantProfitabilityReport()">
                        <div class="report-icon">👥</div>
                        <h6>تحليل ربحية التجار</h6>
                        <p>أداء كل تاجر والعائد منه</p>
                    </div>
                </div>
                
                <!-- تقرير الديون المستحقة -->
                <div class="col-md-6">
                    <div class="report-card" onclick="generateOutstandingDebtsReport()">
                        <div class="report-icon">⚠️</div>
                        <h6>تقرير الديون المستحقة</h6>
                        <p>الديون المستحقة والمتأخرة</p>
                    </div>
                </div>
                
                <!-- تقرير التوقعات -->
                <div class="col-md-6">
                    <div class="report-card" onclick="generateForecastReport()">
                        <div class="report-icon">🔮</div>
                        <h6>تقرير التوقعات</h6>
                        <p>توقعات الأرباح المستقبلية</p>
                    </div>
                </div>
                
                <!-- مقارنة الفترات -->
                <div class="col-md-6">
                    <div class="report-card" onclick="generatePeriodComparisonReport()">
                        <div class="report-icon">📊</div>
                        <h6>مقارنة الفترات</h6>
                        <p>مقارنة الأداء بين الفترات</p>
                    </div>
                </div>
            </div>
            
            <div class="mt-4 text-center">
                <button class="btn btn-secondary" onclick="closeCustomModal()">إغلاق</button>
            </div>
        </div>
        
        <style>
            .advanced-reports-dashboard {
                padding: 20px;
            }
            .report-card {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border: 2px solid #dee2e6;
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                height: 150px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .report-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,33,71,0.15);
                border-color: #002147;
                background: linear-gradient(135deg, #002147, #1a365d);
                color: white;
            }
            .report-icon {
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            .report-card h6 {
                font-weight: bold;
                margin-bottom: 5px;
            }
            .report-card p {
                font-size: 0.9rem;
                margin: 0;
                opacity: 0.8;
            }
        </style>
    `;
    
    showCustomModal('التقارير المالية المتقدمة', content);
}

// تقرير الأداء المالي
async function generateFinancialPerformanceReport() {
    try {
        showAlert('جاري تحضير تقرير الأداء المالي...', 'info');
        
        // جلب البيانات المالية
        const [statsResponse, recordsResponse, withdrawalsResponse] = await Promise.all([
            fetch('/get_financial_stats'),
            fetch('/get_records'),
            fetch('/get_withdrawals')
        ]);
        
        const stats = await statsResponse.json();
        const records = await recordsResponse.json();
        const withdrawals = await withdrawalsResponse.json();
        
        // حساب المؤشرات المالية
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });
        
        const lastMonthRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const year = currentMonth === 0 ? currentYear - 1 : currentYear;
            return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === year;
        });
        
        const thisMonthRevenue = thisMonthRecords.reduce((sum, record) => sum + parseFloat(record.clearance_cost || 0), 0);
        const lastMonthRevenue = lastMonthRecords.reduce((sum, record) => sum + parseFloat(record.clearance_cost || 0), 0);
        
        const growthRate = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
        
        const content = `
            <div class="financial-performance-report">
                <div class="report-header text-center mb-4">
                    <h4 style="color: #002147;">📈 تقرير الأداء المالي</h4>
                    <p style="color: #666;">تحليل شامل للوضع المالي والأداء</p>
                    <small>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</small>
                </div>
                
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="metric-card revenue">
                            <div class="metric-icon">💰</div>
                            <div class="metric-value">$${stats.total_clearance_revenue?.toFixed(2) || '0.00'}</div>
                            <div class="metric-label">إجمالي الإيرادات</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="metric-card profit">
                            <div class="metric-icon">📊</div>
                            <div class="metric-value">$${stats.net_profit?.toFixed(2) || '0.00'}</div>
                            <div class="metric-label">صافي الربح</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="metric-card growth ${growthRate >= 0 ? 'positive' : 'negative'}">
                            <div class="metric-icon">${growthRate >= 0 ? '📈' : '📉'}</div>
                            <div class="metric-value">${growthRate.toFixed(1)}%</div>
                            <div class="metric-label">نمو شهري</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="metric-card transactions">
                            <div class="metric-icon">📋</div>
                            <div class="metric-value">${stats.total_records || 0}</div>
                            <div class="metric-label">إجمالي المعاملات</div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="analysis-card">
                            <h6>تحليل الإيرادات</h6>
                            <table class="table table-sm">
                                <tr>
                                    <td>إيرادات هذا الشهر:</td>
                                    <td class="text-success">$${thisMonthRevenue.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>إيرادات الشهر الماضي:</td>
                                    <td>$${lastMonthRevenue.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>متوسط المعاملة:</td>
                                    <td>$${stats.total_records > 0 ? (stats.total_clearance_revenue / stats.total_records).toFixed(2) : '0.00'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="analysis-card">
                            <h6>تحليل المصروفات</h6>
                            <table class="table table-sm">
                                <tr>
                                    <td>إجمالي السحوبات:</td>
                                    <td class="text-danger">$${stats.total_withdrawals?.toFixed(2) || '0.00'}</td>
                                </tr>
                                <tr>
                                    <td>مصاريف الحدود:</td>
                                    <td class="text-warning">$${stats.total_border_expenses?.toFixed(2) || '0.00'}</td>
                                </tr>
                                <tr>
                                    <td>نسبة المصروفات:</td>
                                    <td>${stats.total_clearance_revenue > 0 ? ((stats.total_withdrawals / stats.total_clearance_revenue) * 100).toFixed(1) : '0'}%</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 text-center">
                    <button class="btn btn-primary me-2" onclick="printFinancialPerformanceReport()">
                        🖨️ طباعة التقرير
                    </button>
                    <button class="btn btn-secondary" onclick="closeCustomModal()">
                        إغلاق
                    </button>
                </div>
            </div>
            
            <style>
                .financial-performance-report {
                    padding: 20px;
                }
                .metric-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    border: 2px solid #dee2e6;
                }
                .metric-card.revenue { border-color: #28a745; }
                .metric-card.profit { border-color: #007bff; }
                .metric-card.growth.positive { border-color: #28a745; }
                .metric-card.growth.negative { border-color: #dc3545; }
                .metric-card.transactions { border-color: #6f42c1; }
                .metric-icon { font-size: 2rem; margin-bottom: 10px; }
                .metric-value { font-size: 1.5rem; font-weight: bold; color: #002147; }
                .metric-label { font-size: 0.9rem; color: #666; }
                .analysis-card {
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
            </style>
        `;
        
        showCustomModal('تقرير الأداء المالي', content);
        
    } catch (error) {
        console.error('Error generating financial performance report:', error);
        showAlert('حدث خطأ في إنشاء تقرير الأداء المالي', 'danger');
    }
}

// تقرير التدفق النقدي
async function generateCashFlowReport() {
    try {
        showAlert('جاري تحضير تقرير التدفق النقدي...', 'info');
        
        const [recordsResponse, paymentsResponse, withdrawalsResponse] = await Promise.all([
            fetch('/get_records'),
            fetch('/get_merchant_statement/all'), // جلب جميع التسديدات
            fetch('/get_withdrawals')
        ]);
        
        const records = await recordsResponse.json();
        const withdrawals = await withdrawalsResponse.json();
        
        // تحضير بيانات التدفق النقدي لآخر 6 أشهر
        const months = [];
        const cashInflows = [];
        const cashOutflows = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const monthName = date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
            months.push(monthName);
            
            // الأموال الداخلة (إيرادات التخليص)
            const monthlyInflow = records
                .filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate.getMonth() === date.getMonth() && 
                           recordDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, record) => sum + parseFloat(record.clearance_cost || 0), 0);
            
            cashInflows.push(monthlyInflow);
            
            // الأموال الخارجة (السحوبات)
            const monthlyOutflow = withdrawals
                .filter(withdrawal => {
                    const withdrawalDate = new Date(withdrawal.date);
                    return withdrawalDate.getMonth() === date.getMonth() && 
                           withdrawalDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, withdrawal) => sum + parseFloat(withdrawal.amount || 0), 0);
            
            cashOutflows.push(monthlyOutflow);
        }
        
        const content = `
            <div class="cash-flow-report">
                <div class="report-header text-center mb-4">
                    <h4 style="color: #002147;">💰 تقرير التدفق النقدي</h4>
                    <p style="color: #666;">تتبع الأموال الداخلة والخارجة لآخر 6 أشهر</p>
                </div>
                
                <div class="cash-flow-summary mb-4">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="summary-card inflow">
                                <h6>إجمالي الداخل</h6>
                                <div class="amount text-success">$${cashInflows.reduce((a, b) => a + b, 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="summary-card outflow">
                                <h6>إجمالي الخارج</h6>
                                <div class="amount text-danger">$${cashOutflows.reduce((a, b) => a + b, 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="summary-card net">
                                <h6>صافي التدفق</h6>
                                <div class="amount text-primary">$${(cashInflows.reduce((a, b) => a + b, 0) - cashOutflows.reduce((a, b) => a + b, 0)).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="cash-flow-table">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>الشهر</th>
                                <th class="text-success">الأموال الداخلة</th>
                                <th class="text-danger">الأموال الخارجة</th>
                                <th class="text-primary">صافي التدفق</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${months.map((month, index) => `
                                <tr>
                                    <td><strong>${month}</strong></td>
                                    <td class="text-success">$${cashInflows[index].toFixed(2)}</td>
                                    <td class="text-danger">$${cashOutflows[index].toFixed(2)}</td>
                                    <td class="text-primary">$${(cashInflows[index] - cashOutflows[index]).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-4 text-center">
                    <button class="btn btn-primary me-2" onclick="printCashFlowReport()">
                        🖨️ طباعة التقرير
                    </button>
                    <button class="btn btn-secondary" onclick="closeCustomModal()">
                        إغلاق
                    </button>
                </div>
            </div>
            
            <style>
                .cash-flow-report { padding: 20px; }
                .summary-card {
                    background: white;
                    border: 2px solid #dee2e6;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 15px;
                }
                .summary-card.inflow { border-color: #28a745; }
                .summary-card.outflow { border-color: #dc3545; }
                .summary-card.net { border-color: #007bff; }
                .amount { font-size: 1.8rem; font-weight: bold; }
            </style>
        `;
        
        showCustomModal('تقرير التدفق النقدي', content);
        
    } catch (error) {
        console.error('Error generating cash flow report:', error);
        showAlert('حدث خطأ في إنشاء تقرير التدفق النقدي', 'danger');
    }
}

// تحليل ربحية التجار
async function generateMerchantProfitabilityReport() {
    try {
        showAlert('جاري تحضير تحليل ربحية التجار...', 'info');
        
        const response = await fetch('/get_records');
        const records = await response.json();
        
        // تجميع البيانات حسب التاجر
        const merchantData = {};
        
        records.forEach(record => {
            const merchant = record.merchant_name;
            if (!merchantData[merchant]) {
                merchantData[merchant] = {
                    totalTransactions: 0,
                    totalRevenue: 0,
                    totalFees: 0,
                    totalAdvance: 0,
                    avgTransactionValue: 0
                };
            }
            
            merchantData[merchant].totalTransactions++;
            merchantData[merchant].totalRevenue += parseFloat(record.clearance_cost || 0);
            merchantData[merchant].totalFees += parseFloat(record.fees || 0);
            merchantData[merchant].totalAdvance += parseFloat(record.advance || 0);
        });
        
        // حساب المتوسطات
        Object.keys(merchantData).forEach(merchant => {
            const data = merchantData[merchant];
            data.avgTransactionValue = data.totalRevenue / data.totalTransactions;
        });
        
        // ترتيب التجار حسب الإيرادات
        const sortedMerchants = Object.entries(merchantData)
            .sort(([,a], [,b]) => b.totalRevenue - a.totalRevenue);
        
        const content = `
            <div class="merchant-profitability-report">
                <div class="report-header text-center mb-4">
                    <h4 style="color: #002147;">👥 تحليل ربحية التجار</h4>
                    <p style="color: #666;">أداء كل تاجر والعائد منه</p>
                </div>
                
                <div class="merchants-ranking">
                    <h6 class="mb-3">ترتيب التجار حسب الإيرادات</h6>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead class="table-dark">
                                <tr>
                                    <th>الترتيب</th>
                                    <th>اسم التاجر</th>
                                    <th>عدد المعاملات</th>
                                    <th>إجمالي الإيرادات</th>
                                    <th>متوسط المعاملة</th>
                                    <th>إجمالي الأجور</th>
                                    <th>إجمالي السلف</th>
                                    <th>التقييم</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedMerchants.map(([merchant, data], index) => {
                                    let rating = '⭐⭐⭐⭐⭐';
                                    if (data.totalRevenue < 500) rating = '⭐⭐';
                                    else if (data.totalRevenue < 1000) rating = '⭐⭐⭐';
                                    else if (data.totalRevenue < 2000) rating = '⭐⭐⭐⭐';
                                    
                                    return `
                                        <tr>
                                            <td><strong>${index + 1}</strong></td>
                                            <td><strong style="color: #002147;">${merchant}</strong></td>
                                            <td>${data.totalTransactions}</td>
                                            <td class="text-success">$${data.totalRevenue.toFixed(2)}</td>
                                            <td>$${data.avgTransactionValue.toFixed(2)}</td>
                                            <td class="text-info">$${data.totalFees.toFixed(2)}</td>
                                            <td class="text-warning">$${data.totalAdvance.toFixed(2)}</td>
                                            <td>${rating}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="insights mt-4">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="insight-card">
                                <h6>أفضل تاجر</h6>
                                <p><strong>${sortedMerchants[0]?.[0] || 'لا يوجد'}</strong></p>
                                <p>إيرادات: $${sortedMerchants[0]?.[1]?.totalRevenue?.toFixed(2) || '0.00'}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="insight-card">
                                <h6>إجمالي التجار</h6>
                                <p><strong>${Object.keys(merchantData).length}</strong> تاجر نشط</p>
                                <p>متوسط الإيرادات: $${(Object.values(merchantData).reduce((sum, data) => sum + data.totalRevenue, 0) / Object.keys(merchantData).length).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 text-center">
                    <button class="btn btn-primary me-2" onclick="printMerchantProfitabilityReport()">
                        🖨️ طباعة التقرير
                    </button>
                    <button class="btn btn-secondary" onclick="closeCustomModal()">
                        إغلاق
                    </button>
                </div>
            </div>
            
            <style>
                .merchant-profitability-report { padding: 20px; }
                .insight-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border: 2px solid #dee2e6;
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                }
            </style>
        `;
        
        showCustomModal('تحليل ربحية التجار', content);
        
    } catch (error) {
        console.error('Error generating merchant profitability report:', error);
        showAlert('حدث خطأ في إنشاء تحليل ربحية التجار', 'danger');
    }
}

// تقرير الديون المستحقة
async function generateOutstandingDebtsReport() {
    try {
        showAlert('جاري تحضير تقرير الديون المستحقة...', 'info');
        
        const response = await fetch('/get_merchants_debts');
        const merchantsDebts = await response.json();
        
        // تصنيف الديون حسب المخاطر
        const highRisk = merchantsDebts.filter(merchant => merchant.total_debt > 2000);
        const mediumRisk = merchantsDebts.filter(merchant => merchant.total_debt > 1000 && merchant.total_debt <= 2000);
        const lowRisk = merchantsDebts.filter(merchant => merchant.total_debt <= 1000 && merchant.total_debt > 0);
        
        const content = `
            <div class="outstanding-debts-report">
                <div class="report-header text-center mb-4">
                    <h4 style="color: #002147;">⚠️ تقرير الديون المستحقة</h4>
                    <p style="color: #666;">تحليل المخاطر المالية والديون المستحقة</p>
                </div>
                
                <div class="risk-summary mb-4">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="risk-card high-risk">
                                <div class="risk-icon">🔴</div>
                                <h6>مخاطر عالية</h6>
                                <div class="count">${highRisk.length}</div>
                                <div class="amount">$${highRisk.reduce((sum, m) => sum + m.total_debt, 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="risk-card medium-risk">
                                <div class="risk-icon">🟡</div>
                                <h6>مخاطر متوسطة</h6>
                                <div class="count">${mediumRisk.length}</div>
                                <div class="amount">$${mediumRisk.reduce((sum, m) => sum + m.total_debt, 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="risk-card low-risk">
                                <div class="risk-icon">🟢</div>
                                <h6>مخاطر منخفضة</h6>
                                <div class="count">${lowRisk.length}</div>
                                <div class="amount">$${lowRisk.reduce((sum, m) => sum + m.total_debt, 0).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="debts-details">
                    <h6 class="mb-3">تفاصيل الديون المستحقة</h6>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead class="table-dark">
                                <tr>
                                    <th>التاجر</th>
                                    <th>إجمالي الدين</th>
                                    <th>الأجور</th>
                                    <th>السلف</th>
                                    <th>كلفة التخليص</th>
                                    <th>مستوى المخاطر</th>
                                    <th>الإجراء المطلوب</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${merchantsDebts.map(merchant => {
                                    let riskLevel = 'منخفضة';
                                    let riskColor = 'success';
                                    let action = 'متابعة عادية';
                                    
                                    if (merchant.total_debt > 2000) {
                                        riskLevel = 'عالية';
                                        riskColor = 'danger';
                                        action = 'متابعة فورية';
                                    } else if (merchant.total_debt > 1000) {
                                        riskLevel = 'متوسطة';
                                        riskColor = 'warning';
                                        action = 'متابعة دورية';
                                    }
                                    
                                    return `
                                        <tr>
                                            <td><strong>${merchant.merchant_name}</strong></td>
                                            <td class="text-danger"><strong>$${merchant.total_debt.toFixed(2)}</strong></td>
                                            <td>$${merchant.total_fees.toFixed(2)}</td>
                                            <td>$${merchant.total_advance.toFixed(2)}</td>
                                            <td>$${merchant.total_clearance.toFixed(2)}</td>
                                            <td><span class="badge bg-${riskColor}">${riskLevel}</span></td>
                                            <td><small>${action}</small></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="recommendations mt-4">
                    <div class="alert alert-info">
                        <h6><i class="fas fa-lightbulb"></i> التوصيات:</h6>
                        <ul class="mb-0">
                            <li>متابعة التجار ذوي المخاطر العالية بشكل فوري</li>
                            <li>وضع خطة تسديد للديون الكبيرة</li>
                            <li>مراجعة شروط الائتمان للتجار الجدد</li>
                            <li>تحصيل الديون المستحقة بانتظام</li>
                        </ul>
                    </div>
                </div>
                
                <div class="mt-4 text-center">
                    <button class="btn btn-primary me-2" onclick="printOutstandingDebtsReport()">
                        🖨️ طباعة التقرير
                    </button>
                    <button class="btn btn-secondary" onclick="closeCustomModal()">
                        إغلاق
                    </button>
                </div>
            </div>
            
            <style>
                .outstanding-debts-report { padding: 20px; }
                .risk-card {
                    background: white;
                    border: 2px solid #dee2e6;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 15px;
                }
                .risk-card.high-risk { border-color: #dc3545; }
                .risk-card.medium-risk { border-color: #ffc107; }
                .risk-card.low-risk { border-color: #28a745; }
                .risk-icon { font-size: 2rem; margin-bottom: 10px; }
                .count { font-size: 1.5rem; font-weight: bold; color: #002147; }
                .amount { font-size: 1.2rem; color: #666; }
            </style>
        `;
        
        showCustomModal('تقرير الديون المستحقة', content);
        
    } catch (error) {
        console.error('Error generating outstanding debts report:', error);
        showAlert('حدث خطأ في إنشاء تقرير الديون المستحقة', 'danger');
    }
}

// إضافة الوظائف للنافذة العامة
window.openAdvancedReports = openAdvancedReports;
window.generateFinancialPerformanceReport = generateFinancialPerformanceReport;
window.generateCashFlowReport = generateCashFlowReport;
window.generateMerchantProfitabilityReport = generateMerchantProfitabilityReport;
window.generateOutstandingDebtsReport = generateOutstandingDebtsReport;