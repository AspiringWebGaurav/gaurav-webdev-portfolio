import React from "react";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonButton } from "../core/SkeletonButton";

/**
 * Skeleton for Hero component
 * Shows spotlights, heading, subtitle, and button
 */
export function HeroSkeleton() {
  return (
    <div className="pb-20 pt-36">
      {/* Spotlights placeholders */}
      <div>
        <div className="absolute -top-40 -left-10 md:-left-32 md:-top-20 h-screen w-[40vw] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute h-[80vh] w-[50vw] top-10 left-full bg-purple/[0.02] rounded-full blur-3xl" />
        <div className="absolute left-80 top-28 h-[80vh] w-[50vw] bg-blue/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Grid background */}
      <div className="h-screen w-full dark:bg-black-100 bg-white dark:bg-grid-white/[0.03] bg-grid-black-100/[0.2] absolute top-0 left-0 flex items-center justify-center">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      {/* Content */}
      <div className="flex justify-center relative my-20 z-10">
        <div className="max-w-[89vw] md:max-w-2xl lg:max-w-[60vw] flex flex-col items-center justify-center space-y-6">
          {/* Small label */}
          <SkeletonText 
            width="full" 
            size="xs" 
            className="max-w-80"
          />

          {/* Main heading - 3 lines */}
          <div className="w-full space-y-3">
            <SkeletonText width="full" size="3xl" />
            <SkeletonText width="full" size="3xl" />
            <SkeletonText width="3/4" size="3xl" className="mx-auto" />
          </div>

          {/* Subtitle */}
          <SkeletonText 
            width="full" 
            size="lg" 
            className="max-w-2xl"
          />

          {/* Button */}
          <div className="mt-4">
            <SkeletonButton variant="magic" size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
