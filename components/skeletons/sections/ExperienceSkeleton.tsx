import React from "react";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonMovingBorder } from "../core/SkeletonMovingBorder";
import { SkeletonCircle } from "../core/SkeletonCircle";

/**
 * Skeleton for Experience component
 * Shows 4 work experience cards in grid
 */
export function ExperienceSkeleton() {
  return (
    <div className="py-20 w-full">
      {/* Heading */}
      <h1 className="heading">
        My <span className="text-purple">work experience</span>
      </h1>

      {/* Grid - 4 columns on desktop */}
      <div className="w-full mt-12 grid lg:grid-cols-4 grid-cols-1 gap-10">
        {[...Array(4)].map((_, idx) => (
          <SkeletonMovingBorder
            key={idx}
            borderRadius="1.75rem"
            className="flex-1 border-neutral-200 dark:border-slate-800"
          >
            <div className="flex lg:flex-row flex-col lg:items-center p-3 py-6 md:p-5 lg:p-10 gap-2">
              {/* Company logo/thumbnail */}
              <SkeletonCircle size={80} className="lg:w-32 md:w-20 w-16 lg:h-32 md:h-20 h-16 rounded-lg" />

              <div className="lg:ms-5 flex-1">
                {/* Job title */}
                <SkeletonText lines={1} size="xl" width="full" />

                {/* Company name */}
                <SkeletonText lines={1} size="sm" width="3/4" className="mt-2" />

                {/* Description */}
                <div className="mt-3">
                  <SkeletonText lines={2} size="base" width="full" />
                </div>

                {/* Duration & location */}
                <SkeletonText lines={1} size="sm" width="3/4" className="mt-2" />
              </div>
            </div>
          </SkeletonMovingBorder>
        ))}
      </div>
    </div>
  );
}
