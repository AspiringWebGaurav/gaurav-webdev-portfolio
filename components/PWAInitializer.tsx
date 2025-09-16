"use client";

import { useEffect } from 'react';
import { serviceWorkerManager } from '@/lib/serviceWorker';

/**
 * PWA Initializer Component
 * Handles service worker registration and PWA functionality
 */
export default function PWAInitializer() {
  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_PWA === 'true') {
      initializePWA();
    }
  }, []);

  const initializePWA = async () => {
    try {
      // Register service worker
      await serviceWorkerManager.registerServiceWorker();
      
      // Request notification permission if in PWA mode
      if (serviceWorkerManager.isPWA()) {
        await serviceWorkerManager.requestNotificationPermission();
      }
      
      // Log PWA status
      const isPWA = serviceWorkerManager.isPWA();
      const version = await serviceWorkerManager.getAppVersion();
      
      console.log(`[PWA] Initialized - Mode: ${isPWA ? 'PWA' : 'Browser'}, Version: ${version || 'Unknown'}`);
      
      // Add PWA class to body for styling
      if (isPWA) {
        document.body.classList.add('pwa-mode');
      }
      
    } catch (error) {
      console.error('[PWA] Initialization failed:', error);
    }
  };

  // This component doesn't render anything
  return null;
}