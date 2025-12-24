/**
 * Environment Detection Utilities
 * 
 * Centralized environment detection for consistent behavior across components.
 * Used for maintenance mode, ban system, and other environment-specific features.
 */

/**
 * Check if running in production environment
 * Returns true for Vercel deployments or production builds
 */
export function isProduction(): boolean {
  // Server-side check
  if (typeof window === 'undefined') {
    return (
      process.env.NODE_ENV === 'production' ||
      !!process.env.VERCEL_URL
    );
  }
  
  // Client-side check
  const hostname = window.location.hostname;
  return (
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    !hostname.startsWith('192.168.') &&
    !hostname.startsWith('10.') &&
    !hostname.includes('.local')
  );
}

/**
 * Check if running on localhost
 * Returns true for local development environments
 */
export function isLocalhost(): boolean {
  // Server-side check
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  
  // Client-side check
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.includes('.local')
  );
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get environment name for display purposes
 */
export function getEnvironmentName(): string {
  if (isLocalhost()) return 'Localhost';
  if (isProduction()) return 'Production';
  return 'Unknown';
}
