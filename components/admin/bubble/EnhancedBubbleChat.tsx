'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Trash2, Mail, Clock, User, Check, CheckCheck, Eye, Loader2, Circle, Wifi, WifiOff, ArrowRight, CheckSquare, Square, X } from 'lucide-react';
import { showToast } from "@/lib/toast";
import { useRouter } from 'next/navigation';
import { useBubbleManagement } from '@/contexts/BubbleManagementContext';
import { useRecycleBin } from '@/contexts/RecycleBinContext';
import { auth } from '@/lib/firebase';

import { BubbleMessage, BubbleSession } from '@/types/bubble';
import smartPolling from '@/lib/smartPolling';
import networkManager from '@/lib/networkManager';

export default function EnhancedBubbleChat() {
  const router = useRouter();
  const { deleteSession, batchDeleteSessions } = useBubbleManagement();
  const { moveToRecycleBin } = useRecycleBin();
  
  const [sessions, setSessions] = useState<BubbleSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BubbleSession | null>(null);
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [visitorOnline, setVisitorOnline] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [deletingSession, setDeletingSession] = useState<BubbleSession | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(0);
  const previousMessageIdsRef = useRef<Set<string>>(new Set());

  // Auto-scroll to bottom with smooth animation
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  }, []);

  // Fetch all sessions with unread counts
  const fetchSessions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Get auth token
      const user = auth.currentUser;
      if (!user) {
        console.error('[AdminChat] ❌ No authenticated user');
        if (!silent) showToast.error('Please log in to view sessions');
        return;
      }
      const token = await user.getIdToken();
      
      console.log('[AdminChat] 🔄 Fetching sessions...');
      const response = await fetch('/api/bubble/sessions?allSessions=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[AdminChat] ❌ Fetch sessions failed:', response.status, errorData);
        if (!silent) showToast.error(`Failed to load sessions: ${errorData.error}`);
        return;
      }
      
      const data = await response.json();
      const newSessions = data.sessions || [];
      console.log('[AdminChat] ✅ Loaded sessions:', newSessions.length);
      setSessions(newSessions);
      
      // Calculate unread counts
      const counts = new Map<string, number>();
      newSessions.forEach((session: BubbleSession) => {
        counts.set(session.id, session.unreadVisitorMessages || 0);
      });
      setUnreadCounts(counts);
      
      // Auto-select first session if none selected
      if (!selectedSession && newSessions.length > 0) {
        setSelectedSession(newSessions[0]);
      }
    } catch (error) {
      console.error('[AdminChat] ❌ Fetch sessions failed:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedSession]);

  // Fetch messages for selected session
  const fetchMessages = useCallback(async (sessionId: string, silent = false) => {
    try {
      console.log('[AdminChat] 🔄 Fetching messages for session:', sessionId);
      const response = await fetch(
        `/api/bubble/messages?sessionId=${sessionId}&role=admin`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[AdminChat] ❌ Fetch messages failed:', response.status, errorData);
        return;
      }
      
      const data = await response.json();
      const newMessages = data.messages || [];
      console.log('[AdminChat] ✅ Loaded messages:', newMessages.length);
      
      // Check if new visitor messages arrived
      if (newMessages.length > lastMessageCountRef.current) {
        const newCount = newMessages.length - lastMessageCountRef.current;
        const newVisitorMsgs = newMessages.slice(-newCount).filter((m: BubbleMessage) => m.role === 'visitor');
        
        if (newVisitorMsgs.length > 0 && !silent) {
          console.log('[AdminChat] 📨 New visitor messages:', newVisitorMsgs.length);
          scrollToBottom();
        }
      }
      
      lastMessageCountRef.current = newMessages.length;
      setMessages(newMessages);
      setVisitorTyping(data.visitorTyping || false);
      setVisitorOnline(data.visitorOnline || false);
      
      // Auto-mark as read when viewing
      const unreadVisitorMessages = newMessages.filter((m: BubbleMessage) => 
        m.role === 'visitor' && !m.read
      );
      
      if (unreadVisitorMessages.length > 0) {
        markAsRead(unreadVisitorMessages.map((m: BubbleMessage) => m.id));
      }
    } catch (error) {
      console.error('[AdminChat] ❌ Fetch messages failed:', error);
    }
  }, []);

  // Send message with optimistic UI
  const handleSendMessage = useCallback(async () => {
    if (!replyText.trim() || !selectedSession || sending) return;

    const messageContent = replyText.trim();
    setReplyText('');
    setSending(true);
    
    // Stop typing indicator
    handleTyping(false);
    
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: BubbleMessage = {
      id: tempId,
      sessionId: selectedSession.id,
      role: 'admin',
      content: messageContent,
      timestamp: new Date(),
      read: false,
      delivered: false,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    lastMessageCountRef.current++;
    
    // Scroll immediately
    setTimeout(() => scrollToBottom(), 50);
    
    try {
      const response = await fetch('/api/bubble/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          role: 'admin',
          content: messageContent,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        
        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? newMessage : msg
        ));
        
        // Boost polling for faster visitor delivery confirmation
        smartPolling.boost('admin-chat-messages', 10000);
        
        // Trigger immediate poll after 1s
        setTimeout(() => smartPolling.trigger('admin-chat-messages'), 1000);
      } else {
        throw new Error('Send failed');
      }
    } catch (error) {
      console.error('[AdminChat] ❌ Send failed:', error);
      showToast.error('Failed to send message');
      
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      lastMessageCountRef.current--;
      setReplyText(messageContent); // Restore text
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [replyText, selectedSession, sending, scrollToBottom]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!selectedSession || messageIds.length === 0) return;

    try {
      await fetch('/api/bubble/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          messageIds,
          role: 'admin',
        }),
      }, 3);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) && msg.role === 'visitor' ? 
          { ...msg, read: true, readAt: new Date() } : msg
      ));
      
      // Update unread count
      setUnreadCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedSession.id, 0);
        return newMap;
      });
    } catch (error) {
      console.error('[AdminChat] ❌ Mark read failed:', error);
    }
  }, [selectedSession]);

  // Handle typing indicator
  const handleTyping = useCallback((typing: boolean) => {
    if (!selectedSession) return;

    setIsTyping(typing);
    
    fetch('/api/bubble/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: selectedSession.id,
        isTyping: typing,
        role: 'admin',
      }),
    }).catch(err => console.error('[AdminChat] ❌ Typing failed:', err));

    // Auto-clear typing after 3s
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    }
  }, [selectedSession]);

  // Handle input change with typing detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    
    if (e.target.value.length > 0 && !isTyping) {
      handleTyping(true);
    } else if (e.target.value.length === 0 && isTyping) {
      handleTyping(false);
    }
  }, [isTyping, handleTyping]);

  // Select session handler
  const handleSelectSession = useCallback((session: BubbleSession) => {
    console.log('[AdminChat] 🔵 Selected session:', session.id, 'Mask:', session.mask);
    setSelectedSession(session);
    setMessages([]);
    lastMessageCountRef.current = 0;
    fetchMessages(session.id);
    
    // Switch to realtime polling for this session
    smartPolling.setMode('admin-chat-messages', 'realtime');
  }, [fetchMessages]);

  /**
   * Toggle selection mode
   */
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  /**
   * Toggle item selection
   */
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  /**
   * Select all filtered sessions
   */
  const selectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  };

  /**
   * Handle delete single session
   */
  const handleDelete = (session: BubbleSession) => {
    setDeletingSession(session);
    setShowDeleteConfirm(true);
  };

  /**
   * Confirm delete single session
   */
  const confirmDelete = async () => {
    if (!deletingSession) return;

    const sessionToDelete = deletingSession;
    setShowDeleteConfirm(false);
    setDeletingSession(null);

    showToast.info('Processing deletion...', 'Deleting...');

    try {
      // Move to recycle bin first
      const recycleBinResult = await moveToRecycleBin(
        'bubbleSession',
        sessionToDelete,
        sessionToDelete.id,
        true
      );

      if (!recycleBinResult.success) {
        showToast.error(
          recycleBinResult.error || 'Failed to move to recycle bin',
          'Delete Failed'
        );
        return;
      }

      // Then delete from active sessions
      const deleteResult = await deleteSession(sessionToDelete.id, true);

      if (selectedSession?.id === sessionToDelete.id) {
        setSelectedSession(null);
        setMessages([]);
      }

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));

      if (deleteResult.success) {
        showToast.success(
          'Session and all messages moved to recycle bin',
          'Moved to Recycle Bin'
        );
      } else {
        showToast.error(
          deleteResult.error || 'Failed to delete session',
          'Delete Failed'
        );
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showToast.error(
        error instanceof Error ? error.message : 'Failed to delete session',
        'Delete Failed'
      );
    }
  };

  /**
   * Handle batch delete
   */
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) {
      showToast.warning('Please select sessions to delete', 'No Selection');
      return;
    }
    setShowBatchDeleteConfirm(true);
  };

  /**
   * Confirm batch delete
   */
  const confirmBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    const selectedSessions = sessions.filter(s => selectedIds.has(s.id));
    
    if (selectedSessions.length === 0) {
      showToast.warning('Selected sessions not found', 'No Items Found');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBatchDeleteConfirm(false);
      return;
    }

    setShowBatchDeleteConfirm(false);

    const totalItems = selectedSessions.length;
    showToast.info(
      `Processing ${totalItems} session${totalItems > 1 ? 's' : ''}...`,
      'Deleting...'
    );

    try {
      let successCount = 0;
      let failCount = 0;

      // Move each session to recycle bin and delete
      for (const session of selectedSessions) {
        try {
          // Move to recycle bin
          const recycleBinResult = await moveToRecycleBin(
            'bubbleSession',
            session,
            session.id,
            true
          );

          if (!recycleBinResult.success) {
            failCount++;
            continue;
          }

          // Delete from active
          const deleteResult = await deleteSession(session.id, true);
          
          if (deleteResult.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to delete session ${session.id}:`, error);
          failCount++;
        }
      }

      // Remove from local state
      setSessions(prev => prev.filter(s => !selectedIds.has(s.id)));
      
      if (selectedSession && selectedIds.has(selectedSession.id)) {
        setSelectedSession(null);
        setMessages([]);
      }

      // Reset selection
      setSelectedIds(new Set());
      setIsSelectionMode(false);

      // Show summary notification
      if (successCount > 0 && failCount === 0) {
        showToast.success(
          `Successfully moved ${successCount} session${successCount > 1 ? 's' : ''} to recycle bin`,
          'Batch Delete Complete'
        );
      } else if (successCount > 0 && failCount > 0) {
        showToast.warning(
          `Moved ${successCount} session${successCount > 1 ? 's' : ''}, ${failCount} failed`,
          'Batch Delete Partial'
        );
      } else {
        showToast.error(
          `Failed to delete ${failCount} session${failCount > 1 ? 's' : ''}`,
          'Batch Delete Failed'
        );
      }
    } catch (error) {
      console.error('Error in batch delete:', error);
      showToast.error(
        error instanceof Error ? error.message : 'Failed to batch delete sessions',
        'Batch Delete Failed'
      );
    }
  };

  // Setup smart polling for sessions list
  useEffect(() => {
    smartPolling.register(
      'admin-chat-sessions',
      () => fetchSessions(true),
      {
        intervals: {
          realtime: 5000,   // 5s - When actively managing
          active: 15000,    // 15s - Panel open
          idle: 30000,      // 30s - Idle
          background: 60000, // 60s - Hidden
        },
        priority: 'high',
        maxIdleTime: 45000,
        tag: 'AdminChatSessions',
      }
    );

    fetchSessions();

    return () => {
      smartPolling.unregister('admin-chat-sessions');
    };
  }, [fetchSessions]);

  // Setup smart polling for messages when session selected
  useEffect(() => {
    if (!selectedSession) return;

    smartPolling.register(
      'admin-chat-messages',
      () => fetchMessages(selectedSession.id, true),
      {
        intervals: {
          realtime: 2000,   // 2s - Ultra fast when chatting
          active: 8000,     // 8s - Fast response
          idle: 20000,      // 20s - Slower
          background: 45000, // 45s - Background
        },
        priority: 'critical',
        maxIdleTime: 30000,
        tag: 'AdminChatMessages',
      }
    );

    fetchMessages(selectedSession.id);

    return () => {
      smartPolling.unregister('admin-chat-messages');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedSession, fetchMessages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // Keyboard shortcut: Enter to send, Shift+Enter for new line
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Format timestamp
  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    
    // Today
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week
    if (diff < 604800000) {
      return d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Render message status icon
  const renderMessageStatus = (msg: BubbleMessage) => {
    if (msg.role !== 'admin') return null;
    
    if (msg.read) {
      return (
        <span title="Read">
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        </span>
      );
    }
    if (msg.delivered) {
      return (
        <span title="Delivered">
          <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check className="w-3.5 h-3.5 text-gray-300" />
      </span>
    );
  };

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Visitor Chat</h2>
            <p className="text-gray-600 text-sm mt-1">
              Real-time messaging with visitors • Live sync enabled
            </p>
          </div>
          
          {/* Selection Mode Controls */}
          <div className="flex items-center gap-2">
            {isSelectionMode && selectedIds.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </>
            )}
            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                isSelectionMode
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSelectionMode ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Select
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
        {/* Sessions List */}
        <div className="col-span-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 border-b border-blue-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4" />
                Active Visitors ({sessions.length})
              </h3>
              {isSelectionMode && sessions.length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-100 hover:text-white underline"
                >
                  {selectedIds.size === sessions.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No active sessions</p>
                <p className="text-sm mt-1">Waiting for visitors to chat...</p>
              </div>
            ) : (
              sessions.map((session) => {
                const displayName = session.visitorEmail || `Visitor`;
                const unreadCount = unreadCounts.get(session.id) || 0;
                const isActive = selectedSession?.id === session.id;
                const isSelected = selectedIds.has(session.id);
                
                // Admin sees UUID (primary) + mask (for portfolio reference)
                const displayUUID = session.id || 'Unknown';
                const displayMask = session.mask || 'N/A';
                
                return (
                  <div
                    key={session.id}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-all text-left relative ${
                      isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(session.id);
                          }}
                          className="flex-shrink-0 mt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      )}
                      
                      {/* Session Content */}
                      <div
                        onClick={() => !isSelectionMode && handleSelectSession(session)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${
                                unreadCount > 0 ? 'text-blue-700 font-semibold' : 'text-gray-900'
                              }`}>
                                {displayUUID}
                              </span>
                              {session.visitorOnline && (
                                <Circle className="w-2 h-2 fill-green-500 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(session.lastActive)}
                            </p>
                          </div>
                          
                          {unreadCount > 0 && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full flex-shrink-0 animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-600 flex items-center gap-3">
                          <span>💬 {session.messageCount} msgs</span>
                          {session.visitorOnline ? (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <Wifi className="w-3 h-3" />
                              Online
                            </span>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-1">
                              <WifiOff className="w-3 h-3" />
                              Offline
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete Button (visible when not in selection mode) */}
                      {!isSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session);
                          }}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 border-b border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {selectedSession.visitorEmail || selectedSession.id.slice(0, 12) || 'Visitor'}
                      {visitorOnline && (
                        <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                      )}
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      {visitorOnline ? 'Online now' : `Last seen ${formatTime(selectedSession.lastActive)}`}
                    </p>
                    <p className="text-xs text-blue-200 mt-0.5 font-mono">
                      Mask: {selectedSession.mask || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="text-xs text-blue-100 flex items-center gap-3">
                    <span>💬 {messages.length} messages</span>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-12">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const isAdmin = msg.role === 'admin';
                      const isVisitor = msg.role === 'visitor';
                      const isNewMessage = !previousMessageIdsRef.current.has(msg.id);
                      
                      // Track this message as seen
                      if (isNewMessage) {
                        previousMessageIdsRef.current.add(msg.id);
                      }
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${
                            isNewMessage && index > 0 ? 'animate-in slide-in-from-bottom-3 fade-in duration-400' : ''
                          }`}
                        >
                          <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div
                              className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                isAdmin
                                  ? 'bg-white text-gray-900 border border-gray-200'
                                  : 'bg-blue-600 text-white'
                              } ${
                                isNewMessage && index > 0 ? 'animate-in scale-in-95 duration-300' : ''
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            
                            <div className={`flex items-center gap-1.5 px-2 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                              <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                              {renderMessageStatus(msg)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing Indicator */}
                    {visitorTyping && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 rounded-2xl px-4 py-3 flex items-center gap-1">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-xs text-gray-600 ml-2">Visitor is typing...</span>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-end gap-3">
                  <div className="flex-1 bg-white rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <textarea
                      ref={inputRef}
                      value={replyText}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                      className="w-full px-4 py-3 bg-transparent border-none focus:outline-none resize-none text-sm"
                      rows={2}
                      disabled={sending}
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!replyText.trim() || sending}
                    className={`px-6 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                      !replyText.trim() || sending
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </button>
                </div>
                
                {isTyping && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Visitor sees you're typing...
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-lg">No session selected</p>
                <p className="text-sm mt-2">Select a visitor from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Chat Session?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this chat session? This will move the session and all its messages to the recycle bin. You can restore it within 30 days.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Session:</span> {deletingSession.visitorEmail || 'Visitor'}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                UUID: {deletingSession.id}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Mask: {deletingSession.mask || 'N/A'} <span className="text-gray-400">(Portfolio ref)</span>
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Messages:</span> {deletingSession.messageCount}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingSession(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Multiple Sessions?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete {selectedIds.size} chat session{selectedIds.size > 1 ? 's' : ''}? This will move all selected sessions and their messages to the recycle bin. You can restore them within 30 days.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Selected Sessions: {selectedIds.size}
              </p>
              <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                {sessions
                  .filter(s => selectedIds.has(s.id))
                  .map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="truncate">{s.visitorEmail || 'Visitor'}</span>
                      <span className="text-gray-400 ml-2">{s.messageCount} msgs</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBatchDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
