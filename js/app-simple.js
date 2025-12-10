// ===== تطبيق بسيط يعمل فوراً =====

// المتغيرات
let currentModel = 'phi3';
let isSidebarOpen = false;
let messages = [];

// النماذج
const models = {
    phi3: { name: 'Phi-3', icon: 'fas fa-bolt', color: '#34a853' },
    qwen: { name: 'Qwen-3', icon: 'fas fa-crown', color: '#1a73e8' },
    deepseek: { name: 'DeepSeek', icon: 'fas fa-code', color: '#ea4335' }
};

// === تهيئة ===
function initApp() {
    console.log('🚀 بدء التطبيق...');
    
    // ربط الأحداث
    document.getElementById('menuBtn').onclick = toggleSidebar;
    document.getElementById('closeSidebar').onclick = toggleSidebar;
    document.getElementById('sidebarOverlay').onclick = toggleSidebar;
    
    document.getElementById('newChatBtn').onclick = newChat;
    document.getElementById('clearChatBtn').onclick = clearChat;
    
    document.getElementById('sendButton').onclick = sendMessage;
    document.getElementById('messageInput').onkeydown = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    document.getElementById('attachFileBtn').onclick = attachFile;
    
    // التخصصات
    document.querySelectorAll('.specialty-btn').forEach(btn => {
        btn.onclick = function() { quickAction(this.dataset.action); };
    });
    
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.onclick = function() { quickAction(this.dataset.action); };
    });
    
    document.getElementById('closeAlert').onclick = hideAlert;
    
    // ملء القائمة
    populateModelList();
    
    // تحميل المحادثة السابقة
    loadConversation();
    
    console.log('✅ التطبيق جاهز');
    showAlert('مرحباً! اختر نموذجاً', 'info');
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
}

function selectModel(modelId) {
    currentModel = modelId;
    document.getElementById('currentModelBadge').innerHTML = 
        `<i class="${models[modelId].icon}"></i> ${models[modelId].name}`;
    toggleSidebar();
    showAlert(`تم التبديل إلى ${models[modelId].name}`, 'success');
}

// === المحادثات ===
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;
    
    addMessage('user', text);
    input.value = '';
    
    // إظهار منطقة المحادثة
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'block';
    
    // رد AI
    setTimeout(() => {
        const response = generateResponse(text);
        addMessage('ai', response);
        saveConversation();
    }, 1000);
}

function addMessage(sender, text) {
    const container = document.getElementById('messagesContainer');
    const msg = document.createElement('div');
    msg.className = `message ${sender}-message`;
    
    if (sender === 'user') {
        msg.innerHTML = `<div class="message-content">${escapeHtml(text)}</div>`;
    } else {
        const model = models[currentModel];
        msg.innerHTML = `
            <div class="ai-message">
                <div class="ai-avatar" style="background: ${model.color}">
                    <i class="${model.icon}"></i>
                </div>
                <div class="message-content">
                    <strong>${model.name}</strong><br>
                    ${formatResponse(text)}
                </div>
            </div>
        `;
    }
    
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    messages.push({sender, text, time: new Date()});
}

function generateResponse(input) {
    const responses = {
        phi3: `هذا رد من Phi-3:<br><br>سؤالك: "${input.substring(0,50)}..."`,
        qwen: `هذا رد من Qwen-3:<br><br>"${input.substring(0,50)}..." - سؤال جيد!`,
        deepseek: `// رد من DeepSeek:<br><br>/*<br>${input.substring(0,50)}...<br>*/`
    };
    return responses[currentModel] || 'رد افتراضي';
}

function newChat() {
    if (messages.length > 0) {
        if (!confirm('بدء محادثة جديدة؟')) return;
    }
    messages = [];
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('welcomeSection').style.display = 'block';
    document.getElementById('chatContainer').style.display = 'none';
    localStorage.removeItem('chat');
    showAlert('بدأت محادثة جديدة', 'success');
}

function clearChat() {
    if (messages.length === 0) {
        showAlert('لا توجد محادثة', 'info');
        return;
    }
    if (confirm('مسح المحادثة الحالية؟')) {
        messages = [];
        document.getElementById('messagesContainer').innerHTML = '';
        document.getElementById('welcomeSection').style.display = 'block';
        document.getElementById('chatContainer').style.display = 'none';
        localStorage.removeItem('chat');
        showAlert('تم المسح', 'success');
    }
}

// === رفع الملفات ===
function attachFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.pdf,.jpg,.png';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            showAlert(`تم رفع: ${file.name}`, 'success');
            // يمكن إضافة محتوى الملف هنا
        }
    };
    input.click();
}

// === أدوات ===
function quickAction(action) {
    const prompts = {
        writer: 'اكتب مقالاً عن الذكاء الاصطناعي',
        coder: 'اكتب كود JavaScript',
        assistant: 'كيف أنظم وقتي؟',
        researcher: 'ما هي آخر تطورات الذكاء الاصطناعي؟',
        question: 'ما هو الذكاء الاصطناعي؟',
        code: 'كود Python لتحليل البيانات',
        translate: 'ترجم هذه الجملة'
    };
    
    const input = document.getElementById('messageInput');
    input.value = prompts[action] || action;
    input.focus();
}

function loadConversation() {
    const saved = localStorage.getItem('chat');
    if (saved) {
        try {
            messages = JSON.parse(saved);
            if (messages.length > 0) {
                messages.forEach(msg => addMessage(msg.sender, msg.text));
                document.getElementById('welcomeSection').style.display = 'none';
                document.getElementById('chatContainer').style.display = 'block';
            }
        } catch(e) { console.error(e); }
    }
}

function saveConversation() {
    localStorage.setItem('chat', JSON.stringify(messages));
}

function showAlert(msg, type='info') {
    const bar = document.getElementById('alertBar');
    const text = document.getElementById('alertText');
    bar.style.background = 
        type === 'success' ? '#34a853' :
        type === 'error' ? '#ea4335' :
        type === 'warning' ? '#fbbc05' : '#1a73e8';
    text.textContent = msg;
    bar.style.display = 'flex';
    setTimeout(hideAlert, 3000);
}

function hideAlert() {
    document.getElementById('alertBar').style.display = 'none';
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;'
    }[m]));
}

function formatResponse(text) {
    return text.replace(/\n/g, '<br>');
}

// === بدء التطبيق ===
document.addEventListener('DOMContentLoaded', initApp);

// جعل الدوال متاحة
window.copyMessage = copyMessage;
window.likeMessage = likeMessage;

function copyMessage(id) {
    // دالة النسخ
}

function likeMessage(id) {
    // دالة الإعجاب
}