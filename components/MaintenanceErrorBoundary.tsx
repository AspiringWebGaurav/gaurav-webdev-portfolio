'use client';

/**
 * Maintenance Error Boundary
 * Catches all errors in maintenance page and shows graceful fallback
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class MaintenanceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Maintenance Error Boundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-black-100 text-white overflow-hidden flex items-center justify-center">
          {/* Grid background */}
          <div className="absolute inset-0 bg-grid-white/[0.02]">
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-md text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500/60"
            >
              <AlertTriangle className="w-10 h-10 text-yellow-500" />
            </motion.div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
                Under Maintenance
              </h1>
              <p className="text-white/70 text-lg">
                We're currently performing scheduled maintenance
              </p>
            </div>

            {/* Message */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white/60 text-sm">
                Our portfolio is temporarily unavailable while we make improvements. 
                Please check back in a few minutes.
              </p>
            </div>

            {/* Refresh button */}
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-purple/20 hover:bg-purple/30 border border-purple/40 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Page</span>
            </motion.button>

            {/* Footer */}
            <div className="text-white/40 text-xs">
              If this issue persists, please contact support
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
