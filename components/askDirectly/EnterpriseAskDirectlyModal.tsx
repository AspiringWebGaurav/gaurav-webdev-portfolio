"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ModalQuestionForm } from './QuestionForm';
import EnterpriseQuestionsList from './EnterpriseQuestionsList';
import { getCurrentVisitorStats } from '@/lib/askDirectly';
import type { DirectQuestion, VisitorQuestionStats } from '@/lib/types';

interface EnterpriseAskDirectlyModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Initial view ('form' | 'questions') */
  initialView?: 'form' | 'questions';
  /** Whether to show view toggle */
  showViewToggle?: boolean;
  /** Custom title */
  title?: string;
  /** Custom className for modal */
  className?: string;
  /** Enable enterprise features */
  enterpriseMode?: boolean;
}

type ViewType = 'form' | 'questions';

// Enhanced Modal Overlay with better animations
const EnterpriseModalOverlay = ({ 
  children, 
  onClose, 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClose: () => void; 
  className?: string;
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/70 backdrop-blur-md
        transition-all duration-300 ease-out
        ${className}
      `}
      onClick={handleOverlayClick}
    >
      {children}
    </div>
  );
};

// Enhanced View Toggle with better UX
const EnterpriseViewToggle = ({ 
  currentView, 
  onViewChange, 
  stats 
}: { 
  currentView: ViewType; 
  onViewChange: (view: ViewType) => void;
  stats: VisitorQuestionStats | null;
}) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-600/30">
      <button
        onClick={() => onViewChange('form')}
        className={`
          px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
          flex items-center gap-2
          ${currentView === 'form'
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }
        `}
      >
        <span className="text-base">✏️</span>
        Ask Question
      </button>
      <button
        onClick={() => onViewChange('questions')}
        className={`
          px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
          flex items-center gap-2 relative
          ${currentView === 'questions'
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }
        `}
      >
        <span className="text-base">💬</span>
        My Questions
        
        {/* Question Count Badge */}
        {stats && stats.totalQuestions > 0 && (
          <span className={`
            px-2 py-0.5 text-xs rounded-full font-bold border
            ${currentView === 'questions'
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-slate-600 text-slate-200 border-slate-500/50'
            }
          `}>
            {stats.totalQuestions}
          </span>
        )}
        
        {/* New Answer Indicator */}
        {stats && stats.unread > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-slate-900">
            <span className="sr-only">{stats.unread} new answers</span>
          </div>
        )}
      </button>
    </div>
  );
};

// Enhanced Modal Header
const EnterpriseModalHeader = ({ 
  title, 
  currentView, 
  onViewChange, 
  showViewToggle, 
  onClose,
  stats 
}: {
  title: string;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  showViewToggle: boolean;
  onClose: () => void;
  stats: VisitorQuestionStats | null;
}) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-slate-800/30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {title}
          </h2>
        </div>
        
        {showViewToggle && (
          <EnterpriseViewToggle
            currentView={currentView}
            onViewChange={onViewChange}
            stats={stats}
          />
        )}
      </div>

      <button
        onClick={onClose}
        className="
          p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 
          transition-all duration-200 group
        "
        aria-label="Close modal"
      >
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Enhanced Modal Content with better transitions
const EnterpriseModalContent = ({ 
  currentView, 
  onViewChange, 
  onClose,
  enterpriseMode 
}: {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onClose: () => void;
  enterpriseMode: boolean;
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleQuestionSuccess = useCallback((questionId: string) => {
    console.log('✅ [Enterprise] Question submitted:', questionId);
    setIsTransitioning(true);
    setTimeout(() => {
      onViewChange('questions');
      setIsTransitioning(false);
    }, 300);
  }, [onViewChange]);

  const handleQuestionClick = useCallback((question: DirectQuestion) => {
    console.log('🔍 [Enterprise] Question clicked:', {
      id: question.id,
      status: question.status,
      hasReply: !!question.adminReply
    });
  }, []);

  return (
    <div className="relative min-h-[400px] max-h-[70vh] overflow-hidden">
      {/* Form View */}
      <div className={`
        absolute inset-0 transition-all duration-300 ease-in-out
        ${currentView === 'form' 
          ? 'opacity-100 translate-x-0 pointer-events-auto' 
          : 'opacity-0 translate-x-[-100%] pointer-events-none'
        }
      `}>
        <div className="p-6 h-full">
          <ModalQuestionForm
            onSuccess={handleQuestionSuccess}
            onCancel={onClose}
            placeholder="Ask me anything about my work, projects, or experience..."
            className="h-full"
          />
        </div>
      </div>

      {/* Questions View */}
      <div className={`
        absolute inset-0 transition-all duration-300 ease-in-out
        ${currentView === 'questions' 
          ? 'opacity-100 translate-x-0 pointer-events-auto' 
          : 'opacity-0 translate-x-[100%] pointer-events-none'
        }
      `}>
        <div className="p-6 h-full overflow-y-auto custom-scrollbar">
          <EnterpriseQuestionsList
            enableRealTime={true}
            showEmptyState={true}
            variant="default"
            onQuestionClick={handleQuestionClick}
            emptyMessage="No questions yet. Switch to the form to ask your first question!"
            enterpriseMode={enterpriseMode}
          />
        </div>
      </div>

      {/* Transition Loading Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Loading questions...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Status Bar
const EnterpriseStatusBar = ({ 
  currentView,
  stats,
  showViewToggle 
}: {
  currentView: ViewType;
  stats: VisitorQuestionStats | null;
  showViewToggle: boolean;
}) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-6 py-4 border-t border-slate-600/50 bg-slate-800/20">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-6 text-slate-400">
          {stats && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">📊</span>
                <span>Total: {stats.totalQuestions}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">✅</span>
                <span>Answered: {stats.answered}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">⏳</span>
                <span>Pending: {stats.unanswered}</span>
              </div>
              {stats.unread > 0 && (
                <div className="flex items-center gap-1 text-green-400 animate-pulse">
                  <span>🆕</span>
                  <span className="font-medium">{stats.unread} new answer{stats.unread > 1 ? 's' : ''}</span>
                </div>
              )}
            </>
          )}
          
          {!stats && (
            <span className="text-slate-500">Loading statistics...</span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-slate-500">
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
          <div className="flex items-center gap-2">
            <span>Press ESC to close</span>
            {showViewToggle && (
              <span>• Ctrl+Tab to switch views</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EnterpriseAskDirectlyModal({
  isOpen,
  onClose,
  initialView = 'form',
  showViewToggle = true,
  title = "Ask Me Directly",
  className = "",
  enterpriseMode = true
}: EnterpriseAskDirectlyModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [stats, setStats] = useState<VisitorQuestionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const statsUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Enhanced stats loading with auto-refresh
  const loadStats = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setIsLoading(true);
      const newStats = await getCurrentVisitorStats();
      setStats(newStats);
      console.log('📊 [Enterprise] Stats updated:', newStats);
    } catch (error) {
      console.error('❌ [Enterprise] Failed to load stats:', error);
      // Set fallback stats to prevent UI breaks
      setStats({
        totalQuestions: 0,
        unanswered: 0,
        answered: 0,
        archived: 0,
        unread: 0,
        lastQuestionAt: null
      });
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  // Load stats when modal opens and refresh periodically
  useEffect(() => {
    if (isOpen) {
      loadStats();
      
      // Auto-refresh stats every 30 seconds when modal is open
      statsUpdateRef.current = setInterval(loadStats, 30000);
    }

    return () => {
      if (statsUpdateRef.current) {
        clearInterval(statsUpdateRef.current);
      }
    };
  }, [isOpen, loadStats]);

  // Enhanced keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Switch views with Ctrl/Cmd + Tab
      if (showViewToggle && e.key === 'Tab' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCurrentView(prev => prev === 'form' ? 'questions' : 'form');
      }

      // Quick shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setCurrentView('form');
        }
        if (e.key === '2') {
          e.preventDefault();
          setCurrentView('questions');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showViewToggle]);

  // Enhanced focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Enhanced body scroll prevention
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Listen for question updates to refresh stats
  useEffect(() => {
    if (!isOpen) return;

    const handleQuestionUpdate = () => {
      console.log('🔄 [Enterprise] Question update detected, refreshing stats...');
      loadStats();
    };

    // Listen for various update events
    window.addEventListener('directQuestionSubmitted', handleQuestionUpdate);
    window.addEventListener('directQuestionAnswered', handleQuestionUpdate);
    window.addEventListener('directQuestionDeleted', handleQuestionUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'questions_updated') {
        handleQuestionUpdate();
      }
    });

    return () => {
      window.removeEventListener('directQuestionSubmitted', handleQuestionUpdate);
      window.removeEventListener('directQuestionAnswered', handleQuestionUpdate);
      window.removeEventListener('directQuestionDeleted', handleQuestionUpdate);
    };
  }, [isOpen, loadStats]);

  if (!isOpen) return null;

  return (
    <EnterpriseModalOverlay onClose={onClose} className={className}>
      <div
        ref={modalRef}
        className="
          relative w-full max-w-4xl mx-auto bg-slate-900/95 rounded-2xl shadow-2xl
          border border-slate-600/50 backdrop-blur-xl
          transform transition-all duration-300 ease-out
          focus:outline-none
        "
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          animation: isOpen ? 'slideInUp 0.3s ease-out' : undefined
        }}
      >
        <EnterpriseModalHeader
          title={title}
          currentView={currentView}
          onViewChange={setCurrentView}
          showViewToggle={showViewToggle}
          onClose={onClose}
          stats={stats}
        />

        <EnterpriseModalContent
          currentView={currentView}
          onViewChange={setCurrentView}
          onClose={onClose}
          enterpriseMode={enterpriseMode}
        />

        <EnterpriseStatusBar
          currentView={currentView}
          stats={stats}
          showViewToggle={showViewToggle}
        />
      </div>

      {/* Loading overlay for stats */}
      {isLoading && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg px-3 py-2 border border-slate-600/50">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              Updating...
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </EnterpriseModalOverlay>
  );
}

// Export enhanced variants for specific use cases
export function EnterpriseSimpleAskModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  return (
    <EnterpriseAskDirectlyModal
      isOpen={isOpen}
      onClose={onClose}
      initialView="form"
      showViewToggle={false}
      title="Quick Question"
      enterpriseMode={true}
    />
  );
}

export function EnterpriseQuestionsOnlyModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  return (
    <EnterpriseAskDirectlyModal
      isOpen={isOpen}
      onClose={onClose}
      initialView="questions"
      showViewToggle={false}
      title="My Questions & Answers"
      enterpriseMode={true}
    />
  );
}