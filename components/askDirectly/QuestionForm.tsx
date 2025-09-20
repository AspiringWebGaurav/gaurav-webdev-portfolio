"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  validateQuestion, 
  canSendQuestion, 
  submitQuestion,
  cleanupAskDirectlyUtils 
} from '@/lib/askDirectly';
import type { RateLimitResult } from '@/lib/types';

interface QuestionFormProps {
  /** Callback when question is successfully submitted */
  onSuccess?: (questionId: string) => void;
  /** Callback when form is cancelled/closed */
  onCancel?: () => void;
  /** Whether the form is in a modal */
  inModal?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Whether to show character count */
  showCharCount?: boolean;
  /** Whether to auto-focus on mount */
  autoFocus?: boolean;
  /** Custom className for styling */
  className?: string;
}

const MAX_CHARACTERS = 500;
const MIN_CHARACTERS = 10;

export default function QuestionForm({
  onSuccess,
  onCancel,
  inModal = false,
  placeholder = "Ask me anything about my work, experience, or projects...",
  showCharCount = true,
  autoFocus = false,
  className = ""
}: QuestionFormProps) {
  // Form state
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Rate limiting state
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitResult | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Check rate limiting on mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      cleanupAskDirectlyUtils();
    };
  }, []);

  const checkRateLimit = useCallback(() => {
    const rateLimitResult = canSendQuestion();
    setRateLimitInfo(rateLimitResult);
    
    if (!rateLimitResult.canSend) {
      setCountdown(rateLimitResult.remainingCooldown);
      startCountdown(rateLimitResult.remainingCooldown);
    }
  }, []);

  const startCountdown = useCallback((initialCountdown: number) => {
    let timeLeft = initialCountdown;
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        checkRateLimit(); // Re-check rate limit
      }
    }, 1000);
  }, [checkRateLimit]);

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Limit character input
    if (value.length <= MAX_CHARACTERS) {
      setQuestion(value);
      
      // Clear validation error if user is typing
      if (validationError) {
        setValidationError(null);
      }
    }
  }, [validationError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate question
    const validation = validateQuestion(question);
    if (!validation.isValid) {
      setValidationError(validation.error!);
      return;
    }
    
    // Check rate limiting
    const rateLimitCheck = canSendQuestion();
    if (!rateLimitCheck.canSend) {
      setValidationError(`Please wait ${rateLimitCheck.remainingCooldown} seconds before sending another question`);
      checkRateLimit(); // Update UI state
      return;
    }
    
    setIsSubmitting(true);
    setValidationError(null);
    
    try {
      const result = await submitQuestion(question);
      
      if (result.success && result.questionId) {
        // Clear form
        setQuestion('');
        setValidationError(null);
        
        // Update rate limiting
        checkRateLimit();
        
        // Callback
        onSuccess?.(result.questionId);
      } else {
        setValidationError(result.error || 'Failed to submit question');
      }
    } catch (error) {
      console.error('Question submission error:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [question, onSuccess, checkRateLimit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    
    // Cancel on Escape (if in modal)
    if (e.key === 'Escape' && inModal) {
      onCancel?.();
    }
  }, [handleSubmit, inModal, onCancel]);

  const isValid = question.trim().length >= MIN_CHARACTERS;
  const canSubmit = isValid && !isSubmitting && rateLimitInfo?.canSend !== false;
  const charactersLeft = MAX_CHARACTERS - question.length;
  const isNearLimit = charactersLeft < 50;

  return (
    <form onSubmit={handleSubmit} className={`h-full flex flex-col space-y-3 ${className}`}>
      {/* Question Input - Takes most space */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={handleQuestionChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting || rateLimitInfo?.canSend === false}
          className={`
            w-full h-full px-3 sm:px-4 py-3 rounded-xl border-2 bg-slate-900/50 backdrop-blur-sm
            text-white placeholder-slate-400 resize-none transition-all duration-200 text-sm sm:text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${validationError ? 'border-red-500/50' : 'border-slate-700/50'}
            ${isNearLimit ? 'border-yellow-500/50' : ''}
          `}
        />
        
        {/* Character Count */}
        {showCharCount && (
          <div className={`
            absolute bottom-2 right-2 text-xs font-medium
            ${isNearLimit ? 'text-yellow-400' : 'text-slate-400'}
            ${charactersLeft < 0 ? 'text-red-400' : ''}
          `}>
            {charactersLeft} left
          </div>
        )}
      </div>

      {/* Error Messages - Compact */}
      {validationError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-xs">
          <span className="text-red-400">❌</span>
          <span className="text-red-400">{validationError}</span>
        </div>
      )}

      {rateLimitInfo && !rateLimitInfo.canSend && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-xs">
          <span className="text-yellow-400">⏳</span>
          <span className="text-yellow-400">
            Wait {countdown}s before sending another question
          </span>
        </div>
      )}

      {/* Form Actions - Compact */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
        {/* Help Text - Mobile friendly */}
        <div className="text-xs text-slate-500 flex-1">
          <div className="hidden sm:block">
            Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-xs">Ctrl+Enter</kbd> to submit
          </div>
          <div className="sm:hidden">Tap to submit</div>
        </div>
        
        {/* Submit Button - Mobile optimized */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`
            px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm
            disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0
            ${canSubmit
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
              : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
            }
            ${isSubmitting ? 'animate-pulse' : ''}
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="hidden sm:inline">Sending...</span>
              <span className="sm:hidden">...</span>
            </div>
          ) : rateLimitInfo && !rateLimitInfo.canSend ? (
            `Wait ${countdown}s`
          ) : (
            <>
              <span className="hidden sm:inline">Send Question</span>
              <span className="sm:hidden">Send</span>
            </>
          )}
        </button>
      </div>

      {/* Usage Tips - Compact for mobile */}
      <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-slate-700/30">
        <div className="flex items-center justify-between">
          <span>💡 Projects, skills, experience</span>
          <span>📝 Min {MIN_CHARACTERS} chars</span>
          <span>🕒 10s cooldown</span>
        </div>
      </div>
    </form>
  );
}

// Export additional form variants
export function CompactQuestionForm({ 
  onSuccess, 
  placeholder = "Quick question...",
  className = "" 
}: {
  onSuccess?: (questionId: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <QuestionForm
      onSuccess={onSuccess}
      placeholder={placeholder}
      showCharCount={false}
      className={className}
      inModal={false}
    />
  );
}

export function ModalQuestionForm({
  onSuccess,
  onCancel,
  placeholder = "Ask me anything...",
  className = ""
}: {
  onSuccess?: (questionId: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <QuestionForm
      onSuccess={onSuccess}
      onCancel={onCancel}
      placeholder={placeholder}
      inModal={true}
      autoFocus={true}
      className={className}
    />
  );
}