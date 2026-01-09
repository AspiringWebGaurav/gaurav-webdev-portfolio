"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, Activity, ArrowRight, X, Layers } from "lucide-react";

export interface ScanResults {
  totalUsers: number;
  discoveryMethod: string;
  discoveryDuration: number;
  userIds: string[];
  timestamp: number;
}

interface LiveConnectionsResultsProps {
  results: ScanResults;
  onContinue: () => void;
  onCancel: () => void;
}

export default function LiveConnectionsResults({
  results,
  onContinue,
  onCancel,
}: LiveConnectionsResultsProps) {
  const getDiscoveryMethodLabel = (method: string) => {
    switch (method) {
      case 'ping_pong_primary':
        return { label: 'Layer 1 - Primary', color: 'green', icon: '🎯' };
      case 'admin_pings_fallback':
        return { label: 'Layer 2 - Fallback', color: 'blue', icon: '🔄' };
      case 'analytics_last_resort':
        return { label: 'Layer 3 - Analytics', color: 'purple', icon: '📊' };
      default:
        return { label: 'Unknown Method', color: 'gray', icon: '❓' };
    }
  };

  const methodInfo = getDiscoveryMethodLabel(results.discoveryMethod);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Step 2: Scan Complete</h3>
            <p className="text-sm text-green-50">Live connections discovered successfully</p>
          </div>
        </div>
      </div>

      {/* Results Body */}
      <div className="p-6 space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Connections */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Live Connections</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{results.totalUsers}</p>
            <p className="text-xs text-blue-700 mt-1">Active tabs found</p>
          </div>

          {/* Discovery Method */}
          <div className={`bg-gradient-to-br from-${methodInfo.color}-50 to-${methodInfo.color}-50 border border-${methodInfo.color}-200 rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-900">Discovery Method</span>
            </div>
            <p className="text-sm font-bold text-gray-800">{methodInfo.icon} {methodInfo.label}</p>
            <p className="text-xs text-gray-600 mt-1">Detection layer used</p>
          </div>

          {/* Duration */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Scan Duration</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{results.discoveryDuration}s</p>
            <p className="text-xs text-purple-700 mt-1">Discovery time</p>
          </div>
        </div>

        {/* Connection Preview */}
        {results.totalUsers > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Connection Sample
            </h4>
            <div className="space-y-2">
              {results.userIds.slice(0, 3).map((id, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-mono text-gray-600">{id.substring(0, 16)}...</span>
                </div>
              ))}
              {results.totalUsers > 3 && (
                <p className="text-xs text-gray-500 mt-2">
                  + {results.totalUsers - 3} more connection{results.totalUsers - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* No connections message */}
        {results.totalUsers === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-900 font-medium">
              ℹ️ No active connections found
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              There are currently no live portfolio tabs to update
            </p>
          </div>
        )}

        {/* Next Steps Info */}
        {results.totalUsers > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Next Step:</strong> Continue to preview the notification that will be sent to these {results.totalUsers} connection{results.totalUsers > 1 ? 's' : ''}.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-6 py-4 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={onContinue}
          disabled={results.totalUsers === 0}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>Continue to Preview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
