/**
 * Error Boundary for Visitor Analytics
 * Catches and handles errors gracefully with retry capability
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class VisitorAnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ VisitorAnalytics Error Boundary caught an error:', error, errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to external error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      console.error('[Production Error]', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page if too many errors
    if (this.state.errorCount >= 3) {
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorCount } = this.state;
      const { fallbackMessage = 'Something went wrong loading visitor analytics' } = this.props;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-red-900 mb-2">
              {fallbackMessage}
            </h2>
            
            <p className="text-sm text-red-700 mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>

            {errorCount >= 3 && (
              <p className="text-xs text-red-600 mb-4 font-medium">
                Multiple errors detected. A page reload may help.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              {errorCount >= 2 && (
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-white text-red-700 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  Reload Page
                </button>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800 font-medium">
                  Technical Details (Dev Only)
                </summary>
                <pre className="mt-2 p-4 bg-red-100 rounded-lg text-xs text-red-900 overflow-auto max-h-48 border border-red-300">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VisitorAnalyticsErrorBoundary;
