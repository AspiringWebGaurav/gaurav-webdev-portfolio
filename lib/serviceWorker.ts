// Service Worker Registration and PWA utilities for Gaurav's Portfolio

export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;

  /**
   * Register service worker for PWA functionality
   */
  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker not supported');
      return;
    }

    try {
      console.log('[PWA] Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully:', this.registration);

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate();
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] New service worker is now controlling the app');
        // Optionally reload the page
        // window.location.reload();
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(): void {
    if (!this.registration?.installing) return;

    const installingWorker = this.registration.installing;
    
    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New content is available
          console.log('[PWA] New content available, will be used when all tabs are closed');
          this.showUpdateAvailableNotification();
        } else {
          // Content is cached for the first time
          console.log('[PWA] Content is cached and ready for offline use');
          this.showOfflineReadyNotification();
        }
      }
    });
  }

  /**
   * Show notification for available updates
   */
  private showUpdateAvailableNotification(): void {
    // You can integrate this with your toast notification system
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Update Available', {
          body: 'A new version of the app is available. It will be used when you next load the app.',
          icon: '/icon-192x192.png',
          badge: '/icon-48x48.png'
        });
      }
    }
  }

  /**
   * Show notification for offline readiness
   */
  private showOfflineReadyNotification(): void {
    console.log('[PWA] App is ready to work offline');
    // You can integrate this with your toast notification system
  }

  /**
   * Setup PWA install prompt
   */
  setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      this.installPrompt = e as any;
      
      // Show custom install button/banner
      this.showInstallPrompt();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was successfully installed');
      this.installPrompt = null;
      this.hideInstallPrompt();
    });
  }

  /**
   * Show custom install prompt UI
   */
  private showInstallPrompt(): void {
    // You can customize this to show your own install UI
    console.log('[PWA] Showing install prompt');
    
    // Example: Create a simple install banner
    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="margin-bottom: 8px; font-weight: 600;">
          📱 Install Gaurav's Portfolio
        </div>
        <div style="margin-bottom: 12px; opacity: 0.9;">
          Get quick access to the portfolio on your device!
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pwa-install-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">Install</button>
          <button id="pwa-dismiss-btn" style="
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">Not now</button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(installBanner);

    // Add event listeners
    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.triggerInstall();
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallPrompt();
    });
  }

  /**
   * Hide install prompt UI
   */
  private hideInstallPrompt(): void {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => banner.remove(), 300);
    }
  }

  /**
   * Trigger PWA installation
   */
  async triggerInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      await this.installPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await this.installPrompt.userChoice;
      
      console.log(`[PWA] User ${outcome} the install prompt`);
      
      if (outcome === 'accepted') {
        this.hideInstallPrompt();
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Send message to service worker
   */
  async sendMessageToSW(message: ServiceWorkerMessage): Promise<any> {
    if (!this.registration?.active) {
      console.warn('[PWA] No active service worker');
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      this.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Check if app is running in PWA mode
   */
  isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Get app version from service worker
   */
  async getAppVersion(): Promise<string | null> {
    const response = await this.sendMessageToSW({ type: 'GET_VERSION' });
    return response?.version || null;
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<boolean> {
    const response = await this.sendMessageToSW({ type: 'CLEAR_CACHE' });
    return response?.success || false;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
      return permission;
    }

    return Notification.permission;
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-initialize when imported (client-side only)
if (typeof window !== 'undefined') {
  // Register service worker when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      serviceWorkerManager.registerServiceWorker();
      serviceWorkerManager.setupInstallPrompt();
    });
  } else {
    serviceWorkerManager.registerServiceWorker();
    serviceWorkerManager.setupInstallPrompt();
  }
}

// Export default
export default serviceWorkerManager;