'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import smartPolling from '@/lib/smartPolling';

interface BubbleSession {
  id: string;
  deviceFingerprint: string;
  visitorEmail: string | null;
  startedAt: Date;
  lastActive: Date;
  messageCount: number;
  unreadAdminReplies: number;
  unreadVisitorMessages: number;
  hasUnreadMessages: boolean;
  visitorOnline?: boolean;
  adminOnline?: boolean;
  deletedAt: Date | null;
}

interface BubbleManagementContextType {
  sessions: BubbleSession[];
  loading: boolean;
  getUnreadSessionsCount: () => number;
  getUnreadMessagesCount: () => number;
  refreshSessions: () => Promise<void>;
}

const BubbleManagementContext = createContext<BubbleManagementContextType | undefined>(undefined);

export function BubbleManagementProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<BubbleSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch('/api/bubble/sessions?allSessions=true');
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Failed to fetch bubble sessions:', data.error);
        return;
      }

      const sessions: BubbleSession[] = data.sessions.map((s: any) => ({
        ...s,
        startedAt: new Date(s.startedAt),
        lastActive: new Date(s.lastActive),
        deletedAt: s.deletedAt ? new Date(s.deletedAt) : null,
        hasUnreadMessages: (s.unreadVisitorMessages || 0) > 0,
        unreadVisitorMessages: s.unreadVisitorMessages || 0,
        visitorOnline: s.visitorOnline || false,
        adminOnline: s.adminOnline || false,
      }));

      setSessions(sessions);
      
      const unreadCount = sessions.filter(s => !s.deletedAt && s.hasUnreadMessages).length;
      const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadVisitorMessages || 0), 0);
      
      console.log('[BubbleManagement] 📨 Sessions updated:', {
        total: sessions.length,
        unreadSessions: unreadCount,
        totalUnreadMessages: totalUnread,
      });
    } catch (error) {
      console.error('Error fetching bubble sessions:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const getUnreadSessionsCount = useCallback(() => {
    return sessions.filter(s => !s.deletedAt && s.hasUnreadMessages).length;
  }, [sessions]);

  const getUnreadMessagesCount = useCallback(() => {
    return sessions
      .filter(s => !s.deletedAt)
      .reduce((total, s) => total + (s.unreadVisitorMessages || 0), 0);
  }, [sessions]);

  const refreshSessions = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  // Setup ultra-optimized smart polling
  useEffect(() => {
    smartPolling.register(
      'bubble-management',
      () => fetchSessions(false),
      {
        intervals: {
          realtime: 5000,   // 5s when actively managing sessions
          active: 12000,    // 12s when admin panel open
          idle: 25000,      // 25s when idle
          background: 50000, // 50s when tab hidden
        },
        priority: 'high',
        maxIdleTime: 40000,
        stopOnHidden: false, // Keep checking for new messages
        tag: 'BubbleManagement (Admin)',
      }
    );

    // Initial fetch
    fetchSessions();

    return () => {
      smartPolling.unregister('bubble-management');
    };
  }, [fetchSessions]);

  return (
    <BubbleManagementContext.Provider
      value={{
        sessions,
        loading,
        getUnreadSessionsCount,
        getUnreadMessagesCount,
        refreshSessions,
      }}
    >
      {children}
    </BubbleManagementContext.Provider>
  );
}

export function useBubbleManagement() {
  const context = useContext(BubbleManagementContext);
  if (context === undefined) {
    throw new Error('useBubbleManagement must be used within a BubbleManagementProvider');
  }
  return context;
}
