"use client";

import React from 'react';
import { PredefinedQuestionsProps } from './types';
import { JarvisLoader } from './JarvisAnimations';

const PredefinedQuestions: React.FC<PredefinedQuestionsProps> = ({
  questions,
  onQuestionClick,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <JarvisLoader size="medium" />
        <p className="text-gray-400 mt-4 text-sm">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-400 text-sm mb-2">Failed to load questions</p>
        <p className="text-gray-400 text-xs">{error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm mb-2">No questions available</p>
        <p className="text-gray-500 text-xs">Questions will appear here once added by the admin</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="group"
          >
            <div className="bg-black-100/50 hover:bg-black-100/70 border border-white/[0.1] hover:border-blue-500/50 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:scale-[1.01]">
              {/* Question */}
              <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm sm:text-base font-medium leading-relaxed group-hover:text-blue-100 transition-colors">
                    {question.question}
                  </p>
                </div>
              </div>

              {/* Answer Preview */}
              <div className="ml-11 sm:ml-14 mb-3 sm:mb-4">
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
                  {question.answer.length > 120
                    ? `${question.answer.substring(0, 120)}...`
                    : question.answer
                  }
                </p>
              </div>

              {/* Actions/Indicators - Mobile First Layout */}
              <div className="ml-11 sm:ml-14 space-y-3 sm:space-y-0">
                {/* Primary Actions Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {question.fileUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuestionClick(question);
                      }}
                      className="inline-flex items-center justify-center px-4 py-3 sm:py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl order-1"
                      title={`Download ${question.fileName || 'file'}`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      📄 Download {question.fileName ? question.fileName.split('.')[0] : 'File'}
                    </button>
                  )}
                  
                  {question.anchorLink && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuestionClick(question);
                      }}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 hover:scale-105 order-2"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="hidden sm:inline">Go to Section</span>
                      <span className="sm:hidden">Section</span>
                    </button>
                  )}
                </div>

                {/* Secondary Action */}
                <div className="flex justify-end">
                  <button
                    onClick={() => onQuestionClick(question)}
                    className="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/50 transition-all duration-200 hover:scale-105"
                  >
                    <span className="hidden sm:inline">View Answer</span>
                    <span className="sm:hidden">Answer</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info - Reduced padding */}
      <div className="px-4 py-2 sm:px-5 sm:py-3 border-t border-white/[0.05] bg-black-100/30">
        <div className="text-center">
          <p className="text-gray-400 text-xs sm:text-sm">
            <span className="hidden sm:inline">Click questions for answers • Download files directly</span>
            <span className="sm:hidden">Tap for answers & downloads</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredefinedQuestions;