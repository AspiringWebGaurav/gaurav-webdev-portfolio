"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface ProjectImageSliderProps {
  images: string[];
  lightImages?: string[];
  title: string;
  className?: string;
  aspectClass?: string;
}

// Automatic light-theme image mappings for projects
const LIGHT_IMAGE_MAP: Record<string, string> = {
  "/projects/send2me/cover.webp": "/projects/send2me/cover-light.webp",
  "/projects/send2me/mobile.webp": "/projects/send2me/mobile-light.webp",
  "/projects/send2me/dashboard.webp": "/projects/send2me/dashboard-light.webp",
  "/projects/send2me/features.webp": "/projects/send2me/features-light.webp",
  "/projects/send2me/transfer-ui.webp": "/projects/send2me/transfer-ui-light.webp",
  "/projects/gpmas/cover.webp": "/projects/gpmas/cover-light.webp",
  "/projects/gpmas/mobile.webp": "/projects/gpmas/mobile-light.webp",
  "/projects/gpmas/dashboard.webp": "/projects/gpmas/dashboard-light.webp",
  "/projects/gpmas/features.webp": "/projects/gpmas/features-light.webp",
  "/projects/gmp/cover.webp": "/projects/gmp/cover-light.webp",
};

export const ProjectImageSlider: React.FC<ProjectImageSliderProps> = ({
  images,
  lightImages,
  title,
  className = "",
  aspectClass = "sm:h-[40vh] h-[28vh]",
}) => {
  const validImages = images && images.length > 0 ? images : ["/p1.webp"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const hasMultiple = validImages.length > 1;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  useEffect(() => {
    if (!hasMultiple || isHovered) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 3500);

    return () => clearInterval(timer);
  }, [hasMultiple, isHovered, nextSlide]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center sm:w-[570px] w-[90vw] max-w-[570px] overflow-hidden rounded-2xl lg:rounded-3xl group/slider select-none mb-3 sm:mb-3.5",
        aspectClass,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Structural Canvas Backdrop (Light & Dark Polish) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden lg:rounded-3xl bg-slate-50/90 dark:bg-[#13162D] border border-slate-200/60 dark:border-white/[0.05]"
      >
        <img
          src="/bg.png"
          alt=""
          role="presentation"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-40 dark:opacity-60 pointer-events-none"
        />
      </div>

      {/* Slide Images: Dynamically renders elegant white in white theme, keeping black untouched in dark theme */}
      {validImages.map((darkSrc, idx) => {
        const isActive = idx === currentIndex;
        const lightSrc =
          (lightImages && lightImages[idx]) ||
          LIGHT_IMAGE_MAP[darkSrc] ||
          darkSrc;
        const hasDistinctLight = lightSrc !== darkSrc;

        return (
          <div
            key={idx}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
            }`}
          >
            {hasDistinctLight ? (
              <>
                {/* Elegant White Theme Screenshot (Active in Light Mode) */}
                <img
                  src={lightSrc}
                  alt={`${title} preview screenshot (light) ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="z-10 object-contain max-h-full max-w-full p-2 transition-transform duration-500 group-hover/slider:scale-[1.02] block dark:hidden drop-shadow-xs"
                />
                {/* Original Black Theme Screenshot (Untouched in Dark Mode) */}
                <img
                  src={darkSrc}
                  alt={`${title} preview screenshot (dark) ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="z-10 object-contain max-h-full max-w-full p-2 transition-transform duration-500 group-hover/slider:scale-[1.02] hidden dark:block"
                />
              </>
            ) : (
              <img
                src={darkSrc}
                alt={`${title} preview screenshot ${idx + 1}`}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                className="z-10 object-contain max-h-full max-w-full p-2 transition-transform duration-500 group-hover/slider:scale-[1.02]"
              />
            )}
          </div>
        );
      })}

      {/* Manual Navigation Controls (Visible on hover / touch if multiple images) */}
      {hasMultiple && (
        <>
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous screenshot"
            className="absolute left-2.5 z-20 p-2.5 rounded-full bg-white/90 dark:bg-black/60 hover:bg-[#7C3AED] dark:hover:bg-[#7C3AED] text-slate-800 dark:text-white/80 hover:text-white dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-purple/50 backdrop-blur-md transition-all duration-200 opacity-0 group-hover/slider:opacity-100 focus:opacity-100 shadow-md cursor-pointer touch-manipulation"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next screenshot"
            className="absolute right-2.5 z-20 p-2.5 rounded-full bg-white/90 dark:bg-black/60 hover:bg-[#7C3AED] dark:hover:bg-[#7C3AED] text-slate-800 dark:text-white/80 hover:text-white dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-purple/50 backdrop-blur-md transition-all duration-200 opacity-0 group-hover/slider:opacity-100 focus:opacity-100 shadow-md cursor-pointer touch-manipulation"
          >
            <FaChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Bottom Dot Indicators */}
          <div
            className="absolute bottom-3 z-20 flex items-center gap-1.5 bg-white/85 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 transition-opacity duration-200 shadow-xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {validImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Jump to screenshot ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? "w-5 bg-[#7C3AED] dark:bg-[#CBACF9] shadow-xs shadow-purple-500/50"
                    : "w-1.5 bg-slate-400/50 dark:bg-white/40 hover:bg-slate-600 dark:hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* Auto-Slide Indicator Badge */}
          <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-full bg-white/85 dark:bg-black/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-[10px] font-mono text-slate-700 dark:text-white/70 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xs">
            {currentIndex + 1} / {validImages.length}
          </div>
        </>
      )}
    </div>
  );
};
