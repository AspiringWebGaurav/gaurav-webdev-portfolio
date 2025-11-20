"use client";

/**
 * Bug Report Intro Modal
 * Shows information about bug reporting before opening the actual form
 * Fully responsive with non-scrollable mobile design
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Bug, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BugReportForm from "./BugReportForm";

interface BugReportIntroProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenForm: () => void;
}

export default function BugReportIntro({ isOpen, onClose, onOpenForm }: BugReportIntroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenForm = () => {
    onClose(); // Close intro modal
    onOpenForm(); // Open the form
  };

  if (!mounted) return null;

  return (
    <>
      {isOpen && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key="bug-intro-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              key="bug-intro-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-black-100 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 24px)' }}
            >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple/10 to-blue/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Bug className="w-5 h-5 sm:w-6 sm:h-6 text-purple" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Bug Hunt</h2>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  Help us improve by reporting issues
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable on mobile if needed, but optimized to fit */}
          <div className="overflow-y-auto p-4 sm:p-8" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {/* Main description */}
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Found a bug? Help us improve! Report issues, upload screenshots, and track your submissions.
              </p>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-black-200 to-black-100 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                {/* Info */}
                <div className="text-center w-full">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                    Report a Bug
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    Help us squash bugs! Your feedback makes this site better for everyone.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                    <li key="describe" className="flex items-center gap-2 justify-center">
                      <div className="w-1.5 h-1.5 bg-purple rounded-full flex-shrink-0" />
                      <span>Describe the issue with steps to reproduce</span>
                    </li>
                    <li key="upload" className="flex items-center gap-2 justify-center">
                      <div className="w-1.5 h-1.5 bg-purple rounded-full flex-shrink-0" />
                      <span>Upload screenshots to help us understand</span>
                    </li>
                    <li key="track" className="flex items-center gap-2 justify-center">
                      <div className="w-1.5 h-1.5 bg-purple rounded-full flex-shrink-0" />
                      <span>Get a reference ID to track your report</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="flex flex-col items-center gap-2 sm:gap-3 w-full">
                  <button
                    onClick={handleOpenForm}
                    className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-purple hover:bg-purple/80 text-white rounded-lg transition-all font-semibold text-base sm:text-lg shadow-lg hover:shadow-purple/50 hover:scale-105"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Bug className="w-4 h-4 sm:w-5 sm:h-5" />
                      Report a Bug
                    </span>
                  </button>
                  <p className="text-xs text-gray-500">
                    Anonymous reports are welcome
                  </p>
                </div>
              </div>
            </div>

            {/* Info Cards - Optimized for mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-black-200 border border-white/10 rounded-lg p-4 sm:p-5 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple" />
                </div>
                <h4 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Quick Response</h4>
                <p className="text-xs sm:text-sm text-gray-400">
                  Critical bugs are reviewed immediately
                </p>
              </div>
              <div className="bg-black-200 border border-white/10 rounded-lg p-4 sm:p-5 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Bug className="w-4 h-4 sm:w-5 sm:h-5 text-purple" />
                </div>
                <h4 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Track Progress</h4>
                <p className="text-xs sm:text-sm text-gray-400">
                  Save your reference ID to check status
                </p>
              </div>
              <div className="bg-black-200 border border-white/10 rounded-lg p-4 sm:p-5 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-purple"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Secure & Private</h4>
                <p className="text-xs sm:text-sm text-gray-400">
                  Your data is protected and confidential
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
