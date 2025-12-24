"use client";

import { useState, useCallback, useContext, createContext, useEffect } from "react";

interface SkeletonState {
  isVisible: boolean;
  fadeOut: boolean;
}

interface SkeletonContextValue {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

const SkeletonContext = createContext<SkeletonContextValue | undefined>(undefined);

interface UseSkeletonStateOptions {
  initialVisible?: boolean;
  transitionDuration?: number; // milliseconds
}

interface UseSkeletonStateReturn {
  isVisible: boolean;
  fadeOut: boolean;
  showSkeleton: () => void;
  hideSkeleton: () => void;
  toggleSkeleton: () => void;
}

/**
 * Hook to manage skeleton visibility with smooth transitions
 */
export function useSkeletonState(
  options: UseSkeletonStateOptions = {}
): UseSkeletonStateReturn {
  const {
    initialVisible = true,
    transitionDuration = 200,
  } = options;

  const [state, setState] = useState<SkeletonState>({
    isVisible: initialVisible,
    fadeOut: false,
  });

  const context = useContext(SkeletonContext);

  // Sync with global loading if context available
  useEffect(() => {
    if (context && context.globalLoading !== state.isVisible) {
      if (context.globalLoading) {
        showSkeleton();
      } else {
        hideSkeleton();
      }
    }
  }, [context?.globalLoading]);

  const showSkeleton = useCallback(() => {
    setState({ isVisible: true, fadeOut: false });
  }, []);

  const hideSkeleton = useCallback(() => {
    // Start fade out
    setState((prev) => ({ ...prev, fadeOut: true }));

    // Remove from DOM after transition
    setTimeout(() => {
      setState({ isVisible: false, fadeOut: false });
    }, transitionDuration);
  }, [transitionDuration]);

  const toggleSkeleton = useCallback(() => {
    if (state.isVisible) {
      hideSkeleton();
    } else {
      showSkeleton();
    }
  }, [state.isVisible, hideSkeleton, showSkeleton]);

  return {
    isVisible: state.isVisible,
    fadeOut: state.fadeOut,
    showSkeleton,
    hideSkeleton,
    toggleSkeleton,
  };
}

/**
 * Context provider for global skeleton state
 */
export function SkeletonStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [globalLoading, setGlobalLoading] = useState(false);

  return (
    <SkeletonContext.Provider value={{ globalLoading, setGlobalLoading }}>
      {children}
    </SkeletonContext.Provider>
  );
}

/**
 * Hook to access global skeleton context
 */
export function useGlobalSkeletonState() {
  const context = useContext(SkeletonContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalSkeletonState must be used within SkeletonStateProvider"
    );
  }
  return context;
}
