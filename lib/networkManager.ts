/**
 * Enterprise-Level Network Manager for Bubble Chat
 * 
 * Handles:
 * - Offline/online detection
 * - Request queuing and retry with exponential backoff
 * - Network interruption recovery
 * - Failed request persistence in localStorage
 * - Automatic reconnection
 */

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface NetworkStatus {
  isOnline: boolean;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
}

type NetworkCallback = (status: NetworkStatus) => void;

class NetworkManager {
  private static instance: NetworkManager;
  private requestQueue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private listeners: Set<NetworkCallback> = new Set();
  private processingQueue: boolean = false;
  private readonly QUEUE_STORAGE_KEY = 'bubble_request_queue';
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 32000; // 32 seconds
  
  private networkStatus: NetworkStatus = {
    isOnline: true,
    lastOnlineAt: Date.now(),
    lastOfflineAt: null,
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeNetworkListeners();
      this.loadQueueFromStorage();
      this.isOnline = navigator.onLine;
      this.networkStatus.isOnline = navigator.onLine;
    }
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Initialize browser network event listeners
   */
  private initializeNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Visibility change - resume processing when tab becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('[NetworkManager] 🟢 Connection restored');
    this.isOnline = true;
    this.networkStatus.isOnline = true;
    this.networkStatus.lastOnlineAt = Date.now();
    
    this.notifyListeners(this.networkStatus);
    this.processQueue();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[NetworkManager] 🔴 Connection lost');
    this.isOnline = false;
    this.networkStatus.isOnline = false;
    this.networkStatus.lastOfflineAt = Date.now();
    
    this.notifyListeners(this.networkStatus);
  };

  /**
   * Subscribe to network status changes
   */
  public subscribe(callback: NetworkCallback): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current status
    callback(this.networkStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of network status change
   */
  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[NetworkManager] Error in listener callback:', error);
      }
    });
  }

  /**
   * Make a fetch request with automatic retry and queuing
   */
  public async fetch(url: string, options: RequestInit = {}, maxRetries: number = 3): Promise<Response> {
    // If offline, queue immediately
    if (!this.isOnline) {
      return this.queueRequest(url, options, maxRetries);
    }

    try {
      const response = await fetch(url, options);
      
      // If server error (5xx), retry
      if (response.status >= 500) {
        console.warn(`[NetworkManager] Server error ${response.status}, will retry`);
        return this.queueRequest(url, options, maxRetries);
      }
      
      return response;
    } catch (error) {
      console.error('[NetworkManager] Fetch failed:', error);
      
      // Network error - queue for retry
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('[NetworkManager] Network error detected, queuing request');
        this.isOnline = false; // Assume offline
        this.handleOffline();
        return this.queueRequest(url, options, maxRetries);
      }
      
      throw error;
    }
  }

  /**
   * Queue a request for later processing
   */
  private queueRequest(url: string, options: RequestInit, maxRetries: number): Promise<Response> {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const queuedRequest: QueuedRequest = {
        id: requestId,
        url,
        options,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries,
      };

      // Add to queue
      this.requestQueue.push(queuedRequest);
      
      // Trim queue if too large (FIFO)
      if (this.requestQueue.length > this.MAX_QUEUE_SIZE) {
        this.requestQueue.shift();
      }
      
      // Persist to storage
      this.saveQueueToStorage();
      
      console.log(`[NetworkManager] 📦 Request queued for retry: ${url} (queue: ${this.requestQueue.length})`);
      
      // Return a mock 202 Accepted response indicating request is queued
      // This prevents unhandled rejection errors while maintaining queue functionality
      const mockResponse = new Response(
        JSON.stringify({ 
          queued: true, 
          message: 'Request queued for retry when connection is restored',
          requestId 
        }),
        {
          status: 202,
          statusText: 'Accepted (Queued)',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      resolve(mockResponse);
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0 || !this.isOnline) {
      return;
    }

    this.processingQueue = true;
    console.log(`[NetworkManager] Processing ${this.requestQueue.length} queued requests`);

    while (this.requestQueue.length > 0 && this.isOnline) {
      const request = this.requestQueue[0];
      
      try {
        // Calculate exponential backoff delay
        const delay = Math.min(
          this.BASE_RETRY_DELAY * Math.pow(2, request.retryCount),
          this.MAX_RETRY_DELAY
        );
        
        // Wait before retry (except first attempt)
        if (request.retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`[NetworkManager] Retrying request (attempt ${request.retryCount + 1}/${request.maxRetries}): ${request.url}`);
        
        const response = await fetch(request.url, request.options);
        
        if (response.ok || response.status < 500) {
          // Success or client error (don't retry 4xx)
          this.requestQueue.shift();
          this.saveQueueToStorage();
          console.log(`[NetworkManager] ✅ Request completed: ${request.url}`);
        } else {
          // Server error - increment retry count
          request.retryCount++;
          
          if (request.retryCount >= request.maxRetries) {
            console.error(`[NetworkManager] ❌ Max retries reached for: ${request.url}`);
            this.requestQueue.shift();
            this.saveQueueToStorage();
          } else {
            console.log(`[NetworkManager] Will retry again (${request.retryCount}/${request.maxRetries})`);
          }
        }
      } catch (error) {
        console.error('[NetworkManager] Error processing queued request:', error);
        
        // Network still down
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.log('[NetworkManager] Still offline, pausing queue processing');
          this.isOnline = false;
          this.handleOffline();
          break;
        } else {
          // Other error - remove from queue
          this.requestQueue.shift();
          this.saveQueueToStorage();
        }
      }
    }

    this.processingQueue = false;
    
    if (this.requestQueue.length === 0) {
      console.log('[NetworkManager] ✅ Queue processing complete');
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('[NetworkManager] Failed to save queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (stored) {
        this.requestQueue = JSON.parse(stored);
        console.log(`[NetworkManager] Loaded ${this.requestQueue.length} requests from storage`);
      }
    } catch (error) {
      console.error('[NetworkManager] Failed to load queue from storage:', error);
      this.requestQueue = [];
    }
  }

  /**
   * Get current network status
   */
  public getStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Clear queued requests
   */
  public clearQueue(): void {
    this.requestQueue = [];
    this.saveQueueToStorage();
    console.log('[NetworkManager] Queue cleared');
  }

  /**
   * Get number of queued requests
   */
  public getQueueSize(): number {
    return this.requestQueue.length;
  }

  /**
   * Cleanup listeners (call on unmount if needed)
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners.clear();
  }
}

export default NetworkManager.getInstance();
