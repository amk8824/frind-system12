#!/usr/bin/env python3
# نص إنشاء النسخة الاحتياطية الشاملة
import os
import psycopg2
from datetime import datetime

def create_backup():
    """إنشاء نسخة احتياطية شاملة من قاعدة البيانات"""
    
    # الاتصال بقاعدة البيانات
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    
    # اسم ملف النسخة الاحتياطية
    backup_filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    
    with open(backup_filename, 'w', encoding='utf-8') as f:
        f.write("-- نسخة احتياطية شاملة لنظام الأصدقاء للتخليص الكمركي\n")
        f.write(f"-- تاريخ الإنشاء: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        # 1. نسخ بيانات السجلات التجارية
        f.write("-- بيانات السجلات التجارية\n")
        cur.execute("SELECT * FROM merchant_records ORDER BY id")
        records = cur.fetchall()
        for record in records:
            f.write(f"INSERT INTO merchant_records (merchant_name, foreign_driver, foreign_car, local_driver, local_car, date, goods_type, notes, fees, advance, my_profit, addition, returned, created_at) VALUES ('{record[1]}', '{record[2] or ''}', '{record[3] or ''}', '{record[4] or ''}', '{record[5] or ''}', '{record[6]}', '{record[7] or ''}', '{record[8] or ''}', {record[9]}, {record[10]}, {record[11]}, {record[12]}, {record[13]}, '{record[14]}');\n")
        
        # 2. نسخ بيانات مدفوعات التجار
        f.write("\n-- بيانات مدفوعات التجار\n")
        cur.execute("SELECT * FROM merchant_payments ORDER BY id")
        payments = cur.fetchall()
        for payment in payments:
            f.write(f"INSERT INTO merchant_payments (merchant_name, amount, payment_date, balance_before, balance_after, notes, created_at) VALUES ('{payment[1]}', {payment[2]}, '{payment[3]}', {payment[4]}, {payment[5]}, '{payment[6] or ''}', '{payment[7]}');\n")
        
        # 3. نسخ بيانات السحوبات
        f.write("\n-- بيانات السحوبات الخارجية\n")
        cur.execute("SELECT * FROM withdrawals ORDER BY id")
        withdrawals = cur.fetchall()
        for withdrawal in withdrawals:
            f.write(f"INSERT INTO withdrawals (amount, date, description, notes, created_at) VALUES ({withdrawal[1]}, '{withdrawal[2]}', '{withdrawal[3] or ''}', '{withdrawal[4] or ''}', '{withdrawal[5]}');\n")
        
        # 4. نسخ بيانات الشركاء
        f.write("\n-- بيانات الشركاء\n")
        cur.execute("SELECT * FROM partners ORDER BY id")
        partners = cur.fetchall()
        for partner in partners:
            f.write(f"INSERT INTO partners (name, phone, email, profit_percentage, is_active, created_at) VALUES ('{partner[1]}', '{partner[2] or ''}', '{partner[3] or ''}', {partner[4]}, {partner[5]}, '{partner[6]}');\n")
        
        # 5. نسخ بيانات معاملات الشركاء
        f.write("\n-- بيانات معاملات الشركاء\n")
        cur.execute("SELECT * FROM partner_transactions ORDER BY id")
        transactions = cur.fetchall()
        for transaction in transactions:
            f.write(f"INSERT INTO partner_transactions (partner_id, transaction_type, amount, date, description, notes, created_at) VALUES ({transaction[1]}, '{transaction[2]}', {transaction[3]}, '{transaction[4]}', '{transaction[5] or ''}', '{transaction[6] or ''}', '{transaction[7]}');\n")
        
        # 6. نسخ بيانات المستخدمين (بدون كلمات المرور لأسباب أمنية)
        f.write("\n-- بيانات المستخدمين (بدون كلمات المرور)\n")
        cur.execute("SELECT id, username, email, full_name, role, active, created_at, last_login, created_by FROM users ORDER BY id")
        users = cur.fetchall()
        for user in users:
            f.write(f"-- المستخدم: {user[1]} - {user[3]} - الدور: {user[4]}\n")
    
    cur.close()
    conn.close()
    
    print(f"تم إنشاء النسخة الاحتياطية: {backup_filename}")
    return backup_filename

if __name__ == "__main__":
    create_backup()