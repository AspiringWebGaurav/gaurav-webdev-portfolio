"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaArrowLeft, FaHome, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Import components directly for faster loading - these are lightweight
import AskDirectlyEmbedded from './AskDirectlyEmbedded';
import VisitorTracker from '@/components/VisitorTracker';
import EnhancedVisitorStatusWatcher from '@/components/EnhancedVisitorStatusWatcher';

interface AskMeAnythingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUUID: string;
  className?: string;
}

// Minimal loading component
const ComponentLoader = ({ height = "h-6" }: { height?: string }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Compact Guidelines component
const Guidelines = () => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3 mb-4">
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="text-center p-2 rounded bg-slate-800/30">
        <div className="text-green-400 text-lg mb-1">💡</div>
        <div className="text-slate-300 font-medium">What to Ask</div>
        <div className="text-slate-400 text-xs">Projects & skills</div>
      </div>
      
      <div className="text-center p-2 rounded bg-slate-800/30">
        <div className="text-yellow-400 text-lg mb-1">📝</div>
        <div className="text-slate-300 font-medium">Length</div>
        <div className="text-slate-400 text-xs">Min 10 chars</div>
      </div>
      
      <div className="text-center p-2 rounded bg-slate-800/30">
        <div className="text-blue-400 text-lg mb-1">🕒</div>
        <div className="text-slate-300 font-medium">Rate</div>
        <div className="text-slate-400 text-xs">10s cooldown</div>
      </div>
    </div>
  </div>
);

// Modal backdrop component
const ModalBackdrop = ({ 
  children, 
  onClose, 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClose: () => void; 
  className?: string;
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  }, [onClose]);

  return (
    <motion.div
      ref={backdropRef}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/60 backdrop-blur-sm",
        className
      )}
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

const AskMeAnythingModal: React.FC<AskMeAnythingModalProps> = ({
  isOpen,
  onClose,
  currentUUID,
  className = ""
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle close with smooth transition
  const handleClose = useCallback(() => {
    setIsLoading(true);
    
    // Small delay for smooth close animation
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Handle URL state updates (without navigation)
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Update URL bar without triggering navigation
      window.history.pushState(null, '', `/${currentUUID}/ask-me-anything`);
    } else if (!isOpen && typeof window !== 'undefined') {
      // Restore portfolio URL when modal closes
      window.history.pushState(null, '', `/${currentUUID}`);
    }
  }, [isOpen, currentUUID]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <ModalBackdrop onClose={handleClose} className={className}>
        <motion.div
          ref={modalRef}
          className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-black-100 rounded-2xl shadow-2xl border border-white/[0.1] overflow-hidden focus:outline-none"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Background Effects - Lower z-index to prevent conflicts */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-black-100 via-black-100/95 to-black-100 z-0" />

          {/* Header Navigation - Fixed Height */}
          <header className="relative z-20 border-b border-white/[0.1] bg-black-100/80 backdrop-blur-md flex-shrink-0">
            <div className="px-4 sm:px-6">
              <div className="flex items-center justify-between h-14">
                {/* Back Button */}
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-200 group text-sm z-10",
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  )}
                >
                  {isLoading ? (
                    <ComponentLoader height="h-3 w-3" />
                  ) : (
                    <FaArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform duration-200" />
                  )}
                  <span className="hidden sm:inline">
                    {isLoading ? 'Closing...' : 'Back'}
                  </span>
                </button>

                {/* Title */}
                <div className="flex items-center gap-2">
                  <FaQuestionCircle className="w-4 h-4 text-blue-400" />
                  <h1 id="modal-title" className="text-base font-semibold text-white">Ask Me Anything</h1>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all duration-200 text-sm z-10",
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  )}
                >
                  {isLoading ? (
                    <ComponentLoader height="h-3 w-3" />
                  ) : (
                    <FaTimes className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">
                    {isLoading ? 'Closing...' : 'Close'}
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content - Scrollable */}
          <main className="relative z-10 flex flex-col h-full max-h-[calc(90vh-3.5rem)] overflow-hidden">
            
            {/* Hero Section - Compact */}
            <div className="flex-shrink-0 text-center p-4 sm:p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
                <span className="text-lg">💬</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Ask Me Directly
              </h2>
              
              <p className="text-sm sm:text-base text-slate-300 mb-3">
                Send your questions directly to Gaurav and get personal responses
              </p>

              {/* Decorative Line */}
              <div className="flex items-center justify-center">
                <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent w-32"></div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-4">
              {/* Guidelines - Compact */}
              <div className="flex-shrink-0 mb-4">
                <Guidelines />
              </div>

              {/* Form Container - Direct load with instant display */}
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 h-96 overflow-hidden mb-4">
                <div className="h-full w-full">
                  <AskDirectlyEmbedded
                    initialView="form"
                    showViewToggle={true}
                    className="h-full w-full"
                  />
                </div>
              </div>

              {/* Footer Info - Compact */}
              <div className="text-center flex-shrink-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-medium">Usually responds within 24 hours</span>
                </div>
              </div>
            </div>
          </main>

          {/* Subtle floating elements for visual enhancement - Lower z-index */}
          <div className="absolute top-20 left-4 w-32 h-32 bg-blue-500/3 rounded-full blur-2xl pointer-events-none z-0"></div>
          <div className="absolute bottom-20 right-4 w-40 h-40 bg-purple-500/3 rounded-full blur-2xl pointer-events-none z-0"></div>

          {/* Visitor tracking components - hidden but active */}
          <div className="hidden">
            <VisitorTracker uuid={currentUUID} />
            <EnhancedVisitorStatusWatcher uuid={currentUUID} />
          </div>
        </motion.div>
      </ModalBackdrop>
    </AnimatePresence>
  );
};

export default AskMeAnythingModal;