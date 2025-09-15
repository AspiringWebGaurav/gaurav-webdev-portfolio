"use client";

import { ReactNode, useEffect, useState } from 'react';
import { BanCategory, BanPageDesign } from '@/types/banSystem';

interface CategoryTransitionProps {
  isTransitioning: boolean;
  category: BanCategory;
  design: BanPageDesign;
  children: ReactNode;
}

export function CategoryTransition({
  isTransitioning,
  category,
  design,
  children
}: CategoryTransitionProps) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isTransitioning) {
      // Start exit animation
      setAnimationClass('animate-category-exit');
      
      // After exit animation, update content and start enter animation
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setAnimationClass('animate-category-enter');
        
        // Clear animation class after enter animation
        const enterTimeout = setTimeout(() => {
          setAnimationClass('');
        }, 600);
        
        return () => clearTimeout(enterTimeout);
      }, 300);
      
      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
      setAnimationClass('');
    }
  }, [isTransitioning, children]);

  return (
    <div className={`transition-wrapper ${animationClass}`}>
      {displayChildren}
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        .transition-wrapper {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-category-exit {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        
        .animate-category-enter {
          animation: categoryEnter 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes categoryEnter {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          50% {
            opacity: 0.5;
            transform: translateY(10px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Category-specific entrance animations */
        .category-normal .animate-category-enter {
          animation: normalEnter 0.5s ease-out forwards;
        }
        
        .category-medium .animate-category-enter {
          animation: mediumEnter 0.6s ease-out forwards;
        }
        
        .category-danger .animate-category-enter {
          animation: dangerEnter 0.7s ease-out forwards;
        }
        
        .category-severe .animate-category-enter {
          animation: severeEnter 0.8s ease-out forwards;
        }
        
        @keyframes normalEnter {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes mediumEnter {
          0% {
            opacity: 0;
            transform: translateX(-20px) rotate(-1deg);
          }
          50% {
            opacity: 0.7;
            transform: translateX(5px) rotate(0.5deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(0deg);
          }
        }
        
        @keyframes dangerEnter {
          0% {
            opacity: 0;
            transform: scale(0.9) rotate(1deg);
          }
          30% {
            opacity: 0.3;
            transform: scale(0.95) rotate(-0.5deg);
          }
          70% {
            opacity: 0.8;
            transform: scale(1.02) rotate(0.2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes severeEnter {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(30px);
          }
          25% {
            opacity: 0.2;
            transform: scale(0.9) translateY(15px);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.98) translateY(5px);
          }
          75% {
            opacity: 0.8;
            transform: scale(1.05) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        /* Loading shimmer effect during transition */
        .transition-wrapper.animate-category-exit::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: shimmer 1s ease-in-out;
          z-index: 1000;
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}