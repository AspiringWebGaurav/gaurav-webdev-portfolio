import React from "react";
import { SkeletonCard } from "../core/SkeletonCard";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonImage } from "../core/SkeletonImage";
import { SkeletonGlobe } from "../core/SkeletonGlobe";
import { SkeletonButton } from "../core/SkeletonButton";
import { Skeleton } from "../core/Skeleton";

/**
 * Skeleton for Grid (BentoGrid) component
 * Shows 6 cards with different layouts matching the actual grid
 */
export function GridSkeleton() {
  return (
    <section id="about" className="w-full py-20">
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 md:grid-row-7 gap-4 lg:gap-8 mx-auto">
        
        {/* Card 1 - Large left card with image */}
        <SkeletonCard
          className="lg:col-span-3 md:col-span-6 md:row-span-4 lg:min-h-[60vh]"
          variant="bento"
        >
          <SkeletonImage className="absolute inset-0 w-full h-full opacity-50" />
          <div className="relative z-10 flex flex-col justify-end h-full p-5 lg:p-10">
            <SkeletonText lines={2} size="lg" width="full" />
          </div>
        </SkeletonCard>

        {/* Card 2 - Globe */}
        <SkeletonCard
          className="lg:col-span-2 md:col-span-3 md:row-span-2"
          variant="bento"
        >
          <div className="flex flex-col justify-between h-full">
            <SkeletonText lines={1} size="base" width="3/4" />
            <div className="flex-1 flex items-center justify-center">
              <SkeletonGlobe />
            </div>
          </div>
        </SkeletonCard>

        {/* Card 3 - Tech stack */}
        <SkeletonCard
          className="lg:col-span-2 md:col-span-3 md:row-span-2 relative"
          variant="bento"
        >
          <div className="flex flex-col h-full">
            <SkeletonText lines={1} size="base" width="1/2" />
            <SkeletonText lines={1} size="sm" width="3/4" className="mt-2" />
            
            {/* 4 columns of tech items */}
            <div className="flex gap-1 lg:gap-2 w-fit absolute -right-20 lg:-right-16 top-24">
              {[...Array(4)].map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-3 md:gap-3 lg:gap-8">
                  {[...Array(colIdx % 2 === 0 ? 3 : 4)].map((_, itemIdx) => (
                    <Skeleton
                      key={itemIdx}
                      className="lg:py-4 lg:px-3 py-2 px-3 w-16 lg:w-20 h-8 lg:h-12 rounded-lg"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </SkeletonCard>

        {/* Card 4 - Medium card */}
        <SkeletonCard
          className="lg:col-span-2 md:col-span-3 md:row-span-1"
          variant="bento"
        >
          <SkeletonImage className="absolute right-0 bottom-0 w-32 h-32 opacity-30" />
          <div className="relative z-10">
            <SkeletonText lines={2} size="base" width="3/4" />
          </div>
        </SkeletonCard>

        {/* Card 5 - Large bottom card */}
        <SkeletonCard
          className="md:col-span-3 md:row-span-2"
          variant="bento"
        >
          <SkeletonImage className="absolute right-0 bottom-0 md:w-96 w-60 h-full opacity-30" />
          <div className="relative z-10 flex flex-col justify-center h-full">
            <SkeletonText lines={1} size="sm" width="1/3" />
            <SkeletonText lines={2} size="lg" width="3/4" className="mt-3" />
          </div>
        </SkeletonCard>

        {/* Card 6 - Contact buttons */}
        <SkeletonCard
          className="lg:col-span-2 md:col-span-3 md:row-span-1 relative overflow-hidden"
          variant="bento"
        >
          {/* Gradient background animation placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-pulse" />
          
          <div className="relative z-10 flex flex-col justify-center items-center h-full">
            <SkeletonText lines={1} size="base" width="3/4" className="text-center mb-5" />
            
            {/* Two buttons side by side */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <SkeletonButton variant="magic" size="md" className="flex-1" />
              <SkeletonButton variant="magic" size="md" className="flex-1" />
            </div>
          </div>
        </SkeletonCard>
      </div>
    </section>
  );
}
