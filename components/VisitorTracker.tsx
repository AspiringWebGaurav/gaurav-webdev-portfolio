/**
 * Visitor Tracking Component
 * Auto-tracks page views and session events
 */

"use client";

import { useVisitorTracking } from "@/lib/useVisitorTracking";

export default function VisitorTracker() {
  // This hook automatically tracks page views and session events
  useVisitorTracking();
  
  return null; // This component renders nothing
}
