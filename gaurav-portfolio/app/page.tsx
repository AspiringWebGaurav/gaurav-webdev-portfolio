"use client";

import React, { useState, useEffect } from "react";
import BanGate from "@/components/BanGate";
import Hero from "@/components/Hero";
import { FloatingNav } from "../components/ui/FloatingNav";
import { navItems } from "@/data";
import Grid from "@/components/Grid";
import RecentProjects from "@/components/RecentProjects";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";
import VisitorStatusWatcher from "@/components/VisitorStatusWatcher";

// Unique Circular Loader Component
const UniquePortfolioLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // More controlled increment to ensure steady progress
        const increment = Math.random() * 8 + 2; // Random between 2-10
        const newProgress = Math.min(prev + increment, 100);

        // Clear interval when reaching 100%
        if (newProgress >= 100) {
          clearInterval(interval);
        }

        return newProgress;
      });
    }, 150); // Slightly slower for better control

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Transparent background with subtle pattern */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
        }}
      />

      {/* Unique Circular Loader Container */}
      <div className="relative flex flex-col items-center">
        {/* Main circular loader */}
        <div className="relative w-24 h-24">
          {/* Outer ring with pulse effect */}
          <div className="absolute inset-0 border-4 border-gray-200/30 rounded-full animate-pulse" />

          {/* Progress ring */}
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner spinning dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin"
              style={{ animationDuration: "2s" }}
            />
          </div>
        </div>

        {/* Loading text with typewriter effect */}
        <div className="mt-6 text-center">
          <div className="text-white/80 text-lg font-medium mb-2">
            Loading Portfolio
            <span className="animate-pulse">...</span>
          </div>
          <div className="text-white/60 text-sm">
            {Math.round(progress)}% Complete
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-bounce"
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [showPortfolio, setShowPortfolio] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Controlled increment for steady progress
        const increment = Math.random() * 8 + 2; // Random between 2-10
        const newProgress = Math.min(prev + increment, 100);

        // Only show portfolio when progress reaches exactly 100%
        if (newProgress >= 100 && !showPortfolio) {
          // Small delay for smooth transition
          setTimeout(() => setShowPortfolio(true), 800);
          clearInterval(interval);
        }

        return newProgress;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [showPortfolio]);

  // Show loader until progress is 100% AND showPortfolio is true
  if (progress < 100 || !showPortfolio) {
    return <UniquePortfolioLoader />;
  }

  // Portfolio content - only renders after loader completes
  return (
    <main
      className="relative bg-black-100 flex justify-center items-center flex-col overflow-hidden mx-auto sm:px-10 px-5 animate-fadeIn"
      style={{ minHeight: "100vh" }}
    >
      <div className="max-w-7xl w-full">
        <FloatingNav navItems={navItems} />
        <Hero />
        <Grid />
        <RecentProjects />
        <Clients />
        <Experience />
        <Approach />
        <Footer />
      </div>
      {/* <BanGate />
      <VisitorStatusWatcher /> */}
    </main>
  );
}
