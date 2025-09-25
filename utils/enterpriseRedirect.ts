/**
 * Enterprise-Level Mobile Redirect System
 * Bulletproof redirect mechanism with multiple fallback strategies
 * Specifically designed to handle Samsung S9 Plus and other mobile browser limitations
 */

import { prodLogger, silentLogger } from './secureLogger';
import { logRedirectAttempt, logRedirectSuccess, logRedirectFailure } from './enterpriseBanMonitor';

interface RedirectOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  preserveHistory?: boolean;
  forceReload?: boolean;
  validateRedirect?: boolean;
  fallbackStrategies?: RedirectStrategy[];
}

interface RedirectResult {
  success: boolean;
  method: RedirectStrategy;
  attempts: number;
  error?: string;
  duration: number;
}

enum RedirectStrategy {
  NEXT_ROUTER = 'next-router',
  WINDOW_LOCATION = 'window-location',
  WINDOW_REPLACE = 'window-replace', 
  META_REFRESH = 'meta-refresh',
  FORM_SUBMIT = 'form-submit',
  FORCE_RELOAD = 'force-reload'
}

interface DeviceCapabilities {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSamsung: boolean;
  supportsHistoryAPI: boolean;
  browserName: string;
  browserVersion: string;
}

export class EnterpriseRedirectManager {
  private static instance: EnterpriseRedirectManager;
  private deviceCapabilities: DeviceCapabilities;
  private activeRedirects: Map<string, boolean> = new Map();
  
  private constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    silentLogger.silent("Enterprise redirect manager initialized", {
      capabilities: this.deviceCapabilities
    });
  }

  public static getInstance(): EnterpriseRedirectManager {
    if (!EnterpriseRedirectManager.instance) {
      EnterpriseRedirectManager.instance = new EnterpriseRedirectManager();
    }
    return EnterpriseRedirectManager.instance;
  }

  /**
   * Main redirect method with enterprise-level reliability
   */
  public async redirectWithFallback(
    url: string,
    options: RedirectOptions = {},
    router?: any,
    uuid?: string
  ): Promise<RedirectResult> {
    const startTime = Date.now();
    const redirectId = `redirect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract UUID from URL if not provided
    const visitorUUID = uuid || this.extractUUIDFromUrl(url);
    
    // Prevent duplicate redirects
    if (this.activeRedirects.get(url)) {
      silentLogger.silent("Redirect already in progress for URL", { url });
      return {
        success: false,
        method: RedirectStrategy.NEXT_ROUTER,
        attempts: 0,
        error: "Redirect already in progress",
        duration: 0
      };
    }

    this.activeRedirects.set(url, true);
    
    const defaultOptions: RedirectOptions = {
      maxRetries: 3,
      retryDelay: 500,
      timeout: 10000,
      preserveHistory: false,
      forceReload: false,
      validateRedirect: true,
      fallbackStrategies: this.getOptimalStrategies(),
      ...options
    };

    let lastError = '';
    let attempts = 0;

    try {
      prodLogger.info("Starting enterprise redirect", {
        url: this.sanitizeUrl(url),
        device: this.deviceCapabilities.browserName,
        isMobile: this.deviceCapabilities.isMobile
      });

      for (const strategy of defaultOptions.fallbackStrategies!) {
        attempts++;
        
        // Log redirect attempt
        if (visitorUUID) {
          logRedirectAttempt(visitorUUID, url, strategy, 'System');
        }
        
        try {
          const success = await this.executeRedirectStrategy(
            strategy,
            url,
            router,
            defaultOptions
          );

          if (success) {
            const duration = Date.now() - startTime;
            
            prodLogger.info("Redirect successful", {
              method: strategy,
              attempts,
              duration: `${duration}ms`
            });

            // Log redirect success
            if (visitorUUID) {
              logRedirectSuccess(visitorUUID, url, strategy, duration, attempts, 'System');
            }

            // Validate redirect if required
            if (defaultOptions.validateRedirect) {
              setTimeout(() => {
                this.validateRedirectSuccess(url, redirectId);
              }, 1000);
            }

            return {
              success: true,
              method: strategy,
              attempts,
              duration
            };
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          
          // Log redirect failure for this strategy
          if (visitorUUID) {
            logRedirectFailure(visitorUUID, url, strategy, lastError, attempts, 'System');
          }
          
          silentLogger.silent(`Redirect strategy ${strategy} failed`, {
            error: lastError,
            attempt: attempts
          });

          // Wait before retry for mobile browsers
          if (attempts < defaultOptions.maxRetries! && this.deviceCapabilities.isMobile) {
            await this.sleep(defaultOptions.retryDelay!);
          }
        }
      }

      // All strategies failed
      const duration = Date.now() - startTime;
      prodLogger.error("All redirect strategies failed", {
        url: this.sanitizeUrl(url),
        attempts,
        lastError,
        duration: `${duration}ms`,
        device: this.deviceCapabilities.browserName
      });

      return {
        success: false,
        method: RedirectStrategy.NEXT_ROUTER,
        attempts,
        error: lastError,
        duration
      };

    } finally {
      this.activeRedirects.delete(url);
    }
  }

  /**
   * Execute specific redirect strategy
   */
  private async executeRedirectStrategy(
    strategy: RedirectStrategy,
    url: string,
    router?: any,
    options: RedirectOptions = {}
  ): Promise<boolean> {
    silentLogger.silent(`Attempting redirect with strategy: ${strategy}`, { url: this.sanitizeUrl(url) });

    switch (strategy) {
      case RedirectStrategy.NEXT_ROUTER:
        return this.executeNextRouterRedirect(url, router, options);
        
      case RedirectStrategy.WINDOW_LOCATION:
        return this.executeWindowLocationRedirect(url, options);
        
      case RedirectStrategy.WINDOW_REPLACE:
        return this.executeWindowReplaceRedirect(url, options);
        
      case RedirectStrategy.META_REFRESH:
        return this.executeMetaRefreshRedirect(url, options);
        
      case RedirectStrategy.FORM_SUBMIT:
        return this.executeFormSubmitRedirect(url, options);
        
      case RedirectStrategy.FORCE_RELOAD:
        return this.executeForceReloadRedirect(url, options);
        
      default:
        throw new Error(`Unknown redirect strategy: ${strategy}`);
    }
  }

  /**
   * Next.js Router redirect (Strategy 1)
   */
  private async executeNextRouterRedirect(
    url: string, 
    router?: any, 
    options: RedirectOptions = {}
  ): Promise<boolean> {
    if (!router || typeof router.push !== 'function') {
      throw new Error('Next.js router not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Next.js router redirect timeout'));
      }, options.timeout || 5000);

      try {
        const routerMethod = options.preserveHistory ? router.push : router.replace;
        routerMethod(url);
        
        // Wait a moment to see if redirect started
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(true);
        }, 100);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Window location redirect (Strategy 2)
   */
  private async executeWindowLocationRedirect(
    url: string, 
    options: RedirectOptions = {}
  ): Promise<boolean> {
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    return new Promise((resolve) => {
      try {
        if (options.preserveHistory) {
          window.location.assign(url);
        } else {
          window.location.href = url;
        }
        // Assume success after short delay
        setTimeout(() => resolve(true), 50);
      } catch (error) {
        throw new Error(`Window location redirect failed: ${error}`);
      }
    });
  }

  /**
   * Window replace redirect (Strategy 3)
   */
  private async executeWindowReplaceRedirect(
    url: string, 
    options: RedirectOptions = {}
  ): Promise<boolean> {
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    return new Promise((resolve) => {
      try {
        window.location.replace(url);
        setTimeout(() => resolve(true), 50);
      } catch (error) {
        throw new Error(`Window replace redirect failed: ${error}`);
      }
    });
  }

  /**
   * Meta refresh redirect (Strategy 4) - Good for problematic mobile browsers
   */
  private async executeMetaRefreshRedirect(
    url: string, 
    options: RedirectOptions = {}
  ): Promise<boolean> {
    if (typeof document === 'undefined') {
      throw new Error('Document object not available');
    }

    return new Promise((resolve) => {
      try {
        // Remove existing meta refresh tags
        const existingTags = document.querySelectorAll('meta[http-equiv="refresh"]');
        existingTags.forEach(tag => tag.remove());

        // Create new meta refresh tag
        const meta = document.createElement('meta');
        meta.httpEquiv = 'refresh';
        meta.content = `0; url=${url}`;
        document.head.appendChild(meta);

        silentLogger.silent("Meta refresh redirect initiated", { url: this.sanitizeUrl(url) });
        setTimeout(() => resolve(true), 100);
      } catch (error) {
        throw new Error(`Meta refresh redirect failed: ${error}`);
      }
    });
  }

  /**
   * Form submit redirect (Strategy 5) - Reliable for stubborn mobile browsers
   */
  private async executeFormSubmitRedirect(
    url: string, 
    options: RedirectOptions = {}
  ): Promise<boolean> {
    if (typeof document === 'undefined') {
      throw new Error('Document object not available');
    }

    return new Promise((resolve) => {
      try {
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = url;
        form.style.display = 'none';
        
        document.body.appendChild(form);
        form.submit();
        
        silentLogger.silent("Form submit redirect initiated", { url: this.sanitizeUrl(url) });
        setTimeout(() => {
          document.body.removeChild(form);
          resolve(true);
        }, 100);
      } catch (error) {
        throw new Error(`Form submit redirect failed: ${error}`);
      }
    });
  }

  /**
   * Force reload redirect (Strategy 6) - Nuclear option
   */
  private async executeForceReloadRedirect(
    url: string, 
    options: RedirectOptions = {}
  ): Promise<boolean> {
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    return new Promise((resolve) => {
      try {
        // Set the URL and force reload
        if (window.location.href !== url) {
          window.location.href = url;
        }
        window.location.reload();
        
        setTimeout(() => resolve(true), 100);
      } catch (error) {
        throw new Error(`Force reload redirect failed: ${error}`);
      }
    });
  }

  /**
   * Get optimal redirect strategies based on device capabilities
   */
  private getOptimalStrategies(): RedirectStrategy[] {
    const strategies: RedirectStrategy[] = [];

    if (this.deviceCapabilities.isMobile) {
      if (this.deviceCapabilities.isSamsung) {
        // Samsung devices often have issues with router.push
        strategies.push(
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.FORM_SUBMIT,
          RedirectStrategy.NEXT_ROUTER,
          RedirectStrategy.WINDOW_REPLACE,
          RedirectStrategy.FORCE_RELOAD
        );
      } else if (this.deviceCapabilities.isIOS) {
        // iOS Safari strategies
        strategies.push(
          RedirectStrategy.NEXT_ROUTER,
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.WINDOW_REPLACE,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.FORCE_RELOAD
        );
      } else {
        // General Android strategies
        strategies.push(
          RedirectStrategy.NEXT_ROUTER,
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.FORM_SUBMIT,
          RedirectStrategy.WINDOW_REPLACE,
          RedirectStrategy.FORCE_RELOAD
        );
      }
    } else {
      // Desktop strategies
      strategies.push(
        RedirectStrategy.NEXT_ROUTER,
        RedirectStrategy.WINDOW_LOCATION,
        RedirectStrategy.WINDOW_REPLACE,
        RedirectStrategy.FORCE_RELOAD
      );
    }

    return strategies;
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isSamsung: false,
        supportsHistoryAPI: false,
        browserName: 'Unknown',
        browserVersion: 'Unknown'
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSamsung = /samsung/.test(userAgent) || /sm-/.test(userAgent);
    
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    // Detect browser
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      browserName = 'Chrome';
      const match = userAgent.match(/chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('edg')) {
      browserName = 'Edge';
      const match = userAgent.match(/edg\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    return {
      isMobile,
      isIOS,
      isAndroid,
      isSamsung,
      supportsHistoryAPI: !!(window.history && window.history.pushState),
      browserName,
      browserVersion
    };
  }

  /**
   * Validate redirect success
   */
  private validateRedirectSuccess(expectedUrl: string, redirectId: string): void {
    setTimeout(() => {
      if (typeof window === 'undefined') return;
      
      const currentUrl = window.location.href;
      const expectedPath = expectedUrl.replace(window.location.origin, '');
      const currentPath = currentUrl.replace(window.location.origin, '');
      
      if (currentPath !== expectedPath) {
        prodLogger.warn("Redirect validation failed", {
          expected: this.sanitizeUrl(expectedUrl),
          actual: this.sanitizeUrl(currentUrl),
          redirectId
        });
      } else {
        silentLogger.silent("Redirect validation successful", { redirectId });
      }
    }, 2000);
  }

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window?.location?.origin);
      return urlObj.pathname;
    } catch {
      return url.replace(/[?#].*$/, ''); // Remove query params and hash
    }
  }

  /**
   * Extract UUID from URL path
   */
  private extractUUIDFromUrl(url: string): string | undefined {
    try {
      const urlObj = new URL(url, window?.location?.origin);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      for (const segment of pathSegments) {
        if (uuidRegex.test(segment)) {
          return segment;
        }
      }
    } catch {
      // Silent fail, return undefined
    }
    return undefined;
  }

  /**
   * Public helper methods
   */
  public isRedirectInProgress(url: string): boolean {
    return this.activeRedirects.get(url) || false;
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  public clearActiveRedirects(): void {
    this.activeRedirects.clear();
  }
}

// Convenience function for easy usage
export async function enterpriseRedirect(
  url: string,
  options?: RedirectOptions,
  router?: any,
  uuid?: string
): Promise<RedirectResult> {
  const manager = EnterpriseRedirectManager.getInstance();
  return manager.redirectWithFallback(url, options, router, uuid);
}

// Export types and enums
export { RedirectStrategy };
export type { RedirectOptions, RedirectResult, DeviceCapabilities };