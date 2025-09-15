"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { getOrCreateVisitorUUID } from "@/utils/visitorTracking";
import { silentLogger, prodLogger } from '@/utils/secureLogger';

// UUID Redirect Handler Component
const UUIDRedirectHandler = () => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const handleRedirect = () => {
      try {
        // Check if we have a UUID in localStorage first (for returning visitors)
        let uuid = null;
        
        try {
          uuid = localStorage.getItem('visitor_uuid');
          if (uuid && !isValidUUID(uuid)) {
            uuid = null; // Invalid UUID, generate new one
          }
        } catch (error) {
          console.warn("localStorage not available:", error);
        }

        // If no valid UUID found, generate a new one
        if (!uuid) {
          uuid = uuidv4();
          
          // Try to store it for future visits
          try {
            localStorage.setItem('visitor_uuid', uuid);
            sessionStorage.setItem('visitor_uuid', uuid);
          } catch (error) {
            silentLogger.silent("Storage not available");
          }
        }

        silentLogger.silent("Redirecting to UUID-based route");
        
        // Redirect to UUID-based route
        router.replace(`/${uuid}`);
        
      } catch (error) {
        prodLogger.error("Error during UUID redirect", { error: error instanceof Error ? error.message : "Unknown error" });
        
        // Fallback: generate new UUID and redirect
        const fallbackUUID = uuidv4();
        router.replace(`/${fallbackUUID}`);
      }
    };

    // Small delay to ensure smooth transition
    const timer = setTimeout(handleRedirect, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  // UUID validation function
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  return (
    <div className="min-h-screen bg-black-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated loading spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animation-delay-150"></div>
        </div>

        {/* Loading text */}
        <div className="text-white text-lg font-medium mb-2">
          Initializing Portfolio
        </div>
        <div className="text-gray-400 text-sm">
          Setting up your personalized experience...
        </div>

        {/* Progress indicator */}
        <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// Root page component that handles redirection
const RootPage = () => {
  return <UUIDRedirectHandler />;
};

export default RootPage;
