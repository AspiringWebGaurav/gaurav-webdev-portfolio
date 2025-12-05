'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { PredefinedQuestion } from '@/types/bubble';

interface MaintenanceBubbleSettings {
  allowResumeView: boolean;
  allowResumeDownload: boolean;
  allowAskDirect: boolean;
  allowPredefinedQuestions: boolean;
  disabledMessage: string;
}

interface PredefinedQuestionsProps {
  title: string;
}

export default function PredefinedQuestions({ title }: PredefinedQuestionsProps) {
  const [questions, setQuestions] = useState<PredefinedQuestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceBubbleSettings | null>(null);

  // Check maintenance status
  useEffect(() => {
    async function checkMaintenanceStatus() {
      try {
        const response = await fetch('/api/maintenance/status');
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data.enabled);
          if (data.enabled && data.bubbleSettings) {
            setMaintenanceSettings(data.bubbleSettings);
          }
        }
      } catch (error) {
        console.error('[PredefinedQuestions] Error checking maintenance:', error);
      }
    }
    checkMaintenanceStatus();
  }, []);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        console.log('[PredefinedQuestions] Fetching questions...');
        const response = await fetch('/api/bubble/questions');
        console.log('[PredefinedQuestions] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[PredefinedQuestions] Questions received:', data.questions?.length || 0);
          setQuestions(data.questions || []);
        } else {
          console.error('[PredefinedQuestions] Failed to fetch:', response.status);
        }
      } catch (error) {
        console.error('[PredefinedQuestions] Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const toggleQuestion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Check if predefined questions are disabled during maintenance
  const isPredefinedQuestionsDisabled = maintenanceMode && maintenanceSettings && !maintenanceSettings.allowPredefinedQuestions;

  if (loading) {
    return (
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 px-0.5">{title}</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 sm:p-4 rounded-lg bg-gray-100 animate-pulse h-12 sm:h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  // Show disabled state during maintenance
  if (isPredefinedQuestionsDisabled) {
    return (
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 px-0.5">{title}</h3>
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{maintenanceSettings?.disabledMessage || 'Disabled by admin due to maintenance'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 px-0.5">{title}</h3>
      <div className="space-y-2">
        {questions.map(question => (
          <div
            key={question.id}
            className="rounded-lg border border-gray-200 overflow-hidden transition-all hover:border-gray-300 hover:shadow-sm"
          >
            <button
              onClick={() => toggleQuestion(question.id)}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[52px]"
            >
              <span className="text-sm sm:text-base font-medium text-gray-800 flex-1 pr-2 leading-snug">
                {question.question}
              </span>
              <div className="flex-shrink-0 ml-2">
                {expandedId === question.id ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                )}
              </div>
            </button>
            
            {expandedId === question.id && (
              <div
                className="px-3 pb-3 sm:px-3.5 sm:pb-3.5 text-xs sm:text-sm text-gray-600 border-t border-gray-100 bg-gray-50 animate-slideDown"
              >
                <div className="pt-3 whitespace-pre-wrap leading-relaxed">{question.answer}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
