'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Eye, Loader2, HardDrive, Clock } from 'lucide-react';
import { useInteractionTracking } from '@/lib/useVisitorTracking';

interface ResumeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  resumeUrl: string;
  fileName: string;
  fileSize: number;
  lastUpdated: Date;
}

export default function ResumeViewer({
  isOpen,
  onClose,
  resumeUrl,
  fileName,
  fileSize,
  lastUpdated,
}: ResumeViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { trackResumeView, trackResumeDownload } = useInteractionTracking();

  // Track resume view when modal opens
  useEffect(() => {
    if (isOpen) {
      trackResumeView();
    }
  }, [isOpen, trackResumeView]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Faster animation for modal
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // View in new tab - Custom responsive window with borders
  const handleViewInNewTab = () => {
    try {
      // Calculate responsive window size
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      
      // Responsive dimensions (90% of screen on mobile, 80% on desktop)
      const isMobile = screenWidth < 768;
      const widthPercent = isMobile ? 0.95 : 0.85;
      const heightPercent = isMobile ? 0.95 : 0.9;
      
      const windowWidth = Math.floor(screenWidth * widthPercent);
      const windowHeight = Math.floor(screenHeight * heightPercent);
      const left = Math.floor((screenWidth - windowWidth) / 2);
      const top = Math.floor((screenHeight - windowHeight) / 2);
      
      // Open in new window with custom size and position
      const windowFeatures = `width=${windowWidth},height=${windowHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`;
      const newWindow = window.open('', '_blank', windowFeatures);
      
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${fileName}</title>
            <style>
              * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
              }
              
              body { 
                overflow: hidden; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                flex-direction: column;
                height: 100vh;
              }
              
              /* Custom Header with responsive design */
              .header {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 12px 20px;
                border-bottom: 2px solid rgba(102, 126, 234, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              
              .header-title {
                font-size: 14px;
                font-weight: 600;
                color: #1f2937;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 70%;
              }
              
              .view-only-badge {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.5px;
              }
              
              /* PDF Container with responsive borders */
              .pdf-container {
                flex: 1;
                padding: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                overflow: hidden;
              }
              
              .pdf-wrapper {
                width: 100%;
                height: 100%;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                border: 3px solid rgba(255, 255, 255, 0.3);
              }
              
              iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: white;
              }
              
              /* Disable selection */
              body { 
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
              }
              
              /* Responsive design for mobile */
              @media (max-width: 768px) {
                .header {
                  padding: 10px 15px;
                }
                
                .header-title {
                  font-size: 12px;
                  max-width: 60%;
                }
                
                .view-only-badge {
                  font-size: 10px;
                  padding: 3px 10px;
                }
                
                .pdf-container {
                  padding: 6px;
                }
                
                .pdf-wrapper {
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.3);
                }
              }
              
              /* Extra small screens */
              @media (max-width: 480px) {
                .header {
                  padding: 8px 12px;
                }
                
                .pdf-container {
                  padding: 4px;
                }
                
                .pdf-wrapper {
                  border-radius: 6px;
                }
              }
            </style>
          </head>
          <body>
            <!-- Custom Header -->
            <div class="header">
              <div class="header-title" title="${fileName}">${fileName}</div>
              <div class="view-only-badge">VIEW ONLY</div>
            </div>
            
            <!-- PDF Container with responsive borders -->
            <div class="pdf-container">
              <div class="pdf-wrapper">
                <iframe src="${resumeUrl}" type="application/pdf"></iframe>
              </div>
            </div>
            
            <script>
              // Disable right-click
              document.addEventListener('contextmenu', e => e.preventDefault());
              
              // Disable keyboard shortcuts for download/save
              document.addEventListener('keydown', e => {
                // Block Ctrl+S / Cmd+S (Save)
                if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                  e.preventDefault();
                  return false;
                }
                // Block Ctrl+P / Cmd+P (Print - can be used to save)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                  e.preventDefault();
                  return false;
                }
              });
              
              // Responsive resize handler
              window.addEventListener('resize', () => {
                // Window stays responsive on orientation change (mobile)
              });
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Failed to open PDF viewer:', error);
      alert('Failed to open PDF viewer. Please try downloading instead.');
    }
  };

  // FIXED: Silent download using proxy API - NO new tab, NO navigation
  const handleDownload = () => {
    try {
      setDownloading(true);
      trackResumeDownload(); // Track download event

      // Use our proxy API that forces download with Content-Disposition: attachment
      // This prevents browser from opening PDF in new tab
      const downloadUrl = `/api/download?url=${encodeURIComponent(resumeUrl)}&name=${encodeURIComponent(fileName)}`;
      
      // Create invisible iframe to trigger download without navigation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      
      // Append iframe to trigger download
      document.body.appendChild(iframe);
      
      // Remove iframe after download starts (user stays on page)
      setTimeout(() => {
        document.body.removeChild(iframe);
        setDownloading(false);
      }, 2000);

    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      alert('Download failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-all duration-200 ${
        isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
      }`}
      onClick={handleClose} // Click outside to close with animation
    >
      <div 
        className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isClosing 
            ? 'scale-95 opacity-0' 
            : 'animate-in zoom-in-95'
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
      >
        
        {/* Header - Modern minimal design */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 mb-2 truncate">{fileName}</h3>
              
              {/* File metadata - clean modern style */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <HardDrive className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{formatFileSize(fileSize)}</span>
                </div>
                <span className="text-gray-300 hidden xs:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">
                    {formatDate(lastUpdated).replace(', ', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons - Modern symmetric design */}
        <div className="p-5 space-y-3">
          {/* View in New Tab - Modern outline style */}
          <button
            onClick={handleViewInNewTab}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200 group shadow-sm touch-manipulation"
          >
            <Eye className="w-4.5 h-4.5 text-blue-600 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span>View in New Tab</span>
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md hidden sm:inline">View Only</span>
          </button>

          {/* Download - Modern gradient style */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 shadow-md hover:shadow-lg group touch-manipulation"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4.5 h-4.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>Download Resume</span>
              </>
            )}
          </button>

          {/* Info text - Subtle modern style */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-gray-400">
            <div className="w-1 h-1 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="text-center">Downloads silently to your folder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
