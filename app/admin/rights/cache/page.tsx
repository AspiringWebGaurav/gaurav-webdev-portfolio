"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import CacheClearControl from "@/components/admin/CacheClearControl";

export default function CacheManagementPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-red-50">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Cache Management</h1>
          </div>
          <p className="text-gray-600 ml-[60px]">
            Clear application cache to resolve issues or force data refresh
          </p>
        </div>

        {/* Cache Control Component */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <CacheClearControl />
        </div>

        {/* Warning Section */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> Clearing cache will remove all cached data and may temporarily slow down the application.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
