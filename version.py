"""
معلومات إصدار نظام المحاسبة
"""

# معلومات الإصدار الأساسية
VERSION_MAJOR = 2
VERSION_MINOR = 1
VERSION_PATCH = 0
VERSION_BUILD = "2025.06.08"

# رقم الإصدار الكامل
VERSION = f"{VERSION_MAJOR}.{VERSION_MINOR}.{VERSION_PATCH}"
VERSION_FULL = f"{VERSION}.{VERSION_BUILD}"

# اسم النظام ومعلومات إضافية
APP_NAME = "نظام المحاسبة للتخليص الكمركي"
APP_NAME_EN = "Customs Clearance Accounting System"
COMPANY_NAME = "Dr. Sindst Solutions"
COPYRIGHT_YEAR = "2025"

# تاريخ الإصدار
RELEASE_DATE = "2025-06-08"
RELEASE_NOTES = """
الإصدار 2.1.0 - يونيو 2025
=========================

المميزات الجديدة:
✓ نظام إدارة المستخدمين والصلاحيات
✓ واجهة محسنة مع تصميم حكومي احترافي
✓ نظام توزيع الأرباح التلقائي والاختياري
✓ إدارة الشراكات المتقدمة
✓ تقارير مالية شاملة ومفصلة
✓ نظام طباعة محسن لجميع التقارير
✓ واجهة متجاوبة تعمل على جميع الأجهزة
✓ نظام نسخ احتياطي تلقائي
✓ مراقبة أداء النظام
✓ دعم الدومين المخصص مع SSL

التحسينات:
- تحسين الأداء وسرعة الاستجابة
- تحسين أمان قاعدة البيانات
- تحسين واجهة المستخدم العربية RTL
- إضافة تأثيرات صوتية للتفاعل
- تحسين نظام البحث والفلترة

الإصلاحات:
- إصلاح مشاكل العرض على الهواتف المحمولة
- إصلاح مشاكل الروابط والتوجيه
- تحسين استقرار النظام

النسخ السابقة:
- الإصدار 1.0.0: النظام الأساسي الأولي
- الإصدار 2.0.0: إضافة الشراكات والمستخدمين
"""

def get_version_info():
    """إرجاع معلومات الإصدار كاملة"""
    return {
        'version': VERSION,
        'version_full': VERSION_FULL,
        'app_name': APP_NAME,
        'app_name_en': APP_NAME_EN,
        'company': COMPANY_NAME,
        'release_date': RELEASE_DATE,
        'copyright_year': COPYRIGHT_YEAR,
        'build': VERSION_BUILD
    }

def get_version_string():
    """إرجاع نص الإصدار المختصر"""
    return f"{APP_NAME} - الإصدار {VERSION}"

def get_about_text():
    """إرجاع نص "حول البرنامج" كاملاً"""
    return f"""
{APP_NAME}
{APP_NAME_EN}

الإصدار: {VERSION_FULL}
تاريخ الإصدار: {RELEASE_DATE}
الشركة المطورة: {COMPANY_NAME}
حقوق الطبع والنشر © {COPYRIGHT_YEAR}

نظام محاسبي متكامل مصمم خصيصاً لشركات التخليص الكمركي
يوفر إدارة شاملة للمعاملات المالية والشراكات بكفاءة عالية
"""