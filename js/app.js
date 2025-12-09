// ===== التطبيق الرئيسي =====
class AIHubApp {
    constructor() {
        this.currentModel = 'phi3';
        this.messages = [];
        // ... المتغيرات
    }

    init() {
        console.log('🚀 بدء تشغيل التطبيق...');
        this.loadSettings();
        this.initUI();
        this.setupEventListeners();
        this.showWelcomeMessage();
        console.log('✅ التطبيق جاهز');
    }

    toggleSidebar() {
        // ... المنطق
    }

    sendMessage() {
        // ... المنطق
    }

    // ... باقي الدوال (500 سطر)
}

// ===== تهيئة التطبيق =====
window.app = new AIHubApp();