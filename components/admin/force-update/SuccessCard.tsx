"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Users, Layers, RefreshCw, Clock } from "lucide-react";
import { BatchUpdateResult } from "@/types/batchUpdate";

interface SuccessCardProps {
  result: BatchUpdateResult;
  onReTrigger: () => void;
}

export default function SuccessCard({ result, onReTrigger }: SuccessCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-6">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Update Sent Successfully!</h3>
            <p className="text-sm text-green-50">All notifications delivered via broadcast system</p>
          </div>
        </div>
      </div>

      {/* Success Body */}
      <div className="p-6 space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Users Notified</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{result.totalUsers}</p>
            <p className="text-xs text-blue-700 mt-1">Active connections</p>
          </div>

          {/* Batches Sent */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Batches Sent</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{result.totalBatches}</p>
            <p className="text-xs text-purple-700 mt-1">Distribution waves</p>
          </div>

          {/* Layers Success */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Layer Status</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{result.successfulLayers}/3</p>
            <p className="text-xs text-green-700 mt-1">Channels operational</p>
          </div>
        </div>

        {/* Layer Status Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Broadcast Layer Status</h4>
          <div className="space-y-2">
            {result.layers && result.layers.map((layer, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  layer.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {layer.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    Layer {index + 1} - {layer.collection}
                  </span>
                </div>
                <span className={`text-xs font-semibold ${
                  layer.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {layer.success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Triggered at: {result.timestamp}</span>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-green-900">
            All connected browsers will reload within the next {result.totalBatches * 3 + 10} seconds
          </p>
          <p className="text-xs text-green-700 mt-1">
            Users will see a countdown notification before their browser refreshes
          </p>
        </div>

        {/* Re-trigger Option */}
        <div className="pt-2">
          <button
            onClick={onReTrigger}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="w-6 h-6" />
            <span>Trigger Another Update</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            This will automatically reset in 10 seconds
          </p>
        </div>
      </div>
    </motion.div>
  );
}
