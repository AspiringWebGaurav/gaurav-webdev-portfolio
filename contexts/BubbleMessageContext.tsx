'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { BubbleMessage, ChatMessage } from '@/types/bubble';
import { useBubbleSession } from './BubbleSessionContext';
import networkManager from '@/lib/networkManager';
import smartPolling from '@/lib/smartPolling';
import logger from '@/lib/logger';

interface BubbleMessageContextType {
  messages: BubbleMessage[];
  loading: boolean;
  sending: boolean;
  typingStatus: { isTyping: boolean; lastSeen?: Date };
  adminOnline: boolean;
  unreadCount: number;
  fetchMessages: (silent?: boolean) => Promise<void>;
  sendMessage: (content: string, visitorEmail?: string) => Promise<void>;
  markMessagesAsRead: (messageIds?: string[]) => Promise<void>;
  markAsDelivered: (messageIds: string[]) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  setChatOpen: (open: boolean) => void;
  trackChatActivity: () => void; // Track user interaction to optimize polling
}

const BubbleMessageContext = createContext<BubbleMessageContextType | undefined>(undefined);

export function BubbleMessageProvider({ children }: { children: React.ReactNode }) {
  const { visitorId, session } = useBubbleSession();
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [typingStatus, setTypingStatus] = useState<{ isTyping: boolean; lastSeen?: Date }>({
    isTyping: false,
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageCountRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const lastChatActivityRef = useRef<number>(Date.now());
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserActiveRef = useRef<boolean>(false);
  const isPageVisibleRef = useRef<boolean>(true);
  const hasMessageHistoryRef = useRef<boolean>(false);

  // Track if user has message history
  useEffect(() => {
    hasMessageHistoryRef.current = messages.length > 0;
  }, [messages.length]);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!session?.id) return;

    const now = Date.now();
    // Debounce rapid fetches (< 500ms)
    if (now - lastFetchRef.current < 500) {
      return;
    }
    lastFetchRef.current = now;

    if (!silent) setLoading(true);
    
    try {
      const response = await networkManager.fetch(
        `/api/bubble/messages?sessionId=${session.id}&role=visitor`,
        { method: 'GET' },
        3 // 3 second timeout
      );
      
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Check if new messages arrived
        if (newMessages.length > lastMessageCountRef.current) {
          const newCount = newMessages.length - lastMessageCountRef.current;
          logger.debug('[BubbleMessages] 📨 New messages:', newCount);
          
          // Auto-mark new admin messages as delivered
          const newAdminMessages = newMessages.slice(-newCount).filter((m: BubbleMessage) => m.role === 'admin');
          if (newAdminMessages.length > 0) {
            const undeliveredIds = newAdminMessages.filter((m: BubbleMessage) => !m.delivered).map((m: BubbleMessage) => m.id);
            if (undeliveredIds.length > 0 && isChatOpen) {
              // Messages auto-delivered by API when chat is open
              logger.debug('[BubbleMessages] ✅ Auto-delivered:', undeliveredIds.length);
            }
          }
        }
        
        lastMessageCountRef.current = newMessages.length;
        setMessages(newMessages);
        
        // Update all status data
        setAdminOnline(data.adminOnline || false);
        setUnreadCount(data.adminUnread || 0);
        
        if (data.adminTyping !== undefined) {
          setTypingStatus({
            isTyping: data.adminTyping,
            lastSeen: data.adminLastSeen ? new Date(data.adminLastSeen) : undefined,
          });
        }
      } else {
        logger.error('[BubbleMessages] ❌ Fetch failed:', response.status);
      }
    } catch (error) {
      logger.error('[BubbleMessages] ❌ Error:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [session?.id, isChatOpen]);

  // Page visibility tracking - STOP polling when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isPageVisibleRef.current = isVisible;
      
      if (!isVisible) {
        // Page hidden - stop all polling immediately
        logger.debug('[BubbleMessages] 👁️ Page hidden - pausing polling to save costs');
        smartPolling.setMode('bubble-messages', 'paused');
      } else {
        // Page visible again
        logger.debug('[BubbleMessages] 👁️ Page visible - resuming polling');
        
        // If user has message history, do instant sync
        if (hasMessageHistoryRef.current && isChatOpen) {
          logger.debug('[BubbleMessages] 🔥 User has message history - instant sync!');
          fetchMessages(true); // Instant fetch
          smartPolling.setMode('bubble-messages', 'realtime');
        } else if (isChatOpen) {
          smartPolling.setMode('bubble-messages', 'realtime');
        } else {
          smartPolling.setMode('bubble-messages', 'background');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isChatOpen, fetchMessages]);

  // Track user activity in chat - defined early to avoid initialization errors
  const trackChatActivity = useCallback(() => {
    lastChatActivityRef.current = Date.now();
    isUserActiveRef.current = true;
    
    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // After 15 seconds of no activity, mark as idle
    activityTimeoutRef.current = setTimeout(() => {
      isUserActiveRef.current = false;
    }, 15000);
  }, []);

  const sendMessage = useCallback(async (content: string, visitorEmail?: string) => {
    if (!session?.id) return;

    // Track activity when sending message
    trackChatActivity();
    
    setSending(true);
    
    // Instant optimistic UI update - message appears immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: BubbleMessage = {
      id: tempId,
      sessionId: session.id,
      role: 'visitor',
      content,
      timestamp: new Date(),
      read: false,
      delivered: false,
      visitorEmail,
    };
    
    // Add to UI IMMEDIATELY - no waiting
    setMessages(prev => [...prev, optimisticMessage]);
    lastMessageCountRef.current++;
    
    try {
      const response = await networkManager.fetch('/api/bubble/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          role: 'visitor',
          content,
          visitorEmail,
        }),
      }, 5);

      if (response.ok) {
        const newMessage = await response.json();
        
        // Replace optimistic message with real one from server
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? newMessage : msg
        ));
        
        // Message already in UI - no polling needed
      } else {
        throw new Error(`Send failed: ${response.status}`);
      }
    } catch (error) {
      logger.error('[BubbleMessages] ❌ Send failed:', error);
      
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      lastMessageCountRef.current--;
      throw error;
    } finally {
      setSending(false);
    }
  }, [session?.id, trackChatActivity]);

  const markMessagesAsRead = useCallback(async (messageIds?: string[]) => {
    if (!session?.id) return;

    try {
      const response = await networkManager.fetch('/api/bubble/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: session.id, 
          messageIds,
          role: 'visitor', // Mark as read by visitor
        }),
      }, 3);

      if (response.ok) {
        setMessages(prev =>
          prev.map(msg => {
            const shouldMark = !messageIds || messageIds.includes(msg.id);
            return shouldMark && msg.role === 'admin' ? 
              { ...msg, read: true, readAt: new Date() } : msg;
          })
        );
        setUnreadCount(0);
      }
    } catch (error) {
      logger.error('[BubbleMessages] ❌ Mark read failed:', error);
    }
  }, [session?.id]);

  const markAsDelivered = useCallback(async (messageIds: string[]) => {
    if (!session?.id || messageIds.length === 0) return;

    // Optimistically update UI
    setMessages(prev =>
      prev.map(msg =>
        messageIds.includes(msg.id) ? { ...msg, delivered: true, deliveredAt: new Date() } : msg
      )
    );
  }, [session?.id]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!session?.id) return;

    // Track activity when typing
    if (isTyping) {
      trackChatActivity();
    }

    // Send typing indicator to backend
    networkManager.fetch('/api/bubble/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId: session.id, 
        isTyping,
        role: 'visitor',
      }),
    }, 2).catch(err => logger.error('[BubbleMessages] ❌ Typing failed:', err));

    // Auto-clear typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  }, [session?.id, trackChatActivity]);

  const setChatOpen = useCallback((open: boolean) => {
    setIsChatOpen(open);
    
    if (open) {
      // Chat opened - check if user has message history for instant sync
      isUserActiveRef.current = true;
      
      if (hasMessageHistoryRef.current) {
        // User has message history - do instant sync first!
        logger.debug('[BubbleMessages] 🔥 User has message history - instant sync on open!');
        fetchMessages(true).then(() => {
          // Then switch to realtime polling
          smartPolling.setMode('bubble-messages', 'realtime');
        });
      } else {
        // No history, just fetch normally
        fetchMessages(true);
        smartPolling.setMode('bubble-messages', 'realtime');
      }
      
      trackChatActivity();
      
      // Mark all admin messages as read when opening chat
      const unreadAdminMessages = messages.filter(m => m.role === 'admin' && !m.read);
      if (unreadAdminMessages.length > 0) {
        markMessagesAsRead(unreadAdminMessages.map(m => m.id));
      }
    } else {
      // Chat closed - STOP polling completely to save costs
      isUserActiveRef.current = false;
      smartPolling.setMode('bubble-messages', 'paused'); // PAUSED = no polling at all!
      
      // Clear activity timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
      
      logger.debug('[BubbleMessages] 🚫 Chat closed - STOPPED all polling to save costs!');
    }
  }, [messages, fetchMessages, markMessagesAsRead, trackChatActivity]);

  // Setup smart polling with reasonable intervals
  useEffect(() => {
    if (!session?.id) return;

    // Register with ultra-smart cost-saving intervals
    // STARTS PAUSED - only polls when chat is actually open
    smartPolling.register(
      'bubble-messages',
      () => {
        // Only fetch if page is visible
        if (isPageVisibleRef.current) {
          return fetchMessages(true);
        }
        logger.debug('[BubbleMessages] ⏭️ Skipping fetch - page hidden');
        return Promise.resolve();
      },
      {
        intervals: {
          realtime: parseInt(process.env.NEXT_PUBLIC_POLL_REALTIME || '3000', 10),   // 3s - When actively chatting
          active: parseInt(process.env.NEXT_PUBLIC_POLL_ACTIVE || '15000', 10),      // 15s - Tab active but no chat activity
          idle: parseInt(process.env.NEXT_PUBLIC_POLL_IDLE || '45000', 10),          // 45s - User idle (SAVES COSTS)
          background: parseInt(process.env.NEXT_PUBLIC_POLL_BACKGROUND || '300000', 10), // 5min - Not used (we use paused instead)
        },
        priority: 'normal',
        maxIdleTime: 120000, // 2 minutes before going to idle
        stopOnHidden: true, // CRITICAL: Stop completely when tab hidden
        tag: 'BubbleMessages',
      }
    );
    
    // Start in PAUSED mode (no polling at all) - saves maximum costs
    smartPolling.setMode('bubble-messages', 'paused');
    logger.debug('[BubbleMessages] 🚨 Started in PAUSED mode - no polling until chat opens');

    // Initial fetch
    fetchMessages();

    return () => {
      smartPolling.unregister('bubble-messages');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [session?.id, fetchMessages]);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = networkManager.subscribe((status) => {
      const wasOffline = !isOnline;
      setIsOnline(status.isOnline);
      
      if (wasOffline && status.isOnline && session?.id) {
        logger.debug('[BubbleMessages] Back online - fetching messages');
        fetchMessages();
      }
    });
    return unsubscribe;
  }, [isOnline, session?.id, fetchMessages]);

  return (
    <BubbleMessageContext.Provider
      value={{
        messages,
        loading,
        sending,
        typingStatus,
        adminOnline,
        unreadCount,
        fetchMessages,
        sendMessage,
        markMessagesAsRead,
        markAsDelivered,
        setTyping,
        setChatOpen,
        trackChatActivity,
      }}
    >
      {children}
    </BubbleMessageContext.Provider>
  );
}

export function useBubbleMessages() {
  const context = useContext(BubbleMessageContext);
  if (context === undefined) {
    throw new Error('useBubbleMessages must be used within a BubbleMessageProvider');
  }
  return context;
}
