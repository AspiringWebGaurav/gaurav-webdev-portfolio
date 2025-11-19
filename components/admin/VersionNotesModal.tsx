"use client";
import React from "react";
import VersionNotesManager from "./VersionNotesManager";
import { X } from "lucide-react";

interface VersionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionNotesModal({ isOpen, onClose }: VersionNotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] m-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl font-bold text-gray-900">Version Notes Manager</h2>
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
          <VersionNotesManager />
        </div>
      </div>
    </div>
  );
}
