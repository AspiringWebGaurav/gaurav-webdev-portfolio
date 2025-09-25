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

class AskDirectlyErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 2000;
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
    return {
      hasError: true,
      error: error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    smartLogger.error('Ask Directly component crashed', {
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
      /unavailable/i,
      /import/i,
      /module/i,
      /chunk/i,
      /loading/i
    ];

    return recoverableErrorPatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private scheduleRetry = (): void => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const delay = this.retryDelay * Math.pow(2, this.state.retryCount - 1);

    this.retryTimer = setTimeout(() => {
      smartLogger.browserOnly.debug('Attempting to recover Ask Directly', {
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
    smartLogger.browserOnly.debug('Manual retry of Ask Directly');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isRetrying = this.retryTimer !== null;

      return (
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 className="text-white text-lg font-semibold mb-2">
            Ask Directly Error
          </h3>

          <p className="text-gray-400 text-sm mb-4 max-w-sm">
            The Ask Directly feature encountered an error and needs to restart.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {canRetry && !isRetrying && (
              <button
                onClick={this.handleManualRetry}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Retry ({this.maxRetries - this.state.retryCount} left)
              </button>
            )}

            {isRetrying && (
              <div className="flex items-center justify-center px-4 py-2 bg-blue-500/50 text-white rounded-lg text-sm font-medium">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Retrying...
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Reload Page
            </button>
          </div>

          {this.state.retryCount > 0 && (
            <div className="mt-4 flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2" />
              Retry attempt {this.state.retryCount}/{this.maxRetries}
            </div>
          )}

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 max-w-lg">
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

export default AskDirectlyErrorBoundary;

// Export HOC for easy usage
export const withAskDirectlyErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <AskDirectlyErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AskDirectlyErrorBoundary>
  );

  WrappedComponent.displayName = `withAskDirectlyErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};