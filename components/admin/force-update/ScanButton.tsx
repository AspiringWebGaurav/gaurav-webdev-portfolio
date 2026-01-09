"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Wifi } from "lucide-react";

interface ScanButtonProps {
  onScan: () => void;
  disabled?: boolean;
}

export default function ScanButton({ onScan, disabled = false }: ScanButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Wifi className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Step 1: Discover Live Connections
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Scan for all active portfolio tabs across devices. This discovery process takes about 5 seconds 
          and uses a 3-layer detection system to find every live connection.
        </p>

        {/* Info Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
          <Search className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Real-time ping-pong detection
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onScan}
          disabled={disabled}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Search className="w-6 h-6" />
          <span>Start Scanning</span>
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Safe operation - no changes will be made until final confirmation
        </p>
      </div>
    </motion.div>
  );
}
