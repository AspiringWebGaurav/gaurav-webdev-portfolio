"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseComponentLoadingOptions {
  minLoadTime?: number; // Minimum time to show skeleton (set to 0 for pure dynamic)
  maxLoadTime?: number; // Maximum time before forcing show content
  initialLoading?: boolean; // Start in loading state
  skipMinTime?: boolean; // Skip minimum time for instant transitions
}

interface UseComponentLoadingReturn {
  isLoading: boolean;
  setLoaded: () => void;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

/**
 * Hook to manage component loading state - Pure Dynamic Mode
 * Shows skeleton only during actual loading, hides immediately when content ready
 */
export function useComponentLoading(
  options: UseComponentLoadingOptions = {}
): UseComponentLoadingReturn {
  const {
    minLoadTime = 0, // Changed to 0 for pure dynamic behavior
    maxLoadTime = 10000,
    initialLoading = true,
    skipMinTime = true, // Skip minimum time by default
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [contentReady, setContentReady] = useState(false);
  
  const mountTimeRef = useRef<number>(Date.now());
  const minTimeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();

  // Pure dynamic mode - no minimum time enforcement
  useEffect(() => {
    if (contentReady && isLoading) {
      // Content is ready, hide skeleton immediately
      if (skipMinTime || minLoadTime === 0) {
        setIsLoading(false);
      } else {
        // Respect minimum time if specified
        const elapsed = Date.now() - mountTimeRef.current;
        const remaining = Math.max(0, minLoadTime - elapsed);
        
        minTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      }
    }

    return () => {
      if (minTimeoutRef.current) {
        clearTimeout(minTimeoutRef.current);
      }
    };
  }, [contentReady, isLoading, minLoadTime, skipMinTime]);

  // Maximum timeout - force show content
  useEffect(() => {
    if (isLoading) {
      maxTimeoutRef.current = setTimeout(() => {
        setContentReady(true);
      }, maxLoadTime);
    }

    return () => {
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [isLoading, maxLoadTime]);

  const setLoaded = useCallback(() => {
    setContentReady(true);
  }, []);

  const setLoadingState = useCallback((loading: boolean) => {
    if (loading) {
      setIsLoading(true);
      setContentReady(false);
      mountTimeRef.current = Date.now();
    } else {
      setContentReady(true);
    }
  }, []);

  const startLoading = useCallback(() => {
    setLoadingState(true);
  }, [setLoadingState]);

  const stopLoading = useCallback(() => {
    setLoadingState(false);
  }, [setLoadingState]);

  return {
    isLoading,
    setLoaded,
    setLoading: setLoadingState,
    startLoading,
    stopLoading,
  };
}
