/**
 * Portfolio Live Updates Hook
 * 
 * Provides real-time updates for portfolio components (visitor-facing)
 * Automatically refreshes data when admin makes changes
 */

'use client';

import { useEffect, useCallback, useState, useRef } from 'react';

interface PortfolioSyncOptions {
  interval?: number;
  enabled?: boolean;
  onUpdate?: () => void;
}

/**
 * Hook for auto-refreshing portfolio data
 * Much simpler than admin sync - just polls for updates
 */
export function usePortfolioSync<T>(
  fetchFunction: () => Promise<T>,
  options: PortfolioSyncOptions = {}
) {
  const {
    interval = 120000, // Default 2 minutes (less aggressive than admin)
    enabled = true,
    onUpdate,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isOnlineRef = useRef(true);
  const isVisibleRef = useRef(true);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const result = await fetchFunction();
      setData(result);
      setError(null);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      console.error('Portfolio sync error:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [fetchFunction, enabled, onUpdate]);

  // Initial fetch
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Setup polling
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      // Only poll if online and visible
      if (isOnlineRef.current && isVisibleRef.current) {
        fetchData(false);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [fetchData, interval, enabled]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      fetchData(false); // Refresh when coming back online
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      // Refresh when tab becomes visible again
      if (isVisibleRef.current) {
        fetchData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchData(true),
  };
}

/**
 * Simple hook to track if data has been updated
 * Useful for showing "New content available" banners
 */
export function useDataUpdateDetector<T>(data: T[], checkInterval = 60000) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const previousHashRef = useRef<string>('');

  useEffect(() => {
    if (!data) return;

    // Simple hash of data length and first/last item IDs
    const currentHash = JSON.stringify({
      length: data.length,
      first: data[0],
      last: data[data.length - 1],
    });

    if (previousHashRef.current && previousHashRef.current !== currentHash) {
      setHasUpdate(true);
    }

    previousHashRef.current = currentHash;
  }, [data]);

  const clearUpdate = useCallback(() => {
    setHasUpdate(false);
  }, []);

  return { hasUpdate, clearUpdate };
}
