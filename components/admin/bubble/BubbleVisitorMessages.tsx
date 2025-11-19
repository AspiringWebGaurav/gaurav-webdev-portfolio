'use client';

import React, { useEffect, useState } from 'react';
import { Send, Trash2, Mail, Clock, User, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { showToast } from "@/lib/toast";

import { BubbleMessage, BubbleSession } from '@/types/bubble';

export default function BubbleVisitorMessages() {
  const [sessions, setSessions] = useState<BubbleSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BubbleSession | null>(null);
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Batch deletion state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
    }
  }, [selectedSession]);

  async function fetchSessions() {
    try {
      const response = await fetch('/api/bubble/sessions?allSessions=true');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        // Auto-select first session if available
        if (data.sessions && data.sessions.length > 0 && !selectedSession) {
          setSelectedSession(data.sessions[0]);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setLoading(false);
    }
  }

  async function fetchMessages(sessionId: string) {
    try {
      const response = await fetch(`/api/bubble/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedSession || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/bubble/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          role: 'admin',
          content: replyText.trim(),
        }),
      });

      if (response.ok) {
        setReplyText('');
        fetchMessages(selectedSession.id);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await fetch(`/api/bubble/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });

      if (selectedSession) {
        fetchMessages(selectedSession.id);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      const response = await fetch(`/api/bubble/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear selected session if it was deleted
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
        // Refresh sessions list
        await fetchSessions();
      }
      
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
      showToast.error('Failed to delete session. Please try again.');
    }
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) {
      showToast.warning('Please select sessions to delete');
      return;
    }

    // Close modal immediately
    setShowBatchDeleteConfirm(false);

    // Show progress notification
    const totalItems = selectedIds.size;
    showToast.info(
      `Deleting ${totalItems} session${totalItems > 1 ? 's' : ''}...`,
      "Deleting",
      { autoClose: 3000 }
    );

    try {
      let successCount = 0;
      let failCount = 0;
      const failedSessions: string[] = [];

      for (const sessionId of Array.from(selectedIds)) {
        try {
          const response = await fetch(`/api/bubble/sessions?sessionId=${sessionId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const session = sessions.find(s => s.id === sessionId);
            failedSessions.push(session?.visitorEmail || sessionId.slice(0, 8));
          }
        } catch (error) {
          failCount++;
          const session = sessions.find(s => s.id === sessionId);
          failedSessions.push(session?.visitorEmail || sessionId.slice(0, 8));
        }
      }

      // Clear selected session if it was deleted
      if (selectedSession && selectedIds.has(selectedSession.id)) {
        setSelectedSession(null);
        setMessages([]);
      }

      // Reset selection state
      setSelectedIds(new Set());
      setIsSelectionMode(false);

      // Show results
      if (failCount === 0) {
        showToast.success(`Successfully deleted ${successCount} session${successCount > 1 ? 's' : ''}`);
      } else if (successCount === 0) {
        showToast.error(`Failed to delete ${failCount} session${failCount > 1 ? 's' : ''}. Please try again.`);
      } else {
        showToast.warning(`Deleted ${successCount} successfully, ${failCount} failed: ${failedSessions.join(', ')}`);
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Batch delete error:', error);
      showToast.error('An error occurred during batch delete. Please try again.');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  }

  function toggleSelection(sessionId: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Visitor Messages</h2>
          <p className="text-gray-600 text-sm mt-1">
            View conversations and send replies to visitors
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isSelectionMode ? (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Select Sessions
            </button>
          ) : (
            <>
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center gap-2"
              >
                {selectedIds.size === sessions.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                Select All ({selectedIds.size})
              </button>
              
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowBatchDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedIds.size})
                </button>
              )}
              
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[600px]">
        {/* Sessions List */}
        <div className="col-span-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Sessions</h3>
          </div>
          <div className="overflow-y-auto h-[calc(600px-52px)]">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No sessions yet</div>
            ) : (
              sessions.map((session) => {
                // Create a display name for the session
                const displayName = session.visitorEmail 
                  ? session.visitorEmail 
                  : `Visitor ${session.id.slice(0, 8)}`;
                
                const isSelected = selectedIds.has(session.id);
                
                return (
                  <div
                    key={session.id}
                    className={`relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedSession?.id === session.id ? 'bg-blue-50' : ''
                    } ${isSelected ? 'bg-blue-50' : ''}`}
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
                      
                      {/* Session Info */}
                      <button
                        onClick={() => !isSelectionMode && setSelectedSession(session)}
                        disabled={isSelectionMode}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {displayName}
                            </span>
                            {session.messageCount > 0 && (
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                ({session.messageCount})
                              </span>
                            )}
                          </div>
                          {session.unreadAdminReplies > 0 && (
                            <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                              {session.unreadAdminReplies}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(session.lastActive)}</span>
                        </div>
                      </button>
                      
                      {/* Delete Button (only in non-selection mode) */}
                      {!isSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(session.id);
                          }}
                          className="flex-shrink-0 text-red-500 hover:text-red-700 p-1"
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

        {/* Chat Interface */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {selectedSession ? (
            <>
              {/* Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedSession.visitorEmail || `Visitor ${selectedSession.id.slice(0, 8)}`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {messages.length} messages
                    </p>
                  </div>
                  {selectedSession.visitorEmail && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Mail className="w-3 h-3" />
                      {selectedSession.visitorEmail}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${message.role === 'visitor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.role === 'visitor' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.role === 'visitor'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a session to view messages
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this session? All messages in this conversation will be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteSession(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Multiple Sessions</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{selectedIds.size}</strong> session{selectedIds.size > 1 ? 's' : ''}? 
              All messages in these conversations will be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedIds.size} Session{selectedIds.size > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
