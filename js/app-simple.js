// ===== تطبيق مركز الذكاء الاصطناعي - النسخة الكاملة =====

// المتغيرات
let currentModel = 'phi3';
let isSidebarOpen = false;
let isDarkMode = false;
let messages = [];

// النماذج
const models = {
    phi3: { 
        name: 'Phi-3-mini', 
        icon: 'fas fa-bolt', 
        color: '#34a853',
        description: 'نموذج سريع وخفيف'
    },
    qwen: { 
        name: 'Qwen-3-Max', 
        icon: 'fas fa-crown', 
        color: '#1a73e8',
        description: 'الأفضل للعربية'
    },
    deepseek: { 
        name: 'DeepSeek-Coder', 
        icon: 'fas fa-code', 
        color: '#ea4335',
        description: 'متخصص في البرمجة'
    }
};

// === تهيئة التطبيق ===
function initApp() {
    console.log('🚀 بدء تشغيل مركز الذكاء الاصطناعي...');
    
    // ربط الأحداث
    bindEvents();
    
    // تحميل الإعدادات
    loadSettings();
    
    // ملء القائمة
    populateModelList();
    
    // تحميل المحادثة
    loadConversation();
    
    console.log('✅ التطبيق جاهز');
    showAlert('مرحباً! اختر نموذجاً لتبدأ', 'info');
}

// === ربط جميع الأحداث ===
function bindEvents() {
    // القائمة الجانبية
    document.getElementById('menuBtn').onclick = toggleSidebar;
    document.getElementById('closeSidebar').onclick = toggleSidebar;
    document.getElementById('sidebarOverlay').onclick = toggleSidebar;
    
    // الأزرار الرئيسية
    document.getElementById('newChatBtn').onclick = newChat;
    document.getElementById('clearChatBtn').onclick = clearChat;
    document.getElementById('themeBtn').onclick = toggleTheme;
    document.getElementById('openSettingsBtn').onclick = openSettings;
    
    // الإدخال
    document.getElementById('sendButton').onclick = sendMessage;
    const messageInput = document.getElementById('messageInput');
    messageInput.onkeydown = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    // أزرار الإدخال
    document.getElementById('attachFileBtn').onclick = attachFile;
    document.getElementById('thinkingBtn').onclick = toggleThinkingMode;
    document.getElementById('webSearchBtn').onclick = toggleWebSearch;
    
    // التخصصات السريعة
    document.querySelectorAll('.specialty-btn').forEach(btn => {
        btn.onclick = function() { quickAction(this.dataset.action); };
    });
    
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.onclick = function() { quickAction(this.dataset.action); };
    });
    
    // التنبيهات
    document.getElementById('closeAlert').onclick = hideAlert;
    
    // نافذة التثبيت
    document.getElementById('showInstallTip')?.onclick = showInstallGuide;
    document.getElementById('closeInstallModal')?.onclick = () => {
        document.getElementById('installModal').style.display = 'none';
    };
}

// === القائمة الجانبية ===
function populateModelList() {
    const list = document.getElementById('modelList');
    list.innerHTML = '';
    
    for (const [id, model] of Object.entries(models)) {
        const item = document.createElement('div');
        item.className = `model-item ${id === currentModel ? 'active' : ''}`;
        item.innerHTML = `
            <div class="model-icon" style="background: ${model.color}">
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
        item.onclick = () => selectModel(id);
        list.appendChild(item);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    isSidebarOpen = !isSidebarOpen;
    sidebar.classList.toggle('open', isSidebarOpen);
    overlay.classList.toggle('active', isSidebarOpen);
    
    // منع التمرير عند فتح القائمة
    document.body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
}

function selectModel(modelId) {
    if (models[modelId]) {
        currentModel = modelId;
        
        // تحديث الشارة
        const badge = document.getElementById('currentModelBadge');
        if (badge) {
            badge.innerHTML = `<i class="${models[modelId].icon}"></i> ${models[modelId].name}`;
            badge.style.backgroundColor = models[modelId].color;
        }
        
        showAlert(`تم التبديل إلى ${models[modelId].name}`, 'success');
        toggleSidebar();
        
        // حفظ الإعدادات
        saveSettings();
    }
}

// === المحادثات ===
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) {
        showAlert('يرجى كتابة رسالة', 'warning');
        return;
    }
    
    // إضافة رسالة المستخدم
    addMessage('user', text);
    input.value = '';
    
    // إظهار منطقة المحادثة
    showChatContainer();
    
    // تحديث حالة النموذج
    const statusText = document.getElementById('modelStatusText');
    if (statusText) statusText.textContent = 'جاري المعالجة...';
    
    // توليد الرد بعد تأخير
    setTimeout(() => {
        const response = generateResponse(text);
        addMessage('ai', response);
        saveConversation();
        
        // تحديث الحالة
        if (statusText) statusText.textContent = 'جاهز';
    }, 1000);
}

function addMessage(sender, text) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    const messageId = 'msg_' + Date.now();
    const timestamp = new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const msg = document.createElement('div');
    msg.className = `message ${sender}-message`;
    msg.id = messageId;
    
    if (sender === 'user') {
        msg.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(text)}</div>
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-actions">
                    <button class="message-action-btn" onclick="copyMessage('${messageId}')" title="نسخ">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        const model = models[currentModel];
        msg.innerHTML = `
            <div class="ai-message">
                <div class="ai-avatar" style="background: ${model.color}">
                    <i class="${model.icon}"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <strong>${model.name}</strong>
                        <small>${timestamp}</small>
                    </div>
                    <div class="message-text">${formatResponse(text)}</div>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="copyMessage('${messageId}')" title="نسخ">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    messages.push({id: messageId, sender, text, time: new Date()});
}

function showChatContainer() {
    const welcomeSection = document.getElementById('welcomeSection');
    const chatContainer = document.getElementById('chatContainer');
    
    if (welcomeSection && chatContainer) {
        welcomeSection.style.display = 'none';
        chatContainer.style.display = 'block';
    }
}

function generateResponse(input) {
    const responses = {
        phi3: `هذا رد من Phi-3-mini (النموذج السريع):

سؤالك: "${input.substring(0, 50)}..."

Phi-3-mini مصمم للمهام اليومية السريعة والردود المختصرة. إنه مثالي للأجهزة محدودة الموارد والاستخدام اليومي.

**مميزاتي:**
- ⚡ سرعة فائقة في الرد
- 📱 استهلاك منخفض للذاكرة
- 🔋 كفاءة في استخدام الطاقة
- 💬 محادثات يومية بسيطة

كيف يمكنني مساعدتك أكثر؟`,

        qwen: `هذا رد من Qwen-3-Max (النموذج المتقدم):

"${input.substring(0, 50)}..." - سؤال ممتاز!

Qwen-3-Max يتميز بدعم ممتاز للغة العربية والقدرة على معالجة الأسئلة المعقدة. لديّ معرفة شاملة في مختلف المجالات.

**نقاط قوتي:**
- 🏆 أفضل نموذج للغة العربية
- 📚 معرفة عميقة في مختلف التخصصات
- 🎯 فهم دقيق للسياق الثقافي
- 💡 قدرات إبداعية متقدمة

يمكنني مساعدتك في: الكتابة، البحث، التحليل، الترجمة، وغيرها.`,

        deepseek: `// رد من DeepSeek-Coder (النموذج المبرمج):

/*
سؤالك: "${input.substring(0, 50)}..."
*/

// DeepSeek-Coder متخصص في حل المشاكل البرمجية
// يمكنه كتابة، تصحيح، وتحليل الأكواد

function analyzeRequest(message) {
    const requirements = extractRequirements(message);
    const solutionType = determineSolutionType(requirements);
    return generateOptimalSolution(solutionType);
}

**تخصصاتي:**
- 💻 كتابة الأكواد البرمجية
- 🐛 تصحيح الأخطاء (Debugging)
- 📝 توثيق البرمجيات
- 🔍 تحليل الخوارزميات
- ⚡ تحسين الأداء

أي لغة برمجة تفضل العمل بها؟`
    };
    
    return responses[currentModel] || 'عذرًا، النموذج غير متوفر حاليًا.';
}

function newChat() {
    if (messages.length > 0) {
        if (!confirm('هل تريد بدء محادثة جديدة؟ سيتم حفظ المحادثة الحالية.')) {
            return;
        }
    }
    
    // حفظ المحادثة الحالية
    saveConversation();
    
    // بدء جديدة
    messages = [];
    const container = document.getElementById('messagesContainer');
    if (container) container.innerHTML = '';
    
    const welcomeSection = document.getElementById('welcomeSection');
    const chatContainer = document.getElementById('chatContainer');
    if (welcomeSection && chatContainer) {
        welcomeSection.style.display = 'block';
        chatContainer.style.display = 'none';
    }
    
    showAlert('بدأت محادثة جديدة', 'success');
}

function clearChat() {
    if (messages.length === 0) {
        showAlert('لا توجد محادثة لمسحها', 'info');
        return;
    }
    
    if (confirm('هل تريد مسح المحادثة الحالية؟')) {
        messages = [];
        const container = document.getElementById('messagesContainer');
        if (container) container.innerHTML = '';
        
        const welcomeSection = document.getElementById('welcomeSection');
        const chatContainer = document.getElementById('chatContainer');
        if (welcomeSection && chatContainer) {
            welcomeSection.style.display = 'block';
            chatContainer.style.display = 'none';
        }
        
        // حذف من التخزين
        localStorage.removeItem('aiHub_conversation');
        showAlert('تم مسح المحادثة', 'success');
    }
}

// === الأزرار المفقودة ===
function attachFile() {
    console.log('📎 رفع ملف');
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.pdf,.jpg,.png';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            showAlert(`تم رفع الملف: ${file.name}`, 'success');
            // هنا يمكن إضافة محتوى الملف للرسالة
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                // يمكن استخدام content هنا
                console.log('محتوى الملف:', content.substring(0, 100));
            };
            reader.readAsText(file);
        }
        document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

function toggleThinkingMode() {
    showAlert('وضع التفكير العميق قيد التطوير', 'info');
}

function toggleWebSearch() {
    if (navigator.onLine) {
        showAlert('البحث على الويب قيد التطوير', 'info');
    } else {
        showAlert('البحث على الويب غير متاح في وضع عدم الاتصال', 'warning');
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeBtn').innerHTML = '<i class="fas fa-sun"></i>';
        document.getElementById('themeBtn').title = 'الوضع الفاتح';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeBtn').innerHTML = '<i class="fas fa-moon"></i>';
        document.getElementById('themeBtn').title = 'الوضع الداكن';
    }
    
    saveSettings();
    showAlert(`تم التبديل إلى الوضع ${isDarkMode ? 'الداكن' : 'الفاتح'}`, 'info');
}

function openSettings() {
    showAlert('نافذة الإعدادات قيد التطوير', 'info');
}

// === إجراءات سريعة ===
function quickAction(action) {
    const prompts = {
        writer: 'أريد مساعدتك في كتابة مقال عن أهمية الذكاء الاصطناعي في التعليم.',
        coder: 'ساعدني في كتابة دالة JavaScript لفرز المصفوفات.',
        assistant: 'ما هي أفضل الطرق لتنظيم الوقت؟',
        researcher: 'ما هي أحدث التطورات في مجال الذكاء الاصطناعي؟',
        question: 'ما هو الفرق بين الذكاء الاصطناعي والتعلم الآلي؟',
        code: 'اكتب كود Python لتحليل البيانات.',
        translate: 'ترجم هذه الجملة إلى الإنجليزية.',
        creative: 'اكتب قصيدة قصيرة عن التكنولوجيا.'
    };
    
    const message = prompts[action] || action;
    const input = document.getElementById('messageInput');
    input.value = message;
    input.focus();
    
    // إغلاق القائمة إذا كانت مفتوحة
    if (isSidebarOpen) {
        toggleSidebar();
    }
    
    showAlert('تم تحضير الرسالة، اضغط إرسال', 'info');
}

// === إعدادات ===
function loadSettings() {
    // تحميل الثيم
    const savedTheme = localStorage.getItem('aiHub_theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // تحميل النموذج
    const savedModel = localStorage.getItem('aiHub_model');
    if (savedModel && models[savedModel]) {
        currentModel = savedModel;
        updateModelBadge();
    }
}

function saveSettings() {
    localStorage.setItem('aiHub_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('aiHub_model', currentModel);
}

function updateModelBadge() {
    const model = models[currentModel];
    const badge = document.getElementById('currentModelBadge');
    if (badge && model) {
        badge.innerHTML = `<i class="${model.icon}"></i> ${model.name}`;
        badge.style.backgroundColor = model.color;
    }
}

function loadConversation() {
    try {
        const saved = localStorage.getItem('aiHub_conversation');
        if (saved) {
            const data = JSON.parse(saved);
            messages = data.messages || [];
            
            if (messages.length > 0) {
                // إعادة بناء الرسائل
                messages.forEach(msg => {
                    if (msg.sender === 'user') {
                        addMessage('user', msg.text);
                    } else {
                        addMessage('ai', msg.text);
                    }
                });
                
                showChatContainer();
                showAlert('تم تحميل المحادثة السابقة', 'info');
            }
        }
    } catch(e) {
        console.error('خطأ في تحميل المحادثة:', e);
    }
}

function saveConversation() {
    const data = {
        messages: messages,
        model: currentModel,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('aiHub_conversation', JSON.stringify(data));
}

function showInstallGuide() {
    const modal = document.getElementById('installModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// === أدوات ===
function showAlert(msg, type = 'info') {
    const bar = document.getElementById('alertBar');
    const text = document.getElementById('alertText');
    
    if (!bar || !text) return;
    
    const colors = {
        success: '#34a853',
        error: '#ea4335',
        warning: '#fbbc05',
        info: '#1a73e8'
    };
    
    bar.style.background = colors[type];
    text.textContent = msg;
    bar.style.display = 'flex';
    
    setTimeout(hideAlert, 3000);
}

function hideAlert() {
    const bar = document.getElementById('alertBar');
    if (bar) bar.style.display = 'none';
}

function copyMessage(messageId) {
    const message = document.getElementById(messageId);
    if (!message) return;
    
    const textElement = message.querySelector('.message-text');
    if (!textElement) return;
    
    const text = textElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showAlert('تم نسخ الرسالة', 'success');
    }).catch(err => {
        console.error('فشل النسخ:', err);
        showAlert('فشل نسخ الرسالة', 'error');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatResponse(text) {
    // تنسيق الأكواد
    text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // تنسيق النصوص الغامقة
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // تحويل الأسطر الجديدة
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// === بدء التطبيق ===
document.addEventListener('DOMContentLoaded', initApp);

// جعل الدوال متاحة عالمياً
window.copyMessage = copyMessage;
window.toggleSidebar = toggleSidebar;