"use client";

import React, { useState } from "react";
import {
  FloatingNavSkeleton,
  HeroSkeleton,
  GridSkeleton,
  CurrentlyWorkingSkeleton,
  RecentProjectsSkeleton,
  ClientsSkeleton,
  ExperienceSkeleton,
  ApproachSkeleton,
  FooterSkeleton,
  VisitorTrackerSkeleton,
} from "@/components/skeletons";

/**
 * Skeleton Showcase Page
 * View all skeleton components in one place
 * Useful for testing and documentation
 */
export default function SkeletonShowcase() {
  const [activeSection, setActiveSection] = useState("all");

  const sections = [
    { id: "all", name: "All Sections" },
    { id: "nav", name: "Navigation", component: <FloatingNavSkeleton /> },
    { id: "hero", name: "Hero", component: <HeroSkeleton /> },
    { id: "grid", name: "Grid", component: <GridSkeleton /> },
    { id: "currently-working", name: "Currently Working", component: <CurrentlyWorkingSkeleton /> },
    { id: "projects", name: "Projects", component: <RecentProjectsSkeleton /> },
    { id: "clients", name: "Testimonials", component: <ClientsSkeleton /> },
    { id: "experience", name: "Experience", component: <ExperienceSkeleton /> },
    { id: "approach", name: "Approach", component: <ApproachSkeleton /> },
    { id: "footer", name: "Footer", component: <FooterSkeleton /> },
    { id: "tracker", name: "Visitor Tracker", component: <VisitorTrackerSkeleton /> },
  ];

  return (
    <div className="min-h-screen bg-black-100 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black-100/95 backdrop-blur-md border-b border-white/[0.1] p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">🎨 Skeleton Showcase</h1>
          
          {/* Section Selector */}
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeSection === section.id
                    ? "bg-purple text-white"
                    : "bg-white/[0.05] hover:bg-white/[0.1]"
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4">
        {activeSection === "all" ? (
          <div className="space-y-16">
            {sections.slice(1).map((section) => (
              <div key={section.id} className="border border-white/[0.1] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-purple">{section.name}</h2>
                <div className="relative">
                  {section.component}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-white/[0.1] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-purple">
              {sections.find((s) => s.id === activeSection)?.name}
            </h2>
            <div className="relative">
              {sections.find((s) => s.id === activeSection)?.component}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-white/[0.1] mt-16 p-6 text-center text-white/50">
        <p>Portfolio Skeleton System v1.0.0</p>
        <p className="text-sm mt-2">All skeletons match their actual component dimensions</p>
      </div>
    </div>
  );
}
