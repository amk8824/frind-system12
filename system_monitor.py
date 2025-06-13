"""
نظام مراقبة شامل لضمان استقرار الخادم
يراقب الذاكرة، الاتصالات، وأداء النظام
"""

import threading
import time
import logging
import gc
import psutil
from datetime import datetime

class SystemMonitor:
    def __init__(self):
        self.monitoring = True
        self.memory_threshold = 85  # نسبة مئوية
        self.cpu_threshold = 90
        self.check_interval = 60  # ثانية
        
    def monitor_memory(self):
        """مراقبة استخدام الذاكرة"""
        while self.monitoring:
            try:
                memory = psutil.virtual_memory()
                
                if memory.percent > self.memory_threshold:
                    logging.warning(f"استخدام مرتفع للذاكرة: {memory.percent}%")
                    gc.collect()  # تنظيف الذاكرة
                    
                    # فحص مرة أخرى بعد التنظيف
                    memory_after = psutil.virtual_memory()
                    logging.info(f"الذاكرة بعد التنظيف: {memory_after.percent}%")
                    
            except Exception as e:
                logging.error(f"خطأ في مراقبة الذاكرة: {e}")
                
            time.sleep(self.check_interval)
    
    def monitor_connections(self):
        """مراقبة الاتصالات النشطة"""
        while self.monitoring:
            try:
                connections = psutil.net_connections(kind='inet')
                active_connections = len([c for c in connections if c.status == 'ESTABLISHED'])
                
                if active_connections > 100:  # حد أقصى للاتصالات
                    logging.warning(f"عدد كبير من الاتصالات النشطة: {active_connections}")
                    
            except Exception as e:
                logging.error(f"خطأ في مراقبة الاتصالات: {e}")
                
            time.sleep(self.check_interval)
    
    def monitor_cpu(self):
        """مراقبة استخدام المعالج"""
        while self.monitoring:
            try:
                cpu_percent = psutil.cpu_percent(interval=1)
                
                if cpu_percent > self.cpu_threshold:
                    logging.warning(f"استخدام مرتفع للمعالج: {cpu_percent}%")
                    
            except Exception as e:
                logging.error(f"خطأ في مراقبة المعالج: {e}")
                
            time.sleep(self.check_interval)
    
    def start_monitoring(self):
        """بدء المراقبة في خيوط منفصلة"""
        threads = [
            threading.Thread(target=self.monitor_memory, daemon=True),
            threading.Thread(target=self.monitor_connections, daemon=True),
            threading.Thread(target=self.monitor_cpu, daemon=True)
        ]
        
        for thread in threads:
            thread.start()
            
        logging.info("تم بدء نظام المراقبة الشامل")
    
    def stop_monitoring(self):
        """إيقاف المراقبة"""
        self.monitoring = False
        logging.info("تم إيقاف نظام المراقبة")

# إنشاء مثيل عام للمراقب
system_monitor = SystemMonitor()

def start_system_monitoring():
    """بدء مراقبة النظام"""
    system_monitor.start_monitoring()

def stop_system_monitoring():
    """إيقاف مراقبة النظام"""
    system_monitor.stop_monitoring()