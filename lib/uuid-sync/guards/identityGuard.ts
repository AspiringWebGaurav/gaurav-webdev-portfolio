/**
 * Identity Creation Guard - Enterprise Level Protection
 * 
 * Prevents accidental duplicate identity creation by:
 * 1. Tracking all identity creation attempts
 * 2. Detecting multiple creations for same fingerprint
 * 3. Logging violations for debugging
 * 4. Enforcing single-creation policy
 */

interface IdentityCreationRecord {
  fingerprint: string;
  mask: string;
  timestamp: number;
  source: string; // Where it was created (BubbleSessionContext, API, etc.)
}

class IdentityGuard {
  private creationHistory: Map<string, IdentityCreationRecord[]> = new Map();
  private readonly MAX_HISTORY = 100; // Keep last 100 fingerprints
  private readonly DUPLICATE_WINDOW_MS = 60000; // 1 minute window

  /**
   * Register an identity creation attempt
   * Returns true if allowed, false if duplicate detected
   */
  registerCreation(fingerprint: string, mask: string, source: string): boolean {
    const now = Date.now();
    
    // Get existing records for this fingerprint
    const existing = this.creationHistory.get(fingerprint) || [];
    
    // Check for duplicates in recent window
    const recentDuplicates = existing.filter(
      record => now - record.timestamp < this.DUPLICATE_WINDOW_MS
    );
    
    if (recentDuplicates.length > 0) {
      logger.error('🚨 [Identity Guard] DUPLICATE CREATION DETECTED!', {
        fingerprint: fingerprint.substring(0, 20),
        existingMask: recentDuplicates[0].mask,
        existingSource: recentDuplicates[0].source,
        newMask: mask,
        newSource: source,
        timeSinceFirst: `${Math.round((now - recentDuplicates[0].timestamp) / 1000)}s ago`,
      });
      
      // Return false to indicate duplicate (but don't throw - log for debugging)
      return false;
    }
    
    // Register this creation
    existing.push({ fingerprint, mask, timestamp: now, source });
    this.creationHistory.set(fingerprint, existing);
    
    // Cleanup old entries
    this.cleanup();
    
    logger.debug('✅ [Identity Guard] New identity registered', {
      fingerprint: fingerprint.substring(0, 20),
      mask,
      source,
    });
    
    return true;
  }

  /**
   * Check if fingerprint already has an identity
   */
  hasIdentity(fingerprint: string): boolean {
    const existing = this.creationHistory.get(fingerprint) || [];
    const now = Date.now();
    
    return existing.some(
      record => now - record.timestamp < this.DUPLICATE_WINDOW_MS
    );
  }

  /**
   * Get existing mask for fingerprint
   */
  getExistingMask(fingerprint: string): string | null {
    const existing = this.creationHistory.get(fingerprint) || [];
    const now = Date.now();
    
    const recent = existing.find(
      record => now - record.timestamp < this.DUPLICATE_WINDOW_MS
    );
    
    return recent ? recent.mask : null;
  }

  /**
   * Get creation statistics for debugging
   */
  getStats() {
    const now = Date.now();
    const recentCreations = Array.from(this.creationHistory.values())
      .flat()
      .filter(record => now - record.timestamp < this.DUPLICATE_WINDOW_MS);
    
    const sourceBreakdown = recentCreations.reduce((acc, record) => {
      acc[record.source] = (acc[record.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalRecent: recentCreations.length,
      totalFingerprints: this.creationHistory.size,
      sourceBreakdown,
    };
  }

  /**
   * Cleanup old entries to prevent memory leaks
   */
  private cleanup() {
    if (this.creationHistory.size <= this.MAX_HISTORY) {
      return;
    }
    
    // Remove oldest entries
    const sortedEntries = Array.from(this.creationHistory.entries())
      .map(([fingerprint, records]) => ({
        fingerprint,
        oldestTimestamp: Math.min(...records.map(r => r.timestamp)),
      }))
      .sort((a, b) => a.oldestTimestamp - b.oldestTimestamp);
    
    const toRemove = sortedEntries.slice(0, sortedEntries.length - this.MAX_HISTORY);
    toRemove.forEach(entry => this.creationHistory.delete(entry.fingerprint));
  }

  /**
   * Clear all history (for testing)
   */
  reset() {
    this.creationHistory.clear();
  }
}

// Singleton instance
export const identityGuard = new IdentityGuard();
