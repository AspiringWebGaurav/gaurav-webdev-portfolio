"use client";

import { useEffect, useState } from "react";
import { EnhancedSpinners } from "./loading/EnhancedSpinners";

interface GlobalLoaderProps {
  isOpen: boolean;
  message?: string;
}

const GlobalLoader = ({
  isOpen,
  message = "Loading form...",
}: GlobalLoaderProps) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="text-center">
        {/* Enhanced Loading Spinner */}
        <div className="mb-6">
          <EnhancedSpinners.DualRing size="xl" color="gradient" />
        </div>

        {/* Loading Text with dots animation */}
        <div className="text-white">
          <p className="text-xl font-semibold mb-2">
            {message}
            {dots}
          </p>
          <p className="text-purple-300 text-sm">Preparing your contact form</p>
        </div>

        {/* Additional visual feedback */}
        <div className="mt-4 flex justify-center">
          <EnhancedSpinners.Dots size="sm" color="purple" />
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
