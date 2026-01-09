"use client";

import React from "react";
import { Wrench } from "lucide-react";
import { motion } from "framer-motion";
import MaintenanceControl from "@/components/admin/MaintenanceControl";

export default function MaintenanceModePage() {
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
            <div className="p-3 rounded-lg bg-purple-50">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Mode</h1>
          </div>
          <p className="text-gray-600 ml-[60px]">
            Control site-wide maintenance mode and display custom messages to visitors
          </p>
        </div>

        {/* Maintenance Control Component */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <MaintenanceControl />
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> When maintenance mode is enabled, all visitors except admins will see the maintenance page.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
