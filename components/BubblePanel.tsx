'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, MessageSquare, ChevronDown } from 'lucide-react';
import QuickActions from './bubble/QuickActions';
import PredefinedQuestions from './bubble/PredefinedQuestions';
import ChatInterface from './bubble/ChatInterface';

interface BubblePanelProps {
  onClose: () => void;
  initialViewMode?: 'main' | 'chat';
}

type ViewMode = 'main' | 'chat';

export default function BubblePanel({ onClose, initialViewMode = 'main' }: BubblePanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [settings, setSettings] = useState({
    welcomeMessage: 'Hi there! How can I help you today?',
    quickActionsTitle: 'Quick Actions',
    predefinedQuestionsTitle: 'Common Questions',
  });

  // Update view mode when initialViewMode changes
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/bubble/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            welcomeMessage: data.welcomeMessage || 'Hi there! How can I help you today?',
            quickActionsTitle: data.quickActionsTitle || 'Quick Actions',
            predefinedQuestionsTitle: data.predefinedQuestionsTitle || 'Common Questions',
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    }
    fetchSettings();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white rounded-none sm:rounded-xl overflow-hidden">
      {/* Header - Fixed at top, never scrolls */}
      <div className="flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 border-b border-gray-200 bg-white flex-shrink-0 z-10">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
          {viewMode === 'chat' ? 'Ask Me Direct' : 'Chat with Me'}
        </h2>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          {viewMode === 'chat' && (
            <button
              onClick={() => setViewMode('main')}
              className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Back to main"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content - Takes remaining space, scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        {viewMode === 'main' ? (
          <div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-4 -webkit-overflow-scrolling-touch">
            {/* Welcome Message - Mobile Optimized */}
            {settings.welcomeMessage && (
              <div className="text-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 bg-gray-50">
                {settings.welcomeMessage}
              </div>
            )}

            {/* Quick Actions */}
            <QuickActions
              title={settings.quickActionsTitle}
              onAskMeDirect={() => setViewMode('chat')}
            />

            {/* Predefined Questions */}
            <PredefinedQuestions title={settings.predefinedQuestionsTitle} />
          </div>
        ) : (
          <ChatInterface />
        )}
      </div>
    </div>
  );
}
