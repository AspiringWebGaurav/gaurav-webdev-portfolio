"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isChunkError: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a chunk loading error
    const isChunkError =
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("Failed to load chunk") ||
      error.message.includes("ChunkLoadError") ||
      error.name === "ChunkLoadError";

    return {
      hasError: true,
      error,
      isChunkError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);

    // If it's a chunk error, attempt automatic recovery
    if (this.state.isChunkError) {
      console.log("Chunk loading error detected, attempting recovery...");

      // Clear any cached chunks
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name.includes("next")) {
              caches.delete(name);
            }
          });
        });
      }

      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          this.props.fallback || (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              <div className="max-w-md w-full mx-4 p-8 bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <h2 className="text-2xl font-bold text-white">
                    Updating Application...
                  </h2>
                  <p className="text-gray-400">
                    We detected an update. The page will refresh automatically
                    in a moment.
                  </p>
                  <p className="text-sm text-gray-500">
                    If this takes too long, please refresh manually.
                  </p>
                </div>
              </div>
            </div>
          )
        );
      }

      // For other errors, show generic error message
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="max-w-md w-full mx-4 p-8 bg-gray-800 rounded-lg border border-red-900/50 shadow-xl">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Something went wrong
                </h2>
                <p className="text-gray-400">
                  {this.state.error?.message || "An unexpected error occurred"}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
