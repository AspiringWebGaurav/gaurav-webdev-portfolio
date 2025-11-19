/**
 * Enhanced Visitor Tracker Component
 * Client-side component that tracks all visitor activity
 * NO consent required - tracks everything automatically
 */

"use client";

import { useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

export default function EnhancedVisitorTracker() {
  const tracking = useVisitorTracking();

  // Track is handled automatically by the hook
  // This component just needs to exist to initialize tracking

  useEffect(() => {
    console.log("[EnhancedVisitorTracker] Initialized - tracking all visitor activity");
  }, []);

  return null; // Silent tracking - no UI
}
