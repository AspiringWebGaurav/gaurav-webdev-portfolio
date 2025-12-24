'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ bottom: 12, right: 80 });
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic scroll threshold based on viewport
  const getScrollThreshold = useCallback(() => {
    return Math.min(window.innerHeight * 0.5, 600);
  }, []);

  // Debounced scroll handler with RAF
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const threshold = getScrollThreshold();
        const shouldShow = window.scrollY > threshold;
        setIsVisible(shouldShow);
      });
    }, 150); // 150ms debounce
  }, [getScrollThreshold]);

  // Smooth scroll to top with reduced motion support
  const scrollToTop = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  }, [scrollToTop]);

  // Calculate dynamic position to the left of chat bubble
  const calculatePosition = useCallback(() => {
    const chatBubble = document.querySelector('[data-chat-bubble]') as HTMLElement;
    if (!chatBubble) {
      // Fallback positions if bubble not found
      const isMobile = window.innerWidth < 640;
      setPosition({ bottom: isMobile ? 20 : 16, right: isMobile ? 96 : 96 });
      return;
    }

    const bubbleRect = chatBubble.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Position button to the left of bubble with appropriate gap
    const gap = 17; // 17px consistent gap on all devices
    
    // Calculate right position: distance from viewport right to bubble's left edge, then add gap
    const rightPosition = viewportWidth - bubbleRect.left + gap;
    
    // Calculate bottom position to vertically center align with bubble
    const bubbleCenter = bubbleRect.top + (bubbleRect.height / 2);
    const buttonHeight = 48; // w-12 = h-12 = 48px
    const bottomPosition = window.innerHeight - bubbleCenter - (buttonHeight / 2);

    setPosition({
      bottom: bottomPosition,
      right: rightPosition
    });
  }, []);

  // Debounced resize handler
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      calculatePosition();
    }, 100);
  }, [calculatePosition]);

  useEffect(() => {
    // Initial checks
    handleScroll();
    calculatePosition();

    // Passive event listeners for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Recalculate position periodically in case bubble moves
    const positionInterval = setInterval(calculatePosition, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearInterval(positionInterval);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll, handleResize, calculatePosition]);

  if (!isVisible) return null;

  return (
    <button
      data-scroll-button
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      aria-label="Scroll to top"
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
      }}
      className="fixed z-40 flex flex-col items-center justify-center gap-0.5 
                 w-12 h-12
                 bg-white-200/5 border border-white-200/20 
                 backdrop-blur-sm rounded-lg
                 hover:bg-white-200/15 hover:border-white-200/40 hover:shadow-lg hover:shadow-white-200/10
                 active:scale-95 active:bg-white-200/20
                 transition-all duration-300 ease-out
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white-200/40
                 touch-manipulation
                 group"
    >
      <ArrowUp className="w-5 h-5 text-white-100/70 group-hover:text-white-100 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
      <span className="text-[9px] text-white-100/60 group-hover:text-white-100/90 font-medium leading-none transition-colors duration-300">Top</span>
    </button>
  );
}
