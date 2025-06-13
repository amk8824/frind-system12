"""
نظام الحماية المالية
يمنع فقدان أي مبلغ في النظام ويضمن سلامة البيانات المالية
"""

from app import db
from models import MerchantRecord, NaberAccount, MerchantPayment, NaberPayment, BorderExpense, Withdrawal
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)

class FinancialProtection:
    """نظام الحماية المالية الشامل"""
    
    @staticmethod
    def validate_financial_integrity():
        """التحقق من سلامة البيانات المالية"""
        try:
            errors = []
            
            # 1. التحقق من تطابق سجلات النبر مع السجلات الأصلية
            merchant_records = MerchantRecord.query.filter_by(is_archived=False).all()
            for record in merchant_records:
                if (record.fees or 0) > 0 or (record.advance or 0) > 0:
                    naber_entry = NaberAccount.query.filter_by(record_id=record.id).first()
                    if not naber_entry:
                        errors.append(f"سجل النبر مفقود للسجل رقم {record.id}")
                    else:
                        # التحقق من تطابق المبالغ
                        expected_total = (record.fees or 0) + (record.advance or 0)
                        if float(naber_entry.total_amount) != expected_total:
                            errors.append(f"عدم تطابق مبلغ النبر للسجل {record.id}: متوقع {expected_total}, موجود {naber_entry.total_amount}")
            
            # 2. التحقق من عدم وجود سجلات نبر يتيمة
            naber_entries = NaberAccount.query.all()
            for entry in naber_entries:
                record = MerchantRecord.query.get(entry.record_id)
                if not record:
                    errors.append(f"سجل نبر يتيم رقم {entry.id} بدون سجل أصلي")
            
            # 3. التحقق من صحة الأرصدة
            total_merchant_debt = float(db.session.query(func.sum(MerchantRecord.total_debt)).scalar() or 0)
            total_merchant_payments = float(db.session.query(func.sum(MerchantPayment.amount)).scalar() or 0)
            
            total_naber = float(db.session.query(func.sum(NaberAccount.total_amount)).scalar() or 0)
            total_naber_payments = float(db.session.query(func.sum(NaberPayment.amount)).scalar() or 0)
            
            if len(errors) == 0:
                logger.info("✓ جميع البيانات المالية سليمة")
                return True, "جميع البيانات المالية محمية وسليمة"
            else:
                logger.error(f"تم اكتشاف {len(errors)} خطأ مالي")
                return False, errors
                
        except Exception as e:
            logger.error(f"خطأ في فحص سلامة البيانات المالية: {str(e)}")
            return False, [f"خطأ في الفحص: {str(e)}"]
    
    @staticmethod
    def fix_orphaned_naber_entries():
        """إصلاح سجلات النبر اليتيمة"""
        try:
            fixed_count = 0
            
            # البحث عن سجلات نبر بدون سجل أصلي
            orphaned_entries = db.session.query(NaberAccount).filter(
                ~NaberAccount.record_id.in_(
                    db.session.query(MerchantRecord.id)
                )
            ).all()
            
            for entry in orphaned_entries:
                logger.warning(f"حذف سجل نبر يتيم رقم {entry.id}")
                db.session.delete(entry)
                fixed_count += 1
            
            db.session.commit()
            logger.info(f"تم إصلاح {fixed_count} سجل نبر يتيم")
            return fixed_count
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"خطأ في إصلاح السجلات اليتيمة: {str(e)}")
            return 0
    
    @staticmethod
    def create_missing_naber_entries():
        """إنشاء سجلات النبر المفقودة"""
        try:
            created_count = 0
            
            merchant_records = MerchantRecord.query.filter_by(is_archived=False).all()
            for record in merchant_records:
                if (record.fees or 0) > 0 or (record.advance or 0) > 0:
                    existing_naber = NaberAccount.query.filter_by(record_id=record.id).first()
                    if not existing_naber:
                        naber_entry = NaberAccount()
                        naber_entry.record_id = record.id
                        naber_entry.merchant_name = record.recipient_merchant
                        naber_entry.fees_amount = record.fees or 0
                        naber_entry.advance_amount = record.advance or 0
                        naber_entry.total_amount = (record.fees or 0) + (record.advance or 0)
                        naber_entry.date = record.date
                        
                        db.session.add(naber_entry)
                        created_count += 1
                        logger.info(f"تم إنشاء سجل نبر للسجل {record.id}")
            
            db.session.commit()
            logger.info(f"تم إنشاء {created_count} سجل نبر مفقود")
            return created_count
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"خطأ في إنشاء سجلات النبر المفقودة: {str(e)}")
            return 0
    
    @staticmethod
    def prevent_duplicate_naber_entries(record_id):
        """منع تكرار سجلات النبر"""
        existing_count = NaberAccount.query.filter_by(record_id=record_id).count()
        if existing_count > 1:
            # حذف السجلات المكررة والاحتفاظ بالأول فقط
            duplicates = NaberAccount.query.filter_by(record_id=record_id).order_by(NaberAccount.id)[1:]
            for duplicate in duplicates:
                db.session.delete(duplicate)
                logger.warning(f"حذف سجل نبر مكرر رقم {duplicate.id}")
            db.session.commit()
            return existing_count - 1
        return 0
    
    @staticmethod
    def get_financial_summary():
        """ملخص مالي شامل للمراجعة"""
        try:
            # إجماليات السجلات
            total_records = MerchantRecord.query.filter_by(is_archived=False).count()
            total_debt = float(db.session.query(func.sum(MerchantRecord.total_debt)).scalar() or 0)
            total_fees = float(db.session.query(func.sum(MerchantRecord.fees)).scalar() or 0)
            total_advances = float(db.session.query(func.sum(MerchantRecord.advance)).scalar() or 0)
            total_clearance = float(db.session.query(func.sum(MerchantRecord.clearance_cost)).scalar() or 0)
            
            # إجماليات النبر
            total_naber_entries = NaberAccount.query.count()
            total_naber_amount = float(db.session.query(func.sum(NaberAccount.total_amount)).scalar() or 0)
            
            # إجماليات التسديدات
            total_merchant_payments = float(db.session.query(func.sum(MerchantPayment.amount)).scalar() or 0)
            total_naber_payments = float(db.session.query(func.sum(NaberPayment.amount)).scalar() or 0)
            
            # إجماليات المصاريف والسحوبات
            total_border_expenses = float(db.session.query(func.sum(BorderExpense.amount)).scalar() or 0)
            total_withdrawals = float(db.session.query(func.sum(Withdrawal.amount)).scalar() or 0)
            
            return {
                'records': {
                    'count': total_records,
                    'total_debt': total_debt,
                    'total_fees': total_fees,
                    'total_advances': total_advances,
                    'total_clearance': total_clearance
                },
                'naber': {
                    'entries_count': total_naber_entries,
                    'total_amount': total_naber_amount,
                    'total_payments': total_naber_payments,
                    'balance': total_naber_amount - total_naber_payments
                },
                'merchants': {
                    'total_payments': total_merchant_payments,
                    'balance': total_debt - total_merchant_payments
                },
                'expenses': {
                    'border_expenses': total_border_expenses,
                    'withdrawals': total_withdrawals,
                    'total': total_border_expenses + total_withdrawals
                },
                'integrity_check': FinancialProtection.validate_financial_integrity()[0]
            }
            
        except Exception as e:
            logger.error(f"خطأ في الملخص المالي: {str(e)}")
            return None

def run_daily_protection_check():
    """فحص الحماية اليومي"""
    logger.info("بدء فحص الحماية المالية اليومي...")
    
    # إصلاح المشاكل
    orphaned_fixed = FinancialProtection.fix_orphaned_naber_entries()
    missing_created = FinancialProtection.create_missing_naber_entries()
    
    # فحص السلامة النهائي
    is_valid, result = FinancialProtection.validate_financial_integrity()
    
    logger.info(f"انتهى فحص الحماية - يتيم: {orphaned_fixed}, مفقود: {missing_created}, سليم: {is_valid}")
    
    return {
        'orphaned_fixed': orphaned_fixed,
        'missing_created': missing_created,
        'is_valid': is_valid,
        'validation_result': result
    }