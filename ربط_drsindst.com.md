# ربط drsindst.com مع النظام

## الخطوات المطلوبة:

### 1. في Replit (الآن):
1. اذهب إلى تبويب "Deployments" في الشريط الجانبي
2. انقر على "Create deployment" أو "Static deployment"
3. اختر "Autoscale deployment"
4. في قسم "Custom domain" أدخل: drsindst.com
5. انقر "Deploy"
6. ستحصل على CNAME record مثل:
   `your-repl-name.your-username.replit.app`

### 2. في موقع الدومين (حيث اشتريت drsindst.com):
1. اذهب إلى "DNS Management" أو "Domain Management"
2. أضف CNAME record جديد:
   - **Name/Host:** www
   - **Value/Target:** [الرابط الذي حصلت عليه من Replit]
   - **TTL:** 3600 أو Auto
3. أضف A record للدومين الرئيسي:
   - **Name/Host:** @ أو فارغ
   - **Value:** 35.241.35.41 (عنوان Replit IP)
4. احفظ التغييرات

### 3. الانتظار:
- التفعيل يحتاج 24-48 ساعة
- يمكن أن يعمل خلال ساعات قليلة أحياناً

### 4. التحقق:
- جرب drsindst.com في المتصفح
- إذا لم يعمل، جرب www.drsindst.com

## ملاحظات مهمة:
- فعّل "Always On" في Replit لضمان عدم التوقف
- احتفظ بنسخة احتياطية من البيانات
- النظام سيعمل بنفس الوظائف مع الدومين الجديد

## في حالة المشاكل:
- تحقق من صحة CNAME record
- انتظر وقتاً أطول للتفعيل
- اتصل بدعم مزود الدومين للمساعدة