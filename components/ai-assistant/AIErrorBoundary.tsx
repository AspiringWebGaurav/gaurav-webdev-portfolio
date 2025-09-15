"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { prodLogger, devLogger } from '@/utils/secureLogger';
import JarvisAnimations from './JarvisAnimations';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class AIErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    prodLogger.error('AI Assistant Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    devLogger.error('AI Assistant Error Details', {
      error,
      errorInfo
    });

    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      devLogger.debug(`Retrying AI Assistant (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    devLogger.debug('Resetting AI Assistant error boundary');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Auto-retry after a delay if we haven't exceeded max retries
    if (this.state.hasError && !prevState.hasError && this.state.retryCount < this.maxRetries) {
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 2000 * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default fallback UI
      return (
        <div className="fixed top-1/2 right-4 sm:right-6 -translate-y-1/2 z-40">
          <div className="bg-black-100/95 backdrop-blur-md border border-red-500/50 rounded-2xl p-6 max-w-sm shadow-2xl">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Assistant Error</h3>
                <p className="text-gray-400 text-sm">Something went wrong</p>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-2">
                The AI assistant encountered an unexpected error and needs to restart.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                    Error Details (Dev Mode)
                  </summary>
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300 font-mono">
                    <div className="mb-1 font-semibold">{this.state.error.name}:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <div className="text-xs opacity-75 max-h-32 overflow-y-auto">
                        {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              {this.state.retryCount < this.maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Retry ({this.maxRetries - this.state.retryCount} left)
                </button>
              ) : (
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Reset Assistant
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 rounded-lg text-gray-400 text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Reload Page
              </button>
            </div>

            {/* Retry Progress */}
            {this.state.retryCount > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <JarvisAnimations isActive={true} size="small" color="cyan" intensity="low" />
                  <span>Retry attempt {this.state.retryCount}/{this.maxRetries}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withAIErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <AIErrorBoundary fallbackComponent={fallbackComponent}>
      <Component {...props} />
    </AIErrorBoundary>
  );

  WrappedComponent.displayName = `withAIErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default AIErrorBoundary;