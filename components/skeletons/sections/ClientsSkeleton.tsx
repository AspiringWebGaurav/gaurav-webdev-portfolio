import React from "react";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonCircle } from "../core/SkeletonCircle";
import { Skeleton } from "../core/Skeleton";

/**
 * Skeleton for Clients (Testimonials) component
 * Shows infinite moving cards with testimonials
 */
export function ClientsSkeleton() {
  return (
    <section id="testimonials" className="py-20">
      {/* Heading */}
      <h1 className="heading">
        Kind words from
        <span className="text-purple"> satisfied clients</span>
      </h1>

      <div className="flex flex-col items-center max-lg:mt-10">
        <div className="h-[50vh] md:h-[30rem] rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden w-screen">
          {/* Horizontal scrolling container */}
          <div className="flex gap-16 py-4 animate-scroll">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="w-[90vw] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-800 p-5 md:p-16 md:w-[60vw]"
                style={{
                  background: "rgb(4,7,29)",
                  backgroundColor:
                    "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
                }}
              >
                {/* Quote icon placeholder */}
                <Skeleton className="w-8 h-8 rounded mb-4" />

                {/* Quote text */}
                <div className="mb-6">
                  <SkeletonText lines={4} size="base" width="full" />
                </div>

                {/* Bottom section */}
                <div className="flex items-center gap-4 mt-8">
                  {/* Avatar */}
                  <SkeletonCircle size="lg" />

                  <div className="flex-1">
                    {/* Name */}
                    <SkeletonText lines={1} size="base" width="1/2" />
                    {/* Title/Company */}
                    <SkeletonText lines={1} size="sm" width="3/4" className="mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
