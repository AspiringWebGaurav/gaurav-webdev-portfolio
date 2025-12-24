/**
 * Verification Badge - Non-blocking security indicator
 * Shows verification status in corner (doesn't block content)
 * Auto-hides after successful verification
 */

"use client";

import { useEffect, useState } from "react";

interface VerificationBadgeProps {
  status: "checking" | "verified" | "hidden";
}

export default function VerificationBadge({ status }: VerificationBadgeProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after verification completes
    if (status === "verified") {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000); // Show "Verified ✓" for 2 seconds then fade out

      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === "hidden" || !visible) {
    return null;
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 
        px-4 py-2 rounded-lg 
        bg-black-200 border border-purple/20
        shadow-lg backdrop-blur-sm
        transition-all duration-300
        ${!visible ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
      `}
    >
      <div className="flex items-center gap-2 text-sm">
        {status === "checking" && (
          <>
            <div className="w-3 h-3 border-2 border-purple border-t-transparent rounded-full animate-spin" />
            <span className="text-white-100">Verifying...</span>
          </>
        )}
        {status === "verified" && (
          <>
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-white-100">Verified</span>
          </>
        )}
      </div>
    </div>
  );
}
