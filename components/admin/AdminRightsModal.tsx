"use client";
import React from "react";
import { X, Shield, Wrench } from "lucide-react";
import MaintenanceControl from "./MaintenanceControl";

interface AdminRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminRightsModal({ isOpen, onClose }: AdminRightsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] m-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Admin Rights Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Maintenance Mode Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Maintenance Mode</h3>
            </div>
            <MaintenanceControl />
          </div>

          {/* Future Features Placeholder */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Coming Soon:</strong> User roles, access permissions, and more admin controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
