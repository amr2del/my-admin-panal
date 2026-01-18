// تسجيل الدخول
const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');

// تحميل حالة "تذكرني"
window.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
        document.getElementById('username').value = savedUsername;
        document.getElementById('rememberMe').checked = true;
    }
});

// معالجة تسجيل الدخول
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // إخفاء أي تنبيهات سابقة
    hideAlert();
    
    // تحقق من الحقول
    if (!username || !password) {
        showAlert('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    // إضافة حالة التحميل
    const loginBtn = loginForm.querySelector('.login-btn');
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    try {
        // محاولة تسجيل الدخول
        let result;
        
        // التحقق من وجود electronAPI (في تطبيق Electron)
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.login) {
            result = await window.electronAPI.login(username, password);
        } else {
            // للاختبار في المتصفح - استخدام بيانات افتراضية
            result = {
                success: username === 'admin' && password === 'admin123',
                user: { username: 'admin', fullName: 'المدير', role: 'admin' }
            };
        }
        
        if (result.success) {
            // حفظ اسم المستخدم إذا كان "تذكرني" مفعل
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }
            
            // حفظ معلومات الجلسة في localStorage (يعمل عبر النوافذ في Electron)
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('loginTime', new Date().toISOString());
            
            showAlert('✅ تم تسجيل الدخول بنجاح! جاري التحميل...', 'success');
            
            // في المتصفح، إعادة توجيه لصفحة التطبيق
            if (typeof window.electronAPI === 'undefined') {
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
            // في تطبيق Electron، النافذة الرئيسية ستفتح تلقائياً من main.js
        } else {
            showAlert('❌ اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showAlert('❌ حدث خطأ في تسجيل الدخول', 'error');
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
});

// إظهار/إخفاء كلمة المرور
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// إظهار التنبيه
function showAlert(message, type) {
    loginAlert.textContent = message;
    loginAlert.className = `alert ${type} show`;
}

// إخفاء التنبيه
function hideAlert() {
    loginAlert.className = 'alert';
}

// التعامل مع Enter في حقول الإدخال
document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('password').focus();
    }
});
