"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface LoadingErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface LoadingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const LoadingErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  const isLoadingContextError = error.message?.includes('useLoading must be used within a LoadingProvider');
  
  if (isLoadingContextError) {
    // Silent fallback for loading context errors - just render without loading functionality
    console.warn('[LoadingErrorBoundary] Loading context not available, using fallback mode');
    return null; // Let the component render without loading context
  }

  // For other errors, show a more visible fallback
  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 m-2">
      <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
        <span className="text-lg">⚠️</span>
        <span className="font-medium">Loading System Error</span>
      </div>
      <p className="text-red-300 text-xs mb-3">
        {error.message || 'An error occurred in the loading system'}
      </p>
      <button
        onClick={resetError}
        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 text-xs transition-colors duration-200"
      >
        Retry
      </button>
    </div>
  );
};

export class LoadingErrorBoundary extends Component<
  LoadingErrorBoundaryProps,
  LoadingErrorBoundaryState
> {
  constructor(props: LoadingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LoadingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LoadingErrorBoundary] Caught error:', error);
    console.error('[LoadingErrorBoundary] Error info:', errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <LoadingErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components that use loading context
export const withLoadingErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <LoadingErrorBoundary fallback={fallback}>
      <Component {...props} />
    </LoadingErrorBoundary>
  );

  WrappedComponent.displayName = `withLoadingErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default LoadingErrorBoundary;