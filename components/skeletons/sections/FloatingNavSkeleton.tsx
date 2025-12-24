import React from "react";
import { SkeletonButton } from "../core/SkeletonButton";
import { SkeletonCircle } from "../core/SkeletonCircle";
import { SkeletonText } from "../core/SkeletonText";

/**
 * Skeleton for FloatingNav component
 * Shows navigation bar with 4 nav items
 */
export function FloatingNavSkeleton() {
  const navItems = ["About", "Projects", "Testimonials", "Contact"];

  return (
    <div
      className="flex max-w-fit md:min-w-[70vw] lg:min-w-fit fixed z-[5000] top-10 inset-x-0 mx-auto px-10 py-5 rounded-lg border shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] items-center justify-center space-x-4"
      style={{
        backdropFilter: "blur(30px) saturate(150%)",
        backgroundColor: "rgba(255, 255, 255, 0.025)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      {navItems.map((item, idx) => (
        <div
          key={idx}
          className="relative flex items-center space-x-1"
        >
          {/* Icon placeholder for mobile */}
          <SkeletonCircle size="xs" className="block sm:hidden" />
          
          {/* Text placeholder */}
          <SkeletonText width="20" size="sm" className="w-16 sm:w-20" />
        </div>
      ))}
    </div>
  );
}
