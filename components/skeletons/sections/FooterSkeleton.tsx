import React from "react";
import { SkeletonText } from "../core/SkeletonText";
import { SkeletonButton } from "../core/SkeletonButton";
import { SkeletonCircle } from "../core/SkeletonCircle";
import { Skeleton } from "../core/Skeleton";

/**
 * Skeleton for Footer component
 * Shows heading, button, and 3-column bottom section
 */
export function FooterSkeleton() {
  return (
    <footer className="w-full pt-20 pb-0" id="contact">
      <div className="flex flex-col items-center">
        {/* Heading */}
        <div className="lg:max-w-[45vw] text-center space-y-4">
          <SkeletonText lines={2} size="3xl" width="full" />
        </div>

        {/* Description */}
        <div className="text-center md:mt-10 my-5">
          <SkeletonText lines={1} size="base" width="full" className="max-w-2xl mx-auto" />
        </div>

        {/* CTA Button */}
        <SkeletonButton variant="magic" size="md" />
      </div>

      {/* Bottom Section - 3 Columns */}
      <div className="flex mt-16 md:flex-row flex-col justify-between items-center py-6 gap-6">
        {/* Left - Copyright */}
        <div className="md:text-base text-sm">
          <SkeletonText lines={1} size="sm" width="48" />
        </div>

        {/* Center - Links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Bug Report button */}
          <Skeleton className="w-28 h-8 rounded-md" />
          
          <span className="text-white-200/40 hidden md:inline">•</span>
          
          {/* Device ID */}
          <Skeleton className="w-32 h-8 rounded-md" />
          
          <span className="text-white-200/40 hidden md:inline">•</span>
          
          {/* Admin link */}
          <Skeleton className="w-24 h-8 rounded-md" />
        </div>

        {/* Right - Social Media Icons */}
        <div className="flex items-center gap-3">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="w-10 h-10 cursor-pointer flex justify-center items-center backdrop-filter backdrop-blur-lg saturate-180 bg-opacity-75 bg-black-200 rounded-lg border border-black-300"
            >
              <SkeletonCircle size="xs" />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
