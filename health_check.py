#!/usr/bin/env python3
"""
نظام مراقبة صحة الخادم
يتحقق من حالة النظام ويعيد تشغيله عند الحاجة
"""

import os
import time
import requests
import subprocess
from datetime import datetime

class HealthMonitor:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.check_interval = 30  # ثانية
        self.max_failures = 3
        self.failure_count = 0
        
    def check_health(self):
        """فحص صحة الخادم"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.failure_count = 0
                return True
        except Exception as e:
            print(f"Health check failed: {e}")
            
        self.failure_count += 1
        return False
    
    def restart_server(self):
        """إعادة تشغيل الخادم"""
        try:
            print(f"{datetime.now()}: Restarting server due to health check failures")
            # يمكن إضافة أوامر إعادة التشغيل هنا
            return True
        except Exception as e:
            print(f"Failed to restart server: {e}")
            return False
    
    def monitor(self):
        """مراقبة مستمرة"""
        while True:
            if not self.check_health():
                if self.failure_count >= self.max_failures:
                    self.restart_server()
                    self.failure_count = 0
            time.sleep(self.check_interval)

if __name__ == "__main__":
    monitor = HealthMonitor()
    monitor.monitor()