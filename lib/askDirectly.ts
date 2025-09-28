// lib/askDirectly.ts
// Main utility library for "Ask Me Directly" Q&A system

import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast 
} from "@/components/ToastSystem";
import { getVisitorUuidWithFallbacks } from "./visitor";
import {
  addDirectQuestion,
  getVisitorQuestions,
  markQuestionsAsRead,
  listenToVisitorQuestions,
  getVisitorQuestionStats
} from "./firebase";

// Fallback functions for production safety
const createFallbackFunction = (functionName: string, fallbackReturn: any = null) => {
  return (...args: any[]) => {
    console.error(`[FALLBACK] ${functionName} not available, returning fallback:`, fallbackReturn);
    if (typeof fallbackReturn === 'function') {
      return fallbackReturn(...args);
    }
    return fallbackReturn;
  };
};

// Safe Firebase function wrappers
const safeAddDirectQuestion = addDirectQuestion || createFallbackFunction('addDirectQuestion', async () => {
  throw new Error('Firebase addDirectQuestion not available');
});

const safeGetVisitorQuestions = getVisitorQuestions || createFallbackFunction('getVisitorQuestions', async () => []);

const safeMarkQuestionsAsRead = markQuestionsAsRead || createFallbackFunction('markQuestionsAsRead', async () => true);

const safeListenToVisitorQuestions = listenToVisitorQuestions || createFallbackFunction('listenToVisitorQuestions', () => () => {});

const safeGetVisitorQuestionStats = getVisitorQuestionStats || createFallbackFunction('getVisitorQuestionStats', async () => ({
  totalQuestions: 0,
  unanswered: 0,
  answered: 0,
  archived: 0,
  unread: 0,
  lastQuestionAt: null
}));
import type {
  DirectQuestion,
  CreateDirectQuestionData,
  QuestionValidationResult,
  RateLimitResult,
  PageVisibilityState,
  QuestionToastOptions,
  VisitorMetadata,
  QuestionListener
} from "./types";

// Constants
const RATE_LIMIT_COOLDOWN = 10000; // 10 seconds in milliseconds
const MAX_QUESTION_LENGTH = 500;
const MIN_QUESTION_LENGTH = 10;
const RATE_LIMIT_STORAGE_KEY = "ask_directly_last_sent";

/**
 * Validate question input
 */
export function validateQuestion(question: string): QuestionValidationResult {
  const trimmedQuestion = question.trim();
  
  if (!trimmedQuestion) {
    return {
      isValid: false,
      error: "Question cannot be empty"
    };
  }
  
  if (trimmedQuestion.length < MIN_QUESTION_LENGTH) {
    return {
      isValid: false,
      error: `Question must be at least ${MIN_QUESTION_LENGTH} characters long`
    };
  }
  
  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    return {
      isValid: false,
      error: `Question must not exceed ${MAX_QUESTION_LENGTH} characters`
    };
  }
  
  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /^[^a-zA-Z]*$/, // No letters (just symbols/numbers)
    /(test|spam|hello)\s*$/i // Common spam words as sole content
  ];
  
  const isSpam = spamPatterns.some(pattern => pattern.test(trimmedQuestion));
  if (isSpam) {
    return {
      isValid: false,
      error: "Question appears to be spam or invalid"
    };
  }
  
  return {
    isValid: true,
    cleanedQuestion: trimmedQuestion
  };
}

/**
 * Check if user can send a question (rate limiting)
 */
export function canSendQuestion(lastSentTime?: number): RateLimitResult {
  const now = Date.now();
  const storedLastSent = lastSentTime || parseInt(localStorage.getItem(RATE_LIMIT_STORAGE_KEY) || "0");
  
  if (storedLastSent === 0) {
    return {
      canSend: true,
      remainingCooldown: 0
    };
  }
  
  const timeSinceLastSent = now - storedLastSent;
  
  if (timeSinceLastSent >= RATE_LIMIT_COOLDOWN) {
    return {
      canSend: true,
      remainingCooldown: 0
    };
  }
  
  const remainingCooldown = Math.ceil((RATE_LIMIT_COOLDOWN - timeSinceLastSent) / 1000);
  
  return {
    canSend: false,
    remainingCooldown,
    nextAllowedTime: new Date(storedLastSent + RATE_LIMIT_COOLDOWN)
  };
}

/**
 * Update last sent timestamp for rate limiting
 */
function updateLastSentTime(): void {
  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, Date.now().toString());
  } catch (error) {
    console.warn("Failed to update rate limit timestamp:", error);
  }
}

/**
 * Get visitor metadata for question context
 */
export function getVisitorMetadata(): VisitorMetadata {
  if (typeof window === 'undefined') {
    return {
      pagePath: "/",
      referrer: null,
      ipHash: null,
      userAgent: "Server-side",
      language: "en",
      screenResolution: "unknown",
      timezone: "UTC"
    };
  }
  
  return {
    pagePath: window.location.pathname,
    referrer: document.referrer || null,
    ipHash: null, // Will be set server-side if needed
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Submit a new question
 */
export async function submitQuestion(question: string): Promise<{
  success: boolean;
  error?: string;
  questionId?: string;
}> {
  try {
    // Validate question
    const validation = validateQuestion(question);
    if (!validation.isValid) {
      showErrorToast(validation.error!);
      return { success: false, error: validation.error };
    }
    
    // Check rate limiting
    const rateLimitCheck = canSendQuestion();
    if (!rateLimitCheck.canSend) {
      const errorMsg = `Please wait ${rateLimitCheck.remainingCooldown} seconds before sending another question`;
      showWarningToast(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    // Get visitor UUID
    const visitorUuid = getVisitorUuidWithFallbacks();
    
    // Create question data
    const questionData: CreateDirectQuestionData = {
      question: validation.cleanedQuestion!,
      metadata: getVisitorMetadata()
    };
    
    // Submit to Firebase with fallback handling
    const docRef = await safeAddDirectQuestion(visitorUuid, questionData);
    
    // Update rate limit
    updateLastSentTime();
    
    // Show success toast
    showSuccessToast("Your question has been sent successfully!");
    
    return { success: true, questionId: docRef.id };
    
  } catch (error) {
    console.error("Failed to submit question:", error);
    const errorMsg = "Failed to send question. Please try again.";
    showErrorToast(errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get questions for current visitor with timeout and robust error handling
 */
export async function getCurrentVisitorQuestions(): Promise<DirectQuestion[]> {
  const timeoutPromise = new Promise<DirectQuestion[]>((_, reject) => {
    setTimeout(() => reject(new Error('Questions loading timeout')), 8000); // 8 second timeout
  });

  const questionsPromise = async (): Promise<DirectQuestion[]> => {
    let retryCount = 0;
    const maxRetries = 2; // Reduced retries for faster response
    const retryDelay = 1000;

    while (retryCount < maxRetries) {
      try {
        const visitorUuid = getVisitorUuidWithFallbacks();
        const questions = await safeGetVisitorQuestions(visitorUuid);
        
        // Filter out any malformed questions that might cause issues
        const validQuestions = questions.filter(question => {
          return question &&
                 question.id &&
                 question.question &&
                 question.status &&
                 question.visitorUuid;
        });
        
        if (validQuestions.length !== questions.length) {
          console.warn(`Filtered out ${questions.length - validQuestions.length} malformed questions`);
        }
        
        return validQuestions;
      } catch (error) {
        retryCount++;
        console.error(`Failed to get visitor questions (attempt ${retryCount}/${maxRetries}):`, error);
        
        // Check if this is a permissions or deletion-related error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isPermissionError = errorMessage.includes('permission-denied') || errorMessage.includes('unauthorized');
        const isNotFoundError = errorMessage.includes('not-found') || errorMessage.includes('document does not exist');
        
        if (isPermissionError || isNotFoundError) {
          // Don't retry for these types of errors
          console.warn("Questions may have been deleted by admin or permissions changed");
          return [];
        }
        
        // If this is the last attempt, throw to be caught by timeout handler
        if (retryCount >= maxRetries) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
      }
    }

    return [];
  };

  try {
    return await Promise.race([questionsPromise(), timeoutPromise]);
  } catch (error) {
    console.warn('Questions loading timed out or failed, returning empty array:', error);
    return [];
  }
}

/**
 * Mark visitor questions as read with retry logic
 */
export async function markCurrentVisitorQuestionsAsRead(questionIds: string[]): Promise<boolean> {
  if (!questionIds || questionIds.length === 0) {
    return true; // Nothing to mark, consider it successful
  }

  let retryCount = 0;
  const maxRetries = 2; // Fewer retries for this operation
  const retryDelay = 1000;

  while (retryCount < maxRetries) {
    try {
      // Use the API route for better error handling and consistency
      const response = await fetch('/api/direct-questions/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ids: questionIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // If questions not found, they might have been deleted - consider this successful
        if (response.status === 404 || errorData.error?.includes('not found')) {
          console.warn("Questions not found when marking as read - they may have been deleted");
          return true;
        }
        
        throw new Error(errorData.error || 'Failed to mark questions as read');
      }

      const data = await response.json();
      console.log(`✅ ${data.data?.markedAsRead || questionIds.length} questions marked as read`);
      
      return true;
    } catch (error) {
      retryCount++;
      console.error(`❌ Failed to mark questions as read (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        // Don't show error toast for this operation as it's not critical
        console.warn("Failed to mark questions as read after retries - continuing silently");
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return false;
}

/**
 * Get current visitor question statistics with robust error handling
 */
export async function getCurrentVisitorStats(): Promise<any> {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  while (retryCount < maxRetries) {
    try {
      const visitorUuid = getVisitorUuidWithFallbacks();
      const stats = await safeGetVisitorQuestionStats(visitorUuid);
      
      // Return successful stats or safe fallback
      return stats || {
        totalQuestions: 0,
        unanswered: 0,
        answered: 0,
        archived: 0,
        unread: 0,
        lastQuestionAt: null
      };
    } catch (error) {
      retryCount++;
      console.error(`Failed to get visitor stats (attempt ${retryCount}/${maxRetries}):`, error);
      
      // If this is the last attempt, return safe fallback
      if (retryCount >= maxRetries) {
        showErrorToast("Unable to load question statistics");
        return {
          totalQuestions: 0,
          unanswered: 0,
          answered: 0,
          archived: 0,
          unread: 0,
          lastQuestionAt: null
        };
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
    }
  }

  // Fallback return (should never reach here)
  return {
    totalQuestions: 0,
    unanswered: 0,
    answered: 0,
    archived: 0,
    unread: 0,
    lastQuestionAt: null
  };
}

/**
 * Page Visibility API helpers
 */
export class PageVisibilityManager {
  private state: PageVisibilityState;
  private listeners: Array<(state: PageVisibilityState) => void> = [];
  
  constructor() {
    this.state = {
      isVisible: !document.hidden,
      hasFocus: document.hasFocus(),
      lastChangeTime: new Date()
    };
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
  }
  
  private handleVisibilityChange(): void {
    this.updateState({
      isVisible: !document.hidden,
      lastChangeTime: new Date()
    });
  }
  
  private handleFocus(): void {
    this.updateState({
      hasFocus: true,
      lastChangeTime: new Date()
    });
  }
  
  private handleBlur(): void {
    this.updateState({
      hasFocus: false,
      lastChangeTime: new Date()
    });
  }
  
  private updateState(updates: Partial<PageVisibilityState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }
  
  public getState(): PageVisibilityState {
    return { ...this.state };
  }
  
  public onStateChange(callback: (state: PageVisibilityState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  public isPageActive(): boolean {
    return this.state.isVisible && this.state.hasFocus;
  }
  
  public cleanup(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('focus', this.handleFocus.bind(this));
    window.removeEventListener('blur', this.handleBlur.bind(this));
    this.listeners = [];
  }
}

// Global page visibility manager instance
let pageVisibilityManager: PageVisibilityManager | null = null;

/**
 * Get or create page visibility manager
 */
export function getPageVisibilityManager(): PageVisibilityManager {
  if (typeof window === 'undefined') {
    throw new Error('Page visibility manager can only be used in browser environment');
  }
  
  if (!pageVisibilityManager) {
    pageVisibilityManager = new PageVisibilityManager();
  }
  
  return pageVisibilityManager;
}

/**
 * Show toast with page visibility awareness
 */
export function showQuestionToast(options: QuestionToastOptions): void {
  const { message, type, duration, onlyWhenVisible, onAction } = options;
  
  if (onlyWhenVisible && typeof window !== 'undefined') {
    const visibilityManager = getPageVisibilityManager();
    
    if (!visibilityManager.isPageActive()) {
      // Wait for page to become active before showing toast
      const unsubscribe = visibilityManager.onStateChange((state) => {
        if (state.isVisible && state.hasFocus) {
          unsubscribe();
          showQuestionToast({ ...options, onlyWhenVisible: false });
        }
      });
      return;
    }
  }
  
  // Show appropriate toast type
  const toastMessage = onAction ? `${message} (Click to view)` : message;
  
  switch (type) {
    case 'success':
      showSuccessToast(toastMessage);
      break;
    case 'error':
      showErrorToast(toastMessage);
      break;
    case 'warning':
      showWarningToast(toastMessage);
      break;
    case 'info':
      showInfoToast(toastMessage);
      break;
  }
  
  if (onAction) {
    // Note: Real implementation would need to handle click events
    // This is a simplified version for the utility library
    setTimeout(onAction, 100);
  }
}

/**
 * Real-time question listener wrapper
 */
export class QuestionListenerManager {
  private listeners: Map<string, () => void> = new Map();
  
  /**
   * Setup real-time listener for current visitor questions
   */
  public setupCurrentVisitorListener(
    callback: (questions: DirectQuestion[]) => void,
    options?: {
      showToastOnUpdate?: boolean;
      onlyWhenVisible?: boolean;
    }
  ): QuestionListener {
    const visitorUuid = getVisitorUuidWithFallbacks();
    const listenerId = `visitor-${visitorUuid}`;
    
    // Clean up existing listener
    this.cleanup(listenerId);
    
    const unsubscribe = safeListenToVisitorQuestions(
      visitorUuid,
      (questions) => {
        callback(questions);
        
        // Show toast for new answers if enabled
        if (options?.showToastOnUpdate) {
          const unreadAnswers = questions.filter(q => 
            q.status === 'answered' && q.unreadForVisitor
          );
          
          if (unreadAnswers.length > 0) {
            showQuestionToast({
              message: `You have ${unreadAnswers.length} new answer${unreadAnswers.length > 1 ? 's' : ''}!`,
              type: 'success',
              onlyWhenVisible: options?.onlyWhenVisible || true,
              onAction: () => {
                // Mark as read
                const questionIds = unreadAnswers.map(q => q.id);
                markCurrentVisitorQuestionsAsRead(questionIds);
              }
            });
          }
        }
      },
      (error) => {
        console.error('Question listener error:', error);
        showErrorToast("Connection error. Some updates may be delayed.");
      }
    );
    
    this.listeners.set(listenerId, unsubscribe);
    
    return {
      unsubscribe: () => this.cleanup(listenerId),
      isActive: true
    };
  }
  
  /**
   * Cleanup specific listener
   */
  public cleanup(listenerId?: string): void {
    if (listenerId) {
      const unsubscribe = this.listeners.get(listenerId);
      if (unsubscribe) {
        unsubscribe();
        this.listeners.delete(listenerId);
      }
    } else {
      // Cleanup all listeners
      this.listeners.forEach(unsubscribe => unsubscribe());
      this.listeners.clear();
    }
  }
  
  /**
   * Get active listener count
   */
  public getActiveListenerCount(): number {
    return this.listeners.size;
  }
}

// Global question listener manager
let questionListenerManager: QuestionListenerManager | null = null;

/**
 * Get or create question listener manager
 */
export function getQuestionListenerManager(): QuestionListenerManager {
  if (!questionListenerManager) {
    questionListenerManager = new QuestionListenerManager();
  }
  
  return questionListenerManager;
}

/**
 * Cleanup all managers (call on unmount/cleanup)
 */
export function cleanupAskDirectlyUtils(): void {
  if (pageVisibilityManager) {
    pageVisibilityManager.cleanup();
    pageVisibilityManager = null;
  }
  
  if (questionListenerManager) {
    questionListenerManager.cleanup();
    questionListenerManager = null;
  }
}