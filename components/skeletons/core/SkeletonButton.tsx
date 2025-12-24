import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface SkeletonButtonProps {
  className?: string;
  variant?: "default" | "magic" | "glass";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

/**
 * Skeleton Button Component - Mimics MagicButton and regular buttons
 */
export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  className,
  variant = "default",
  size = "md",
  fullWidth = false,
}) => {
  const sizeClasses = {
    sm: "h-9 px-4",
    md: "h-10 sm:h-12 px-4 sm:px-7",
    lg: "h-12 sm:h-14 px-6 sm:px-10",
  };

  const widthClass = fullWidth ? "w-full" : "w-auto md:w-60";

  if (variant === "magic") {
    return (
      <div
        className={cn(
          "relative inline-flex overflow-hidden rounded-lg p-[1px]",
          sizeClasses[size],
          widthClass,
          className
        )}
      >
        {/* Spinning border effect */}
        <span className="absolute inset-[-1000%] animate-spin bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
        
        {/* Button content */}
        <span className="relative inline-flex h-full w-full items-center justify-center gap-2 rounded-lg bg-slate-950 backdrop-blur-3xl">
          <Skeleton className="h-4 w-4" rounded="sm" />
          <Skeleton className="h-4 w-24" rounded="md" />
        </span>
      </div>
    );
  }

  if (variant === "glass") {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/[0.1] bg-white/[0.05] backdrop-blur-sm",
          sizeClasses[size],
          widthClass,
          className
        )}
        style={{
          backdropFilter: "blur(10px)",
        }}
      >
        <Skeleton className="h-4 w-4" rounded="sm" />
        <Skeleton className="h-4 w-20" rounded="md" />
      </div>
    );
  }

  return (
    <Skeleton
      className={cn(
        "inline-flex items-center justify-center",
        sizeClasses[size],
        widthClass,
        className
      )}
      rounded="lg"
    />
  );
};
