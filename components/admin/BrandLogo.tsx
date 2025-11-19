import React from "react";

export default function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaurav Portfolio Admin"
      style={{ display: "block" }}
    >
      {/* Modern shield-like background with gradient */}
      <rect width="48" height="48" rx="12" fill="url(#portfolioGradient)" />

      {/* Stylized 'G' for Gaurav */}
      <path
        d="M24 12C17.4 12 12 17.4 12 24C12 30.6 17.4 36 24 36C27.3 36 30.3 34.5 32.4 32.1L28.8 28.5C27.6 29.7 25.9 30.5 24 30.5C20.4 30.5 17.5 27.6 17.5 24C17.5 20.4 20.4 17.5 24 17.5C25.9 17.5 27.6 18.3 28.8 19.5L32.4 15.9C30.3 13.5 27.3 12 24 12Z"
        fill="white"
        opacity="0.95"
      />

      {/* Portfolio indicator - abstract geometric shapes */}
      <rect
        x="26"
        y="22"
        width="8"
        height="2"
        rx="1"
        fill="white"
        opacity="0.9"
      />
      <rect
        x="26"
        y="26"
        width="6"
        height="2"
        rx="1"
        fill="white"
        opacity="0.75"
      />
      <rect
        x="26"
        y="30"
        width="4"
        height="2"
        rx="1"
        fill="white"
        opacity="0.6"
      />

      <defs>
        <linearGradient
          id="portfolioGradient"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
