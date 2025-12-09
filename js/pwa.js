// ===== إدارة PWA والتثبيت =====

export class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = localStorage.getItem('appInstalled') === 'true';
        this.init();
    }
    
    async init() {
        // تسجيل Service Worker
        await this.registerServiceWorker();
        
        // إعداد زر التثبيت
        this.setupInstallButton();
        
        // تحديث حالة الاتصال
        this.setupConnectionDetection();
    }
    
    // تسجيل Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('✅ Service Worker مسجل:', registration.scope);
                return registration;
            } catch (error) {
                console.error('❌ فشل تسجيل Service Worker:', error);
                return null;
            }
        }
        return null;
    }
    
    // إعداد زر التثبيت
    setupInstallButton() {
        // استمع لحدث beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // استمع لحدث appinstalled
        window.addEventListener('appinstalled', () => {
            console.log('🎉 تم تثبيت PWA');
            this.hideInstallButton();
            this.isInstalled = true;
            localStorage.setItem('appInstalled', 'true');
            this.showNotification('تم تثبيت التطبيق على جهازك!', 'success');
        });
        
        // إخفاء الزر إذا كان مثبتًا مسبقًا
        if (this.isInstalled) {
            this.hideInstallButton();
        }
    }
    
    // عرض زر التثبيت
    showInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'flex';
            installBtn.addEventListener('click', async () => {
                await this.promptInstall();
            });
        }
    }
    
    // إخفاء زر التثبيت
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }
    
    // طلب التثبيت
    async promptInstall() {
        if (!this.deferredPrompt) return false;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ تم قبول التثبيت');
            this.showNotification('تم قبول تثبيت التطبيق', 'success');
            return true;
        } else {
            console.log('❌ تم رفض التثبيت');
            this.showNotification('تم رفض تثبيت التطبيق', 'info');
            return false;
        }
    }
    
    // إعداد اكتشاف حالة الاتصال
    setupConnectionDetection() {
        const updateStatus = () => {
            const isOnline = navigator.onLine;
            const event = new CustomEvent('connectionChange', { 
                detail: { isOnline } 
            });
            window.dispatchEvent(event);
        };
        
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus(); // التشغيل الأولي
    }
    
    // عرض إشعار
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'pwa-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#34a853' : '#1a73e8'};
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 9999;
                animation: slideIn 0.3s ease;
            ">
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // فحص إمكانيات المتصفح
    checkCapabilities() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            localStorage: typeof localStorage !== 'undefined',
            installPrompt: 'BeforeInstallPromptEvent' in window,
            webWorker: typeof Worker !== 'undefined',
            webAssembly: typeof WebAssembly !== 'undefined',
            webGPU: navigator.gpu !== undefined
        };
    }
    
    // الحصول على معلومات التخزين
    async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    used: (estimate.usage / (1024 * 1024)).toFixed(2),
                    quota: (estimate.quota / (1024 * 1024)).toFixed(2),
                    percentage: ((estimate.usage / estimate.quota) * 100).toFixed(1)
                };
            } catch (error) {
                console.error('خطأ في الحصول على معلومات التخزين:', error);
                return null;
            }
        }
        return null;
    }
    
    // مسح الذاكرة المؤقتة
    async clearCache() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
                return true;
            } catch (error) {
                console.error('خطأ في مسح الذاكرة المؤقتة:', error);
                return false;
            }
        }
        return false;
    }
}

// تصدير نسخة واحدة من PWAManager
export const pwaManager = new PWAManager();

// CSS للإشعارات
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyle);