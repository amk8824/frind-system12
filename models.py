from app import db
from datetime import datetime
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class MerchantRecord(db.Model):
    __tablename__ = 'merchant_records'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)  # التاريخ
    sender_merchant = db.Column(db.String(100))  # التاجر المرسل
    recipient_merchant = db.Column(db.String(100), nullable=False)  # التاجر المستلم
    foreign_driver = db.Column(db.String(100))  # السائق الأجنبي
    foreign_car = db.Column(db.String(50))  # السيارة الأجنبية
    local_driver = db.Column(db.String(100))  # السائق المحلي
    local_car = db.Column(db.String(50))  # السيارة المحلية
    goods_type = db.Column(db.String(100))  # نوع البضاعة
    fees = db.Column(db.Numeric(10, 2), default=0)  # الأجور
    advance = db.Column(db.Numeric(10, 2), default=0)  # السلفة
    clearance_cost = db.Column(db.Numeric(10, 2), default=0)  # كلفة التخليص
    total_debt = db.Column(db.Numeric(10, 2), default=0)  # إجمالي الدين
    notes = db.Column(db.Text)  # الملاحظات
    is_archived = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def naber_amount(self):
        """المبلغ الذي يذهب لحساب النبر = الأجور + السلف فقط"""
        return float(self.fees or 0) + float(self.advance or 0)
    
    @property
    def profit_for_partnership(self):
        """الربح المتاح للشراكة = كلفة التخليص فقط"""
        return float(self.clearance_cost or 0)
    


# حساب النبر (بين الحدين) - يجمع الأجور والسلف فقط
class NaberAccount(db.Model):
    __tablename__ = 'naber_account'
    
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('merchant_records.id'), nullable=False)
    merchant_name = db.Column(db.String(100), nullable=False)
    fees_amount = db.Column(db.Numeric(10, 2), default=0)  # مبلغ الأجور
    advance_amount = db.Column(db.Numeric(10, 2), default=0)  # مبلغ السلف
    total_amount = db.Column(db.Numeric(10, 2), default=0)  # المجموع = أجور + سلف فقط
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    record = db.relationship('MerchantRecord', backref='naber_entries')

# تسديدات حساب النبر
class NaberPayment(db.Model):
    __tablename__ = 'naber_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(200))
    notes = db.Column(db.Text)
    balance_before = db.Column(db.Numeric(10, 2), default=0)
    balance_after = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

class BorderExpense(db.Model):
    __tablename__ = 'border_expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(200))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)



class MerchantPayment(db.Model):
    __tablename__ = 'merchant_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    merchant_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    balance_before = db.Column(db.Numeric(10, 2), default=0)
    balance_after = db.Column(db.Numeric(10, 2), default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Withdrawal(db.Model):
    __tablename__ = 'withdrawals'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False)
    expense_type = db.Column(db.String(50), default='عام')  # نوع المصروف
    description = db.Column(db.String(200))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Partner(db.Model):
    __tablename__ = 'partners'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    profit_percentage = db.Column(db.Numeric(5, 2), default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PartnerTransaction(db.Model):
    __tablename__ = 'partner_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'share', 'withdraw', 'add'
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(200))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    partner = db.relationship('Partner', backref='transactions')

# نموذج المستخدمين للنظام
class ProfitArchive(db.Model):
    __tablename__ = 'profit_archives'
    
    id = db.Column(db.Integer, primary_key=True)
    archive_date = db.Column(db.Date, nullable=False)
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    total_profit = db.Column(db.Numeric(10, 2), nullable=False)
    total_distributed = db.Column(db.Numeric(10, 2), nullable=False)
    distribution_method = db.Column(db.String(20), nullable=False)  # 'auto', 'manual'
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

class ProfitArchiveDetail(db.Model):
    __tablename__ = 'profit_archive_details'
    
    id = db.Column(db.Integer, primary_key=True)
    archive_id = db.Column(db.Integer, db.ForeignKey('profit_archives.id'), nullable=False)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    partner_name = db.Column(db.String(100), nullable=False)
    percentage = db.Column(db.Numeric(5, 2), nullable=False)
    amount_distributed = db.Column(db.Numeric(10, 2), nullable=False)
    withdrawals_deducted = db.Column(db.Numeric(10, 2), default=0)
    net_amount = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    archive = db.relationship('ProfitArchive', backref='details')
    partner = db.relationship('Partner')

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='data_entry')  # 'admin', 'data_entry'
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def set_password(self, password):
        """تشفير كلمة المرور"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """التحقق من كلمة المرور"""
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """التحقق من صلاحيات الإدارة"""
        return self.role == 'admin'
    
    def can_view_profits(self):
        """التحقق من صلاحية رؤية الأرباح"""
        return self.role == 'admin'
    
    def can_manage_users(self):
        """التحقق من صلاحية إدارة المستخدمين"""
        return self.role == 'admin'
    
    def __repr__(self):
        return f'<User {self.username}>'


# جداول الأرشيف للمصروفات
class WithdrawalArchive(db.Model):
    __tablename__ = 'withdrawal_archives'
    
    id = db.Column(db.Integer, primary_key=True)
    original_withdrawal_id = db.Column(db.Integer, nullable=False)  # معرف السحب الأصلي
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False)
    expense_type = db.Column(db.String(50), default='عام')
    description = db.Column(db.String(200))
    notes = db.Column(db.Text)
    
    # معلومات الأرشفة
    archived_at = db.Column(db.DateTime, default=datetime.utcnow)
    archived_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    archive_reason = db.Column(db.String(200), default='توزيع الأرباح')
    profit_distribution_id = db.Column(db.Integer, db.ForeignKey('profit_archives.id'))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class BorderExpenseArchive(db.Model):
    __tablename__ = 'border_expense_archives'
    
    id = db.Column(db.Integer, primary_key=True)
    original_expense_id = db.Column(db.Integer, nullable=False)  # معرف المصروف الأصلي
    amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(200))
    notes = db.Column(db.Text)
    
    # معلومات الأرشفة
    archived_at = db.Column(db.DateTime, default=datetime.utcnow)
    archived_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    archive_reason = db.Column(db.String(200), default='توزيع الأرباح')
    profit_distribution_id = db.Column(db.Integer, db.ForeignKey('profit_archives.id'))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
from datetime import datetime
from app import db

class MerchantAdjustment(db.Model):
    __tablename__ = 'merchant_adjustments'

    id = db.Column(db.Integer, primary_key=True)
    merchant_name = db.Column(db.String(100), nullable=False)
    adjustment_type = db.Column(db.String(10), nullable=False)  # 'addition' أو 'return'
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(200))
    notes = db.Column(db.Text)
    adjustment_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __repr__(self):
        return f'<MerchantAdjustment {self.merchant_name}: {self.adjustment_type} ${self.amount}>'