/**
 * SERVER-SIDE SCHEDULER INITIALIZATION
 * 
 * This module initializes all scheduled tasks when the server starts.
 * 
 * TURBOPACK-SAFE: Refactored to avoid module-level side effects
 * 
 * IMPORTANT: This file exports a function that must be called explicitly
 * from server-side code (e.g., middleware or API routes), not imported
 * at module-level in layout.tsx
 */

import { initializeSecurityScheduler } from './securityScheduler';

// Track initialization to prevent duplicate runs
let initialized = false;

/**
 * Initialize all scheduled tasks
 * Safe to call multiple times - will only initialize once
 * 
 * @returns {boolean} true if initialization occurred, false if already initialized
 */
export function initializeSchedulers(): boolean {
  // Ensure we're in a server environment
  if (typeof window !== 'undefined') {
    console.warn('[SchedulerInit] Attempted to initialize schedulers in browser - skipping');
    return false;
  }

  // Prevent duplicate initialization
  if (initialized) {
    return false;
  }

  initialized = true;
  console.log("🚀 Initializing server schedulers...");

  // Initialize security monitoring scheduler
  // Replaces: Vercel Cron -> /api/auth/security-cron (every minute)
  initializeSecurityScheduler();

  console.log("✅ All schedulers initialized successfully");
  return true;
}

/**
 * Check if schedulers are initialized
 */
export function isSchedulersInitialized(): boolean {
  return initialized;
}

export default initializeSchedulers;
