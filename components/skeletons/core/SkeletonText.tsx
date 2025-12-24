import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface SkeletonTextProps {
  className?: string;
  lines?: number;
  width?: "full" | "3/4" | "1/2" | "1/3" | "1/4" | string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  gap?: number;
}

/**
 * Skeleton Text Component - Multiple lines with varying widths
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  className,
  lines = 1,
  width = "full",
  size = "base",
  gap = 3,
}) => {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
  };

  const heightClasses = {
    xs: "h-3",
    sm: "h-3.5",
    base: "h-4",
    lg: "h-5",
    xl: "h-6",
    "2xl": "h-8",
    "3xl": "h-10",
  };

  const widthClass = widthClasses[width as keyof typeof widthClasses] || width;
  const heightClass = heightClasses[size];

  if (lines === 1) {
    return (
      <Skeleton
        className={cn(widthClass, heightClass, className)}
        rounded="md"
      />
    );
  }

  return (
    <div className={cn("flex flex-col", `gap-${gap}`, className)}>
      {Array.from({ length: lines }).map((_, index) => {
        // Last line is typically shorter
        const isLast = index === lines - 1;
        const lineWidth = isLast && lines > 1 ? "w-3/4" : widthClass;
        
        return (
          <Skeleton
            key={index}
            className={cn(lineWidth, heightClass)}
            rounded="md"
          />
        );
      })}
    </div>
  );
};
