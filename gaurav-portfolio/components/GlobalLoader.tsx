"use client";

import { useEffect, useState } from "react";

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
        {/* Loading Spinner */}
        <div className="mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-300 rounded-full animate-ping mx-auto"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-white">
          <p className="text-xl font-semibold mb-2">
            {message}
            {dots}
          </p>
          <p className="text-purple-300 text-sm">Preparing your contact form</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
