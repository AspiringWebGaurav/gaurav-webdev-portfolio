import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonPinContainerProps {
  className?: string;
  children?: React.ReactNode;
  height?: string;
}

/**
 * Skeleton Pin Container - Mimics 3D PinContainer effect
 */
export const SkeletonPinContainer: React.FC<SkeletonPinContainerProps> = ({
  className,
  children,
  height = "h-[32rem] sm:h-[41rem]",
}) => {
  return (
    <div className={cn("relative group/pin z-50", height, className)}>
      {/* 3D perspective container */}
      <div
        style={{
          perspective: "1000px",
          transform: "rotateX(70deg) translateZ(0deg)",
        }}
        className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          style={{
            transform: "translate(-50%,-50%) rotateX(0deg)",
          }}
          className="absolute left-1/2 p-4 top-1/2 flex justify-start items-start rounded-2xl shadow-[0_8px_16px_rgb(0_0_0/0.4)] border border-white/[0.1] transition duration-700 overflow-hidden"
        >
          {/* Card content with skeleton */}
          <div className="relative z-50 w-[80vw] sm:w-[570px]">
            {children}
          </div>
        </div>
      </div>

      {/* Pin label placeholder */}
      <div className="pointer-events-none w-full h-80 flex items-center justify-center opacity-0 group-hover/pin:opacity-100 z-[60] transition duration-500">
        <div className="w-full h-full -mt-7 flex-none inset-0">
          <div className="absolute top-0 inset-x-0 flex justify-center">
            <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
              <span className="relative z-20 text-white text-xs font-bold inline-block py-0.5">
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
