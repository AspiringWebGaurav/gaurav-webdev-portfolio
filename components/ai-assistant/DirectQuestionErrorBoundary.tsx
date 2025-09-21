"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { smartLogger } from '@/utils/smartLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
}

class DirectQuestionErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error details
    smartLogger.error('🚨 Direct Question tab crashed', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Call the optional error callback
    this.props.onError?.(error, errorInfo);

    // Auto-retry if under the limit and error seems recoverable
    if (this.state.retryCount < this.maxRetries && this.isRecoverableError(error)) {
      this.scheduleRetry();
    }
  }

  private isRecoverableError(error: Error): boolean {
    const recoverableErrorPatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /connection/i,
      /firebase/i,
      /firestore/i,
      /permission-denied/i,
      /unavailable/i
    ];

    return recoverableErrorPatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private scheduleRetry = (): void => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const delay = this.retryDelay * Math.pow(2, this.state.retryCount - 1); // Exponential backoff

    this.retryTimer = setTimeout(() => {
      smartLogger.api.request('🔄 Attempting to recover Direct Question tab', {
        retryCount: this.state.retryCount,
        delay
      });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }, delay);
  };

  private handleManualRetry = (): void => {
    smartLogger.api.request('🔄 Manual retry of Direct Question tab');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  private handleReloadPage = (): void => {
    smartLogger.api.request('🔄 Page reload requested from Direct Question error');
    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isRetrying = this.retryTimer !== null;

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Error Title */}
          <h3 className="text-white text-lg font-semibold mb-2">
            AI Assistant Error
          </h3>

          {/* Error Message */}
          <p className="text-gray-400 text-sm mb-4 max-w-sm">
            Something went wrong
          </p>

          <p className="text-gray-500 text-xs mb-6 max-w-xs">
            The AI assistant encountered an unexpected error and needs to restart.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {canRetry && !isRetrying && (
              <button
                onClick={this.handleManualRetry}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 min-w-[120px]"
              >
                Retry ({this.maxRetries - this.state.retryCount} left)
              </button>
            )}

            {isRetrying && (
              <div className="flex items-center justify-center px-4 py-2 bg-blue-500/50 text-white rounded-lg text-sm font-medium min-w-[120px]">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Retrying...
              </div>
            )}

            <button
              onClick={this.handleReloadPage}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 min-w-[120px]"
            >
              Reload Page
            </button>
          </div>

          {/* Retry Attempt Indicator */}
          {this.state.retryCount > 0 && (
            <div className="mt-4 flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2" />
              Retry attempt {this.state.retryCount}/{this.maxRetries}
            </div>
          )}

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 max-w-lg">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                Show Error Details (Development Only)
              </summary>
              <div className="mt-2 p-3 bg-gray-800 rounded-lg text-left overflow-auto max-h-40">
                <div className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <div className="text-xs text-gray-500 font-mono mt-2 break-all">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default DirectQuestionErrorBoundary;

// Export a hook for manual error reporting
export const useErrorReporting = () => {
  const reportError = (error: Error, context?: string) => {
    smartLogger.error('🚨 Manual error report from Direct Question tab', {
      error: error.message,
      context: context || 'unknown',
      stack: error.stack
    });
  };

  return { reportError };
};

// Export a higher-order component for easy wrapping
export const withDirectQuestionErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <DirectQuestionErrorBoundary fallback={fallback}>
      <Component {...props} />
    </DirectQuestionErrorBoundary>
  );

  WrappedComponent.displayName = `withDirectQuestionErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};