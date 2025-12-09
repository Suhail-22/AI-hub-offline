// ===== إدارة التخزين =====
import { CONFIG } from './config.js';

export class StorageManager {
    constructor() {
        this.key = CONFIG.STORAGE_KEY;
        this.settings = this.loadSettings();
        this.conversations = this.loadConversations();
    }
    
    // تحميل الإعدادات
    loadSettings() {
        const saved = localStorage.getItem(`${this.key}_settings`);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            theme: 'light',
            autoSave: true,
            compareMode: false,
            currentModel: 'phi3',
            thinkingMode: false,
            webSearch: false
        };
    }
    
    // حفظ الإعدادات
    saveSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        localStorage.setItem(`${this.key}_settings`, JSON.stringify(this.settings));
        return this.settings;
    }
    
    // تحميل المحادثات
    loadConversations() {
        const saved = localStorage.getItem(`${this.key}_conversations`);
        return saved ? JSON.parse(saved) : [];
    }
    
    // حفظ محادثة
    saveConversation(conversation) {
        if (!CONFIG.AUTO_SAVE && !this.settings.autoSave) return;
        
        this.conversations.unshift({
            ...conversation,
            id: `conv_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
        
        // حفظ آخر 50 محادثة فقط
        if (this.conversations.length > CONFIG.MAX_CONVERSATIONS) {
            this.conversations = this.conversations.slice(0, CONFIG.MAX_CONVERSATIONS);
        }
        
        localStorage.setItem(`${this.key}_conversations`, JSON.stringify(this.conversations));
    }
    
    // حذف محادثة
    deleteConversation(conversationId) {
        this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
        localStorage.setItem(`${this.key}_conversations`, JSON.stringify(this.conversations));
    }
    
    // مسح جميع البيانات
    clearAllData() {
        localStorage.removeItem(`${this.key}_settings`);
        localStorage.removeItem(`${this.key}_conversations`);
        this.settings = this.loadSettings();
        this.conversations = [];
    }
    
    // الحصول على معلومات التخزين
    getStorageInfo() {
        let totalSize = 0;
        
        // حساب حجم المحادثات
        const conversationsStr = localStorage.getItem(`${this.key}_conversations`);
        if (conversationsStr) {
            totalSize += conversationsStr.length;
        }
        
        // حساب حجم الإعدادات
        const settingsStr = localStorage.getItem(`${this.key}_settings`);
        if (settingsStr) {
            totalSize += settingsStr.length;
        }
        
        // تحويل للـ MB
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        return {
            used: sizeInMB,
            quota: 50,
            percentage: Math.min((sizeInMB / 50) * 100, 100)
        };
    }
}

// تصدير نسخة واحدة من StorageManager
export const storage = new StorageManager();