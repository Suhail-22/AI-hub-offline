// ===== التطبيق الرئيسي =====
import { CONFIG } from './config.js';
import { storage } from './storage.js';
import { modelManager } from './models.js';
import { chatManager } from './chat.js';
import { ui } from './ui.js';
import { pwaManager } from './pwa.js';

class AIHubApp {
    constructor() {
        this.appName = CONFIG.APP_NAME;
        this.version = CONFIG.APP_VERSION;
        this.isInitialized = false;
    }
    
    // تهيئة التطبيق
    async initialize() {
        console.log(`🚀 بدء تشغيل ${this.appName} v${this.version}...`);
        
        try {
            // تهيئة واجهة المستخدم
            ui.initializeUI();
            
            // بدء محادثة جديدة
            chatManager.startNewConversation();
            
            // تحديث معلومات التخزين
            ui.updateStorageInfo();
            
            // عرض رسالة ترحيب
            this.showWelcomeMessage();
            
            // جعل الواجهة متاحة عالميًا
            window.ui = ui;
            
            this.isInitialized = true;
            console.log('✅ التطبيق جاهز للاستخدام');
            
            ui.showAlert('مرحبًا بك! التطبيق يعمل الآن بدون إنترنت', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة التطبيق:', error);
            ui.showAlert('حدث خطأ أثناء تهيئة التطبيق', 'error');
        }
    }
    
    // عرض رسالة ترحيب عشوائية
    showWelcomeMessage() {
        const messages = [
            "مرحبًا! أنا مساعدك الذكي. اختر نموذجًا من القائمة لتبدأ المحادثة.",
            "كل نموذج له تخصصه: Phi-3 سريع، Qwen-3 متقدم، DeepSeek مبرمج.",
            "جرب وضع المقارنة لترى كيف تختلف ردود النماذج.",
            "التطبيق يعمل بدون إنترنت بعد التحميل الأول."
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = randomMessage;
        }
    }
    
    // بدء التطبيق
    start() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initialize();
        });
    }
}

// إنشاء وتشغيل التطبيق
const app = new AIHubApp();
app.start();

// جعل التطبيق متاحًا عالميًا للتشغيل اليدوي
window.AIHubApp = AIHubApp;
window.app = app;

// تصدير للاستخدام كـ module
export { app };