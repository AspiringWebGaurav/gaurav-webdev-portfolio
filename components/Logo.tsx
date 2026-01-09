"use client";

import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  variant?: "default" | "static" | "small" | "admin";
  className?: string;
  onClick?: () => void;
}

export default function Logo({ 
  variant = "default", 
  className = "",
  onClick 
}: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const logoSrc = 
    variant === "admin" ? "/logos/logo-admin.svg" :
    variant === "static" ? "/logos/logo-static.svg" : 
    "/logos/logo.svg";
  const size = variant === "small" || variant === "admin" ? 40 : 80;

  return (
    <div
      className={`logo-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ 
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.3s ease",
        transform: isHovered && onClick ? "scale(1.05)" : "scale(1)"
      }}
    >
      <Image
        src={logoSrc}
        alt="Gaurav Patil Logo"
        width={size}
        height={size}
        priority={variant === "default"}
        className="logo-image"
      />
    </div>
  );
}
