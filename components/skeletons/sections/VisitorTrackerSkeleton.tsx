import React from "react";
import { Skeleton } from "../core/Skeleton";

/**
 * Skeleton for VisitorTracker component
 * Shows a small non-intrusive analytics initializing indicator
 */
export function VisitorTrackerSkeleton() {
  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] pointer-events-none"
      aria-label="Initializing analytics"
    >
      {/* Compact pulsing indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.05] border border-white/[0.1] backdrop-blur-sm">
        {/* Animated dot */}
        <div className="relative">
          <div className="w-2 h-2 bg-purple rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 bg-purple rounded-full animate-ping" />
        </div>
        
        {/* Text */}
        <Skeleton className="w-24 h-3 rounded" />
      </div>
    </div>
  );
}
