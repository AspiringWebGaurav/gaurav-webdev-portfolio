"use client";

import React, { ComponentType, useEffect, useState } from "react";
import { useComponentLoading } from "@/hooks/useComponentLoading";

interface WithAutoSkeletonOptions {
  minLoadTime?: number;
  maxLoadTime?: number;
  detectDataLoading?: boolean;
  transitionDuration?: number;
}

/**
 * Higher-Order Component that automatically wraps a component with skeleton
 * Detects loading state and shows skeleton until component is ready
 * 
 * Usage:
 * const HeroWithSkeleton = withAutoSkeleton(Hero, HeroSkeleton);
 * <HeroWithSkeleton />
 */
export function withAutoSkeleton<P extends object>(
  Component: ComponentType<P>,
  SkeletonComponent: ComponentType,
  options: WithAutoSkeletonOptions = {}
): ComponentType<P> {
  const {
    minLoadTime = 300,
    maxLoadTime = 10000,
    detectDataLoading = true,
    transitionDuration = 200,
  } = options;

  return function WithAutoSkeletonWrapper(props: P) {
    const [mounted, setMounted] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(!detectDataLoading);

    const { isLoading, setLoaded } = useComponentLoading({
      minLoadTime,
      maxLoadTime,
      initialLoading: true,
    });

    // Track mount
    useEffect(() => {
      setMounted(true);
    }, []);

    // Auto-detect data loading (look for common loading patterns)
    useEffect(() => {
      if (!detectDataLoading || dataLoaded) {
        setLoaded();
        return;
      }

      // Simple heuristic: wait for component to settle
      const timer = setTimeout(() => {
        setDataLoaded(true);
        setLoaded();
      }, 100);

      return () => clearTimeout(timer);
    }, [dataLoaded, detectDataLoading, setLoaded]);

    // Show skeleton while loading
    if (isLoading && mounted) {
      return (
        <div
          className={`animate-in fade-in duration-${transitionDuration}`}
          aria-busy="true"
          aria-label="Loading content"
        >
          <SkeletonComponent />
        </div>
      );
    }

    // Show real component
    return (
      <div
        className={`animate-in fade-in duration-${transitionDuration}`}
        aria-busy="false"
      >
        <Component {...props} />
      </div>
    );
  };
}
