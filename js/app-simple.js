[file name]: js/app-simple.js
[file content begin]
// ===== تطبيق مركز الذكاء الاصطناعي - النسخة المحسنة =====

// المتغيرات العامة
let currentModel = 'phi3';
let isSidebarOpen = false;
let isDarkMode = false;
let isCompareMode = false;
let messages = [];
let deferredPrompt = null;
let isOnline = navigator.onLine;

// النماذج
const models = {
    phi3: {
        id: 'phi3',
        name: 'Phi-3-mini',
        icon: 'fas fa-bolt',
        color: '#34a853',
        description: 'نموذج سريع وخفيف للمهام اليومية',
        specialty: 'عام'
    },
    qwen: {
        id: 'qwen',
        name: 'Qwen-3-Max',
        icon: 'fas fa-crown',
        color: '#1a73e8',
        description: 'الأفضل للغة العربية والأسئلة المعقدة',
        specialty: 'عربي'
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek-Coder',
        icon: 'fas fa-code',
        color: '#ea4335',
        description: 'متخصص في البرمجة وحل المشاكل',
        specialty: 'برمجة'
    }
};

// ===== تهيئة التطبيق =====
function initApp() {
    console.log('🚀 بدء تشغيل مركز الذكاء الاصطناعي...');
    console.log('🌐 حالة الاتصال:', isOnline ? 'متصل' : 'غير متصل');
    
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
    
    // التحقق من تثبيت PWA
    checkIfPWAInstalled();
    
    console.log('✅ التطبيق جاهز للاستخدام');
    showAlert('مرحبًا بك! اختر نموذجًا لتبدأ المحادثة', 'info');
}

// ===== ربط الأحداث =====
function bindEvents() {
    // القائمة الجانبية
    document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
    document.getElementById('closeSidebar').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
    
    // زر تثبيت PWA
    document.getElementById('installBtn').addEventListener('click', promptInstall);
    document.getElementById('showInstallTip')?.addEventListener('click', showInstallGuide);
    document.getElementById('closeInstallModal')?.addEventListener('click', () => {
        document.getElementById('installModal').style.display = 'none';
    });
    
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
        if (isOnline) {
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
        item.dataset.modelId = id;
        item.innerHTML = `
            <div class="model-icon" style="background-color: ${model.color};">
                <i class="${model.icon}"></i>
            </div>
            <div class="model-info">
                <h4>${model.name}</h4>
                <p>${model.description}</p>
                <span class="model-size">${model.specialty}</span>
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
            <span class="model-size">خاصية</span>
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
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
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
        const newItem = document.querySelector(`.model-item[data-model-id="${modelId}"]`);
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
        
        // تحديث نص الحالة
        document.getElementById('modelStatusText').textContent = 'جاهز';
        
        showAlert(`تم التبديل إلى ${model.name}`, 'success');
        toggleSidebar();
        
        // حفظ الإعدادات
        saveSettings();
    }
}

// ===== إدارة المحادثات =====
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) {
        showAlert('يرجى كتابة رسالة', 'warning');
        return;
    }
    
    // إضافة رسالة المستخدم
    addMessage('user', message);
    input.value = '';
    autoResize(input);
    
    // إخفاء رسالة الترحيب
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'block';
    
    // إظهار حالة المعالجة
    const statusText = document.getElementById('modelStatusText');
    statusText.textContent = 'جاري المعالجة...';
    
    // معالجة الرسالة
    processMessage(message);
}

function addMessage(sender, content, modelId = null) {
    const container = document.getElementById('messagesContainer');
    const messageId = 'msg_' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.id = messageId;
    
    const timestamp = new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(content)}</div>
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
        const model = modelId ? models[modelId] : models[currentModel];
        messageDiv.innerHTML = `
            <div class="ai-message">
                <div class="ai-avatar" style="background-color: ${model.color}">
                    <i class="${model.icon}"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <strong>${model.name}</strong>
                        <small>${timestamp}</small>
                    </div>
                    <div class="message-text">${formatResponse(content)}</div>
                    <div class="message-meta">
                        <span class="model-tag" style="background-color: ${model.color}20; color: ${model.color}">${model.specialty}</span>
                    </div>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="copyMessage('${messageId}')" title="نسخ">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn" onclick="likeMessage('${messageId}')" title="إعجاب">
                            <i class="far fa-thumbs-up"></i>
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
    
    // حفظ المحادثة
    saveConversation();
}

async function processMessage(message) {
    if (isCompareMode) {
        // وضع المقارنة
        showAlert('جاري مقارنة ردود النماذج...', 'info');
        const responses = {};
        
        // إضافة رسالة تحميل
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'comparison-loading';
        loadingDiv.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>جاري تحليل الرسالة بواسطة النماذج الثلاثة...</p>
            </div>
        `;
        document.getElementById('messagesContainer').appendChild(loadingDiv);
        
        // توليد الردود
        for (const modelId in models) {
            await new Promise(resolve => setTimeout(resolve, 800));
            responses[modelId] = generateResponse(message, modelId);
        }
        
        // إزالة رسالة التحميل
        loadingDiv.remove();
        
        // عرض الردود
        for (const [modelId, response] of Object.entries(responses)) {
            addMessage('ai', response, modelId);
        }
        
        showAlert('تمت مقارنة النماذج بنجاح', 'success');
    } else {
        // وضع النموذج الواحد
        await new Promise(resolve => setTimeout(resolve, 1200));
        const response = generateResponse(message, currentModel);
        addMessage('ai', response);
    }
    
    // تحديث حالة النموذج
    document.getElementById('modelStatusText').textContent = 'جاهز';
}

function generateResponse(message, modelId) {
    const responses = {
        phi3: `هذا رد من Phi-3-mini (النموذج السريع):

سؤالك: "${message.substring(0, 50)}..."

Phi-3-mini مصمم للمهام اليومية السريعة والردود المختصرة. إنه مثالي للأجهزة محدودة الموارد والاستخدام اليومي.

**مميزاتي:**
- ⚡ سرعة فائقة في الرد
- 📱 استهلاك منخفض للذاكرة
- 🔋 كفاءة في استخدام الطاقة
- 💬 محادثات يومية بسيطة

كيف يمكنني مساعدتك أكثر؟`,

        qwen: `هذا رد من Qwen-3-Max (النموذج المتقدم):

"${message.substring(0, 50)}..." - سؤال ممتاز!

Qwen-3-Max يتميز بدعم ممتاز للغة العربية والقدرة على معالجة الأسئلة المعقدة. لديّ معرفة شاملة في مختلف المجالات.

**نقاط قوتي:**
- 🏆 أفضل نموذج للغة العربية
- 📚 معرفة عميقة في مختلف التخصصات
- 🎯 فهم دقيق للسياق الثقافي
- 💡 قدرات إبداعية متقدمة

يمكنني مساعدتك في: الكتابة، البحث، التحليل، الترجمة، وغيرها.`,

        deepseek: `// رد من DeepSeek-Coder (النموذج المبرمج):

/*
سؤالك: "${message.substring(0, 50)}..."
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
    
    return responses[modelId] || 'عذرًا، النموذج غير متوفر حاليًا.';
}

function clearChat() {
    if (messages.length === 0) {
        showAlert('لا توجد محادثة لمسحها', 'info');
        return;
    }
    
    if (confirm('هل تريد مسح المحادثة الحالية؟')) {
        document.getElementById('messagesContainer').innerHTML = '';
        messages = [];
        document.getElementById('welcomeSection').style.display = 'block';
        document.getElementById('chatContainer').style.display = 'none';
        showAlert('تم مسح المحادثة بنجاح', 'success');
        
        // حذف المحادثة من التخزين
        localStorage.removeItem('aiHub_currentConversation');
    }
}

function newChat() {
    if (messages.length > 0) {
        if (confirm('هل تريد بدء محادثة جديدة؟ سيتم حفظ المحادثة الحالية.')) {
            saveConversation();
            clearChat();
        }
    } else {
        showAlert('ابدأ محادثة جديدة باستخدام حقل الإدخال', 'info');
    }
}

// ===== إعدادات =====
function loadSettings() {
    // تحميل الثيم
    const savedTheme = localStorage.getItem('aiHub_theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeBtn').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // تحميل النموذج
    const savedModel = localStorage.getItem('aiHub_model');
    if (savedModel && models[savedModel]) {
        currentModel = savedModel;
        updateModelBadge();
    }
    
    // تحميل المحادثة
    const savedConversation = localStorage.getItem('aiHub_currentConversation');
    if (savedConversation) {
        try {
            const conv = JSON.parse(savedConversation);
            if (conv.messages && conv.messages.length > 0) {
                messages = conv.messages;
                document.getElementById('welcomeSection').style.display = 'none';
                document.getElementById('chatContainer').style.display = 'block';
                
                // إعادة بناء الرسائل
                conv.messages.forEach(msg => {
                    if (msg.sender === 'user') {
                        addMessage('user', msg.content);
                    } else {
                        addMessage('ai', msg.content, msg.model);
                    }
                });
                
                showAlert('تم تحميل المحادثة السابقة', 'info');
            }
        } catch (e) {
            console.error('خطأ في تحميل المحادثة:', e);
        }
    }
    
    // تحميل معلومات التخزين
    updateStorageInfo();
}

function saveSettings() {
    localStorage.setItem('aiHub_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('aiHub_model', currentModel);
}

function saveConversation() {
    if (messages.length > 0) {
        const conversation = {
            id: 'conv_' + Date.now(),
            model: currentModel,
            messages: messages,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('aiHub_currentConversation', JSON.stringify(conversation));
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

function toggleCompareMode() {
    isCompareMode = !isCompareMode;
    const toggle = document.getElementById('compareToggle');
    if (toggle) toggle.checked = isCompareMode;
    
    showAlert(`وضع المقارنة ${isCompareMode ? 'مفعل' : 'معطل'}`, 'info');
}

function openSettings() {
    showAlert('نافذة الإعدادات المتقدمة قيد التطوير', 'info');
}

// ===== إجراءات سريعة =====
function quickAction(action) {
    const prompts = {
        writer: 'أريد مساعدتك في كتابة مقال عن أهمية الذكاء الاصطناعي في التعليم، يرجى كتابة مقال متكامل مع مقدمة وعرض وخاتمة.',
        coder: 'ساعدني في كتابة دالة JavaScript لفرز المصفوفات مع شرح الخوارزمية وتعقيدها الزمني.',
        assistant: 'ما هي أفضل الطرق لتنظيم الوقت وتحسين الإنتاجية في العمل عن بعد؟ قدم لي خطة أسبوعية.',
        researcher: 'ما هي أحدث التطورات في مجال الذكاء الاصطناعي في عام 2025؟ وما تأثيرها على سوق العمل؟',
        question: 'ما هو الفرق بين الذكاء الاصطناعي والتعلم الآلي والشبكات العصبية؟ اشرح بمثال عملي.',
        code: 'اكتب كود Python لتحليل البيانات باستخدام pandas، مع مثال عملي لتحليل مجموعة بيانات.',
        translate: 'ترجم هذه الجملة إلى الإنجليزية: "الذكاء الاصطناعي يغير طريقة عملنا وتعلمنا وحياتنا اليومية" وأضف شرحاً للترجمة.',
        creative: 'اكتب قصيدة قصيرة عن التكنولوجيا والابتكار في العصر الحديث، باستخدام لغة شعرية جميلة.'
    };
    
    const message = prompts[action] || action;
    document.getElementById('messageInput').value = message;
    autoResize(document.getElementById('messageInput'));
    
    // إذا كانت القائمة الجانبية مفتوحة، أغلقها
    if (isSidebarOpen) {
        toggleSidebar();
    }
    
    setTimeout(() => {
        document.getElementById('messageInput').focus();
        showAlert('تم تحضير الرسالة، اضغط إرسال أو Enter', 'info');
    }, 300);
}

// ===== PWA =====
function setupPWA() {
    // استمع لحدث beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 حدث beforeinstallprompt تم استقباله');
        e.preventDefault();
        deferredPrompt = e;
        
        // تأخير عرض الزر لمدة 5 ثواني
        setTimeout(() => {
            showInstallButton();
        }, 5000);
    });
    
    // استمع لحدث appinstalled
    window.addEventListener('appinstalled', () => {
        console.log('🎉 تم تثبيت PWA بنجاح');
        hideInstallButton();
        localStorage.setItem('aiHub_installed', 'true');
        showAlert('تم تثبيت التطبيق بنجاح على جهازك!', 'success');
    });
    
    // تحديث حالة التخزين
    updateStorageInfo();
}

function showInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn && !localStorage.getItem('aiHub_installed')) {
        installBtn.style.display = 'flex';
        installBtn.classList.add('show');
        
        // إخفاء الزر بعد 30 ثانية
        setTimeout(() => {
            installBtn.classList.remove('show');
            setTimeout(() => {
                if (installBtn.classList.contains('show')) return;
                installBtn.style.display = 'none';
            }, 300);
        }, 30000);
    }
}

function hideInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.classList.remove('show');
        setTimeout(() => {
            installBtn.style.display = 'none';
        }, 300);
    }
}

async function promptInstall() {
    if (!deferredPrompt) {
        showAlert('زر التثبيت غير متاح حالياً', 'warning');
        return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('✅ تم قبول التثبيت');
        deferredPrompt = null;
    } else {
        console.log('❌ تم رفض التثبيت');
        showAlert('يمكنك تثبيت التطبيق لاحقاً من القائمة', 'info');
    }
}

function showInstallGuide() {
    document.getElementById('installModal').style.display = 'flex';
}

function checkIfPWAInstalled() {
    // التحقق مما إذا كان التطبيق مثبتاً
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone) {
        console.log('📱 التطبيق يعمل كـ PWA مثبت');
        hideInstallButton();
    }
}

// ===== أدوات مساعدة =====
function updateConnectionStatus() {
    isOnline = navigator.onLine;
    const statusDot = document.getElementById('connectionStatusDot');
    const statusText = document.getElementById('connectionStatusText');
    
    if (isOnline) {
        statusDot.className = 'status-indicator online';
        statusText.textContent = '🟢 متصل بالإنترنت';
        statusText.style.color = '#34a853';
    } else {
        statusDot.className = 'status-indicator offline';
        statusText.textContent = '🔴 غير متصل';
        statusText.style.color = '#ea4335';
        
        if (!localStorage.getItem('aiHub_offlineAlertShown')) {
            showAlert('أنت في وضع عدم الاتصال، التطبيق يعمل محلياً', 'info');
            localStorage.setItem('aiHub_offlineAlertShown', 'true');
            
            // إعادة تعيين بعد 5 دقائق
            setTimeout(() => {
                localStorage.removeItem('aiHub_offlineAlertShown');
            }, 300000);
        }
    }
}

function updateModelBadge() {
    const model = models[currentModel];
    const badge = document.getElementById('currentModelBadge');
    if (badge && model) {
        badge.innerHTML = `<i class="${model.icon}"></i> ${model.name}`;
        badge.style.backgroundColor = model.color;
    }
}

function updateStorageInfo() {
    try {
        let totalSize = 0;
        
        // حساب حجم جميع العناصر في localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += key.length + value.length;
        }
        
        // تحويل للـ MB
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        const percentage = Math.min((sizeInMB / 5) * 100, 100); // افترضنا 5MB كحد أقصى
        
        // تحديث واجهة المستخدم
        const storageFill = document.getElementById('storageFill');
        const storageText = document.getElementById('storageText');
        
        if (storageFill) {
            storageFill.style.width = percentage + '%';
        }
        
        if (storageText) {
            storageText.textContent = `${sizeInMB} / 5 MB مستخدم`;
        }
        
        // تحذير إذا تجاوز 80%
        if (percentage > 80) {
            showAlert('مساحة التخزين شبه ممتلئة، يرجى مسح بعض المحادثات', 'warning');
        }
        
    } catch (error) {
        console.error('خطأ في تحديث معلومات التخزين:', error);
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
    
    alertBar.style.background = colors[type];
    alertText.textContent = message;
    alertBar.style.display = 'flex';
    
    // إخفاء تلقائي بعد 4 ثواني
    setTimeout(hideAlert, 4000);
}

function hideAlert() {
    const alertBar = document.getElementById('alertBar');
    alertBar.style.display = 'none';
}

function copyMessage(messageId) {
    const message = document.getElementById(messageId);
    if (!message) return;
    
    const text = message.querySelector('.message-text')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        showAlert('تم نسخ الرسالة إلى الحافظة', 'success');
    });
}

function likeMessage(messageId) {
    const likeBtn = document.querySelector(`#${messageId} .fa-thumbs-up`);
    if (likeBtn) {
        if (likeBtn.classList.contains('far')) {
            likeBtn.classList.remove('far');
            likeBtn.classList.add('fas');
            likeBtn.style.color = '#1a73e8';
            showAlert('تم الإعجاب بالرسالة', 'info');
        } else {
            likeBtn.classList.remove('fas');
            likeBtn.classList.add('far');
            likeBtn.style.color = '';
            showAlert('تم إلغاء الإعجاب', 'info');
        }
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
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
    
    // تنسيق الكود المضمن
    text = text.replace(/`([^`]+)`/g, (match, code) => {
        return `<code>${escapeHtml(code)}</code>`;
    });
    
    // تنسيق النقاط
    text = text.replace(/^\s*[\-\*•]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // تنسيق العناوين
    text = text.replace(/^# (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h4>$1</h4>');
    
    // تنسيق النصوص الغامقة
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // تنسيق النصوص المائلة
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // تحويل الأسطر الجديدة
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// ===== بدء التطبيق =====
document.addEventListener('DOMContentLoaded', initApp);

// تحديث حالة الاتصال عند التغيير
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// جعل الدوال متاحة عالميًا
window.copyMessage = copyMessage;
window.likeMessage = likeMessage;
window.toggleSidebar = toggleSidebar;

// تحديث معلومات التخزين كل دقيقة
setInterval(updateStorageInfo, 60000);
[file content end]