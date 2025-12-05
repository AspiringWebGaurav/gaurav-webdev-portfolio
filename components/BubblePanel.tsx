'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, MessageSquare, ChevronDown, AlertCircle } from 'lucide-react';
import QuickActions from './bubble/QuickActions';
import PredefinedQuestions from './bubble/PredefinedQuestions';
import ChatInterface from './bubble/ChatInterface';

interface BubblePanelProps {
  onClose: () => void;
  initialViewMode?: 'main' | 'chat';
  theme?: 'light' | 'dark';
}

type ViewMode = 'main' | 'chat';

interface MaintenanceBubbleSettings {
  allowResumeView: boolean;
  allowResumeDownload: boolean;
  allowAskDirect: boolean;
  allowPredefinedQuestions: boolean;
  disabledMessage: string;
}

export default function BubblePanel({ onClose, initialViewMode = 'main', theme = 'light' }: BubblePanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [bubbleSettings, setBubbleSettings] = useState<MaintenanceBubbleSettings | null>(null);
  const [settings, setSettings] = useState({
    welcomeMessage: 'Hi there! How can I help you today?',
    quickActionsTitle: 'Quick Actions',
    predefinedQuestionsTitle: 'Common Questions',
    showBranding: true,
  });

  // Update view mode when initialViewMode changes
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  // Fetch maintenance status
  useEffect(() => {
    async function fetchMaintenanceStatus() {
      try {
        const response = await fetch('/api/maintenance/status');
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data.enabled === true);
          if (data.enabled && data.bubbleSettings) {
            setBubbleSettings(data.bubbleSettings);
          } else {
            setBubbleSettings(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch maintenance status:', error);
      }
    }
    fetchMaintenanceStatus();
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/bubble/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            welcomeMessage: data.settings.welcomeMessage || 'Hi there! How can I help you today?',
            quickActionsTitle: data.settings.quickActionsTitle || 'Quick Actions',
            predefinedQuestionsTitle: data.settings.predefinedQuestionsTitle || 'Common Questions',
            showBranding: data.settings.showBranding !== undefined ? data.settings.showBranding : true,
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    }
    fetchSettings();
  }, []);

  // Check if Ask Direct should be blocked
  const isAskDirectBlocked = maintenanceMode && bubbleSettings && !bubbleSettings.allowAskDirect;

  // Handle view mode change - block if maintenance restricts it
  const handleAskDirect = () => {
    if (isAskDirectBlocked) return;
    setViewMode('chat');
  };

  return (
    <div className={`flex flex-col h-full rounded-none sm:rounded-xl overflow-hidden ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header - Fixed at top, never scrolls */}
      <div className={`flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 border-b flex-shrink-0 z-10 ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <h2 className={`text-base sm:text-lg font-semibold truncate ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
        }`}>
          {viewMode === 'chat' ? 'Ask Me Direct' : 'Chat with Me'}
        </h2>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          {viewMode === 'chat' && (
            <button
              onClick={() => setViewMode('main')}
              className={`p-2 sm:p-2 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                theme === 'dark' ? 'hover:bg-gray-700 active:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 active:bg-gray-200 text-gray-600'
              }`}
              aria-label="Back to main"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-2 sm:p-2 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
              theme === 'dark' ? 'hover:bg-gray-700 active:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 active:bg-gray-200 text-gray-600'
            }`}
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content - Takes remaining space, scrollable */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {viewMode === 'main' ? (
          <div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-4 -webkit-overflow-scrolling-touch">
            {/* Maintenance Mode Banner */}
            {maintenanceMode && (
              <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Site is under maintenance. Some features may be limited.</span>
              </div>
            )}

            {/* Welcome Message - Mobile Optimized */}
            {settings.welcomeMessage && (
              <div className={`text-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base mb-4 sm:mb-6 ${
                theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
              }`}>
                {settings.welcomeMessage}
              </div>
            )}

            {/* Quick Actions */}
            <QuickActions
              title={settings.quickActionsTitle}
              onAskMeDirect={handleAskDirect}
            />

            {/* Predefined Questions */}
            <PredefinedQuestions title={settings.predefinedQuestionsTitle} />
            
            {/* Branding Footer */}
            {settings.showBranding && (
              <div className={`text-center mt-6 pt-4 border-t text-xs ${
                theme === 'dark' ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
              }`}>
                Powered by Portfolio Chat
              </div>
            )}
          </div>
        ) : (
          <ChatInterface />
        )}
      </div>
    </div>
  );
}
