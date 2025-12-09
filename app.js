// ===== تحديثات الدوال الرئيسية =====
class AIHubApp {
    constructor() {
        // ... الكود السابق ...
        
        // تحديث: إضافة محادثات متعددة
        this.conversations = [];
        this.currentConversationId = null;
        
        // تحديث: حالة النماذج
        this.modelStatus = {
            phi3: { loaded: true, available: true },
            qwen: { loaded: false, available: false },
            deepseek: { loaded: false, available: false }
        };
        
        this.init();
    }

    // ===== تحديث: فتح محادثة جديدة =====
    newChat() {
        // إنشاء محادثة جديدة
        const newConversation = {
            id: 'conv-' + Date.now(),
            title: 'محادثة جديدة ' + (this.conversations.length + 1),
            messages: [],
            timestamp: new Date().toISOString(),
            model: this.currentModel
        };
        
        // إضافة للمحادثات
        this.conversations.push(newConversation);
        this.currentConversationId = newConversation.id;
        this.messages = [];
        
        // تحديث الواجهة
        this.clearChatUI();
        
        // تحديث قائمة المحادثات في الشريط الجانبي
        this.updateConversationsList();
        
        // إظهار النموذج الحالي
        this.showCurrentModel();
        
        this.showAlert('تم إنشاء محادثة جديدة', 'success');
    }

    // ===== تحديث: مسح واجهة المحادثة فقط =====
    clearChatUI() {
        document.getElementById('messagesContainer').innerHTML = '';
        
        // إظهار رسالة الترحيب فقط إذا لم تكن هناك محادثات
        if (this.conversations.length === 0) {
            document.getElementById('welcomeSection').style.display = 'block';
            document.getElementById('chatContainer').style.display = 'none';
        } else {
            document.getElementById('welcomeSection').style.display = 'none';
            document.getElementById('chatContainer').style.display = 'block';
        }
    }

    // ===== جديد: تحديث قائمة المحادثات =====
    updateConversationsList() {
        const sidebar = document.getElementById('sidebar');
        let convList = sidebar.querySelector('.conversations-list');
        
        if (!convList) {
            convList = document.createElement('div');
            convList.className = 'conversations-list';
            sidebar.querySelector('.model-list').after(convList);
        }
        
        convList.innerHTML = `
            <h4><i class="fas fa-comments"></i> المحادثات</h4>
            ${this.conversations.map(conv => `
                <div class="conversation-item ${conv.id === this.currentConversationId ? 'active' : ''}" 
                     onclick="app.loadConversation('${conv.id}')">
                    <i class="fas fa-comment"></i>
                    <span>${conv.title}</span>
                    <small>${new Date(conv.timestamp).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</small>
                </div>
            `).join('')}
        `;
    }

    // ===== جديد: تحميل محادثة =====
    loadConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;
        
        this.currentConversationId = conversationId;
        this.messages = conversation.messages;
        this.currentModel = conversation.model;
        
        // تحديث الواجهة
        this.updateChatUI();
        this.updateModelUI();
        
        this.showAlert('تم تحميل المحادثة', 'info');
    }

    // ===== جديد: تحديث واجهة المحادثة =====
    updateChatUI() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        this.messages.forEach(msg => {
            this.addMessageToUI(msg.sender, msg.content, msg.modelId, false);
        });
        
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
    }

    // ===== تحديث: إضافة رسالة مع حفظ =====
    addMessage(sender, content, modelId = null) {
        const messageId = 'msg-' + Date.now();
        
        // إضافة للواجهة
        this.addMessageToUI(sender, content, modelId, true);
        
        // حفظ في المصفوفة
        const message = {
            id: messageId,
            sender,
            content,
            modelId,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        
        // تحديث المحادثة الحالية
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (conversation) {
            conversation.messages = this.messages;
            conversation.timestamp = new Date().toISOString();
        }
        
        // حفظ في localStorage
        this.saveConversations();
    }

    // ===== جديد: إضافة رسالة للواجهة فقط =====
    addMessageToUI(sender, content, modelId = null, animate = true) {
        const messagesContainer = document.getElementById('messagesContainer');
        
        // إخفاء رسالة الترحيب
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${animate ? 'fade-in' : ''}`;
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${this.escapeHtml(content)}
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="app.copyMessage(this)">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.editMessage(this)">
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
                        <button class="message-action-btn" onclick="app.copyMessage(this)">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.regenerateMessage(this)">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ===== تحديث: تفعيل النماذج =====
    async loadModel(modelId) {
        const model = this.models[modelId];
        
        // إذا كان النموذج مفعل بالفعل
        if (this.modelStatus[modelId].loaded) {
            this.showAlert(`${model.name} مفعل بالفعل`, 'info');
            return true;
        }
        
        // عرض نافذة التحميل
        this.showLoading(`تحميل ${model.name}`, `جارٍ تحميل ${model.name} (${model.size})...`);
        
        try {
            // محاكاة تحميل النموذج
            await this.simulateModelLoading(modelId);
            
            // تحديث الحالة
            this.modelStatus[modelId].loaded = true;
            this.modelStatus[modelId].available = true;
            
            // تحديث الواجهة
            this.updateModelStatusUI(modelId);
            
            this.hideLoading();
            this.showAlert(`تم تفعيل ${model.name} بنجاح!`, 'success');
            return true;
            
        } catch (error) {
            this.hideLoading();
            this.showAlert(`فشل تحميل ${model.name}`, 'error');
            return false;
        }
    }

    // ===== جديد: محاكاة تحميل النموذج =====
    simulateModelLoading(modelId) {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 100) progress = 100;
                
                this.updateProgress(progress);
                
                // معلومات مختلفة حسب النموذج
                const messages = {
                    phi3: ['جاري تحميل الأوزان...', 'تهيئة الذاكرة...', 'جارٍ التحضير...'],
                    qwen: ['تحميل معالج اللغة العربية...', 'تهيئة النموذج الكبير...', 'جارٍ التحضير...'],
                    deepseek: ['تحميل مكتبة البرمجة...', 'تهيئة محولات التعليم...', 'جارٍ التحضير...']
                };
                
                if (progress % 30 === 0) {
                    const msgIndex = Math.floor(progress / 30) % messages[modelId].length;
                    document.getElementById('loadingMessage').textContent = messages[modelId][msgIndex];
                }
                
                if (progress === 100) {
                    clearInterval(interval);
                    setTimeout(resolve, 500);
                }
            }, 300);
        });
    }

    // ===== جديد: تحديث حالة النموذج في الواجهة =====
    updateModelStatusUI(modelId) {
        const modelItem = document.querySelector(`[data-model="${modelId}"]`);
        if (modelItem) {
            const statusDot = modelItem.querySelector('.status-dot');
            const sizeBadge = modelItem.querySelector('.model-size');
            
            if (this.modelStatus[modelId].loaded) {
                statusDot.classList.add('active');
                statusDot.style.backgroundColor = '#34a853';
                if (sizeBadge) {
                    sizeBadge.innerHTML = '<i class="fas fa-check"></i> مفعل';
                }
            }
        }
    }

    // ===== تحديث: اختيار النموذج =====
    async selectModel(modelId) {
        // إذا كان النموذج غير محمل، نحمله أولاً
        if (!this.modelStatus[modelId].loaded) {
            const loaded = await this.loadModel(modelId);
            if (!loaded) return;
        }
        
        // تحديث النموذج السابق
        const previousModel = document.querySelector(`[data-model="${this.currentModel}"]`);
        if (previousModel) {
            previousModel.classList.remove('active');
        }
        
        // تحديث النموذج الجديد
        this.currentModel = modelId;
        
        const newModel = document.querySelector(`[data-model="${modelId}"]`);
        if (newModel) {
            newModel.classList.add('active');
        }
        
        // تحديث الشارة العلوية
        this.showCurrentModel();
        
        // إظهار التنبيه
        this.showAlert(`تم التبديل إلى ${this.models[modelId].name}`, 'info');
    }

    // ===== جديد: عرض النموذج الحالي =====
    showCurrentModel() {
        const badge = document.getElementById('currentModelBadge');
        const model = this.models[this.currentModel];
        
        badge.innerHTML = `
            <i class="${model.icon}"></i>
            ${model.name}
        `;
        badge.style.backgroundColor = model.color;
        
        // تحديث حالة الاتصال
        const status = document.getElementById('modelStatus');
        if (status) {
            status.innerHTML = `
                <span class="status-dot active"></span>
                ${this.modelStatus[this.currentModel].loaded ? 'مفعل وجاهز' : 'غير محمل'}
            `;
        }
    }

    // ===== تحديث: وضع المقارنة =====
    async toggleCompareMode() {
        const toggle = document.getElementById('compareToggle');
        this.isCompareMode = !this.isCompareMode;
        
        if (toggle) {
            toggle.checked = this.isCompareMode;
        }
        
        if (this.isCompareMode) {
            // التأكد من تحميل جميع النماذج
            const modelsToLoad = ['phi3', 'qwen', 'deepseek'].filter(m => !this.modelStatus[m].loaded);
            
            if (modelsToLoad.length > 0) {
                this.showAlert('جارٍ تحميل النماذج للمقارنة...', 'info');
                
                for (const modelId of modelsToLoad) {
                    await this.loadModel(modelId);
                }
            }
            
            this.showAlert('تم تفعيل وضع المقارنة. سيتم عرض ردود النماذج الثلاثة معًا.', 'info');
            document.getElementById('comparisonSection').style.display = 'block';
        } else {
            document.getElementById('comparisonSection').style.display = 'none';
        }
    }

    // ===== تحديث: معالجة المقارنة =====
    async processComparison(message) {
        // إظهار قسم المقارنة
        document.getElementById('comparisonSection').style.display = 'block';
        
        // مسح المحتوى القديم وإظهار مؤشر التحميل
        const models = ['phi3', 'qwen', 'deepseek'];
        models.forEach(modelId => {
            const card = document.getElementById(`${modelId}Comparison`);
            if (card) {
                const contentDiv = card.querySelector('.comparison-content');
                const timeBadge = card.querySelector('.time-badge');
                
                contentDiv.innerHTML = `
                    <div class="thinking-indicator">
                        <span></span><span></span><span></span>
                    </div>
                    <p style="text-align: center; color: var(--text-secondary);">
                        جارٍ المعالجة...
                    </p>
                `;
                timeBadge.textContent = '--';
            }
        });
        
        // معالجة كل نموذج
        const results = [];
        
        for (const modelId of models) {
            const startTime = Date.now();
            
            // محاكاة استجابة مختلفة لكل نموذج
            const response = await this.simulateComparisonResponse(modelId, message);
            const timeTaken = Date.now() - startTime;
            
            // تحديث البطاقة
            this.updateComparisonCard(modelId, response, timeTaken);
            
            results.push({ modelId, response, timeTaken });
        }
        
        console.log('✅ نتائج المقارنة:', results);
        return results;
    }

    // ===== جديد: محاكاة استجابة المقارنة =====
    async simulateComparisonResponse(modelId, message) {
        // تأخير مختلف لكل نموذج
        const delays = { phi3: 800, qwen: 1500, deepseek: 1200 };
        
        // استجابات مختلفة لكل نموذج
        const responses = {
            phi3: `**Phi-3-mini** (الأسرع):
• سرعة الرد: ⚡ فائقة
• استخدام الذاكرة: 🟢 منخفض
• مثالي للمحادثات اليومية والسريعة
• دعم اللغة العربية: 🟢 جيد

"${message.substring(0, 40)}..." - تمت معالجته بسرعة وفعالية.`,

            qwen: `**Qwen-3-Max** (الأفضل للعربية):
• سرعة الرد: 🟡 متوسطة
• استخدام الذاكرة: 🟡 متوسط
• الأفضل للغة العربية والأسئلة المعقدة
• دعم اللغة العربية: 🟢 ممتاز

"${message.substring(0, 40)}..." - تم تحليله بعمق مع التركيز على الدقة اللغوية.`,

            deepseek: `**DeepSeek-Coder** (المتخصص):
• سرعة الرد: 🟡 متوسطة
• استخدام الذاكرة: 🔴 مرتفع
• متخصص في البرمجة وحل المشكلات
• دعم اللغة العربية: 🟢 جيد

"${message.substring(0, 40)}..." - تمت معالجته بمنظور برمجي وخوارزمي.`
        };
        
        await new Promise(resolve => setTimeout(resolve, delays[modelId]));
        return responses[modelId];
    }

    // ===== جديد: حفظ المحادثات =====
    saveConversations() {
        const data = {
            conversations: this.conversations,
            currentConversationId: this.currentConversationId,
            currentModel: this.currentModel,
            modelStatus: this.modelStatus
        };
        
        localStorage.setItem('aiHubConversations', JSON.stringify(data));
    }

    // ===== جديد: تحميل المحادثات المحفوظة =====
    loadSavedConversations() {
        const saved = localStorage.getItem('aiHubConversations');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.conversations = data.conversations || [];
                this.currentConversationId = data.currentConversationId;
                this.currentModel = data.currentModel || 'phi3';
                this.modelStatus = data.modelStatus || this.modelStatus;
                
                // إذا كان هناك محادثة حالية، تحميلها
                if (this.currentConversationId && this.conversations.length > 0) {
                    this.loadConversation(this.currentConversationId);
                }
                
                // تحديث حالة النماذج
                Object.keys(this.modelStatus).forEach(modelId => {
                    this.updateModelStatusUI(modelId);
                });
                
                console.log('✅ تم تحميل المحادثات المحفوظة');
            } catch (error) {
                console.error('❌ خطأ في تحميل المحادثات:', error);
            }
        }
    }

    // ===== تحديث: التهيئة =====
    async init() {
        console.log('🚀 تهيئة مركز الذكاء الاصطناعي...');
        
        // تحميل الإعدادات
        this.loadSettings();
        
        // تحميل المحادثات المحفوظة
        this.loadSavedConversations();
        
        // تهيئة واجهة المستخدم
        this.initUI();
        
        // تسجيل Service Worker
        this.registerServiceWorker();
        
        // تحميل النماذج الأساسية
        await this.loadInitialModels();
        
        // تحديث حالة التخزين
        this.updateStorageInfo();
        
        console.log('✅ التهيئة اكتملت بنجاح');
        this.showAlert('مرحبًا بك في مركز الذكاء الاصطناعي!', 'success');
    }

    // ===== جديد: تحميل النماذج الأولية =====
    async loadInitialModels() {
        // تحميل Phi-3 تلقائيًا (النموذج الخفيف)
        if (!this.modelStatus.phi3.loaded) {
            await this.loadModel('phi3');
        }
    }
}

// ===== تحديثات الـ CSS =====
// أضف هذا في ملف style.css
const additionalCSS = `
/* ===== المحادثات ===== */
.conversations-list {
    padding: 20px;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    max-height: 300px;
    overflow-y: auto;
}

.conversations-list h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    color: var(--text-color);
    font-size: 16px;
}

.conversation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 15px;
    margin-bottom: 8px;
    border-radius: var(--border-radius-md);
    background-color: var(--bg-secondary);
    cursor: pointer;
    transition: all 0.2s;
}

.conversation-item:hover {
    background-color: var(--bg-tertiary);
    transform: translateX(-5px);
}

.conversation-item.active {
    background-color: rgba(26, 115, 232, 0.1);
    border-left: 3px solid var(--primary-color);
}

.conversation-item i {
    color: var(--primary-color);
    font-size: 14px;
    width: 20px;
}

.conversation-item span {
    flex: 1;
    font-size: 14px;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.conversation-item small {
    font-size: 11px;
    color: var(--text-secondary);
}

/* ===== مؤشر التفكير ===== */
.thinking-indicator {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin: 15px 0;
}

.thinking-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--primary-color);
    animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-indicator span:nth-child(1) { animation-delay: -0.32s; }
.thinking-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
}

/* ===== رسوم متحركة ===== */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in {
    animation: fadeIn 0.3s ease;
}

/* ===== تحسين واجهة تسجيل الدخول ===== */
.login-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}

.login-tab {
    flex: 1;
    padding: 12px;
    background: none;
    border: none;
    border-radius: var(--border-radius-md);
    font-family: var(--font-primary);
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
}

.login-tab.active {
    background-color: var(--primary-color);
    color: white;
}

.login-tab:hover:not(.active) {
    background-color: var(--bg-secondary);
}

.login-tab-content {
    animation: fadeIn 0.3s ease;
}

.form-input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-family: var(--font-primary);
    font-size: 15px;
    background-color: var(--bg-secondary);
    color: var(--text-color);
    transition: border-color 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.btn-block {
    width: 100%;
    margin-top: 15px;
}

.login-divider {
    display: flex;
    align-items: center;
    margin: 20px 0;
    color: var(--text-secondary);
}

.login-divider::before,
.login-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--border-color);
}

.login-divider span {
    padding: 0 15px;
    font-size: 14px;
}

.guest-info {
    text-align: center;
    padding: 20px 0;
}

.guest-icon {
    font-size: 60px;
    color: var(--primary-color);
    margin-bottom: 15px;
}

.guest-info h4 {
    margin-bottom: 10px;
    color: var(--text-color);
}

.guest-info p {
    color: var(--text-secondary);
    margin-bottom: 25px;
    line-height: 1.6;
}
`;

// أضف الـ CSS الإضافي
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = additionalCSS;
    document.head.appendChild(style);
});

// ===== التعديلات النهائية للدوال العامة =====
function newChat() { app.newChat(); }
function clearChat() { 
    if (confirm('هل تريد مسح المحادثة الحالية فقط؟')) {
        app.clearChatUI(); 
    }
}
