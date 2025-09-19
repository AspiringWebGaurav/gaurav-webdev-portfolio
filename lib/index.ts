// lib/index.ts
// Main export file for Ask Me Directly Q&A system utilities

// Re-export types
export * from './types';

// Re-export visitor utilities
export * from './visitor';

// Re-export Firebase Q&A functions
export {
  directQuestionsCollection,
  getDirectQuestionsCollection,
  addDirectQuestion,
  getVisitorQuestions,
  updateQuestionStatus,
  markQuestionsAsRead,
  getVisitorQuestionStats,
  listenToVisitorQuestions
} from './firebase';

// Re-export main Q&A utilities
export {
  validateQuestion,
  canSendQuestion,
  getVisitorMetadata,
  submitQuestion,
  getCurrentVisitorQuestions,
  markCurrentVisitorQuestionsAsRead,
  getCurrentVisitorStats,
  PageVisibilityManager,
  getPageVisibilityManager,
  showQuestionToast,
  QuestionListenerManager,
  getQuestionListenerManager,
  cleanupAskDirectlyUtils
} from './askDirectly';

// Export Firebase core (already exported, but for completeness)
export { db, app, storage } from './firebase';
export type { Firestore, FirebaseApp, FirebaseStorage } from './firebase';