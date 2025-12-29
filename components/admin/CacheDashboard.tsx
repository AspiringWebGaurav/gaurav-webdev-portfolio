"use client";

import React from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Users,
  Monitor,
  Trash2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ClearPhase = 'idle' | 'client' | 'broadcast' | 'verify' | 'complete' | 'error';
type OperationStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

interface Operation {
  id: string;
  name: string;
  description: string;
  status: OperationStatus;
  duration?: number;
  error?: string;
}

interface CacheDashboardProps {
  phase: ClearPhase;
  operations: Operation[];
  results: {
    identityCleared: number;
    uuidCleared: number;
    browserCachesCleared: string[];
    broadcastSuccess: boolean;
    notifiedTabs: number;
    databaseVerified: boolean;
    errors: Array<{ code: string; message: string; severity: string }>;
  } | null;
  onBack: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export default function CacheDashboard({
  phase,
  operations,
  results,
  onBack,
  onRetry,
  onClose,
}: CacheDashboardProps) {
  const isComplete = phase === 'complete';
  const hasErrors = phase === 'error' || (results?.errors && results.errors.length > 0);

  const getPhaseIcon = (status: OperationStatus) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'skipped':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getPhaseColor = (status: OperationStatus) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'skipped':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Cache Clear Dashboard</h3>
          <p className="text-sm text-gray-600 mt-1">
            {phase === 'idle' && 'Preparing to clear caches...'}
            {phase === 'client' && 'Clearing client-side caches...'}
            {phase === 'broadcast' && 'Broadcasting to all tabs...'}
            {phase === 'verify' && 'Verifying database integrity...'}
            {phase === 'complete' && 'Cache clear completed!'}
            {phase === 'error' && 'Errors encountered during cache clear'}
          </p>
        </div>
        {isComplete && !hasErrors && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-green-600"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
        )}
        {hasErrors && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-red-600"
          >
            <XCircle className="w-12 h-12" />
          </motion.div>
        )}
      </div>

      {/* Operations Progress */}
      <div className="space-y-3">
        {operations.map((op, index) => (
          <motion.div
            key={op.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-lg p-4 transition-all ${getPhaseColor(op.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{getPhaseIcon(op.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{op.name}</h4>
                    {op.duration && (
                      <span className="text-xs text-gray-500">({op.duration}ms)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{op.description}</p>
                  {op.error && (
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      Error: {op.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Results Summary */}
      {results && isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5"
        >
          <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Clear Results
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-medium text-gray-600">Identity Cache</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {results.identityCleared.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">entries cleared</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-gray-600">UUID Cache</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {results.uuidCleared.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">entries cleared</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <Monitor className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-gray-600">Browser Caches</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {results.browserCachesCleared.length}
              </p>
              <p className="text-xs text-gray-500">caches cleared</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-orange-600" />
                <p className="text-xs font-medium text-gray-600">Active Tabs</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {results.notifiedTabs}
              </p>
              <p className="text-xs text-gray-500">tabs notified</p>
            </div>
          </div>

          {/* Database Verification */}
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center gap-2">
              {results.databaseVerified ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Database integrity verified - All visitor data preserved
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">
                    Database verification skipped
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Details */}
      {results?.errors && results.errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-300 rounded-lg p-4"
        >
          <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Errors Encountered ({results.errors.length})
          </h4>
          <div className="space-y-2">
            {results.errors.map((error, index) => (
              <div
                key={index}
                className="bg-white border border-red-200 rounded p-3"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      error.severity === 'critical'
                        ? 'bg-red-600 text-white'
                        : error.severity === 'high'
                        ? 'bg-red-500 text-white'
                        : error.severity === 'medium'
                        ? 'bg-orange-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {error.severity.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="font-mono text-xs text-gray-600">{error.code}</p>
                    <p className="text-sm text-gray-800 mt-1">{error.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-between pt-4 border-t border-gray-200">
        {!isComplete && !hasErrors && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        {hasErrors && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Cache Clear
          </button>
        )}
        {isComplete && (
          <button
            onClick={onClose}
            className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Done
          </button>
        )}
      </div>
    </motion.div>
  );
}
