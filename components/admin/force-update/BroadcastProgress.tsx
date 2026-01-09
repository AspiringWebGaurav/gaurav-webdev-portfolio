"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Radio, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface BroadcastProgressProps {
  status: string;
  progress: number;
  countdown?: number; // Optional countdown for client reload phase
}

export default function BroadcastProgress({ status, progress, countdown }: BroadcastProgressProps) {
  const [dots, setDots] = useState("");

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <div>
            <h3 className="text-xl font-bold text-white">Broadcasting Update</h3>
            <p className="text-sm text-orange-50">Sending notifications to all connections</p>
          </div>
        </div>
      </div>

      {/* Progress Body */}
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Live Status */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full mb-4">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="font-semibold text-sm">LIVE</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {status}{dots}
            </p>
            
            {/* Show countdown if in client reload phase */}
            {countdown !== undefined && countdown > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 inline-flex items-center gap-3 px-6 py-3 bg-orange-100 border-2 border-orange-300 rounded-xl"
              >
                <Clock className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <p className="text-xs text-orange-700 font-medium">Clients are seeing countdown</p>
                  <p className="text-2xl font-bold text-orange-900">{countdown}s</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-orange-600">{progress}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              />
            </div>
          </div>

          {/* Status Steps */}
          <div className="space-y-3">
            <StatusStep 
              label="Authenticating" 
              completed={progress > 10}
              active={progress <= 10 && progress > 0}
            />
            <StatusStep 
              label="Broadcasting to clients via 3-layer system" 
              completed={progress > 40}
              active={progress > 10 && progress <= 40}
            />
            <StatusStep 
              label="Clients showing countdown (10 seconds)" 
              completed={progress > 80}
              active={progress > 40 && progress <= 80}
            />
            <StatusStep 
              label="Confirming browser reloads" 
              completed={progress > 95}
              active={progress > 80 && progress <= 95}
            />
            <StatusStep 
              label="Finalizing" 
              completed={progress >= 100}
              active={progress > 95 && progress < 100}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatusStep({ label, completed, active }: { label: string; completed: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {completed ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
      ) : active ? (
        <Loader2 className="w-5 h-5 text-orange-500 animate-spin flex-shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
      )}
      <span className={`text-sm font-medium ${
        completed ? "text-green-700" : active ? "text-orange-700" : "text-gray-500"
      }`}>
        {label}
      </span>
    </div>
  );
}
