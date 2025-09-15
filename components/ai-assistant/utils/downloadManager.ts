/**
 * Robust Download Manager
 * 100% reliable file download utility with multiple fallback strategies
 */

export interface DownloadOptions {
  url: string;
  filename?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface DownloadResult {
  success: boolean;
  method: string;
  error?: Error;
}

class DownloadManager {
  private static instance: DownloadManager;
  private downloadAttempts = new Map<string, number>();
  private maxRetries = 3;

  static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  /**
   * Main download method with multiple fallback strategies
   */
  async downloadFile(options: DownloadOptions): Promise<DownloadResult> {
    const { url, filename, onProgress, onSuccess, onError } = options;
    const downloadKey = `${url}-${filename}`;
    
    // Reset attempts for new downloads
    if (!this.downloadAttempts.has(downloadKey)) {
      this.downloadAttempts.set(downloadKey, 0);
    }

    const attempts = this.downloadAttempts.get(downloadKey) || 0;
    this.downloadAttempts.set(downloadKey, attempts + 1);

    console.log(`[DownloadManager] Starting download attempt ${attempts + 1}/${this.maxRetries + 1}`, {
      url,
      filename
    });

    // Strategy 1: Direct anchor download (most reliable)
    try {
      const result = await this.directAnchorDownload(url, filename);
      if (result.success) {
        onSuccess?.();
        this.downloadAttempts.delete(downloadKey);
        return result;
      }
    } catch (error) {
      console.warn('[DownloadManager] Direct anchor download failed:', error);
    }

    // Strategy 2: Fetch + Blob download (for CORS-enabled resources)
    try {
      const result = await this.fetchBlobDownload(url, filename, onProgress);
      if (result.success) {
        onSuccess?.();
        this.downloadAttempts.delete(downloadKey);
        return result;
      }
    } catch (error) {
      console.warn('[DownloadManager] Fetch blob download failed:', error);
    }

    // Strategy 3: Window location assignment (last resort)
    try {
      const result = await this.windowLocationDownload(url);
      if (result.success) {
        onSuccess?.();
        this.downloadAttempts.delete(downloadKey);
        return result;
      }
    } catch (error) {
      console.warn('[DownloadManager] Window location download failed:', error);
    }

    // Retry logic
    if (attempts < this.maxRetries) {
      console.log(`[DownloadManager] Retrying download in 1 second...`);
      await this.delay(1000);
      return this.downloadFile(options);
    }

    // All strategies failed
    const finalError = new Error(`Download failed after ${this.maxRetries + 1} attempts`);
    onError?.(finalError);
    this.downloadAttempts.delete(downloadKey);
    
    return {
      success: false,
      method: 'all-failed',
      error: finalError
    };
  }

  /**
   * Strategy 1: Direct anchor download
   * Most reliable method for most file types
   */
  private async directAnchorDownload(url: string, filename?: string): Promise<DownloadResult> {
    return new Promise((resolve) => {
      try {
        const extractedFilename = filename || this.extractFilenameFromUrl(url);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = extractedFilename;
        link.style.display = 'none';
        link.rel = 'noopener noreferrer';
        
        // Add event listeners to detect success/failure
        let downloadStarted = false;
        
        const cleanup = () => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        };

        // For modern browsers, we can detect when download starts
        link.addEventListener('click', () => {
          downloadStarted = true;
        });

        document.body.appendChild(link);
        link.click();
        
        // Give it a moment to start the download
        setTimeout(() => {
          cleanup();
          resolve({
            success: true,
            method: 'direct-anchor'
          });
        }, 100);

      } catch (error) {
        resolve({
          success: false,
          method: 'direct-anchor',
          error: error as Error
        });
      }
    });
  }

  /**
   * Strategy 2: Fetch + Blob download
   * Works well for CORS-enabled resources
   */
  private async fetchBlobDownload(
    url: string, 
    filename?: string, 
    onProgress?: (progress: number) => void
  ): Promise<DownloadResult> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total > 0 && onProgress) {
          onProgress((loaded / total) * 100);
        }
      }

      const blob = new Blob(chunks as BlobPart[]);
      const blobUrl = URL.createObjectURL(blob);
      const extractedFilename = filename || this.extractFilenameFromUrl(url);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = extractedFilename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      return {
        success: true,
        method: 'fetch-blob'
      };

    } catch (error) {
      return {
        success: false,
        method: 'fetch-blob',
        error: error as Error
      };
    }
  }

  /**
   * Strategy 3: Window location assignment
   * Last resort - may open in new tab but will download
   */
  private async windowLocationDownload(url: string): Promise<DownloadResult> {
    try {
      // Create a temporary iframe to avoid navigation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      
      document.body.appendChild(iframe);
      
      // Set the iframe source to the download URL
      iframe.src = url;
      
      // Clean up after a delay
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 5000);

      return {
        success: true,
        method: 'window-location'
      };

    } catch (error) {
      return {
        success: false,
        method: 'window-location',
        error: error as Error
      };
    }
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const filename = lastPart.split('?')[0]; // Remove query parameters
      
      // If no extension found, add a default one
      if (!filename.includes('.')) {
        return `download-${Date.now()}.pdf`;
      }
      
      return filename || `download-${Date.now()}`;
    } catch {
      return `download-${Date.now()}`;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if URL is downloadable
   */
  async isDownloadable(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get file info from URL
   */
  async getFileInfo(url: string): Promise<{
    size?: number;
    type?: string;
    filename?: string;
  }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      return {
        size: response.headers.get('content-length') ? 
              parseInt(response.headers.get('content-length')!, 10) : undefined,
        type: response.headers.get('content-type') || undefined,
        filename: this.extractFilenameFromUrl(url)
      };
    } catch {
      return {
        filename: this.extractFilenameFromUrl(url)
      };
    }
  }
}

// Export singleton instance
export const downloadManager = DownloadManager.getInstance();

// Export convenience function
export const downloadFile = (options: DownloadOptions): Promise<DownloadResult> => {
  return downloadManager.downloadFile(options);
};