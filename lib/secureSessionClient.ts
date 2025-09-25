// lib/secureSessionClient.ts
// Client-side secure session management with enterprise-grade security

import { v4 as uuidv4 } from 'uuid';

export interface ClientFingerprint {
  userAgent: string;
  acceptLanguage: string;
  screenResolution: string;
  timezone: string;
  platform: string;
  colorDepth: number;
  ipRange?: string;
}

export interface SecureSessionState {
  sessionToken: string | null;
  uuid: string | null;
  fingerprint: ClientFingerprint | null;
  expiresAt: number | null;
  isValid: boolean;
  lastValidation: number | null;
}

export interface SessionValidationResponse {
  success: boolean;
  valid?: boolean;
  uuid?: string;
  needsRenewal?: boolean;
  newToken?: string;
  error?: string;
  errorCode?: string;
}

export interface SessionGenerationResponse {
  success: boolean;
  sessionToken?: string;
  uuid?: string;
  expiresIn?: number;
  error?: string;
}

// Configuration constants
const SESSION_CLIENT_CONFIG = {
  STORAGE_KEY: 'secure_session_v2',
  UUID_STORAGE_KEY: 'visitor_uuid_persistent', // For ban system compatibility
  VALIDATION_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  RENEWAL_THRESHOLD_MS: 60 * 60 * 1000, // 1 hour
  MAX_RETRY_ATTEMPTS: 5, // More retries for network issues
  RETRY_DELAY_MS: 500, // Faster retries
  FINGERPRINT_CACHE_MS: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Enterprise-grade secure session client
 */
class SecureSessionClient {
  private sessionState: SecureSessionState = {
    sessionToken: null,
    uuid: null,
    fingerprint: null,
    expiresAt: null,
    isValid: false,
    lastValidation: null,
  };
  
  private validationInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private fingerprintCache: ClientFingerprint | null = null;
  private fingerprintCacheTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize session client
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing session from storage
      await this.loadSessionFromStorage();
      
      // Generate client fingerprint
      this.sessionState.fingerprint = await this.generateFingerprint();
      
      // Start validation interval if we have a session
      if (this.sessionState.sessionToken) {
        this.startValidationInterval();
      }
      
      this.isInitialized = true;
      console.log('[SecureSession] Client initialized');
    } catch (error) {
      console.error('[SecureSession] Initialization failed:', error);
      this.clearSession();
    }
  }

  /**
   * Generate comprehensive device fingerprint
   */
  private async generateFingerprint(): Promise<ClientFingerprint> {
    // Check cache first
    if (this.fingerprintCache && 
        Date.now() - this.fingerprintCacheTime < SESSION_CLIENT_CONFIG.FINGERPRINT_CACHE_MS) {
      return this.fingerprintCache;
    }

    try {
      const fingerprint: ClientFingerprint = {
        userAgent: navigator.userAgent,
        acceptLanguage: navigator.language || navigator.languages?.[0] || 'en-US',
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        colorDepth: screen.colorDepth,
      };

      // Cache the fingerprint
      this.fingerprintCache = fingerprint;
      this.fingerprintCacheTime = Date.now();

      return fingerprint;
    } catch (error) {
      console.error('[SecureSession] Fingerprint generation failed:', error);
      throw new Error('Failed to generate client fingerprint');
    }
  }

  /**
   * Request new session from server (preserves UUID for ban system)
   */
  async requestNewSession(preferredUUID?: string): Promise<boolean> {
    try {
      if (!this.sessionState.fingerprint) {
        this.sessionState.fingerprint = await this.generateFingerprint();
      }

      // Check if we can reuse existing UUID for ban system compatibility
      const existingUUID = preferredUUID || this.getStoredUUID();

      let response: SessionGenerationResponse;
      
      try {
        // Try secure endpoint first
        response = await this.makeRequest<SessionGenerationResponse>('/api/session/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fingerprint: this.sessionState.fingerprint,
            preferredUUID: existingUUID, // Send preferred UUID for ban system
          }),
        });
      } catch (error) {
        console.warn('[SecureSession] Secure endpoint failed, trying simple fallback:', error);
        
        // Fallback to simple endpoint
        response = await this.makeRequest<SessionGenerationResponse>('/api/session/simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fingerprint: this.sessionState.fingerprint,
            preferredUUID: existingUUID, // Send preferred UUID for ban system
          }),
        });
        
        console.log('[SecureSession] Using simple session fallback (temporarily)');
      }

      if (response.success && response.sessionToken && response.uuid) {
        this.sessionState = {
          sessionToken: response.sessionToken,
          uuid: response.uuid,
          fingerprint: this.sessionState.fingerprint,
          expiresAt: Date.now() + (response.expiresIn! * 1000),
          isValid: true,
          lastValidation: Date.now(),
        };

        await this.saveSessionToStorage();
        // Store UUID persistently for ban system
        this.storeUUIDPersistently(response.uuid);
        this.startValidationInterval();

        console.log('[SecureSession] Session created/renewed:', response.uuid);
        return true;
      } else {
        console.error('[SecureSession] Session generation failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('[SecureSession] Session request failed:', error);
      // Don't fail completely on network errors - allow retry
      if (error instanceof Error && error.message.includes('429')) {
        console.log('[SecureSession] Rate limited - will retry with backoff');
      }
      return false;
    }
  }

  /**
   * Validate current session with server
   */
  async validateSession(): Promise<boolean> {
    if (!this.sessionState.sessionToken || !this.sessionState.fingerprint) {
      return false;
    }

    try {
      const response = await this.makeRequest<SessionValidationResponse>('/api/session/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionState.sessionToken}`,
          'X-Client-Fingerprint': JSON.stringify(this.sessionState.fingerprint),
        },
        body: JSON.stringify({
          sessionToken: this.sessionState.sessionToken,
          fingerprint: this.sessionState.fingerprint,
        }),
      });

      if (response.success && response.valid && response.uuid) {
        // Update session state
        this.sessionState.isValid = true;
        this.sessionState.uuid = response.uuid;
        this.sessionState.lastValidation = Date.now();

        // Handle token renewal
        if (response.needsRenewal && response.newToken) {
          console.log('[SecureSession] Token renewed');
          this.sessionState.sessionToken = response.newToken;
          this.sessionState.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // Assume 24h expiry
          await this.saveSessionToStorage();
        }

        return true;
      } else {
        console.warn('[SecureSession] Session validation failed:', response.error);
        this.sessionState.isValid = false;
        
        // Clear invalid session
        if (response.errorCode === 'EXPIRED_TOKEN' || 
            response.errorCode === 'INVALID_SIGNATURE' ||
            response.errorCode === 'FINGERPRINT_MISMATCH') {
          await this.clearSession();
        }
        
        return false;
      }
    } catch (error) {
      console.error('[SecureSession] Validation request failed:', error);
      this.sessionState.isValid = false;
      return false;
    }
  }

  /**
   * Get current UUID (validates session if needed, preserves UUID for ban system)
   */
  async getValidUUID(urlUUID?: string): Promise<string | null> {
    // If we have a URL UUID, try to use it (for ban system compatibility)
    if (urlUUID) {
      const existingUUID = this.getStoredUUID();
      if (existingUUID === urlUUID) {
        // URL UUID matches stored UUID - validate or renew session
        if (this.sessionState.sessionToken && this.sessionState.isValid) {
          return urlUUID;
        }
        // Renew session with same UUID
        const success = await this.requestNewSession(urlUUID);
        return success ? this.sessionState.uuid : null;
      }
      // URL UUID doesn't match - this could be tampering or a different user
      // Don't automatically grant access, but preserve the stored UUID
    }

    // Check if we have a valid session
    if (!this.sessionState.sessionToken || !this.sessionState.isValid) {
      // Try to request new session with stored UUID
      const storedUUID = this.getStoredUUID();
      const success = await this.requestNewSession(storedUUID || undefined);
      return success ? this.sessionState.uuid : null;
    }

    // Check if session needs validation
    const needsValidation =
      !this.sessionState.lastValidation ||
      Date.now() - this.sessionState.lastValidation > SESSION_CLIENT_CONFIG.VALIDATION_INTERVAL_MS;

    if (needsValidation) {
      const isValid = await this.validateSession();
      if (!isValid) {
        // Session expired - renew with same UUID
        const storedUUID = this.getStoredUUID();
        const success = await this.requestNewSession(storedUUID || undefined);
        return success ? this.sessionState.uuid : null;
      }
    }

    return this.sessionState.uuid;
  }

  /**
   * Get session headers for API requests
   */
  async getSessionHeaders(): Promise<Record<string, string>> {
    const uuid = await this.getValidUUID();
    if (!uuid || !this.sessionState.sessionToken || !this.sessionState.fingerprint) {
      return {};
    }

    return {
      'Authorization': `Bearer ${this.sessionState.sessionToken}`,
      'X-Session-UUID': uuid,
      'X-Client-Fingerprint': JSON.stringify(this.sessionState.fingerprint),
    };
  }

  /**
   * Check if session is valid without server validation
   */
  isSessionValid(): boolean {
    return !!(
      this.sessionState.sessionToken &&
      this.sessionState.uuid &&
      this.sessionState.isValid &&
      this.sessionState.expiresAt &&
      this.sessionState.expiresAt > Date.now()
    );
  }

  /**
   * Clear session and cleanup
   */
  async clearSession(): Promise<void> {
    this.sessionState = {
      sessionToken: null,
      uuid: null,
      fingerprint: this.sessionState.fingerprint, // Keep fingerprint
      expiresAt: null,
      isValid: false,
      lastValidation: null,
    };

    this.stopValidationInterval();
    await this.clearStorage();
    
    console.log('[SecureSession] Session cleared');
  }

  /**
   * Save session to secure storage
   */
  private async saveSessionToStorage(): Promise<void> {
    try {
      const sessionData = {
        sessionToken: this.sessionState.sessionToken,
        uuid: this.sessionState.uuid,
        expiresAt: this.sessionState.expiresAt,
        lastValidation: this.sessionState.lastValidation,
        version: 2,
        timestamp: Date.now(),
      };

      // Use sessionStorage for security (cleared when browser closes)
      sessionStorage.setItem(SESSION_CLIENT_CONFIG.STORAGE_KEY, JSON.stringify(sessionData));
      
      console.log('[SecureSession] Session saved to storage');
    } catch (error) {
      console.warn('[SecureSession] Failed to save session:', error);
    }
  }

  /**
   * Load session from storage
   */
  private async loadSessionFromStorage(): Promise<void> {
    try {
      const stored = sessionStorage.getItem(SESSION_CLIENT_CONFIG.STORAGE_KEY);
      if (!stored) return;

      const sessionData = JSON.parse(stored);
      
      // Validate stored data structure and version
      if (sessionData.version !== 2 ||
          !sessionData.sessionToken ||
          !sessionData.uuid ||
          !sessionData.expiresAt) {
        await this.clearStorage();
        return;
      }

      // Check if session is expired - be more lenient for recent sessions
      const now = Date.now();
      const gracePeriod = 5 * 60 * 1000; // 5 minute grace period
      if (sessionData.expiresAt + gracePeriod < now) {
        await this.clearStorage();
        return;
      }

      // Restore session state
      this.sessionState.sessionToken = sessionData.sessionToken;
      this.sessionState.uuid = sessionData.uuid;
      this.sessionState.expiresAt = sessionData.expiresAt;
      this.sessionState.lastValidation = sessionData.lastValidation;
      this.sessionState.isValid = sessionData.expiresAt > now; // Only valid if not expired

      console.log('[SecureSession] Session loaded from storage:', sessionData.uuid);
    } catch (error) {
      console.warn('[SecureSession] Failed to load session:', error);
      await this.clearStorage();
    }
  }

  /**
   * Store UUID persistently for ban system compatibility
   */
  private storeUUIDPersistently(uuid: string): void {
    try {
      localStorage.setItem(SESSION_CLIENT_CONFIG.UUID_STORAGE_KEY, uuid);
      // Also store in the old key for compatibility
      localStorage.setItem('visitor_uuid', uuid);
    } catch (error) {
      console.warn('[SecureSession] Failed to store persistent UUID:', error);
    }
  }

  /**
   * Get stored UUID for ban system compatibility
   */
  private getStoredUUID(): string | null {
    try {
      // Try new key first, then fallback to old key
      return localStorage.getItem(SESSION_CLIENT_CONFIG.UUID_STORAGE_KEY) ||
             localStorage.getItem('visitor_uuid') ||
             null;
    } catch (error) {
      console.warn('[SecureSession] Failed to get stored UUID:', error);
      return null;
    }
  }

  /**
   * Clear session storage
   */
  private async clearStorage(): Promise<void> {
    try {
      sessionStorage.removeItem(SESSION_CLIENT_CONFIG.STORAGE_KEY);
      
      // Also clear any legacy storage keys
      localStorage.removeItem('visitor_uuid');
      sessionStorage.removeItem('visitor_uuid');
    } catch (error) {
      console.warn('[SecureSession] Failed to clear storage:', error);
    }
  }

  /**
   * Start periodic session validation
   */
  private startValidationInterval(): void {
    this.stopValidationInterval();
    
    this.validationInterval = setInterval(async () => {
      if (this.sessionState.sessionToken) {
        await this.validateSession();
      }
    }, SESSION_CLIENT_CONFIG.VALIDATION_INTERVAL_MS);
  }

  /**
   * Stop validation interval
   */
  private stopValidationInterval(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Make HTTP request with retry logic and better error handling
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= SESSION_CLIENT_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'User-Agent': navigator.userAgent,
          },
        });

        if (!response.ok) {
          // Special handling for rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : SESSION_CLIENT_CONFIG.RETRY_DELAY_MS * attempt * 2;
            
            if (attempt < SESSION_CLIENT_CONFIG.MAX_RETRY_ATTEMPTS) {
              console.log(`[SecureSession] Rate limited, retrying in ${delay}ms (attempt ${attempt})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < SESSION_CLIENT_CONFIG.MAX_RETRY_ATTEMPTS) {
          // Exponential backoff with jitter
          const delay = SESSION_CLIENT_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Get current session info for debugging
   */
  getSessionInfo(): Partial<SecureSessionState> {
    return {
      uuid: this.sessionState.uuid,
      isValid: this.sessionState.isValid,
      expiresAt: this.sessionState.expiresAt,
      lastValidation: this.sessionState.lastValidation,
    };
  }
}

// Export singleton instance
export const secureSessionClient = new SecureSessionClient();
export default secureSessionClient;