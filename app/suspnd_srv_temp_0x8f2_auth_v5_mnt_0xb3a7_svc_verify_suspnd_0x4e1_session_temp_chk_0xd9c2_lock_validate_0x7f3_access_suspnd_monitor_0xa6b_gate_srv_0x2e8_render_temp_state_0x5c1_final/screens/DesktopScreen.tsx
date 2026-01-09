/**
 * Desktop Suspension Screen
 * 
 * Full layout for large screens (1024px+)
 * Non-scrollable, fixed viewport design
 * Inspired by maintenance and ban page layouts
 */

"use client";

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Clock, AlertCircle, MessageSquare, Calendar, User, Timer } from 'lucide-react';
import { Spotlight } from '@/components/ui/Spotlight';
import SuspensionWhatsAppWidget from '@/components/SuspensionWhatsAppWidget';
import { useChatBubbleControl } from '@/contexts/ChatBubbleControlContext';

interface SuspensionInfo {
  reason: string;
  estimatedDuration: number | null;
  enabledAt: Date | null;
  enabledBy: string | null;
}

interface DesktopScreenProps {
  suspensionInfo: SuspensionInfo;
  onOpenChat?: () => void;
}

export default function DesktopScreen({ suspensionInfo, onOpenChat }: DesktopScreenProps) {
  const { openBubble } = useChatBubbleControl();
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not specified';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Recently';
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="h-screen w-screen bg-black-100 text-white overflow-hidden flex flex-col">
      {/* Spotlights - Red/Orange theme */}
      <div className="absolute inset-0 pointer-events-none">
        <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen" fill="white" />
        <Spotlight className="h-[80vh] w-[50vw] top-10 left-full" fill="red" />
        <Spotlight className="left-80 top-28 h-[80vh] w-[50vw]" fill="orange" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.03]">
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      {/* Main content - Centered with proper spacing */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 lg:px-12 xl:px-16 py-6 min-h-0 overflow-y-auto">
        
        {/* Top Section - Badge & Content */}
        <div className="flex flex-col items-center w-full max-w-4xl">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-2 rounded-full border-2 border-red-500/50 bg-red-500/10 text-sm font-bold uppercase tracking-wider text-red-400 shadow-lg mb-6"
          >
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚠️ Services Suspended
            </motion.span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="text-white">All Services</span>
              <br />
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Temporarily Suspended
              </span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-1 w-12 bg-gradient-to-r from-transparent to-red-500 rounded-full" />
              <div className="h-1.5 w-20 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-full" />
              <div className="h-1 w-12 bg-gradient-to-r from-red-500 to-transparent rounded-full" />
            </div>
          </motion.div>

          {/* Main Message & Info Cards - Single Row */}
          <div className="w-full space-y-4">
            {/* Main Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-2xl">
                <div className="flex items-start gap-3 mb-2">
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
                  {suspensionInfo.reason || 'All services are temporarily suspended due to personal reasons. I appreciate your understanding during this time.'}
                </p>
              </div>
            </motion.div>

            {/* Info Cards - Single Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              {/* Expected Duration */}
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 hover:border-orange-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-white/60 text-xs font-medium">Expected Duration</p>
                </div>
                <p className="text-xl font-bold text-white ml-8">
                  {formatDuration(suspensionInfo.estimatedDuration)}
                </p>
              </div>

              {/* Status */}
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 hover:border-red-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-red-500/20 rounded-lg">
                    <Timer className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-white/60 text-xs font-medium">Current Status</p>
                </div>
                <div className="flex items-center gap-2 ml-8">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <p className="text-lg font-bold text-red-400">Suspended By Owner</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-6"
          >
            <p className="text-white/70 mb-3 text-sm">
              Need to reach me urgently?
            </p>
            <button
              onClick={() => openBubble('chat')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 via-red-600 to-orange-500 hover:from-red-600 hover:via-red-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-2xl hover:shadow-red-500/50 hover:scale-105 transform transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              Send Me a Message
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer - One Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-10 w-full flex items-center justify-center gap-6 py-4 border-t border-white/10 flex-shrink-0"
      >
        {/* Timestamp */}
        {suspensionInfo.enabledAt && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Calendar className="w-3.5 h-3.5" />
            <span>Suspended since {formatTimestamp(suspensionInfo.enabledAt)}</span>
          </div>
        )}
        
        <span className="text-white/20">•</span>
        
        {/* Admin Link - Low Profile */}
        <a
          href="/admin/login"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Admin
        </a>
      </motion.div>

      {/* WhatsApp Widget */}
      <SuspensionWhatsAppWidget />
    </div>
  );
}
