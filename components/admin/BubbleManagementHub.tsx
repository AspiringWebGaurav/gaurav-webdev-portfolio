'use client';

import React, { useState } from 'react';
import { MessageSquare, HelpCircle, FileText, Bell, Settings } from 'lucide-react';
import { useBubbleManagement } from '@/contexts/BubbleManagementContext';
import AnimatedBadge from './AnimatedBadge';
import EnhancedBubbleChat from './bubble/EnhancedBubbleChat';
import BubblePredefinedQuestions from './bubble/BubblePredefinedQuestions';
import BubbleResumeManagement from './bubble/BubbleResumeManagement';
import BubbleTooltipEvents from './bubble/BubbleTooltipEvents';
import BubbleSettings from './bubble/BubbleSettings';

type SubTab = 'messages' | 'questions' | 'resume' | 'tooltips' | 'settings';

interface SubTabOption {
  id: SubTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function BubbleManagementHub() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('messages');
  const { getUnreadSessionsCount, sessions } = useBubbleManagement();
  const unreadSessionsCount = getUnreadSessionsCount();
  
  // Count live/online sessions
  const liveSessionsCount = sessions.filter(s => !s.deletedAt && s.visitorOnline).length;

  const subTabs: SubTabOption[] = [
    { 
      id: 'messages', 
      label: 'Live Chat', 
      icon: <MessageSquare className="w-4 h-4" />,
      badge: unreadSessionsCount
    },
    { id: 'questions', label: 'Quick Answers', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'resume', label: 'Resume', icon: <FileText className="w-4 h-4" /> },
    { id: 'tooltips', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Bubble Management Hub</h1>
            <p className="text-blue-100">
              Real-time visitor chat • Smart polling • Live sync enabled
            </p>
          </div>
          {liveSessionsCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span className="font-bold text-lg">{liveSessionsCount}</span>
              <span className="text-sm font-medium">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <AnimatedBadge
                  count={tab.badge}
                  className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeSubTab === tab.id
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-600 text-white animate-pulse'
                  }`}
                  pulseOnChange={true}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {activeSubTab === 'messages' && <EnhancedBubbleChat />}
        {activeSubTab === 'questions' && <BubblePredefinedQuestions />}
        {activeSubTab === 'resume' && <BubbleResumeManagement />}
        {activeSubTab === 'tooltips' && <BubbleTooltipEvents />}
        {activeSubTab === 'settings' && <BubbleSettings />}
      </div>
    </div>
  );
}
