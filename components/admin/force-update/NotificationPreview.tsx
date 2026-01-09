"use client";

import React from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { ScanResults } from "./LiveConnectionsResults";

interface NotificationPreviewProps {
  scanResults: ScanResults;
  onConfirm: () => void;
  onBack: () => void;
}

export default function NotificationPreview({
  scanResults,
  onConfirm,
  onBack,
}: NotificationPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Preview notification before sending</h3>
            <p className="text-sm text-purple-50">What users will see on their screen</p>
          </div>
        </div>
      </div>

      {/* Preview Body - Simple confirmation */}
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 shadow-lg">
              <Send className="w-10 h-10 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              Ready to send notifications?
            </p>
            <p className="text-base text-gray-600">
              This will immediately notify <strong>{scanResults.totalUsers} connection{scanResults.totalUsers > 1 ? 's' : ''}</strong> and trigger forced reload
            </p>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-900 font-medium">
              ⚠️ This action cannot be undone. All users will see a countdown and their browser will reload.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-6 py-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
        >
          Go Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send className="w-6 h-6" />
          <span>Send Notification & Trigger Update</span>
        </button>
      </div>
    </motion.div>
  );
}
