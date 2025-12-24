import React from "react";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonCard } from "../core/SkeletonCard";
import { Skeleton } from "../core/Skeleton";

/**
 * Skeleton for Approach component
 * Shows 3 phase cards with canvas effect
 */
export function ApproachSkeleton() {
  return (
    <section className="w-full py-20">
      {/* Heading */}
      <h1 className="heading">
        My <span className="text-purple">approach</span>
      </h1>

      {/* 3 Phase Cards */}
      <div className="my-20 flex flex-col lg:flex-row items-center justify-center w-full gap-4">
        {[1, 2, 3].map((phase) => (
          <SkeletonCard
            key={phase}
            className="max-w-sm w-full mx-auto p-4 lg:h-[35rem] group/card"
            variant="bento"
          >
            {/* Corner decorations */}
            <div className="absolute h-10 w-10 -top-3 -left-3 text-white/30">
              <Skeleton className="w-full h-full rounded" />
            </div>
            <div className="absolute h-10 w-10 -bottom-3 -left-3 text-white/30">
              <Skeleton className="w-full h-full rounded" />
            </div>
            <div className="absolute h-10 w-10 -top-3 -right-3 text-white/30">
              <Skeleton className="w-full h-full rounded" />
            </div>
            <div className="absolute h-10 w-10 -bottom-3 -right-3 text-white/30">
              <Skeleton className="w-full h-full rounded" />
            </div>

            {/* Canvas gradient background placeholder */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-0 group-hover/card:opacity-100 transition-opacity duration-500">
              <div
                className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-pink-900/20 to-sky-600/20 animate-pulse"
                style={{
                  background:
                    phase === 1
                      ? "radial-gradient(circle, rgba(4, 120, 87, 0.3) 0%, transparent 70%)"
                      : phase === 2
                      ? "radial-gradient(circle, rgba(219, 39, 119, 0.3) 0%, transparent 70%)"
                      : "radial-gradient(circle, rgba(2, 132, 199, 0.3) 0%, transparent 70%)",
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-20 px-10 h-full flex flex-col justify-center">
              {/* Phase badge - center */}
              <div className="text-center mb-8 opacity-100 group-hover/card:opacity-0 transition-opacity duration-200">
                <Skeleton className="w-24 h-24 mx-auto rounded-full" />
                <SkeletonText
                  lines={1}
                  size="sm"
                  width="1/2"
                  className="mt-4 mx-auto"
                />
              </div>

              {/* Title - shows on hover */}
              <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                <SkeletonText
                  lines={2}
                  size="2xl"
                  width="full"
                  className="text-center"
                />

                {/* Description */}
                <div className="mt-4">
                  <SkeletonText lines={3} size="sm" width="full" />
                </div>
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </section>
  );
}
