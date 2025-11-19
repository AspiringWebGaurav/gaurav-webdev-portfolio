import { toast } from 'react-toastify';
import React from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  autoClose?: number;
  closeButton?: boolean;
  icon?: string | React.ReactNode;
}

/**
 * Centralized toast notification system
 * Fast come (1s), fast go (1s), top-right position
 */
export const showToast = {
  success: (message: string, title?: string, options?: ToastOptions) => {
    toast.success(
      <div>
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>,
      {
        autoClose: options?.autoClose ?? 1000,
        closeButton: options?.closeButton ?? true,
        icon: options?.icon ?? '✓',
        ...options,
      }
    );
  },

  error: (message: string, title?: string, options?: ToastOptions) => {
    toast.error(
      <div>
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>,
      {
        autoClose: options?.autoClose ?? 1000,
        closeButton: options?.closeButton ?? true,
        icon: options?.icon ?? '✕',
        ...options,
      }
    );
  },

  warning: (message: string, title?: string, options?: ToastOptions) => {
    toast.warning(
      <div>
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>,
      {
        autoClose: options?.autoClose ?? 1000,
        closeButton: options?.closeButton ?? true,
        icon: options?.icon ?? '⚠',
        ...options,
      }
    );
  },

  info: (message: string, title?: string, options?: ToastOptions) => {
    toast.info(
      <div>
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>,
      {
        autoClose: options?.autoClose ?? 1000,
        closeButton: options?.closeButton ?? true,
        icon: options?.icon ?? 'ℹ',
        ...options,
      }
    );
  },
};

/**
 * Notify action with toast + Firebase API storage
 * For admin panel: Shows toast + saves to notification bell
 */
export async function notifyAction(
  type: ToastType,
  message: string,
  title?: string,
  category?: 'login' | 'logout' | 'crud' | 'error' | 'timesheet' | 'version',
  options?: ToastOptions
) {
  // 1. Show immediate toast
  showToast[type](message, title, options);

  // 2. Save to Firebase via API (for admin notification bell)
  if (category) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          type: category,
          title: title || '',
          message,
          read: false,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to save notification:', error);
    }
  }
}

// Export individual toast functions for convenience
export const toastSuccess = showToast.success;
export const toastError = showToast.error;
export const toastWarning = showToast.warning;
export const toastInfo = showToast.info;
