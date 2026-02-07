"use client";

import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './toast-custom.css';
import { Component, ReactNode } from 'react';

// Error boundary for toast to prevent removalReason errors
class ToastErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ToastProvider] Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Fail silently for toasts
    }
    return this.props.children;
  }
}

export default function ToastProvider() {
  return (
    <ToastErrorBoundary>
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
        transition={Bounce}
        limit={3}
        stacked
        style={{
          top: '5rem',
          right: '1rem',
          zIndex: 99999,
        }}
      />
    </ToastErrorBoundary>
  );
}
