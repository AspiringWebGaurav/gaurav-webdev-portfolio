"use client";

import { useEffect, useState } from 'react';
import { toast, ToastContainer, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CountdownToastProps {
  message: string;
  countdown: number;
  onComplete?: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
}

// Custom countdown toast component
function CountdownToast({ message, countdown: initialCountdown, onComplete, type = 'info' }: CountdownToastProps) {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    if (countdown <= 0) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const progress = ((initialCountdown - countdown) / initialCountdown) * 100;

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getIcon()}</span>
        <span className="flex-1">{message}</span>
        <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full">
          <span className="text-sm font-bold text-white">{countdown}</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Enhanced toast utilities with duplicate prevention
let lastBanToastTime = 0;
const TOAST_COOLDOWN = 5000; // 5 seconds cooldown

export const showBanToast = (onComplete?: () => void) => {
  const now = Date.now();
  
  // Prevent duplicate ban toasts within cooldown period
  if (now - lastBanToastTime < TOAST_COOLDOWN) {
    console.log("🚫 Ban toast blocked - cooldown active");
    return;
  }
  
  lastBanToastTime = now;
  
  toast.error(
    <CountdownToast
      message="You are being banned by ADMIN due to abuse policy"
      countdown={3}
      onComplete={onComplete}
      type="error"
    />,
    {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      className: "toast-enhanced-slide-in toast-error-enhanced",
      toastId: "ban-toast", // Prevent duplicate toasts with same ID
    }
  );
};

export const showUnbanToast = (onComplete?: () => void) => {
  toast.success(
    <CountdownToast
      message="You have been unbanned. Welcome back!"
      countdown={3}
      onComplete={onComplete}
      type="success"
    />,
    {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      className: "toast-enhanced-slide-in toast-success-enhanced",
      toastId: "unban-toast", // Prevent duplicate toasts with same ID
    }
  );
};

export const showProcessingToast = (message: string = "Processing...", duration: number = 2000) => {
  toast.info(message, {
    position: "top-right",
    autoClose: duration,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: false,
    className: "toast-enhanced-slide-in toast-info-enhanced",
  });
};

export const showAdminActionToast = (action: 'ban' | 'unban', targetCount: number, onComplete?: () => void) => {
  const message = action === 'ban'
    ? `Banning ${targetCount} visitor${targetCount > 1 ? 's' : ''}...`
    : `Unbanning ${targetCount} visitor${targetCount > 1 ? 's' : ''}...`;

  toast.warning(
    <CountdownToast
      message={message}
      countdown={3}
      onComplete={onComplete}
      type="warning"
    />,
    {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      className: "toast-enhanced-slide-in toast-warning-enhanced",
      toastId: `admin-${action}-toast`, // Prevent duplicate toasts with same ID
    }
  );
};

// Base toast configuration for consistent behavior
const defaultToastConfig: Partial<ToastOptions> = {
  position: "top-right",
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  className: "toast-enhanced-slide-in",
};

export const showSuccessToast = (message: string, options?: Partial<ToastOptions>) => {
  toast.success(message, {
    ...defaultToastConfig,
    autoClose: 3000,
    className: "toast-enhanced-slide-in toast-success-enhanced",
    ...options
  });
};

export const showErrorToast = (message: string, options?: Partial<ToastOptions>) => {
  toast.error(message, {
    ...defaultToastConfig,
    autoClose: 5000,
    className: "toast-enhanced-slide-in toast-error-enhanced",
    ...options
  });
};

export const showWarningToast = (message: string, options?: Partial<ToastOptions>) => {
  toast.warning(message, {
    ...defaultToastConfig,
    autoClose: 4000,
    className: "toast-enhanced-slide-in toast-warning-enhanced",
    ...options
  });
};

export const showInfoToast = (message: string, options?: Partial<ToastOptions>) => {
  toast.info(message, {
    ...defaultToastConfig,
    autoClose: 3000,
    className: "toast-enhanced-slide-in toast-info-enhanced",
    ...options
  });
};

// Legacy compatibility functions (migrated from utils/toastUtils.js)
export const showGenericSuccess = (message: string, options?: Partial<ToastOptions>) => {
  showSuccessToast(message, options);
};

export const showGenericError = (message: string, options?: Partial<ToastOptions>) => {
  showErrorToast(message, options);
};

// Enhanced Toast Provider with unified configuration
export default function EnhancedToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={true}
      pauseOnHover={true}
      theme="light"
      className="toast-container-enhanced"
      style={{
        fontSize: '14px',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif'
      }}
    />
  );
}

// Enhanced toast system with unified styling
// All custom styles are now in globals.css for better performance and consistency