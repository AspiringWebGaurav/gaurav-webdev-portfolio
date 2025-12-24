import React from "react";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonPinContainer } from "../core/SkeletonPinContainer";
import { SkeletonImage } from "../core/SkeletonImage";
import { SkeletonCircle } from "../core/SkeletonCircle";
import { Skeleton } from "../core/Skeleton";

/**
 * Skeleton for RecentProjects component
 * Shows 4 project cards in 2x2 grid
 */
export function RecentProjectsSkeleton() {
  return (
    <div className="py-20" id="projects">
      {/* Heading */}
      <h1 className="heading">
        A small selection of{" "}
        <span className="text-purple">recent projects</span>
      </h1>

      {/* Projects Grid - 2x2 */}
      <div className="flex flex-wrap items-center justify-center p-4 gap-x-24 gap-y-3 sm:gap-y-8 mt-10">
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="sm:h-[41rem] h-[32rem] lg:min-h-[32.5rem] flex items-center justify-center sm:w-[570px] w-[80vw]"
          >
            <SkeletonPinContainer>
              <div className="flex flex-col w-full">
                {/* Project Image */}
                <div className="relative flex items-center justify-center sm:w-[570px] w-[80vw] overflow-hidden sm:h-[40vh] h-[30vh] mb-10">
                  <div
                    className="relative w-full h-full overflow-hidden lg:rounded-3xl"
                    style={{ backgroundColor: "#13162D" }}
                  >
                    <SkeletonImage className="absolute inset-0" />
                  </div>
                </div>

                {/* Title */}
                <SkeletonText lines={1} size="xl" width="full" />

                {/* Description */}
                <div className="mt-3">
                  <SkeletonText lines={2} size="base" width="full" />
                </div>

                {/* Tech icons and link */}
                <div className="flex items-center justify-between mt-7 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, iconIdx) => (
                      <div
                        key={iconIdx}
                        style={{
                          transform: `translateX(-${5 * iconIdx + 2}px)`,
                        }}
                      >
                        <SkeletonCircle size={32} className="border border-white/[.2]" />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center items-center">
                    <Skeleton className="w-32 h-5 rounded" />
                  </div>
                </div>
              </div>
            </SkeletonPinContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
