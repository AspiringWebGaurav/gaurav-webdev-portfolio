/**
 * SERVER-SIDE SCHEDULER INITIALIZATION - DEPRECATED
 * 
 * This file is kept for backwards compatibility but should not be imported directly
 * in layout.tsx or other files that are processed during build.
 * 
 * Use lib/schedulerInit.server.ts instead for Turbopack-safe initialization.
 * 
 * TURBOPACK WARNING: This file has module-level side effects and may cause
 * build issues with Turbopack.
 * 
 * @deprecated Use lib/schedulerInit.server.ts or initialize via middleware/API route
 */

import { initializeSecurityScheduler } from './securityScheduler';

// Track initialization to prevent duplicate runs
let initialized = false;

/**
 * Initialize all scheduled tasks
 * Safe to call multiple times - will only initialize once
 */
export function initializeSchedulers(): void {
  // Ensure we're in a server environment
  if (typeof window !== 'undefined') {
    return; // Skip in browser
  }

  // Prevent duplicate initialization
  if (initialized) {
    return;
  }

  initialized = true;
  console.log("🚀 Initializing server schedulers...");

  // Initialize security monitoring scheduler
  // Replaces: Vercel Cron -> /api/auth/security-cron (every minute)
  initializeSecurityScheduler();

  console.log("✅ All schedulers initialized successfully");
}

// TURBOPACK WARNING: Module-level side effect
// This is executed at import time, which can cause issues with Turbopack
// Server schedulers should be initialized in middleware or API routes, not layout.tsx
