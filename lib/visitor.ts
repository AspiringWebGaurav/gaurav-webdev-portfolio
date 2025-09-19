// lib/visitor.ts
// Visitor utility functions for Q&A system integration

import { 
  getOrCreateVisitorUUID, 
  getCurrentVisitorUUID,
  isValidUUID,
  getUUIDFromURL 
} from "@/utils/visitorTracking";

/**
 * Get or create a stable visitor UUID for Q&A system
 * Leverages existing visitor tracking system with enhanced persistence
 */
export function getOrCreateVisitorUuid(): string {
  return getOrCreateVisitorUUID();
}

/**
 * Get current visitor UUID, prioritizing URL-based UUID
 * Fallback to storage-based UUID if no URL UUID found
 */
export function getCurrentVisitorUuid(): string {
  return getCurrentVisitorUUID();
}

/**
 * Validate UUID format consistency
 */
export function validateUuidFormat(uuid: string): boolean {
  return isValidUUID(uuid);
}

/**
 * Extract UUID from current URL if present
 */
export function getUuidFromCurrentUrl(): string | null {
  return getUUIDFromURL();
}

/**
 * Cookie helper for UUID persistence
 * Sets a fallback cookie for UUID storage (30 days)
 */
export function setVisitorUuidCookie(uuid: string): void {
  if (typeof document === 'undefined') return;
  
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    document.cookie = `visitor_uuid=${uuid}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.warn('Failed to set UUID cookie:', error);
  }
}

/**
 * Get UUID from cookie as fallback
 */
export function getVisitorUuidFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('visitor_uuid='))
      ?.split('=')[1];
    
    return cookieValue && validateUuidFormat(cookieValue) ? cookieValue : null;
  } catch (error) {
    console.warn('Failed to get UUID from cookie:', error);
    return null;
  }
}

/**
 * Enhanced UUID retrieval with all fallback mechanisms
 * 1. URL UUID (priority)
 * 2. LocalStorage
 * 3. SessionStorage
 * 4. Cookie
 * 5. Generate new
 */
export function getVisitorUuidWithFallbacks(): string {
  // Try URL first
  const urlUuid = getUuidFromCurrentUrl();
  if (urlUuid) {
    // Store in other mechanisms for persistence
    setVisitorUuidCookie(urlUuid);
    return urlUuid;
  }

  // Try existing visitor tracking
  const existingUuid = getOrCreateVisitorUuid();
  
  // Set cookie for additional persistence
  setVisitorUuidCookie(existingUuid);
  
  return existingUuid;
}

/**
 * Clear all UUID storage (for testing or privacy)
 */
export function clearVisitorUuidStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    localStorage.removeItem('visitor_uuid');
    
    // Clear sessionStorage  
    sessionStorage.removeItem('visitor_uuid');
    
    // Clear cookie
    document.cookie = 'visitor_uuid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear session UUID from window
    if ((window as any).sessionUUID) {
      delete (window as any).sessionUUID;
    }
  } catch (error) {
    console.warn('Failed to clear UUID storage:', error);
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    sessionUUID?: string;
  }
}