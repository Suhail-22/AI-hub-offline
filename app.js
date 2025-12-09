// ===== تهيئة التطبيق =====
class AIHubApp {
    constructor() {
        this.currentModel = 'phi3';
        this.messages = [];
        this.isSidebarOpen = false;
        this.isCompareMode = false;
        this.isDarkMode = false;
        this.isLoggedIn = false;
        this.isLoading = false;
        this.thinkingMode = false;
        this.voiceRecording = false;
        this.highlightedMessages = new Set();
        
        this.models = {
            phi3: {
                name: 'Phi-3-mini',
                icon: 'fas fa-bolt',
                color: '#34a853',
                size: '1.1GB',
                status: 'active'
            },
            qwen: {
                name: 'Qwen-3-Max',
                icon: 'fas fa-crown',
                color: '#1a73e8',
                size: '2.3GB',
                status: 'inactive'
            },
            deepseek: {
                name: 'DeepSeek-Coder',
                icon: 'fas fa-code',
                color: '#ea4335',
                size: '2.8GB',
                status: 'inactive'
            }
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 بدء تشغيل مركز الذكاء الاصطناعي...');
        
        this.loadSettings();
        this.initUI();
        this.registerServiceWorker();
        this.updateStorageInfo();
        
        console.log('✅ التهيئة اكتملت');
        this.showAlert('مرحبًا بك في مركز الذكاء الاصطناعي!', 'success');
    }

    initUI() {
        this.addEventListeners();
        this.applyTheme();
        this.showWelcomeMessage();
        this.loadPreviousConversations();
        
        // إضافة زر التثبيت
        this.addInstallButton();
    }

    addEventListeners() {
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    // ===== إضافة زر التثبيت =====
    addInstallButton() {
        if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
            const installBtn = document.createElement('button');
            installBtn.id = 'pwaInstallBtn';
            installBtn.className = 'pwa-install-btn';
            installBtn.innerHTML = '<i class="fas fa-download"></i> تثبيت التطبيق';
            installBtn.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 20px;
                background: linear-gradient(135deg, #1a73e8, #0d47a1);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                font-family: 'Tajawal', sans-serif;
                font-size: 14px;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(26, 115, 232, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                animation: pulseInstall 2s infinite;
                transition: all 0.3s;
            `;
            
            document.body.appendChild(installBtn);
            
            let deferredPrompt;
            
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                installBtn.style.display = 'flex';
                
                installBtn.addEventListener('click', () => {
                    installBtn.style.display = 'none';
                    deferredPrompt.prompt();
                    
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            this.showAlert('تم تثبيت التطبيق بنجاح!', 'success');
                        }
                        deferredPrompt = null;
                    });
                });
            });
            
            window.addEventListener('appinstalled', () => {
                installBtn.style.display = 'none';
            });
            
            // إضافة الأنميشن
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulseInstall {
                    0% { transform: scale(1); box-shadow: 0 4px 15px rgba(26, 115, 232, 0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(26, 115, 232, 0.5); }
                    100% { transform: scale(1); box-shadow: 0 4px 15px rgba(26, 115, 232, 0.3); }
                }
                
                .pwa-install-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(26, 115, 232, 0.5);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== تحسين شريط الإدخال (مثل Qwen Chat) =====
    updateInputBar() {
        const inputContainer = document.querySelector('.input-container');
        if (!inputContainer) return;
        
        // تحديث أزرار شريط الإدخال
        inputContainer.innerHTML = `
            <div class="input-tools-row">
                <button class="input-tool-btn" onclick="attachFile()" title="إرفاق ملف">
                    <i class="fas fa-paperclip"></i>
                    <span>ملف</span>
                </button>
                <button class="input-tool-btn" onclick="toggleThinkingMode()" title="وضع التفكير">
                    <i class="fas fa-brain"></i>
                    <span>Thinking ↓</span>
                </button>
                <button class="input-tool-btn" onclick="toggleWebSearch()" title="البحث على الويب">
                    <i class="fas fa-globe"></i>
                    <span>ويب</span>
                </button>
                <button class="input-tool-btn" onclick="showPromptLibrary()" title="مكتبة النصوص">
                    <i class="fas fa-book"></i>
                    <span>نصوص</span>
                </button>
            </div>
            
            <div class="input-area-enhanced">
                <button class="input-attach-btn" onclick="attachFile()">
                    <i class="fas fa-plus"></i>
                </button>
                
                <textarea 
                    id="messageInput" 
                    placeholder="اكتب رسالتك هنا... (اضغط Ctrl + Enter للإرسال السريع)"
                    rows="1"
                    oninput="autoResize(this)"
                    onkeydown="handleKeyDown(event)"
                ></textarea>
                
                <div class="input-action-buttons">
                    <button class="input-action-btn voice-btn" onclick="toggleVoiceInput()" id="voiceButton">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button class="input-action-btn send-btn" onclick="sendMessage()" id="sendButton">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            
            <div class="input-hints">
                <div class="hint-item">
                    <i class="fas fa-lightbulb"></i>
                    <span>جرب: "اكتب كود Python لتحليل البيانات"</span>
                </div>
                <div class="hint-item">
                    <i class="fas fa-lightbulb"></i>
                    <span>أو: "اشرح نظرية النسبية ببساطة"</span>
                </div>
            </div>
        `;
        
        // إضافة CSS للشريط المحسن
        const enhancedStyle = document.createElement('style');
        enhancedStyle.textContent = `
            .input-tools-row {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
                justify-content: center;
            }
            
            .input-tool-btn {
                padding: 8px 16px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 20px;
                font-family: 'Tajawal', sans-serif;
                font-size: 14px;
                color: var(--text-color);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s;
            }
            
            .input-tool-btn:hover {
                background: var(--bg-tertiary);
                transform: translateY(-1px);
            }
            
            .input-tool-btn.active {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }
            
            .input-area-enhanced {
                display: flex;
                gap: 10px;
                align-items: flex-end;
                background: var(--bg-secondary);
                border: 2px solid var(--border-color);
                border-radius: 24px;
                padding: 8px;
                transition: border-color 0.3s;
            }
            
            .input-area-enhanced:focus-within {
                border-color: var(--primary-color);
            }
            
            .input-attach-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--bg-tertiary);
                border: none;
                color: var(--text-color);
                font-size: 18px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .input-attach-btn:hover {
                background: var(--primary-color);
                color: white;
                transform: scale(1.1);
            }
            
            .input-area-enhanced textarea {
                flex: 1;
                padding: 12px;
                border: none;
                background: transparent;
                font-family: 'Tajawal', sans-serif;
                font-size: 16px;
                color: var(--text-color);
                resize: none;
                min-height: 50px;
                max-height: 150px;
                outline: none;
            }
            
            .input-action-buttons {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
                flex-shrink: 0;
            }
            
            .input-action-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .voice-btn {
                background: var(--bg-tertiary);
                color: var(--text-color);
            }
            
            .voice-btn:hover {
                background: var(--accent-color);
                color: white;
            }
            
            .voice-btn.recording {
                background: var(--accent-color);
                color: white;
                animation: pulse 1.5s infinite;
            }
            
            .send-btn {
                background: var(--primary-color);
                color: white;
            }
            
            .send-btn:hover {
                background: var(--primary-dark);
                transform: scale(1.05);
            }
            
            .input-hints {
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-top: 10px;
            }
            
            .hint-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .hint-item i {
                color: var(--warning-color);
            }
        `;
        document.head.appendChild(enhancedStyle);
    }

    // ===== إضافة المربع الأحمر للرسائل المميزة =====
    addMessage(sender, content, modelId = null) {
        const messagesContainer = document.getElementById('messagesContainer');
        
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        
        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.id = messageId;
        
        // التحقق إذا كانت الرسالة مهمة (تحتوي على كلمات مفتاحية)
        const isImportant = this.checkIfImportant(content);
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content ${isImportant ? 'important-message' : ''}">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="app.copyMessage('${messageId}')" title="نسخ">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn highlight-btn" onclick="app.toggleHighlight('${messageId}')" title="تمييز">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            const model = modelId ? this.models[modelId] : this.models[this.currentModel];
            messageDiv.innerHTML = `
                <div class="ai-avatar" style="background-color: ${model.color}">
                    <i class="${model.icon}"></i>
                </div>
                <div class="message-content ${isImportant ? 'important-message' : ''}">
                    <div class="message-header">
                        <div class="model-name">
                            <i class="${model.icon}"></i>
                            <strong>${model.name}</strong>
                        </div>
                        <small>${new Date().toLocaleTimeString('ar-SA')}</small>
                    </div>
                    <div class="message-text">${this.formatResponse(content)}</div>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="app.copyMessage('${messageId}')" title="نسخ">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn highlight-btn" onclick="app.toggleHighlight('${messageId}')" title="تمييز">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.downloadMessage('${messageId}')" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.regenerateMessage('${messageId}')" title="إعادة توليد">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // إضافة أنيميشن للرسائل المهمة
        if (isImportant) {
            this.highlightMessage(messageId);
        }
        
        // حفظ الرسالة
        this.messages.push({
            id: messageId,
            sender,
            content,
            modelId,
            timestamp: new Date().toISOString(),
            highlighted: isImportant,
            important: isImportant
        });
        
        return messageId;
    }

    checkIfImportant(content) {
        const importantKeywords = [
            'مهم', 'عاجل', 'ضروري', 'انتبه', 'تحذير',
            'تنبيه', 'خطر', 'فوري', 'حيوي', 'سرّي',
            'مميز', 'خاص', 'سري', 'حساس', 'أولوية'
        ];
        
        const arabicContent = content.toLowerCase();
        return importantKeywords.some(keyword => arabicContent.includes(keyword));
    }

    toggleHighlight(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('.message-content');
        const isHighlighted = contentDiv.classList.contains('highlighted-message');
        
        if (isHighlighted) {
            contentDiv.classList.remove('highlighted-message');
            this.showAlert('تم إزالة التمييز من الرسالة', 'info');
        } else {
            contentDiv.classList.add('highlighted-message');
            this.showAlert('تم تمييز الرسالة بالمربع الأحمر', 'success');
        }
        
        // تحديث حالة الرسالة
        const messageIndex = this.messages.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
            this.messages[messageIndex].highlighted = !isHighlighted;
        }
        
        this.saveConversation();
    }

    highlightMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('.message-content');
        contentDiv.classList.add('highlighted-message');
        
        // إضافة أنيميشن
        contentDiv.style.animation = 'highlightPulse 2s ease-in-out';
        
        setTimeout(() => {
            contentDiv.style.animation = '';
        }, 2000);
    }

    // ===== CSS للرسائل المميزة =====
    addHighlightStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .highlighted-message {
                position: relative;
                border-right: 4px solid #ea4335 !important;
                background: linear-gradient(90deg, rgba(234, 67, 53, 0.1), transparent) !important;
            }
            
            .highlighted-message::before {
                content: '★';
                position: absolute;
                right: -15px;
                top: -10px;
                color: #ea4335;
                font-size: 20px;
                animation: starGlow 2s infinite;
            }
            
            .important-message {
                border: 2px solid #fbbc05 !important;
                animation: importantPulse 3s infinite;
            }
            
            @keyframes highlightPulse {
                0% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(234, 67, 53, 0); }
                100% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0); }
            }
            
            @keyframes starGlow {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.2); }
            }
            
            @keyframes importantPulse {
                0%, 100% { border-color: #fbbc05; }
                50% { border-color: #ff9800; }
            }
            
            .message-action-btn.highlight-btn.active {
                color: #fbbc05;
            }
            
            .message-action-btn.highlight-btn.active i {
                color: #fbbc05;
            }
        `;
        document.head.appendChild(style);
    }

    // ===== بقية الدوال =====
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addMessage('user', message);
        input.value = '';
        this.autoResize(input);
        
        const thinkingMsgId = this.showThinkingMessage();
        
        try {
            let response;
            
            if (this.isCompareMode) {
                response = await this.processComparison(message);
            } else {
                response = await this.processMessage(message);
            }
            
            this.removeThinkingMessage(thinkingMsgId);
            this.addMessage('ai', response, this.currentModel);
            this.saveConversation();
            
        } catch (error) {
            console.error('❌ خطأ:', error);
            this.removeThinkingMessage(thinkingMsgId);
            this.addMessage('ai', 'عذرًا، حدث خطأ. يرجى المحاولة مرة أخرى.', 'error');
        }
    }

    async processMessage(message) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = {
                    phi3: `🧠 **Phi-3-mini:**\n\nسؤالك: "${message}"\n\nPhi-3-mini مصمم للسرعة والكفاءة. إنه مثالي للمحادثات اليومية والأسئلة العامة. يمكنني مساعدتك في:\n• الإجابة على الأسئلة اليومية\n• كتابة النصوص القصيرة\n• الترجمة البسيطة\n• تلخيص المعلومات`,
                    
                    qwen: `👑 **Qwen-3-Max:**\n\n"${message}" - سؤال ممتاز!\n\nبصفتي Qwen-3-Max، أتميز بدعم ممتاز للغة العربية والقدرة على تحليل الأسئلة المعقدة. يمكنني:\n• تحليل متعمق للمواضيع\n• كتابة محتوى عربي فصيح\n• الإجابة على الأسئلة الفلسفية\n• تقديم استشارات متخصصة`,
                    
                    deepseek: `💻 **DeepSeek-Coder:**\n\n// معالجة السؤال: "${message}"\n\n/*\nمزايا DeepSeek-Coder:\n1. كتابة وتصحيح الأكواد\n2. شرح المفاهيم البرمجية\n3. تحليل الخوارزميات\n4. حل مشاكل البرمجة\n*/\n\n// مثال على ما يمكنني فعله:\nfunction solveProblem(problem) {\n    // تحليل المشكلة\n    // اقتراح الحلول\n    // كتابة الكود المناسب\n    return solution;\n}`
                };
                
                resolve(responses[this.currentModel] || 'نموذج غير متوفر');
            }, 1500);
        });
    }

    // ===== Service Worker =====
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('✅ Service Worker مسجل:', registration.scope);
                    
                    // إرسال رسالة لتفعيل Service Worker
                    if (registration.active) {
                        registration.active.postMessage({ type: 'INIT' });
                    }
                    
                    // التحقق من التحديثات
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showAlert('تحديث جديد متاح! أعد تحميل الصفحة.', 'info');
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('❌ فشل تسجيل Service Worker:', error);
                    this.showAlert('التطبيق يعمل ولكن بدون ميزات عدم الاتصال', 'warning');
                });
        }
    }

    // ===== دوال أخرى =====
    showAlert(message, type = 'info') {
        const alertBar = document.getElementById('alertBar');
        const alertText = document.getElementById('alertText');
        
        if (!alertBar || !alertText) return;
        
        const colors = {
            success: '#34a853',
            error: '#ea4335',
            warning: '#fbbc05',
            info: '#1a73e8'
        };
        
        alertBar.style.background = `linear-gradient(135deg, ${colors[type]}, ${colors[type]}99)`;
        alertText.textContent = message;
        alertBar.style.display = 'flex';
        
        setTimeout(() => {
            this.hideAlert();
        }, 5000);
    }

    hideAlert() {
        const alertBar = document.getElementById('alertBar');
        if (alertBar) alertBar.style.display = 'none';
    }

    showThinkingMessage() {
        const messagesContainer = document.getElementById('messagesContainer');
        const thinkingId = 'thinking-' + Date.now();
        
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'message ai-message thinking';
        thinkingDiv.id = thinkingId;
        thinkingDiv.innerHTML = `
            <div class="ai-avatar" style="background-color: ${this.models[this.currentModel].color}">
                <i class="${this.models[this.currentModel].icon}"></i>
            </div>
            <div class="message-content">
                <div class="thinking-animation">
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                </div>
                <p>جارٍ التفكير في ردك...</p>
            </div>
        `;
        
        messagesContainer.appendChild(thinkingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return thinkingId;
    }

    removeThinkingMessage(messageId) {
        const element = document.getElementById(messageId);
        if (element) element.remove();
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

    formatResponse(text) {
        text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
            const randomId = 'code-' + Math.random().toString(36).substr(2, 9);
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span><i class="fas fa-code"></i> كود</span>
                        <button class="copy-code-btn" onclick="app.copyToClipboard('${randomId}')">
                            <i class="fas fa-copy"></i> نسخ
                        </button>
                    </div>
                    <pre id="${randomId}">${this.escapeHtml(code.trim())}</pre>
                </div>
            `;
        });
        
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    copyMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.message-text')?.textContent || 
                           messageDiv.querySelector('.message-content')?.textContent;
        
        navigator.clipboard.writeText(messageText).then(() => {
            this.showAlert('تم نسخ الرسالة', 'success');
        });
    }

    copyToClipboard(textId) {
        const textElement = document.getElementById(textId);
        if (!textElement) return;
        
        navigator.clipboard.writeText(textElement.textContent).then(() => {
            this.showAlert('تم نسخ الكود', 'success');
        });
    }

    downloadMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.message-text')?.textContent || 
                           messageDiv.querySelector('.message-content')?.textContent;
        
        const blob = new Blob([messageText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `رسالة-${messageId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showAlert('تم تنزيل الرسالة', 'success');
    }

    regenerateMessage(messageId) {
        const messageIndex = this.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;
        
        const previousMessage = this.messages[messageIndex - 1];
        if (!previousMessage || previousMessage.sender !== 'user') return;
        
        // إزالة الرسالة الحالية
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) messageDiv.remove();
        
        // إعادة إرسال الرسالة السابقة
        this.messages.splice(messageIndex, 1);
        
        const input = document.getElementById('messageInput');
        input.value = previousMessage.content;
        this.autoResize(input);
        this.sendMessage();
    }

    saveConversation() {
        const conversation = {
            messages: this.messages,
            model: this.currentModel,
            timestamp: new Date().toISOString(),
            id: 'conv-' + Date.now()
        };
        
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        conversations.push(conversation);
        localStorage.setItem('conversations', JSON.stringify(conversations.slice(-50)));
        
        this.updateStorageInfo();
    }

    loadPreviousConversations() {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        if (conversations.length > 0) {
            this.showAlert('يوجد محادثات سابقة محفوظة', 'info');
        }
    }

    loadSettings() {
        const savedDarkMode = localStorage.getItem('darkMode');
        this.isDarkMode = savedDarkMode === 'true';
        
        const settings = JSON.parse(localStorage.getItem('aiHubSettings') || '{}');
        this.isCompareMode = settings.compareMode || false;
    }

    saveSettings() {
        const settings = {
            compareMode: this.isCompareMode,
            darkMode: this.isDarkMode,
            thinkingMode: this.thinkingMode
        };
        
        localStorage.setItem('aiHubSettings', JSON.stringify(settings));
    }

    updateStorageInfo() {
        let totalSize = 0;
        
        const conversations = localStorage.getItem('conversations');
        if (conversations) totalSize += new Blob([conversations]).size;
        
        const settings = localStorage.getItem('aiHubSettings');
        if (settings) totalSize += new Blob([settings]).size;
        
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        const storageText = document.querySelector('.storage-info span');
        if (storageText) {
            storageText.textContent = `${sizeInMB} / 50 MB مستخدم`;
        }
        
        const storageFill = document.querySelector('.storage-fill');
        if (storageFill) {
            const percentage = (sizeInMB / 50) * 100;
            storageFill.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    selectModel(modelId) {
        const previousModel = document.querySelector(`[data-model="${this.currentModel}"]`);
        if (previousModel) {
            previousModel.classList.remove('active');
            previousModel.querySelector('.status-dot').classList.remove('active');
        }
        
        this.currentModel = modelId;
        
        const newModel = document.querySelector(`[data-model="${modelId}"]`);
        if (newModel) {
            newModel.classList.add('active');
            newModel.querySelector('.status-dot').classList.add('active');
        }
        
        const badge = document.getElementById('currentModelBadge');
        if (badge) {
            badge.innerHTML = `
                <i class="${this.models[modelId].icon}"></i>
                ${this.models[modelId].name}
            `;
            badge.style.backgroundColor = this.models[modelId].color;
        }
        
        this.showAlert(`تم التبديل إلى ${this.models[modelId].name}`, 'info');
    }

    toggleCompareMode() {
        this.isCompareMode = !this.isCompareMode;
        const toggle = document.getElementById('compareToggle');
        
        if (toggle) toggle.checked = this.isCompareMode;
        
        if (this.isCompareMode) {
            this.showAlert('تم تفعيل وضع المقارنة', 'info');
            document.getElementById('comparisonSection').style.display = 'block';
        } else {
            document.getElementById('comparisonSection').style.display = 'none';
        }
        
        this.saveSettings();
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        const sidebar = document.getElementById('sidebar');
        
        if (this.isSidebarOpen) {
            sidebar.classList.add('open');
        } else {
            sidebar.classList.remove('open');
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        
        localStorage.setItem('darkMode', this.isDarkMode);
        
        const themeIcon = document.querySelector('.icon-btn .fa-moon, .icon-btn .fa-sun');
        if (themeIcon) {
            themeIcon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.showAlert(`تم تفعيل الوضع ${this.isDarkMode ? 'المظلم' : 'الفاتح'}`, 'info');
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    showWelcomeMessage() {
        const messages = [
            "مرحبًا! أنا مساعدك الذكي. اختر نموذجًا لتبدأ.",
            "كل نموذج له تخصصه. Phi-3 سريع، Qwen-3 متقدم، DeepSeek مبرمج.",
            "جرب وضع المقارنة لترى كيف تختلف ردود النماذج.",
            "يمكنك تمييز الرسائل المهمة بالمربع الأحمر."
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const welcomeText = document.querySelector('.welcome-text');
        if (welcomeText) welcomeText.textContent = randomMessage;
    }

    // ===== دوال شريط الإدخال =====
    attachFile() {
        this.showAlert('ميزة رفع الملفات قيد التطوير', 'info');
    }

    toggleThinkingMode() {
        this.thinkingMode = !this.thinkingMode;
        const btn = document.querySelector('.input-tool-btn:nth-child(2)');
        
        if (btn) {
            if (this.thinkingMode) {
                btn.classList.add('active');
                this.showAlert('وضع التفكير العميق مفعل', 'info');
            } else {
                btn.classList.remove('active');
                this.showAlert('وضع التفكير العميق معطل', 'info');
            }
        }
    }

    toggleWebSearch() {
        this.showAlert('البحث على الويب غير متاح بدون إنترنت', 'warning');
    }

    toggleVoiceInput() {
        this.voiceRecording = !this.voiceRecording;
        const voiceBtn = document.getElementById('voiceButton');
        
        if (!voiceBtn) return;
        
        if (this.voiceRecording) {
            voiceBtn.classList.add('recording');
            this.showAlert('جارٍ التسجيل... تحدث الآن', 'info');
            
            setTimeout(() => {
                this.voiceRecording = false;
                voiceBtn.classList.remove('recording');
                
                const voiceMessages = [
                    "مرحبًا، كيف يمكنني مساعدتك؟",
                    "أنا هنا للإجابة على أسئلتك",
                    "اسألني عن أي شيء تريده"
                ];
                
                const randomMessage = voiceMessages[Math.floor(Math.random() * voiceMessages.length)];
                const input = document.getElementById('messageInput');
                if (input) {
                    input.value = randomMessage;
                    this.autoResize(input);
                }
                
                this.showAlert('تم التعرف على الصوت', 'success');
            }, 3000);
        } else {
            voiceBtn.classList.remove('recording');
            this.showAlert('تم إيقاف التسجيل', 'info');
        }
    }

    showPromptLibrary() {
        this.showAlert('مكتبة النصوص قيد التطوير', 'info');
    }
}

// ===== تهيئة التطبيق =====
let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new AIHubApp();
    window.app = app;
    
    // إضافة أنماط الرسائل المميزة
    app.addHighlightStyles();
    
    // تحديث شريط الإدخال
    app.updateInputBar();
    
    // تحميل الإعدادات
    const settings = JSON.parse(localStorage.getItem('aiHubSettings') || '{}');
    const compareToggle = document.getElementById('compareToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (compareToggle) compareToggle.checked = settings.compareMode || false;
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode || false;
});

// ===== دوال عامة =====
function toggleSidebar() { app.toggleSidebar(); }
function toggleTheme() { app.toggleTheme(); }
function newChat() { 
    if (confirm('هل تريد بدء محادثة جديدة؟')) {
        document.getElementById('messagesContainer').innerHTML = '';
        app.messages = [];
        app.highlightedMessages.clear();
        
        document.getElementById('welcomeSection').style.display = 'block';
        document.getElementById('chatContainer').style.display = 'none';
        
        app.showAlert('بدأت محادثة جديدة', 'info');
    }
}
function selectModel(modelId) { app.selectModel(modelId); }
function toggleCompareMode() { app.toggleCompareMode(); }
function sendMessage() { app.sendMessage(); }
function autoResize(el) { app.autoResize(el); }
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        app.sendMessage();
    }
}
function attachFile() { app.attachFile(); }
function toggleThinkingMode() { app.toggleThinkingMode(); }
function toggleWebSearch() { app.toggleWebSearch(); }
function toggleVoiceInput() { app.toggleVoiceInput(); }
function showPromptLibrary() { app.showPromptLibrary(); }
function hideAlert() { app.hideAlert(); }
function quickAction(action) { 
    const actions = {
        'writer': 'اكتب لي مقالاً عن أهمية الذكاء الاصطناعي في التعليم',
        'coder': 'ساعدني في كتابة دالة JavaScript لفرز المصفوفات',
        'assistant': 'ما هي أفضل الطرق لتنظيم الوقت؟',
        'question': 'ما هي أحدث التطورات في الذكاء الاصطناعي؟',
        'code': 'اكتب كود Python لتحليل البيانات',
        'translate': 'ترجم هذه الجملة إلى الإنجليزية: الذكاء الاصطناعي يغير العالم'
    };
    
    const message = actions[action] || action;
    const input = document.getElementById('messageInput');
    if (input) {
        input.value = message;
        app.autoResize(input);
        setTimeout(() => app.sendMessage(), 500);
    }
}
