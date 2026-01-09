/**
 * Suspension Mode Admin Page
 * 
 * Admin control panel for suspension mode
 * Red/danger themed to match suspension severity
 */

"use client";

import React from "react";
import { AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";
import SuspensionControl from "@/components/admin/SuspensionControl";

export default function SuspensionModePage() {
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
              <AlertOctagon className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Suspension Mode</h1>
          </div>
          <p className="text-gray-600 ml-[60px]">
            Temporarily suspend all services and redirect visitors to suspension page
          </p>
        </div>

        {/* Suspension Control Component */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SuspensionControl />
        </div>

        {/* Warning Section */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>⚠️ Warning:</strong> When suspension mode is enabled:
          </p>
          <ul className="text-sm text-amber-800 mt-2 ml-4 space-y-1 list-disc">
            <li>All visitors will be redirected to the suspension page</li>
            <li>Services will appear completely unavailable</li>
            <li>Chat bubble will remain functional for urgent contact</li>
            <li>Admin dashboard will remain accessible</li>
          </ul>
        </div>

        {/* Info Section */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Use this mode when you need to temporarily step away for personal reasons. Visitors will see a professional suspension message instead of broken functionality.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
