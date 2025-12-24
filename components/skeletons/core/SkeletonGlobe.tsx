import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonGlobeProps {
  className?: string;
}

/**
 * Skeleton Globe Component - Spinning globe placeholder for GridGlobe
 */
export const SkeletonGlobe: React.FC<SkeletonGlobeProps> = ({
  className,
}) => {
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      {/* Outer rotating ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-blue-500/20 animate-spin-slow" 
             style={{ animationDuration: '20s' }} />
      </div>
      
      {/* Middle rotating ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 md:w-40 md:h-40 rounded-full border-2 border-purple-500/20 animate-spin-slow" 
             style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
      </div>
      
      {/* Inner sphere with gradient */}
      <div className="relative w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>
      
      {/* Globe grid lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-32 h-32 md:w-48 md:h-48 opacity-20" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-400" />
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-400" />
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-400" transform="rotate(60 50 50)" />
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-400" transform="rotate(120 50 50)" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-blue-400" />
        </svg>
      </div>
    </div>
  );
};

// Add slow spin animation
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 20s linear infinite;
    }
  `;
  if (!document.querySelector('[data-globe-skeleton-styles]')) {
    style.setAttribute('data-globe-skeleton-styles', 'true');
    document.head.appendChild(style);
  }
}
