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
   * Setup PWA install prompt detection (no UI shown)
   */
  setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later if needed
      this.installPrompt = e as any;
      
      // Log availability but don't show custom UI
      console.log('[PWA] Install prompt ready (no custom UI will be shown)');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was successfully installed');
      this.installPrompt = null;
    });
  }

  /**
   * Trigger PWA installation (programmatically if needed)
   */
  async triggerInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      // Show the browser's native install prompt
      await this.installPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await this.installPrompt.userChoice;
      
      console.log(`[PWA] User ${outcome} the install prompt`);
      
      return outcome === 'accepted';
      
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
    });
  } else {
    serviceWorkerManager.registerServiceWorker();
  }
}

// Export default
export default serviceWorkerManager;