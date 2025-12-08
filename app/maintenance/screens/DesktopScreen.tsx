'use client';
/**
 * Desktop Maintenance Screen - HORIZONTAL SYMMETRIC LAYOUT
 * 
 * Full-featured layout for large screens (1024px+)
 * Non-scrollable, fixed viewport design
 * Horizontal distribution with dynamic rotating content
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Timer, Loader2, MoreVertical, Shield, Bug } from 'lucide-react';
import { FaLocationArrow } from 'react-icons/fa6';
import { Spotlight } from '@/components/ui/Spotlight';
import FlipCountdown from '@/components/ui/FlipCountdown';
import ContactFormModal from '@/components/ContactFormModal';
import BugReportIntro from '@/components/BugReportIntro';
import BugReportForm from '@/components/BugReportForm';
import { socialMedia } from '@/data';
import { 
  TITLES, 
  FUN_FACTS, 
  ROTATING_ICONS, 
  CURRENT_ACTIVITIES,
  PHASE_INFO,
  getPhaseFromOverdue 
} from '@/data/maintenanceContent';
import Image from 'next/image';

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

interface DesktopScreenProps {
  maintenanceInfo: MaintenanceInfo;
}

export default function DesktopScreen({ maintenanceInfo }: DesktopScreenProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localOverdue, setLocalOverdue] = useState(maintenanceInfo.isOverdue);
  
  // Menu dropdown state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBugIntroOpen, setIsBugIntroOpen] = useState(false);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Dynamic content indices
  const [titleIndex, setTitleIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);
  const [funFactIndices, setFunFactIndices] = useState([0, 1, 2, 3]);
  const [activityIndex, setActivityIndex] = useState(0);
  
  // Live elapsed time in seconds for smoother display
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine phase based on overdue time
  const phase = useMemo(() => {
    return getPhaseFromOverdue(maintenanceInfo.overdueBy || 0, localOverdue);
  }, [localOverdue, maintenanceInfo.overdueBy]);

  // Get titles based on phase
  const currentTitles = useMemo(() => {
    return TITLES[phase];
  }, [phase]);

  const phaseBadge = PHASE_INFO[phase];

  // Clock timer - every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Elapsed time calculator - every second
  useEffect(() => {
    if (!maintenanceInfo.enabledAt) return;
    
    const updateElapsed = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - maintenanceInfo.enabledAt!.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    };
    
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [maintenanceInfo.enabledAt]);

  // Title rotation (every 8 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % currentTitles.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [currentTitles.length]);

  // Icon rotation (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setIconIndex(prev => (prev + 1) % ROTATING_ICONS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fun facts rotation (every 6 seconds, rotate one at a time)
  useEffect(() => {
    const timer = setInterval(() => {
      setFunFactIndices(prev => {
        const newIndices = [...prev];
        const rotatePosition = Math.floor(Math.random() * 4);
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * FUN_FACTS.length);
        } while (newIndices.includes(newIndex));
        newIndices[rotatePosition] = newIndex;
        return newIndices;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Activity rotation (every 10 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIndex(prev => (prev + 1) % CURRENT_ACTIVITIES.length);
    }, 10000);
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
  const handleCountdownComplete = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setLocalOverdue(true);
      setIsTransitioning(false);
    }, 1500);
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs} hour${hrs !== 1 ? 's' : ''}`;
    return `${hrs}h ${mins}m`;
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  // Format start time in IST 12-hour format
  const formatStartTimeIST = (date: Date | null): string => {
    if (!date) return '';
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    const istTime = new Date(utcTime + istOffset);
    let hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const CurrentIcon = ROTATING_ICONS[iconIndex];
  const currentFunFacts = funFactIndices.map(i => FUN_FACTS[i]);

  return (
    <div className="h-screen w-screen bg-black-100 text-white overflow-hidden fixed inset-0">
      {/* Spotlights */}
      <div className="absolute inset-0 pointer-events-none">
        <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen" fill="white" />
        <Spotlight className="h-[80vh] w-[50vw] top-10 left-full" fill="purple" />
        <Spotlight className="left-80 top-28 h-[80vh] w-[50vw]" fill="blue" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.03]">
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col px-8 lg:px-12 xl:px-16 py-2 pb-10">
        
        {/* Top bar - Navbar */}
        <div className="flex items-center justify-between py-2 border-b border-white/10 flex-shrink-0">
          {/* Left spacer for balance */}
          <div className="w-8" />
          
          {/* Center: Time & Date */}
          <div className="flex items-center gap-4 text-white/70 text-base">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono" suppressHydrationWarning>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span suppressHydrationWarning>
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          {/* Right: Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 bg-black-200/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <a
                    href="/admin/login"
                    className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </a>
                  <div className="h-px bg-white/10" />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsBugIntroOpen(true);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm w-full text-left"
                  >
                    <Bug className="w-4 h-4" />
                    <span>Report a Bug</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center min-h-0 py-4 gap-3">
          
          {/* Phase Badge - Top Center */}
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${phaseBadge.color} shadow-lg ${phaseBadge.glow}`}
          >
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {phaseBadge.emoji} {phaseBadge.text}
            </motion.span>
          </motion.div>

          {/* HORIZONTAL ROW: Elapsed | Icon | Overtime - PERFECTLY SYMMETRIC */}
          <div className="flex items-center justify-center gap-5 lg:gap-8 xl:gap-12">
            
            {/* Left: Elapsed Time Card - Fixed width for symmetry */}
            <motion.div 
              className="flex flex-col items-center justify-center w-[140px] h-[80px] bg-white/5 rounded-xl border border-white/10"
              animate={{ borderColor: ['rgba(255,255,255,0.1)', 'rgba(139,92,246,0.3)', 'rgba(255,255,255,0.1)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">⏱️ Elapsed</span>
              <span className="text-xl lg:text-2xl font-bold text-white font-mono">
                {formatElapsedTime(elapsedSeconds)}
              </span>
              <span className="text-white/40 text-[10px] mt-0.5">Running</span>
            </motion.div>

            {/* Center: Animated Icon */}
            <div className="relative flex items-center justify-center">
              {/* Particle effects */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-purple/50 rounded-full"
                    animate={{
                      x: [0, Math.cos(i * 45 * Math.PI / 180) * 40],
                      y: [0, Math.sin(i * 45 * Math.PI / 180) * 40],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1.2, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.25,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={iconIndex}
                  initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    animate={isTransitioning ? { rotate: 360 } : { scale: [1, 1.08, 1] }}
                    transition={isTransitioning ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-purple/30 to-blue-600/20 flex items-center justify-center border-2 border-purple/40 shadow-xl shadow-purple/20"
                  >
                    {isTransitioning ? (
                      <Loader2 className="w-8 h-8 lg:w-10 lg:h-10 text-purple animate-spin" />
                    ) : (
                      <CurrentIcon.Icon className={`w-8 h-8 lg:w-10 lg:h-10 ${CurrentIcon.color}`} />
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: Over Estimate Card - Same fixed width for symmetry */}
            {localOverdue ? (
              <motion.div 
                className="flex flex-col items-center justify-center w-[140px] h-[80px] bg-amber-500/10 rounded-xl border border-amber-500/30"
                animate={{ borderColor: ['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.5)', 'rgba(245,158,11,0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-amber-400/70 text-[10px] uppercase tracking-wider mb-0.5">📊 Over Est.</span>
                <span className="text-xl lg:text-2xl font-bold text-amber-400 font-mono">
                  +{maintenanceInfo.overdueBy || 0}m
                </span>
                <span className="text-amber-400/50 text-[10px] mt-0.5">Extended</span>
              </motion.div>
            ) : (
              <motion.div 
                className="flex flex-col items-center justify-center w-[140px] h-[80px] bg-green-500/10 rounded-xl border border-green-500/30"
              >
                <span className="text-green-400/70 text-[10px] uppercase tracking-wider mb-0.5">📊 Status</span>
                <span className="text-xl lg:text-2xl font-bold text-green-400">✓</span>
                <span className="text-green-400/50 text-[10px] mt-0.5">On Track</span>
              </motion.div>
            )}
          </div>

          {/* Dynamic Title */}
          <AnimatePresence mode="wait">
            {isTransitioning ? (
              <motion.h1
                key="transitioning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-xl lg:text-2xl xl:text-3xl font-bold text-white text-center leading-[1.18]"
              >
                Time&apos;s up! Updating...
              </motion.h1>
            ) : (
              <motion.h1
                key={titleIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent text-center px-4 leading-[1.18]"
              >
                {currentTitles[titleIndex]}
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Countdown or Overdue Info - Better styled badge */}
          <AnimatePresence mode="wait">
            {isTransitioning ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 px-5 py-2.5 bg-purple/20 border border-purple/40 rounded-full"
              >
                <Loader2 className="w-4 h-4 text-purple animate-spin" />
                <span className="text-white text-sm font-medium">Calculating overtime...</span>
              </motion.div>
            ) : maintenanceInfo.estimatedEndTime && !localOverdue ? (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <p className="text-white/60 mb-2 text-xs uppercase tracking-widest">
                  Estimated time remaining
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
                className="px-6 py-2.5 bg-amber-500/20 border-2 border-amber-500/50 rounded-full shadow-lg shadow-amber-500/10"
              >
                <div className="flex items-center gap-2 text-amber-200 text-sm font-medium">
                  <Timer className="w-4 h-4" />
                  <span>Originally estimated: {formatDuration(maintenanceInfo.estimatedDuration)}</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Fun Facts Row - 4 Cards Horizontal with equal width */}
          <div className="flex justify-center items-center gap-2 lg:gap-3">
            {currentFunFacts.map((fact, idx) => (
              <AnimatePresence key={`fact-slot-${idx}`} mode="wait">
                <motion.div
                  key={`${idx}-${funFactIndices[idx]}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors min-w-[160px] justify-center"
                >
                  <fact.icon className={`w-3.5 h-3.5 ${fact.color} flex-shrink-0`} />
                  <span className="text-white/80 text-xs">{fact.text}</span>
                </motion.div>
              </AnimatePresence>
            ))}
          </div>

          {/* Info Bar - Full Width Centered */}
          <div className="flex items-center justify-center gap-3 lg:gap-6 px-5 py-2 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <Timer className="w-3.5 h-3.5 text-purple-400" />
              <span>Est: <span className="text-white font-medium">{maintenanceInfo.estimatedDuration || 0}m</span></span>
            </div>
            <div className="h-3.5 w-px bg-white/20" />
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Started: <span className="text-white font-medium">{formatStartTimeIST(maintenanceInfo.enabledAt)} IST</span></span>
            </div>
            <div className="h-3.5 w-px bg-white/20" />
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <span className="text-purple-400">◉</span>
              <span>Phase: <span className="text-white font-medium">{phaseBadge.text}</span></span>
            </div>
          </div>

          {/* Bottom Row: Social | Contact | Activity - Perfectly centered */}
          <div className="flex items-center justify-center gap-6 lg:gap-10">
            
            {/* Left: Social Links - Fixed width */}
            <div className="flex items-center gap-2.5 w-[120px] justify-center">
              {socialMedia.map((info) => (
                <motion.div
                  key={info.id}
                  whileHover={{ scale: 1.1, borderColor: 'rgba(139,92,246,0.5)' }}
                  className="w-9 h-9 flex items-center justify-center bg-black-200 rounded-lg border border-white/10 cursor-pointer transition-all"
                >
                  <Image src={info.img} alt="social" width={18} height={18} />
                </motion.div>
              ))}
            </div>

            {/* Center: Contact Button */}
            <button
              onClick={() => setIsContactOpen(true)}
              className="relative inline-flex h-11 w-44 overflow-hidden rounded-lg p-[1px] focus:outline-none"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white backdrop-blur-3xl gap-2 hover:bg-slate-900 transition-colors">
                Contact Me
                <FaLocationArrow className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Right: Current Activity - Fixed width */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activityIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 px-3 py-2 bg-purple/10 rounded-lg border border-purple/30 w-[180px] justify-center"
              >
                <span className="text-purple-400 text-sm">🛠️</span>
                <span className="text-white/80 text-xs">{CURRENT_ACTIVITIES[activityIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 py-1.5 flex justify-center border-t border-white/5 bg-black-100/80 backdrop-blur-sm z-20">
        <span className="text-white/50 text-sm">© 2025 Gaurav Patil. All rights reserved.</span>
      </div>

      {/* Contact Modal */}
      <ContactFormModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Bug Report Intro Modal */}
      <BugReportIntro
        isOpen={isBugIntroOpen}
        onClose={() => setIsBugIntroOpen(false)}
        onOpenForm={() => setIsBugFormOpen(true)}
      />

      {/* Bug Report Form Modal */}
      <BugReportForm
        isOpen={isBugFormOpen}
        onClose={() => setIsBugFormOpen(false)}
      />
    </div>
  );
}
