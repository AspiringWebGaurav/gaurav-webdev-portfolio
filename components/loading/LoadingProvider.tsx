"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import RouteLoadingOverlay from './RouteLoadingOverlay';

interface RouteLoadingState {
  isLoading: boolean;
  targetRoute?: string;
  startTime?: number;
  loadingType: 'navigation' | 'component' | 'data' | 'idle';
  message: string;
}

interface LoadingContextType {
  // Global loading states
  isGlobalLoading: boolean;
  globalMessage: string;
  
  // Loading control methods
  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;
  updateLoadingMessage: (message: string) => void;
  
  // Component loading states
  componentLoadingStates: Map<string, boolean>;
  setComponentLoading: (componentId: string, loading: boolean) => void;
  isComponentLoading: (componentId: string) => boolean;
  
  // Route loading integration (internal implementation to avoid circular dependency)
  routeLoading: RouteLoadingState;
  navigateWithLoading: (url: string, options?: {
    loadingType?: RouteLoadingState['loadingType'];
    message?: string;
    replace?: boolean;
  }) => void;
  stopRouteLoading: () => void;
  setRouteLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Global loading state
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('Loading...');
  
  // Component loading states
  const [componentLoadingStates, setComponentLoadingStates] = useState<Map<string, boolean>>(new Map());
  
  // Route loading state (internal implementation)
  const [routeLoadingState, setRouteLoadingState] = useState<RouteLoadingState>({
    isLoading: false,
    loadingType: 'idle',
    message: 'Loading...'
  });
  
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Route loading configuration - Optimized for modal navigation
  const minLoadingTime = 100; // Reduced from 500ms for faster modal transitions
  const maxLoadingTime = 5000; // Reduced from 10000ms for better UX

  // Helper function to generate contextual loading messages
  const getLoadingMessage = useCallback((url: string): string => {
    // Skip loading messages for modal-based navigation
    if (url.includes('ask-me-anything-modal') || url.includes('#modal')) {
      return '';
    }
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
  }, []);

  // Route loading methods with modal optimization
  const navigateWithLoading = useCallback((
    url: string,
    options: {
      loadingType?: RouteLoadingState['loadingType'];
      message?: string;
      replace?: boolean;
      skipLoading?: boolean; // New option for modal navigation
    } = {}
  ) => {
    const {
      loadingType = 'navigation',
      message = getLoadingMessage(url),
      replace = false,
      skipLoading = false
    } = options;

    // Skip loading entirely for modal-based navigation
    if (skipLoading || url.includes('ask-me-anything-modal') || url.includes('#modal')) {
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
      return;
    }

    // Clear any existing timeouts
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    if (minTimeTimeoutRef.current) clearTimeout(minTimeTimeoutRef.current);

    // Set loading state
    setRouteLoadingState({
      isLoading: true,
      targetRoute: url,
      startTime: Date.now(),
      loadingType,
      message
    });

    // Safety timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      stopRouteLoading();
    }, maxLoadingTime);

    // Navigate
    if (replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router, maxLoadingTime, getLoadingMessage]);

  // Stop route loading with minimum time enforcement
  const stopRouteLoading = useCallback((force = false) => {
    const currentState = routeLoadingState;
    
    if (!currentState.isLoading && !force) return;

    const elapsed = currentState.startTime ? Date.now() - currentState.startTime : 0;
    const remaining = Math.max(0, minLoadingTime - elapsed);

    if (remaining > 0 && !force) {
      // Enforce minimum loading time for smooth UX
      minTimeTimeoutRef.current = setTimeout(() => {
        setRouteLoadingState(prev => ({ ...prev, isLoading: false }));
      }, remaining);
    } else {
      setRouteLoadingState(prev => ({ ...prev, isLoading: false }));
    }

    // Clear timeouts
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
  }, [routeLoadingState, minLoadingTime]);

  // Set route loading message without changing loading state
  const setRouteLoadingMessage = useCallback((message: string) => {
    setRouteLoadingState(prev => ({ ...prev, message }));
  }, []);

  // Listen for route changes to auto-stop loading (optimized)
  useEffect(() => {
    // Reduced delay for faster transitions
    const timeout = setTimeout(() => {
      if (routeLoadingState.isLoading && routeLoadingState.loadingType === 'navigation') {
        stopRouteLoading();
      }
    }, 50); // Reduced from 100ms to 50ms

    return () => clearTimeout(timeout);
  }, [pathname, stopRouteLoading, routeLoadingState]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (minTimeTimeoutRef.current) clearTimeout(minTimeTimeoutRef.current);
    };
  }, []);

  // Global loading methods
  const showGlobalLoading = useCallback((message = 'Loading...') => {
    setGlobalMessage(message);
    setIsGlobalLoading(true);
  }, []);

  const hideGlobalLoading = useCallback(() => {
    setIsGlobalLoading(false);
  }, []);

  const updateLoadingMessage = useCallback((message: string) => {
    setGlobalMessage(message);
  }, []);

  // Component loading methods
  const setComponentLoading = useCallback((componentId: string, loading: boolean) => {
    setComponentLoadingStates(prev => {
      const newMap = new Map(prev);
      if (loading) {
        newMap.set(componentId, true);
      } else {
        newMap.delete(componentId);
      }
      return newMap;
    });
  }, []);

  const isComponentLoading = useCallback((componentId: string) => {
    return componentLoadingStates.get(componentId) || false;
  }, [componentLoadingStates]);

  const contextValue: LoadingContextType = {
    isGlobalLoading,
    globalMessage,
    showGlobalLoading,
    hideGlobalLoading,
    updateLoadingMessage,
    componentLoadingStates,
    setComponentLoading,
    isComponentLoading,
    routeLoading: routeLoadingState,
    navigateWithLoading,
    stopRouteLoading,
    setRouteLoadingMessage
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      
      {/* Global Loading Overlay */}
      {isGlobalLoading && (
        <RouteLoadingOverlay
          isVisible={true}
          loadingType="component"
          message={globalMessage}
        />
      )}
      
      {/* Route Loading Overlay */}
      <RouteLoadingOverlay
        isVisible={routeLoadingState.isLoading}
        loadingType={routeLoadingState.loadingType}
        message={routeLoadingState.message}
        targetRoute={routeLoadingState.targetRoute}
      />
    </LoadingContext.Provider>
  );
};

// Hook to use the loading context with error boundary
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Safe hook that won't throw errors (for fallback scenarios)
export const useSafeLoading = (): LoadingContextType | null => {
  const context = useContext(LoadingContext);
  return context;
};

// Convenience hooks for specific loading types
export const useGlobalLoading = () => {
  const { isGlobalLoading, showGlobalLoading, hideGlobalLoading, updateLoadingMessage } = useLoading();
  return {
    isLoading: isGlobalLoading,
    show: showGlobalLoading,
    hide: hideGlobalLoading,
    updateMessage: updateLoadingMessage
  };
};

export const useComponentLoading = (componentId: string) => {
  const { setComponentLoading, isComponentLoading } = useLoading();
  
  const startLoading = useCallback(() => {
    setComponentLoading(componentId, true);
  }, [componentId, setComponentLoading]);
  
  const stopLoading = useCallback(() => {
    setComponentLoading(componentId, false);
  }, [componentId, setComponentLoading]);
  
  return {
    isLoading: isComponentLoading(componentId),
    startLoading,
    stopLoading
  };
};

export const useRouteNavigation = () => {
  const { routeLoading, navigateWithLoading, stopRouteLoading, setRouteLoadingMessage } = useLoading();
  return {
    ...routeLoading,
    navigateWithLoading,
    stopLoading: stopRouteLoading,
    setLoadingMessage: setRouteLoadingMessage
  };
};

// Safe version that won't throw errors during hydration
export const useSafeRouteNavigation = () => {
  const context = useSafeLoading();
  if (!context) {
    // Return a fallback object during hydration or when context is not available
    return {
      isLoading: false,
      loadingType: 'idle' as const,
      message: 'Loading...',
      navigateWithLoading: (url: string) => {
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
      },
      stopLoading: () => {},
      setLoadingMessage: () => {}
    };
  }
  
  const { routeLoading, navigateWithLoading, stopRouteLoading, setRouteLoadingMessage } = context;
  return {
    ...routeLoading,
    navigateWithLoading,
    stopLoading: stopRouteLoading,
    setLoadingMessage: setRouteLoadingMessage
  };
};

export default LoadingProvider;