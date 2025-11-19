/**
 * Animated Badge Component
 * Pulses when value changes to draw attention
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedBadgeProps {
  count: number;
  className?: string;
  pulseOnChange?: boolean;
}

export default function AnimatedBadge({ 
  count, 
  className = '', 
  pulseOnChange = true 
}: AnimatedBadgeProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const previousCountRef = useRef(count);

  useEffect(() => {
    // Trigger pulse animation when count increases
    if (pulseOnChange && count > previousCountRef.current && count > 0) {
      setIsPulsing(true);
      
      // Remove pulse class after animation
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
    
    previousCountRef.current = count;
  }, [count, pulseOnChange]);

  if (count === 0) return null;

  return (
    <span 
      className={`
        ${className}
        ${isPulsing ? 'animate-pulse-badge' : ''}
      `}
    >
      {count > 99 ? '99+' : count}
      <style jsx>{`
        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(1.25);
          }
        }
        .animate-pulse-badge {
          animation: pulse-badge 0.6s ease-in-out;
        }
      `}</style>
    </span>
  );
}
