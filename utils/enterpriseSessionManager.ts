/**
 * Enterprise Session State Management for Mobile Browsers
 * Handles session persistence across redirects and page reloads
 * Optimized for Samsung S9 Plus and other mobile browsers
 */

import { silentLogger, prodLogger } from './secureLogger';

interface SessionData {
  [key: string]: any;
}

interface SessionOptions {
  persistent?: boolean;
  encrypted?: boolean;
  expireTime?: number; // in milliseconds
  crossDomain?: boolean;
  fallbackStorage?: boolean;
}

interface StorageResult {
  success: boolean;
  method: StorageMethod;
  error?: string;
}

enum StorageMethod {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  COOKIE = 'cookie',
  INDEXED_DB = 'indexedDB',
  MEMORY = 'memory'
}

export class EnterpriseSessionManager {
  private static instance: EnterpriseSessionManager;
  private memoryStore: Map<string, { data: any; expires?: number }> = new Map();
  private storageCapabilities: { [key in StorageMethod]: boolean } = {
    [StorageMethod.LOCAL_STORAGE]: false,
    [StorageMethod.SESSION_STORAGE]: false,
    [StorageMethod.COOKIE]: false,
    [StorageMethod.INDEXED_DB]: false,
    [StorageMethod.MEMORY]: true
  };

  private constructor() {
    this.detectStorageCapabilities();
    this.setupStorageEventListeners();
    silentLogger.silent("Enterprise session manager initialized", {
      capabilities: this.storageCapabilities
    });
  }

  public static getInstance(): EnterpriseSessionManager {
    if (!EnterpriseSessionManager.instance) {
      EnterpriseSessionManager.instance = new EnterpriseSessionManager();
    }
    return EnterpriseSessionManager.instance;
  }

  /**
   * Store session data with multiple fallback mechanisms
   */
  public async setSession(
    key: string, 
    data: SessionData, 
    options: SessionOptions = {}
  ): Promise<StorageResult> {
    const defaultOptions: SessionOptions = {
      persistent: false,
      encrypted: false,
      expireTime: 30 * 60 * 1000, // 30 minutes default
      crossDomain: false,
      fallbackStorage: true,
      ...options
    };

    const storageOrder = this.getOptimalStorageOrder(defaultOptions.persistent || false);
    
    for (const method of storageOrder) {
      if (!this.storageCapabilities[method]) continue;

      try {
        const result = await this.storeWithMethod(method, key, data, defaultOptions);
        if (result.success) {
          silentLogger.silent(`Session stored successfully with ${method}`, { 
            key: this.sanitizeKey(key) 
          });
          return result;
        }
      } catch (error) {
        silentLogger.silent(`Storage method ${method} failed`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          key: this.sanitizeKey(key)
        });
      }
    }

    // All methods failed
    prodLogger.error("All session storage methods failed", { 
      key: this.sanitizeKey(key),
      capabilities: this.storageCapabilities
    });
    
    return {
      success: false,
      method: StorageMethod.MEMORY,
      error: "All storage methods failed"
    };
  }

  /**
   * Retrieve session data with fallback mechanisms
   */
  public async getSession(key: string): Promise<SessionData | null> {
    const storageOrder = [
      StorageMethod.LOCAL_STORAGE,
      StorageMethod.SESSION_STORAGE,
      StorageMethod.INDEXED_DB,
      StorageMethod.COOKIE,
      StorageMethod.MEMORY
    ];

    for (const method of storageOrder) {
      if (!this.storageCapabilities[method]) continue;

      try {
        const data = await this.retrieveWithMethod(method, key);
        if (data !== null) {
          silentLogger.silent(`Session retrieved with ${method}`, { 
            key: this.sanitizeKey(key) 
          });
          return data;
        }
      } catch (error) {
        silentLogger.silent(`Retrieval method ${method} failed`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          key: this.sanitizeKey(key)
        });
      }
    }

    return null;
  }

  /**
   * Store ban/unban session state
   */
  public async setBanState(uuid: string, state: 'banned' | 'unbanned' | 'checking'): Promise<void> {
    const sessionKey = `ban_state_${uuid}`;
    const data = {
      state,
      timestamp: Date.now(),
      uuid,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    await this.setSession(sessionKey, data, {
      persistent: true,
      expireTime: 60 * 60 * 1000 // 1 hour
    });
  }

  /**
   * Get ban/unban session state
   */
  public async getBanState(uuid: string): Promise<{ state: string; timestamp: number } | null> {
    const sessionKey = `ban_state_${uuid}`;
    const data = await this.getSession(sessionKey);
    
    if (data && data.state && data.timestamp) {
      // Check if data is not expired (1 hour)
      if (Date.now() - data.timestamp < 60 * 60 * 1000) {
        return { state: data.state, timestamp: data.timestamp };
      } else {
        // Clean up expired data
        this.clearSession(sessionKey);
      }
    }
    
    return null;
  }

  /**
   * Store redirect state for mobile browsers
   */
  public async setRedirectState(uuid: string, targetUrl: string, reason?: string): Promise<void> {
    const sessionKey = `redirect_state_${uuid}`;
    const data = {
      targetUrl,
      reason: reason || 'unban',
      timestamp: Date.now(),
      attempts: 0,
      uuid
    };

    await this.setSession(sessionKey, data, {
      persistent: false, // Use session storage for redirects
      expireTime: 10 * 60 * 1000 // 10 minutes
    });
  }

  /**
   * Get and consume redirect state
   */
  public async getAndConsumeRedirectState(uuid: string): Promise<{ targetUrl: string; reason: string } | null> {
    const sessionKey = `redirect_state_${uuid}`;
    const data = await this.getSession(sessionKey);
    
    if (data && data.targetUrl && data.timestamp) {
      // Check if data is not expired (10 minutes)
      if (Date.now() - data.timestamp < 10 * 60 * 1000) {
        // Clear the redirect state after consumption
        this.clearSession(sessionKey);
        return { targetUrl: data.targetUrl, reason: data.reason || 'unban' };
      } else {
        // Clean up expired data
        this.clearSession(sessionKey);
      }
    }
    
    return null;
  }

  /**
   * Store unban completion state
   */
  public async setUnbanCompletionState(uuid: string): Promise<void> {
    const sessionKey = `unban_completed_${uuid}`;
    const data = {
      completed: true,
      timestamp: Date.now(),
      uuid
    };

    await this.setSession(sessionKey, data, {
      persistent: true,
      expireTime: 5 * 60 * 1000 // 5 minutes
    });
  }

  /**
   * Check if unban was recently completed
   */
  public async wasRecentlyUnbanned(uuid: string): Promise<boolean> {
    const sessionKey = `unban_completed_${uuid}`;
    const data = await this.getSession(sessionKey);
    
    if (data && data.completed && data.timestamp) {
      // Check if completion was within last 5 minutes
      return Date.now() - data.timestamp < 5 * 60 * 1000;
    }
    
    return false;
  }

  /**
   * Clear session data
   */
  public async clearSession(key: string): Promise<void> {
    const storageOrder = [
      StorageMethod.LOCAL_STORAGE,
      StorageMethod.SESSION_STORAGE,
      StorageMethod.INDEXED_DB,
      StorageMethod.COOKIE,
      StorageMethod.MEMORY
    ];

    for (const method of storageOrder) {
      if (!this.storageCapabilities[method]) continue;

      try {
        await this.clearWithMethod(method, key);
      } catch (error) {
        // Silent cleanup, don't log errors
      }
    }
  }

  /**
   * Store data with specific method
   */
  private async storeWithMethod(
    method: StorageMethod, 
    key: string, 
    data: SessionData, 
    options: SessionOptions
  ): Promise<StorageResult> {
    const serializedData = JSON.stringify({
      data,
      timestamp: Date.now(),
      expires: options.expireTime ? Date.now() + options.expireTime : undefined
    });

    switch (method) {
      case StorageMethod.LOCAL_STORAGE:
        localStorage.setItem(key, serializedData);
        return { success: true, method };

      case StorageMethod.SESSION_STORAGE:
        sessionStorage.setItem(key, serializedData);
        return { success: true, method };

      case StorageMethod.COOKIE:
        return this.storeCookie(key, serializedData, options);

      case StorageMethod.INDEXED_DB:
        return this.storeIndexedDB(key, data, options);

      case StorageMethod.MEMORY:
        this.memoryStore.set(key, {
          data,
          expires: options.expireTime ? Date.now() + options.expireTime : undefined
        });
        return { success: true, method };

      default:
        throw new Error(`Unknown storage method: ${method}`);
    }
  }

  /**
   * Retrieve data with specific method
   */
  private async retrieveWithMethod(method: StorageMethod, key: string): Promise<SessionData | null> {
    switch (method) {
      case StorageMethod.LOCAL_STORAGE:
        return this.getFromWebStorage(localStorage, key);

      case StorageMethod.SESSION_STORAGE:
        return this.getFromWebStorage(sessionStorage, key);

      case StorageMethod.COOKIE:
        return this.getFromCookie(key);

      case StorageMethod.INDEXED_DB:
        return this.getFromIndexedDB(key);

      case StorageMethod.MEMORY:
        const memoryData = this.memoryStore.get(key);
        if (memoryData) {
          if (memoryData.expires && Date.now() > memoryData.expires) {
            this.memoryStore.delete(key);
            return null;
          }
          return memoryData.data;
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Clear data with specific method
   */
  private async clearWithMethod(method: StorageMethod, key: string): Promise<void> {
    switch (method) {
      case StorageMethod.LOCAL_STORAGE:
        localStorage.removeItem(key);
        break;

      case StorageMethod.SESSION_STORAGE:
        sessionStorage.removeItem(key);
        break;

      case StorageMethod.COOKIE:
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        break;

      case StorageMethod.INDEXED_DB:
        // Implementation for IndexedDB clear
        break;

      case StorageMethod.MEMORY:
        this.memoryStore.delete(key);
        break;
    }
  }

  /**
   * Helper methods for specific storage types
   */
  private getFromWebStorage(storage: Storage, key: string): SessionData | null {
    try {
      const item = storage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (parsed.expires && Date.now() > parsed.expires) {
        storage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  private storeCookie(key: string, data: string, options: SessionOptions): StorageResult {
    try {
      const expires = options.expireTime 
        ? new Date(Date.now() + options.expireTime).toUTCString()
        : '';
      
      const cookieString = `${key}=${encodeURIComponent(data)}${expires ? `; expires=${expires}` : ''}; path=/; SameSite=Lax`;
      document.cookie = cookieString;
      
      return { success: true, method: StorageMethod.COOKIE };
    } catch (error) {
      return { 
        success: false, 
        method: StorageMethod.COOKIE, 
        error: error instanceof Error ? error.message : 'Cookie storage failed'
      };
    }
  }

  private getFromCookie(key: string): SessionData | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === key && value) {
          const decoded = decodeURIComponent(value);
          const parsed = JSON.parse(decoded);
          
          if (parsed.expires && Date.now() > parsed.expires) {
            // Clear expired cookie
            document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            return null;
          }
          
          return parsed.data;
        }
      }
    } catch {
      // Silent failure for cookie parsing
    }
    return null;
  }

  private async storeIndexedDB(key: string, data: SessionData, options: SessionOptions): Promise<StorageResult> {
    // Simplified IndexedDB implementation
    return { success: false, method: StorageMethod.INDEXED_DB, error: "IndexedDB not implemented yet" };
  }

  private async getFromIndexedDB(key: string): Promise<SessionData | null> {
    // Simplified IndexedDB implementation
    return null;
  }

  /**
   * Detect storage capabilities
   */
  private detectStorageCapabilities(): void {
    if (typeof window === 'undefined') return;

    // Test localStorage
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.storageCapabilities[StorageMethod.LOCAL_STORAGE] = true;
    } catch {
      this.storageCapabilities[StorageMethod.LOCAL_STORAGE] = false;
    }

    // Test sessionStorage
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      this.storageCapabilities[StorageMethod.SESSION_STORAGE] = true;
    } catch {
      this.storageCapabilities[StorageMethod.SESSION_STORAGE] = false;
    }

    // Test cookies
    try {
      document.cookie = '__cookie_test__=test; path=/';
      const cookieEnabled = document.cookie.indexOf('__cookie_test__') !== -1;
      document.cookie = '__cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      this.storageCapabilities[StorageMethod.COOKIE] = cookieEnabled;
    } catch {
      this.storageCapabilities[StorageMethod.COOKIE] = false;
    }

    // Test IndexedDB
    this.storageCapabilities[StorageMethod.INDEXED_DB] = !!(window.indexedDB);
  }

  /**
   * Setup storage event listeners for cross-tab synchronization
   */
  private setupStorageEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('ban_state_')) {
        silentLogger.silent("Ban state changed in another tab", { 
          key: this.sanitizeKey(event.key) 
        });
        // Handle cross-tab ban state changes if needed
      }
    });
  }

  /**
   * Get optimal storage order based on persistence requirement
   */
  private getOptimalStorageOrder(persistent: boolean): StorageMethod[] {
    if (persistent) {
      return [
        StorageMethod.LOCAL_STORAGE,
        StorageMethod.INDEXED_DB,
        StorageMethod.COOKIE,
        StorageMethod.SESSION_STORAGE,
        StorageMethod.MEMORY
      ];
    } else {
      return [
        StorageMethod.SESSION_STORAGE,
        StorageMethod.LOCAL_STORAGE,
        StorageMethod.MEMORY,
        StorageMethod.COOKIE
      ];
    }
  }

  /**
   * Sanitize key for logging
   */
  private sanitizeKey(key: string): string {
    return key.replace(/[a-f0-9-]{36}/gi, '[UUID]');
  }

  /**
   * Public utility methods
   */
  public getStorageCapabilities() {
    return { ...this.storageCapabilities };
  }

  public clearAllBanStates(): void {
    // Clear all ban-related session data
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ban_state_') || key.startsWith('redirect_state_') || key.startsWith('unban_completed_')) {
          localStorage.removeItem(key);
        }
      });
    }

    if (typeof sessionStorage !== 'undefined') {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('ban_state_') || key.startsWith('redirect_state_') || key.startsWith('unban_completed_')) {
          sessionStorage.removeItem(key);
        }
      });
    }

    // Clear memory store
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith('ban_state_') || key.startsWith('redirect_state_') || key.startsWith('unban_completed_')) {
        this.memoryStore.delete(key);
      }
    }
  }
}

// Convenience functions
export function getSessionManager(): EnterpriseSessionManager {
  return EnterpriseSessionManager.getInstance();
}

export async function setBanState(uuid: string, state: 'banned' | 'unbanned' | 'checking'): Promise<void> {
  const manager = getSessionManager();
  return manager.setBanState(uuid, state);
}

export async function getBanState(uuid: string): Promise<{ state: string; timestamp: number } | null> {
  const manager = getSessionManager();
  return manager.getBanState(uuid);
}

// Export types and enums
export { StorageMethod };
export type { SessionData, SessionOptions, StorageResult };