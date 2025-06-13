// نظام الأصوات للتطبيق
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.initializeAudioContext();
        this.generateSounds();
        this.attachEventListeners();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not supported');
        }
    }

    // إنشاء الأصوات باستخدام Web Audio API
    generateSounds() {
        if (!this.audioContext) return;

        // صوت النقر الرسمي - نبرة هادئة ومهذبة
        this.sounds.click = this.createTone(600, 0.08, 'sine');
        
        // صوت النجاح الرسمي - نغمة إيجابية احترافية
        this.sounds.success = this.createChord([440, 523, 659], 0.22, 'sine');
        
        // صوت التحذير الرسمي - نغمة تنبيه مهذبة
        this.sounds.warning = this.createTone(523, 0.15, 'triangle');
        
        // صوت الخطأ الرسمي - نغمة تنبيه قصيرة ومهذبة
        this.sounds.error = this.createTone(330, 0.18, 'sine');
        
        // صوت الحذف الرسمي - نغمة هادئة تنازلية
        this.sounds.delete = this.createDescendingTone(440, 330, 0.18, 'sine');
        
        // صوت الطباعة الرسمي - نغمة تصاعدية احترافية
        this.sounds.print = this.createAscendingTone(440, 523, 0.16, 'sine');
        
        // صوت فتح النافذة الرسمي - نغمة ترحيبية مهذبة
        this.sounds.modal = this.createChord([349, 440, 523], 0.18, 'sine');
        
        // صوت الإغلاق الرسمي - نغمة وداع مهذبة
        this.sounds.close = this.createDescendingTone(440, 349, 0.12, 'sine');
        
        // صوت الإيداع الرسمي - نغمة إيجابية احترافية
        this.sounds.deposit = this.createAscendingTone(440, 587, 0.16, 'sine');
        
        // صوت السحب الرسمي - نغمة تنازلية احترافية
        this.sounds.withdraw = this.createDescendingTone(587, 440, 0.16, 'sine');
    }

    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    createChord(frequencies, duration, type = 'sine') {
        return () => {
            if (!this.audioContext) return;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = type;
                    
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                }, index * 50);
            });
        };
    }

    createAscendingTone(startFreq, endFreq, duration, type = 'sine') {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    createDescendingTone(startFreq, endFreq, duration, type = 'sine') {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            try {
                this.sounds[soundName]();
            } catch (error) {
                console.warn('Error playing sound:', error);
            }
        }
    }

    attachEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // أصوات الأزرار الرئيسية
            this.addClickSound('button[onclick*="openRecords"]', 'modal');
            this.addClickSound('button[onclick*="openMerchantsDebts"]', 'modal');
            this.addClickSound('button[onclick*="openMerchantStatement"]', 'modal');
            this.addClickSound('button[onclick*="openWithdrawal"]', 'modal');
            this.addClickSound('button[onclick*="openPartnersManagement"]', 'modal');

            // أصوات الحفظ والإضافة
            this.addClickSound('button[onclick*="saveEntry"]', 'success');
            this.addClickSound('button[onclick*="addPayment"]', 'deposit');
            this.addClickSound('button[onclick*="addWithdrawal"]', 'withdraw');
            this.addClickSound('button[onclick*="addPartnerTransaction"]', 'success');
            this.addClickSound('button[onclick*="distributeProfit"]', 'success');

            // أصوات الحذف
            this.addClickSound('button[onclick*="delete"]', 'delete');

            // أصوات الطباعة
            this.addClickSound('button[onclick*="print"]', 'print');

            // أصوات الإغلاق
            this.addClickSound('.btn-close', 'close');
            this.addClickSound('button[data-bs-dismiss="modal"]', 'close');

            // أصوات النقر العادي للأزرار الأخرى
            this.addClickSoundToAllButtons();
        });
    }

    addClickSound(selector, soundName) {
        document.addEventListener('click', (e) => {
            if (e.target.matches(selector) || e.target.closest(selector)) {
                this.playSound(soundName);
            }
        });
    }

    addClickSoundToAllButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && !e.target.hasAttribute('data-sound-handled')) {
                // تحديد نوع الصوت حسب كلاسات الزر
                let soundType = 'click';
                
                if (e.target.classList.contains('btn-success')) {
                    soundType = 'success';
                } else if (e.target.classList.contains('btn-danger')) {
                    soundType = 'error';
                } else if (e.target.classList.contains('btn-warning')) {
                    soundType = 'warning';
                } else if (e.target.classList.contains('btn-primary')) {
                    soundType = 'modal';
                }
                
                this.playSound(soundType);
                e.target.setAttribute('data-sound-handled', 'true');
            }
        });
    }

    // تمكين/تعطيل الأصوات
    toggleSounds() {
        if (this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
                return true;
            } else {
                this.audioContext.suspend();
                return false;
            }
        }
        return false;
    }
}

// إنشاء مدير الأصوات
window.soundManager = new SoundManager();

// دالة لتشغيل صوت محدد
function playUISound(soundName) {
    if (window.soundManager) {
        window.soundManager.playSound(soundName);
    }
}

// دالة لتمكين/تعطيل الأصوات
function toggleUISounds() {
    if (window.soundManager) {
        const enabled = window.soundManager.toggleSounds();
        showAlert(enabled ? 'تم تفعيل الأصوات' : 'تم إيقاف الأصوات', 'info');
        return enabled;
    }
    return false;
}