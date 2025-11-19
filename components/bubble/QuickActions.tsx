'use client';

import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Download, Eye, Clock, HardDrive } from 'lucide-react';
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

export default function QuickActions({ title, onAskMeDirect }: QuickActionsProps) {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResumeViewer, setShowResumeViewer] = useState(false);

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
    if (resumeData) {
      setShowResumeViewer(true);
    }
  };

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
            disabled={loading || !resumeData}
            className="w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed group touch-manipulation min-h-[60px] sm:min-h-auto"
          >
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-base font-medium text-gray-900 truncate">
                View / Download Resume
              </div>
              {resumeData && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  PDF • {formatFileSize(resumeData.fileSize)}
                </div>
              )}
            </div>
          </button>

          {/* Ask Me Direct - Mobile Optimized */}
          <button
            onClick={onAskMeDirect}
            className="w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition-all duration-200 text-left group shadow-md hover:shadow-lg touch-manipulation min-h-[60px] sm:min-h-auto"
          >
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-base font-semibold text-white mb-0.5 truncate">Ask Me Direct</div>
              <div className="text-xs sm:text-sm text-blue-100 truncate">Start a conversation</div>
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
