"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, CheckCircle, Shield, Layers, AlertTriangle, Users, Zap } from "lucide-react";

export default function DocumentationHub() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-indigo-100/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-indigo-900">
              📚 Complete Documentation Hub
            </h3>
            <p className="text-sm text-indigo-700">
              {isExpanded ? 'Click to hide' : 'Click to view'} how the system works, user impact, and technical details
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-6 h-6 text-indigo-600" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t-2 border-indigo-200"
          >
            <div className="p-6 space-y-6">
              {/* What This Does */}
              <div>
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-base">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  What This Feature Does
                </h4>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  This feature sends a broadcast message to all active portfolio tabs, triggering an immediate browser reload. 
                  Users will see a beautiful countdown notification (10 seconds), then their browser will refresh automatically 
                  with the latest code version. Their scroll position is preserved throughout the process.
                </p>
              </div>

              {/* 3-Layer System */}
              <div className="bg-white/60 rounded-lg p-4 border border-indigo-200">
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-base">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  3-Layer Broadcast System
                </h4>
                <p className="text-sm text-indigo-800 mb-3">
                  The system uses 3 independent Firestore collections for maximum reliability:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-green-900">Layer 1 - Primary</p>
                      <p className="text-xs text-green-700">Collection: <span className="font-mono">admin_broadcasts</span> (Main channel)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900">Layer 2 - Fallback</p>
                      <p className="text-xs text-blue-700">Collection: <span className="font-mono">force_reload_fallback</span> (Backup channel)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-purple-900">Layer 3 - Last Resort</p>
                      <p className="text-xs text-purple-700">Collection: <span className="font-mono">system_commands</span> (Emergency channel)</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-indigo-700 mt-3">
                  If one layer fails, the next layer takes over automatically. All connected client browsers receive 
                  the reload command through real-time Firestore listeners.
                </p>
              </div>

              {/* User Experience */}
              <div>
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-indigo-600" />
                  User Experience
                </h4>
                <p className="text-sm text-indigo-800 mb-2">
                  When you trigger an update, here's what happens on the user's end:
                </p>
                <ul className="text-sm text-indigo-800 space-y-1.5 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">1.</span>
                    <span>Full-screen notification appears with 10-second countdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">2.</span>
                    <span>Scroll position is automatically saved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">3.</span>
                    <span>Browser reloads with cache cleared (fresh content)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">4.</span>
                    <span>Scroll position is restored on the new page</span>
                  </li>
                </ul>
              </div>

              {/* Smart Features */}
              <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-4">
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-base">
                  ⚡ Smart Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="text-xs text-indigo-800 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Real-time ping-pong detection finds only active tabs</span>
                  </div>
                  <div className="text-xs text-indigo-800 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Cache-busting ensures fresh content load</span>
                  </div>
                  <div className="text-xs text-indigo-800 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Keyboard locked during update (F5 blocked)</span>
                  </div>
                  <div className="text-xs text-indigo-800 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Scroll position automatically restored</span>
                  </div>
                  <div className="text-xs text-indigo-800 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Staggered batches prevent server overload</span>
                  </div>
                  <div className="text-xs text-indigo-800 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Auto-cleanup after 20 seconds (zero storage waste)</span>
                  </div>
                </div>
              </div>

              {/* When to Use */}
              <div>
                <h4 className="font-bold text-indigo-900 mb-3 text-base">When to Use This</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-indigo-200">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Critical Bug Fix Deployed</p>
                      <p className="text-xs text-gray-600">Push security fixes or critical patches immediately</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-indigo-200">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Feature Rollout</p>
                      <p className="text-xs text-gray-600">Ensure all users get new functionality without waiting</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-indigo-200">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Old Connections Not Responding</p>
                      <p className="text-xs text-gray-600">Force old tabs to reload and get latest listener code</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Warnings */}
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Important User Impact
                </h4>
                <ul className="text-sm text-orange-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>All open portfolio tabs will reload automatically within 10 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Users will see their browser refresh with a countdown notification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Any unsaved form data will be lost (warn users beforehand if possible)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Use this when you need to push critical updates immediately</span>
                  </li>
                </ul>
              </div>

              {/* Technical Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Admin-Only Access</p>
                      <p className="text-xs text-blue-700">
                        This operation is logged and only accessible to authorized administrators. Use responsibly.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-1">No Database Burn</p>
                      <p className="text-xs text-green-700">
                        Broadcast documents auto-delete after 20 seconds. No persistent storage or cost accumulation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
