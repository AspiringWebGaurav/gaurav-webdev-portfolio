// components/ErrorBoundaries.tsx
// Comprehensive error boundaries and fallback mechanisms

"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import devConsole from '@/utils/devConsole';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Main Error Boundary Component
export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    devConsole.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-slate-300 mb-6">
              We encountered an unexpected error. Please refresh the page to try again.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              Refresh Page
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-300 mb-2">
                  Development Details
                </summary>
                <div className="bg-slate-900/50 rounded-lg p-4 text-xs text-red-400 font-mono overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized Error Boundary for API/Session errors
export class SessionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    devConsole.error('Session Error Boundary caught an error:', error);
    
    this.setState({ error, errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-amber-400">Session Error</h3>
            </div>
            
            <p className="text-slate-300 mb-4">
              Unable to establish a secure session. This may be due to network connectivity or server issues.
            </p>
            
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Network Error Handler Component
export const NetworkErrorFallback: React.FC<{ 
  onRetry: () => void;
  message?: string;
}> = ({ onRetry, message = "Network connection error" }) => (
  <div className="flex items-center justify-center p-4">
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-sm w-full text-center">
      <div className="w-12 h-12 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-red-400 mb-2">Connection Error</h3>
      <p className="text-slate-300 text-sm mb-4">{message}</p>
      
      <button
        onClick={onRetry}
        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Retry Connection
      </button>
    </div>
  </div>
);

// Loading Error Handler
export const LoadingErrorFallback: React.FC<{ 
  onRetry?: () => void;
  message?: string;
}> = ({ onRetry, message = "Failed to load content" }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
        </svg>
      </div>
      
      <p className="text-slate-400 mb-4">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

export default AppErrorBoundary;