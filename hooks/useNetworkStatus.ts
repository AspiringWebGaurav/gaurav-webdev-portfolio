/**
 * Network Status Hook
 * Monitors online/offline status and provides reconnection logic
 */

import { useState, useEffect, useCallback } from 'react';
import { showToast } from '@/lib/toast';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  reconnectAttempts: number;
}

export function useNetworkStatus(onReconnect?: () => void) {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    reconnectAttempts: 0,
  });

  const handleOnline = useCallback(() => {
    console.log('🌐 Network connection restored');
    
    setStatus(prev => {
      const wasOffline = prev.wasOffline || !prev.isOnline;
      
      if (wasOffline) {
        showToast.success('Connection restored! Refreshing data...');
        onReconnect?.();
      }
      
      return {
        isOnline: true,
        wasOffline: false,
        reconnectAttempts: 0,
      };
    });
  }, [onReconnect]);

  const handleOffline = useCallback(() => {
    console.log('📡 Network connection lost');
    showToast.error('You are offline. Some features may not work.', undefined, {
      autoClose: 5000,
    });
    
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));
  }, []);

  useEffect(() => {
    // Listen for connection changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connection check (every 30 seconds)
    const checkInterval = setInterval(() => {
      const currentOnlineStatus = navigator.onLine;
      setStatus(prev => {
        if (prev.isOnline !== currentOnlineStatus) {
          console.log(`🔄 Network status changed: ${currentOnlineStatus ? 'online' : 'offline'}`);
          // Don't call handlers directly to avoid state updates in setState
          return {
            ...prev,
            isOnline: currentOnlineStatus,
            wasOffline: !currentOnlineStatus || prev.wasOffline,
          };
        }
        return prev;
      });
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, [handleOnline, handleOffline]);

  return status;
}

/**
 * Auto-retry hook for failed operations
 */
export function useAutoRetry(
  operation: () => Promise<void>,
  options: {
    enabled?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
) {
  const { enabled = true, maxRetries = 3, retryDelay = 2000, onRetry } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async () => {
    if (!enabled || retryCount >= maxRetries) {
      return false;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    onRetry?.(retryCount + 1);
    console.log(`🔄 Auto-retry attempt ${retryCount + 1}/${maxRetries}`);

    await new Promise(resolve => setTimeout(resolve, retryDelay));

    try {
      await operation();
      setRetryCount(0);
      setIsRetrying(false);
      return true;
    } catch (error) {
      console.error('Auto-retry failed:', error);
      setIsRetrying(false);
      return false;
    }
  }, [enabled, retryCount, maxRetries, retryDelay, operation, onRetry]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
  };
}
