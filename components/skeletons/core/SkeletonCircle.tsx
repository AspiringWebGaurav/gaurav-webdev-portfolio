import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface SkeletonCircleProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
}

/**
 * Skeleton Circle Component - For avatars, icons, logos
 */
export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  className,
  size = "md",
}) => {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    "2xl": "w-32 h-32",
  };

  const sizeClass = typeof size === "number" 
    ? "" 
    : sizeClasses[size];

  const sizeStyle = typeof size === "number" 
    ? `w-[${size}px] h-[${size}px]` 
    : "";

  return (
    <Skeleton
      className={cn(sizeClass, sizeStyle, "shrink-0", className)}
      rounded="full"
    />
  );
};
