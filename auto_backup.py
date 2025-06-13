#!/usr/bin/env python3
"""
نظام النسخ الاحتياطي التلقائي
يقوم بإنشاء نسخ احتياطية منتظمة لجميع البيانات
"""

import os
import psycopg2
from datetime import datetime, timedelta
import schedule
import time
import threading

class AutoBackupSystem:
    def __init__(self):
        self.backup_folder = "automated_backups"
        self.max_backups = 30  # الاحتفاظ بـ 30 نسخة احتياطية كحد أقصى
        self.ensure_backup_folder()
    
    def ensure_backup_folder(self):
        """إنشاء مجلد النسخ الاحتياطية"""
        if not os.path.exists(self.backup_folder):
            os.makedirs(self.backup_folder)
    
    def create_comprehensive_backup(self):
        """إنشاء نسخة احتياطية شاملة"""
        try:
            conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
            cur = conn.cursor()
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"{self.backup_folder}/backup_{timestamp}.sql"
            
            with open(backup_filename, 'w', encoding='utf-8') as f:
                f.write(f"-- نسخة احتياطية تلقائية - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("-- نظام الأصدقاء للتخليص الكمركي\n\n")
                
                # حفظ إحصائيات البيانات
                f.write("-- ================================\n")
                f.write("-- إحصائيات البيانات\n")
                f.write("-- ================================\n")
                
                tables = ['merchant_records', 'merchant_payments', 'withdrawals', 'partners', 'partner_transactions', 'users']
                for table in tables:
                    cur.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cur.fetchone()[0]
                    f.write(f"-- {table}: {count} سجل\n")
                
                f.write("\n")
                
                # 1. السجلات التجارية
                f.write("-- ================================\n")
                f.write("-- بيانات السجلات التجارية\n")
                f.write("-- ================================\n")
                cur.execute("SELECT * FROM merchant_records ORDER BY id")
                records = cur.fetchall()
                if records:
                    f.write("INSERT INTO merchant_records (merchant_name, foreign_driver, foreign_car, local_driver, local_car, date, goods_type, notes, fees, advance, my_profit, addition, returned, created_at) VALUES\n")
                    values = []
                    for record in records:
                        values.append(f"('{record[1]}', '{record[2] or ''}', '{record[3] or ''}', '{record[4] or ''}', '{record[5] or ''}', '{record[6]}', '{record[7] or ''}', '{record[8] or ''}', {record[9]}, {record[10]}, {record[11]}, {record[12]}, {record[13]}, '{record[14]}')")
                    f.write(",\n".join(values) + ";\n\n")
                
                # 2. مدفوعات التجار
                f.write("-- ================================\n")
                f.write("-- بيانات مدفوعات التجار\n")
                f.write("-- ================================\n")
                cur.execute("SELECT * FROM merchant_payments ORDER BY id")
                payments = cur.fetchall()
                if payments:
                    f.write("INSERT INTO merchant_payments (merchant_name, amount, payment_date, balance_before, balance_after, notes, created_at) VALUES\n")
                    values = []
                    for payment in payments:
                        values.append(f"('{payment[1]}', {payment[2]}, '{payment[3]}', {payment[4]}, {payment[5]}, '{payment[6] or ''}', '{payment[7]}')")
                    f.write(",\n".join(values) + ";\n\n")
                
                # 3. السحوبات
                f.write("-- ================================\n")
                f.write("-- بيانات السحوبات الخارجية\n")
                f.write("-- ================================\n")
                cur.execute("SELECT * FROM withdrawals ORDER BY id")
                withdrawals = cur.fetchall()
                if withdrawals:
                    f.write("INSERT INTO withdrawals (amount, date, description, notes, created_at) VALUES\n")
                    values = []
                    for withdrawal in withdrawals:
                        values.append(f"({withdrawal[1]}, '{withdrawal[2]}', '{withdrawal[3] or ''}', '{withdrawal[4] or ''}', '{withdrawal[5]}')")
                    f.write(",\n".join(values) + ";\n\n")
                
                # 4. الشركاء
                f.write("-- ================================\n")
                f.write("-- بيانات الشركاء\n")
                f.write("-- ================================\n")
                cur.execute("SELECT * FROM partners ORDER BY id")
                partners = cur.fetchall()
                if partners:
                    f.write("INSERT INTO partners (name, phone, email, profit_percentage, is_active, created_at) VALUES\n")
                    values = []
                    for partner in partners:
                        values.append(f"('{partner[1]}', '{partner[2] or ''}', '{partner[3] or ''}', {partner[4]}, {partner[5]}, '{partner[6]}')")
                    f.write(",\n".join(values) + ";\n\n")
                
                # 5. معاملات الشركاء
                f.write("-- ================================\n")
                f.write("-- بيانات معاملات الشركاء\n")
                f.write("-- ================================\n")
                cur.execute("SELECT * FROM partner_transactions ORDER BY id")
                transactions = cur.fetchall()
                if transactions:
                    f.write("INSERT INTO partner_transactions (partner_id, transaction_type, amount, date, description, notes, created_at) VALUES\n")
                    values = []
                    for transaction in transactions:
                        values.append(f"({transaction[1]}, '{transaction[2]}', {transaction[3]}, '{transaction[4]}', '{transaction[5] or ''}', '{transaction[6] or ''}', '{transaction[7]}')")
                    f.write(",\n".join(values) + ";\n\n")
                
                f.write("-- تمت النسخة الاحتياطية بنجاح\n")
            
            cur.close()
            conn.close()
            
            # تنظيف النسخ القديمة
            self.cleanup_old_backups()
            
            print(f"✅ تم إنشاء نسخة احتياطية: {backup_filename}")
            return backup_filename
            
        except Exception as e:
            print(f"❌ خطأ في النسخة الاحتياطية: {str(e)}")
            return None
    
    def cleanup_old_backups(self):
        """حذف النسخ الاحتياطية القديمة"""
        try:
            backup_files = []
            for filename in os.listdir(self.backup_folder):
                if filename.startswith('backup_') and filename.endswith('.sql'):
                    filepath = os.path.join(self.backup_folder, filename)
                    backup_files.append((filepath, os.path.getctime(filepath)))
            
            # ترتيب حسب التاريخ (الأحدث أولاً)
            backup_files.sort(key=lambda x: x[1], reverse=True)
            
            # حذف النسخ الزائدة
            if len(backup_files) > self.max_backups:
                for filepath, _ in backup_files[self.max_backups:]:
                    os.remove(filepath)
                    print(f"🗑️ تم حذف نسخة قديمة: {os.path.basename(filepath)}")
                    
        except Exception as e:
            print(f"خطأ في تنظيف النسخ القديمة: {str(e)}")
    
    def get_backup_status(self):
        """الحصول على حالة النسخ الاحتياطية"""
        try:
            backup_files = []
            for filename in os.listdir(self.backup_folder):
                if filename.startswith('backup_') and filename.endswith('.sql'):
                    filepath = os.path.join(self.backup_folder, filename)
                    size = os.path.getsize(filepath)
                    mtime = os.path.getmtime(filepath)
                    backup_files.append({
                        'filename': filename,
                        'size_kb': round(size / 1024, 2),
                        'date': datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                    })
            
            backup_files.sort(key=lambda x: x['date'], reverse=True)
            return backup_files
            
        except Exception as e:
            print(f"خطأ في الحصول على حالة النسخ: {str(e)}")
            return []

# إنشاء نظام النسخ الاحتياطي
backup_system = AutoBackupSystem()

def daily_backup():
    """نسخة احتياطية يومية"""
    print("🔄 بدء النسخة الاحتياطية اليومية...")
    backup_system.create_comprehensive_backup()

def weekly_backup():
    """نسخة احتياطية أسبوعية خاصة"""
    print("📅 بدء النسخة الاحتياطية الأسبوعية...")
    filename = backup_system.create_comprehensive_backup()
    if filename:
        # إنشاء نسخة أسبوعية خاصة
        weekly_filename = filename.replace('backup_', 'weekly_backup_')
        os.rename(filename, weekly_filename)
        print(f"📦 نسخة أسبوعية: {weekly_filename}")

def run_scheduler():
    """تشغيل المجدول في خيط منفصل"""
    while True:
        schedule.run_pending()
        time.sleep(60)  # فحص كل دقيقة

def start_auto_backup():
    """بدء نظام النسخ الاحتياطي التلقائي"""
    # جدولة النسخ الاحتياطية
    schedule.every().day.at("02:00").do(daily_backup)  # يومياً في الساعة 2 صباحاً
    schedule.every().sunday.at("03:00").do(weekly_backup)  # أسبوعياً يوم الأحد
    
    # نسخة احتياطية فورية عند البدء
    print("🚀 بدء نظام النسخ الاحتياطي التلقائي...")
    backup_system.create_comprehensive_backup()
    
    # بدء المجدول
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    print("✅ نظام النسخ الاحتياطي التلقائي يعمل الآن!")
    print("📋 جدولة النسخ:")
    print("   - يومياً في الساعة 2:00 صباحاً")
    print("   - أسبوعياً يوم الأحد في الساعة 3:00 صباحاً")
    print("   - الاحتفاظ بآخر 30 نسخة احتياطية")

if __name__ == "__main__":
    start_auto_backup()
    
    # عرض حالة النسخ الحالية
    status = backup_system.get_backup_status()
    if status:
        print("\n📊 النسخ الاحتياطية الموجودة:")
        for backup in status[:5]:  # عرض آخر 5 نسخ
            print(f"   {backup['filename']} - {backup['size_kb']} KB - {backup['date']}")
    
    # إبقاء البرنامج يعمل
    try:
        while True:
            time.sleep(3600)  # نوم لمدة ساعة
    except KeyboardInterrupt:
        print("\n⏹️ تم إيقاف نظام النسخ الاحتياطي")