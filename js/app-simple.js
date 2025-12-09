// ===== تطبيق بسيط يعمل فوراً =====

// المتغيرات العامة
let currentModel = 'phi3';
let isSidebarOpen = false;
let isDarkMode = false;
let isCompareMode = false;
let messages = [];

// النماذج
const models = {
    phi3: {
        name: 'Phi-3-mini',
        icon: 'fas fa-bolt',
        color: '#34a853',
        description: 'نموذج سريع وخفيف للمهام اليومية'
    },
    qwen: {
        name: 'Qwen-3-Max',
        icon: 'fas fa-crown',
        color: '#1a73e8',
        description: 'الأفضل للغة العربية والأسئلة المعقدة'
    },
    deepseek: {
        name: 'DeepSeek-Coder',
        icon: 'fas fa-code',
        color: '#ea4335',
        description: 'متخصص في البرمجة وحل المشاكل'
    }
};

// ===== تهيئة التطبيق =====
function initApp() {
    console.log('🚀 بدء تشغيل مركز الذكاء الاصطناعي...');
    
    // ربط الأحداث
    bindEvents();
    
    // تحميل الإعدادات
    loadSettings();
    
    // ملء القائمة الجانبية
    populateModelList();
    
    // تحديث حالة الاتصال
    updateConnectionStatus();
    
    // إعداد PWA
    setupPWA();
    
    console.log('✅ التطبيق جاهز');
    showAlert('مرحبًا بك! التطبيق يعمل الآن', 'success');
}

// ===== ربط الأحداث =====
function bindEvents() {
    // القائمة الجانبية
    document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
    document.getElementById('closeSidebar').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
    
    // الأزرار
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    document.getElementById('newChatBtn').addEventListener('click', newChat);
    document.getElementById('clearChatBtn').addEventListener('click', clearChat);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('openSettingsBtn').addEventListener('click', openSettings);
    
    // الإدخال
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // الإجراءات السريعة
    document.querySelectorAll('.specialty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            quickAction(this.dataset.action);
        });
    });
    
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', function() {
            quickAction(this.dataset.action);
        });
    });
    
    // الأزرار الأخرى
    document.getElementById('attachFileBtn').addEventListener('click', () => {
        showAlert('ميزة رفع الملفات قيد التطوير', 'info');
    });
    
    document.getElementById('thinkingBtn').addEventListener('click', () => {
        showAlert('وضع التفكير العميق قيد التطوير', 'info');
    });
    
    document.getElementById('webSearchBtn').addEventListener('click', () => {
        if (navigator.onLine) {
            showAlert('البحث على الويب قيد التطوير', 'info');
        } else {
            showAlert('البحث على الويب غير متاح في وضع عدم الاتصال', 'warning');
        }
    });
    
    document.getElementById('closeAlert').addEventListener('click', hideAlert);
}

// ===== إدارة القائمة الجانبية =====
function populateModelList() {
    const modelList = document.getElementById('modelList');
    modelList.innerHTML = '';
    
    Object.entries(models).forEach(([id, model]) => {
        const item = document.createElement('div');
        item.className = `model-item ${id === currentModel ? 'active' : ''}`;
        item.innerHTML = `
            <div class="model-icon" style="background-color: ${model.color};">
                <i class="${model.icon}"></i>
            </div>
            <div class="model-info">
                <h4>${model.name}</h4>
                <p>${model.description}</p>
            </div>
            <div class="model-status">
                <span class="status-dot ${id === currentModel ? 'active' : ''}"></span>
            </div>
        `;
        
        item.addEventListener('click', () => selectModel(id));
        modelList.appendChild(item);
    });
    
    // إضافة وضع المقارنة
    const compareItem = document.createElement('div');
    compareItem.className = 'model-item compare-mode';
    compareItem.innerHTML = `
        <div class="model-icon" style="background: linear-gradient(135deg, #1a73e8, #34a853);">
            <i class="fas fa-balance-scale"></i>
        </div>
        <div class="model-info">
            <h4>وضع المقارنة</h4>
            <p>مقارنة ردود النماذج الثلاثة</p>
        </div>
        <div class="compare-switch">
            <label class="switch">
                <input type="checkbox" id="compareToggle" ${isCompareMode ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
    `;
    
    compareItem.addEventListener('click', toggleCompareMode);
    modelList.appendChild(compareItem);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    isSidebarOpen = !isSidebarOpen;
    
    if (isSidebarOpen) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
}

function selectModel(modelId) {
    if (models[modelId]) {
        // تحديث العناصر النشطة
        document.querySelectorAll('.model-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.status-dot')?.classList.remove('active');
        });
        
        // تحديث النموذج الجديد
        const newItem = document.querySelector(`.model-item:nth-child(${Object.keys(models).indexOf(modelId) + 1})`);
        if (newItem) {
            newItem.classList.add('active');
            newItem.querySelector('.status-dot')?.classList.add('active');
        }
        
        currentModel = modelId;
        
        // تحديث الشارة
        const model = models[modelId];
        const badge = document.getElementById('currentModelBadge');
        badge.innerHTML = `<i class="${model.icon}"></i> ${model.name}`;
        badge.style.backgroundColor = model.color;
        
        showAlert(`تم التبديل إلى ${model.name}`, 'info');
        toggleSidebar();
    }
}

// ===== إدارة المحادثات =====
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // إضافة رسالة المستخدم
    addMessage('user', message);
    input.value = '';
    autoResize(input);
    
    // إخفاء رسالة الترحيب
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'block';
    
    // معالجة الرسالة
    processMessage(message);
}

function addMessage(sender, content, modelId = null) {
    const container = document.getElementById('messagesContainer');
    const messageId = 'msg_' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.id = messageId;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(content)}</div>
                <div class="message-actions">
                    <button class="message-action-btn" onclick="copyMessage('${messageId}')" title="نسخ">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        const model = modelId ? models[modelId] : models[currentModel];
        messageDiv.innerHTML = `
            <div class="ai-message">
                <div class="ai-avatar" style="background-color: ${model.color}">
                    <i class="${model.icon}"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <strong>${model.name}</strong>
                        <small>${new Date().toLocaleTimeString('ar-SA')}</small>
                    </div>
                    <div class="message-text">${formatResponse(content)}</div>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="copyMessage('${messageId}')" title="نسخ">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    // حفظ الرسالة
    messages.push({
        id: messageId,
        sender,
        content,
        model: modelId || currentModel,
        timestamp: new Date().toISOString()
    });
}

async function processMessage(message) {
    if (isCompareMode) {
        // وضع المقارنة
        const responses = {};
        
        for (const modelId in models) {
            await new Promise(resolve => setTimeout(resolve, 800));
            responses[modelId] = generateResponse(message, modelId);
        }
        
        for (const [modelId, response] of Object.entries(responses)) {
            addMessage('ai', response, modelId);
        }
    } else {
        // وضع النموذج الواحد
        await new Promise(resolve => setTimeout(resolve, 1200));
        const response = generateResponse(message, currentModel);
        addMessage('ai', response);
    }
}

function generateResponse(message, modelId) {
    const responses = {
        phi3: `هذا رد من Phi-3-mini (النموذج السريع):

سؤالك: "${message.substring(0, 50)}..."

Phi-3-mini مصمم للمهام اليومية السريعة والردود المختصرة. إنه مثالي للأجهزة محدودة الموارد والاستخدام اليومي.`,

        qwen: `هذا رد من Qwen-3-Max (النموذج المتقدم):

"${message.substring(0, 50)}..." - سؤال ممتاز!

Qwen-3-Max يتميز بدعم ممتاز للغة العربية والقدرة على معالجة الأسئلة المعقدة. لديّ معرفة شاملة في مختلف المجالات.`,

        deepseek: `// رد من DeepSeek-Coder (النموذج المبرمج):

/*
سؤالك: "${message.substring(0, 50)}..."
*/

// DeepSeek-Coder متخصص في حل المشاكل البرمجية
// يمكنه كتابة، تصحيح، وتحليل الأكواد`
    };
    
    return responses[modelId] || 'عذرًا، النموذج غير متوفر حاليًا.';
}

function clearChat() {
    if (confirm('هل تريد مسح المحادثة الحالية؟')) {
        document.getElementById('messagesContainer').innerHTML = '';
        messages = [];
        document.getElementById('welcomeSection').style.display = 'block';
        document.getElementById('chatContainer').style.display = 'none';
        showAlert('تم مسح المحادثة', 'info');
    }
}

function newChat() {
    clearChat();
}

// ===== إعدادات =====
function loadSettings() {
    const savedTheme = localStorage.getItem('aiHub_theme');
    if (savedTheme === 'dark') {
        toggleTheme();
    }
    
    const savedModel = localStorage.getItem('aiHub_model');
    if (savedModel && models[savedModel]) {
        currentModel = savedModel;
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeBtn').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeBtn').innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    localStorage.setItem('aiHub_theme', isDarkMode ? 'dark' : 'light');
}

function toggleCompareMode() {
    isCompareMode = !isCompareMode;
    const toggle = document.getElementById('compareToggle');
    if (toggle) toggle.checked = isCompareMode;
    
    showAlert(`وضع المقارنة ${isCompareMode ? 'مفعل' : 'معطل'}`, 'info');
}

function openSettings() {
    showAlert('نافذة الإعدادات قيد التطوير', 'info');
}

// ===== إجراءات سريعة =====
function quickAction(action) {
    const prompts = {
        writer: 'أريد مساعدتك في كتابة مقال عن أهمية الذكاء الاصطناعي في التعليم',
        coder: 'ساعدني في كتابة دالة JavaScript لفرز المصفوفات',
        assistant: 'ما هي أفضل الطرق لتنظيم الوقت وتحسين الإنتاجية؟',
        researcher: 'ما هي أحدث التطورات في مجال الذكاء الاصطناعي في 2025؟',
        question: 'ما هو الفرق بين الذكاء الاصطناعي والتعلم الآلي؟',
        code: 'اكتب كود Python لتحليل البيانات',
        translate: 'ترجم هذه الجملة إلى الإنجليزية: الذكاء الاصطناعي يغير العالم',
        creative: 'اكتب قصيدة قصيرة عن التكنولوجيا والابتكار'
    };
    
    const message = prompts[action] || action;
    document.getElementById('messageInput').value = message;
    autoResize(document.getElementById('messageInput'));
    setTimeout(() => sendMessage(), 500);
}

// ===== PWA =====
function setupPWA() {
    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker مسجل:', registration.scope);
            })
            .catch(error => {
                console.error('❌ فشل تسجيل Service Worker:', error);
            });
    }
    
    // زر التثبيت
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'flex';
            
            installBtn.addEventListener('click', async () => {
                installBtn.style.display = 'none';
                if (!deferredPrompt) return;
                
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('✅ تم قبول التثبيت');
                    showAlert('تم تثبيت التطبيق بنجاح!', 'success');
                } else {
                    console.log('❌ تم رفض التثبيت');
                }
                
                deferredPrompt = null;
            });
        }
    });
    
    window.addEventListener('appinstalled', () => {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) installBtn.style.display = 'none';
        showAlert('تم تثبيت التطبيق على جهازك!', 'success');
    });
}

// ===== أدوات مساعدة =====
function updateConnectionStatus() {
    const isOnline = navigator.onLine;
    const statusDot = document.getElementById('connectionStatusDot');
    const statusText = document.getElementById('connectionStatusText');
    
    if (isOnline) {
        statusDot.className = 'status-indicator online';
        statusText.textContent = '🟢 متصل';
    } else {
        statusDot.className = 'status-indicator offline';
        statusText.textContent = '🔴 غير متصل';
        showAlert('أنت الآن في وضع عدم الاتصال', 'info');
    }
}

function showAlert(message, type = 'info') {
    const alertBar = document.getElementById('alertBar');
    const alertText = document.getElementById('alertText');
    
    const colors = {
        success: '#34a853',
        error: '#ea4335',
        warning: '#fbbc05',
        info: '#1a73e8'
    };
    
    alertBar.style.background = `linear-gradient(135deg, ${colors[type]}, ${colors[type]}99)`;
    alertText.textContent = message;
    alertBar.style.display = 'flex';
    
    setTimeout(hideAlert, 4000);
}

function hideAlert() {
    document.getElementById('alertBar').style.display = 'none';
}

function copyMessage(messageId) {
    const message = document.getElementById(messageId);
    if (!message) return;
    
    const text = message.querySelector('.message-text')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        showAlert('تم نسخ الرسالة إلى الحافظة', 'success');
    });
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatResponse(text) {
    text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    text = text.replace(/\n/g, '<br>');
    return text;
}

// ===== بدء التطبيق =====
document.addEventListener('DOMContentLoaded', initApp);

// جعل الدوال متاحة عالميًا
window.copyMessage = copyMessage;

// تحديث حالة الاتصال عند التغيير
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);