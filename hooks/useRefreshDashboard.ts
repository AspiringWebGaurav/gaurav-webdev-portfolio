/**
 * 🔄 useRefreshDashboard Hook
 * Robust dashboard refresh with health checks, auto-retry, and progress tracking
 */

import { useState, useCallback } from 'react';
import { showToast } from '@/lib/toast';
import { auth } from '@/lib/firebase';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  itemCount?: number;
  error?: string;
}

interface RefreshResponse {
  success: boolean;
  timestamp: string;
  healthChecks: HealthStatus[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  duration: number;
  message?: string;
}

interface RefreshOptions {
  maxRetries?: number;
  retryDelay?: number;
  clearCache?: boolean;
  services?: string[];
  onProgress?: (progress: number, status: string) => void;
}

export function useRefreshDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [healthStatus, setHealthStatus] = useState<RefreshResponse | null>(null);

  /**
   * Get auth token with retry
   */
  const getAuthToken = async (retries = 3): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Not authenticated');
        }
        return await user.getIdToken(true);
      } catch (error) {
        if (attempt === retries) {
          console.error('Failed to get auth token:', error);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
    return null;
  };

  /**
   * Call refresh API with retry logic
   */
  const callRefreshAPI = async (
    token: string,
    options: RefreshOptions,
    attempt = 1
  ): Promise<RefreshResponse> => {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;

    try {
      const response = await fetch('/api/refresh', {
        method: options.services ? 'POST' : 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: options.services ? JSON.stringify({ services: options.services }) : undefined,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: RefreshResponse = await response.json();
      return data;
    } catch (error: any) {
      if (attempt < maxRetries) {
        options.onProgress?.(
          (attempt / maxRetries) * 50,
          `Retry ${attempt}/${maxRetries}...`
        );
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return callRefreshAPI(token, options, attempt + 1);
      }
      throw error;
    }
  };

  /**
   * Clear browser caches
   */
  const clearBrowserCache = async (onProgress?: (progress: number, status: string) => void) => {
    try {
      onProgress?.(10, 'Clearing caches...');
      
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      onProgress?.(20, 'Clearing storage...');
      
      // Clear storage (safe)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('Storage clear failed:', e);
      }

      onProgress?.(30, 'Cache cleared');
    } catch (error) {
      console.warn('Cache clearing failed:', error);
    }
  };

  /**
   * Main refresh function
   */
  const refresh = useCallback(async (options: RefreshOptions = {}): Promise<boolean> => {
    if (isRefreshing) {
      showToast.warning('Refresh already in progress', 'Please wait');
      return false;
    }

    setIsRefreshing(true);
    const startTime = Date.now();

    try {
      options.onProgress?.(0, 'Starting refresh...');

      // Clear cache if requested
      if (options.clearCache) {
        await clearBrowserCache(options.onProgress);
      }

      options.onProgress?.(40, 'Checking health...');

      // Get auth token
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication failed');
      }

      options.onProgress?.(50, 'Refreshing services...');

      // Call refresh API with retry
      const result = await callRefreshAPI(token, options);
      
      options.onProgress?.(90, 'Finalizing...');

      setHealthStatus(result);
      setLastRefresh(new Date());

      const duration = Date.now() - startTime;
      options.onProgress?.(100, 'Complete');

      // Show appropriate toast based on results
      if (result.success) {
        const degradedCount = result.summary.degraded;
        if (degradedCount > 0) {
          showToast.warning(
            `Refresh complete with ${degradedCount} degraded service${degradedCount > 1 ? 's' : ''}`,
            `${duration}ms`
          );
        } else {
          showToast.success(
            `Dashboard refreshed successfully!`,
            `${result.summary.healthy}/${result.summary.total} services healthy • ${duration}ms`
          );
        }
      } else {
        showToast.error(
          `Refresh completed with ${result.summary.down} service${result.summary.down > 1 ? 's' : ''} down`,
          'Some services may be unavailable'
        );
      }

      return result.success;
    } catch (error: any) {
      console.error('Dashboard refresh error:', error);
      options.onProgress?.(100, 'Failed');
      
      showToast.error(
        'Failed to refresh dashboard',
        error.message || 'Please try again'
      );
      
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  /**
   * Quick health check (no cache clear)
   */
  const healthCheck = useCallback(async (): Promise<RefreshResponse | null> => {
    try {
      const token = await getAuthToken();
      if (!token) return null;

      const response = await fetch('/api/refresh', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) return null;

      const data: RefreshResponse = await response.json();
      setHealthStatus(data);
      return data;
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  }, []);

  return {
    refresh,
    healthCheck,
    isRefreshing,
    lastRefresh,
    healthStatus,
  };
}
