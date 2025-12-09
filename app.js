// ===== التهيئة والتكوين =====
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
        this.highlightedMessages = new Set(); // لتتبع الرسائل المميزة
        
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

    // ===== التهيئة الأولية =====
    async init() {
        console.log('🚀 تهيئة مركز الذكاء الاصطناعي...');
        
        // تحميل الإعدادات
        this.loadSettings();
        
        // تهيئة واجهة المستخدم
        this.initUI();
        
        // تسجيل Service Worker
        this.registerServiceWorker();
        
        // تحديث حالة التخزين
        this.updateStorageInfo();
        
        console.log('✅ التهيئة اكتملت بنجاح');
        this.showAlert('مرحبًا بك في مركز الذكاء الاصطناعي!', 'success');
    }

    // ===== إدارة الواجهة =====
    initUI() {
        // إضافة المستمعين للأحداث
        this.addEventListeners();
        
        // تطبيق الوضع المظلم
        this.applyTheme();
        
        // عرض رسالة ترحيب
        this.showWelcomeMessage();
        
        // تحميل المحادثات السابقة
        this.loadPreviousConversations();
    }

    addEventListeners() {
        // زر الإرسال
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        
        // الإدخال بالضغط على Enter
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // التبديل بين أوضاع التسجيل
        document.querySelectorAll('.login-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.login-option').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.toggleLoginForm(e.currentTarget.textContent.includes('البريد') ? 'email' : 'guest');
            });
        });
    }

    // ===== إدارة المحادثات =====
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // إضافة رسالة المستخدم
        this.addMessage('user', message);
        input.value = '';
        this.autoResize(input);
        
        // عرض رسالة "جارٍ التفكير"
        const thinkingMsgId = this.showThinkingMessage();
        
        try {
            // معالجة الرسالة حسب النموذج
            let response;
            
            if (this.isCompareMode) {
                // وضع المقارنة
                response = await this.processComparison(message);
            } else {
                // وضع النموذج الواحد
                response = await this.processMessage(message);
            }
            
            // إزالة رسالة "جارٍ التفكير"
            this.removeThinkingMessage(thinkingMsgId);
            
            // إضافة رد النموذج مع إمكانية التمييز
            const messageId = this.addMessage('ai', response, this.currentModel);
            
            // تلقائيًا تمييز الرسائل المهمة
            if (this.shouldHighlight(message)) {
                this.highlightMessage(messageId);
            }
            
            // حفظ المحادثة
            this.saveConversation();
            
        } catch (error) {
            console.error('❌ خطأ في معالجة الرسالة:', error);
            this.removeThinkingMessage(thinkingMsgId);
            this.addMessage('ai', 'عذرًا، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى.', 'error');
        }
    }

    shouldHighlight(message) {
        // قائمة بالكلمات المهمة التي تستدعي التمييز
        const importantKeywords = [
            'مهم', 'عاجل', 'تنبيه', 'تحذير', 'انتبه',
            'ضروري', 'فوري', 'حيوي', 'حساس', 'سرّي'
        ];
        
        return importantKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    addMessage(sender, content, modelId = null) {
        const messagesContainer = document.getElementById('messagesContainer');
        
        // إخفاء رسالة الترحيب
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        
        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.id = messageId;
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${this.escapeHtml(content)}
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="app.copyMessage('${messageId}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.highlightMessage('${messageId}')">
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
                <div class="message-content">
                    <div class="message-header">
                        <strong>${model.name}</strong>
                        <small>${new Date().toLocaleTimeString('ar-SA')}</small>
                    </div>
                    <div class="message-text">${this.formatResponse(content)}</div>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="app.copyMessage('${messageId}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.highlightMessage('${messageId}')">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.downloadMessage('${messageId}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // حفظ الرسالة
        this.messages.push({
            id: messageId,
            sender,
            content,
            modelId,
            timestamp: new Date().toISOString(),
            highlighted: false
        });
        
        return messageId;
    }

    highlightMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const isHighlighted = this.highlightedMessages.has(messageId);
        
        if (isHighlighted) {
            // إزالة التمييز
            messageDiv.classList.remove('message-highlight');
            this.highlightedMessages.delete(messageId);
            
            // تحديث الرسالة في الذاكرة
            const messageIndex = this.messages.findIndex(m => m.id === messageId);
            if (messageIndex > -1) {
                this.messages[messageIndex].highlighted = false;
            }
            
            this.showAlert('تم إزالة التمييز من الرسالة', 'info');
        } else {
            // إضافة التمييز
            messageDiv.classList.add('message-highlight');
            this.highlightedMessages.add(messageId);
            
            // تحديث الرسالة في الذاكرة
            const messageIndex = this.messages.findIndex(m => m.id === messageId);
            if (messageIndex > -1) {
                this.messages[messageIndex].highlighted = true;
            }
            
            this.showAlert('تم تمييز الرسالة بالمربع الأحمر', 'success');
        }
        
        // حفظ التغييرات
        this.saveConversation();
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
                <div class="thinking-indicator">
                    <span></span><span></span><span></span>
                </div>
                <p>جارٍ التفكير...</p>
            </div>
        `;
        
        messagesContainer.appendChild(thinkingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return thinkingId;
    }

    // ===== معالجة الرسائل =====
    async processMessage(message) {
        // محاكاة استجابة النموذج مع تحسينات
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = {
                    phi3: `هذا رد من Phi-3-mini (السريع والخفيف):
                    
📌 **سؤالك:** "${message}"

Phi-3-mini مصمم للمهام اليومية السريعة والردود المختصرة. إنه مثالي للأجهزة محدودة الموارد.

💡 **نصيحة:** يمكنك استخدامي للمحادثات اليومية، الأسئلة العامة، والمهام البسيطة.

🔧 **مثال:** إذا كنت تريد مساعدة في كتابة بريد إلكتروني، قل: "اكتب لي بريد إلكتروني..."`,
                    
                    qwen: `هذا رد من Qwen-3-Max (المتقدم للعربية):
                    
🎯 **تحليل السؤال:** "${message}"

Qwen-3-Max يتميز بدعم ممتاز للغة العربية والقدرة على معالجة الأسئلة المعقدة. لديّ معرفة شاملة في مختلف المجالات.

📚 **معلومات إضافية:** يمكنني تقديم إجابات مفصلة مع الاستشهاد بمصادر موثوقة (في وضع الاتصال).

🌍 **دعم اللغة:** العربية الفصحى والعامية المدعومة بشكل كامل.`,
                    
                    deepseek: `// رد من DeepSeek-Coder (المتخصص في البرمجة):
/*
سؤالك: "${message}"
*/

// DeepSeek-Coder متخصص في حل المشاكل البرمجية
// يمكنه كتابة، تصحيح، وتحليل الأكواد

function generateAnswer(question) {
    // تحليل نوع السؤال
    const questionType = analyzeQuestionType(question);
    
    // توليد الحل المناسب
    switch(questionType) {
        case 'code-writing':
            return generateCodeSolution(question);
        case 'debugging':
            return debugCode(question);
        case 'explanation':
            return explainConcept(question);
        default:
            return provideGeneralHelp(question);
    }
}

// 💻 أمثلة على ما يمكنني فعله:
// 1. كتابة كود بلغة معينة
// 2. تصحيح الأخطاء في الكود
// 3. شرح مفاهيم برمجية`
                };
                
                resolve(responses[this.currentModel] || 'نموذج غير متوفر');
            }, 1500);
        });
    }

    // ===== الأدوات المساعدة =====
    formatResponse(text) {
        // تحويل الروابط
        text = text.replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank" class="text-link">$&</a>');
        
        // تنسيق الأكواد
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
        
        // تنسيق العناوين
        text = text.replace(/^# (.*$)/gm, '<h4 class="response-heading">$1</h4>');
        text = text.replace(/^## (.*$)/gm, '<h5 class="response-subheading">$1</h5>');
        
        // تنسيق النقاط
        text = text.replace(/^- (.*$)/gm, '<div class="list-item"><i class="fas fa-circle"></i> $1</div>');
        
        // تنسيق الأسطر
        text = text.replace(/\n\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');
        
        return `<p>${text}</p>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

    // ===== إدارة الحالة =====
    selectModel(modelId) {
        // تحديث النموذج السابق
        const previousModel = document.querySelector(`[data-model="${this.currentModel}"]`);
        if (previousModel) {
            previousModel.classList.remove('active');
            previousModel.querySelector('.status-dot').classList.remove('active');
        }
        
        // تحديث النموذج الجديد
        this.currentModel = modelId;
        
        const newModel = document.querySelector(`[data-model="${modelId}"]`);
        if (newModel) {
            newModel.classList.add('active');
            newModel.querySelector('.status-dot').classList.add('active');
        }
        
        // تحديث الشارة العلوية
        const badge = document.getElementById('currentModelBadge');
        badge.innerHTML = `
            <i class="${this.models[modelId].icon}"></i>
            ${this.models[modelId].name}
        `;
        badge.style.backgroundColor = this.models[modelId].color;
        
        // إظهار التنبيه
        this.showAlert(`تم التبديل إلى ${this.models[modelId].name}`, 'info');
    }

    toggleCompareMode() {
        this.isCompareMode = !this.isCompareMode;
        const toggle = document.getElementById('compareToggle');
        
        if (toggle) {
            toggle.checked = this.isCompareMode;
        }
        
        if (this.isCompareMode) {
            this.showAlert('تم تفعيل وضع المقارنة. سيتم عرض ردود النماذج الثلاثة معًا.', 'info');
            document.getElementById('comparisonSection').style.display = 'block';
        } else {
            document.getElementById('comparisonSection').style.display = 'none';
        }
        
        // حفظ الإعداد
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
        
        // حفظ الإعداد
        localStorage.setItem('darkMode', this.isDarkMode);
        
        // تحديث الأيقونة
        const themeIcon = document.querySelector('.icon-btn .fa-moon, .icon-btn .fa-sun');
        if (themeIcon) {
            themeIcon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.showAlert(`تم تفعيل الوضع ${this.isDarkMode ? 'المظلم' : 'الفاتح'}`, 'info');
    }

    // ===== التنبيهات والإشعارات =====
    showAlert(message, type = 'info') {
        const alertBar = document.getElementById('alertBar');
        const alertText = document.getElementById('alertText');
        
        // تعيين اللون حسب النوع
        const colors = {
            success: '#34a853',
            error: '#ea4335',
            warning: '#fbbc05',
            info: '#1a73e8'
        };
        
        alertBar.style.background = `linear-gradient(135deg, ${colors[type]}, ${colors[type]}99)`;
        alertText.textContent = message;
        alertBar.style.display = 'flex';
        
        // إخفاء تلقائي بعد 5 ثوانٍ
        setTimeout(() => {
            this.hideAlert();
        }, 5000);
    }

    hideAlert() {
        document.getElementById('alertBar').style.display = 'none';
    }

    // ===== إدارة البيانات =====
    saveConversation() {
        const conversation = {
            messages: this.messages,
            model: this.currentModel,
            timestamp: new Date().toISOString(),
            id: 'conv-' + Date.now()
        };
        
        // حفظ في localStorage
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        conversations.push(conversation);
        localStorage.setItem('conversations', JSON.stringify(conversations.slice(-50))); // حفظ آخر 50 محادثة
        
        // تحديث معلومات التخزين
        this.updateStorageInfo();
    }

    loadPreviousConversations() {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        if (conversations.length > 0) {
            // تحميل آخر محادثة
            const lastConversation = conversations[conversations.length - 1];
            this.currentModel = lastConversation.model || 'phi3';
            
            // عرض زر لتحميل المحادثات السابقة
            this.showAlert('يوجد محادثات سابقة. استخدم زر "تحميل المحادثات" في الإعدادات.', 'info');
        }
    }

    loadSettings() {
        // تحميل الوضع المظلم
        const savedDarkMode = localStorage.getItem('darkMode');
        this.isDarkMode = savedDarkMode === 'true';
        
        // تحميل الإعدادات الأخرى
        const settings = JSON.parse(localStorage.getItem('aiHubSettings') || '{}');
        this.isCompareMode = settings.compareMode || false;
        this.thinkingMode = settings.thinkingMode || false;
    }

    saveSettings() {
        const settings = {
            compareMode: this.isCompareMode,
            darkMode: this.isDarkMode,
            thinkingMode: this.thinkingMode,
            autoSave: true
        };
        
        localStorage.setItem('aiHubSettings', JSON.stringify(settings));
    }

    updateStorageInfo() {
        // حساب حجم البيانات المحفوظة
        let totalSize = 0;
        
        // حجم المحادثات
        const conversations = localStorage.getItem('conversations');
        if (conversations) {
            totalSize += new Blob([conversations]).size;
        }
        
        // حجم الإعدادات
        const settings = localStorage.getItem('aiHubSettings');
        if (settings) {
            totalSize += new Blob([settings]).size;
        }
        
        // تحويل للـ MB
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        // تحديث واجهة المستخدم
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

    // ===== Service Worker =====
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('✅ Service Worker مسجل:', registration.scope);
                        this.showAlert('التطبيق يعمل الآن بدون إنترنت!', 'success');
                    })
                    .catch(error => {
                        console.log('❌ فشل تسجيل Service Worker:', error);
                    });
            });
        }
    }

    // ===== الوظائف العامة =====
    clearChat() {
        if (confirm('هل تريد مسح المحادثة الحالية؟')) {
            document.getElementById('messagesContainer').innerHTML = '';
            this.messages = [];
            this.highlightedMessages.clear();
            
            // إظهار رسالة الترحيب
            document.getElementById('welcomeSection').style.display = 'block';
            document.getElementById('chatContainer').style.display = 'none';
            
            this.showAlert('تم مسح المحادثة', 'info');
        }
    }

    copyMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.message-text')?.textContent || 
                           messageDiv.querySelector('.message-content')?.textContent;
        
        navigator.clipboard.writeText(messageText).then(() => {
            this.showAlert('تم نسخ الرسالة إلى الحافظة', 'success');
        }).catch(() => {
            // طريقة بديلة للمتصفحات القديمة
            const textArea = document.createElement('textarea');
            textArea.value = messageText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showAlert('تم نسخ الرسالة إلى الحافظة', 'success');
        });
    }

    copyToClipboard(textId) {
        const textElement = document.getElementById(textId);
        if (!textElement) return;
        
        navigator.clipboard.writeText(textElement.textContent).then(() => {
            this.showAlert('تم نسخ الكود إلى الحافظة', 'success');
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

    // ===== معالجة الإجراءات السريعة =====
    handleSpecialty(specialty) {
        const prompts = {
            writer: 'أريد مساعدتك في كتابة محتوى. أنا أبحث عن مساعد يمكنه كتابة مقالات، منشورات، ورسائل إلكترونية بلغة عربية فصيحة.',
            coder: 'أحتاج مساعدة في البرمجة. هل يمكنك مساعدتي في كتابة، تصحيح، أو تحليل الأكواد البرمجية؟',
            assistant: 'أبحث عن مساعد يومي يمكنه الإجابة على أسئلتي، تنظيم مهامي، وتقديم النصائح العملية.'
        };
        
        document.getElementById('messageInput').value = prompts[specialty] || specialty;
        this.autoResize(document.getElementById('messageInput'));
        this.showAlert(`تم تعيين وضع "${specialty}" - يمكنك تعديل النص قبل الإرسال`, 'info');
    }

    handleQuickAction(action) {
        const actions = {
            'question': 'ما هي أحدث التطورات في الذكاء الاصطناعي في عام 2025؟',
            'code': 'اكتب دالة في JavaScript لتحويل JSON إلى CSV',
            'translate': 'ترجم الجملة التالية إلى الإنجليزية: "الذكاء الاصطناعي هو مستقبل التكنولوجيا"',
            'writer': 'أريد كتابة مقال عن أهمية الذكاء الاصطناعي في التعليم',
            'coder': 'ساعدني في تصحيح هذا الكود الذي به خطأ',
            'assistant': 'ما هي أفضل الممارسات لتنظيم الوقت؟'
        };
        
        const message = actions[action] || action;
        document.getElementById('messageInput').value = message;
        this.autoResize(document.getElementById('messageInput'));
        
        // إرسال تلقائي للإجراءات السريعة
        setTimeout(() => this.sendMessage(), 500);
    }

    // ===== الدوال العامة للاستدعاء من HTML =====
    toggleLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }

    toggleSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }

    toggleLoginForm(type) {
        const emailForm = document.getElementById('emailLoginForm');
        const guestWarning = document.getElementById('guestWarning');
        
        if (type === 'email') {
            emailForm.style.display = 'block';
            guestWarning.style.display = 'none';
        } else {
            emailForm.style.display = 'none';
            guestWarning.style.display = 'block';
        }
    }

    loginWithEmail() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showAlert('يرجى ملء جميع الحقول', 'error');
            return;
        }
        
        // محاكاة تسجيل الدخول
        this.showAlert('جارٍ التحقق من بياناتك...', 'info');
        
        setTimeout(() => {
            this.isLoggedIn = true;
            
            // تحديث واجهة المستخدم
            document.querySelector('.user-name').textContent = email.split('@')[0];
            document.querySelector('.user-status').textContent = 'متصل';
            document.querySelector('.user-avatar').innerHTML = '<i class="fas fa-user-check"></i>';
            
            this.toggleLoginModal();
            this.showAlert('تم تسجيل الدخول بنجاح!', 'success');
        }, 1500);
    }

    continueAsGuest() {
        this.toggleLoginModal();
        this.showAlert('أنت الآن في وضع الزائر. لن يتم حفظ محادثاتك على السحابة.', 'info');
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            const themeIcon = document.querySelector('.icon-btn .fa-moon');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        }
    }

    showWelcomeMessage() {
        const welcomeMessages = [
            "مرحبًا! أنا مساعدك الذكي. يمكنني الإجابة على أسئلتك ومساعدتك في مختلف المهام.",
            "اختر نموذجًا من القائمة الجانبية لتبدأ. كل نموذج له تخصصه ومميزاته.",
            "جرب وضع المقارنة لترى كيف تختلف ردود النماذج عن بعضها.",
            "يمكنك استخدام الأزرار السريعة للبدء مباشرة في المهام الشائعة."
        ];
        
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        document.querySelector('.welcome-text').textContent = randomMessage;
    }

    attachFile() {
        this.showAlert('ميزة رفع الملفات قيد التطوير. ستتوفر قريبًا!', 'info');
    }

    toggleThinkingMode() {
        this.thinkingMode = !this.thinkingMode;
        const btn = document.querySelector('.input-tool-btn:nth-child(2)');
        
        if (this.thinkingMode) {
            btn.classList.add('active');
            this.showAlert('تم تفعيل وضع التفكير العميق', 'info');
        } else {
            btn.classList.remove('active');
            this.showAlert('تم إيقاف وضع التفكير العميق', 'info');
        }
    }

    toggleWebSearch() {
        this.showAlert('البحث على الويب غير متاح في الوضع غير المتصل', 'warning');
    }

    toggleVoiceInput() {
        this.voiceRecording = !this.voiceRecording;
        const voiceBtn = document.getElementById('voiceButton');
        
        if (this.voiceRecording) {
            voiceBtn.classList.add('recording');
            this.showAlert('جارٍ التسجيل... تحدث الآن', 'info');
            
            // محاكاة التسجيل
            setTimeout(() => {
                this.voiceRecording = false;
                voiceBtn.classList.remove('recording');
                
                // نص محاكاة للصوت
                const voiceMessages = [
                    "مرحبًا، كيف يمكنني مساعدتك اليوم؟",
                    "أنا جاهز للإجابة على أسئلتك",
                    "هل تريد معرفة المزيد عن الذكاء الاصطناعي؟"
                ];
                
                const randomMessage = voiceMessages[Math.floor(Math.random() * voiceMessages.length)];
                document.getElementById('messageInput').value = randomMessage;
                this.autoResize(document.getElementById('messageInput'));
                
                this.showAlert('تم التعرف على الصوت بنجاح', 'success');
            }, 3000);
        } else {
            voiceBtn.classList.remove('recording');
            this.showAlert('تم إيقاف التسجيل', 'info');
        }
    }

    clearAllData() {
        if (confirm('هل تريد مسح جميع البيانات بما في ذلك المحادثات والإعدادات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            localStorage.clear();
            this.showAlert('تم مسح جميع البيانات', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    }

    saveSettings() {
        const settings = {
            compareMode: document.getElementById('compareToggle').checked,
            darkMode: document.getElementById('darkModeToggle').checked,
            autoSave: document.getElementById('autoSave').checked,
            autoLoadModels: document.getElementById('autoLoadModels').checked,
            powerSaverMode: document.getElementById('powerSaverMode').checked
        };
        
        localStorage.setItem('aiHubSettings', JSON.stringify(settings));
        this.showAlert('تم حفظ الإعدادات', 'success');
        this.toggleSettingsModal();
    }

    exportChat() {
        const chatData = {
            messages: this.messages,
            model: this.currentModel,
            date: new Date().toLocaleString('ar-SA'),
            highlightedMessages: Array.from(this.highlightedMessages)
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `محادثة-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showAlert('تم تصدير المحادثة', 'success');
    }

    cancelLoading() {
        this.showAlert('تم إلغاء التحميل', 'warning');
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    removeThinkingMessage(messageId) {
        const element = document.getElementById(messageId);
        if (element) {
            element.remove();
        }
    }
}

// ===== تهيئة التطبيق =====
let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new AIHubApp();
    window.app = app; // لجعل التطبيق متاحًا عالميًا
    
    // تهيئة الإعدادات في الواجهة
    const settings = JSON.parse(localStorage.getItem('aiHubSettings') || '{}');
    if (document.getElementById('compareToggle')) {
        document.getElementById('compareToggle').checked = settings.compareMode || false;
    }
    if (document.getElementById('darkModeToggle')) {
        document.getElementById('darkModeToggle').checked = settings.darkMode || false;
    }
});

// ===== دوال عامة للاستدعاء من HTML =====
function toggleSidebar() { app.toggleSidebar(); }
function toggleTheme() { app.toggleTheme(); }
function newChat() { app.clearChat(); }
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
function toggleLoginModal() { app.toggleLoginModal(); }
function toggleSettingsModal() { app.toggleSettingsModal(); }
function loginWithEmail() { app.loginWithEmail(); }
function continueAsGuest() { app.continueAsGuest(); }
function selectLoginOption(type) { app.toggleLoginForm(type); }
function hideAlert() { app.hideAlert(); }
function quickAction(action) { app.handleQuickAction(action); }
function attachFile() { app.attachFile(); }
function toggleThinkingMode() { app.toggleThinkingMode(); }
function toggleWebSearch() { app.toggleWebSearch(); }
function toggleVoiceInput() { app.toggleVoiceInput(); }
function clearAllData() { app.clearAllData(); }
function saveSettings() { app.saveSettings(); }
function exportChat() { app.exportChat(); }
function cancelLoading() { app.cancelLoading(); }
