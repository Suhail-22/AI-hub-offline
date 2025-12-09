// ===== التطبيق الرئيسي =====
class AIHubApp {
    constructor() {
        this.currentModel = 'phi3';
        this.messages = [];
        this.isOnline = navigator.onLine;
        this.isSidebarOpen = false;
        this.isCompareMode = false;
        this.isDarkMode = false;
        this.models = {
            phi3: { name: 'Phi-3-mini', icon: '⚡', color: '#34a853' },
            qwen: { name: 'Qwen-3-Max', icon: '👑', color: '#1a73e8' },
            deepseek: { name: 'DeepSeek-Coder', icon: '💻', color: '#ea4335' }
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateConnectionStatus();
        this.setupServiceWorker();
        this.setupInstallPrompt();
        
        // تحديث شريط الإدخال
        this.updateInputLayout();
        
        this.showAlert('مرحبًا! التطبيق جاهز للاستخدام', 'success');
    }

    setupEventListeners() {
        // زر الإرسال
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        
        // Enter للإرسال
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // مراقبة الاتصال
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
    }

    // ===== تخطيط شريط الإدخال الجديد =====
    updateInputLayout() {
        const inputContainer = document.querySelector('.input-container');
        if (!inputContainer) return;
        
        inputContainer.innerHTML = `
            <div class="input-wrapper">
                <div class="input-left-buttons">
                    <button class="input-btn small-btn" onclick="app.attachFile()" title="إرفاق ملف">
                        📎
                    </button>
                    <button class="input-btn small-btn" onclick="app.toggleThinkingMode()" title="وضع التفكير">
                        🤔
                    </button>
                </div>
                
                <div class="input-main">
                    <textarea 
                        id="messageInput" 
                        placeholder="اكتب رسالتك هنا..."
                        rows="1"
                        oninput="app.autoResize(this)"
                    ></textarea>
                </div>
                
                <div class="input-right-buttons">
                    <button class="input-btn small-btn" onclick="app.toggleWebSearch()" title="بحث على الويب">
                        🌐
                    </button>
                    <button class="input-btn send-btn" onclick="app.sendMessage()" id="sendButton" title="إرسال">
                        ➤
                    </button>
                </div>
            </div>
            <div class="input-hint">
                <span>اضغط Shift+Enter للسطر الجديد، Enter للإرسال</span>
            </div>
        `;
        
        // إضافة الـ CSS
        this.addInputStyles();
    }

    addInputStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .input-wrapper {
                display: flex;
                align-items: flex-end;
                gap: 8px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 24px;
                padding: 8px 12px;
            }
            
            .input-left-buttons, .input-right-buttons {
                display: flex;
                gap: 6px;
                flex-shrink: 0;
            }
            
            .input-main {
                flex: 1;
                min-width: 0;
            }
            
            .input-main textarea {
                width: 100%;
                padding: 10px 0;
                border: none;
                background: transparent;
                font-family: 'Tajawal', sans-serif;
                font-size: 16px;
                color: var(--text-color);
                resize: none;
                outline: none;
                line-height: 1.4;
                max-height: 120px;
                min-height: 24px;
            }
            
            .input-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--bg-tertiary);
                color: var(--text-color);
            }
            
            .input-btn.small-btn {
                width: 32px;
                height: 32px;
                font-size: 14px;
            }
            
            .input-btn:hover {
                background: var(--primary-color);
                color: white;
                transform: scale(1.05);
            }
            
            .send-btn {
                background: var(--primary-color);
                color: white;
                font-size: 18px;
            }
            
            .send-btn:hover {
                background: var(--primary-dark);
                transform: scale(1.1);
            }
            
            .input-hint {
                text-align: center;
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 8px;
                padding: 0 10px;
            }
            
            @media (max-width: 768px) {
                .input-wrapper {
                    padding: 6px 10px;
                }
                
                .input-btn {
                    width: 32px;
                    height: 32px;
                }
                
                .input-btn.small-btn {
                    width: 28px;
                    height: 28px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== إدارة النماذج =====
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // إضافة رسالة المستخدم
        this.addMessage('user', message);
        input.value = '';
        this.autoResize(input);
        
        // عرض حالة التفكير
        this.showThinking();
        
        // معالجة الرسالة
        setTimeout(() => {
            this.hideThinking();
            const response = this.generateResponse(message);
            this.addMessage('ai', response);
        }, 1000);
    }

    generateResponse(message) {
        const responses = {
            phi3: `⚡ **Phi-3-mini**:\nتم استلام رسالتك: "${message}"\n\nPhi-3-mini هو نموذج سريع وخفيف مثالي للمهام اليومية. يمكنني مساعدتك في:\n• الإجابة على الأسئلة العامة\n• الكتابة والتلخيص\n• المهام البسيطة`,
            
            qwen: `👑 **Qwen-3-Max**:\nسؤالك المميز: "${message}"\n\nQwen-3-Max يتميز بدعم ممتاز للغة العربية. أنا الأفضل في:\n• التحليل المعمق\n• الكتابة بالعربية الفصحى\n• الأسئلة الفلسفية والعلمية`,
            
            deepseek: `💻 **DeepSeek-Coder**:\n// معالجة: "${message}"\n\n/*\nأنا متخصص في البرمجة:\n1. كتابة وتصحيح الأكواد\n2. شرح المفاهيم البرمجية\n3. حل المشاكل الخوارزمية\n*/\n\n// جرب أن تطلب: "اكتب كود لـ [المهمة]"`
        };
        
        return responses[this.currentModel] || 'نموذج غير متاح';
    }

    addMessage(sender, content) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        // إخفاء الترحيب
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        
        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.id = messageId;
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-actions">
                        <button onclick="app.copyMessage('${messageId}')">📋</button>
                        <button onclick="app.highlightMessage('${messageId}')">⭐</button>
                    </div>
                </div>
            `;
        } else {
            const model = this.models[this.currentModel];
            messageDiv.innerHTML = `
                <div class="ai-message-content">
                    <div class="ai-header">
                        <span class="model-icon">${model.icon}</span>
                        <strong>${model.name}</strong>
                    </div>
                    <div class="message-text">${this.formatResponse(content)}</div>
                    <div class="message-actions">
                        <button onclick="app.copyMessage('${messageId}')">📋</button>
                        <button onclick="app.highlightMessage('${messageId}')">⭐</button>
                        <button onclick="app.downloadMessage('${messageId}')">💾</button>
                    </div>
                </div>
            `;
        }
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        
        // حفظ الرسالة
        this.messages.push({ id: messageId, sender, content, timestamp: new Date() });
    }

    highlightMessage(messageId) {
        const message = document.getElementById(messageId);
        if (!message) return;
        
        message.classList.toggle('highlighted');
        
        if (message.classList.contains('highlighted')) {
            this.showAlert('تم تمييز الرسالة', 'success');
        }
    }

    // ===== إدارة الاتصال =====
    updateConnectionStatus() {
        this.isOnline = navigator.onLine;
        const statusElement = document.getElementById('connectionStatus');
        
        if (statusElement) {
            statusElement.textContent = this.isOnline ? '🟢 متصل' : '🔴 غير متصل';
            statusElement.style.color = this.isOnline ? '#34a853' : '#ea4335';
        }
        
        // تحديث الإعدادات
        const offlineToggle = document.getElementById('offlineMode');
        if (offlineToggle) {
            offlineToggle.checked = !this.isOnline;
        }
        
        if (!this.isOnline) {
            this.showAlert('أنت الآن في وضع عدم الاتصال', 'info');
        }
    }

    // ===== PWA التثبيت =====
    setupInstallPrompt() {
        let deferredPrompt;
        const installBtn = document.getElementById('installBtn');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            if (installBtn) {
                installBtn.style.display = 'flex';
                installBtn.addEventListener('click', async () => {
                    installBtn.style.display = 'none';
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        this.showAlert('تم تثبيت التطبيق بنجاح!', 'success');
                    }
                    deferredPrompt = null;
                });
            }
        });
        
        window.addEventListener('appinstalled', () => {
            if (installBtn) installBtn.style.display = 'none';
            this.showAlert('تم تثبيت التطبيق', 'success');
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => {
                    console.log('Service Worker registered:', reg);
                    // تفعيل Service Worker فورًا
                    if (reg.active) reg.active.postMessage({ type: 'SKIP_WAITING' });
                })
                .catch(err => console.log('Service Worker registration failed:', err));
        }
    }

    // ===== الأدوات المساعدة =====
    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            left: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-family: 'Tajawal', sans-serif;
            z-index: 10000;
            text-align: center;
            animation: slideIn 0.3s ease;
        `;
        
        const bgColor = type === 'success' ? '#34a853' : 
                       type === 'error' ? '#ea4335' : '#1a73e8';
        alert.style.background = bgColor;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatResponse(text) {
        return text.replace(/\n/g, '<br>');
    }

    showThinking() {
        const container = document.getElementById('messagesContainer');
        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'thinking';
        thinkingDiv.innerHTML = `
            <div class="thinking-message">
                <div class="thinking-dots">
                    <span></span><span></span><span></span>
                </div>
                <span>جارٍ التفكير...</span>
            </div>
        `;
        container.appendChild(thinkingDiv);
        container.scrollTop = container.scrollHeight;
    }

    hideThinking() {
        const thinking = document.getElementById('thinking');
        if (thinking) thinking.remove();
    }

    loadSettings() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) this.toggleTheme();
        
        const compareMode = localStorage.getItem('compareMode') === 'true';
        if (compareMode) this.toggleCompareMode();
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    toggleCompareMode() {
        this.isCompareMode = !this.isCompareMode;
        localStorage.setItem('compareMode', this.isCompareMode);
        
        if (this.isCompareMode) {
            this.showAlert('وضع المقارنة مفعل', 'info');
        }
    }

    copyMessage(messageId) {
        const message = document.getElementById(messageId);
        if (!message) return;
        
        const text = message.querySelector('.message-text').textContent;
        navigator.clipboard.writeText(text)
            .then(() => this.showAlert('تم النسخ', 'success'))
            .catch(() => this.showAlert('فشل النسخ', 'error'));
    }

    attachFile() {
        this.showAlert('ميزة رفع الملفات قيد التطوير', 'info');
    }

    toggleThinkingMode() {
        this.showAlert('وضع التفكير مفعل', 'info');
    }

    toggleWebSearch() {
        if (!this.isOnline) {
            this.showAlert('لا يوجد اتصال بالإنترنت', 'error');
        } else {
            this.showAlert('البحث على الويب قيد التطوير', 'info');
        }
    }
}

// ===== تهيئة التطبيق =====
let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new AIHubApp();
    window.app = app;
    
    // إضافة أنماط إضافية
    const styles = document.createElement('style');
    styles.textContent = `
        .dark-mode {
            --bg-color: #1a1a1a;
            --bg-secondary: #2d2d2d;
            --bg-tertiary: #3d3d3d;
            --text-color: #ffffff;
            --text-secondary: #cccccc;
            --border-color: #444444;
        }
        
        .message.highlighted {
            border-right: 4px solid #ea4335;
            background: rgba(234, 67, 53, 0.1);
        }
        
        .thinking-message {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            color: #666;
        }
        
        .thinking-dots {
            display: flex;
            gap: 4px;
        }
        
        .thinking-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #1a73e8;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
        .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(-100%); opacity: 0; }
        }
        
        #installBtn {
            position: fixed;
            bottom: 100px;
            left: 20px;
            background: linear-gradient(135deg, #1a73e8, #0d47a1);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            font-family: 'Tajawal', sans-serif;
            cursor: pointer;
            z-index: 10000;
            display: none;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
        }
    `;
    document.head.appendChild(styles);
    
    // إضافة زر التثبيت
    const installBtn = document.createElement('button');
    installBtn.id = 'installBtn';
    installBtn.innerHTML = '📱 تثبيت التطبيق';
    document.body.appendChild(installBtn);
});
