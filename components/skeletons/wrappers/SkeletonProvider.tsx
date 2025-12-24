"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface SkeletonProviderContextValue {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  registerSkeleton: (id: string) => void;
  unregisterSkeleton: (id: string) => void;
  markSkeletonLoaded: (id: string) => void;
  isSkeletonLoading: (id: string) => boolean;
  allSkeletonsLoaded: boolean;
}

const SkeletonProviderContext = createContext<SkeletonProviderContextValue | undefined>(
  undefined
);

interface SkeletonProviderProps {
  children: React.ReactNode;
  initialLoading?: boolean;
  onAllLoaded?: () => void;
}

/**
 * Global skeleton state provider
 * Coordinates loading states across multiple components
 * 
 * Usage:
 * <SkeletonProvider>
 *   <App />
 * </SkeletonProvider>
 */
export function SkeletonProvider({
  children,
  initialLoading = true,
  onAllLoaded,
}: SkeletonProviderProps) {
  const [globalLoading, setGlobalLoading] = useState(initialLoading);
  const [skeletons, setSkeletons] = useState<Map<string, boolean>>(new Map());

  // Register a new skeleton
  const registerSkeleton = useCallback((id: string) => {
    setSkeletons((prev) => {
      const next = new Map(prev);
      next.set(id, true); // true = loading
      return next;
    });
  }, []);

  // Unregister skeleton
  const unregisterSkeleton = useCallback((id: string) => {
    setSkeletons((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Mark skeleton as loaded
  const markSkeletonLoaded = useCallback((id: string) => {
    setSkeletons((prev) => {
      const next = new Map(prev);
      next.set(id, false); // false = loaded
      return next;
    });
  }, []);

  // Check if specific skeleton is loading
  const isSkeletonLoading = useCallback(
    (id: string) => {
      return skeletons.get(id) ?? false;
    },
    [skeletons]
  );

  // Check if all skeletons are loaded
  const allSkeletonsLoaded = Array.from(skeletons.values()).every((loading) => !loading);

  // Update global loading when all skeletons loaded
  useEffect(() => {
    if (allSkeletonsLoaded && skeletons.size > 0) {
      setGlobalLoading(false);
      onAllLoaded?.();
    }
  }, [allSkeletonsLoaded, skeletons.size, onAllLoaded]);

  return (
    <SkeletonProviderContext.Provider
      value={{
        globalLoading,
        setGlobalLoading,
        registerSkeleton,
        unregisterSkeleton,
        markSkeletonLoaded,
        isSkeletonLoading,
        allSkeletonsLoaded,
      }}
    >
      {children}
    </SkeletonProviderContext.Provider>
  );
}

/**
 * Hook to access skeleton provider context
 */
export function useSkeletonProvider() {
  const context = useContext(SkeletonProviderContext);
  if (context === undefined) {
    throw new Error("useSkeletonProvider must be used within SkeletonProvider");
  }
  return context;
}

/**
 * Hook for individual components to sync with global state
 */
export function useSkeletonSync(id: string) {
  const context = useSkeletonProvider();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    context.registerSkeleton(id);
    return () => context.unregisterSkeleton(id);
  }, [id, context]);

  const setLoaded = useCallback(() => {
    context.markSkeletonLoaded(id);
    setIsLoading(false);
  }, [id, context]);

  return {
    isLoading: context.isSkeletonLoading(id),
    setLoaded,
    globalLoading: context.globalLoading,
  };
}
