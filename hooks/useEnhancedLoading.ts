"use client";

import { useState, useCallback, useMemo } from 'react';

interface LoadingStates {
  isAuthLoading: boolean;
  isDataLoading: boolean;
  isRefreshing: boolean;
  isLiveSync: boolean;
  isBulkOperation: boolean;
  isSearching: boolean;
  isFiltering: boolean;
}

interface LoadingOptions {
  showSkeletonThreshold?: number; // ms before showing skeleton
  minLoadingTime?: number; // minimum loading time for smooth UX
}

export function useEnhancedLoading(options: LoadingOptions = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    isAuthLoading: true,
    isDataLoading: false,
    isRefreshing: false,
    isLiveSync: false,
    isBulkOperation: false,
    isSearching: false,
    isFiltering: false
  });

  const [loadingTimers, setLoadingTimers] = useState<Map<keyof LoadingStates, number>>(new Map());

  const setLoadingState = useCallback((
    key: keyof LoadingStates, 
    value: boolean,
    minTime?: number
  ) => {
    const actualMinTime = minTime || options.minLoadingTime || 300;
    
    if (value) {
      // Starting loading
      const startTime = Date.now();
      setLoadingTimers(prev => new Map(prev).set(key, startTime));
      setLoadingStates(prev => ({ ...prev, [key]: value }));
    } else {
      // Stopping loading
      const startTime = loadingTimers.get(key);
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, actualMinTime - elapsed);
        
        if (remaining > 0) {
          // Delay stopping to ensure smooth UX
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, [key]: false }));
            setLoadingTimers(prev => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          }, remaining);
        } else {
          setLoadingStates(prev => ({ ...prev, [key]: false }));
          setLoadingTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
        }
      } else {
        setLoadingStates(prev => ({ ...prev, [key]: false }));
      }
    }
  }, [loadingTimers, options.minLoadingTime]);

  // Computed loading states
  const computedStates = useMemo(() => {
    const isAnyLoading = Object.values(loadingStates).some(Boolean);
    const isCriticalLoading = loadingStates.isAuthLoading || loadingStates.isDataLoading;
    const isBackgroundLoading = loadingStates.isLiveSync || loadingStates.isRefreshing;
    const isUserActionLoading = loadingStates.isBulkOperation || loadingStates.isSearching || loadingStates.isFiltering;
    
    return {
      isAnyLoading,
      isCriticalLoading,
      isBackgroundLoading,
      isUserActionLoading,
      shouldShowSkeleton: isCriticalLoading,
      shouldShowSpinner: isUserActionLoading,
      shouldShowProgress: isBackgroundLoading
    };
  }, [loadingStates]);

  return {
    loadingStates,
    setLoadingState,
    ...computedStates
  };
}