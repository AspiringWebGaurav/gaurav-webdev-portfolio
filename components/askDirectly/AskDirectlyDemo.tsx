"use client";

// Test file to verify component integration and TypeScript types
// This can be used for development and testing purposes

import React, { useState } from 'react';
import {
  AskDirectlyButton,
  AskDirectlyModal,
  QuestionForm,
  QuestionsList,
  QuestionStatus,
  QuestionStatusBadge,
  QuestionStatusDot,
  CompactAskButton,
  SimpleAskModal,
  RecentQuestionsList,
  type DirectQuestion,
  type QuestionStatusType,
  validateQuestion,
  canSendQuestion
} from './index';
import { Timestamp } from 'firebase/firestore';

/**
 * Demo component to test all Ask Directly components integration
 * This component demonstrates:
 * 1. Component composition
 * 2. TypeScript type checking
 * 3. Proper prop passing
 * 4. Event handling
 */
export default function AskDirectlyDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<DirectQuestion | null>(null);

  // Mock question data for testing
  const mockQuestion: DirectQuestion = {
    id: 'demo-question-1',
    visitorUuid: 'demo-visitor-123',
    question: 'This is a test question to demonstrate the components',
    status: 'answered' as QuestionStatusType,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
    updatedAt: Timestamp.fromDate(new Date()),
    answeredAt: Timestamp.fromDate(new Date()),
    adminReply: 'This is a test admin reply to show how answered questions look',
    unreadForVisitor: true,
    metadata: {
      pagePath: '/demo',
      referrer: null,
      ipHash: null,
      userAgent: 'Demo Browser',
      language: 'en-US',
      screenResolution: '1920x1080',
      timezone: 'America/New_York'
    }
  };

  // Test utility functions
  const testUtilities = () => {
    // Test validation
    const validationResult = validateQuestion('This is a test question');
    console.log('Validation result:', validationResult);

    // Test rate limiting
    const rateLimitResult = canSendQuestion();
    console.log('Rate limit result:', rateLimitResult);
  };

  // Event handlers
  const handleQuestionSuccess = (questionId: string) => {
    console.log('Question submitted successfully:', questionId);
  };

  const handleQuestionClick = (question: DirectQuestion) => {
    console.log('Question clicked:', question.id);
    setSelectedQuestion(question);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Ask Me Directly - Component Demo
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            This demo page shows all the Ask Directly Q&A system components working together.
            It demonstrates TypeScript integration, component composition, and proper event handling.
          </p>
          <button
            onClick={testUtilities}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Test Utility Functions
          </button>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Status Components */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-4">Status Components</h2>
            
            <div className="bg-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-lg font-medium text-white">Question Status Variants</h3>
              
              <div className="space-y-3">
                <QuestionStatus
                  status="unanswered"
                  createdAt={mockQuestion.createdAt}
                  answeredAt={null}
                  unreadForVisitor={false}
                />
                
                <QuestionStatus
                  status="answered"
                  createdAt={mockQuestion.createdAt}
                  answeredAt={mockQuestion.answeredAt}
                  unreadForVisitor={true}
                />
                
                <QuestionStatus
                  status="archived"
                  createdAt={mockQuestion.createdAt}
                  answeredAt={null}
                  unreadForVisitor={false}
                />
              </div>

              <div className="flex gap-2 flex-wrap pt-4 border-t border-slate-700">
                <QuestionStatusBadge status="unanswered" />
                <QuestionStatusBadge status="answered" />
                <QuestionStatusBadge status="archived" />
              </div>

              <div className="flex gap-2 items-center pt-2">
                <QuestionStatusDot status="unanswered" />
                <QuestionStatusDot status="answered" />
                <QuestionStatusDot status="archived" />
                <span className="text-slate-400 text-sm">Status dots</span>
              </div>
            </div>
          </div>

          {/* Question Form */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-4">Question Form</h2>
            
            <div className="bg-slate-800 p-6 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4">Standalone Form</h3>
              <QuestionForm
                onSuccess={handleQuestionSuccess}
                placeholder="Test the question form here..."
                autoFocus={false}
              />
            </div>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-4">Questions List</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Default List */}
              <div className="bg-slate-800 p-6 rounded-xl">
                <h3 className="text-lg font-medium text-white mb-4">Default View</h3>
                <QuestionsList
                  enableRealTime={false}
                  onQuestionClick={handleQuestionClick}
                  maxQuestions={3}
                />
              </div>

              {/* Compact List */}
              <div className="bg-slate-800 p-6 rounded-xl">
                <h3 className="text-lg font-medium text-white mb-4">Recent Questions</h3>
                <RecentQuestionsList
                  count={3}
                  enableRealTime={false}
                  onQuestionClick={handleQuestionClick}
                />
              </div>

              {/* Filtered List */}
              <div className="bg-slate-800 p-6 rounded-xl">
                <h3 className="text-lg font-medium text-white mb-4">Answered Only</h3>
                <QuestionsList
                  statusFilter="answered"
                  enableRealTime={false}
                  variant="compact"
                  maxQuestions={3}
                />
              </div>
            </div>
          </div>

          {/* Button Variants */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-4">Button Components</h2>
            
            <div className="bg-slate-800 p-6 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4">Button Variants</h3>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  Open Full Modal
                </button>
                
                <span className="text-slate-400">|</span>
                
                <p className="text-slate-400 text-sm">
                  The floating button is positioned at bottom-right of the page
                </p>
              </div>
              
              {/* Position the compact button relative to this container */}
              <div className="relative mt-6 h-32 bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-600">
                <p className="absolute top-2 left-2 text-slate-400 text-xs">
                  Demo container with positioned button
                </p>
                <CompactAskButton
                  position="bottom-right"
                  offset={{ x: 4, y: 4 }}
                  className="!absolute"
                  initiallyHidden={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Question Display */}
        {selectedQuestion && (
          <div className="bg-slate-800 p-6 rounded-xl border-2 border-blue-500/50">
            <h3 className="text-lg font-medium text-white mb-4">Selected Question</h3>
            <div className="space-y-2">
              <p className="text-slate-300">{selectedQuestion.question}</p>
              {selectedQuestion.adminReply && (
                <div className="pl-4 border-l-2 border-green-500/30">
                  <p className="text-green-400 text-sm font-medium">Admin Reply:</p>
                  <p className="text-slate-300">{selectedQuestion.adminReply}</p>
                </div>
              )}
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Floating Button */}
      <AskDirectlyButton
        position="bottom-right"
        offset={{ x: 6, y: 6 }}
        size="md"
        showNotificationBadge={true}
        enableRealTime={false}
        initiallyHidden={false}
        showDelay={0}
      />

      {/* Modal */}
      <AskDirectlyModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        showViewToggle={true}
        title="Ask Me Directly - Demo Modal"
      />

      {/* Simple Modal Test */}
      <SimpleAskModal
        isOpen={false} // Controlled separately if needed
        onClose={() => {}}
      />
    </div>
  );
}

/**
 * TypeScript Type Testing
 * These functions test that all types are properly exported and usable
 */
export function TypeTestingExamples() {
  // Test that all types are properly imported and can be used
  const testQuestion: DirectQuestion = {
    id: 'test',
    visitorUuid: 'test-visitor',
    question: 'Test question',
    status: 'unanswered',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    answeredAt: null,
    adminReply: null,
    unreadForVisitor: false,
    metadata: {
      pagePath: '/test',
      referrer: null,
      ipHash: null
    }
  };

  // Test utility function types
  const validation = validateQuestion('test');
  const rateLimit = canSendQuestion();

  console.log('Type testing complete:', { testQuestion, validation, rateLimit });
  
  return null; // This component is just for type testing
}