"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import LiveActiveUserCount from "@/components/admin/LiveActiveUserCount";

export default function LiveUsersPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Active User Count</h1>
                <p className="text-sm text-gray-600 mt-0.5">Real-time user activity monitoring</p>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.push("/admin/rights/operations")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Operations Hub</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <LiveActiveUserCount />
        </motion.div>
      </div>

      {/* Info Footer */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Admin-Only Access</p>
              <p className="text-xs text-blue-700 mt-1">
                This page contains sensitive system operations and is only accessible to authorized administrators.
                All actions are logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
