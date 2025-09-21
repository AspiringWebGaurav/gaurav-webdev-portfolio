"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface RouteLoadingState {
  isLoading: boolean;
  targetRoute?: string;
  startTime?: number;
  loadingType: 'navigation' | 'component' | 'data' | 'idle';
  message: string;
}

interface UseRouteLoadingOptions {
  minLoadingTime?: number; // Minimum time to show loading (for smooth UX)
  maxLoadingTime?: number; // Maximum time before auto-hide (safety)
  enableDebug?: boolean;
}

export function useRouteLoading(options: UseRouteLoadingOptions = {}) {
  const {
    minLoadingTime = 500,
    maxLoadingTime = 10000,
    enableDebug = process.env.NODE_ENV === 'development'
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [loadingState, setLoadingState] = useState<RouteLoadingState>({
    isLoading: false,
    loadingType: 'idle',
    message: 'Loading...'
  });

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const log = useCallback((message: string, ...args: any[]) => {
    if (enableDebug) {
      console.log(`[RouteLoading] ${message}`, ...args);
    }
  }, [enableDebug]);

  // Enhanced router push with loading state
  const navigateWithLoading = useCallback((
    url: string, 
    options: { 
      loadingType?: RouteLoadingState['loadingType'];
      message?: string;
      replace?: boolean;
    } = {}
  ) => {
    const {
      loadingType = 'navigation',
      message = getLoadingMessage(url),
      replace = false
    } = options;

    log('Starting navigation', { url, loadingType, message });

    // Clear any existing timeouts
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    if (minTimeTimeoutRef.current) clearTimeout(minTimeTimeoutRef.current);

    // Set loading state
    setLoadingState({
      isLoading: true,
      targetRoute: url,
      startTime: Date.now(),
      loadingType,
      message
    });

    // Safety timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      log('Max loading time reached, force stopping');
      stopLoading();
    }, maxLoadingTime);

    // Navigate
    if (replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router, maxLoadingTime, log]);

  // Stop loading with minimum time enforcement
  const stopLoading = useCallback((force = false) => {
    const currentState = loadingState;
    
    if (!currentState.isLoading && !force) return;

    const elapsed = currentState.startTime ? Date.now() - currentState.startTime : 0;
    const remaining = Math.max(0, minLoadingTime - elapsed);

    log('Stopping loading', { elapsed, remaining, force });

    if (remaining > 0 && !force) {
      // Enforce minimum loading time for smooth UX
      minTimeTimeoutRef.current = setTimeout(() => {
        setLoadingState(prev => ({ ...prev, isLoading: false }));
      }, remaining);
    } else {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }

    // Clear timeouts
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
  }, [loadingState, minLoadingTime, log]);

  // Set loading message without changing loading state
  const setLoadingMessage = useCallback((message: string) => {
    setLoadingState(prev => ({ ...prev, message }));
  }, []);

  // Quick loading for component/data operations
  const quickLoad = useCallback(async (
    operation: () => Promise<any>,
    options: {
      loadingType?: RouteLoadingState['loadingType'];
      message?: string;
    } = {}
  ) => {
    const {
      loadingType = 'component',
      message = 'Loading...'
    } = options;

    setLoadingState({
      isLoading: true,
      startTime: Date.now(),
      loadingType,
      message
    });

    try {
      const result = await operation();
      return result;
    } finally {
      stopLoading();
    }
  }, [stopLoading]);

  // Listen for route changes to auto-stop loading
  useEffect(() => {
    log('Pathname changed', pathname);
    // Small delay to ensure page is rendered
    const timeout = setTimeout(() => {
      if (loadingState.isLoading && loadingState.loadingType === 'navigation') {
        stopLoading();
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname, stopLoading, log, loadingState]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (minTimeTimeoutRef.current) clearTimeout(minTimeTimeoutRef.current);
    };
  }, []);

  return {
    ...loadingState,
    navigateWithLoading,
    stopLoading,
    setLoadingMessage,
    quickLoad,
    
    // Convenience methods
    startLoading: (message = 'Loading...') => setLoadingState({
      isLoading: true,
      startTime: Date.now(),
      loadingType: 'component',
      message
    }),
  };
}

// Helper function to generate contextual loading messages
function getLoadingMessage(url: string): string {
  if (url.includes('/ask-me-anything')) {
    return 'Opening Ask Me Anything...';
  }
  if (url.includes('/admin')) {
    return 'Loading admin panel...';
  }
  if (url.match(/^\/[a-f0-9-]{36}$/)) {
    return 'Returning to portfolio...';
  }
  return 'Navigating...';
}

// Enhanced hook specifically for the main navigation
export function usePortfolioNavigation() {
  const routeLoading = useRouteLoading({
    minLoadingTime: 600, // Slightly longer for premium feel
    maxLoadingTime: 8000
  });

  const navigateToAskMeAnything = useCallback((currentUUID: string) => {
    routeLoading.navigateWithLoading(`/${currentUUID}/ask-me-anything`, {
      loadingType: 'navigation',
      message: 'Opening Ask Me Anything...'
    });
  }, [routeLoading]);

  const navigateToPortfolio = useCallback((currentUUID: string) => {
    routeLoading.navigateWithLoading(`/${currentUUID}`, {
      loadingType: 'navigation',
      message: 'Returning to portfolio...'
    });
  }, [routeLoading]);

  return {
    ...routeLoading,
    navigateToAskMeAnything,
    navigateToPortfolio
  };
}