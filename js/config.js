// ===== إعدادات التطبيق =====

export const CONFIG = {
    APP_NAME: 'مركز الذكاء الاصطناعي',
    APP_VERSION: '2.0.0',
    STORAGE_KEY: 'aiHub',
    MAX_CONVERSATIONS: 50,
    AUTO_SAVE: true,
    
    // النماذج المتاحة
    MODELS: {
        phi3: {
            id: 'phi3',
            name: 'Phi-3-mini',
            icon: 'fas fa-bolt',
            color: '#34a853',
            size: '1.1GB',
            description: 'نموذج سريع وخفيف للمهام اليومية'
        },
        qwen: {
            id: 'qwen',
            name: 'Qwen-3-Max',
            icon: 'fas fa-crown',
            color: '#1a73e8',
            size: '2.3GB',
            description: 'الأفضل للغة العربية والأسئلة المعقدة'
        },
        deepseek: {
            id: 'deepseek',
            name: 'DeepSeek-Coder',
            icon: 'fas fa-code',
            color: '#ea4335',
            size: '2.8GB',
            description: 'متخصص في البرمجة وحل المشاكل'
        }
    },
    
    // الإجراءات السريعة
    QUICK_ACTIONS: [
        {
            id: 'question',
            icon: 'fas fa-question-circle',
            title: 'اطرح سؤالاً',
            description: 'اسأل عن أي موضوع تريده'
        },
        {
            id: 'code',
            icon: 'fas fa-code',
            title: 'اكتب كودًا',
            description: 'أنشئ أو صحح أكواد برمجية'
        },
        {
            id: 'translate',
            icon: 'fas fa-language',
            title: 'ترجمة',
            description: 'ترجم بين اللغات المختلفة'
        },
        {
            id: 'creative',
            icon: 'fas fa-paint-brush',
            title: 'إبداع',
            description: 'أنشئ محتوى إبداعيًا'
        }
    ],
    
    // التخصصات
    SPECIALTIES: [
        { id: 'writer', icon: 'fas fa-pen', name: 'كاتب محتوى' },
        { id: 'coder', icon: 'fas fa-code', name: 'مبرمج' },
        { id: 'assistant', icon: 'fas fa-assistive-listening-systems', name: 'مساعد يومي' },
        { id: 'researcher', icon: 'fas fa-search', name: 'باحث' }
    ]
};

export const DEFAULT_SETTINGS = {
    theme: 'light',
    autoSave: true,
    compareMode: false,
    currentModel: 'phi3',
    thinkingMode: false,
    webSearch: false
};