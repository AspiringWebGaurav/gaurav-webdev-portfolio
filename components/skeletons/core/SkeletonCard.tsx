import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "bento" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Skeleton Card Component - Card containers matching portfolio style
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  children,
  variant = "default",
  padding = "md",
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-5 lg:p-10",
    lg: "p-6 lg:p-12",
  };

  const variantClasses = {
    default: "bg-white/[0.05] border border-white/[0.1]",
    bento: "bg-[rgb(4,7,29)] border border-white/[0.1]",
    glass: "bg-white/[0.02] border border-white/[0.15] backdrop-blur-sm",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      style={
        variant === "bento"
          ? {
              background: "rgb(4,7,29)",
              backgroundColor:
                "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};
