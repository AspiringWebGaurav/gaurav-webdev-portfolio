/**
 * MicroSpinner Component — Minimal Google-style initial loader
 * 
 * Shows a clean, small, centered spinner that auto-fades after ~1s.
 * No text, no branding, no blocking overlay.
 * Removes itself from DOM after animation completes.
 * 
 * Uses inline CSS keyframes — no external stylesheet needed.
 */

"use client";

import { useState, useEffect } from "react";

export default function MicroSpinner() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Auto-remove after fade completes (800ms fade + 200ms buffer)
        const timer = setTimeout(() => {
            setVisible(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <>
            <style jsx>{`
        @keyframes microSpinnerFadeOut {
          0% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes microSpinnerRotate {
          to { transform: rotate(360deg); }
        }
        .micro-spinner-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          animation: microSpinnerFadeOut 1s ease-out forwards;
        }
        .micro-spinner-ring {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(203, 172, 249, 0.15);
          border-top-color: rgba(203, 172, 249, 0.8);
          border-radius: 50%;
          animation: microSpinnerRotate 0.7s linear infinite;
        }
      `}</style>
            <div className="micro-spinner-overlay">
                <div className="micro-spinner-ring" />
            </div>
        </>
    );
}
