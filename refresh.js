// This file prevents WebSocket errors from browser extensions
// It provides a safe fallback if refresh.js is requested

(function() {
    'use strict';
    
    // تحقق من وجود بيئة تطوير
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    // عدم محاولة الاتصال بـ WebSocket في الإنتاج
    if (!isDevelopment) {
        console.log('🌐 وضع الإنتاج - تم تعطيل live reload');
        return;
    }
    
    // في وضع التطوير فقط، يمكن محاولة الاتصال
    console.log('🔄 Live reload متاح في وضع التطوير');
})();
