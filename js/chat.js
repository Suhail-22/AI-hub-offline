// ===== إدارة المحادثات =====
import { storage } from './storage.js';
import { modelManager } from './models.js';

export class ChatManager {
    constructor() {
        this.currentConversation = null;
        this.messages = [];
    }
    
    // بدء محادثة جديدة
    startNewConversation() {
        this.currentConversation = {
            id: `conv_${Date.now()}`,
            model: modelManager.getCurrentModel().id,
            messages: [],
            timestamp: new Date().toISOString()
        };
        
        this.messages = [];
        return this.currentConversation;
    }
    
    // إضافة رسالة للمحادثة
    addMessage(sender, content, modelId = null) {
        const message = {
            id: `msg_${Date.now()}`,
            sender,
            content,
            modelId: modelId || (sender === 'ai' ? modelManager.getCurrentModel().id : null),
            timestamp: new Date().toISOString(),
            highlighted: false
        };
        
        this.messages.push(message);
        
        if (this.currentConversation) {
            this.currentConversation.messages.push(message);
        }
        
        return message;
    }
    
    // حفظ المحادثة
    saveConversation() {
        if (this.currentConversation && this.messages.length > 0) {
            storage.saveConversation({
                ...this.currentConversation,
                messages: this.messages
            });
        }
    }
    
    // تحميل محادثة سابقة
    loadConversation(conversationId) {
        const conversation = storage.conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            this.currentConversation = conversation;
            this.messages = conversation.messages;
            return conversation;
        }
        return null;
    }
    
    // حذف المحادثة الحالية
    deleteCurrentConversation() {
        if (this.currentConversation) {
            storage.deleteConversation(this.currentConversation.id);
            this.currentConversation = null;
            this.messages = [];
        }
    }
    
    // تصدير المحادثة
    exportConversation() {
        if (this.messages.length === 0) return null;
        
        const chatData = {
            conversation: this.currentConversation,
            messages: this.messages,
            exportDate: new Date().toISOString(),
            appVersion: '2.0.0'
        };
        
        return chatData;
    }
    
    // تحليل الرسالة (للتمييز بالمربع الأحمر)
    analyzeMessage(content) {
        const importantKeywords = [
            'مهم', 'عاجل', 'ضروري', 'انتبه', 'تحذير',
            'تنبيه', 'خطر', 'فوري', 'حيوي', 'سرّي',
            'مميز', 'خاص', 'سري', 'حساس', 'أولوية'
        ];
        
        const arabicContent = content.toLowerCase();
        return importantKeywords.some(keyword => arabicContent.includes(keyword));
    }
}

// تصدير نسخة واحدة من ChatManager
export const chatManager = new ChatManager();