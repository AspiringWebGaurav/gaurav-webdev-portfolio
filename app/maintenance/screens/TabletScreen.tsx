'use client';
/**
 * Tablet Maintenance Screen
 * 
 * Optimized layout for medium screens (768px - 1023px)
 * Non-scrollable, fixed viewport design
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Clock, Timer, Loader2 } from 'lucide-react';
import { FaLocationArrow } from 'react-icons/fa6';
import { Spotlight } from '@/components/ui/Spotlight';
import FlipCountdown from '@/components/ui/FlipCountdown';
import ContactFormModal from '@/components/ContactFormModal';
import { socialMedia } from '@/data';
import NextImage from 'next/image';

interface MaintenanceInfo {
  title: string;
  message: string;
  showContactForm: boolean;
  estimatedEndTime: Date | null;
  isOverdue: boolean;
  estimatedDuration: number | null;
  enabledAt: Date | null;
  overdueBy: number;
}

interface TabletScreenProps {
  maintenanceInfo: MaintenanceInfo;
}

export default function TabletScreen({ maintenanceInfo }: TabletScreenProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localOverdue, setLocalOverdue] = useState(maintenanceInfo.isOverdue);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync with parent overdue state
  useEffect(() => {
    if (maintenanceInfo.isOverdue && !localOverdue) {
      setLocalOverdue(true);
      setIsTransitioning(false);
    }
  }, [maintenanceInfo.isOverdue, localOverdue]);

  // Handle countdown completion
  const handleCountdownComplete = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setLocalOverdue(true);
      setIsTransitioning(false);
    }, 1500);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const formatOverdueTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs} hour${hrs !== 1 ? 's' : ''}`;
    return `${hrs}h ${mins}m`;
  };

  // Format start time in IST 12-hour format
  const formatStartTimeIST = (date: Date | null): string => {
    if (!date) return '';
    
    // Convert to IST (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    const istTime = new Date(utcTime + istOffset);
    
    let hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm} IST`;
  };

  return (
    <div className="h-screen w-screen bg-black-100 text-white overflow-hidden fixed inset-0">
      {/* Spotlights */}
      <div className="absolute inset-0 pointer-events-none">
        <Spotlight className="-top-40 -left-10 h-screen" fill="white" />
        <Spotlight className="h-[60vh] w-[40vw] top-10 left-full" fill="purple" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.03]">
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col px-5 py-3">
        
        {/* Top bar */}
        <div className="flex items-center justify-center pb-2 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 text-white/70 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="font-mono" suppressHydrationWarning>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span suppressHydrationWarning>
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-3">
          
          {/* Animated icon */}
          <motion.div
            animate={isTransitioning ? { rotate: 360 } : { rotate: [0, -15, 15, -15, 0] }}
            transition={isTransitioning ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="mb-3"
          >
            <div className="w-16 h-16 rounded-full bg-purple/20 flex items-center justify-center border border-purple/30">
              {isTransitioning ? (
                <Loader2 className="w-8 h-8 text-purple animate-spin" />
              ) : (
                <Wrench className="w-8 h-8 text-purple" />
              )}
            </div>
          </motion.div>

          {/* Title with transitions */}
          <AnimatePresence mode="wait">
            {isTransitioning ? (
              <motion.div
                key="transitioning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center mb-3"
              >
                <h1 className="text-2xl font-bold text-white mb-1">Time's up!</h1>
                <p className="text-sm text-white/70">Updating status...</p>
              </motion.div>
            ) : localOverdue ? (
              <motion.div
                key="overdue"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-3"
              >
                <h1 className="text-3xl font-bold text-white mb-1">
                  Gaurav is still working...
                </h1>
                <p className="text-base text-white/70">
                  +{formatOverdueTime(maintenanceInfo.overdueBy || 0)} over estimate
                </p>
              </motion.div>
            ) : (
              <motion.h1
                key="normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-3xl font-bold text-white text-center mb-3"
              >
                {maintenanceInfo.title}
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Countdown Timer with transitions */}
          <AnimatePresence mode="wait">
            {isTransitioning ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-3 flex items-center gap-2 p-3 bg-purple/10 border border-purple/30 rounded-lg"
              >
                <Loader2 className="w-4 h-4 text-purple animate-spin" />
                <span className="text-white/80 text-sm">Calculating overtime...</span>
              </motion.div>
            ) : maintenanceInfo.estimatedEndTime && !localOverdue ? (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-3"
              >
                <p className="text-center text-white/60 mb-2 text-xs uppercase tracking-widest">
                  Time remaining
                </p>
                <FlipCountdown 
                  targetDate={maintenanceInfo.estimatedEndTime} 
                  onComplete={handleCountdownComplete}
                />
              </motion.div>
            ) : localOverdue && maintenanceInfo.estimatedDuration ? (
              <motion.div
                key="overdue-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg"
              >
                <div className="flex items-center justify-center gap-1.5 text-amber-300 text-sm">
                  <Timer className="w-4 h-4" />
                  <span>Originally: {formatDuration(maintenanceInfo.estimatedDuration)}</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Maintenance Start Time */}
          {maintenanceInfo.enabledAt && !isTransitioning && (
            <div className="mb-3 text-center">
              <p className="text-white/50 text-sm">
                Started at <span className="text-purple-300 font-medium">{formatStartTimeIST(maintenanceInfo.enabledAt)}</span>
              </p>
            </div>
          )}

          {/* Message */}
          <p className="text-white/70 text-base max-w-md text-center mb-4">
            {maintenanceInfo.message}
          </p>

          {/* Contact button - MagicButton style - Always visible */}
          <button
            onClick={() => setIsContactOpen(true)}
            className="relative inline-flex h-12 w-56 overflow-hidden rounded-lg p-[1px] focus:outline-none mb-2"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-slate-950 px-5 text-base font-medium text-white backdrop-blur-3xl gap-2">
              Contact Me
              <FaLocationArrow className="w-4 h-4" />
            </span>
          </button>

          {/* Social links */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="flex items-center gap-3">
              {socialMedia.map((info) => (
                <div
                  key={info.id}
                  className="w-10 h-10 flex items-center justify-center bg-black-200 rounded-lg border border-white/10 hover:border-purple/50 transition-all cursor-pointer"
                >
                  <NextImage src={info.img} alt="social" width={20} height={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Actual bottom of page */}
      <div className="absolute bottom-0 left-0 right-0 py-4 flex justify-center">
        <span className="text-white/60 text-sm">© 2025 Gaurav Patil. All rights reserved.</span>
      </div>

      {/* Contact Modal */}
      <ContactFormModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}
