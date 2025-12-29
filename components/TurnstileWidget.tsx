"use client";

/**
 * Smart Turnstile Widget
 * Only shows when suspicious activity detected
 * Non-intrusive, invisible mode by default
 */

import { useEffect, useRef, useState } from 'react';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  action?: string;
  autoReset?: boolean;
}

declare global {
  interface Window {
    turnstile?: {
      ready: (callback: () => void) => void;
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

export default function TurnstileWidget({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'invisible', // Invisible by default - only shown when needed
  action,
  autoReset = true,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Turnstile script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if script already loaded
    if (window.turnstile) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    // NOTE: async/defer removed as required by Cloudflare when using turnstile.ready()
    // See: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
    
    script.onload = () => {
      setLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load verification widget');
      onError?.('Failed to load Turnstile');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError]);

  // Render widget when loaded
  useEffect(() => {
    if (!loaded || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    // Render immediately without turnstile.ready() since we already waited for script.onload
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        action,
        callback: (token: string) => {
          console.log('[Turnstile] ✓ Verification successful');
          onVerify(token);
          
          if (autoReset) {
            setTimeout(() => {
              if (widgetIdRef.current) {
                window.turnstile?.reset(widgetIdRef.current);
              }
            }, 1000);
          }
        },
        'error-callback': (error: string) => {
          console.error('[Turnstile] ✗ Error:', error);
          setError(error);
          onError?.(error);
        },
        'expired-callback': () => {
          console.warn('[Turnstile] ⏱️ Token expired');
          onExpire?.();
        },
      });
    } catch (err) {
      console.error('[Turnstile] Failed to render:', err);
      setError('Failed to initialize verification');
      onError?.('Failed to initialize');
    }

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.error('[Turnstile] Cleanup error:', err);
        }
        widgetIdRef.current = null;
      }
    };
  }, [loaded, siteKey, theme, size, action, onVerify, onError, onExpire, autoReset]);

  // Manual reset function
  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  // Expose reset function
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).reset = reset;
    }
  }, []);

  if (error) {
    return (
      <div className="text-sm text-red-500 p-2 rounded bg-red-50">
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="turnstile-container"
      style={{
        minHeight: size === 'normal' ? '65px' : size === 'compact' ? '120px' : '0',
      }}
    />
  );
}

/**
 * Hook for programmatic Turnstile execution
 * Use for invisible challenges triggered by suspicious activity
 */
export function useTurnstile(siteKey: string) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      // Create invisible container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      if (!window.turnstile) {
        setError('Turnstile not loaded');
        setLoading(false);
        resolve(null);
        return;
      }

      window.turnstile.ready(() => {
        const widgetId = window.turnstile!.render(container, {
          sitekey: siteKey,
          size: 'invisible',
          callback: (token: string) => {
            setToken(token);
            setLoading(false);
            document.body.removeChild(container);
            resolve(token);
          },
          'error-callback': (error: string) => {
            setError(error);
            setLoading(false);
            document.body.removeChild(container);
            resolve(null);
          },
        });
      });
    });
  };

  return { token, loading, error, execute };
}
