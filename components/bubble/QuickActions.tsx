'use client';

import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Download, Eye, Clock, HardDrive, AlertCircle } from 'lucide-react';
import ResumeViewer from '../ResumeViewer';

interface QuickActionsProps {
  title: string;
  onAskMeDirect: () => void;
}

interface ResumeData {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

interface MaintenanceBubbleSettings {
  allowResumeView: boolean;
  allowResumeDownload: boolean;
  allowAskDirect: boolean;
  allowPredefinedQuestions: boolean;
  disabledMessage: string;
}

export default function QuickActions({ title, onAskMeDirect }: QuickActionsProps) {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [bubbleSettings, setBubbleSettings] = useState<MaintenanceBubbleSettings | null>(null);

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
    async function fetchResume() {
      try {
        const response = await fetch('/api/bubble/resume?currentOnly=true');
        if (response.ok) {
          const data = await response.json();
          if (data.versions && data.versions.length > 0) {
            const resume = data.versions[0];
            setResumeData({
              fileUrl: resume.fileUrl,
              fileName: resume.fileName,
              fileSize: resume.fileSize || 0,
              uploadedAt: new Date(resume.uploadedAt),
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch resume:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResume();
  }, []);

  const handleResumeClick = () => {
    // Check maintenance mode restrictions
    if (maintenanceMode && bubbleSettings && !bubbleSettings.allowResumeView) {
      return;
    }
    if (resumeData) {
      setShowResumeViewer(true);
    }
  };

  const handleAskDirect = () => {
    // Check maintenance mode restrictions
    if (maintenanceMode && bubbleSettings && !bubbleSettings.allowAskDirect) {
      return;
    }
    onAskMeDirect();
  };

  // Check if Ask Direct is disabled
  const isAskDirectDisabled = maintenanceMode && bubbleSettings && !bubbleSettings.allowAskDirect;
  const isResumeDisabled = maintenanceMode && bubbleSettings && !bubbleSettings.allowResumeView;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date for "last updated"
  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 px-0.5">{title}</h3>
        <div className="space-y-2">
          {/* View/Download Resume - Mobile Optimized */}
          <button
            onClick={handleResumeClick}
            disabled={loading || !resumeData || isResumeDisabled}
            className={`w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-200 text-left group touch-manipulation min-h-[60px] sm:min-h-auto ${
              isResumeDisabled 
                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
                : 'bg-white hover:bg-gray-50 active:bg-gray-100 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors ${
              isResumeDisabled ? 'bg-gray-200' : 'bg-blue-100 group-hover:bg-blue-200'
            }`}>
              <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${isResumeDisabled ? 'text-gray-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm sm:text-base font-medium truncate ${isResumeDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                View / Download Resume
              </div>
              {resumeData && !isResumeDisabled && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  PDF • {formatFileSize(resumeData.fileSize)}
                </div>
              )}
              {isResumeDisabled && (
                <div className="text-xs text-amber-600 mt-0.5">
                  {bubbleSettings?.disabledMessage || 'Disabled during maintenance'}
                </div>
              )}
            </div>
          </button>

          {/* Ask Me Direct - Mobile Optimized */}
          <button
            onClick={handleAskDirect}
            disabled={isAskDirectDisabled}
            className={`w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-200 text-left group touch-manipulation min-h-[60px] sm:min-h-auto ${
              isAskDirectDisabled
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 shadow-md hover:shadow-lg'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform ${
              isAskDirectDisabled ? 'bg-gray-300' : 'bg-white/20 group-hover:scale-105'
            }`}>
              {isAskDirectDisabled ? (
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              ) : (
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm sm:text-base font-semibold mb-0.5 truncate ${
                isAskDirectDisabled ? 'text-gray-600' : 'text-white'
              }`}>
                Ask Me Direct
              </div>
              <div className={`text-xs sm:text-sm truncate ${
                isAskDirectDisabled ? 'text-amber-600' : 'text-blue-100'
              }`}>
                {isAskDirectDisabled 
                  ? (bubbleSettings?.disabledMessage || 'Disabled by admin due to maintenance')
                  : 'Start a conversation'
                }
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Resume Viewer Modal */}
      {resumeData && (
        <ResumeViewer
          isOpen={showResumeViewer}
          onClose={() => setShowResumeViewer(false)}
          resumeUrl={resumeData.fileUrl}
          fileName={resumeData.fileName}
          fileSize={resumeData.fileSize}
          lastUpdated={resumeData.uploadedAt}
        />
      )}
    </>
  );
}
