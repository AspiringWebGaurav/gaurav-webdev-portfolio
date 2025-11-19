"use client";

import React, { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

/**
 * HorizontalScrollPanel (Mobile) - Mobile-optimized horizontal scrolling panel
 *
 * Mobile-specific features:
 * - Touch-friendly larger tap targets
 * - Swipe gesture support
 * - Simplified arrows for smaller screens
 * - Optimized spacing for mobile viewports
 * - Smoother animations for touch devices
 * - Better visual feedback on touch
 *
 * @example
 * ```tsx
 * const options = [
 *   { id: "option1", label: "Option 1", icon: "📁" },
 *   { id: "option2", label: "Option 2", icon: "🌐" },
 * ];
 *
 * <HorizontalScrollPanel
 *   options={options}
 *   activeOption={selectedOption}
 *   onOptionChange={setSelectedOption}
 * />
 * ```
 */

export interface PanelOption {
  id: string;
  label: string;
  icon: string;
  badge?: number; // Optional badge count
}

interface HorizontalScrollPanelProps {
  options: PanelOption[];
  activeOption: string;
  onOptionChange: (optionId: string) => void;
  className?: string;
}

export default function HorizontalScrollPanel({
  options,
  activeOption,
  onOptionChange,
  className = "",
}: HorizontalScrollPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Initial check and resize listener
  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  // Recheck when options change
  useEffect(() => {
    checkScroll();
  }, [options]);

  // Smooth scroll function - optimized for mobile
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 150; // Smaller scroll for mobile
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Touch gesture support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0 && showRightArrow) {
        scroll("right");
      } else if (diff < 0 && showLeftArrow) {
        scroll("left");
      }
      setTouchStart(0);
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 relative ${className}`}>
      <div className="relative flex items-center w-full">
        {/* Left Arrow - Mobile Optimized */}
        <div
          className={`transition-all duration-300 flex items-center ${
            showLeftArrow ? "w-12" : "w-0"
          }`}
        >
          {showLeftArrow && (
            <div className="relative flex items-center h-full">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none"></div>
              <button
                onClick={() => scroll("left")}
                className="relative z-10 ml-1 p-2 bg-white border border-gray-300 hover:border-blue-500 active:bg-blue-50 rounded-full shadow-md transition-all duration-200 active:scale-95"
                aria-label="Scroll left"
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Container - Touch Optimized */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setTouchStart(0)}
          className="flex-1 overflow-x-auto scrollbar-hide scroll-smooth py-3"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          }}
        >
          <div
            className={`flex gap-2 transition-all duration-300 ${
              showLeftArrow ? "pl-1" : "pl-3"
            } ${showRightArrow ? "pr-1" : "pr-3"}`}
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => onOptionChange(option.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-medium whitespace-nowrap active:scale-95 relative ${
                  activeOption === option.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-gray-100 text-gray-700 active:bg-gray-200"
                }`}
              >
                {/* Icon - render Lucide icon for recycle bin, emoji for others */}
                {option.icon === "recycleBin" ? (
                  <Trash2 className={`w-3.5 h-3.5 ${activeOption === option.id ? "text-white" : "text-gray-600"}`} />
                ) : (
                  <span className="text-sm">{option.icon}</span>
                )}
                <span>{option.label}</span>
                {/* Badge for notifications */}
                {option.badge !== undefined && option.badge > 0 && (
                  <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold shadow-lg ${
                    activeOption === option.id
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-red-500 text-white animate-pulse"
                  }`}>
                    {option.badge > 99 ? '99+' : option.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Arrow - Mobile Optimized */}
        <div
          className={`transition-all duration-300 flex items-center ${
            showRightArrow ? "w-12" : "w-0"
          }`}
        >
          {showRightArrow && (
            <div className="relative flex items-center h-full">
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none"></div>
              <button
                onClick={() => scroll("right")}
                className="relative z-10 mr-1 p-2 bg-white border border-gray-300 hover:border-blue-500 active:bg-blue-50 rounded-full shadow-md transition-all duration-200 active:scale-95"
                aria-label="Scroll right"
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hide scrollbar style */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
