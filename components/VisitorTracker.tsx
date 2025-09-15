"use client";

import { useEffect, useRef, useState } from 'react';
import {
  getOrCreateVisitorUUID,
  generateDeviceFingerprint,
  createFingerprintHash,
  parseUserAgent,
  getVisitorIP,
  isTrackingEnabled,
  initializePresenceTracking,
  updateVisitorWithEnhancedData,
  type DeviceFingerprint,
  type VisitorData
} from '@/utils/visitorTracking';
import { silentLogger, prodLogger } from '@/utils/secureLogger';

interface VisitorTrackerProps {
  onTrackingComplete?: (visitorData: VisitorData) => void;
  onError?: (error: Error) => void;
  uuid?: string;
}

export default function VisitorTracker({ onTrackingComplete, onError, uuid }: VisitorTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingComplete, setTrackingComplete] = useState(false);
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent multiple tracking attempts
    if (hasTracked.current || !isTrackingEnabled()) {
      return;
    }

    hasTracked.current = true;
    trackVisitor();
  }, []);

  const trackVisitor = async () => {
    try {
      setIsTracking(true);

      // Use provided UUID or generate visitor UUID
      const visitorUUID = uuid || getOrCreateVisitorUUID();
      console.log('🔍 Tracking visitor with UUID:', visitorUUID);
      
      // Generate device fingerprint
      const deviceFingerprint = generateDeviceFingerprint();
      const fingerprintHash = createFingerprintHash(deviceFingerprint);
      
      // Parse user agent
      const { os, browser, device } = parseUserAgent(navigator.userAgent);
      
      // Get IP address (optional, may fail due to CORS)
      let ipAddress = 'Unknown';
      try {
        ipAddress = await getVisitorIP();
      } catch (error) {
        silentLogger.silent('Could not fetch IP address');
      }

      // Prepare visitor data
      const visitorData: VisitorData = {
        uuid: visitorUUID,
        deviceFingerprint,
        ipAddress,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        visitCount: 1,
        status: 'active'
      };

      // Enhanced data for Firebase
      const enhancedVisitorData = {
        ...visitorData,
        fingerprintHash,
        os,
        browser,
        device,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        referrer: document.referrer || 'Direct',
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // Send to API
      const response = await fetch('/api/visitors/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedVisitorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track visitor');
      }

      const result = await response.json();
      silentLogger.silent('Visitor tracking successful');

      // Initialize enhanced tracking features after successful API call
      // Only if a new visitor was created or updated (not duplicate)
      if (result.message !== "Duplicate visitor detected") {
        try {
          // Add a small delay to ensure document creation is complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Initialize real-time presence tracking
          await initializePresenceTracking(visitorUUID);
          silentLogger.silent('Presence tracking initialized');

          // Update visitor with enhanced data (location, device info, referral)
          await updateVisitorWithEnhancedData(visitorUUID);
          silentLogger.silent('Enhanced visitor data updated');

        } catch (enhancedError) {
          silentLogger.silent('Enhanced tracking features failed');
          // Don't fail the entire tracking if enhanced features fail
        }
      } else {
        // For duplicate visitors, use the UUID returned by the API
        const actualUUID = result.uuid || visitorUUID;
        try {
          // Add a small delay to ensure document creation is complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Initialize real-time presence tracking with the actual UUID
          await initializePresenceTracking(actualUUID);
          silentLogger.silent('Presence tracking initialized for duplicate visitor');

          // Update visitor with enhanced data (location, device info, referral)
          await updateVisitorWithEnhancedData(actualUUID);
          silentLogger.silent('Enhanced visitor data updated for duplicate visitor');

        } catch (enhancedError) {
          silentLogger.silent('Enhanced tracking features failed for duplicate visitor');
          // Don't fail the entire tracking if enhanced features fail
        }
      }

      setTrackingComplete(true);
      onTrackingComplete?.(visitorData);

    } catch (error) {
      prodLogger.error('Visitor tracking failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      onError?.(error as Error);
    } finally {
      setIsTracking(false);
    }
  };

  // This component doesn't render anything visible
  return null;
}

// Hook for using visitor tracking in other components
export function useVisitorTracking() {
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleTrackingComplete = (data: VisitorData) => {
    setVisitorData(data);
    setIsLoading(false);
  };

  const handleError = (err: Error) => {
    setError(err);
    setIsLoading(false);
  };

  return {
    visitorData,
    isLoading,
    error,
    VisitorTracker: () => (
      <VisitorTracker 
        onTrackingComplete={handleTrackingComplete}
        onError={handleError}
      />
    )
  };
}

// Privacy-compliant visitor tracking notice component
export function VisitorTrackingNotice() {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the notice
    const acknowledged = localStorage.getItem('visitor_tracking_acknowledged');
    if (!acknowledged && isTrackingEnabled()) {
      setShowNotice(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('visitor_tracking_acknowledged', 'true');
    setShowNotice(false);
  };

  const handleDecline = () => {
    localStorage.setItem('visitor_tracking_opt_out', 'true');
    localStorage.setItem('visitor_tracking_acknowledged', 'true');
    setShowNotice(false);
  };

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-black-100/90 backdrop-blur-md border border-white/[0.2] rounded-xl p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white mb-1">
              Visitor Analytics
            </h3>
            <p className="text-xs text-gray-300 mb-3">
              We collect anonymous usage data to improve your experience. No personal information is stored.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleAccept}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-md transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}