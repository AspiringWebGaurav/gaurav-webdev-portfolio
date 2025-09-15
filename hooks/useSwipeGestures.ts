"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventDefaultTouchmove?: boolean;
}

export function useSwipeGestures(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    preventDefaultTouchmove = true
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      setIsSwipeActive(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeActive) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = touchStartX.current - currentX;
      const diffY = touchStartY.current - currentY;

      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (preventDefaultTouchmove) {
          e.preventDefault();
        }
        
        // Show swipe indicator
        if (Math.abs(diffX) > threshold / 2) {
          setSwipeDirection(diffX > 0 ? 'left' : 'right');
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwipeActive) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX.current - touchEndX;
      const diffY = touchStartY.current - touchEndY;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (diffX > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diffX < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }

      setIsSwipeActive(false);
      setSwipeDirection(null);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSwipeActive, onSwipeLeft, onSwipeRight, threshold, preventDefaultTouchmove]);

  return { isSwipeActive, swipeDirection };
}

// Admin navigation swipe hook
export function useAdminSwipeNavigation() {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const adminRoutes = ['/admin', '/admin/visitors', '/admin/appeals', '/admin/ai-assistant'];
  
  const getCurrentIndex = () => {
    return adminRoutes.indexOf(currentPath);
  };

  const navigateToRoute = (direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'left') {
      newIndex = currentIndex + 1;
    } else {
      newIndex = currentIndex - 1;
    }

    if (newIndex >= 0 && newIndex < adminRoutes.length) {
      // Add transition class before navigation
      document.body.classList.add(`transitioning-${direction}`);
      
      setTimeout(() => {
        router.push(adminRoutes[newIndex]);
        document.body.classList.remove(`transitioning-${direction}`);
      }, 100);
    }
  };

  const { isSwipeActive, swipeDirection } = useSwipeGestures({
    onSwipeLeft: () => navigateToRoute('left'),
    onSwipeRight: () => navigateToRoute('right'),
    threshold: 80
  });

  return { isSwipeActive, swipeDirection, currentPath };
}