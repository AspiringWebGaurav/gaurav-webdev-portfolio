"use client";

import React, { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

/**
 * HorizontalScrollPanel - A reusable horizontal scrolling panel component
 *
 * Features:
 * - Smooth horizontal scrolling with mouse/touch
 * - Left/Right arrow navigation buttons that auto-show/hide
 * - Keyboard navigation support (Arrow Left/Right keys)
 * - Active state highlighting
 * - Responsive and mobile-friendly
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

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
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

  // Smooth scroll function
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scroll("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scroll("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={`bg-white border-b border-gray-200 relative ${className}`}>
      <div className="relative flex items-center w-full">
        {/* Left Gradient Overlay & Arrow - Dynamic Space */}
        <div
          className={`transition-all duration-300 flex items-center ${
            showLeftArrow ? "w-16" : "w-0"
          }`}
        >
          {showLeftArrow && (
            <div className="relative flex items-center h-full">
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none"></div>
              <button
                onClick={() => scroll("left")}
                className="relative z-10 ml-2 p-2.5 bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Scroll left"
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex-1 overflow-x-auto scrollbar-hide scroll-smooth py-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            className={`flex gap-2 transition-all duration-300 ${
              showLeftArrow ? "pl-2" : "pl-4"
            } ${showRightArrow ? "pr-2" : "pr-4"}`}
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => onOptionChange(option.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap relative ${
                  activeOption === option.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:shadow-sm"
                }`}
              >
                {/* Icon - render Lucide icon for recycle bin, emoji for others */}
                {option.icon === "recycleBin" ? (
                  <Trash2 className={`w-4 h-4 ${activeOption === option.id ? "text-white" : "text-gray-600"}`} />
                ) : (
                  <span className="text-base">{option.icon}</span>
                )}
                <span>{option.label}</span>
                {/* Badge for notifications */}
                {option.badge !== undefined && option.badge > 0 && (
                  <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold shadow-lg ${
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

        {/* Right Gradient Overlay & Arrow - Dynamic Space */}
        <div
          className={`transition-all duration-300 flex items-center ${
            showRightArrow ? "w-16" : "w-0"
          }`}
        >
          {showRightArrow && (
            <div className="relative flex items-center h-full">
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none"></div>
              <button
                onClick={() => scroll("right")}
                className="relative z-10 mr-2 p-2.5 bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Scroll right"
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
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
