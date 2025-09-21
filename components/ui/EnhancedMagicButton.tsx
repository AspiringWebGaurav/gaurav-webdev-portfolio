"use client";

import React from "react";
import { EnhancedSpinners } from "../loading/EnhancedSpinners";

/**
 * Enhanced MagicButton with loading states
 * Preserves all original functionality while adding smooth loading feedback
 */
interface EnhancedMagicButtonProps {
  title: string;
  icon: React.ReactNode;
  position: string;
  handleClick?: () => void;
  otherClasses?: string;
  
  // New loading props
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
}

const EnhancedMagicButton: React.FC<EnhancedMagicButtonProps> = ({
  title,
  icon,
  position,
  handleClick,
  otherClasses,
  isLoading = false,
  loadingText,
  disabled = false
}) => {
  const isDisabled = disabled || isLoading;
  const displayText = isLoading && loadingText ? loadingText : title;
  const displayIcon = isLoading ? (
    <EnhancedSpinners.Circle size="sm" color="purple" className="text-white" />
  ) : icon;

  return (
    <button
      className={`relative inline-flex h-12 w-full md:w-60 md:mt-10 overflow-hidden rounded-lg p-[1px] focus:outline-none transition-all duration-300 ${
        isDisabled 
          ? 'opacity-70 cursor-not-allowed transform-none' 
          : 'hover:scale-[1.02] active:scale-[0.98]'
      }`}
      onClick={isDisabled ? undefined : handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={isLoading ? `${displayText} - Loading` : displayText}
    >
      {/* Animated border - slower when loading */}
      <span 
        className={`absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] ${
          isLoading 
            ? 'animate-[spin_3s_linear_infinite]' 
            : 'animate-[spin_2s_linear_infinite]'
        }`} 
      />

      {/* Button content */}
      <span
        className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg
             bg-slate-950 px-7 text-sm font-medium text-white backdrop-blur-3xl gap-2 transition-all duration-200 ${
               isLoading ? 'bg-slate-900' : ''
             } ${otherClasses}`}
      >
        {position === "left" && displayIcon}
        
        {/* Text with loading state */}
        <span className={`transition-all duration-200 ${isLoading ? 'text-purple-200' : ''}`}>
          {displayText}
        </span>
        
        {position === "right" && displayIcon}
      </span>

      {/* Loading overlay for extra visual feedback */}
      {isLoading && (
        <div className="absolute inset-[1px] rounded-lg bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-emerald-500/5 pointer-events-none" />
      )}
    </button>
  );
};

export default EnhancedMagicButton;