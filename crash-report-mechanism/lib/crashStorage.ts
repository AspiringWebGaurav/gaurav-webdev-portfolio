/**
 * Crash Storage Queue (IndexedDB)
 * Persistent storage for failed crash report deliveries
 * Survives page refresh and browser restart
 */

import { CreateCrashReportDTO, QueuedReport } from "../types/crashReport";

const DB_NAME = "crashReportQueue";
const STORE_NAME = "pendingReports";
const DB_VERSION = 1;

/**
 * IndexedDB-based persistent queue for crash reports
 * More reliable than localStorage and supports larger payloads
 */
export class CrashStorageQueue {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("[CrashStorage] Failed to open IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[CrashStorage] ✅ IndexedDB initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          
          // Create indexes for efficient queries
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("retryCount", "retryCount", { unique: false });
          
          console.log("[CrashStorage] Created object store");
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Add crash report to queue
   */
  async enqueue(report: CreateCrashReportDTO): Promise<void> {
    try {
      await this.init();

      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const queuedReport: QueuedReport = {
        id: this.generateId(),
        report,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 10,
      };

      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.add(queuedReport);
        
        request.onsuccess = () => {
          console.log("[CrashStorage] ✅ Queued report:", queuedReport.id);
          resolve();
        };
        
        request.onerror = () => {
          console.error("[CrashStorage] Failed to queue:", request.error);
          reject(request.error);
        };
      });

    } catch (error) {
      console.error("[CrashStorage] Enqueue error:", error);
      throw error;
    }
  }

  /**
   * Get all queued reports
   */
  async dequeue(): Promise<QueuedReport[]> {
    try {
      await this.init();

      if (!this.db) {
        return [];
      }

      const transaction = this.db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const reports = request.result as QueuedReport[];
          console.log(`[CrashStorage] Retrieved ${reports.length} queued reports`);
          resolve(reports);
        };
        
        request.onerror = () => {
          console.error("[CrashStorage] Failed to retrieve:", request.error);
          reject(request.error);
        };
      });

    } catch (error) {
      console.error("[CrashStorage] Dequeue error:", error);
      return [];
    }
  }

  /**
   * Remove report from queue
   */
  async remove(id: string): Promise<void> {
    try {
      await this.init();

      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        
        request.onsuccess = () => {
          console.log("[CrashStorage] ✅ Removed report:", id);
          resolve();
        };
        
        request.onerror = () => {
          console.error("[CrashStorage] Failed to remove:", request.error);
          reject(request.error);
        };
      });

    } catch (error) {
      console.error("[CrashStorage] Remove error:", error);
    }
  }

  /**
   * Update retry count for a report
   */
  async incrementRetryCount(id: string): Promise<void> {
    try {
      await this.init();

      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Get the report
      const getRequest = store.get(id);
      
      await new Promise<void>((resolve, reject) => {
        getRequest.onsuccess = () => {
          const report = getRequest.result as QueuedReport;
          
          if (report) {
            report.retryCount += 1;
            
            const putRequest = store.put(report);
            
            putRequest.onsuccess = () => {
              console.log(`[CrashStorage] Incremented retry count: ${report.retryCount}`);
              resolve();
            };
            
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve();
          }
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      });

    } catch (error) {
      console.error("[CrashStorage] Increment retry error:", error);
    }
  }

  /**
   * Get queue size
   */
  async size(): Promise<number> {
    try {
      await this.init();

      if (!this.db) {
        return 0;
      }

      const transaction = this.db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error("[CrashStorage] Size error:", error);
      return 0;
    }
  }

  /**
   * Clear all queued reports (use with caution)
   */
  async clear(): Promise<void> {
    try {
      await this.init();

      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => {
          console.log("[CrashStorage] ✅ Queue cleared");
          resolve();
        };
        
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error("[CrashStorage] Clear error:", error);
    }
  }

  /**
   * Generate unique ID for queued report
   */
  private generateId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log("[CrashStorage] Database closed");
    }
  }
}

// Singleton instance
let storageInstance: CrashStorageQueue | null = null;

/**
 * Get singleton instance of crash storage queue
 */
export function getCrashStorageQueue(): CrashStorageQueue {
  if (!storageInstance) {
    storageInstance = new CrashStorageQueue();
  }
  return storageInstance;
}
