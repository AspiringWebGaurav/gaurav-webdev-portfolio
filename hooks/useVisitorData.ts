"use client";

import { useState, useEffect, useMemo } from 'react';
import { useOptimizedFirebaseListener } from './useOptimizedFirebaseListener';

interface Visitor {
  [x: string]: string | undefined;
  id: string;
  uuid: string;
  status: "active" | "banned";
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  os: string;
  browser: string;
  device: string;
  ipAddress: string;
  timezone: string;
  language: string;
  screenResolution: string;
  banReason?: string;
  banTimestamp?: string;
  unbanTimestamp?: string;
  isOnline?: boolean;
  lastSeen?: string;
  sessionStart?: string;
  sessionDuration?: number;
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
    flag?: string;
  };
  deviceInfo?: {
    type: "mobile" | "tablet" | "desktop";
    browser: string;
    os: string;
    icon?: string;
  };
  referralInfo?: {
    source: string;
    firstPage: string;
    referrer?: string;
  };
  adminNotes?: string;
}

interface VisitorStats {
  total: number;
  active: number;
  banned: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export function useVisitorData() {
  const [fallbackData, setFallbackData] = useState<Visitor[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState<Error | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Try Firebase first
  const {
    data: firebaseData,
    isLoading: firebaseLoading,
    isLiveSync,
    error: firebaseError,
    refresh: refreshFirebase
  } = useOptimizedFirebaseListener<Visitor>({
    collectionName: 'visitors',
    orderByField: 'lastVisit',
    orderDirection: 'desc',
    debounceMs: 500,
    maxRetries: 2,
    onError: (error) => {
      console.warn('Firebase listener failed, falling back to API:', error);
      setUseFallback(true);
    },
    transform: (doc) => ({
      id: doc.id,
      uuid: doc.uuid,
      status: doc.status,
      firstVisit: doc.firstVisit,
      lastVisit: doc.lastVisit,
      visitCount: doc.visitCount || 1,
      os: doc.os,
      browser: doc.browser,
      device: doc.device,
      ipAddress: doc.ipAddress,
      timezone: doc.timezone,
      language: doc.language,
      screenResolution: doc.screenResolution,
      banReason: doc.banReason,
      banTimestamp: doc.banTimestamp,
      unbanTimestamp: doc.unbanTimestamp,
      isOnline: doc.isOnline,
      lastSeen: doc.lastSeen,
      sessionStart: doc.sessionStart,
      sessionDuration: doc.sessionDuration,
      location: doc.location,
      deviceInfo: doc.deviceInfo,
      referralInfo: doc.referralInfo,
      adminNotes: doc.adminNotes,
    })
  });

  // Fallback API fetch
  const fetchFallbackData = async () => {
    if (!useFallback) return;
    
    console.log('📡 Starting API fallback fetch...');
    setFallbackLoading(true);
    setFallbackError(null);
    
    try {
      const response = await fetch('/api/visitors/list?limit=100&sortBy=lastVisit&sortOrder=desc', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const visitors = Array.isArray(data.visitors) ? data.visitors : [];
      console.log(`✅ API fallback successful: ${visitors.length} visitors loaded`);
      setFallbackData(visitors);
    } catch (error) {
      console.error('❌ Fallback API fetch failed:', error);
      setFallbackError(error as Error);
      setFallbackData([]);
    } finally {
      setFallbackLoading(false);
    }
  };

  // Use fallback when Firebase fails
  useEffect(() => {
    if (useFallback) {
      fetchFallbackData();
    }
  }, [useFallback]);

  // Determine which data source to use
  const visitors = useFallback ? fallbackData : firebaseData;
  const isLoading = useFallback ? fallbackLoading : firebaseLoading;
  const error = useFallback ? fallbackError : firebaseError;

  // Calculate stats
  const visitorStats = useMemo(() => {
    const total = visitors.length;
    const active = visitors.filter(v => v.status === 'active').length;
    const banned = visitors.filter(v => v.status === 'banned').length;
    
    return {
      total,
      active,
      banned,
      currentPage: 1,
      totalPages: 1,
      hasMore: false
    };
  }, [visitors]);

  const refresh = () => {
    console.log('🔄 Manual visitor data refresh triggered', {
      useFallback,
      currentDataCount: visitors.length
    });
    
    if (useFallback) {
      console.log('📡 Refreshing via API fallback');
      fetchFallbackData();
    } else {
      console.log('🔥 Refreshing via Firebase with force update');
      refreshFirebase(true); // Force update to bypass smart diffing
    }
  };

  return {
    visitors,
    visitorStats,
    isLoading,
    isLiveSync: useFallback ? false : isLiveSync,
    error,
    refresh,
    isUsingFallback: useFallback
  };
}