/**
 * Mobile Suspension Screen
 * 
 * Compact layout for small screens (<768px)
 * Non-scrollable, fixed viewport design
 * Optimized for touch interactions
 */

"use client";

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Clock, AlertCircle, MessageSquare, Timer, Calendar, User } from 'lucide-react';
import { Spotlight } from '@/components/ui/Spotlight';
import SuspensionWhatsAppWidget from '@/components/SuspensionWhatsAppWidget';
import { useChatBubbleControl } from '@/contexts/ChatBubbleControlContext';

interface SuspensionInfo {
  reason: string;
  estimatedDuration: number | null;
  enabledAt: Date | null;
  enabledBy: string | null;
}

interface MobileScreenProps {
  suspensionInfo: SuspensionInfo;
  onOpenChat?: () => void;
}

export default function MobileScreen({ suspensionInfo }: MobileScreenProps) {
  const { openBubble } = useChatBubbleControl();
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not specified';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Recently';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="h-screen w-screen bg-black-100 text-white overflow-hidden flex flex-col">
      {/* Spotlights */}
      <div className="absolute inset-0 pointer-events-none">
        <Spotlight className="-top-40 -left-10 h-screen" fill="white" />
        <Spotlight className="h-[80vh] w-[50vw] top-10 left-full" fill="red" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.03]">
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 py-6 min-h-0">
        
        <div className="flex flex-col items-center w-full max-w-sm">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-1 rounded-full border-2 border-red-500/50 bg-red-500/10 text-xs font-bold uppercase tracking-wider text-red-400 shadow-lg mb-5"
          >
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚠️ Suspended
            </motion.span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-5"
          >
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-white">Services</span>
              <br />
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Suspended
              </span>
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className="h-1 w-8 bg-gradient-to-r from-transparent to-red-500 rounded-full" />
              <div className="h-1.5 w-12 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-full" />
              <div className="h-1 w-8 bg-gradient-to-r from-red-500 to-transparent rounded-full" />
            </div>
          </motion.div>

          {/* Main Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full mb-5"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-2xl">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1">
                    Suspended by Gaurav
                  </h3>
                  <p className="text-white/60 text-xs">Portfolio owner</p>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed text-sm">
                {suspensionInfo.reason || 'All services are temporarily suspended due to personal reasons. I appreciate your understanding.'}
              </p>
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-3 w-full mb-5"
          >
            {/* Expected Duration */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white/60 text-xs font-medium mb-0.5">Expected Duration</p>
                  <p className="text-lg font-bold text-white">
                    {formatDuration(suspensionInfo.estimatedDuration)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Timer className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs font-medium mb-0.5">Status</p>
                    <p className="text-base font-bold text-red-400">Suspended By Owner</p>
                  </div>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <p className="text-white/70 mb-3 text-sm">Need to reach me?</p>
            <button
              onClick={() => openBubble('chat')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 via-red-600 to-orange-500 hover:from-red-600 hover:via-red-700 hover:to-orange-600 text-white font-bold rounded-lg shadow-xl hover:shadow-red-500/50 hover:scale-105 transform transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              Send Message
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer - One Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-full flex items-center justify-center gap-3 py-3 border-t border-white/10 flex-shrink-0 text-xs"
      >
        {/* Timestamp */}
        {suspensionInfo.enabledAt && (
          <div className="flex items-center gap-1.5 text-white/40">
            <Calendar className="w-3 h-3" />
            <span>Since {formatTimestamp(suspensionInfo.enabledAt)}</span>
          </div>
        )}
        
        <span className="text-white/20">•</span>
        
        {/* Admin Link - Low Profile */}
        <a
          href="/admin/login"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          Admin
        </a>
      </motion.div>

      {/* WhatsApp Widget */}
      <SuspensionWhatsAppWidget />
    </div>
  );
}
