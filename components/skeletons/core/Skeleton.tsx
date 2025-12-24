import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  animation?: "shimmer" | "pulse" | "none";
}

/**
 * Base Skeleton Component with Shimmer Animation
 * Core building block for all skeleton loaders
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, rounded = "md", animation = "shimmer" }, ref) => {
    const roundedClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full",
    };

    const animationClasses = {
      shimmer: "animate-shimmer bg-gradient-to-r from-white/[0.05] via-white/[0.1] to-white/[0.05] bg-[length:200%_100%]",
      pulse: "animate-pulse bg-white/[0.05]",
      none: "bg-white/[0.05]",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height) style.height = typeof height === "number" ? `${height}px` : height;

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          roundedClasses[rounded],
          animationClasses[animation],
          className
        )}
        style={style}
        aria-hidden="true"
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Add shimmer animation to global CSS if not already present
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-shimmer {
      animation: shimmer 2s ease-in-out infinite;
    }
  `;
  if (!document.querySelector('[data-skeleton-styles]')) {
    style.setAttribute('data-skeleton-styles', 'true');
    document.head.appendChild(style);
  }
}
