import React from "react";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonPinContainer } from "../core/SkeletonPinContainer";
import { SkeletonImage } from "../core/SkeletonImage";
import { SkeletonCircle } from "../core/SkeletonCircle";
import { SkeletonButton } from "../core/SkeletonButton";
import { Skeleton } from "../core/Skeleton";

/**
 * Skeleton for CurrentlyWorking component
 * Shows pin container with image, badges, and buttons
 */
export function CurrentlyWorkingSkeleton() {
  return (
    <div className="py-10">
      {/* Heading */}
      <h1 className="heading">
        <SkeletonText size="2xl" width="1/2" className="mx-auto" />
      </h1>

      {/* Pin Container Card */}
      <div className="w-full py-10">
        <div className="flex flex-wrap items-center justify-center p-4">
          <SkeletonPinContainer>
            <div className="flex flex-col w-full">
              {/* Image area with badges */}
              <div className="relative flex items-center justify-center sm:w-[570px] w-[80vw] overflow-hidden sm:h-[40vh] h-[30vh] mb-10 rounded-3xl bg-[#13162D]">
                {/* The Inside Scoop badge */}
                <div className="absolute top-4 left-4 z-20">
                  <Skeleton className="w-32 h-6 rounded-full" />
                </div>

                {/* Blog notification badge */}
                <div className="absolute top-4 right-4 z-20">
                  <Skeleton className="w-24 h-6 rounded-full" />
                </div>

                {/* Image placeholder */}
                <SkeletonImage className="absolute inset-0" />
              </div>

              {/* Title */}
              <SkeletonText lines={1} size="xl" width="3/4" />

              {/* Description */}
              <div className="mt-3">
                <SkeletonText lines={3} size="base" width="full" />
              </div>

              {/* Tech icons */}
              <div className="flex items-center mt-7 mb-3 gap-2">
                {[...Array(6)].map((_, idx) => (
                  <SkeletonCircle key={idx} size={32} />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <SkeletonButton variant="magic" size="md" fullWidth />
                <SkeletonButton variant="magic" size="md" fullWidth />
              </div>

              {/* Status badges */}
              <div className="flex gap-2 mt-4">
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-24 h-6 rounded-full" />
              </div>
            </div>
          </SkeletonPinContainer>
        </div>
      </div>
    </div>
  );
}
