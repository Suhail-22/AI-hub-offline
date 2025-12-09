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
        
        // تحميل النماذج (إن أمكن)
        this.loadModels();
        
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
                e.target.classList.add('active');
                this.toggleLoginForm(e.target.dataset.type);
            });
        });
        
        // الأزرار السريعة
        document.querySelectorAll('.specialty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleSpecialty(e.target.dataset.specialty);
            });
        });
        
        // الأكشن السريعة
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.querySelector('h4').textContent;
                this.handleQuickAction(action);
            });
        });
    }

    // ===== إدارة النماذج =====
    async loadModels() {
        try {
            // تحقق من توفر Transformers.js
            if (typeof window.transformers === 'undefined') {
                console.warn('⚠️ Transformers.js غير متاح - سيتم استخدام المحاكاة');
                return;
            }
            
            // تحميل النموذج الحالي
            await this.loadCurrentModel();
            
        } catch (error) {
            console.error('❌ خطأ في تحميل النماذج:', error);
            this.showAlert('تعذر تحميل النماذج. يتم استخدام الوضع التجريبي.', 'warning');
        }
    }

    async loadCurrentModel() {
        const model = this.models[this.currentModel];
        
        // عرض نافذة التحميل
        this.showLoading(`تحميل ${model.name}`, 'جارٍ تحميل النموذج، قد يستغرق بضع دقائق...');
        
        try {
            // محاكاة التحميل (ستستبدل بالتحميل الحقيقي)
            await this.simulateModelLoading();
            
            // تحديث الواجهة
            this.updateModelUI();
            
            this.hideLoading();
            this.showAlert(`تم تحميل ${model.name} بنجاح!`, 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showAlert(`فشل تحميل ${model.name}`, 'error');
        }
    }

    simulateModelLoading() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress > 100) progress = 100;
                
                this.updateProgress(progress);
                
                if (progress === 100) {
                    clearInterval(interval);
                    setTimeout(resolve, 500);
                }
            }, 200);
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
            
            // إضافة رد النموذج
            this.addMessage('ai', response, this.currentModel);
            
            // حفظ المحادثة
            this.saveConversation();
            
        } catch (error) {
            console.error('❌ خطأ في معالجة الرسالة:', error);
            this.removeThinkingMessage(thinkingMsgId);
            this.addMessage('ai', 'عذرًا، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى.', 'error');
        }
    }

    async processMessage(message) {
        // محاكاة استجابة النموذج
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = {
                    phi3: `هذا رد من Phi-3-mini (السريع والخفيف):
                    
لقد استلمت رسالتك: "${message}"

Phi-3-mini مصمم للمهام اليومية السريعة والردود المختصرة. إنه مثالي للأجهزة محدودة الموارد.

هل يمكنك توضيح سؤالك أكثر إذا كنت بحاجة إلى مساعدة إضافية؟`,
                    
                    qwen: `هذا رد من Qwen-3-Max (المتقدم للعربية):
                    
بسم الله الرحمن الرحيم

سؤالك: "${message}" هو سؤال مهم ويستحق الاهتمام.

Qwen-3-Max يتميز بدعم ممتاز للغة العربية والقدرة على معالجة الأسئلة المعقدة. لديّ معرفة شاملة في مختلف المجالات وأستطيع تقديم إجابات مفصلة.

هل ترغب في المزيد من التفاصيل حول هذا الموضوع؟`,
                    
                    deepseek: `// رد من DeepSeek-Coder (المتخصص في البرمجة):
/*
سؤالك: "${message}"
*/

// DeepSeek-Coder متخصص في حل المشاكل البرمجية
// يمكنه كتابة، تصحيح، وتحليل الأكواد

function processQuestion(question) {
    // تحليل السؤال
    const analysis = analyze(question);
    
    // توليد الحل
    const solution = generateSolution(analysis);
    
    // تحسين الأداء
    const optimized = optimize(solution);
    
    return {
        answer: optimized,
        explanation: "تم معالجة سؤالك باستخدام خوارزميات متقدمة",
        codeExample: "// مثال كود هنا"
    };
}

// هل تحتاج إلى كود محدد أو شرح برمجي؟`
                };
                
                resolve(responses[this.currentModel] || 'نموذج غير متوفر');
            }, 1500);
        });
    }

    async processComparison(message) {
        // محاكاة مقارنة النماذج الثلاثة
        const results = {};
        const startTime = Date.now();
        
        // تشغيل النماذج الثلاثة بالتوازي
        const promises = Object.keys(this.models).map(async (modelId) => {
            const modelStart = Date.now();
            
            // محاكاة وقت معالجة مختلف لكل نموذج
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
            
            const response = await this.simulateModelResponse(modelId, message);
            const timeTaken = Date.now() - modelStart;
            
            results[modelId] = {
                response,
                time: timeTaken
            };
            
            // تحديث واجهة المقارنة
            this.updateComparisonCard(modelId, response, timeTaken);
        });
        
        await Promise.all(promises);
        
        const totalTime = Date.now() - startTime;
        console.log(`⏱️ وقت المقارنة: ${totalTime}ms`);
        
        return results;
    }

    simulateModelResponse(modelId, message) {
        const responses = {
            phi3: `Phi-3-mini: رد سريع ومختصر على "${message.substring(0, 30)}..." - مثالي للمحادثات اليومية.`,
            qwen: `Qwen-3-Max: تحليل متعمق لسؤالك مع دعم عربي ممتاز. "${message.substring(0, 30)}..." تمت معالجته بدقة عالية.`,
            deepseek: `DeepSeek-Coder: حل تقني متخصص. السؤال "${message.substring(0, 30)}..." تمت معالجته بخوارزميات برمجية.`
        };
        
        return responses[modelId];
    }

    // ===== إدارة الواجهة =====
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
                        <button class="message-action-btn" onclick="app.editMessage('${messageId}')">
                            <i class="fas fa-edit"></i>
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
                        <button class="message-action-btn" onclick="app.regenerateMessage('${messageId}')">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.downloadMessage('${messageId}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.rateMessage('${messageId}', 'good')">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.rateMessage('${messageId}', 'bad')">
                            <i class="fas fa-thumbs-down"></i>
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
            timestamp: new Date().toISOString()
        });
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

    removeThinkingMessage(messageId) {
        const element = document.getElementById(messageId);
        if (element) {
            element.remove();
        }
    }

    updateComparisonCard(modelId, response, time) {
        const card = document.getElementById(`${modelId}Comparison`);
        if (card) {
            const contentDiv = card.querySelector('.comparison-content');
            const timeBadge = card.querySelector('.time-badge');
            
            contentDiv.innerHTML = response;
            timeBadge.textContent = `${(time / 1000).toFixed(1)} ثانية`;
            
            // إظهار قسم المقارنة
            document.getElementById('comparisonSection').style.display = 'block';
        }
    }

    // ===== الأدوات المساعدة =====
    formatResponse(text) {
        // تحويل الروابط
        text = text.replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank">$&</a>');
        
        // تنسيق الأكواد
        text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
            const randomId = 'code-' + Math.random().toString(36).substr(2, 9);
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span>كود</span>
                        <button class="copy-code-btn" onclick="app.copyToClipboard('${randomId}')">
                            <i class="fas fa-copy"></i> نسخ
                        </button>
                    </div>
                    <pre id="${randomId}">${this.escapeHtml(code)}</pre>
                </div>
            `;
        });
        
        // تنسيق الأسطر
        text = text.replace(/\n/g, '<br>');
        
        return text;
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
        
        // تحميل النموذج الجديد
        this.loadCurrentModel();
        
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
        const themeIcon = document.querySelector('.icon-btn .fa-moon');
        if (themeIcon) {
            themeIcon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
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

    showLoading(title, message) {
        this.isLoading = true;
        
        document.getElementById('loadingTitle').textContent = title;
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        // منع التمرير
        document.body.style.overflow = 'hidden';
    }

    hideLoading() {
        this.isLoading = false;
        document.getElementById('loadingOverlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    updateProgress(percentage) {
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${Math.round(percentage)}%`;
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

    loadSettings() {
        // تحميل الوضع المظلم
        const savedDarkMode = localStorage.getItem('darkMode');
        this.isDarkMode = savedDarkMode === 'true';
        
        // تحميل الإعدادات الأخرى
        const settings = JSON.parse(localStorage.getItem('aiHubSettings') || '{}');
        this.isCompareMode = settings.compareMode || false;
        this.thinkingMode = settings.thinkingMode || false;
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
        });
    }

    copyToClipboard(textId) {
        const textElement = document.getElementById(textId);
        if (!textElement) return;
        
        navigator.clipboard.writeText(textElement.textContent).then(() => {
            this.showAlert('تم نسخ الكود إلى الحافظة', 'success');
        });
    }

    // ===== معالجة الإجراءات السريعة =====
    handleSpecialty(specialty) {
        const prompts = {
            writer: 'أريد مساعدتك في كتابة محتوى. أنا أبحث عن مساعد يمكنه كتابة مقالات، منشورات، ورسائل إلكترونية بلغة عربية فصيحة.',
            coder: 'أحتاج مساعدة في البرمجة. هل يمكنك مساعدتي في كتابة، تصحيح، أو تحليل الأكواد البرمجية؟',
            assistant: 'أبحث عن مساعد يومي يمكنه الإجابة على أسئلتي، تنظيم مهامي، وتقديم النصائح العملية.'
        };
        
        document.getElementById('messageInput').value = prompts[specialty];
        this.autoResize(document.getElementById('messageInput'));
        this.showAlert(`تم تعيين وضع "${specialty}" - يمكنك تعديل النص قبل الإرسال`, 'info');
    }

    handleQuickAction(action) {
        const actions = {
            'اطرح سؤالاً': 'ما هي أحدث التطورات في الذكاء الاصطناعي في عام 2025؟',
            'اكتب كودًا': 'اكتب دالة في JavaScript لتحويل JSON إلى CSV',
            'ترجمة': 'ترجم الجملة التالية إلى الإنجليزية: "الذكاء الاصطناعي هو مستقبل التكنولوجيا"'
        };
        
        document.getElementById('messageInput').value = actions[action] || action;
        this.autoResize(document.getElementById('messageInput'));
        this.sendMessage();
    }

    // ===== الدوال العامة للاستدعاء من HTML =====
    toggleLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    }

    toggleSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    }

    loginWithEmail() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showAlert('يرجى ملء جميع الحقول', 'error');
            return;
        }
        
        // محاكاة تسجيل الدخول
        this.showLoading('تسجيل الدخول', 'جارٍ التحقق من بياناتك...');
        
        setTimeout(() => {
            this.hideLoading();
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
}

// ===== تهيئة التطبيق =====
let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new AIHubApp();
    window.app = app; // لجعل التطبيق متاحًا عالميًا
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
function attachFile() { app.showAlert('هذه الميزة قيد التطوير', 'info'); }
function toggleThinkingMode() { 
    app.thinkingMode = !app.thinkingMode;
    app.showAlert(app.thinkingMode ? 'تم تفعيل وضع التفكير' : 'تم إيقاف وضع التفكير', 'info');
}
function toggleWebSearch() { app.showAlert('البحث على الويب غير متاح في الوضع غير المتصل', 'warning'); }
function toggleVoiceInput() {
    app.voiceRecording = !app.voiceRecording;
    const voiceBtn = document.getElementById('voiceButton');
    
    if (app.voiceRecording) {
        voiceBtn.classList.add('recording');
        app.showAlert('جارٍ التسجيل... تحدث الآن', 'info');
        
        // محاكاة التسجيل
        setTimeout(() => {
            app.voiceRecording = false;
            voiceBtn.classList.remove('recording');
            app.showAlert('تم التعرف على الصوت (محاكاة)', 'success');
        }, 3000);
    } else {
        voiceBtn.classList.remove('recording');
    }
}
function clearAllData() {
    if (confirm('هل تريد مسح جميع البيانات بما في ذلك المحادثات والإعدادات؟')) {
        localStorage.clear();
        location.reload();
    }
}
function saveSettings() {
    const settings = {
        compareMode: document.getElementById('compareToggle').checked,
        darkMode: document.getElementById('darkModeToggle').checked,
        autoSave: document.getElementById('autoSave').checked,
        autoLoadModels: document.getElementById('autoLoadModels').checked,
        powerSaverMode: document.getElementById('powerSaverMode').checked
    };
    
    localStorage.setItem('aiHubSettings', JSON.stringify(settings));
    app.showAlert('تم حفظ الإعدادات', 'success');
    app.toggleSettingsModal();
}
function exportChat() {
    const chatData = {
        messages: app.messages,
        model: app.currentModel,
        date: new Date().toLocaleString('ar-SA')
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
    
    app.showAlert('تم تصدير المحادثة', 'success');
}
function cancelLoading() {
    app.hideLoading();
    app.showAlert('تم إلغاء التحميل', 'warning');
}
