-- نسخة احتياطية شاملة لنظام الأصدقاء للتخليص الكمركي
-- تاريخ الإنشاء: 2025-06-07
-- جميع البيانات محفوظة بأمان

-- ================================
-- 1. بيانات السجلات التجارية
-- ================================
INSERT INTO merchant_records (merchant_name, foreign_driver, foreign_car, local_driver, local_car, date, goods_type, notes, fees, advance, my_profit, addition, returned, created_at) VALUES 
('احمد العبيدي', 'علي', '123', 'عمر', '3321', '2025-06-07', 'ليمون', '', 7000.00, 210.00, 2100.00, 0.00, 0.00, '2025-06-07 15:47:29.599575'),
('احمد العبيدي', 'علي', '123', 'عمر', '3321', '2025-06-07', 'ليمون', '', 33000.00, 210.00, 6600.00, 0.00, 0.00, '2025-06-07 17:40:01.261623'),
('شركة النور للتجارة', 'أحمد علي', 'ABC123', 'محمد حسن', 'XYZ789', '2024-06-01', 'مواد غذائية', 'تخليص سريع', 1500.00, 500.00, 300.00, 100.00, 0.00, '2025-06-07 19:21:14.334908'),
('مؤسسة الأمل التجارية', 'سالم محمد', 'DEF456', 'علي أحمد', 'QWE321', '2024-06-02', 'أجهزة كهربائية', 'تخليص عادي', 2200.00, 800.00, 450.00, 50.00, 0.00, '2025-06-07 19:21:14.334908'),
('شركة الفجر للاستيراد', 'خالد سعد', 'GHI789', 'حسام عبدالله', 'RTY654', '2024-06-03', 'قطع غيار', 'تخليص عاجل', 1800.00, 600.00, 380.00, 0.00, 50.00, '2025-06-07 19:21:14.334908'),
('مجموعة الشروق التجارية', 'عمار يوسف', 'JKL012', 'فارس محمد', 'UIO987', '2024-06-04', 'منسوجات', 'تخليص عادي', 2500.00, 1000.00, 500.00, 200.00, 0.00, '2025-06-07 19:21:14.334908'),
('شركة البركة للتجارة', 'نادر عبدالرحمن', 'MNO345', 'طارق سليم', 'ASD123', '2024-06-05', 'مستحضرات تجميل', 'تخليص سريع', 1200.00, 400.00, 250.00, 80.00, 0.00, '2025-06-07 19:21:14.334908');

-- ================================
-- 2. بيانات مدفوعات التجار
-- ================================
INSERT INTO merchant_payments (merchant_name, amount, payment_date, balance_before, balance_after, notes, created_at) VALUES 
('شركة النور للتجارة', 1000.00, '2024-06-07', 2000.00, 1000.00, 'دفعة أولى', '2025-06-07 19:21:26.079058'),
('مؤسسة الأمل التجارية', 1500.00, '2024-06-08', 3000.00, 1500.00, 'تسديد جزئي', '2025-06-07 19:21:26.079058'),
('شركة الفجر للاستيراد', 800.00, '2024-06-09', 2400.00, 1600.00, 'دفعة نقدية', '2025-06-07 19:21:26.079058'),
('احمد العبيدي', 5000.00, '2025-06-07', 47210.00, 42210.00, 'تسديد', '2025-06-07 17:40:36.094076');

-- ================================
-- 3. بيانات السحوبات الخارجية
-- ================================
INSERT INTO withdrawals (amount, date, description, notes, created_at) VALUES 
(500.00, '2024-06-06', 'مصاريف إدارية', 'دفع فواتير المكتب', '2025-06-07 19:21:30.705477'),
(300.00, '2024-06-07', 'مصاريف تشغيلية', 'وقود وصيانة', '2025-06-07 19:21:30.705477'),
(200.00, '2024-06-08', 'مكافآت موظفين', 'حوافز شهرية', '2025-06-07 19:21:30.705477'),
(1000.00, '2025-06-07', 'سحب', '', '2025-06-07 15:47:45.029966'),
(2000.00, '2025-06-07', 'سحب مصاريف', '', '2025-06-07 17:39:17.978893'),
(500.00, '2025-06-07', 'سحب مصاريف', '', '2025-06-07 17:39:26.423685'),
(1000.00, '2025-06-07', 'سحب مصاريف', '', '2025-06-07 17:39:32.853007');

-- ================================
-- 4. بيانات الشركاء
-- ================================
INSERT INTO partners (name, phone, email, profit_percentage, is_active, created_at) VALUES 
('صديق', '07701234567', 'sadeeq@example.com', 20.00, true, '2025-06-07 15:47:13.625734'),
('محمد', '07702345678', 'mohammed@example.com', 20.00, true, '2025-06-07 15:47:13.625734'),
('زياد', '07703456789', 'ziad@example.com', 20.00, true, '2025-06-07 15:47:13.625734'),
('مؤيد', '07704567890', 'muayed@example.com', 12.00, true, '2025-06-07 15:47:13.625734'),
('عمر', '07705678901', 'omar@example.com', 10.00, true, '2025-06-07 15:47:13.625734'),
('صالح', '07706789012', 'saleh@example.com', 8.00, true, '2025-06-07 15:47:13.625734'),
('ايمن', '07707890123', 'ayman@example.com', 2.00, true, '2025-06-07 15:47:13.625734'),
('سلوان', '07708901234', 'salwan@example.com', 2.00, true, '2025-06-07 15:47:13.625734');

-- ================================
-- 5. بيانات معاملات الشركاء
-- ================================
INSERT INTO partner_transactions (partner_id, transaction_type, amount, date, description, notes, created_at) VALUES 
(1, 'share', 2000.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:47:55.522418'),
(2, 'share', 2000.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:47:58.953893'),
(3, 'share', 2000.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:48:01.946686'),
(4, 'share', 1200.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:48:04.698529'),
(5, 'share', 1000.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:48:08.314559'),
(6, 'share', 800.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:48:10.946711'),
(7, 'share', 200.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:48:13.578777'),
(8, 'share', 200.00, '2025-06-07', 'حصة أرباح', '', '2025-06-07 15:48:16.218842'),
(1, 'withdraw', 500.00, '2025-06-07', 'سحب شخصي', '', '2025-06-07 17:39:56.210999'),
(2, 'withdraw', 500.00, '2025-06-07', 'سحب شخصي', '', '2025-06-07 17:40:13.322896'),
(1, 'share', 1320.00, '2025-06-07', 'توزيع أرباح تلقائي - نسبة: 20.0%', 'توزيع تلقائي للأرباح', '2025-06-07 17:41:16.234587'),
(2, 'share', 1320.00, '2025-06-07', 'توزيع أرباح تلقائي - نسبة: 20.0%', 'توزيع تلقائي للأرباح', '2025-06-07 17:41:16.23959'),
(3, 'share', 1320.00, '2025-06-07', 'توزيع أرباح تلقائي - نسبة: 20.0%', 'توزيع تلقائي للأرباح', '2025-06-07 17:41:16.241592'),
(4, 'share', 792.00, '2025-06-07', 'توزيع أرباح تلقائي - نسبة: 12.0%', 'توزيع تلقائي للأرباح', '2025-06-07 17:41:16.243594');

-- ================================
-- ملاحظات مهمة:
-- ================================
-- إجمالي السجلات: 7 سجلات تجارية
-- إجمالي المدفوعات: 4 مدفوعات
-- إجمالي السحوبات: 7 سحوبات
-- إجمالي الشركاء: 8 شركاء
-- إجمالي معاملات الشراكة: 14 معاملة
-- إجمالي المستخدمين: 2 مستخدمين

-- لاستعادة البيانات، قم بتشغيل هذا الملف في قاعدة بيانات فارغة
-- تأكد من إنشاء الجداول أولاً قبل تشغيل هذا الملف