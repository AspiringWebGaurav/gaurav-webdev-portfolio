"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, XCircle, AlertTriangle, FileText, X } from "lucide-react";

type ErrorSeverity = "warning" | "error" | "critical";

interface ErrorDetails {
  message: string;
  severity: ErrorSeverity;
  phase: "discovery" | "broadcast" | "countdown";
  canRetry: boolean;
  suggestedAction?: string;
}

interface AuditLog {
  timestamp: number;
  phase: string;
  action: string;
  duration?: number;
  error?: string;
}

interface ErrorDisplayProps {
  errorDetails: ErrorDetails;
  auditLog: AuditLog[];
  onRetry: () => void;
  onReset: () => void;
  retryCount: number;
  maxRetries: number;
}

export default function ErrorDisplay({
  errorDetails,
  auditLog,
  onRetry,
  onReset,
  retryCount,
  maxRetries,
}: ErrorDisplayProps) {
  const [showLogs, setShowLogs] = React.useState(false);

  const getSeverityColor = () => {
    switch (errorDetails.severity) {
      case "critical":
        return "from-red-500 to-red-600";
      case "error":
        return "from-orange-500 to-red-500";
      case "warning":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getSeverityIcon = () => {
    switch (errorDetails.severity) {
      case "critical":
        return <XCircle className="w-8 h-8 text-white" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-white" />;
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-white" />;
      default:
        return <AlertCircle className="w-8 h-8 text-white" />;
    }
  };

  const getPhaseLabel = () => {
    switch (errorDetails.phase) {
      case "discovery":
        return "Connection Discovery";
      case "broadcast":
        return "Broadcast Operation";
      case "countdown":
        return "Client Countdown";
      default:
        return "Operation";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getSeverityColor()} px-6 py-4`}>
        <div className="flex items-center gap-3">
          {getSeverityIcon()}
          <div>
            <h3 className="text-xl font-bold text-white">
              {errorDetails.severity === "critical" ? "Critical Error" : "Operation Failed"}
            </h3>
            <p className="text-sm text-white/90">Failed during: {getPhaseLabel()}</p>
          </div>
        </div>
      </div>

      {/* Error Body */}
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Error Message */}
          <div className="mb-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-base font-semibold text-red-900 mb-1">Error Details</p>
              <p className="text-sm text-red-800">{errorDetails.message}</p>
            </div>
          </div>

          {/* Suggested Action */}
          {errorDetails.suggestedAction && (
            <div className="mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">💡 Suggested Action</p>
                <p className="text-sm text-blue-800">{errorDetails.suggestedAction}</p>
              </div>
            </div>
          )}

          {/* Retry Info */}
          {errorDetails.canRetry && (
            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  <strong>Retry attempts:</strong> {retryCount} of {maxRetries}
                </p>
              </div>
            </div>
          )}

          {/* Audit Logs */}
          <div className="mb-6">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {showLogs ? "Hide" : "View"} Audit Logs ({auditLog.length} entries)
            </button>

            {showLogs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-4 bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto"
              >
                {auditLog.map((log, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-gray-300 py-1 border-b border-gray-700 last:border-0"
                  >
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {" "}
                    <span className="text-cyan-400">[{log.phase}]</span>
                    {" "}
                    <span className="text-gray-200">{log.action}</span>
                    {log.error && (
                      <span className="text-red-400"> ❌ {log.error}</span>
                    )}
                    {log.duration && (
                      <span className="text-green-400"> ({log.duration}ms)</span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <X className="w-4 h-4 inline mr-2" />
              Cancel
            </button>

            {errorDetails.canRetry && retryCount < maxRetries && (
              <button
                onClick={onRetry}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Operation
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
