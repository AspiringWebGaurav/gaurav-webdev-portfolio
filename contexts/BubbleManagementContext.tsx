'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import smartPolling from '@/lib/smartPolling';
import { showToast } from '@/lib/toast';
import { auth } from '@/lib/firebase';

interface BubbleSession {
  id: string;  // UUID from UUID-sync system
  mask: string;  // Public mask (device_**********)
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
  deleteSession: (sessionId: string, silent?: boolean) => Promise<{ success: boolean; error?: string }>;
  batchDeleteSessions: (sessionIds: string[]) => Promise<{ success: boolean; error?: string }>;
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

      // Get authentication token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.warn('[BubbleManagement] Not authenticated, skipping fetch');
        if (showLoading) setLoading(false);
        return;
      }

      const response = await fetch('/api/bubble/sessions?allSessions=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Failed to fetch bubble sessions:', data.error);
        return;
      }

      const sessions: BubbleSession[] = data.sessions.map((s: any) => ({
        id: s.id,
        mask: s.mask || s.id,  // Use mask from UUID-sync system
        visitorEmail: s.visitorEmail,
        startedAt: new Date(s.startedAt),
        lastActive: new Date(s.lastActive),
        messageCount: s.messageCount || 0,
        unreadAdminReplies: s.unreadAdminReplies || 0,
        unreadVisitorMessages: s.unreadVisitorMessages || 0,
        deletedAt: s.deletedAt ? new Date(s.deletedAt) : null,
        hasUnreadMessages: (s.unreadVisitorMessages || 0) > 0,
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

  /**
   * Delete a single session (moves to recycle bin first, then deletes from active)
   */
  const deleteSession = useCallback(async (sessionId: string, silent = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        const error = 'Not authenticated';
        if (!silent) showToast.error(error, 'Delete Failed');
        return { success: false, error };
      }

      const response = await fetch('/api/bubble/sessions/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const error = data.error || 'Failed to delete session';
        if (!silent) showToast.error(error, 'Delete Failed');
        return { success: false, error };
      }

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      if (!silent) {
        showToast.success('Session moved to recycle bin', 'Deleted');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting session:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete session';
      if (!silent) showToast.error(errorMsg, 'Delete Failed');
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Batch delete multiple sessions (moves to recycle bin first)
   */
  const batchDeleteSessions = useCallback(async (sessionIds: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        const error = 'Not authenticated';
        showToast.error(error, 'Delete Failed');
        return { success: false, error };
      }

      const response = await fetch('/api/bubble/sessions/batch-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionIds }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const error = data.error || 'Failed to batch delete sessions';
        showToast.error(error, 'Delete Failed');
        return { success: false, error };
      }

      // Remove from local state
      setSessions(prev => prev.filter(s => !sessionIds.includes(s.id)));

      showToast.success(
        `${data.deleted} session${data.deleted > 1 ? 's' : ''} moved to recycle bin`,
        'Deleted'
      );

      return { success: true };
    } catch (error) {
      console.error('Error batch deleting sessions:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to batch delete sessions';
      showToast.error(errorMsg, 'Delete Failed');
      return { success: false, error: errorMsg };
    }
  }, []);

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
        deleteSession,
        batchDeleteSessions,
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
