/**
 * Turnstile Inline Component
 * Inline Turnstile widget for form submissions
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { TurnstileWidgetState } from '@/lib/types/turnstile';

interface TurnstileInlineProps {
  onVerify?: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  className?: string;
  size?: 'normal' | 'compact';
  theme?: 'light' | 'dark' | 'auto';
  disabled?: boolean;
}

export interface TurnstileInlineRef {
  getToken: () => Promise<string>;
  reset: () => void;
  isVerified: () => boolean;
}

const TurnstileInline = forwardRef<TurnstileInlineRef, TurnstileInlineProps>(({
  onVerify,
  onError,
  onExpire,
  className = '',
  size = 'normal',
  theme = 'dark',
  disabled = false
}, ref) => {
  // Widget state
  const [widgetState, setWidgetState] = useState<TurnstileWidgetState>({
    isLoading: true,
    isVerified: false,
    token: null,
    error: null,
    widgetId: null
  });

  const [isVisible, setIsVisible] = useState(false);
  
  // Refs
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef<boolean>(false);
  const componentId = useRef(`turnstile-inline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Enhanced widget initialization with proper manager integration
  const initializeWidget = useCallback(() => {
    if (initializationRef.current || !widgetContainerRef.current || disabled) {
      return;
    }

    // Check if site key is available
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error('[TurnstileInline] NEXT_PUBLIC_TURNSTILE_SITE_KEY not found');
      handleError('MISSING_SITE_KEY');
      return;
    }

    // Use the new turnstile manager
    if (typeof window !== 'undefined' && window.turnstileManager) {
      window.turnstileManager.waitForReady((error?: Error) => {
        if (error) {
          console.error('[TurnstileInline] Turnstile not ready:', error);
          handleError('TURNSTILE_NOT_READY');
          return;
        }

        if (initializationRef.current || !widgetContainerRef.current) {
          return; // Already initialized during wait or container not available
        }

        try {
          console.log('[TurnstileInline] Initializing widget with site key:', siteKey.substring(0, 10) + '...');
          initializationRef.current = true;

          if (!window.turnstile) {
            throw new Error('Turnstile API not available');
          }

          const widgetId = window.turnstile.render(widgetContainerRef.current, {
            sitekey: siteKey,
            appearance: 'always',
            theme,
            size,
            callback: handleSuccess,
            'error-callback': handleError,
            'expired-callback': handleExpired,
            'timeout-callback': handleTimeout
          });

          console.log('[TurnstileInline] Widget render result:', widgetId);
          
          if (widgetId && window.turnstileManager) {
            // Register with manager
            window.turnstileManager.register(componentId.current, widgetId);
            
            setWidgetState(prev => ({
              ...prev,
              widgetId,
              isLoading: false
            }));
            setIsVisible(true);
            console.log('[TurnstileInline] Widget initialized successfully with ID:', widgetId);
          } else {
            console.error('[TurnstileInline] Widget render returned null/undefined');
            initializationRef.current = false;
            handleError('RENDER_FAILED');
          }
        } catch (error) {
          console.error('[TurnstileInline] Failed to initialize widget:', error);
          initializationRef.current = false;
          handleError('INITIALIZATION_FAILED');
        }
      }, 15000); // 15 second timeout
    } else {
      console.warn('[TurnstileInline] TurnstileManager not available, falling back to legacy method');
      // Fallback for legacy compatibility
      setTimeout(initializeWidget, 500);
    }
  }, [theme, size, disabled]);

  // Success callback
  const handleSuccess = useCallback((token: string) => {
    console.log('[TurnstileInline] Verification successful');
    
    setWidgetState(prev => ({
      ...prev,
      token,
      isVerified: true,
      error: null
    }));

    if (onVerify) {
      onVerify(token);
    }
  }, [onVerify]);

  // Error callback
  const handleError = useCallback((errorCode?: string) => {
    console.warn('[TurnstileInline] Error:', errorCode);
    
    const errorMessage = getErrorMessage(errorCode);
    
    setWidgetState(prev => ({
      ...prev,
      error: errorMessage,
      isVerified: false,
      token: null
    }));

    if (onError) {
      onError(errorMessage);
    }
  }, [onError]);

  // Expired callback
  const handleExpired = useCallback(() => {
    console.warn('[TurnstileInline] Token expired');
    
    setWidgetState(prev => ({
      ...prev,
      isVerified: false,
      token: null,
      error: 'Verification expired'
    }));

    if (onExpire) {
      onExpire();
    }
  }, [onExpire]);

  // Timeout callback
  const handleTimeout = useCallback(() => {
    console.warn('[TurnstileInline] Timeout');
    handleError('TIMEOUT');
  }, [handleError]);

  // Enhanced widget reset
  const resetWidget = useCallback(() => {
    if (widgetState.widgetId && window.turnstile) {
      console.log('[TurnstileInline] Resetting widget');
      try {
        window.turnstile.reset(widgetState.widgetId);
        
        setWidgetState(prev => ({
          ...prev,
          isVerified: false,
          token: null,
          error: null
        }));
      } catch (error) {
        console.warn('[TurnstileInline] Error resetting widget:', error);
        // If reset fails, try to re-initialize
        initializationRef.current = false;
        setWidgetState(prev => ({
          ...prev,
          isVerified: false,
          token: null,
          error: 'Reset failed - please refresh',
          isLoading: true
        }));
        setTimeout(initializeWidget, 1000);
      }
    }
  }, [widgetState.widgetId, initializeWidget]);

  // Get current token (for imperative access) - with timeout to prevent hanging
  const getToken = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (widgetState.token && widgetState.isVerified) {
        resolve(widgetState.token);
        return;
      }
      
      if (widgetState.error) {
        reject(new Error(widgetState.error));
        return;
      }
      
      // Set a maximum wait time to prevent infinite hanging
      const timeoutMs = process.env.NODE_ENV === 'development' ? 8000 : 15000;
      const startTime = Date.now();
      
      const checkToken = () => {
        // Check if timeout exceeded
        if (Date.now() - startTime > timeoutMs) {
          console.warn('[TurnstileInline] Token wait timeout exceeded');
          reject(new Error('Verification timeout. Please try again.'));
          return;
        }
        
        if (widgetState.token && widgetState.isVerified) {
          resolve(widgetState.token);
        } else if (widgetState.error) {
          reject(new Error(widgetState.error));
        } else {
          // Continue checking but with timeout protection
          setTimeout(checkToken, 100);
        }
      };
      
      checkToken();
    });
  }, [widgetState.token, widgetState.isVerified, widgetState.error]);

  // Check if verified
  const isVerified = useCallback((): boolean => {
    return widgetState.isVerified && !!widgetState.token;
  }, [widgetState.isVerified, widgetState.token]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getToken,
    reset: resetWidget,
    isVerified
  }), [getToken, resetWidget, isVerified]);

  // Initialize widget on mount with script loading detection
  useEffect(() => {
    if (!disabled) {
      // Wait a bit for the DOM to be ready, then initialize
      const timer = setTimeout(() => {
        console.log('[TurnstileInline] Starting initialization...');
        initializeWidget();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initializeWidget, disabled]);

  // Listen for script loading events
  useEffect(() => {
    if (disabled) return;

    const handleScriptLoad = () => {
      console.log('[TurnstileInline] Turnstile script loaded via event');
      if (!initializationRef.current && !widgetState.widgetId) {
        setTimeout(initializeWidget, 100);
      }
    };

    const handleScriptError = () => {
      console.error('[TurnstileInline] Turnstile script failed to load');
      handleError('SCRIPT_LOAD_FAILED');
    };

    // Listen for custom events from layout.tsx
    window.addEventListener('turnstile-loaded', handleScriptLoad);
    window.addEventListener('turnstile-error', handleScriptError);

    return () => {
      window.removeEventListener('turnstile-loaded', handleScriptLoad);
      window.removeEventListener('turnstile-error', handleScriptError);
    };
  }, [disabled, initializeWidget, widgetState.widgetId]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      if (widgetState.widgetId) {
        try {
          // Use manager for proper cleanup
          if (typeof window !== 'undefined' && window.turnstileManager) {
            window.turnstileManager.unregister(componentId.current);
          } else if (typeof window !== 'undefined' && window.turnstile) {
            // Fallback cleanup
            window.turnstile.remove(widgetState.widgetId);
          }
          console.log('[TurnstileInline] Widget cleaned up');
        } catch (error) {
          console.warn('[TurnstileInline] Error during cleanup:', error);
        }
      }
    };
  }, [widgetState.widgetId]);

  // Reset when disabled changes
  useEffect(() => {
    if (disabled && widgetState.widgetId) {
      setIsVisible(false);
    } else if (!disabled && !isVisible && widgetState.widgetId) {
      setIsVisible(true);
    }
  }, [disabled, widgetState.widgetId, isVisible]);

  // Get user-friendly error message
  const getErrorMessage = (errorCode?: string): string => {
    switch (errorCode) {
      case 'INITIALIZATION_FAILED':
        return 'Failed to load verification widget';
      case 'MISSING_SITE_KEY':
        return 'Configuration error: Site key not found';
      case 'RENDER_FAILED':
        return 'Widget failed to render properly';
      case 'TIMEOUT':
        return 'Verification timed out';
      case 'network-error':
        return 'Network connection issue';
      default:
        return 'Verification failed';
    }
  };

  return (
    <div className={`turnstile-inline-container ${className}`}>
      {/* Loading state */}
      {widgetState.isLoading && !disabled && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-gray-600 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading verification...</span>
          </div>
        </div>
      )}

      {/* Widget container */}
      <div 
        ref={widgetContainerRef}
        className={`cf-turnstile ${!isVisible || disabled ? 'hidden' : ''}`}
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-theme={theme}
        data-size={size}
      />

      {/* Error state */}
      {widgetState.error && !disabled && (
        <div className="mt-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-400">{widgetState.error}</span>
          </div>
          
          <button
            onClick={resetWidget}
            className="mt-2 text-xs text-red-300 hover:text-red-200 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
          >
            Try again
          </button>
        </div>
      )}

      {/* Success state indicator */}
      {widgetState.isVerified && !disabled && (
        <div className="mt-2 flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-green-400">Verified</span>
        </div>
      )}

      {/* Disabled state */}
      {disabled && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-600 rounded-full" />
            <span className="text-sm text-gray-400">Verification disabled</span>
          </div>
        </div>
      )}
    </div>
  );
});

TurnstileInline.displayName = 'TurnstileInline';

export default TurnstileInline;