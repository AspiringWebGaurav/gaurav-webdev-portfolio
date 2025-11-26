'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { BubbleMessage, ChatMessage } from '@/types/bubble';
import { useBubbleSession } from './BubbleSessionContext';
import networkManager from '@/lib/networkManager';
import smartPolling from '@/lib/smartPolling';

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
          console.log('[BubbleMessages] 📨 New messages:', newCount);
          
          // Auto-mark new admin messages as delivered
          const newAdminMessages = newMessages.slice(-newCount).filter((m: BubbleMessage) => m.role === 'admin');
          if (newAdminMessages.length > 0) {
            const undeliveredIds = newAdminMessages.filter((m: BubbleMessage) => !m.delivered).map((m: BubbleMessage) => m.id);
            if (undeliveredIds.length > 0 && isChatOpen) {
              // Messages auto-delivered by API when chat is open
              console.log('[BubbleMessages] ✅ Auto-delivered:', undeliveredIds.length);
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
        console.error('[BubbleMessages] ❌ Fetch failed:', response.status);
      }
    } catch (error) {
      console.error('[BubbleMessages] ❌ Error:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [session?.id, isChatOpen]);

  const sendMessage = useCallback(async (content: string, visitorEmail?: string) => {
    if (!session?.id) return;

    setSending(true);
    
    // Optimistic UI update
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
        
        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? newMessage : msg
        ));
        
        // Boost polling for faster admin response
        smartPolling.boost('bubble-messages', 15000); // 15s realtime
        
        // Trigger immediate poll after 1s
        setTimeout(() => smartPolling.trigger('bubble-messages'), 1000);
      } else {
        throw new Error(`Send failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[BubbleMessages] ❌ Send failed:', error);
      
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      lastMessageCountRef.current--;
      throw error;
    } finally {
      setSending(false);
    }
  }, [session?.id]);

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
      console.error('[BubbleMessages] ❌ Mark read failed:', error);
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

    // Send typing indicator to backend
    networkManager.fetch('/api/bubble/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId: session.id, 
        isTyping,
        role: 'visitor',
      }),
    }, 2).catch(err => console.error('[BubbleMessages] ❌ Typing failed:', err));

    // Auto-clear typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  }, [session?.id]);

  const setChatOpen = useCallback((open: boolean) => {
    setIsChatOpen(open);
    
    if (open) {
      // Chat opened - switch to realtime and fetch immediately
      smartPolling.setMode('bubble-messages', 'realtime');
      fetchMessages(true);
      
      // Mark all admin messages as read when opening chat
      const unreadAdminMessages = messages.filter(m => m.role === 'admin' && !m.read);
      if (unreadAdminMessages.length > 0) {
        markMessagesAsRead(unreadAdminMessages.map(m => m.id));
      }
    } else {
      // Chat closed - switch to active mode
      smartPolling.setMode('bubble-messages', 'active');
    }
  }, [messages, fetchMessages, markMessagesAsRead]);

  // Setup ultra-optimized smart polling
  useEffect(() => {
    if (!session?.id) return;

    // Register with critical priority for instant messaging
    smartPolling.register(
      'bubble-messages',
      () => fetchMessages(true), // Always silent polls
      {
        intervals: {
          realtime: 1500,  // 1.5s - Ultra fast when chat is open (faster than before)
          active: 3000,    // 3s - Fast when tab active (faster response)
          idle: 15000,     // 15s - Moderate when idle
          background: 30000, // 30s - Minimal when hidden
        },
        priority: 'critical',
        maxIdleTime: 30000,
        stopOnHidden: false,
        tag: 'BubbleMessages',
      }
    );

    // Initial fetch
    fetchMessages();

    return () => {
      smartPolling.unregister('bubble-messages');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [session?.id, fetchMessages]);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = networkManager.subscribe((status) => {
      const wasOffline = !isOnline;
      setIsOnline(status.isOnline);
      
      if (wasOffline && status.isOnline && session?.id) {
        console.log('[BubbleMessages] Back online - fetching messages');
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
