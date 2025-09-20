// components/askDirectly/index.ts
// Central export file for "Ask Me Directly" Q&A system components

// Main Components
export { default as QuestionStatus } from './QuestionStatus';
export { QuestionStatusBadge, QuestionStatusDot } from './QuestionStatus';

export { default as QuestionForm } from './QuestionForm';
export { CompactQuestionForm, ModalQuestionForm } from './QuestionForm';

export { default as QuestionsList } from './QuestionsList';
export { CompactQuestionsList, DetailedQuestionsList, RecentQuestionsList } from './QuestionsList';

export { default as AskDirectlyModal } from './AskDirectlyModal';
export { SimpleAskModal, QuestionsOnlyModal } from './AskDirectlyModal';

export { default as AskDirectlyButton } from './AskDirectlyButton';
export { CompactAskButton, LargeAskButton, SimpleAskButton } from './AskDirectlyButton';

export { default as AskDirectlyEmbedded } from './AskDirectlyEmbedded';
export { SimpleAskDirectlyEmbedded, QuestionsOnlyEmbedded } from './AskDirectlyEmbedded';

// Re-export types for convenience
export type {
  DirectQuestion,
  CreateDirectQuestionData,
  UpdateQuestionData,
  QuestionValidationResult,
  RateLimitResult,
  QuestionListener,
  VisitorQuestionStats,
  PageVisibilityState,
  QuestionToastOptions,
  VisitorMetadata,
  QuestionStatus as QuestionStatusType
} from '@/lib/types';

// Re-export utility functions
export {
  validateQuestion,
  canSendQuestion,
  submitQuestion,
  getCurrentVisitorQuestions,
  markCurrentVisitorQuestionsAsRead,
  getCurrentVisitorStats,
  getVisitorMetadata,
  getPageVisibilityManager,
  getQuestionListenerManager,
  showQuestionToast,
  cleanupAskDirectlyUtils
} from '@/lib/askDirectly';