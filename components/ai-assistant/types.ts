// AI Assistant TypeScript Types and Interfaces

export interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  anchorLink?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  lastActivity: string;
}

export interface AssistantState {
  isVisible: boolean;
  isMinimized: boolean;
  activeTab: 'predefined' | 'chat' | 'settings';
  isLoading: boolean;
  error?: string;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface FileUpload {
  file: File;
  url?: string;
  name: string;
  size: number;
  type: string;
}

export interface AssistantConfig {
  delayAfterLoad: number;
  animationDuration: number;
  maxChatHistory: number;
  supportedFileTypes: string[];
  maxFileSize: number;
}

export interface AdminQuestionFormData {
  question: string;
  answer: string;
  anchorLink?: string;
  file?: FileUpload;
}

export interface JarvisAnimationProps {
  isActive: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'purple' | 'cyan';
  intensity?: 'low' | 'medium' | 'high';
}

export interface AssistantPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

export interface AIAutoPopupProps {
  isVisible: boolean;
  onDismiss: () => void;
  message: string;
  autoHideDelay?: number;
  originPosition?: { x: number; y: number };
}

export interface PopupSessionState {
  hasShownInitialPopup: boolean;
  hasOpenedAI: boolean;
  lastPopupTime: string;
  popupCount: number;
  sessionStartTime: string;
}

export interface FlashPopupProps {
  isVisible: boolean;
  onComplete: () => void;
  duration?: number;
}

export interface PredefinedQuestionsProps {
  questions: AIQuestion[];
  onQuestionClick: (question: AIQuestion) => void;
  isLoading: boolean;
  error?: string;
}

export interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error?: string;
}

export interface AssistantInterfaceProps {
  activeTab: 'predefined' | 'chat' | 'settings';
  onTabChange: (tab: 'predefined' | 'chat' | 'settings') => void;
  questions: AIQuestion[];
  chatMessages: ChatMessage[];
  onQuestionClick: (question: AIQuestion) => void;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error?: string;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QuestionsAPIResponse extends APIResponse {
  data?: {
    questions: AIQuestion[];
    total: number;
  };
}

export interface ChatAPIResponse extends APIResponse {
  data?: {
    message: string;
    messageId: string;
  };
}

export interface FileUploadAPIResponse extends APIResponse {
  data?: {
    url: string;
    fileName: string;
    fileSize: number;
  };
}

// Admin Dashboard Types
export interface AdminAITabProps {
  questions: AIQuestion[];
  onAddQuestion: (data: AdminQuestionFormData) => Promise<void>;
  onEditQuestion: (id: string, data: AdminQuestionFormData) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onRefresh: () => void;
  isLoading: boolean;
}

export interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdminQuestionFormData) => Promise<void>;
  editingQuestion?: AIQuestion;
  isLoading: boolean;
}

// Constants
export const ASSISTANT_CONFIG: AssistantConfig = {
  delayAfterLoad: 2000, // 2 seconds
  animationDuration: 800,
  maxChatHistory: 50,
  supportedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

export const OPENROUTER_MODELS = {
  GPT_3_5_TURBO: 'openai/gpt-3.5-turbo',
  MIXTRAL: 'mistralai/mixtral-8x7b-instruct',
} as const;

export const SYSTEM_PROMPT = `You are Gaurav's Personal Assistant, an AI helper for Gaurav's portfolio website. Your role is to help visitors navigate the portfolio and answer questions about Gaurav's work, skills, and experience.

Guidelines:
1. Be helpful, professional, and friendly
2. Focus on Gaurav's portfolio, projects, skills, and professional background
3. If asked about topics unrelated to Gaurav's portfolio, politely redirect: "Sorry, I can only answer questions about Gaurav's portfolio."
4. Provide specific information when possible, including links to relevant sections
5. Keep responses concise but informative
6. Use a conversational but professional tone

You can help with:
- Information about Gaurav's projects and work
- Technical skills and expertise
- Professional experience
- Contact information
- Navigation around the portfolio
- Downloading resume or other materials`;