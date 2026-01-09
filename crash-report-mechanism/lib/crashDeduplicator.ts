/**
 * Crash Deduplication
 * Prevents duplicate crash reports by generating unique error signatures
 */

import { getStackSignature } from "./crashClassifier";

/**
 * Generate error hash for deduplication
 * Same error signature = same hash = increment count instead of new report
 */
export function generateErrorHash(error: Error): string {
  const signature = createErrorSignature(error);
  return hashString(signature);
}

/**
 * Create error signature from error details
 * Signature is used to identify duplicate crashes
 */
function createErrorSignature(error: Error): string {
  const parts = [
    error.name || "Error",
    normalizeErrorMessage(error.message),
    getStackSignature(error.stack),
  ];

  return parts.join(":");
}

/**
 * Normalize error message to improve deduplication
 * Removes dynamic parts like IDs, timestamps, etc.
 */
function normalizeErrorMessage(message: string): string {
  let normalized = message;

  // Remove UUIDs
  normalized = normalized.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "UUID"
  );

  // Remove numbers that might be dynamic IDs
  normalized = normalized.replace(/\b\d{6,}\b/g, "ID");

  // Remove timestamps
  normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, "TIMESTAMP");

  // Remove URLs
  normalized = normalized.replace(/https?:\/\/[^\s]+/g, "URL");

  // Normalize whitespace
  normalized = normalized.trim().replace(/\s+/g, " ");

  return normalized;
}

/**
 * Simple string hashing function
 * Converts string to consistent hash value
 */
function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to base36 for shorter hash
  return Math.abs(hash).toString(36);
}

/**
 * Check if two errors are duplicates
 */
export function areErrorsDuplicate(error1: Error, error2: Error): boolean {
  const hash1 = generateErrorHash(error1);
  const hash2 = generateErrorHash(error2);
  return hash1 === hash2;
}

/**
 * Generate reference ID for display (more human-readable)
 * Format: CRASH-[first6chars]-[timestamp]
 */
export function generateReferenceId(errorHash: string): string {
  const shortHash = errorHash.substring(0, 6).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `CRASH-${shortHash}-${timestamp}`;
}
