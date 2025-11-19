"use client";

/**
 * Smart API Client with Rate Limiting & Turnstile Integration
 * Automatically handles rate limits and shows captcha only when needed
 */

import { useState, useCallback, useEffect } from 'react';
import TurnstileWidget from '@/components/TurnstileWidget';

interface ApiOptions extends RequestInit {
  skipRateLimit?: boolean;
  autoRetry?: boolean;
}

interface RateLimitError {
  error: string;
  code: 'CAPTCHA_REQUIRED' | 'RATE_LIMIT_EXCEEDED' | 'CAPTCHA_INVALID';
  message: string;
  requiresCaptcha?: boolean;
  retryAfter?: number;
  botDetected?: boolean;
}

export function useSmartAPI() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{
    url: string;
    options: ApiOptions;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  } | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '';

  // Get device fingerprint (simple version)
  const getFingerprint = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    // Create a simple fingerprint from browser characteristics
    const nav = window.navigator;
    const screen = window.screen;
    
    const fingerprint = btoa(
      [
        nav.userAgent,
        nav.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        !!window.sessionStorage,
        !!window.localStorage,
      ].join('|')
    ).substring(0, 32);
    
    return fingerprint;
  }, []);

  // Make API request with automatic rate limit handling
  const apiCall = useCallback(async <T = any>(
    url: string,
    options: ApiOptions = {}
  ): Promise<T> => {
    const fingerprint = getFingerprint();
    
    // Add fingerprint to request
    const enhancedOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(fingerprint && { 'X-Fingerprint': fingerprint }),
        ...options.headers,
      },
    };

    // If we have a turnstile token, include it
    if (turnstileToken && options.method === 'POST' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        body.turnstileToken = turnstileToken;
        body.fingerprint = fingerprint;
        enhancedOptions.body = JSON.stringify(body);
      } catch (e) {
        // Body not JSON, leave as is
      }
    } else if (options.method === 'GET' && fingerprint) {
      // Add fingerprint to URL params for GET requests
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('fingerprint', fingerprint);
      url = urlObj.pathname + urlObj.search;
    }

    try {
      const response = await fetch(url, enhancedOptions);
      const data = await response.json();

      // Check for rate limit errors
      if (response.status === 429) {
        const rateLimitError = data as RateLimitError;
        
        // If captcha required, show it
        if (rateLimitError.requiresCaptcha || rateLimitError.code === 'CAPTCHA_REQUIRED') {
          console.log('[SmartAPI] 🔐 Captcha required');
          
          // If auto-retry enabled, wait for captcha completion
          if (options.autoRetry !== false) {
            return new Promise((resolve, reject) => {
              setPendingRequest({ url, options, resolve, reject });
              setShowCaptcha(true);
            });
          }
        }

        // If rate limited, provide helpful error
        throw new Error(rateLimitError.message || 'Rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      // Clear token after successful request
      if (turnstileToken) {
        setTurnstileToken(null);
      }

      return data;
    } catch (error) {
      console.error('[SmartAPI] Error:', error);
      throw error;
    }
  }, [fingerprint, turnstileToken, getFingerprint]);

  // Handle Turnstile verification
  const handleTurnstileVerify = useCallback((token: string) => {
    console.log('[SmartAPI] ✓ Captcha verified');
    setTurnstileToken(token);
    setShowCaptcha(false);

    // Retry pending request with the new token
    if (pendingRequest) {
      const { url, options, resolve, reject } = pendingRequest;
      setPendingRequest(null);

      // Make the request again with the token
      apiCall(url, options)
        .then(resolve)
        .catch(reject);
    }
  }, [pendingRequest, apiCall]);

  const handleTurnstileError = useCallback((error: string) => {
    console.error('[SmartAPI] ✗ Captcha error:', error);
    setShowCaptcha(false);

    if (pendingRequest) {
      pendingRequest.reject(new Error('Captcha verification failed'));
      setPendingRequest(null);
    }
  }, [pendingRequest]);

  // Captcha component to render when needed
  const CaptchaChallenge = useCallback(() => {
    if (!showCaptcha || !siteKey) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Verification Required
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Please complete this quick verification to continue
            </p>
          </div>

          <div className="flex justify-center mb-4">
            <TurnstileWidget
              siteKey={siteKey}
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
              theme="auto"
              size="normal"
            />
          </div>

          <button
            onClick={() => {
              setShowCaptcha(false);
              if (pendingRequest) {
                pendingRequest.reject(new Error('Verification cancelled'));
                setPendingRequest(null);
              }
            }}
            className="w-full py-2 px-4 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }, [showCaptcha, siteKey, handleTurnstileVerify, handleTurnstileError, pendingRequest]);

  return {
    apiCall,
    CaptchaChallenge,
    showCaptcha,
    fingerprint: getFingerprint(),
  };
}

/**
 * Simpler hook for one-off API calls with rate limiting
 */
export function useRateLimitedFetch() {
  const { apiCall } = useSmartAPI();
  
  return {
    fetch: apiCall,
  };
}
