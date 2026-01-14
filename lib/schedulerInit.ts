/**
 * SERVER-SIDE SCHEDULER INITIALIZATION
 * 
 * This module initializes all scheduled tasks when the server starts.
 * It ensures tasks run within the server process lifecycle, eliminating
 * the need for external cron services.
 * 
 * IMPORTANT: This file is imported in the root layout to guarantee
 * initialization occurs exactly once at server startup.
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

// Auto-initialize when module is imported
// This ensures schedulers start as soon as the server process begins
initializeSchedulers();

export default initializeSchedulers;
