import { useState, useEffect, useRef, TouchEvent, MouseEvent } from 'react';
import { TourGesture } from '../types';

interface UseTourGesturesProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  isEnabled?: boolean;
  swipeThreshold?: number;
  tapThreshold?: number;
}

export const useTourGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  isEnabled = true,
  swipeThreshold = 50,
  tapThreshold = 10
}: UseTourGesturesProps) => {
  const [isGesturing, setIsGesturing] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<TourGesture | null>(null);
  
  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Helper function to get coordinates from touch or mouse event
  const getCoordinates = (e: TouchEvent | MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX,
        y: e.clientY
      };
    }
    return { x: 0, y: 0 };
  };

  // Handle gesture start (touch or mouse down)
  const handleGestureStart = (e: TouchEvent | MouseEvent) => {
    if (!isEnabled) return;
    
    const coords = getCoordinates(e);
    gestureStartRef.current = {
      x: coords.x,
      y: coords.y,
      time: Date.now()
    };
    
    setIsGesturing(true);
  };

  // Handle gesture move (touch or mouse move)
  const handleGestureMove = (e: TouchEvent | MouseEvent) => {
    if (!isEnabled || !gestureStartRef.current || !isGesturing) return;
    
    const coords = getCoordinates(e);
    const deltaX = coords.x - gestureStartRef.current.x;
    const deltaY = coords.y - gestureStartRef.current.y;
    
    const gesture: TourGesture = {
      startX: gestureStartRef.current.x,
      startY: gestureStartRef.current.y,
      endX: coords.x,
      endY: coords.y,
      deltaX,
      deltaY,
      isSwipe: Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold,
      direction: null
    };
    
    // Determine direction if it's a swipe
    if (gesture.isSwipe) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        gesture.direction = deltaX > 0 ? 'right' : 'left';
      } else {
        gesture.direction = deltaY > 0 ? 'down' : 'up';
      }
    }
    
    setCurrentGesture(gesture);
  };

  // Handle gesture end (touch or mouse up)
  const handleGestureEnd = (e: TouchEvent | MouseEvent) => {
    if (!isEnabled || !gestureStartRef.current || !isGesturing) return;
    
    const coords = getCoordinates(e);
    const deltaX = coords.x - gestureStartRef.current.x;
    const deltaY = coords.y - gestureStartRef.current.y;
    const deltaTime = Date.now() - gestureStartRef.current.time;
    
    const gesture: TourGesture = {
      startX: gestureStartRef.current.x,
      startY: gestureStartRef.current.y,
      endX: coords.x,
      endY: coords.y,
      deltaX,
      deltaY,
      isSwipe: Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold,
      direction: null
    };
    
    // Determine if it's a tap (small movement, quick time)
    const isTap = Math.abs(deltaX) < tapThreshold && 
                  Math.abs(deltaY) < tapThreshold && 
                  deltaTime < 500;
    
    if (isTap && onTap) {
      onTap();
    } else if (gesture.isSwipe) {
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > swipeThreshold && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < -swipeThreshold && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        if (deltaY > swipeThreshold && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < -swipeThreshold && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
    
    // Reset gesture state
    setIsGesturing(false);
    setCurrentGesture(null);
    gestureStartRef.current = null;
  };

  // Touch event handlers
  const touchHandlers = {
    onTouchStart: handleGestureStart,
    onTouchMove: handleGestureMove,
    onTouchEnd: handleGestureEnd,
    onTouchCancel: () => {
      setIsGesturing(false);
      setCurrentGesture(null);
      gestureStartRef.current = null;
    }
  };

  // Mouse event handlers (for desktop testing)
  const mouseHandlers = {
    onMouseDown: handleGestureStart,
    onMouseMove: isGesturing ? handleGestureMove : undefined,
    onMouseUp: handleGestureEnd,
    onMouseLeave: () => {
      if (isGesturing) {
        setIsGesturing(false);
        setCurrentGesture(null);
        gestureStartRef.current = null;
      }
    }
  };

  // Prevent default touch behaviors that might interfere
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isEnabled) return;

    const preventDefault = (e: Event) => {
      if (isGesturing) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      element.removeEventListener('touchmove', preventDefault);
    };
  }, [isGesturing, isEnabled]);

  // Keyboard support for accessibility
  const keyboardHandlers = {
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!isEnabled) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onSwipeLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSwipeRight?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onSwipeUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onSwipeDown?.();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onTap?.();
          break;
      }
    }
  };

  return {
    elementRef,
    isGesturing,
    currentGesture,
    touchHandlers: isEnabled ? touchHandlers : {},
    mouseHandlers: isEnabled ? mouseHandlers : {},
    keyboardHandlers: isEnabled ? keyboardHandlers : {},
    gestureProps: isEnabled ? {
      ...touchHandlers,
      ...mouseHandlers,
      ...keyboardHandlers,
      ref: elementRef,
      tabIndex: 0
    } : { ref: elementRef }
  };
};

export default useTourGestures;