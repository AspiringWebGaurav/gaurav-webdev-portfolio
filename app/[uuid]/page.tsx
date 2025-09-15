"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import EnhancedBanGate from "@/components/EnhancedBanGate";
import VisitorTracker from "@/components/VisitorTracker";
import EnhancedVisitorStatusWatcher from "@/components/EnhancedVisitorStatusWatcher";
import { VisitorTrackingNotice } from "@/components/VisitorTracker";
import Hero from "@/components/Hero";
import { FloatingNav } from "../../components/ui/FloatingNav";
import { navItems } from "@/data";
import Grid from "@/components/Grid";
import RecentProjects from "@/components/RecentProjects";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";
import EnterpriseAIAssistant from "@/components/ai-assistant/enhanced/EnterpriseAIAssistant";
import AIErrorBoundary from "@/components/ai-assistant/AIErrorBoundary";
import { silentLogger, prodLogger } from '@/utils/secureLogger';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-100">
      <div className="flex flex-col items-center space-y-6">
        {/* Main circular loader */}
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>

          {/* Progress circle */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">Loading</div>
            </div>
          </div>
        </div>

        {/* Loading text with dots animation */}
        <div className="flex items-center space-x-1">
          <span className="text-lg text-gray-300">Preparing portfolio</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-80 h-1 bg-gray-700/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Go to Top Button Component
const GoToTopButton = ({ hideWhenAIOpen }: { hideWhenAIOpen: boolean }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px and AI Assistant is not open
      if (window.pageYOffset > 300 && !hideWhenAIOpen) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    // Also check visibility when hideWhenAIOpen changes
    toggleVisibility();
    
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [hideWhenAIOpen]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-2 sm:bottom-6 sm:right-2 md:bottom-20 md:right-12 z-30 group"
      aria-label="Go to top"
    >
      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-emerald-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>

      {/* Main button */}
      <div className="relative w-14 h-14 bg-black-100/80 backdrop-blur-md border border-white/[0.2] rounded-full flex items-center justify-center group-hover:bg-black-100/90 transition-all duration-300 hover:scale-110">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-[1px]">
          <div className="w-full h-full bg-black-100 rounded-full"></div>
        </div>

        {/* Arrow icon */}
        <svg
          className="relative z-10 w-6 h-6 text-white group-hover:text-cyan-400 transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </div>
    </button>
  );
};

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const UUIDPortfolioPage = () => {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [currentUUID, setCurrentUUID] = useState<string>("");
  
  // AI Assistant state tracking
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  useEffect(() => {
    const validateAndSetUUID = () => {
      const urlUUID = params.uuid as string;
      
      silentLogger.silent("URL UUID received");

      // Validate UUID format
      if (!urlUUID || !isValidUUID(urlUUID)) {
        silentLogger.silent("Invalid UUID in URL, generating new one");
        const newUUID = uuidv4();
        router.replace(`/${newUUID}`);
        return;
      }

      // Set the UUID for the session
      setCurrentUUID(urlUUID);
      
      // Store in localStorage for persistence (fallback)
      try {
        localStorage.setItem('visitor_uuid', urlUUID);
        sessionStorage.setItem('visitor_uuid', urlUUID);
      } catch (error) {
        silentLogger.silent("Storage not available");
      }

      setIsValidating(false);
      silentLogger.silent("UUID validated and set");
    };

    validateAndSetUUID();
  }, [params.uuid, router]);

  useEffect(() => {
    if (!isValidating) {
      // Simulate loading time (reduced for testing)
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // 0.5 seconds loading time

      return () => clearTimeout(timer);
    }
  }, [isValidating]);

  // Show loading while validating UUID
  if (isValidating) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Validating access...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedBanGate uuid={currentUUID}>
      <main className="relative bg-black-100 flex justify-center items-center flex-col overflow-hidden mx-auto sm:px-10 px-5">
        {/* Enhanced Visitor Tracking System with UUID */}
        <VisitorTracker uuid={currentUUID} />
        <EnhancedVisitorStatusWatcher uuid={currentUUID} />
        <VisitorTrackingNotice />
        
        {isLoading && <UniquePortfolioLoader />}

        <div
          className={`max-w-7xl w-full transition-all duration-1000 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        >
          <FloatingNav
            navItems={navItems}
            hideWhenAIOpen={isAIAssistantOpen}
          />
          <Hero />
          <Grid />
          <RecentProjects />
          <Clients />
          <Experience />
          <Approach />
          <Footer />
        </div>

        {/* Go to Top Button */}
        {!isLoading && <GoToTopButton hideWhenAIOpen={isAIAssistantOpen} />}

        {/* Enhanced AI Assistant with System Isolation and Error Boundary */}
        <AIErrorBoundary
          onError={(error, errorInfo) => {
            console.error('AI Assistant Error:', error);
            console.error('Error Info:', errorInfo);
          }}
        >
          <EnterpriseAIAssistant
            isPortfolioLoaded={!isLoading}
            onAssistantStateChange={(state) => {
              // Handle assistant state changes for navbar visibility
              console.log('Enhanced Assistant state changed:', state);
              setIsAIAssistantOpen(state.isVisible && !state.isMinimized);
            }}
          />
        </AIErrorBoundary>
      </main>
    </EnhancedBanGate>
  );
};

export default UUIDPortfolioPage;