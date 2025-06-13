from flask import render_template, request, jsonify, redirect, url_for, flash, session, make_response
from flask_login import login_required, current_user, login_user, logout_user
from app import app, db
from models import MerchantRecord, MerchantPayment, Withdrawal, Partner, PartnerTransaction, User, ProfitArchive, ProfitArchiveDetail, BorderExpense, NaberAccount, NaberPayment, WithdrawalArchive, BorderExpenseArchive, MerchantAdjustment
from datetime import datetime, date
from sqlalchemy import func, desc
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# إضافة رؤوس الأمان لجميع الاستجابات
@app.after_request
def add_security_headers(response):
    user_agent = request.headers.get('User-Agent', '')
    
    # إعدادات خاصة جداً لـ Safari iOS
    if 'Safari' in user_agent and ('iPhone' in user_agent or 'iPad' in user_agent or 'Mobile' in user_agent):
        # إزالة جميع القيود للسماح لـ Safari بالعمل
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Cache-Control'] = 'no-cache'
        # تجنب CSP تماماً لـ Safari
        if 'Content-Security-Policy' in response.headers:
            del response.headers['Content-Security-Policy']
    else:
        # إعدادات عادية للمتصفحات الأخرى
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    
    return response

@app.route('/safari-test')
def safari_test():
    """صفحة اختبار بسيطة لـ Safari"""
    return '''<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Safari Test</title></head>
<body><h1>Safari Test - يعمل!</h1><a href="/">الذهاب للموقع الرئيسي</a></body></html>'''

@app.route('/test')
def simple_test():
    """صفحة اختبار بسيطة"""
    import os
    return f'''<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Server Test</title></head>
<body>
<h1>خادم Flask يعمل!</h1>
<p>الخادم: {request.headers.get('Host', 'غير معروف')}</p>
<p>User-Agent: {request.headers.get('User-Agent', 'غير معروف')}</p>
<p>IP: {request.remote_addr}</p>
<p>التوقيت: {datetime.now()}</p>
<p><a href="/login">صفحة تسجيل الدخول</a></p>
<p><a href="/test_system">اختبار النظام</a></p>
</body></html>'''

@app.route('/test_system')
def test_system():
    """اختبار شامل لجميع وظائف النظام"""
    results = []
    
    # اختبار 1: حفظ سجل جديد
    try:
        new_record = MerchantRecord()
        new_record.recipient_merchant = "تاجر تجريبي"
        new_record.foreign_driver = "أحمد محمد"
        new_record.local_driver = "علي حسن"
        new_record.date = date.today()
        new_record.goods_type = "مواد غذائية"
        new_record.fees = 100
        new_record.advance = 50
        new_record.clearance_cost = 80
        new_record.notes = "اختبار النظام"
        
        db.session.add(new_record)
        db.session.commit()
        results.append("✓ حفظ السجل: نجح")
    except Exception as e:
        results.append(f"✗ حفظ السجل: فشل - {str(e)}")
    
    # اختبار 2: جلب الإحصائيات
    try:
        total_records = db.session.query(func.count(MerchantRecord.id)).scalar() or 0
        total_debt = db.session.query(func.sum(
            MerchantRecord.fees + MerchantRecord.advance + MerchantRecord.clearance_cost
        )).scalar() or 0
        results.append(f"✓ الإحصائيات: {total_records} سجل، إجمالي الديون: ${total_debt:.2f}")
    except Exception as e:
        results.append(f"✗ الإحصائيات: فشل - {str(e)}")
    
    # اختبار 3: حساب النبر
    try:
        naber_total = db.session.query(func.sum(
            MerchantRecord.fees + MerchantRecord.advance
        )).scalar() or 0
        results.append(f"✓ حساب النبر: ${naber_total:.2f}")
    except Exception as e:
        results.append(f"✗ حساب النبر: فشل - {str(e)}")
    
    # اختبار 4: ديون التجار
    try:
        merchants = db.session.query(
            MerchantRecord.recipient_merchant,
            func.sum(MerchantRecord.total_debt).label('total_debt'),
            func.count(MerchantRecord.id).label('records_count')
        ).group_by(MerchantRecord.recipient_merchant).all()
        results.append(f"✓ ديون التجار: {len(merchants)} تاجر")
    except Exception as e:
        results.append(f"✗ ديون التجار: فشل - {str(e)}")
    
    # اختبار 5: إضافة تسديد
    try:
        payment = MerchantPayment()
        payment.merchant_name = "تاجر تجريبي"
        payment.amount = 25
        payment.payment_date = date.today()
        payment.notes = "تسديد تجريبي"
        
        db.session.add(payment)
        db.session.commit()
        results.append("✓ إضافة تسديد: نجح")
    except Exception as e:
        results.append(f"✗ إضافة تسديد: فشل - {str(e)}")
    
    # اختبار 6: إضافة سحب خارجي
    try:
        withdrawal = Withdrawal()
        withdrawal.amount = 30
        withdrawal.date = date.today()
        withdrawal.description = "سحب تجريبي"
        withdrawal.expense_type = "عام"
        
        db.session.add(withdrawal)
        db.session.commit()
        results.append("✓ إضافة سحب خارجي: نجح")
    except Exception as e:
        results.append(f"✗ إضافة سحب خارجي: فشل - {str(e)}")
    
    # اختبار 7: إضافة شريك
    try:
        partner = Partner()
        partner.name = "شريك تجريبي"
        partner.profit_percentage = 30
        partner.phone = "123456789"
        partner.email = "partner@test.com"
        
        db.session.add(partner)
        db.session.commit()
        results.append("✓ إضافة شريك: نجح")
    except Exception as e:
        results.append(f"✗ إضافة شريك: فشل - {str(e)}")
    
    # اختبار 8: النتائج النهائية للنظام المحاسبي
    try:
        total_clearance = db.session.query(func.sum(MerchantRecord.clearance_cost)).scalar() or 0
        total_withdrawals = db.session.query(func.sum(Withdrawal.amount)).scalar() or 0
        net_profit = total_clearance - total_withdrawals
        results.append(f"✓ النظام المحاسبي: كلفة التخليص ${total_clearance:.2f} - السحوبات ${total_withdrawals:.2f} = صافي الربح ${net_profit:.2f}")
    except Exception as e:
        results.append(f"✗ النظام المحاسبي: فشل - {str(e)}")
    
    return f'''<!DOCTYPE html>
<html dir="rtl"><head><meta charset="UTF-8"><title>اختبار النظام</title>
<style>
body {{ font-family: 'Cairo', Arial, sans-serif; padding: 20px; direction: rtl; }}
.success {{ color: green; }} .error {{ color: red; }}
</style></head>
<body>
<h1>نتائج اختبار النظام الشامل</h1>
<pre>{'<br>'.join(results)}</pre>
<br><a href="/">العودة للنظام الرئيسي</a>
</body></html>'''

# دالة للتحقق من صلاحية الإدارة
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for('login'))
        if not current_user.is_admin():
            flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# دالة للتحقق من صلاحية رؤية الأرباح
def can_view_profits(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for('login'))
        if not current_user.can_view_profits():
            return jsonify({'success': False, 'message': 'ليس لديك صلاحية لرؤية الأرباح'})
        return f(*args, **kwargs)
    return decorated_function

# صفحة تسجيل الدخول
@app.route('/health')
def health_check():
    """فحص صحة النظام"""
    try:
        # فحص قاعدة البيانات
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        
        # فحص الذاكرة
        import psutil
        memory_percent = psutil.virtual_memory().percent
        
        # فحص المساحة
        disk_usage = psutil.disk_usage('/').percent
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'memory_usage': f'{memory_percent}%',
            'disk_usage': f'{disk_usage}%',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# تنظيف دوري للذاكرة وإدارة الموارد
@app.before_request
def memory_management():
    """إدارة الذاكرة قبل كل طلب"""
    try:
        import gc
        import psutil
        
        # فحص استخدام الذاكرة
        memory_percent = psutil.virtual_memory().percent
        
        # تنظيف الذاكرة إذا تجاوزت 85%
        if memory_percent > 85:
            gc.collect()
            logging.warning(f"تم تنظيف الذاكرة - الاستخدام: {memory_percent}%")
            
    except Exception as e:
        logging.error(f"خطأ في إدارة الذاكرة: {e}")

@app.after_request
def cleanup_session(response):
    """تنظيف الجلسات بعد كل طلب"""
    try:
        if hasattr(db.session, 'remove'):
            db.session.remove()
    except Exception as e:
        logging.error(f"خطأ في تنظيف الجلسة: {e}")
    return response

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password) and user.active:
            user.last_login = datetime.utcnow()
            db.session.commit()
            login_user(user)
            
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            return redirect(url_for('index'))
        else:
            flash('اسم المستخدم أو كلمة المرور غير صحيحة', 'danger')
    
    return render_template('login.html')

# تسجيل الخروج
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('تم تسجيل الخروج بنجاح', 'info')
    return redirect(url_for('login'))

@app.route('/')
def index():
    """الصفحة الرئيسية المحسنة"""
    # تسجيل دخول تلقائي للمستخدم admin للاختبار
    if not current_user.is_authenticated:
        admin_user = User.query.filter_by(username='admin').first()
        if admin_user:
            login_user(admin_user)
    
    stats = get_financial_stats()
    
    # جلب بيانات حساب النبر للعرض المباشر
    try:
        naber_entries = NaberAccount.query.order_by(desc(NaberAccount.date)).all()
        naber_data = []
        naber_total_fees = 0
        naber_total_advances = 0
        naber_total_profits = 0
        naber_total_amount = 0
        
        for entry in naber_entries:
            fees = float(entry.fees_amount or 0)
            advances = float(entry.advance_amount or 0)
            profits = float(getattr(entry, 'profit_amount', 0) or 0)
            total = float(entry.total_amount or 0)
            
            naber_data.append({
                'id': entry.id,
                'merchant_name': entry.merchant_name,
                'fees_amount': fees,
                'advance_amount': advances,
                'profit_amount': profits,
                'total_amount': total,
                'date': entry.date.strftime('%Y-%m-%d'),
                'created_at': entry.created_at.strftime('%Y-%m-%d %H:%M')
            })
            
            naber_total_fees += fees
            naber_total_advances += advances
            naber_total_profits += profits
            naber_total_amount += total
        
        # حساب المدفوعات والرصيد المتبقي
        naber_payments_total = db.session.query(func.sum(NaberPayment.amount)).scalar() or 0
        remaining_balance = max(0, naber_total_amount - float(naber_payments_total))
        
        naber_summary = {
            'entries': naber_data,
            'total_fees': naber_total_fees,
            'total_advances': naber_total_advances,
            'total_profits': naber_total_profits,
            'total_amount': naber_total_amount,
            'total_payments': float(naber_payments_total),
            'remaining_balance': remaining_balance,
            'entries_count': len(naber_data)
        }
        
    except Exception as e:
        logger.error(f"خطأ في جلب بيانات حساب النبر للصفحة الرئيسية: {str(e)}")
        naber_summary = {
            'entries': [],
            'total_fees': 0,
            'total_advances': 0,
            'total_profits': 0,
            'total_amount': 0,
            'total_payments': 0,
            'remaining_balance': 0,
            'entries_count': 0
        }
    
    return render_template('dashboard.html', stats=stats, naber_data=naber_summary)

@app.route('/old')
def old_dashboard():
    """النظام القديم للمقارنة"""
    stats = get_financial_stats()
    return render_template('index.html', stats=stats)

@app.route('/records')
@login_required
def records_page():
    """صفحة إدارة السجلات"""
    return render_template('records.html')

@app.route('/merchants')
@login_required
def merchants_page():
    """صفحة إدارة التجار - محذوفة"""
    return "صفحة إدارة التجار محذوفة مؤقتاً", 404

@app.route('/merchants_updated')
@login_required
def merchants_updated_page():
    """صفحة إدارة التجار الجديدة"""
    response = make_response(render_template('merchants_new.html'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/withdrawals')
@login_required
@can_view_profits
def withdrawals_page():
    """صفحة السحوبات الخارجية"""
    stats = get_financial_stats()
    return render_template('withdrawals.html', stats=stats)

@app.route('/partners')
@login_required
@can_view_profits
def partners_page():
    """صفحة إدارة الشراكة"""
    return render_template('partners.html')

# صفحة إدارة المستخدمين
@app.route('/users')
@admin_required
def users_page():
    """صفحة إدارة المستخدمين"""
    return render_template('users.html')



# الحصول على قائمة المستخدمين
@app.route('/get_users')
@admin_required
def get_users():
    """جلب قائمة المستخدمين"""
    try:
        users = User.query.all()
        users_data = []
        
        for user in users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'active': user.active,
                'created_at': user.created_at.strftime('%Y-%m-%d'),
                'last_login': user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else 'لم يسجل دخول'
            })
        
        return jsonify(users_data)
        
    except Exception as e:
        logger.error(f"خطأ في جلب المستخدمين: {str(e)}")
        return jsonify([])

# إضافة مستخدم جديد
@app.route('/add_user', methods=['POST'])
@admin_required
def add_user():
    """إضافة مستخدم جديد"""
    try:
        data = request.get_json()
        
        # التحقق من البيانات المطلوبة
        required_fields = ['username', 'email', 'full_name', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'حقل {field} مطلوب'})
        
        # التحقق من عدم وجود المستخدم مسبقاً
        existing_user = User.query.filter(
            (User.username == data['username']) | 
            (User.email == data['email'])
        ).first()
        
        if existing_user:
            return jsonify({'success': False, 'message': 'اسم المستخدم أو البريد الإلكتروني موجود مسبقاً'})
        
        # إنشاء المستخدم الجديد
        new_user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            role=data['role'],
            created_by=current_user.id
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم إضافة المستخدم بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في إضافة المستخدم: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في إضافة المستخدم: {str(e)}'})

# تحديث بيانات المستخدم
@app.route('/update_user/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """تحديث بيانات المستخدم"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # منع تعديل المستخدم الإداري الافتراضي
        if user.username == 'admin' and current_user.id != user.id:
            return jsonify({'success': False, 'message': 'لا يمكن تعديل المستخدم الإداري الافتراضي'})
        
        # تحديث البيانات
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'role' in data and user.username != 'admin':  # منع تغيير دور المدير الافتراضي
            user.role = data['role']
        if 'active' in data and user.username != 'admin':  # منع إلغاء تفعيل المدير الافتراضي
            user.active = data['active']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم تحديث بيانات المستخدم بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في تحديث المستخدم: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في تحديث المستخدم: {str(e)}'})

# حذف المستخدم
@app.route('/delete_user/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """حذف المستخدم"""
    try:
        user = User.query.get_or_404(user_id)
        
        # منع حذف المستخدم الإداري الافتراضي
        if user.username == 'admin':
            return jsonify({'success': False, 'message': 'لا يمكن حذف المستخدم الإداري الافتراضي'})
        
        # منع المستخدم من حذف نفسه
        if user.id == current_user.id:
            return jsonify({'success': False, 'message': 'لا يمكن حذف حسابك الشخصي'})
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم حذف المستخدم بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حذف المستخدم: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في حذف المستخدم: {str(e)}'})

@app.route('/save_record', methods=['POST'])
@login_required
def save_record():
    """حفظ سجل جديد - محدث للحقول الجديدة"""
    try:
        data = request.get_json()
        
        # التحقق من البيانات المطلوبة
        if not data.get('recipient_merchant') or not data.get('date'):
            return jsonify({'success': False, 'message': 'اسم التاجر المستلم والتاريخ مطلوبان'})
        
        # إنشاء سجل جديد بالحقول الجديدة
        record = MerchantRecord()
        record.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        record.sender_merchant = data.get('sender_merchant', '')
        record.recipient_merchant = data['recipient_merchant']
        record.foreign_driver = data.get('foreign_driver', '')
        record.foreign_car = data.get('foreign_car', '')
        record.local_driver = data.get('local_driver', '')
        record.local_car = data.get('local_car', '')
        record.goods_type = data.get('goods_type', '')
        record.fees = float(data.get('fees', 0) or 0)
        record.advance = float(data.get('advance', 0) or 0)
        record.clearance_cost = float(data.get('clearance_cost', 0) or 0)
        record.total_debt = float(data.get('fees', 0) or 0) + float(data.get('advance', 0) or 0) + float(data.get('clearance_cost', 0) or 0)
        record.notes = data.get('notes', '')
        
        db.session.add(record)
        db.session.flush()  # للحصول على ID السجل
        
        # إنشاء إدخال في حساب النبر إذا كان هناك أجور أو سلف
        fees = float(data.get('fees', 0) or 0)
        advance = float(data.get('advance', 0) or 0)
        
        if fees > 0 or advance > 0:
            # التحقق من عدم وجود سجل نبر مكرر للسجل نفسه
            existing_naber = NaberAccount.query.filter_by(record_id=record.id).first()
            if not existing_naber:
                naber_entry = NaberAccount()
                naber_entry.record_id = record.id
                naber_entry.merchant_name = data['recipient_merchant']
                naber_entry.fees_amount = fees
                naber_entry.advance_amount = advance
                naber_entry.total_amount = fees + advance  # الأجور + السلف فقط
                naber_entry.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
                db.session.add(naber_entry)
                logger.info(f"تم إنشاء سجل نبر جديد للسجل {record.id} بمبلغ ${fees + advance:.2f}")
            else:
                logger.warning(f"سجل النبر موجود بالفعل للسجل {record.id}")
        
        db.session.commit()
        
        logger.info(f"تم حفظ سجل جديد للتاجر: {data['recipient_merchant']}")
        return jsonify({'success': True, 'message': 'تم حفظ السجل بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حفظ السجل: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ في حفظ السجل'})

@app.route('/get_stats')
@can_view_profits
def get_stats():
    """الحصول على الإحصائيات المالية"""
    stats = get_financial_stats()
    return jsonify(stats)

@app.route('/get_records')
@login_required
def get_records():
    """الحصول على جميع السجلات"""
    try:
        records = MerchantRecord.query.order_by(desc(MerchantRecord.date)).all()
        
        records_data = []
        for record in records:
            records_data.append({
                'id': record.id,
                'date': record.date.strftime('%Y-%m-%d'),
                'sender_merchant': record.sender_merchant or '',
                'recipient_merchant': record.recipient_merchant or '',
                'foreign_driver': record.foreign_driver or '',
                'foreign_car': record.foreign_car or '',
                'local_driver': record.local_driver or '',
                'local_car': record.local_car or '',
                'goods_type': record.goods_type or '',
                'fees': float(record.fees or 0),
                'advance': float(record.advance or 0),
                'clearance_cost': float(record.clearance_cost or 0),
                'total_debt': float(record.total_debt or 0),
                'notes': record.notes or ''
            })
        
        return jsonify({'success': True, 'records': records_data})
        
    except Exception as e:
        logger.error(f"خطأ في تحميل السجلات: {str(e)}")
        return jsonify({'success': False, 'message': f'خطأ في تحميل السجلات: {str(e)}'})

@app.route('/get_merchants_debts')
@login_required
def get_merchants_debts():
    """الحصول على ديون التجار"""
    try:
        # حساب المجاميع لكل تاجر من السجلات
        merchant_totals = db.session.query(
            MerchantRecord.recipient_merchant.label('merchant_name'),
            func.count(MerchantRecord.id).label('transaction_count'),
            func.sum(MerchantRecord.fees).label('total_fees'),
            func.sum(MerchantRecord.advance).label('total_advance'),
            func.sum(MerchantRecord.clearance_cost).label('total_clearance'),
            func.max(MerchantRecord.date).label('last_transaction')
        ).filter_by(is_archived=False).group_by(MerchantRecord.recipient_merchant).all()
        
        # حساب المدفوعات لكل تاجر
        payment_totals = db.session.query(
            MerchantPayment.merchant_name,
            func.sum(MerchantPayment.amount).label('total_payments')
        ).group_by(MerchantPayment.merchant_name).all()
        
        # تحويل المدفوعات إلى قاموس
        payments_dict = {p.merchant_name: float(p.total_payments) for p in payment_totals}
        
        merchants_data = []
        for merchant in merchant_totals:
            # حساب إجمالي الدين
            fees = float(merchant.total_fees or 0)
            advance = float(merchant.total_advance or 0)
            clearance = float(merchant.total_clearance or 0)
            
            total_debt = fees + advance + clearance
            total_payments = payments_dict.get(merchant.merchant_name, 0)
            current_balance = total_debt - total_payments
            
            merchants_data.append({
                'name': merchant.merchant_name,
                'transaction_count': merchant.transaction_count,
                'total_fees': float(merchant.total_fees or 0),
                'total_advance': float(merchant.total_advance or 0),
                'total_debt': total_debt,
                'total_payments': total_payments,
                'current_balance': current_balance,
                'last_transaction': merchant.last_transaction.strftime('%Y-%m-%d') if merchant.last_transaction else None
            })
        
        return jsonify(merchants_data)
        
    except Exception as e:
        logger.error(f"خطأ في تحميل ديون التجار: {str(e)}")
        return jsonify([])

@app.route('/get_merchant_statement/<merchant_name>')
def get_merchant_statement(merchant_name):
    """الحصول على كشف حساب تاجر محدد - للتجار المستلمين فقط"""
    try:
        # الحصول على معاملات التاجر المستلم فقط
        transactions = MerchantRecord.query.filter_by(
            recipient_merchant=merchant_name,
            is_archived=False
        ).order_by(desc(MerchantRecord.date)).all()
        
        # الحصول على مدفوعات التاجر
        payments = MerchantPayment.query.filter_by(
            merchant_name=merchant_name
        ).order_by(desc(MerchantPayment.payment_date)).all()
        
        # حساب الإحصائيات
        total_debt = sum(float(t.total_debt) for t in transactions)
        total_payments = sum(float(p.amount) for p in payments)
        current_balance = total_debt - total_payments
        
        # دمج جميع المعاملات والتسديدات في قائمة واحدة مرتبة
        all_transactions = []
        
        # إضافة المعاملات
        for t in transactions:
            all_transactions.append({
                'date': t.date.strftime('%Y-%m-%d'),
                'type': 'transaction',
                'fees': float(t.fees or 0),
                'advance': float(t.advance or 0),
                'total_debt': float(t.total_debt),
                'amount': 0,
                'balance_after': 0,  # سيتم حسابه لاحقاً
                'notes': t.notes or f"البضاعة: {t.goods_type or 'غير محدد'}"
            })
        
        # إضافة التسديدات
        for p in payments:
            all_transactions.append({
                'date': p.payment_date.strftime('%Y-%m-%d'),
                'type': 'payment',
                'fees': 0,
                'advance': 0,
                'total_debt': 0,
                'amount': float(p.amount),
                'balance_after': float(p.balance_after),
                'notes': p.notes or 'تسديد'
            })
        
        # ترتيب المعاملات حسب التاريخ
        all_transactions.sort(key=lambda x: x['date'])
        
        # حساب الرصيد التراكمي مع إضافة الرصيد قبل كل عملية
        running_balance = 0
        for transaction in all_transactions:
            balance_before = running_balance
            if transaction['type'] == 'transaction':
                running_balance += transaction['total_debt']
            else:  # payment
                running_balance -= transaction['amount']
            
            transaction['balance_before'] = balance_before
            transaction['balance_after'] = running_balance
        
        # عكس الترتيب لإظهار الأحدث أولاً
        all_transactions.reverse()
        
        # الحصول على آخر دفعة وتفاصيلها
        last_payment = None
        if payments:
            last_payment = {
                'amount': float(payments[0].amount),
                'date': payments[0].payment_date.strftime('%Y-%m-%d'),
                'notes': payments[0].notes or 'تسديد',
                'balance_before': float(payments[0].balance_before),
                'balance_after': float(payments[0].balance_after)
            }
        
        return jsonify({
            'summary': {
                'merchant_name': merchant_name,
                'current_balance': current_balance,
                'total_debt': total_debt,
                'total_payments': total_payments,
                'transaction_count': len(transactions),
                'payment_count': len(payments),
                'last_payment': last_payment
            },
            'transactions': all_transactions
        })
        
    except Exception as e:
        logger.error(f"خطأ في تحميل كشف حساب التاجر {merchant_name}: {str(e)}")
        return jsonify({'error': f'حدث خطأ في تحميل كشف الحساب: {str(e)}'}), 500

@app.route('/adjust_merchant_debt', methods=['POST'])
@login_required
def adjust_merchant_debt():
    """تعديل دين التاجر (إضافة أو راجع)"""
    try:
        data = request.get_json()
        merchant_name = data.get('merchant_name')
        amount = float(data.get('amount', 0))
        adjust_type = data.get('adjustment_type') or data.get('type')  # 'add' or 'return'/'subtract'
        notes = data.get('description') or data.get('notes', '')
        
        if not merchant_name or amount <= 0:
            return jsonify({'success': False, 'error': 'بيانات غير صحيحة'})
        
        if adjust_type not in ['add', 'subtract', 'return']:
            return jsonify({'success': False, 'error': 'نوع التعديل غير صحيح'})
        
        # حساب رصيد التاجر الحالي
        # حساب إجمالي الديون
        total_debt = db.session.query(db.func.sum(
            MerchantRecord.fees + MerchantRecord.advance + MerchantRecord.clearance_cost
        )).filter_by(merchant_name=merchant_name, is_archived=False).scalar() or 0
        
        # حساب إجمالي التسديدات
        total_payments = db.session.query(db.func.sum(
            MerchantPayment.amount
        )).filter_by(merchant_name=merchant_name).scalar() or 0
        
        current_balance = float(total_debt) - float(total_payments)
        
        # تحديد نوع المعاملة والمبلغ
        if adjust_type == 'add':
            # إضافة للدين - إنشاء سجل وهمي بكلفة تخليص
            balance_before = current_balance
            balance_after = current_balance + amount
            description = f"إضافة للدين - {notes}" if notes else "إضافة للدين"
        else:  # 'subtract' or 'return'
            # راجع من الدين - إنشاء تسديد
            balance_before = current_balance
            balance_after = current_balance - amount
            description = f"راجع من الدين - {notes}" if notes else "راجع من الدين"
        
        if adjust_type == 'add':
            # إنشاء سجل جديد بكلفة تخليص فقط
            new_record = MerchantRecord(
                merchant_name=merchant_name,
                date=datetime.now().date(),
                fees=0,
                advance=0,
                clearance_cost=amount,
                border_expenses=0,
                notes=description,
                goods_type="تعديل دين - إضافة",
                is_archived=False
            )
            
            db.session.add(new_record)
            message = f"تم إضافة ${amount:.2f} إلى دين {merchant_name}"
            
        else:
            # إنشاء تسديد
            new_payment = MerchantPayment(
                merchant_name=merchant_name,
                amount=amount,
                payment_date=datetime.now().date(),
                balance_before=balance_before,
                balance_after=balance_after,
                notes=description
            )
            
            db.session.add(new_payment)
            message = f"تم راجع ${amount:.2f} من دين {merchant_name}"
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message,
            'new_balance': balance_after
        })
        
    except Exception as e:
        logging.error(f"خطأ في تعديل دين التاجر: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'error': f'حدث خطأ: {str(e)}'})


@app.route('/add_payment', methods=['POST'])
def add_payment():
    """إضافة تسديد للتاجر"""
    try:
        data = request.get_json()
        
        merchant_name = data.get('merchant_name')
        amount = float(data.get('amount', 0))
        payment_date = datetime.strptime(data.get('payment_date'), '%Y-%m-%d').date()
        notes = data.get('notes', '')
        
        if not merchant_name or amount <= 0:
            return jsonify({'success': False, 'message': 'بيانات غير صحيحة'})
        
        # حساب الرصيد قبل التسديد
        transactions = MerchantRecord.query.filter_by(recipient_merchant=merchant_name).all()
        payments = MerchantPayment.query.filter_by(merchant_name=merchant_name).all()
        
        total_debt = sum(float(t.total_debt or 0) for t in transactions)
        total_payments = sum(float(p.amount or 0) for p in payments)
        balance_before = total_debt - total_payments
        balance_after = balance_before - amount
        
        # إنشاء سجل التسديد
        payment = MerchantPayment(
            merchant_name=merchant_name,
            amount=amount,
            payment_date=payment_date,
            balance_before=balance_before,
            balance_after=balance_after,
            notes=notes
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم إضافة التسديد بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في إضافة التسديد: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ في إضافة التسديد'})

@app.route('/save_withdrawal', methods=['POST'])
def save_withdrawal():
    """حفظ سحب خارجي"""
    try:
        data = request.get_json()
        
        amount = float(data.get('amount', 0))
        date_str = data.get('date')
        expense_type = data.get('expense_type', 'عام')
        description = data.get('description', '')
        notes = data.get('notes', '')
        
        if amount <= 0 or not date_str:
            return jsonify({'success': False, 'message': 'يرجى إدخال المبلغ والتاريخ'})
        
        withdrawal = Withdrawal(
            amount=amount,
            date=datetime.strptime(date_str, '%Y-%m-%d').date(),
            expense_type=expense_type,
            description=description,
            notes=notes
        )
        
        db.session.add(withdrawal)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم حفظ السحب بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حفظ السحب: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ في حفظ السحب'})

@app.route('/get_withdrawals')
def get_withdrawals():
    """الحصول على السحوبات"""
    try:
        # إخفاء السحوبات من نوع "نظام" (المعادلات التلقائية)
        withdrawals = Withdrawal.query.filter(
            Withdrawal.expense_type != 'نظام'
        ).order_by(desc(Withdrawal.date)).all()
        
        withdrawals_data = []
        for w in withdrawals:
            withdrawals_data.append({
                'id': w.id,
                'amount': float(w.amount),
                'date': w.date.strftime('%Y-%m-%d'),
                'expense_type': w.expense_type or 'عام',
                'description': w.description or '',
                'notes': w.notes or ''
            })
        
        return jsonify({
            'success': True,
            'withdrawals': withdrawals_data
        })
        
    except Exception as e:
        logger.error(f"خطأ في تحميل السحوبات: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'حدث خطأ في تحميل السحوبات: {str(e)}',
            'withdrawals': []
        })

@app.route('/delete_withdrawal/<int:withdrawal_id>', methods=['DELETE'])
def delete_withdrawal(withdrawal_id):
    """حذف سحب خارجي"""
    try:
        withdrawal = Withdrawal.query.get_or_404(withdrawal_id)
        db.session.delete(withdrawal)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم حذف السحب بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حذف السحب: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ في حذف السحب'})

# روتات إدارة الشراكة
@app.route('/get_partners')
def get_partners():
    """الحصول على بيانات الشركاء"""
    try:
        partners = Partner.query.filter_by(is_active=True).all()
        
        partners_data = []
        for partner in partners:
            # حساب رصيد الشريك
            share_transactions = PartnerTransaction.query.filter_by(
                partner_id=partner.id, 
                transaction_type='share'
            ).all()
            withdraw_transactions = PartnerTransaction.query.filter_by(
                partner_id=partner.id, 
                transaction_type='withdraw'
            ).all()
            add_transactions = PartnerTransaction.query.filter_by(
                partner_id=partner.id, 
                transaction_type='add'
            ).all()
            
            total_shares = sum(float(t.amount) for t in share_transactions)
            total_withdrawals = sum(float(t.amount) for t in withdraw_transactions)
            total_additions = sum(float(t.amount) for t in add_transactions)
            
            current_balance = total_shares + total_additions - total_withdrawals
            
            partners_data.append({
                'id': partner.id,
                'name': partner.name,
                'partner_name': partner.name,  # إضافة الحقل المطلوب في JavaScript
                'phone': partner.phone,
                'email': partner.email,
                'profit_percentage': float(partner.profit_percentage),
                'total_shares': total_shares,
                'total_withdrawals': total_withdrawals,
                'total_additions': total_additions,
                'current_balance': current_balance,
                'transactions_count': len(partner.transactions)
            })
        
        # حساب الإحصائيات الإضافية
        stats = get_financial_stats()
        available_profits = stats.get('available_balance', 0)
        distributed_profits = sum(p['total_shares'] for p in partners_data)
        
        # الحصول على آخر المعاملات
        recent_transactions = db.session.query(PartnerTransaction, Partner.name).join(
            Partner, PartnerTransaction.partner_id == Partner.id
        ).order_by(PartnerTransaction.created_at.desc()).limit(10).all()
        
        recent_data = []
        for transaction, partner_name in recent_transactions:
            recent_data.append({
                'id': transaction.id,
                'partner_name': partner_name,
                'transaction_type': transaction.transaction_type,
                'amount': float(transaction.amount),
                'date': transaction.date.strftime('%Y-%m-%d') if transaction.date else '',
                'description': transaction.description or '',
                'created_at': transaction.created_at.strftime('%Y-%m-%d %H:%M') if transaction.created_at else ''
            })
        
        return jsonify({
            'success': True,
            'partners': partners_data,
            'available_profits': available_profits,
            'distributed_profits': distributed_profits,
            'recent_transactions': recent_data
        })
        
    except Exception as e:
        logger.error(f"خطأ في تحميل بيانات الشركاء: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'حدث خطأ في تحميل بيانات الشركاء',
            'details': str(e)
        })

@app.route('/add_partner', methods=['POST'])
@login_required
def add_partner():
    """إضافة شريك جديد"""
    try:
        data = request.get_json()
        
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        profit_percentage = float(data.get('profit_percentage', 0))
        is_active = data.get('is_active', True)
        
        if not name:
            return jsonify({'success': False, 'message': 'اسم الشريك مطلوب'})
        
        if profit_percentage <= 0 or profit_percentage > 100:
            return jsonify({'success': False, 'message': 'نسبة الأرباح يجب أن تكون بين 1 و 100'})
        
        # التحقق من عدم تكرار الاسم
        existing_partner = Partner.query.filter_by(name=name).first()
        if existing_partner:
            return jsonify({'success': False, 'message': 'اسم الشريك موجود مسبقاً'})
        
        partner = Partner()
        partner.name = name
        partner.phone = phone if phone else None
        partner.email = email if email else None
        partner.profit_percentage = profit_percentage
        partner.is_active = is_active
        
        db.session.add(partner)
        db.session.commit()
        
        logger.info(f"تم إضافة شريك جديد: {name}")
        return jsonify({'success': True, 'message': 'تم إضافة الشريك بنجاح'})
        
    except Exception as e:
        logger.error(f"خطأ في إضافة الشريك: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'حدث خطأ في إضافة الشريك'})

@app.route('/add_partner_transaction', methods=['POST'])
@login_required
def add_partner_transaction():
    """إضافة معاملة شريك"""
    try:
        data = request.get_json()
        
        partner_id = data.get('partner_id')
        transaction_type = data.get('transaction_type')  # 'share', 'withdraw', 'add'
        amount = float(data.get('amount', 0))
        date_str = data.get('date')
        description = data.get('description', '')
        notes = data.get('notes', '')
        
        if not partner_id or not transaction_type or amount <= 0 or not date_str:
            return jsonify({'success': False, 'message': 'بيانات غير مكتملة'})
        
        # التحقق من وجود الشريك
        partner = Partner.query.get(partner_id)
        if not partner:
            return jsonify({'success': False, 'message': 'الشريك غير موجود'})
        
        transaction = PartnerTransaction(
            partner_id=partner_id,
            transaction_type=transaction_type,
            amount=amount,
            date=datetime.strptime(date_str, '%Y-%m-%d').date(),
            description=description,
            notes=notes
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم إضافة المعاملة بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في إضافة معاملة الشريك: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ في إضافة المعاملة'})

@app.route('/get_partner_statement/<int:partner_id>')
def get_partner_statement(partner_id):
    """الحصول على كشف حساب شريك محدد"""
    try:
        partner = Partner.query.get_or_404(partner_id)
        
        transactions = PartnerTransaction.query.filter_by(
            partner_id=partner_id
        ).order_by(desc(PartnerTransaction.date)).all()
        
        transactions_data = []
        running_balance = 0
        
        for t in transactions:
            if t.transaction_type == 'share' or t.transaction_type == 'add':
                running_balance += float(t.amount)
            else:  # withdraw
                running_balance -= float(t.amount)
                
            transactions_data.append({
                'id': t.id,
                'date': t.date.strftime('%Y-%m-%d'),
                'transaction_type': t.transaction_type,
                'amount': float(t.amount),
                'description': t.description,
                'notes': t.notes,
                'running_balance': running_balance
            })
        
        # حساب الإحصائيات
        total_shares = sum(float(t.amount) for t in transactions if t.transaction_type in ['share', 'add'])
        total_withdrawals = sum(float(t.amount) for t in transactions if t.transaction_type == 'withdraw')
        
        return jsonify({
            'success': True,
            'partner': {
                'id': partner.id,
                'name': partner.name,
                'profit_percentage': float(partner.profit_percentage)
            },
            'transactions': transactions_data,
            'current_balance': running_balance,
            'total_shares': total_shares,
            'total_withdrawals': total_withdrawals
        })
        
    except Exception as e:
        logger.error(f"خطأ في تحميل كشف حساب الشريك: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'حدث خطأ في تحميل كشف الحساب',
            'details': str(e)
        })

@app.route('/delete_partner_transaction/<int:transaction_id>', methods=['DELETE'])
def delete_partner_transaction(transaction_id):
    """حذف معاملة شريك"""
    try:
        transaction = PartnerTransaction.query.get_or_404(transaction_id)
        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم حذف المعاملة بنجاح'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حذف معاملة الشريك: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ في حذف المعاملة'})

@app.route('/get_profit_distribution_report')
def get_profit_distribution_report():
    """تقرير مفصل لتوزيع الأرباح"""
    try:
        logger.info("تم استدعاء تقرير الأرباح")
            
        # إجمالي الأرباح الخام (من كلفة التخليص)
        total_gross_profit = db.session.query(
            func.sum(MerchantRecord.clearance_cost)
        ).scalar() or 0
        
        # إجمالي السحوبات الخارجية
        total_withdrawals = db.session.query(func.sum(Withdrawal.amount)).scalar() or 0
        
        # إجمالي مصاريف الحدود
        total_border_expenses = db.session.query(func.sum(BorderExpense.amount)).scalar() or 0
        
        # الأرباح الصافية بعد السحوبات ومصاريف الحدود
        net_profit_after_withdrawals = float(total_gross_profit) - float(total_withdrawals) - float(total_border_expenses)
        
        # إجمالي الأرباح الموزعة على الشركاء
        total_distributed = db.session.query(
            func.sum(PartnerTransaction.amount)
        ).filter(PartnerTransaction.transaction_type == 'share').scalar() or 0
        
        # الأرباح المتاحة للتوزيع (الجديدة)
        available_for_distribution = max(0, net_profit_after_withdrawals - float(total_distributed))
        
        # تفاصيل توزيع كل شريك
        partners = Partner.query.filter_by(is_active=True).all()
        partner_details = []
        
        for partner in partners:
            # مجموع الأرباح الموزعة للشريك
            distributed_amount = db.session.query(
                func.sum(PartnerTransaction.amount)
            ).filter_by(
                partner_id=partner.id,
                transaction_type='share'
            ).scalar() or 0
            
            # حصة الشريك من الأرباح المتاحة الجديدة (بناءً على نسبته من مجموع النسب)
            total_active_percentage = sum(float(p.profit_percentage) for p in partners)
            if total_active_percentage > 0:
                new_share = (available_for_distribution * float(partner.profit_percentage)) / total_active_percentage
            else:
                new_share = 0
            
            # إجمالي السحوبات للشريك
            withdrawals = db.session.query(
                func.sum(PartnerTransaction.amount)
            ).filter_by(
                partner_id=partner.id,
                transaction_type='withdraw'
            ).scalar() or 0
            
            # إجمالي الإضافات للشريك
            additions = db.session.query(
                func.sum(PartnerTransaction.amount)
            ).filter_by(
                partner_id=partner.id,
                transaction_type='add'
            ).scalar() or 0
            
            # الرصيد الحالي
            current_balance = float(distributed_amount) + float(additions) - float(withdrawals)
            
            partner_details.append({
                'id': partner.id,
                'name': partner.name,
                'profit_percentage': float(partner.profit_percentage),
                'distributed_amount': float(distributed_amount),
                'new_share': float(new_share),
                'total_withdrawals': float(withdrawals),
                'total_additions': float(additions),
                'current_balance': current_balance
            })
        
        return jsonify({
            'success': True,
            'total_gross_profit': float(total_gross_profit),
            'total_withdrawals': float(total_withdrawals),
            'total_border_expenses': float(total_border_expenses),
            'net_profit_after_withdrawals': net_profit_after_withdrawals,
            'total_distributed': float(total_distributed),
            'available_for_distribution': available_for_distribution,
            'partners': partner_details,
            'distribution_percentage_check': sum(p['profit_percentage'] for p in partner_details)
        })
        
    except Exception as e:
        logger.error(f"خطأ في تقرير توزيع الأرباح: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/distribute_profits', methods=['POST'])
def distribute_profits():
    """توزيع الأرباح على الشركاء"""
    try:
        logger.info("تم استدعاء توزيع الأرباح")
        
        # التحقق من صحة البيانات المرسلة
        if not request.is_json:
            logger.error("البيانات المرسلة ليست JSON")
            return jsonify({'success': False, 'message': 'البيانات المرسلة غير صحيحة'})
            
        data = request.get_json()
        if not data:
            logger.error("لا توجد بيانات JSON")
            return jsonify({'success': False, 'message': 'لا توجد بيانات مرسلة'})
            
        logger.info(f"البيانات المستلمة: {data}")
        
        auto_calculate = data.get('auto_calculate', False)
        distribution_date = data.get('date')
        
        if not distribution_date:
            return jsonify({'success': False, 'message': 'التاريخ مطلوب'})
        
        if auto_calculate:
            # حساب الأرباح الصافية تلقائياً باستخدام النظام الجديد
            
            # حساب إجمالي أرباح التخليص
            clearance_profits = db.session.query(db.func.sum(MerchantRecord.clearance_cost)).scalar() or 0
            
            # حساب مصاريف الحدود
            border_expenses = db.session.query(db.func.sum(BorderExpense.amount)).scalar() or 0
            
            # حساب السحوبات الخارجية
            withdrawals = db.session.query(db.func.sum(Withdrawal.amount)).scalar() or 0
            
            # حساب الأرباح الموزعة مسبقاً
            distributed_profits = db.session.query(db.func.sum(PartnerTransaction.amount)).filter(
                PartnerTransaction.transaction_type == 'share'
            ).scalar() or 0
            
            # حساب الأرباح الصافية المتاحة للتوزيع
            net_profits = float(clearance_profits) - float(border_expenses) - float(withdrawals)
            profit_amount = net_profits - float(distributed_profits)
            
            logger.info(f"حساب الأرباح الجديد: clearance_profits={clearance_profits}, border_expenses={border_expenses}, withdrawals={withdrawals}, net_available={profit_amount}")
            
            if profit_amount <= 0:
                return jsonify({'success': False, 'message': f'لا توجد أرباح صافية متاحة للتوزيع. الأرباح: {clearance_profits}, المصاريف: {border_expenses}, السحوبات: {withdrawals}'})
            
            description = f'توزيع تلقائي للأرباح الصافية (${profit_amount:.2f})'
        else:
            profit_amount = float(data.get('profit_amount', 0))
            description = data.get('description', 'توزيع أرباح يدوي')
            
            if profit_amount <= 0:
                return jsonify({'success': False, 'message': 'مبلغ الأرباح يجب أن يكون أكبر من صفر'})
        
        partners = Partner.query.filter_by(is_active=True).all()
        
        if not partners:
            return jsonify({'success': False, 'message': 'لا توجد شركاء نشطون للتوزيع'})
        
        # حساب مجموع النسب الفعلي للشركاء
        total_percentage = sum(float(partner.profit_percentage) for partner in partners)
        
        # توزيع كامل المبلغ على الشركاء حسب نسبهم (دون ترك شيء للشركة)
        if total_percentage <= 0:
            return jsonify({'success': False, 'message': 'يجب أن تكون نسب الشركاء أكبر من صفر'})
        
        # توزيع الأرباح على الشركاء - توزيع كامل المبلغ حسب النسب
        total_distributed = 0
        for partner in partners:
            # حساب حصة الشريك من إجمالي المبلغ بناءً على نسبته من إجمالي النسب
            partner_share = profit_amount * (float(partner.profit_percentage) / total_percentage)
            total_distributed += partner_share
            
            transaction = PartnerTransaction(
                partner_id=partner.id,
                transaction_type='share',
                amount=partner_share,
                date=datetime.strptime(distribution_date, '%Y-%m-%d').date(),
                description=f"{description} - حصة {partner.name}",
                notes=f"نسبة {partner.profit_percentage}% من إجمالي النسب ({total_percentage}%) - من مبلغ ${profit_amount:.2f}"
            )
            
            db.session.add(transaction)
        
        # إذا كان التوزيع تلقائي، قم بإضافة المعاملة المعادلة في الخلفية
        if auto_calculate and total_distributed > 0:
            # حساب الفرق لمعادلة الأرباح (إذا كان هناك فائض)
            remaining_profit = profit_amount - total_distributed
            
            if remaining_profit > 0.01:  # إذا كان هناك فائض أكثر من سنت واحد
                # إضافة سحب خفي لمعادلة الفائض
                hidden_withdrawal = Withdrawal(
                    amount=remaining_profit,
                    date=datetime.strptime(distribution_date, '%Y-%m-%d').date(),
                    expense_type='نظام',
                    description='معادلة أرباح تلقائية',
                    notes='تم إنشاؤها تلقائياً بواسطة النظام لمعادلة الأرباح المتبقية'
                )
                db.session.add(hidden_withdrawal)
            
            # تحديد جميع السجلات الحالية كمؤرشفة
            MerchantRecord.query.filter_by(is_archived=False).update({'is_archived': True})
        
        db.session.commit()
        
        message = f'تم توزيع كامل المبلغ ${total_distributed:.2f} على {len(partners)} شركاء بنجاح (100% توزيع)'
        if auto_calculate:
            message += ' - توزيع تلقائي حسب الأرباح الصافية وتم تصفير الأرباح المتراكمة'
        
        return jsonify({
            'success': True, 
            'message': message,
            'total_distributed': total_distributed,
            'partners_count': len(partners),
            'auto_calculated': auto_calculate,
            'reset_completed': auto_calculate and total_distributed > 0
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في توزيع الأرباح: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في توزيع الأرباح: {str(e)}'})

def get_financial_stats():
    """حساب الإحصائيات المالية حسب النظام الجديد"""
    try:
        # إجمالي السجلات
        total_records = MerchantRecord.query.count()
        
        # === النظام الجديد: الحسابات المترابطة ===
        
        # 1. إجمالي ديون التجار = الأجور + السلف + كلفة التخليص
        total_merchant_debt = db.session.query(
            func.sum(MerchantRecord.fees + MerchantRecord.advance + MerchantRecord.clearance_cost)
        ).scalar() or 0
        
        # 2. حساب النبر (بين الحدين) = الأجور + السلف
        total_naber_account = db.session.query(
            func.sum(NaberAccount.total_amount)
        ).scalar() or 0
        
        # التحقق من التطابق مع البيانات الأساسية
        calculated_naber = db.session.query(
            func.sum(MerchantRecord.fees + MerchantRecord.advance)
        ).scalar() or 0
        
        # 3. إجمالي كلفة التخليص (مصدر الربح الرئيسي)
        total_clearance_cost = db.session.query(
            func.sum(MerchantRecord.clearance_cost)
        ).scalar() or 0
        
        # 4. مصاريف الحدود (من الجدول المخصص + من السجلات)
        border_expenses_table = db.session.query(func.sum(BorderExpense.amount)).scalar() or 0
        # حذف مراجع border_expenses من records - لا توجد الآن
        total_border_expenses = float(border_expenses_table)
        
        # 5. السحوبات الخارجية (باستثناء المعادلات التلقائية)
        total_withdrawals = db.session.query(func.sum(Withdrawal.amount)).filter(
            Withdrawal.expense_type != 'نظام'
        ).scalar() or 0
        
        # 6. إجمالي المدفوعات من التجار
        total_payments = db.session.query(func.sum(MerchantPayment.amount)).scalar() or 0
        
        # 6.1. إجمالي تسديدات النبر
        total_naber_payments = db.session.query(func.sum(NaberPayment.amount)).scalar() or 0
        
        # 7. الأرباح الموزعة على الشركاء
        total_distributed_profits = db.session.query(
            func.sum(PartnerTransaction.amount)
        ).filter(PartnerTransaction.transaction_type == 'share').scalar() or 0
        
        # === الحسابات النهائية حسب النظام الجديد ===
        
        # الأرباح الإجمالية من التخليص
        gross_profit_from_clearance = float(total_clearance_cost)
        
        # الأرباح الصافية = كلفة التخليص - مصاريف الحدود - السحوبات الخارجية
        net_profits = max(0, gross_profit_from_clearance - total_border_expenses - float(total_withdrawals))
        
        # إضافة debug logs لفهم المشكلة
        logger.info(f"حساب الأرباح: كلفة التخليص={gross_profit_from_clearance}, مصاريف الحدود={total_border_expenses}, السحوبات={float(total_withdrawals)}, النتيجة={net_profits}")
        
        # الأرباح المتاحة للتوزيع = الأرباح الصافية - الأرباح الموزعة
        available_profits = max(0, net_profits - float(total_distributed_profits))
        
        # الديون المتبقية على التجار = إجمالي الديون - المدفوعات - تسديدات النبر
        total_all_payments = float(total_payments) + float(total_naber_payments)
        remaining_merchant_debt = max(0, float(total_merchant_debt) - total_all_payments)
        
        # حساب رصيد النبر المتبقي
        naber_remaining_balance = max(0, float(calculated_naber) - float(total_naber_payments))
        
        return {
            'total_records': total_records,
            
            # الديون والمدفوعات
            'total_merchant_debt': remaining_merchant_debt,
            'total_payments': float(total_payments),
            'total_naber_payments': float(total_naber_payments),
            'total_all_payments': total_all_payments,
            'gross_merchant_debt': float(total_merchant_debt),
            
            # حساب النبر (بين الحدين)
            'naber_account_total': float(calculated_naber),
            'naber_remaining_balance': naber_remaining_balance,
            'total_wages_and_advances': float(calculated_naber),
            
            # الأرباح والتخليص
            'total_clearance_cost': float(total_clearance_cost),
            'gross_profit_from_clearance': gross_profit_from_clearance,
            'total_border_expenses': total_border_expenses,
            'total_withdrawals': float(total_withdrawals),
            
            # الأرباح النهائية
            'net_profits': net_profits,
            'available_profits': available_profits,
            'total_distributed_profits': float(total_distributed_profits),
            'final_net_profit': available_profits,
            'available_balance': available_profits,
            
            # معلومات إضافية للتحليل
            'profit_calculation': {
                'clearance_cost': float(total_clearance_cost),
                'minus_border_expenses': total_border_expenses,
                'minus_withdrawals': float(total_withdrawals),
                'equals_net_profit': net_profits
            }
        }
        
    except Exception as e:
        logger.error(f"خطأ في حساب الإحصائيات: {str(e)}")
        return {
            'total_records': 0,
            'total_merchant_debt': 0,
            'total_payments': 0,
            'gross_merchant_debt': 0,
            'naber_account_total': 0,
            'total_wages_and_advances': 0,
            'total_clearance_cost': 0,
            'gross_profit_from_clearance': 0,
            'total_border_expenses': 0,
            'total_withdrawals': 0,
            'net_profits': 0,
            'available_profits': 0,
            'total_distributed_profits': 0,
            'final_net_profit': 0,
            'available_balance': 0,
            'profit_calculation': {
                'clearance_cost': 0,
                'minus_border_expenses': 0,
                'minus_withdrawals': 0,
                'equals_net_profit': 0
            }
        }

@app.route('/manual_profit_distribution', methods=['POST'])
def manual_profit_distribution():
    """التوزيع اليدوي للأرباح على الشركاء"""
    try:
        data = request.get_json()
        distributions = data.get('distributions', [])
        date = data.get('date', datetime.now().date())
        description = data.get('description', 'توزيع يدوي للأرباح')
        notes = data.get('notes', '')
        
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        
        if not distributions:
            return jsonify({
                'success': False,
                'error': 'لا توجد توزيعات محددة'
            })
        
        total_distributed = 0
        created_transactions = []
        
        # معالجة كل توزيع
        for dist in distributions:
            partner_id = dist.get('partner_id')
            amount = float(dist.get('amount', 0))
            
            if amount <= 0:
                continue
            
            # التحقق من وجود الشريك
            partner = Partner.query.get(partner_id)
            if not partner:
                return jsonify({
                    'success': False,
                    'error': f'الشريك غير موجود (ID: {partner_id})'
                })
            
            # إنشاء معاملة التوزيع
            transaction = PartnerTransaction()
            transaction.partner_id = partner_id
            transaction.transaction_type = 'share'
            transaction.amount = amount
            transaction.date = date
            transaction.description = description
            transaction.notes = f'{notes} - توزيع يدوي لـ {partner.name}'
            
            db.session.add(transaction)
            created_transactions.append({
                'partner': partner.name,
                'amount': amount
            })
            total_distributed += amount
        
        if not created_transactions:
            return jsonify({
                'success': False,
                'error': 'لم يتم إنشاء أي معاملات توزيع'
            })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'تم التوزيع اليدوي بنجاح - المبلغ الإجمالي: ${total_distributed:.2f}',
            'total_distributed': total_distributed,
            'transactions_created': len(created_transactions),
            'details': created_transactions
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في التوزيع اليدوي: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'حدث خطأ في التوزيع اليدوي للأرباح'
        })

@app.route('/archive_and_distribute_profits', methods=['POST'])
@login_required
@can_view_profits
def archive_and_distribute_profits():
    """أرشفة الأرباح الحالية وتوزيعها مع تصفير المتراكم"""
    try:
        data = request.json
        method = data.get('method', 'auto')  # 'auto' or 'manual'
        distributions = data.get('distributions', [])
        notes = data.get('notes', '')
        
        # حساب الإحصائيات المالية الحالية
        stats = get_financial_stats()
        total_profit = float(stats['available_profits'])
        
        if total_profit <= 0:
            return jsonify({'success': False, 'message': 'لا توجد أرباح صافية متاحة للتوزيع'})
        
        # تحديد تاريخ بداية الفترة (آخر أرشفة أو بداية البيانات)
        last_archive = ProfitArchive.query.order_by(desc(ProfitArchive.archive_date)).first()
        if last_archive:
            period_start = last_archive.archive_date
        else:
            # إذا لم توجد أرشفة سابقة، استخدم تاريخ أول سجل
            first_record = MerchantRecord.query.order_by(MerchantRecord.date).first()
            period_start = first_record.date if first_record else date.today()
        
        # إنشاء سجل الأرشيف الرئيسي
        archive = ProfitArchive()
        archive.archive_date = date.today()
        archive.period_start = period_start
        archive.period_end = date.today()
        archive.total_profit = total_profit
        archive.total_distributed = 0  # تهيئة بالصفر
        archive.distribution_method = method
        archive.notes = notes
        archive.created_by = current_user.id
        
        db.session.add(archive)
        db.session.flush()  # للحصول على ID
        
        total_distributed = 0
        
        if method == 'auto':
            # التوزيع التلقائي حسب النسب
            partners = Partner.query.filter_by(is_active=True).all()
            
            for partner in partners:
                if partner.profit_percentage > 0:
                    amount = (float(total_profit) * float(partner.profit_percentage)) / 100
                    
                    # إضافة تفاصيل الأرشيف
                    detail = ProfitArchiveDetail()
                    detail.archive_id = archive.id
                    detail.partner_id = partner.id
                    detail.partner_name = partner.name
                    detail.percentage = partner.profit_percentage
                    detail.amount_distributed = amount
                    
                    db.session.add(detail)
                    
                    # إضافة المعاملة للشريك
                    transaction = PartnerTransaction()
                    transaction.partner_id = partner.id
                    transaction.transaction_type = 'share'
                    transaction.amount = amount
                    transaction.date = date.today()
                    transaction.description = f'نصيب من الأرباح - الفترة ({period_start} إلى {date.today()})'
                    transaction.notes = f'توزيع تلقائي من أرشيف رقم {archive.id}'
                    
                    db.session.add(transaction)
                    total_distributed += amount
                    
        else:  # manual
            # التوزيع اليدوي
            for dist in distributions:
                partner_id = dist.get('partner_id')
                amount = float(dist.get('amount', 0))
                
                if amount <= 0:
                    continue
                    
                partner = Partner.query.get(partner_id)
                if not partner:
                    continue
                
                # إضافة تفاصيل الأرشيف
                detail = ProfitArchiveDetail()
                detail.archive_id = archive.id
                detail.partner_id = partner.id
                detail.partner_name = partner.name
                detail.percentage = 0  # يدوي بدون نسبة محددة
                detail.amount_distributed = amount
                
                db.session.add(detail)
                
                # إضافة المعاملة للشريك
                transaction = PartnerTransaction()
                transaction.partner_id = partner.id
                transaction.transaction_type = 'share'
                transaction.amount = amount
                transaction.date = date.today()
                transaction.description = f'نصيب من الأرباح - الفترة ({period_start} إلى {date.today()})'
                transaction.notes = f'توزيع يدوي من أرشيف رقم {archive.id}'
                
                db.session.add(transaction)
                total_distributed += amount
        
        # حساب الفرق وإضافة معادلة خفية إذا لزم الأمر
        remaining_profit = total_profit - total_distributed
        if remaining_profit > 0.01:  # إذا كان هناك فائض أكثر من سنت واحد
            # إضافة سحب خفي لمعادلة الفائض
            hidden_withdrawal = Withdrawal(
                amount=remaining_profit,
                date=date.today(),
                expense_type='نظام',
                description='معادلة أرباح تلقائية - أرشفة',
                notes='تم إنشاؤها تلقائياً بواسطة النظام لمعادلة الأرباح المتبقية عند الأرشفة'
            )
            db.session.add(hidden_withdrawal)
            db.session.flush()  # للتأكد من إضافة السحب قبل الأرشفة
        
        # تحديث إجمالي المبلغ الموزع في الأرشيف
        archive.total_distributed = total_distributed
        
        # أرشفة السحوبات الحالية (بما في ذلك المعادلة الخفية)
        current_withdrawals = Withdrawal.query.all()
        for withdrawal in current_withdrawals:
            withdrawal_archive = WithdrawalArchive(
                original_withdrawal_id=withdrawal.id,
                amount=withdrawal.amount,
                date=withdrawal.date,
                expense_type=withdrawal.expense_type,
                description=withdrawal.description,
                notes=withdrawal.notes,
                archived_by=current_user.id,
                archive_reason='توزيع الأرباح',
                profit_distribution_id=archive.id,
                created_at=withdrawal.created_at
            )
            db.session.add(withdrawal_archive)
        
        # أرشفة مصروفات الحدود الحالية
        current_border_expenses = BorderExpense.query.all()
        for expense in current_border_expenses:
            expense_archive = BorderExpenseArchive(
                original_expense_id=expense.id,
                amount=expense.amount,
                date=expense.date,
                description=expense.description,
                notes=expense.notes,
                archived_by=current_user.id,
                archive_reason='توزيع الأرباح',
                profit_distribution_id=archive.id,
                created_at=expense.created_at
            )
            db.session.add(expense_archive)
        
        # حذف السحوبات والمصروفات من الجداول الرئيسية بعد الأرشفة
        Withdrawal.query.delete()
        BorderExpense.query.delete()
        
        # تحديد جميع السجلات الحالية كمؤرشفة
        MerchantRecord.query.filter_by(is_archived=False).update({'is_archived': True})
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'تم أرشفة وتوزيع ${total_distributed:.2f} بنجاح. الأرباح الجديدة ستبدأ من الصفر.',
            'archive_id': archive.id,
            'total_distributed': float(total_distributed),
            'reset_completed': True
        })
        
    except Exception as e:
        logging.error(f"خطأ في أرشفة وتوزيع الأرباح: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})

@app.route('/get_profit_archives')
@login_required
@can_view_profits
def get_profit_archives():
    """جلب قائمة أرشيف الأرباح"""
    try:
        archives = ProfitArchive.query.order_by(desc(ProfitArchive.archive_date)).all()
        
        archives_data = []
        for archive in archives:
            archives_data.append({
                'id': archive.id,
                'archive_date': archive.archive_date.strftime('%Y-%m-%d'),
                'period_start': archive.period_start.strftime('%Y-%m-%d'),
                'period_end': archive.period_end.strftime('%Y-%m-%d'),
                'total_profit': float(archive.total_profit),
                'total_distributed': float(archive.total_distributed),
                'distribution_method': 'تلقائي' if archive.distribution_method == 'auto' else 'يدوي',
                'notes': archive.notes or '',
                'created_at': archive.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        return jsonify(archives_data)
        
    except Exception as e:
        logging.error(f"خطأ في جلب أرشيف الأرباح: {e}")
        return jsonify([])

@app.route('/get_archive_details/<int:archive_id>')
@login_required
@can_view_profits
def get_archive_details(archive_id):
    """جلب تفاصيل أرشيف معين مع معلومات المعاملات الخاصة"""
    try:
        archive = ProfitArchive.query.get(archive_id)
        if not archive:
            return jsonify({'error': 'لم يتم العثور على الأرشيف المطلوب'})
            
        details = ProfitArchiveDetail.query.filter_by(archive_id=archive_id).all()
        
        # جلب المصروفات والسحوبات المرتبطة بهذا التوزيع
        archived_withdrawals = WithdrawalArchive.query.filter_by(profit_distribution_id=archive_id).all()
        archived_expenses = BorderExpenseArchive.query.filter_by(profit_distribution_id=archive_id).all()
        
        details_data = []
        for detail in details:
            # جلب معاملات الشريك (إضافات وسحوبات) حتى تاريخ التوزيع
            partner_transactions = PartnerTransaction.query.filter(
                PartnerTransaction.partner_id == detail.partner_id,
                PartnerTransaction.date <= archive.archive_date
            ).order_by(PartnerTransaction.date.desc()).all()
            
            # حساب إجمالي السحوبات والإضافات
            total_withdrawals = sum(float(t.amount) for t in partner_transactions if t.transaction_type == 'withdraw')
            total_additions = sum(float(t.amount) for t in partner_transactions if t.transaction_type == 'add')
            
            # حساب المبلغ النهائي بعد خصم السحوبات والإضافات
            net_amount = float(detail.amount_distributed) - total_withdrawals + total_additions
            
            # آخر 3 معاملات للشريك
            recent_transactions = []
            for trans in partner_transactions[:3]:
                recent_transactions.append({
                    'date': trans.date.strftime('%Y-%m-%d'),
                    'type': 'سحب' if trans.transaction_type == 'withdraw' else 'إضافة' if trans.transaction_type == 'add' else 'حصة',
                    'amount': float(trans.amount),
                    'description': trans.description or ''
                })
            
            details_data.append({
                'partner_id': detail.partner_id,
                'partner_name': detail.partner_name,
                'percentage': float(detail.percentage) if detail.percentage and detail.percentage > 0 else 'يدوي',
                'amount_distributed': float(detail.amount_distributed),
                'total_withdrawals': total_withdrawals,
                'total_additions': total_additions,
                'net_amount': net_amount,
                'has_transactions': len(partner_transactions) > 0,
                'recent_transactions': recent_transactions,
                'transactions_count': len(partner_transactions)
            })
        
        return jsonify({
            'success': True,
            'archive': {
                'id': archive.id,
                'archive_date': archive.archive_date.strftime('%Y-%m-%d'),
                'period_start': archive.period_start.strftime('%Y-%m-%d'),
                'period_end': archive.period_end.strftime('%Y-%m-%d'),
                'total_profit': float(archive.total_profit),
                'total_distributed': float(archive.total_distributed),
                'distribution_method': 'تلقائي' if archive.distribution_method == 'auto' else 'يدوي',
                'notes': archive.notes or ''
            },
            'details': details_data,
            'archived_expenses': {
                'withdrawals': [{'amount': float(w.amount), 'description': w.description, 'date': w.date.strftime('%Y-%m-%d')} for w in archived_withdrawals],
                'border_expenses': [{'amount': float(e.amount), 'description': e.description, 'date': e.date.strftime('%Y-%m-%d')} for e in archived_expenses]
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في جلب تفاصيل الأرشيف {archive_id}: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/save_border_expense', methods=['POST'])
@login_required
def save_border_expense():
    """حفظ مصاريف الحدود"""
    try:
        data = request.get_json()
        logger.info(f"Received border expense data: {data}")
        
        if not data:
            return jsonify({'success': False, 'message': 'لم يتم استلام البيانات'})
        
        amount = data.get('amount')
        date_str = data.get('date')
        
        if not amount or float(amount) <= 0:
            return jsonify({'success': False, 'message': 'يرجى إدخال مبلغ صحيح'})
        
        if not date_str:
            return jsonify({'success': False, 'message': 'يرجى إدخال التاريخ'})
        
        border_expense = BorderExpense()
        border_expense.amount = float(amount)
        border_expense.date = datetime.strptime(date_str, '%Y-%m-%d').date()
        border_expense.description = data.get('description', '')
        border_expense.notes = data.get('notes', '')
        
        db.session.add(border_expense)
        db.session.commit()
        
        logger.info(f"Border expense saved successfully: {border_expense.id}")
        return jsonify({'success': True, 'message': 'تم حفظ مصاريف الحدود بنجاح'})
        
    except ValueError as e:
        db.session.rollback()
        logger.error(f"خطأ في تحويل البيانات: {str(e)}")
        return jsonify({'success': False, 'message': 'خطأ في صيغة البيانات المدخلة'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حفظ مصاريف الحدود: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في حفظ المصروف: {str(e)}'})

@app.route('/get_border_expenses')
@login_required
def get_border_expenses():
    """الحصول على مصاريف الحدود"""
    try:
        expenses = BorderExpense.query.order_by(desc(BorderExpense.created_at)).all()
        
        expenses_data = {
            'expenses': [],
            'total_amount': 0
        }
        
        total_amount = 0
        for expense in expenses:
            total_amount += float(expense.amount)
            expenses_data['expenses'].append({
                'id': expense.id,
                'amount': float(expense.amount),
                'date': expense.date.strftime('%Y-%m-%d'),
                'description': expense.description or '',
                'notes': expense.notes or '',
                'created_at': expense.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        expenses_data['total_amount'] = total_amount
        
        return jsonify(expenses_data)
        
    except Exception as e:
        logger.error(f"خطأ في تحميل مصاريف الحدود: {str(e)}")
        return jsonify([])

@app.route('/get_profits_report')
@can_view_profits
def get_profits_report():
    """تقرير الأرباح المفصل"""
    try:
        # حساب إجمالي كلفة التخليص
        total_clearance_cost = db.session.query(
            func.sum(MerchantRecord.clearance_cost)
        ).filter(MerchantRecord.is_archived == False).scalar() or 0
        
        # حساب إجمالي مصاريف الحدود من الجدول المخصص
        total_border_expenses = db.session.query(func.sum(BorderExpense.amount)).scalar() or 0
        
        # إجمالي السحوبات الخارجية
        total_withdrawals = db.session.query(func.sum(Withdrawal.amount)).scalar() or 0
        
        # إجمالي الأرباح الموزعة على الشركاء
        total_distributed_profits = db.session.query(
            func.sum(PartnerTransaction.amount)
        ).filter(PartnerTransaction.transaction_type == 'share').scalar() or 0
        
        # صافي الأرباح = كلفة التخليص - مصاريف الحدود - السحوبات الخارجية
        net_profits = float(total_clearance_cost) - float(total_border_expenses) - float(total_withdrawals)
        
        # صافي الربح النهائي = صافي الأرباح - الأرباح الموزعة
        final_net_profit = net_profits - float(total_distributed_profits)
        
        # تفاصيل التجار
        merchants_profits = db.session.query(
            MerchantRecord.recipient_merchant.label('merchant_name'),
            func.sum(MerchantRecord.clearance_cost).label('total_clearance')
        ).filter(
            MerchantRecord.is_archived == False
        ).group_by(MerchantRecord.recipient_merchant).all()
        
        merchants_data = []
        for merchant in merchants_profits:
            # الآن مصاريف الحدود عامة وليست مرتبطة بتاجر معين
            # صافي ربح التاجر = كلفة التخليص فقط (مصاريف الحدود تُخصم من إجمالي الأرباح)
            merchant_net_profit = float(merchant.total_clearance)
            
            merchants_data.append({
                'merchant_name': merchant.merchant_name,
                'total_clearance_cost': float(merchant.total_clearance),
                'border_expenses': 0,  # مصاريف الحدود عامة وليست مرتبطة بتاجر معين
                'net_profit': merchant_net_profit
            })
        
        # تفاصيل السحوبات
        withdrawals = Withdrawal.query.order_by(desc(Withdrawal.date)).all()
        withdrawals_data = []
        for withdrawal in withdrawals:
            withdrawals_data.append({
                'id': withdrawal.id,
                'date': withdrawal.date.strftime('%Y-%m-%d'),
                'amount': float(withdrawal.amount),
                'expense_type': withdrawal.expense_type or 'عام',
                'description': withdrawal.description or '',
                'notes': withdrawal.notes or ''
            })
        
        return jsonify({
            'total_clearance_cost': float(total_clearance_cost),
            'total_border_expenses': float(total_border_expenses),
            'total_withdrawals': float(total_withdrawals),
            'total_distributed_profits': float(total_distributed_profits),
            'net_profits': net_profits,
            'final_net_profit': final_net_profit,
            'merchants_data': merchants_data,
            'withdrawals_data': withdrawals_data
        })
        
    except Exception as e:
        logger.error(f"خطأ في تقرير الأرباح: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_merchant_statement_detailed/<merchant_name>')
@login_required
def get_merchant_statement_detailed(merchant_name):
    """كشف حساب مفصل للتاجر (بدون أرباح)"""
    try:
        # الحصول على معاملات التاجر
        transactions = MerchantRecord.query.filter_by(
            recipient_merchant=merchant_name
        ).order_by(desc(MerchantRecord.date)).all()
        
        # الحصول على مدفوعات التاجر
        payments = MerchantPayment.query.filter_by(
            merchant_name=merchant_name
        ).order_by(desc(MerchantPayment.payment_date)).all()
        
        # حساب الإحصائيات (بدون عرض الأرباح)
        total_wages = sum(float(t.fees or 0) for t in transactions)
        total_advance = sum(float(t.advance or 0) for t in transactions)
        total_clearance = sum(float(t.clearance_cost or 0) for t in transactions)
        total_debt = total_wages + total_advance + total_clearance
        total_payments = sum(float(p.amount) for p in payments)
        current_balance = total_debt - total_payments
        
        # تفاصيل المعاملات مع جميع الحقول
        transactions_data = []
        for t in transactions:
            transactions_data.append({
                'id': t.id,
                'date': t.date.strftime('%Y-%m-%d'),
                'sender_merchant': t.sender_merchant or '',
                'recipient_merchant': t.recipient_merchant or '',
                'foreign_driver': t.foreign_driver or '',
                'foreign_car': t.foreign_car or '',
                'local_driver': t.local_driver or '',
                'local_car': t.local_car or '',
                'goods_type': t.goods_type or '',
                'fees': float(t.fees or 0),
                'advance': float(t.advance or 0),
                'clearance_cost': float(t.clearance_cost or 0),
                'total_debt': float(t.total_debt or 0),
                'notes': t.notes or ''
            })
        
        # تفاصيل المدفوعات
        payments_data = []
        for p in payments:
            payments_data.append({
                'date': p.payment_date.strftime('%Y-%m-%d'),
                'amount': float(p.amount),
                'notes': p.notes or ''
            })
        
        return jsonify({
            'success': True,
            'merchant_name': merchant_name,
            'records': transactions_data,
            'payments': payments_data,
            'summary': {
                'total_wages': total_wages,
                'total_advance': total_advance,
                'total_clearance': total_clearance,
                'total_debt': total_debt,
                'total_payments': total_payments,
                'current_balance': current_balance,
                'transaction_count': len(transactions_data)
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في كشف حساب التاجر: {str(e)}")
        return jsonify({'error': str(e)}), 500







@app.route('/get_wages_summary')
@can_view_profits
def get_wages_summary():
    """ملخص الأجور مع الإضافات والإرجاعات"""
    try:
        # حساب إجمالي الأجور والسلف
        total_wages = db.session.query(func.sum(MerchantRecord.fees)).scalar() or 0
        total_advances = db.session.query(func.sum(MerchantRecord.advance)).scalar() or 0
        
        # الأجور النهائية
        final_wages = float(total_wages) + float(total_advances)
        
        # تفاصيل التجار مع أجورهم
        merchants_wages = db.session.query(
            MerchantRecord.recipient_merchant,
            func.sum(MerchantRecord.fees).label('total_wages'),
            func.sum(MerchantRecord.advance).label('total_advances')
        ).group_by(MerchantRecord.recipient_merchant).all()
        
        merchants_data = []
        for merchant in merchants_wages:
            merchant_wages = float(merchant.total_wages or 0) + float(merchant.total_advances or 0)
            merchants_data.append({
                'merchant_name': merchant.recipient_merchant,
                'total_wages': float(merchant.total_wages or 0),
                'total_advances': float(merchant.total_advances or 0),
                'total_additions': 0.0,
                'total_returns': 0.0,
                'final_wages': merchant_wages
            })
        
        return jsonify({
            'total_wages': float(total_wages),
            'total_advances': float(total_advances),
            'total_additions': 0.0,
            'total_returns': 0.0,
            'final_wages': final_wages,
            'merchants_data': merchants_data
        })
        
    except Exception as e:
        logger.error(f"خطأ في ملخص الأجور: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/distribute_net_profits_auto', methods=['POST'])
@admin_required
def distribute_net_profits_auto():
    """توزيع الأرباح الصافية تلقائياً مع الأرشفة"""
    try:
        # حساب الأرباح الصافية
        stats = get_financial_stats()
        net_profit = stats.get('available_profits', 0)
        
        if net_profit <= 0:
            return jsonify({'success': False, 'message': 'لا توجد أرباح صافية متاحة للتوزيع'})
        
        # جلب الشركاء النشطين
        partners = Partner.query.filter_by(is_active=True).all()
        if not partners:
            return jsonify({'success': False, 'message': 'لا يوجد شركاء مفعلون'})
        
        # إنشاء أرشيف للأرباح الحالية
        today = datetime.now().date()
        earliest_record = MerchantRecord.query.order_by(MerchantRecord.date.asc()).first()
        period_start = earliest_record.date if earliest_record else today
        
        archive = ProfitArchive(
            archive_date=today,
            period_start=period_start,
            period_end=today,
            total_profit=net_profit,
            total_distributed=net_profit,
            distribution_method='auto',
            notes='توزيع تلقائي للأرباح الصافية مع أرشفة السحوبات ومصاريف الحدود',
            created_by=current_user.id
        )
        db.session.add(archive)
        db.session.flush()  # للحصول على معرف الأرشيف
        
        # أرشفة السحوبات الخارجية ونقلها للأرشيف
        withdrawals = Withdrawal.query.all()
        for withdrawal in withdrawals:
            # إنشاء نسخة أرشيف
            withdrawal_archive = WithdrawalArchive(
                original_withdrawal_id=withdrawal.id,
                amount=withdrawal.amount,
                date=withdrawal.date,
                expense_type=withdrawal.expense_type,
                description=withdrawal.description,
                notes=withdrawal.notes,
                archived_by=current_user.id,
                archive_reason='أرشفة تلقائية عند توزيع الأرباح',
                profit_distribution_id=archive.id
            )
            db.session.add(withdrawal_archive)
        
        # حذف السحوبات من الجدول الرئيسي
        Withdrawal.query.delete()
        
        # أرشفة مصاريف الحدود ونقلها للأرشيف
        border_expenses = BorderExpense.query.all()
        for expense in border_expenses:
            # إنشاء نسخة أرشيف
            expense_archive = BorderExpenseArchive(
                original_expense_id=expense.id,
                amount=expense.amount,
                date=expense.date,
                description=expense.description,
                notes=expense.notes,
                archived_by=current_user.id,
                archive_reason='أرشفة تلقائية عند توزيع الأرباح',
                profit_distribution_id=archive.id
            )
            db.session.add(expense_archive)
        
        # حذف مصاريف الحدود من الجدول الرئيسي
        BorderExpense.query.delete()
        
        # توزيع الأرباح على الشركاء
        total_percentage = sum(float(partner.profit_percentage) for partner in partners)
        distributed_count = 0
        
        for partner in partners:
            if partner.profit_percentage > 0:
                share_amount = (float(net_profit) * float(partner.profit_percentage)) / total_percentage
                
                # لا توجد سحوبات مرتبطة بالشركاء (السحوبات الخارجية الآن مصاريف عامة)
                final_amount = share_amount
                
                # إضافة معاملة للشريك
                transaction = PartnerTransaction(
                    partner_id=partner.id,
                    transaction_type='share',
                    amount=share_amount,
                    date=today,
                    description=f'توزيع أرباح صافية تلقائي - أرشيف #{archive.id}',
                    notes=f'نسبة {partner.profit_percentage}% من إجمالي ${net_profit:.2f}'
                )
                db.session.add(transaction)
                
                # حساب المبلغ الصافي (نفس المبلغ الأصلي لأن السحوبات الخارجية مصاريف عامة)
                net_amount = share_amount
                
                # إضافة تفاصيل الأرشيف
                archive_detail = ProfitArchiveDetail(
                    archive_id=archive.id,
                    partner_id=partner.id,
                    partner_name=partner.name,
                    percentage=partner.profit_percentage,
                    amount_distributed=share_amount,
                    withdrawals_deducted=0,  # لا توجد سحوبات مرتبطة بالشركاء
                    net_amount=net_amount
                )
                db.session.add(archive_detail)
                distributed_count += 1
        
        # تصفير الأرباح بإضافة مصاريف حدود تعادل الأرباح الصافية
        border_expense = BorderExpense(
            amount=net_profit,
            date=today,
            description=f'تصفير الأرباح بعد التوزيع التلقائي - أرشيف #{archive.id}'
        )
        db.session.add(border_expense)
        
        db.session.commit()
        
        logger.info(f"تم توزيع الأرباح الصافية تلقائياً: ${net_profit:.2f} على {distributed_count} شريك")
        
        return jsonify({
            'success': True,
            'total_distributed': float(net_profit),
            'partners_count': distributed_count,
            'archive_id': archive.id
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في توزيع الأرباح الصافية: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})

@app.route('/distribute_net_profits_manual', methods=['POST'])
@admin_required
def distribute_net_profits_manual():
    """توزيع الأرباح الصافية يدوياً مع الأرشفة"""
    try:
        data = request.get_json()
        distributions = data.get('distributions', [])
        
        if not distributions:
            return jsonify({'success': False, 'message': 'لم يتم تحديد توزيعات'})
        
        total_amount = sum(dist.get('amount', 0) for dist in distributions)
        if total_amount <= 0:
            return jsonify({'success': False, 'message': 'المبلغ الإجمالي للتوزيع يجب أن يكون أكبر من صفر'})
        
        # التحقق من الأرباح المتاحة
        stats = get_financial_stats()
        available_profit = stats.get('net_profit', 0)
        
        if total_amount > available_profit:
            return jsonify({'success': False, 'message': f'المبلغ المراد توزيعه (${total_amount:.2f}) أكبر من الأرباح المتاحة (${available_profit:.2f})'})
        
        # إنشاء أرشيف للتوزيع
        today = datetime.now().date()
        earliest_record = MerchantRecord.query.order_by(MerchantRecord.date.asc()).first()
        period_start = earliest_record.date if earliest_record else today
        
        archive = ProfitArchive(
            archive_date=today,
            period_start=period_start,
            period_end=today,
            total_profit=available_profit,
            total_distributed=total_amount,
            distribution_method='manual',
            notes='توزيع يدوي للأرباح الصافية مع أرشفة السحوبات ومصاريف الحدود',
            created_by=current_user.id
        )
        db.session.add(archive)
        db.session.flush()
        
        # أرشفة السحوبات الخارجية ونقلها للأرشيف
        withdrawals = Withdrawal.query.all()
        for withdrawal in withdrawals:
            withdrawal_archive = WithdrawalArchive(
                original_withdrawal_id=withdrawal.id,
                amount=withdrawal.amount,
                date=withdrawal.date,
                expense_type=withdrawal.expense_type,
                description=withdrawal.description,
                notes=withdrawal.notes,
                archived_by=current_user.id,
                archive_reason='أرشفة تلقائية عند التوزيع اليدوي للأرباح',
                profit_distribution_id=archive.id
            )
            db.session.add(withdrawal_archive)
        
        # حذف السحوبات من الجدول الرئيسي
        Withdrawal.query.delete()
        
        # أرشفة مصاريف الحدود ونقلها للأرشيف
        border_expenses = BorderExpense.query.all()
        for expense in border_expenses:
            expense_archive = BorderExpenseArchive(
                original_expense_id=expense.id,
                amount=expense.amount,
                date=expense.date,
                description=expense.description,
                notes=expense.notes,
                archived_by=current_user.id,
                archive_reason='أرشفة تلقائية عند التوزيع اليدوي للأرباح',
                profit_distribution_id=archive.id
            )
            db.session.add(expense_archive)
        
        # حذف مصاريف الحدود من الجدول الرئيسي
        BorderExpense.query.delete()
        
        # تطبيق التوزيعات
        distributed_count = 0
        for dist in distributions:
            partner_id = dist.get('partner_id')
            amount = float(dist.get('amount', 0))
            
            if amount > 0:
                partner = Partner.query.get(partner_id)
                if partner:
                    # إضافة معاملة للشريك
                    transaction = PartnerTransaction(
                        partner_id=partner.id,
                        transaction_type='share',
                        amount=amount,
                        date=today,
                        description=f'توزيع أرباح صافية يدوي - أرشيف #{archive.id}',
                        notes=f'توزيع مخصص بمبلغ ${amount:.2f}'
                    )
                    db.session.add(transaction)
                    
                    # المبلغ الصافي نفس المبلغ الأصلي (السحوبات الخارجية مصاريف عامة)
                    net_amount = amount
                    
                    # إضافة تفاصيل الأرشيف
                    archive_detail = ProfitArchiveDetail(
                        archive_id=archive.id,
                        partner_id=partner.id,
                        partner_name=partner.name,
                        percentage=0,  # يدوي، لا توجد نسبة محددة
                        amount_distributed=amount,
                        withdrawals_deducted=0,  # لا توجد سحوبات مرتبطة بالشركاء
                        net_amount=net_amount
                    )
                    db.session.add(archive_detail)
                    distributed_count += 1
        
        # تصفير المبلغ الموزع بإضافة مصاريف حدود
        border_expense = BorderExpense(
            amount=total_amount,
            date=today,
            description=f'تصفير الأرباح بعد التوزيع اليدوي - أرشيف #{archive.id}'
        )
        db.session.add(border_expense)
        
        db.session.commit()
        
        logger.info(f"تم توزيع الأرباح الصافية يدوياً: ${total_amount:.2f} على {distributed_count} شريك")
        
        return jsonify({
            'success': True,
            'total_distributed': float(total_amount),
            'partners_count': distributed_count,
            'archive_id': archive.id
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في التوزيع اليدوي: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})

@app.route('/get_naber_account')
@login_required
def get_naber_account():
    """الحصول على بيانات حساب النبر"""
    try:
        # جلب سجلات النبر الموجودة فقط - بدون حذف أو إعادة إنشاء
        naber_entries = NaberAccount.query.order_by(desc(NaberAccount.date)).all()
        
        entries_data = []
        total_fees = 0
        total_advances = 0
        total_profits = 0
        
        for entry in naber_entries:
            fees_amount = float(entry.fees_amount)
            advance_amount = float(entry.advance_amount)
            total_amount = float(entry.total_amount)
            
            entries_data.append({
                'id': entry.id,
                'record_id': entry.record_id,
                'merchant_name': entry.merchant_name,
                'fees_amount': fees_amount,
                'advance_amount': advance_amount,
                'profit_amount': 0,  # النبر لا يحتوي على أرباح
                'total_amount': total_amount,
                'date': entry.date.strftime('%Y-%m-%d'),
                'created_at': entry.created_at.strftime('%Y-%m-%d %H:%M')
            })
            
            total_fees += fees_amount
            total_advances += advance_amount
        
        # حساب إجمالي التسديدات
        total_payments = float(db.session.query(func.sum(NaberPayment.amount)).scalar() or 0)
        
        # حساب الرصيد المتبقي (الدين المستحق)
        total_dues = total_fees + total_advances + total_profits
        remaining_balance = total_dues - total_payments
        
        logger.info(f"Returning {len(entries_data)} naber entries")
        
        return jsonify({
            'success': True,
            'entries': entries_data,
            'summary': {
                'total_fees': total_fees,
                'total_advances': total_advances,
                'total_profits': total_profits,
                'total_amount': total_dues,
                'total_payments': total_payments,
                'remaining_balance': remaining_balance,
                'entries_count': len(entries_data)
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في جلب بيانات حساب النبر: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في جلب البيانات: {str(e)}'})

@app.route('/get_merchant_detailed_statement')
@login_required
def get_merchant_detailed_statement():
    """كشف حساب مفصل للتاجر مع فلترة بالتاريخ ونوع التقرير"""
    try:
        merchant_name = request.args.get('merchant_name')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        report_type = request.args.get('report_type', 'custom')  # daily, weekly, monthly, yearly, custom
        
        if not merchant_name:
            return jsonify({'success': False, 'message': 'اسم التاجر مطلوب'})
        
        # تحديد الفترة حسب نوع التقرير
        from datetime import datetime, timedelta
        today = date.today()
        
        if report_type == 'daily':
            date_from = today.strftime('%Y-%m-%d')
            date_to = today.strftime('%Y-%m-%d')
        elif report_type == 'weekly':
            start_week = today - timedelta(days=today.weekday())
            date_from = start_week.strftime('%Y-%m-%d')
            date_to = today.strftime('%Y-%m-%d')
        elif report_type == 'monthly':
            date_from = today.replace(day=1).strftime('%Y-%m-%d')
            date_to = today.strftime('%Y-%m-%d')
        elif report_type == 'yearly':
            date_from = today.replace(month=1, day=1).strftime('%Y-%m-%d')
            date_to = today.strftime('%Y-%m-%d')
        
        # بناء الاستعلام
        query = MerchantRecord.query.filter_by(recipient_merchant=merchant_name)
        
        if date_from:
            query = query.filter(MerchantRecord.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
        if date_to:
            query = query.filter(MerchantRecord.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
        
        records = query.order_by(desc(MerchantRecord.date)).all()
        
        # بيانات السجلات
        records_data = []
        total_debt = 0
        total_naber = 0
        total_clearance = 0
        
        for record in records:
            record_data = {
                'id': record.id,
                'date': record.date.strftime('%Y-%m-%d'),
                'foreign_driver': record.foreign_driver or '',
                'foreign_car': record.foreign_car or '',
                'local_driver': record.local_driver or '',
                'local_car': record.local_car or '',
                'goods_type': record.goods_type or '',
                'fees': float(record.fees or 0),
                'advance': float(record.advance or 0),
                'clearance_cost': float(record.clearance_cost or 0),
                'sender_merchant': record.sender_merchant or '',
                'total_debt': float(record.total_debt or 0),
                'notes': record.notes or ''
            }
            records_data.append(record_data)
            
            total_debt += float(record.total_debt or 0)
            total_naber += float(record.fees or 0) + float(record.advance or 0)  # النبر = أجور + سلف
            total_clearance += float(record.clearance_cost or 0)  # التخليص
        
        # بيانات المدفوعات في الفترة
        payments_query = MerchantPayment.query.filter_by(merchant_name=merchant_name)
        if date_from:
            payments_query = payments_query.filter(MerchantPayment.payment_date >= datetime.strptime(date_from, '%Y-%m-%d').date())
        if date_to:
            payments_query = payments_query.filter(MerchantPayment.payment_date <= datetime.strptime(date_to, '%Y-%m-%d').date())
        
        payments = payments_query.order_by(desc(MerchantPayment.payment_date)).all()
        
        payments_data = []
        total_payments = 0
        
        for payment in payments:
            payment_data = {
                'id': payment.id,
                'amount': float(payment.amount),
                'payment_date': payment.payment_date.strftime('%Y-%m-%d'),
                'balance_before': float(payment.balance_before or 0),
                'balance_after': float(payment.balance_after or 0),
                'notes': payment.notes or '',
                'created_at': payment.created_at.strftime('%Y-%m-%d %H:%M')
            }
            payments_data.append(payment_data)
            total_payments += float(payment.amount)
        
        # الرصيد النهائي
        final_balance = total_debt - total_payments
        
        return jsonify({
            'success': True,
            'merchant_name': merchant_name,
            'period': {
                'from': date_from,
                'to': date_to,
                'type': report_type
            },
            'records': records_data,
            'payments': payments_data,
            'summary': {
                'total_debt': total_debt,
                'total_naber_account': total_naber,
                'total_clearance': total_clearance,
                'total_payments': total_payments,
                'final_balance': final_balance,
                'records_count': len(records_data),
                'payments_count': len(payments_data)
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في كشف حساب التاجر: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})

@app.route('/get_comprehensive_profit_report')
@can_view_profits
def get_comprehensive_profit_report():
    """تقرير شامل للأرباح الموزعة"""
    try:
        # الوضع الحالي للأرباح
        stats = get_financial_stats()
        
        # جميع الأرشيفات
        archives = ProfitArchive.query.order_by(ProfitArchive.archive_date.desc()).all()
        
        archives_data = []
        for archive in archives:
            # جلب تفاصيل التوزيع للأرشيف
            details = ProfitArchiveDetail.query.filter_by(archive_id=archive.id).all()
            details_data = []
            total_withdrawals_deducted = 0
            total_net_amount = 0
            
            for detail in details:
                withdrawals = float(detail.withdrawals_deducted or 0)
                net = float(detail.net_amount or 0)
                total_withdrawals_deducted += withdrawals
                total_net_amount += net
                
                details_data.append({
                    'partner_name': detail.partner_name,
                    'percentage': float(detail.percentage),
                    'amount_distributed': float(detail.amount_distributed),
                    'withdrawals_deducted': withdrawals,
                    'net_amount': net
                })
            
            archives_data.append({
                'id': archive.id,
                'archive_date': archive.archive_date.isoformat(),
                'period_start': archive.period_start.isoformat(),
                'period_end': archive.period_end.isoformat(),
                'total_profit': float(archive.total_profit),
                'total_distributed': float(archive.total_distributed),
                'total_withdrawals_deducted': total_withdrawals_deducted,
                'total_net_distributed': total_net_amount,
                'distribution_method': archive.distribution_method,
                'notes': archive.notes,
                'details': details_data
            })
        
        # حساب كلفة التخليص ومصاريف الحدود بشكل منفصل
        total_clearance_cost = db.session.query(func.sum(MerchantRecord.clearance_cost)).scalar() or 0
        total_border_expenses = db.session.query(func.sum(BorderExpense.amount)).scalar() or 0
        net_profit_calculated = float(total_clearance_cost) - float(total_border_expenses)
        
        return jsonify({
            'success': True,
            'current_stats': {
                'total_clearance_cost': float(total_clearance_cost),
                'total_border_expenses': float(total_border_expenses),
                'net_profit': max(0, net_profit_calculated),
                'total_distributed': stats.get('total_distributed_profits', 0)
            },
            'archives': archives_data
        })
        
    except Exception as e:
        logger.error(f"خطأ في تقرير الأرباح الشامل: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})

# تسديد حساب النبر
@app.route('/add_naber_payment', methods=['POST'])
@login_required
def add_naber_payment():
    """إضافة تسديد لحساب النبر"""
    try:
        data = request.get_json()
        
        # التحقق من البيانات المطلوبة
        if not data.get('amount') or not data.get('payment_date'):
            return jsonify({'success': False, 'message': 'المبلغ وتاريخ التسديد مطلوبان'})
        
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'success': False, 'message': 'يجب أن يكون مبلغ التسديد أكبر من الصفر'})
        
        # حساب الرصيد قبل التسديد
        total_dues = float(db.session.query(func.sum(NaberAccount.total_amount)).scalar() or 0)
        total_payments = float(db.session.query(func.sum(NaberPayment.amount)).scalar() or 0)
        balance_before = total_dues - total_payments
        
        # إنشاء سجل التسديد
        payment = NaberPayment()
        payment.amount = amount
        payment.payment_date = datetime.strptime(data['payment_date'], '%Y-%m-%d').date()
        payment.description = data.get('description', 'تسديد حساب النبر')
        payment.notes = data.get('notes', '')
        payment.balance_before = balance_before
        payment.balance_after = balance_before - amount
        payment.created_by = current_user.id
        
        db.session.add(payment)
        db.session.commit()
        
        # تحديث البيانات المحدثة للإرسال للعميل
        updated_stats = get_financial_stats()
        
        return jsonify({
            'success': True, 
            'message': 'تم تسديد المبلغ بنجاح',
            'payment_amount': float(amount),
            'new_balance': float(balance_before - amount),
            'updated_stats': updated_stats,
            'auto_update': True  # إشارة للعميل لتحديث البيانات
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في تسديد النبر: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في التسديد: {str(e)}'})

# التقرير المالي الكامل لحساب النبر
@app.route('/get_naber_financial_report')
@login_required
def get_naber_financial_report():
    """الحصول على التقرير المالي الكامل لحساب النبر"""
    try:
        # جميع المستحقات من حساب النبر
        naber_entries = NaberAccount.query.order_by(NaberAccount.date).all()
        
        # جميع التسديدات
        payments = NaberPayment.query.order_by(NaberPayment.payment_date).all()
        
        # حساب الإجماليات
        total_dues = sum(float(entry.total_amount) for entry in naber_entries)
        total_payments = sum(float(payment.amount) for payment in payments)
        current_balance = total_dues - total_payments
        
        # إنشاء الجدول الزمني للمعاملات
        timeline = []
        
        # إضافة المستحقات
        for entry in naber_entries:
            timeline.append({
                'date': entry.date.strftime('%Y-%m-%d'),
                'type': 'due',
                'amount': float(entry.total_amount),
                'description': f'استحقاق من {entry.merchant_name} (أجور: ${float(entry.fees_amount):.2f}, سلف: ${float(entry.advance_amount):.2f})',
                'running_balance': 0  # سيتم حسابه لاحقاً
            })
        
        # إضافة التسديدات
        for payment in payments:
            timeline.append({
                'date': payment.payment_date.strftime('%Y-%m-%d'),
                'type': 'payment',
                'amount': float(payment.amount),
                'description': payment.description or 'تسديد حساب النبر',
                'running_balance': 0  # سيتم حسابه لاحقاً
            })
        
        # ترتيب الجدول الزمني حسب التاريخ
        timeline.sort(key=lambda x: x['date'])
        
        # حساب الرصيد الجاري
        running_balance = 0
        for item in timeline:
            if item['type'] == 'due':
                running_balance += item['amount']
            else:  # payment
                running_balance -= item['amount']
            item['running_balance'] = running_balance
        
        return jsonify({
            'success': True,
            'total_dues': total_dues,
            'total_payments': total_payments,
            'current_balance': current_balance,
            'timeline': timeline
        })
        
    except Exception as e:
        logger.error(f"خطأ في التقرير المالي للنبر: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ في تحميل التقرير: {str(e)}'})


@app.route('/get_all_merchants_comprehensive_report')
@login_required
def get_all_merchants_comprehensive_report():
    """الحصول على كشف شامل لجميع التجار"""
    try:
        # جلب جميع التجار المستلمين الفريدين
        merchants = db.session.query(MerchantRecord.recipient_merchant)\
            .filter(MerchantRecord.recipient_merchant.isnot(None))\
            .distinct().all()
        
        if not merchants:
            return jsonify({
                'success': True,
                'data': [],
                'message': 'لا توجد بيانات تجار'
            })
        
        all_merchants_data = []
        
        for merchant_tuple in merchants:
            merchant_name = merchant_tuple[0]
            
            # جلب جميع سجلات التاجر (بما في ذلك المؤرشفة)
            records = MerchantRecord.query.filter_by(
                recipient_merchant=merchant_name
            ).order_by(MerchantRecord.date).all()
            
            # جلب جميع التسديدات للتاجر
            payments = MerchantPayment.query.filter_by(
                merchant_name=merchant_name
            ).order_by(MerchantPayment.payment_date).all()
            
            # إنشاء قائمة المعاملات المدمجة
            transactions = []
            
            # إضافة السجلات
            for record in records:
                transactions.append({
                    'date': record.date.strftime('%Y-%m-%d'),
                    'transaction_type': 'معاملة',
                    'details': f'{record.sender_merchant or ""} → {record.goods_type or ""}',
                    'amount': float(record.total_debt or 0),
                    'paid_amount': 0,
                    'balance': 0,  # سيتم حسابه لاحقاً
                    'notes': record.notes or '',
                    'fees': float(record.fees or 0),
                    'advance': float(record.advance or 0),
                    'clearance_cost': float(record.clearance_cost or 0)
                })
            
            # إضافة التسديدات
            for payment in payments:
                transactions.append({
                    'date': payment.payment_date.strftime('%Y-%m-%d'),
                    'transaction_type': 'تسديد',
                    'details': 'تسديد مبلغ',
                    'amount': 0,
                    'paid_amount': float(payment.amount),
                    'balance': 0,  # سيتم حسابه لاحقاً
                    'notes': payment.notes or '',
                    'fees': 0,
                    'advance': 0,
                    'clearance_cost': 0
                })
            
            # ترتيب المعاملات حسب التاريخ
            transactions.sort(key=lambda x: x['date'])
            
            # حساب الرصيد الجاري
            running_balance = 0
            for transaction in transactions:
                if transaction['transaction_type'] == 'معاملة':
                    running_balance += transaction['amount']
                else:  # تسديد
                    running_balance -= transaction['paid_amount']
                transaction['balance'] = running_balance
            
            # حساب الملخص المالي للتاجر
            total_due = sum(float(record.total_debt or 0) for record in records)
            total_paid = sum(float(payment.amount) for payment in payments)
            current_balance = total_due - total_paid
            last_payment_date = None
            
            if payments:
                last_payment = max(payments, key=lambda p: p.payment_date)
                last_payment_date = last_payment.payment_date.strftime('%Y-%m-%d')
            
            merchant_data = {
                'merchant_name': merchant_name,
                'transactions': transactions,
                'summary': {
                    'total_due': total_due,
                    'total_paid': total_paid,
                    'current_balance': current_balance,
                    'last_payment_date': last_payment_date,
                    'transaction_count': len(records),
                    'payment_count': len(payments)
                }
            }
            
            all_merchants_data.append(merchant_data)
        
        # ترتيب التجار حسب الرصيد المتبقي (من الأعلى للأقل)
        all_merchants_data.sort(key=lambda x: x['summary']['current_balance'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': all_merchants_data,
            'total_merchants': len(all_merchants_data)
        })
        
    except Exception as e:
        logger.error(f"خطأ في إنشاء الكشف الشامل للتجار: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'حدث خطأ في إنشاء الكشف الشامل: {str(e)}'
        })


@app.route('/get_expense_archives')
@login_required
@can_view_profits
def get_expense_archives():
    """الحصول على أرشيف المصروفات والسحوبات"""
    try:
        # جلب أرشيف السحوبات
        withdrawal_archives = WithdrawalArchive.query.order_by(desc(WithdrawalArchive.archived_at)).all()
        
        # جلب أرشيف مصروفات الحدود
        border_expense_archives = BorderExpenseArchive.query.order_by(desc(BorderExpenseArchive.archived_at)).all()
        
        # تحضير بيانات أرشيف السحوبات
        withdrawals_data = []
        for archive in withdrawal_archives:
            withdrawals_data.append({
                'id': archive.id,
                'original_id': archive.original_withdrawal_id,
                'amount': float(archive.amount),
                'date': archive.date.strftime('%Y-%m-%d'),
                'expense_type': archive.expense_type,
                'description': archive.description or '',
                'notes': archive.notes or '',
                'archived_at': archive.archived_at.strftime('%Y-%m-%d %H:%M'),
                'archive_reason': archive.archive_reason,
                'profit_distribution_id': archive.profit_distribution_id
            })
        
        # تحضير بيانات أرشيف مصروفات الحدود
        border_expenses_data = []
        for archive in border_expense_archives:
            border_expenses_data.append({
                'id': archive.id,
                'original_id': archive.original_expense_id,
                'amount': float(archive.amount),
                'date': archive.date.strftime('%Y-%m-%d'),
                'description': archive.description or '',
                'notes': archive.notes or '',
                'archived_at': archive.archived_at.strftime('%Y-%m-%d %H:%M'),
                'archive_reason': archive.archive_reason,
                'profit_distribution_id': archive.profit_distribution_id
            })
        
        # حساب المجاميع
        total_archived_withdrawals = sum(float(w.amount) for w in withdrawal_archives)
        total_archived_border_expenses = sum(float(b.amount) for b in border_expense_archives)
        
        return jsonify({
            'success': True,
            'summary': {
                'total_archived_withdrawals': total_archived_withdrawals,
                'total_archived_border_expenses': total_archived_border_expenses,
                'total_archived_amount': total_archived_withdrawals + total_archived_border_expenses,
                'withdrawals_count': len(withdrawal_archives),
                'border_expenses_count': len(border_expense_archives)
            },
            'withdrawal_archives': withdrawals_data,
            'border_expense_archives': border_expenses_data
        })
        
    except Exception as e:
        logger.error(f"خطأ في جلب أرشيف المصروفات: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})


@app.route('/get_distribution_archive_details/<int:distribution_id>')
@login_required
@can_view_profits
def get_distribution_archive_details(distribution_id):
    """الحصول على تفاصيل أرشيف توزيع معين مع المصروفات المرتبطة"""
    try:
        # جلب بيانات التوزيع
        distribution = ProfitArchive.query.get_or_404(distribution_id)
        
        # جلب السحوبات المؤرشفة لهذا التوزيع
        archived_withdrawals = WithdrawalArchive.query.filter_by(
            profit_distribution_id=distribution_id
        ).all()
        
        # جلب مصروفات الحدود المؤرشفة لهذا التوزيع
        archived_border_expenses = BorderExpenseArchive.query.filter_by(
            profit_distribution_id=distribution_id
        ).all()
        
        # تحضير البيانات
        withdrawals_data = []
        for w in archived_withdrawals:
            withdrawals_data.append({
                'amount': float(w.amount),
                'date': w.date.strftime('%Y-%m-%d'),
                'expense_type': w.expense_type,
                'description': w.description or '',
                'notes': w.notes or ''
            })
        
        border_expenses_data = []
        for b in archived_border_expenses:
            border_expenses_data.append({
                'amount': float(b.amount),
                'date': b.date.strftime('%Y-%m-%d'),
                'description': b.description or '',
                'notes': b.notes or ''
            })
        
        # حساب المجاميع
        total_withdrawals = sum(float(w.amount) for w in archived_withdrawals)
        total_border_expenses = sum(float(b.amount) for b in archived_border_expenses)
        
        return jsonify({
            'success': True,
            'distribution': {
                'id': distribution.id,
                'archive_date': distribution.archive_date.strftime('%Y-%m-%d'),
                'period_start': distribution.period_start.strftime('%Y-%m-%d'),
                'period_end': distribution.period_end.strftime('%Y-%m-%d'),
                'total_profit': float(distribution.total_profit),
                'total_distributed': float(distribution.total_distributed),
                'distribution_method': distribution.distribution_method,
                'notes': distribution.notes or ''
            },
            'archived_expenses': {
                'total_withdrawals': total_withdrawals,
                'total_border_expenses': total_border_expenses,
                'total_expenses': total_withdrawals + total_border_expenses,
                'withdrawals': withdrawals_data,
                'border_expenses': border_expenses_data
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في جلب تفاصيل الأرشيف: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})


# خاصية الإضافة والإرجاع للتجار
@app.route('/add_merchant_adjustment', methods=['POST'])
@login_required
def add_merchant_adjustment():
    """إضافة إضافة أو إرجاع لحساب التاجر"""
    try:
        data = request.get_json()
        merchant_name = data.get('merchant_name')
        adjustment_type = data.get('adjustment_type')  # 'addition' أو 'return'
        amount = float(data.get('amount', 0))
        description = data.get('description', '')
        notes = data.get('notes', '')
        adjustment_date = datetime.strptime(data.get('date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        
        if not merchant_name or not adjustment_type or amount <= 0:
            return jsonify({'success': False, 'message': 'يرجى ملء جميع الحقول المطلوبة'})
        
        if adjustment_type not in ['addition', 'return']:
            return jsonify({'success': False, 'message': 'نوع التعديل غير صحيح'})
        
        # التحقق من وجود التاجر في النظام
        merchant_exists = db.session.query(MerchantRecord).filter_by(recipient_merchant=merchant_name).first()
        if not merchant_exists:
            return jsonify({'success': False, 'message': 'التاجر غير موجود في النظام'})
        
        # إنشاء سجل التعديل
        adjustment = MerchantAdjustment(
            merchant_name=merchant_name,
            adjustment_type=adjustment_type,
            amount=amount,
            description=description,
            notes=notes,
            adjustment_date=adjustment_date,
            created_by=current_user.id
        )
        
        db.session.add(adjustment)
        db.session.commit()
        
        action_text = 'إضافة' if adjustment_type == 'addition' else 'إرجاع'
        logger.info(f"تم إضافة {action_text} بمبلغ ${amount:.2f} للتاجر {merchant_name}")
        
        return jsonify({
            'success': True,
            'message': f'تم إضافة {action_text} بمبلغ ${amount:.2f} للتاجر {merchant_name} بنجاح',
            'adjustment_id': adjustment.id
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في إضافة التعديل: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})


@app.route('/get_merchant_adjustments/<merchant_name>')
@login_required
def get_merchant_adjustments(merchant_name):
    """الحصول على تعديلات التاجر (الإضافات والإرجاعات)"""
    try:
        adjustments = MerchantAdjustment.query.filter_by(
            merchant_name=merchant_name
        ).order_by(desc(MerchantAdjustment.adjustment_date)).all()
        
        adjustments_data = []
        total_additions = 0
        total_returns = 0
        
        for adj in adjustments:
            amount = float(adj.amount)
            if adj.adjustment_type == 'addition':
                total_additions += amount
            else:  # return
                total_returns += amount
                
            adjustments_data.append({
                'id': adj.id,
                'adjustment_type': adj.adjustment_type,
                'amount': amount,
                'description': adj.description or '',
                'notes': adj.notes or '',
                'date': adj.adjustment_date.strftime('%Y-%m-%d'),
                'created_at': adj.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        return jsonify({
            'success': True,
            'adjustments': adjustments_data,
            'summary': {
                'total_additions': total_additions,
                'total_returns': total_returns,
                'net_adjustment': total_additions - total_returns,
                'count': len(adjustments_data)
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في جلب تعديلات التاجر: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})


@app.route('/delete_merchant_adjustment/<int:adjustment_id>', methods=['DELETE'])
@admin_required
def delete_merchant_adjustment(adjustment_id):
    """حذف تعديل التاجر"""
    try:
        adjustment = MerchantAdjustment.query.get_or_404(adjustment_id)
        merchant_name = adjustment.merchant_name
        adjustment_type = 'إضافة' if adjustment.adjustment_type == 'addition' else 'إرجاع'
        amount = float(adjustment.amount)
        
        db.session.delete(adjustment)
        db.session.commit()
        
        logger.info(f"تم حذف {adjustment_type} بمبلغ ${amount:.2f} للتاجر {merchant_name}")
        
        return jsonify({
            'success': True,
            'message': f'تم حذف {adjustment_type} بمبلغ ${amount:.2f} بنجاح'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حذف التعديل: {str(e)}")
        return jsonify({'success': False, 'message': f'حدث خطأ: {str(e)}'})


def calculate_merchant_balance_with_adjustments(merchant_name):
    """حساب رصيد التاجر مع الإضافات والإرجاعات"""
    try:
        # الحساب الأساسي (ديون - مدفوعات)
        records = MerchantRecord.query.filter_by(recipient_merchant=merchant_name).all()
        total_debt = sum(float(r.total_debt or 0) for r in records)
        
        payments = MerchantPayment.query.filter_by(merchant_name=merchant_name).all()
        total_payments = sum(float(p.amount) for p in payments)
        
        base_balance = total_debt - total_payments
        
        # الإضافات والإرجاعات
        adjustments = MerchantAdjustment.query.filter_by(merchant_name=merchant_name).all()
        total_additions = sum(float(adj.amount) for adj in adjustments if adj.adjustment_type == 'addition')
        total_returns = sum(float(adj.amount) for adj in adjustments if adj.adjustment_type == 'return')
        
        # الرصيد النهائي = الرصيد الأساسي - الإضافات + الإرجاعات
        final_balance = base_balance - total_additions + total_returns
        
        return {
            'base_balance': base_balance,
            'total_additions': total_additions,
            'total_returns': total_returns,
            'final_balance': final_balance
        }
        
    except Exception as e:
        logger.error(f"خطأ في حساب رصيد التاجر مع التعديلات: {str(e)}")
        return {
            'base_balance': 0,
            'total_additions': 0,
            'total_returns': 0,
            'final_balance': 0
        }


if __name__ == '__main__':
    app.run(debug=True)


