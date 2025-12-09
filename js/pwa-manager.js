// ===== مدير PWA والتثبيت =====
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isAppInstalled = false;
    }

    async init() {
        await this.registerServiceWorker();
        this.setupInstallButton();
        this.setupOfflineDetection();
        this.checkInstallation();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
                console.log('✅ Service Worker مسجل');
            } catch (error) {
                console.error('❌ فشل تسجيل Service Worker:', error);
            }
        }
    }

    setupInstallButton() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('🎉 تم تثبيت التطبيق');
            this.hideInstallButton();
            this.isAppInstalled = true;
            localStorage.setItem('appInstalled', 'true');
            this.showToast('تم تثبيت التطبيق بنجاح!');
        });

        document.getElementById('installBtn')?.addEventListener('click', () => {
            this.installApp();
        });
    }

    showInstallButton() {
        const btn = document.getElementById('installBtn');
        if (btn && !this.isAppInstalled) {
            btn.style.display = 'flex';
            btn.classList.add('pulse');
        }
    }

    hideInstallButton() {
        const btn = document.getElementById('installBtn');
        if (btn) btn.style.display = 'none';
    }

    async installApp() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ المستخدم قبل التثبيت');
            this.isAppInstalled = true;
        }
        
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    checkInstallation() {
        // التحقق مما إذا كان التطبيق مثبتًا
        if (window.matchMedia('(display-mode: standalone)').matches ||
            localStorage.getItem('appInstalled') === 'true') {
            this.isAppInstalled = true;
            this.hideInstallButton();
        }
    }

    setupOfflineDetection() {
        const updateStatus = () => {
            const isOnline = navigator.onLine;
            const statusElement = document.getElementById('connectionStatus');
            if (statusElement) {
                statusElement.textContent = isOnline ? '🟢 متصل' : '🔴 غير متصل';
                statusElement.style.color = isOnline ? '#34a853' : '#ea4335';
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'pwa-toast';
        toast.innerHTML = `
            <div style="
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary-color);
                color: white;
                padding: 12px 24px;
                border-radius: 25px;
                box-shadow: var(--shadow-lg);
                z-index: 10000;
                animation: fadeInUp 0.3s ease;
            ">
                ${message}
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3000);
    }
}

// ===== تهيئة مدير PWA =====
window.pwaManager = new PWAManager();