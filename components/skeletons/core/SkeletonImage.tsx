import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface SkeletonImageProps {
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide" | string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

/**
 * Skeleton Image Component - Image placeholders with aspect ratios
 */
export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  className,
  aspectRatio,
  width,
  height,
  rounded = "lg",
}) => {
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  };

  const aspectClass = aspectRatio && aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses];

  return (
    <div className={cn("relative overflow-hidden bg-white/[0.02]", aspectClass, className)}>
      <Skeleton
        className="absolute inset-0 w-full h-full"
        width={width}
        height={height}
        rounded={rounded}
      />
      {/* Optional: Icon to indicate image loading */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-white/[0.1]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
};
