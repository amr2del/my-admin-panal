// نظام الأصوات التفاعلية للتطبيق

class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.audioContext = null;
        
        // أنواع الأصوات المتاحة لكل فئة
        this.soundProfiles = {
            click: {
                default: { freq: 800, type: 'sine', duration: 0.1 },
                soft: { freq: 600, type: 'sine', duration: 0.12 },
                sharp: { freq: 1200, type: 'square', duration: 0.06 },
                deep: { freq: 400, type: 'sine', duration: 0.15 },
                high: { freq: 1500, type: 'sine', duration: 0.08 }
            },
            button: {
                default: { freq: 1000, type: 'sine', duration: 0.08 },
                soft: { freq: 800, type: 'sine', duration: 0.1 },
                sharp: { freq: 1400, type: 'square', duration: 0.05 },
                deep: { freq: 500, type: 'sine', duration: 0.12 },
                high: { freq: 1800, type: 'sine', duration: 0.06 }
            },
            nav: {
                default: { freq: 600, type: 'sine', duration: 0.12 },
                soft: { freq: 500, type: 'sine', duration: 0.15 },
                sharp: { freq: 900, type: 'square', duration: 0.08 },
                deep: { freq: 350, type: 'sine', duration: 0.18 },
                high: { freq: 1100, type: 'sine', duration: 0.1 }
            },
            success: {
                default: { frequencies: [523.25, 659.25, 783.99], type: 'sine', duration: 0.4 },
                soft: { frequencies: [440, 523.25, 659.25], type: 'sine', duration: 0.5 },
                sharp: { frequencies: [659.25, 783.99, 987.77], type: 'square', duration: 0.3 },
                deep: { frequencies: [261.63, 329.63, 392.00], type: 'sine', duration: 0.6 },
                melodic: { frequencies: [523.25, 587.33, 659.25, 783.99], type: 'sine', duration: 0.5 }
            },
            error: {
                default: { start: 400, end: 300, type: 'sawtooth', duration: 0.3 },
                soft: { start: 350, end: 280, type: 'sine', duration: 0.35 },
                sharp: { start: 500, end: 350, type: 'square', duration: 0.2 },
                deep: { start: 300, end: 200, type: 'sawtooth', duration: 0.4 },
                alert: { start: 450, end: 250, type: 'triangle', duration: 0.25 }
            },
            warning: {
                default: { freq: 700, type: 'square', duration: 0.2 },
                soft: { freq: 600, type: 'sine', duration: 0.25 },
                sharp: { freq: 900, type: 'square', duration: 0.15 },
                deep: { freq: 500, type: 'triangle', duration: 0.3 },
                urgent: { freq: 800, type: 'sawtooth', duration: 0.18 }
            }
        };
        
        // الإعدادات الحالية لكل نوع
        this.currentProfiles = {
            click: 'default',
            button: 'default',
            nav: 'default',
            success: 'default',
            error: 'default',
            warning: 'default'
        };
        
        this.init();
    }

    init() {
        // إنشاء Audio Context
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio Context not supported');
        }

        // تحميل إعدادات الصوت المحفوظة
        const savedEnabled = localStorage.getItem('soundEnabled');
        const savedVolume = localStorage.getItem('soundVolume');
        const savedProfiles = localStorage.getItem('soundProfiles');
        
        if (savedEnabled !== null) {
            this.enabled = savedEnabled === 'true';
        }
        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
        }
        if (savedProfiles !== null) {
            try {
                this.currentProfiles = JSON.parse(savedProfiles);
            } catch (e) {
                console.warn('Failed to load sound profiles');
            }
        }

        // إضافة مستمعين للأحداث
        this.attachListeners();
    }

    // دالة مساعدة لتشغيل صوت بسيط
    playSimpleSound(profile, volumeMultiplier = 1) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = profile.freq;
        oscillator.type = profile.type;

        gainNode.gain.setValueAtTime(this.volume * volumeMultiplier, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + profile.duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + profile.duration);
    }

    // توليد صوت نقرة بسيطة
    playClick() {
        if (!this.enabled || !this.audioContext) return;
        const profile = this.soundProfiles.click[this.currentProfiles.click];
        this.playSimpleSound(profile);
    }

    // صوت نقرة ناعمة للأزرار
    playButtonClick() {
        if (!this.enabled || !this.audioContext) return;
        const profile = this.soundProfiles.button[this.currentProfiles.button];
        this.playSimpleSound(profile, 0.8);
    }

    // صوت نقرة للقوائم الجانبية
    playNavClick() {
        if (!this.enabled || !this.audioContext) return;
        const profile = this.soundProfiles.nav[this.currentProfiles.nav];
        this.playSimpleSound(profile, 0.6);
    }

    // صوت نجاح
    playSuccess() {
        if (!this.enabled || !this.audioContext) return;
        
        const profile = this.soundProfiles.success[this.currentProfiles.success];
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const step = profile.duration / profile.frequencies.length;
        profile.frequencies.forEach((freq, index) => {
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + (step * index));
        });
        
        oscillator.type = profile.type;

        gainNode.gain.setValueAtTime(this.volume * 0.7, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + profile.duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + profile.duration);
    }

    // صوت خطأ
    playError() {
        if (!this.enabled || !this.audioContext) return;

        const profile = this.soundProfiles.error[this.currentProfiles.error];
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(profile.start, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(profile.end, this.audioContext.currentTime + 0.1);
        oscillator.type = profile.type;

        gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + profile.duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + profile.duration);
    }

    // صوت تحذير
    playWarning() {
        if (!this.enabled || !this.audioContext) return;

        const profile = this.soundProfiles.warning[this.currentProfiles.warning];
        this.playSimpleSound(profile, 0.4);
    }

    // إرفاق المستمعين لجميع العناصر التفاعلية
    attachListeners() {
        // الانتظار حتى يتم تحميل DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachAllListeners());
        } else {
            this.attachAllListeners();
        }
    }

    attachAllListeners() {
        // أزرار القائمة الجانبية
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => this.playNavClick());
        });

        // جميع الأزرار
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => this.playButtonClick());
        });

        // البطاقات القابلة للنقر
        document.querySelectorAll('.stat-card, .card').forEach(card => {
            card.addEventListener('click', () => this.playClick());
        });

        // حقول الإدخال عند التركيز
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('focus', () => {
                if (this.enabled && this.audioContext) {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.frequency.value = 900;
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                }
            });
        });
    }

    // تفعيل/تعطيل الأصوات
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }

    // تعيين مستوى الصوت
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        localStorage.setItem('soundVolume', this.volume);
    }

    // تغيير نمط صوت معين
    setSoundProfile(category, profile) {
        if (this.soundProfiles[category] && this.soundProfiles[category][profile]) {
            this.currentProfiles[category] = profile;
            localStorage.setItem('soundProfiles', JSON.stringify(this.currentProfiles));
            return true;
        }
        return false;
    }

    // الحصول على النمط الحالي لفئة معينة
    getCurrentProfile(category) {
        return this.currentProfiles[category] || 'default';
    }

    // الحصول على جميع الأنماط المتاحة لفئة معينة
    getAvailableProfiles(category) {
        if (this.soundProfiles[category]) {
            return Object.keys(this.soundProfiles[category]);
        }
        return [];
    }

    // إعادة إرفاق المستمعين (للعناصر الديناميكية)
    reattach() {
        this.attachAllListeners();
    }
}

// إنشاء نسخة عامة من مدير الأصوات
const soundManager = new SoundManager();

// تصدير للاستخدام العام
window.soundManager = soundManager;

// إعادة إرفاق المستمعين عند تحديث المحتوى
const originalShowTab = window.showTab;
if (typeof originalShowTab === 'function') {
    window.showTab = function(...args) {
        const result = originalShowTab.apply(this, args);
        setTimeout(() => soundManager.reattach(), 100);
        return result;
    };
}

// إضافة أصوات لإشعارات النجاح والخطأ
const originalShowNotification = window.showNotification;
if (typeof originalShowNotification === 'function') {
    window.showNotification = function(message, type) {
        const result = originalShowNotification.apply(this, arguments);
        
        if (type === 'success') {
            soundManager.playSuccess();
        } else if (type === 'error') {
            soundManager.playError();
        } else if (type === 'warning') {
            soundManager.playWarning();
        }
        
        return result;
    };
}

console.log('🔊 Sound Manager initialized');
