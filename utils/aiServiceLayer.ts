// AI Service Layer - Enhanced error handling and system isolation
// This layer sits between the UI components and the APIs to provide:
// 1. Independent error handling for Firebase and OpenRouter
// 2. Retry mechanisms with exponential backoff
// 3. Fallback data and graceful degradation
// 4. Comprehensive logging and monitoring

import { AIQuestion, ChatMessage, APIResponse } from '@/components/ai-assistant/types';
import { prodLogger, devLogger } from './secureLogger';

// Service configuration
const SERVICE_CONFIG = {
  firebase: {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    timeout: 15000, // 15 seconds
  },
  openrouter: {
    maxRetries: 2,
    baseDelay: 2000, // 2 seconds
    maxDelay: 8000, // 8 seconds
    timeout: 30000, // 30 seconds
  }
};

// Fallback data for when Firebase is unavailable
const FALLBACK_QUESTIONS: AIQuestion[] = [
  {
    id: 'fallback-1',
    question: 'What projects has Gaurav worked on?',
    answer: 'Gaurav has worked on various web development projects including portfolio websites, e-commerce platforms, and full-stack applications using React, Next.js, and modern web technologies.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    question: 'What are Gaurav\'s technical skills?',
    answer: 'Gaurav specializes in frontend development with React, Next.js, TypeScript, Tailwind CSS, and modern JavaScript. He also has experience with backend technologies, databases, and cloud deployment.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    question: 'How can I contact Gaurav?',
    answer: 'You can contact Gaurav through the contact form on this portfolio website, or connect with him on professional networks. Check the footer section for contact options.',
    createdAt: new Date().toISOString(),
  }
];

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateBackoffDelay = (attempt: number, baseDelay: number, maxDelay: number): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
  return Math.min(jitteredDelay, maxDelay);
};

// Enhanced fetch with timeout and retry logic
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  config: typeof SERVICE_CONFIG.firebase
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      devLogger.debug(`Attempt ${attempt}/${config.maxRetries} for ${url}`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        devLogger.debug(`Success on attempt ${attempt} for ${url}`);
        return response;
      }

      // If it's a client error (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }

      // Server error (5xx), prepare for retry
      throw new Error(`Server error: ${response.status} ${response.statusText}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      devLogger.warn(`Attempt ${attempt} failed for ${url}:`, lastError.message);

      // If it's the last attempt, don't wait
      if (attempt === config.maxRetries) {
        break;
      }

      // Wait before retrying (with exponential backoff)
      const delay = calculateBackoffDelay(attempt, config.baseDelay, config.maxDelay);
      devLogger.debug(`Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

// Firebase Questions Service (Isolated)
export class FirebaseQuestionsService {
  private static instance: FirebaseQuestionsService;
  private cache: AIQuestion[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FirebaseQuestionsService {
    if (!FirebaseQuestionsService.instance) {
      FirebaseQuestionsService.instance = new FirebaseQuestionsService();
    }
    return FirebaseQuestionsService.instance;
  }

  private isValidCache(): boolean {
    return this.cache !== null && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  async getQuestions(): Promise<{ success: boolean; data: AIQuestion[]; error?: string; source: 'api' | 'cache' | 'fallback' }> {
    try {
      // Return cached data if valid
      if (this.isValidCache()) {
        devLogger.debug('Returning cached questions');
        return {
          success: true,
          data: this.cache!,
          source: 'cache'
        };
      }

      devLogger.debug('Fetching questions from Firebase API');

      const response = await fetchWithRetry(
        '/api/ai-assistant/questions',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        SERVICE_CONFIG.firebase
      );

      const result = await response.json();

      if (result.success && result.data?.questions) {
        // Update cache
        this.cache = result.data.questions;
        this.cacheTimestamp = Date.now();

        devLogger.debug(`Successfully fetched ${result.data.questions.length} questions`);
        
        return {
          success: true,
          data: result.data.questions,
          source: 'api'
        };
      } else {
        throw new Error(result.error || 'Invalid response format');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      prodLogger.error('Firebase Questions Service failed', { error: errorMessage });

      // Return fallback data
      devLogger.warn('Using fallback questions due to Firebase error');
      
      return {
        success: false,
        data: FALLBACK_QUESTIONS,
        error: 'Using offline questions. Some features may be limited.',
        source: 'fallback'
      };
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    devLogger.debug('Firebase questions cache cleared');
  }
}

// OpenRouter Chat Service (Isolated)
export class OpenRouterChatService {
  private static instance: OpenRouterChatService;
  private messageHistory: ChatMessage[] = [];
  private readonly MAX_HISTORY = 50;

  static getInstance(): OpenRouterChatService {
    if (!OpenRouterChatService.instance) {
      OpenRouterChatService.instance = new OpenRouterChatService();
    }
    return OpenRouterChatService.instance;
  }

  async sendMessage(message: string): Promise<{ success: boolean; data?: ChatMessage; error?: string; source: 'api' | 'fallback' }> {
    try {
      devLogger.debug('Sending message to OpenRouter API');

      const response = await fetchWithRetry(
        '/api/ai-assistant/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        },
        SERVICE_CONFIG.openrouter
      );

      const result = await response.json();

      if (result.success && result.data?.message) {
        const assistantMessage: ChatMessage = {
          id: result.data.messageId || Date.now().toString(),
          content: result.data.message,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };

        // Add to history
        this.addToHistory(assistantMessage);

        devLogger.debug('Successfully received AI response');
        
        return {
          success: true,
          data: assistantMessage,
          source: 'api'
        };
      } else {
        throw new Error(result.error || 'Invalid response format');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      prodLogger.error('OpenRouter Chat Service failed', { error: errorMessage });

      // Return fallback response
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "I'm currently experiencing technical difficulties. Please try again in a moment, or feel free to explore the predefined questions for information about Gaurav's portfolio.",
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      this.addToHistory(fallbackMessage);

      return {
        success: false,
        data: fallbackMessage,
        error: 'AI chat is temporarily unavailable. Please try the predefined questions.',
        source: 'fallback'
      };
    }
  }

  private addToHistory(message: ChatMessage): void {
    this.messageHistory.push(message);
    
    // Keep only the last MAX_HISTORY messages
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory = this.messageHistory.slice(-this.MAX_HISTORY);
    }
  }

  getHistory(): ChatMessage[] {
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory = [];
    devLogger.debug('Chat history cleared');
  }
}

// Service Health Monitor
export class AIServiceHealthMonitor {
  private static instance: AIServiceHealthMonitor;
  private firebaseStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
  private openrouterStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
  private lastFirebaseCheck: number = 0;
  private lastOpenRouterCheck: number = 0;
  private readonly CHECK_INTERVAL = 60000; // 1 minute

  static getInstance(): AIServiceHealthMonitor {
    if (!AIServiceHealthMonitor.instance) {
      AIServiceHealthMonitor.instance = new AIServiceHealthMonitor();
    }
    return AIServiceHealthMonitor.instance;
  }

  async checkFirebaseHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.lastFirebaseCheck < this.CHECK_INTERVAL) {
      return this.firebaseStatus;
    }

    try {
      const service = FirebaseQuestionsService.getInstance();
      const result = await service.getQuestions();
      
      this.firebaseStatus = result.source === 'api' ? 'healthy' : 
                           result.source === 'cache' ? 'healthy' : 'degraded';
      
      this.lastFirebaseCheck = now;
      return this.firebaseStatus;
      
    } catch (error) {
      this.firebaseStatus = 'down';
      this.lastFirebaseCheck = now;
      return this.firebaseStatus;
    }
  }

  async checkOpenRouterHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    // Trust API key configuration instead of making health check calls
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    
    if (apiKey && apiKey.startsWith('sk-or-v1-')) {
      this.openrouterStatus = 'healthy';
      devLogger.debug('OpenRouter: Healthy (API key configured)');
    } else {
      this.openrouterStatus = 'down';
      devLogger.debug('OpenRouter: Down (No valid API key)');
    }
    
    this.lastOpenRouterCheck = Date.now();
    return this.openrouterStatus;
  }

  getOverallStatus(): { firebase: string; openrouter: string; overall: string } {
    const overall = this.firebaseStatus === 'healthy' && this.openrouterStatus === 'healthy' 
      ? 'healthy' 
      : this.firebaseStatus === 'down' && this.openrouterStatus === 'down' 
      ? 'down' 
      : 'degraded';

    return {
      firebase: this.firebaseStatus,
      openrouter: this.openrouterStatus,
      overall
    };
  }
}

// Export service instances
export const firebaseQuestionsService = FirebaseQuestionsService.getInstance();
export const openRouterChatService = OpenRouterChatService.getInstance();
export const aiServiceHealthMonitor = AIServiceHealthMonitor.getInstance();