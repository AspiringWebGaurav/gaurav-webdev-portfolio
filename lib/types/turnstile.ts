/**
 * Cloudflare Turnstile Types
 * Types for Turnstile CAPTCHA integration
 */

// Turnstile Widget Configuration
export interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: (errorCode?: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  'after-interactive-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'unsupported-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  tabindex?: number;
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  language?: 'auto' | string;
  execution?: 'render' | 'execute';
  cData?: string;
}

// Turnstile API Response from Cloudflare
export interface TurnstileServerResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

// Our API Response Types
export interface TurnstileVerificationRequest {
  token: string;
  remoteip?: string;
}

export interface TurnstileVerificationResponse {
  success: boolean;
  message?: string;
  errors?: string[];
  challenge_ts?: string;
  hostname?: string;
}

// Contact Form Types
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactFormRequest {
  formData: ContactFormData;
  token: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

// Turnstile Widget State
export interface TurnstileWidgetState {
  isLoading: boolean;
  isVerified: boolean;
  token: string | null;
  error: string | null;
  widgetId: string | null;
}

// Global Turnstile API
export interface TurnstileObject {
  render: (container: string | Element, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
  execute: (container?: string | Element, options?: TurnstileOptions) => void;
  getResponse: (widgetId?: string) => string | undefined;
  isExpired: (widgetId?: string) => boolean;
}

// Turnstile Manager Interface
export interface TurnstileManager {
  register: (id: string, widgetId: string) => void;
  unregister: (id: string) => void;
  isReady: () => boolean;
  waitForReady: (callback: (error?: Error) => void, timeout?: number) => void;
}

// Turnstile State Interface
export interface TurnstileState {
  loaded: boolean;
  loading: boolean;
  error: boolean;
  retryCount: number;
  maxRetries: number;
  widgets: Map<string, string>;
}

// Window object extension for Turnstile
declare global {
  interface Window {
    turnstile?: TurnstileObject;
    turnstileManager?: TurnstileManager;
    turnstileState?: TurnstileState;
    onTurnstileLoad?: () => void;
  }
}

// Entry Gate States
export type EntryGateStatus = 'loading' | 'verifying' | 'verified' | 'error' | 'retry';

export interface EntryGateState {
  status: EntryGateStatus;
  message: string;
  showWidget: boolean;
  widgetId: string | null;
  retryCount: number;
}

// Cookie Configuration
export interface TurnstileCookieConfig {
  name: string;
  maxAge: number; // seconds
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
}

export const TURNSTILE_COOKIE_CONFIG: TurnstileCookieConfig = {
  name: 'cf_clear',
  maxAge: 604800, // 7 days (7 * 24 * 60 * 60) - Much longer for better UX
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};

// Additional client-side verification storage configuration
export const TURNSTILE_STORAGE_CONFIG = {
  localStorageKey: 'cf_verified',
  maxAge: 2592000, // 30 days in seconds for localStorage backup
  refreshThreshold: 86400 // 1 day - refresh verification if older than this
};