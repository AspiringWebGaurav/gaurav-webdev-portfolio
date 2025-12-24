import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface SkeletonMovingBorderProps {
  className?: string;
  children?: React.ReactNode;
  borderRadius?: string;
}

/**
 * Skeleton Moving Border Component - Mimics MovingBorders button style
 */
export const SkeletonMovingBorder: React.FC<SkeletonMovingBorderProps> = ({
  className,
  children,
  borderRadius = "1.75rem",
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-transparent p-[1px]",
        className
      )}
      style={{
        borderRadius: borderRadius,
      }}
    >
      {/* Animated border effect */}
      <div
        className="absolute inset-0 rounded-[1.75rem]"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <div className="absolute inset-0 rounded-[1.75rem] overflow-hidden">
          {/* Moving gradient border */}
          <div 
            className="absolute w-20 h-20 bg-gradient-to-r from-purple-500/60 via-purple-400/40 to-transparent rounded-full blur-xl animate-spin"
            style={{ animationDuration: '3s' }}
          />
        </div>
      </div>

      {/* Card content */}
      <div
        className={cn(
          "relative bg-slate-900/80 border border-slate-800 backdrop-blur-xl w-full h-full flex items-center justify-center",
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
          background: "rgb(4,7,29)",
          backgroundColor:
            "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
};
