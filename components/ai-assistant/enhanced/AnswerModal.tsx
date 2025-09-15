"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Card, Icons } from '../design-system/components';
import { AIQuestion } from '../types';
import { downloadFile } from '../utils/downloadManager';

interface AnswerModalProps {
  isVisible: boolean;
  question: AIQuestion | null;
  onClose: () => void;
}

const AnswerModal: React.FC<AnswerModalProps> = ({
  isVisible,
  question,
  onClose
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const handleFileDownload = async () => {
    if (!question?.fileUrl) {
      console.error('No file URL provided');
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setDownloadError(null);
      
      console.log('[AnswerModal] Starting robust download...', {
        url: question.fileUrl,
        filename: question.fileName
      });

      // Use the robust download manager
      const result = await downloadFile({
        url: question.fileUrl,
        filename: question.fileName,
        onProgress: (progress) => {
          setDownloadProgress(progress);
        },
        onSuccess: () => {
          console.log('[AnswerModal] Download completed successfully');
          setIsDownloading(false);
          setDownloadProgress(100);
        },
        onError: (error) => {
          console.error('[AnswerModal] Download failed:', error);
          setDownloadError(error.message);
          setIsDownloading(false);
        }
      });

      if (result.success) {
        console.log(`[AnswerModal] Download successful using method: ${result.method}`);
      } else {
        console.error(`[AnswerModal] Download failed:`, result.error);
        setDownloadError(result.error?.message || 'Download failed');
      }

    } catch (error) {
      console.error('[AnswerModal] Unexpected download error:', error);
      setDownloadError('An unexpected error occurred during download');
      setIsDownloading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible || !question) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "bg-ai-surface-primary rounded-2xl shadow-2xl border border-ai-border-light max-w-2xl w-full max-h-[90vh] overflow-hidden transition-all duration-500",
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-ai-border-light bg-ai-surface-secondary">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-ai-primary-blue/20 flex items-center justify-center flex-shrink-0">
                <Icons.Question className="w-5 h-5 text-ai-primary-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-ai-text-primary leading-snug">
                  {question.question}
                </h2>
                <p className="text-sm text-ai-text-secondary mt-1">
                  Predefined Answer
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-ai-text-tertiary hover:text-ai-text-primary flex-shrink-0 ml-3"
            >
              <Icons.Close className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="prose prose-invert max-w-none">
            <div className="text-ai-text-primary leading-relaxed whitespace-pre-wrap">
              {question.answer}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-ai-border-light bg-ai-surface-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {question.fileUrl && (
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFileDownload}
                    disabled={isDownloading}
                    leftIcon={
                      isDownloading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : downloadError ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ) : downloadProgress === 100 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )
                    }
                  >
                    {isDownloading
                      ? `Downloading... ${downloadProgress > 0 ? Math.round(downloadProgress) + '%' : ''}`
                      : downloadError
                        ? 'Retry Download'
                        : downloadProgress === 100
                          ? 'Downloaded!'
                          : 'Download File'
                    }
                  </Button>
                  
                  {/* Progress bar */}
                  {isDownloading && downloadProgress > 0 && (
                    <div className="w-full bg-ai-surface-tertiary rounded-full h-1.5">
                      <div
                        className="bg-ai-primary-blue h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Error message */}
                  {downloadError && (
                    <p className="text-xs text-red-400 mt-1">
                      {downloadError}
                    </p>
                  )}
                  
                  {/* Success message */}
                  {downloadProgress === 100 && !isDownloading && !downloadError && (
                    <p className="text-xs text-green-400 mt-1">
                      File downloaded successfully!
                    </p>
                  )}
                </div>
              )}
              
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs text-ai-text-muted">
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerModal;