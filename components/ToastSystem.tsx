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
      message="🚫 You are being banned by ADMIN due to abuse policy"
      countdown={3}
      onComplete={onComplete}
      type="error"
    />,
    {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      className: "bg-red-50 border-l-4 border-red-500",
      toastId: "ban-toast", // Prevent duplicate toasts with same ID
    }
  );
};

export const showUnbanToast = (onComplete?: () => void) => {
  toast.success(
    <CountdownToast
      message="🎉 You have been unbanned. Welcome back!"
      countdown={3}
      onComplete={onComplete}
      type="success"
    />,
    {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      className: "bg-green-50 border-l-4 border-green-500",
      toastId: "unban-toast", // Prevent duplicate toasts with same ID
    }
  );
};

export const showProcessingToast = (message: string = "⏳ Processing...", duration: number = 2000) => {
  toast.info(message, {
    position: "top-center",
    autoClose: duration,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: false,
    className: "bg-blue-50 border-l-4 border-blue-500",
  });
};

export const showAdminActionToast = (action: 'ban' | 'unban', targetCount: number, onComplete?: () => void) => {
  const message = action === 'ban'
    ? `🔨 Banning ${targetCount} visitor${targetCount > 1 ? 's' : ''}...`
    : `🔓 Unbanning ${targetCount} visitor${targetCount > 1 ? 's' : ''}...`;

  toast.warning(
    <CountdownToast
      message={message}
      countdown={3}
      onComplete={onComplete}
      type="warning"
    />,
    {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      className: "bg-yellow-50 border-l-4 border-yellow-500",
      toastId: `admin-${action}-toast`, // Prevent duplicate toasts with same ID
    }
  );
};

export const showSuccessToast = (message: string) => {
  toast.success(`✅ ${message}`, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-green-50 border-l-4 border-green-500",
  });
};

export const showErrorToast = (message: string) => {
  toast.error(`❌ ${message}`, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-red-50 border-l-4 border-red-500",
  });
};

export const showWarningToast = (message: string) => {
  toast.warning(`⚠️ ${message}`, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-yellow-50 border-l-4 border-yellow-500",
  });
};

export const showInfoToast = (message: string) => {
  toast.info(`ℹ️ ${message}`, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "bg-blue-50 border-l-4 border-blue-500",
  });
};

// Enhanced Toast Provider with custom styling
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
      className="toast-container"
      style={{
        fontSize: '14px',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif'
      }}
    />
  );
}

// Custom CSS for enhanced styling (to be added to globals.css)
export const toastStyles = `
.toast-container {
  z-index: 9999;
}

.toast-item {
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toast-body {
  padding: 16px;
  font-weight: 500;
}

.toast-progress {
  height: 3px;
  border-radius: 0 0 12px 12px;
}

.Toastify__toast--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.Toastify__toast--error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.Toastify__toast--warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.Toastify__toast--info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.Toastify__close-button {
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.8;
}

.Toastify__close-button:hover {
  opacity: 1;
}
`;