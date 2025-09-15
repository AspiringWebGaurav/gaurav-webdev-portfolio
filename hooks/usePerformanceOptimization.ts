"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Performance monitoring hook
export function usePerformanceOptimization() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadTime, setLoadTime] = useState<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    const handleLoad = () => {
      const endTime = performance.now();
      setLoadTime(endTime - startTimeRef.current);
      setIsLoading(false);
    };

    // Monitor page load performance
    if (document.readyState === 'loading') {
      setIsLoading(true);
      document.addEventListener('DOMContentLoaded', handleLoad);
    } else {
      handleLoad();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', handleLoad);
    };
  }, []);

  return { isLoading, loadTime };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, hasIntersected, options]);

  return { isIntersecting, hasIntersected };
}

// Page preloading hook
export function usePagePreloading() {
  const router = useRouter();
  const preloadedPages = useRef<Set<string>>(new Set());
  const preloadTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const preloadPage = useCallback((href: string, delay: number = 0) => {
    if (preloadedPages.current.has(href)) return;

    const timeoutId = setTimeout(() => {
      // Preload the page
      router.prefetch(href);
      preloadedPages.current.add(href);
      
      // Create a hidden link to trigger browser preloading
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
      
      // Clean up after 30 seconds
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 30000);
    }, delay);

    preloadTimeouts.current.set(href, timeoutId);
  }, [router]);

  const cancelPreload = useCallback((href: string) => {
    const timeoutId = preloadTimeouts.current.get(href);
    if (timeoutId) {
      clearTimeout(timeoutId);
      preloadTimeouts.current.delete(href);
    }
  }, []);

  // Preload admin pages on hover
  const handleMouseEnter = useCallback((href: string) => {
    preloadPage(href, 100); // Small delay to avoid unnecessary preloads
  }, [preloadPage]);

  const handleMouseLeave = useCallback((href: string) => {
    cancelPreload(href);
  }, [cancelPreload]);

  useEffect(() => {
    // Preload critical admin pages after initial load
    const criticalPages = ['/admin', '/admin/visitors', '/admin/appeals', '/admin/ai-assistant'];
    
    const preloadCriticalPages = () => {
      criticalPages.forEach((page, index) => {
        preloadPage(page, index * 200); // Stagger preloading
      });
    };

    // Preload after a short delay to not interfere with initial page load
    const timer = setTimeout(preloadCriticalPages, 2000);

    return () => {
      clearTimeout(timer);
      // Clean up all pending timeouts
      preloadTimeouts.current.forEach(timeout => clearTimeout(timeout));
      preloadTimeouts.current.clear();
    };
  }, [preloadPage]);

  return { preloadPage, cancelPreload, handleMouseEnter, handleMouseLeave };
}

// Memory optimization hook
export function useMemoryOptimization() {
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, []);

  const clearCache = useCallback(() => {
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  }, []);

  return { memoryUsage, clearCache };
}

// Debounce hook for performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  useEffect(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + visibleCount + 2, items.length); // +2 for buffer

    setStartIndex(start);
    setEndIndex(end);
    setVisibleItems(items.slice(start, end));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    endIndex,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  };
}