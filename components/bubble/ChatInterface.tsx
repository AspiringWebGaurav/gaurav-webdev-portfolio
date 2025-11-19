'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Bot, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { useBubbleMessages } from '@/contexts/BubbleMessageContext';
import { useBubbleSession } from '@/contexts/BubbleSessionContext';
import networkManager from '@/lib/networkManager';
import TurnstileWidget from '@/components/TurnstileWidget';

// Get Turnstile site key from environment
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAAzPcRQFMSIBvmWw';

export default function ChatInterface() {
  const { messages, loading, sending, fetchMessages, sendMessage, markMessagesAsRead, setChatOpen } = useBubbleMessages();
  const { visitorId, session, setVisitorEmail } = useBubbleSession();
  const [inputMessage, setInputMessage] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  
  // Captcha state
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [captchaAttempts, setCaptchaAttempts] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const turnstileResetRef = useRef<(() => void) | null>(null);
  const previousMessageIdsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (visitorId) {
      fetchMessages();
    }
  }, [visitorId, fetchMessages]);

  // Notify context that chat is open for real-time polling
  useEffect(() => {
    console.log('[ChatInterface] 🔴 Chat opened - enabling real-time updates');
    setChatOpen(true);
    
    return () => {
      console.log('[ChatInterface] ⚫ Chat closed - reducing polling');
      setChatOpen(false);
    };
  }, [setChatOpen]);

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  useEffect(() => {
    // Mark admin messages as read when chat is opened
    const unreadAdminMessages = messages
      .filter(msg => msg.role === 'admin' && !msg.read)
      .map(msg => msg.id);
    
    if (unreadAdminMessages.length > 0) {
      markMessagesAsRead(unreadAdminMessages);
    }
  }, [messages, markMessagesAsRead]);

  useEffect(() => {
    if (session?.visitorEmail) {
      setEmail(session.visitorEmail);
    }
  }, [session]);

  // Subscribe to network status
  useEffect(() => {
    const unsubscribe = networkManager.subscribe((status) => {
      setIsOffline(!status.isOnline);
      if (status.isOnline && sendError) {
        setSendError(null);
      }
    });
    return unsubscribe;
  }, [sendError]);

  // Track captcha failures to visitor analytics
  const trackCaptchaFailure = async () => {
    try {
      await fetch('/api/visitor-analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'captcha_failed',
          metadata: {
            sessionId: visitorId,
            visitorId: visitorId || session?.id,
            attempts: captchaAttempts + 1,
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      console.error('[ChatInterface] Failed to track captcha failure:', error);
    }
  };

  // Handle captcha verification
  const handleCaptchaVerify = (token: string) => {
    console.log('[ChatInterface] ✅ Captcha verified');
    setCaptchaToken(token);
    setCaptchaError(null);
    
    // Track success
    fetch('/api/visitor-analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'captcha_success',
        metadata: {
          sessionId: visitorId,
          attempts: captchaAttempts + 1,
        },
      }),
    }).catch(console.error);
    
    // Auto-retry pending message
    if (pendingMessage) {
      retrySendWithCaptcha(pendingMessage, token);
    }
  };

  const handleCaptchaError = (error: string) => {
    console.error('[ChatInterface] ❌ Captcha error:', error);
    setCaptchaError('Captcha verification failed. Please try again.');
    setCaptchaAttempts(prev => prev + 1);
    trackCaptchaFailure();
  };

  const handleCaptchaExpire = () => {
    console.warn('[ChatInterface] ⏰ Captcha expired');
    setCaptchaToken(null);
    setCaptchaError('Captcha expired. Please verify again.');
  };

  // Retry sending message with captcha token
  const retrySendWithCaptcha = async (messageContent: string, token: string) => {
    if (!visitorId) return;

    try {
      const response = await fetch('/api/bubble/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Turnstile-Token': token,
        },
        body: JSON.stringify({
          sessionId: visitorId,
          role: 'visitor',
          content: messageContent,
          visitorEmail: email || undefined,
        }),
      });

      if (response.ok) {
        // Success - clear captcha state
        setRequiresCaptcha(false);
        setCaptchaToken(null);
        setPendingMessage(null);
        setCaptchaAttempts(0);
        setSendError(null);
        
        // Fetch messages to show the sent message
        await fetchMessages();
        inputRef.current?.focus();
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.requiresCaptcha || errorData.code === 'CAPTCHA_REQUIRED') {
          // Still requires captcha (shouldn't happen, but handle it)
          setCaptchaError('Please complete the captcha verification.');
          turnstileResetRef.current?.();
        } else {
          throw new Error(errorData.error || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('[ChatInterface] ❌ Retry failed:', error);
      setSendError('Message failed to send. Please try again.');
      turnstileResetRef.current?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isOffline) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setSendError(null);

    try {
      // Save email if provided
      if (email && !session?.visitorEmail) {
        await setVisitorEmail(email);
      }

      // Try sending without captcha first
      const response = await fetch('/api/bubble/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(captchaToken && { 'X-Turnstile-Token': captchaToken }),
        },
        body: JSON.stringify({
          sessionId: visitorId,
          role: 'visitor',
          content: messageContent,
          visitorEmail: email || undefined,
        }),
      });

      if (response.ok) {
        // Success
        setRequiresCaptcha(false);
        setCaptchaToken(null);
        await fetchMessages();
        inputRef.current?.focus();
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if captcha is required
        if (response.status === 429 && (errorData.requiresCaptcha || errorData.code === 'CAPTCHA_REQUIRED')) {
          console.log('[ChatInterface] 🔒 Captcha required');
          setRequiresCaptcha(true);
          setPendingMessage(messageContent);
          setSendError(null);
          
          // Track that captcha was triggered
          fetch('/api/visitor-analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'captcha_required',
              metadata: {
                sessionId: visitorId,
                reason: 'rate_limit',
              },
            }),
          }).catch(console.error);
        } else {
          throw new Error(errorData.error || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('[ChatInterface] Failed to send message:', error);
      setSendError('Message failed to send. Please try again.');
      // Restore message to input
      setInputMessage(messageContent);
    }
  };

  const handleRetry = () => {
    fetchMessages();
    setSendError(null);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return messageDate.toLocaleDateString();
  };

  // Get visitorId reference for tracking
  const visitorIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/lib/deviceFingerprint').then(({ generateEnhancedFingerprint }) => {
        generateEnhancedFingerprint().then(fp => {
          visitorIdRef.current = fp;
        });
      });
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Messages Area - Mobile Optimized with proper scrolling */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 -webkit-overflow-scrolling-touch min-h-0">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm sm:text-base">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center text-gray-500">
              <MessageSquareIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isVisitor = message.role === 'visitor';
              const isNewMessage = !previousMessageIdsRef.current.has(message.id);
              
              // Track this message as seen
              if (isNewMessage) {
                previousMessageIdsRef.current.add(message.id);
              }
              
              return (
                <div
                  key={message.id || index}
                  className={`flex gap-2 sm:gap-3 ${isVisitor ? 'flex-row-reverse' : ''} mb-3 sm:mb-4 ${
                    isNewMessage && index > 0 ? 'animate-in slide-in-from-bottom-3 fade-in duration-400' : ''
                  }`}
                >
                  {!isVisitor && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gray-200">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                    </div>
                  )}

                  <div className={`max-w-[75%] sm:max-w-[80%] flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3 py-2 rounded-xl ${
                        isVisitor
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      } ${isNewMessage && index > 0 ? 'animate-in scale-in-95 duration-300' : ''}`}
                    >
                      <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 px-1">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* Offline/Error Banner */}
        {(isOffline || sendError) && (
          <div className="sticky bottom-0 left-0 right-0 mt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800 font-medium">
                  {isOffline ? 'You\'re offline' : 'Message failed'}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {isOffline 
                    ? 'Messages will be sent when connection is restored' 
                    : sendError
                  }
                </p>
              </div>
              {sendError && !isOffline && (
                <button
                  onClick={handleRetry}
                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-amber-100 transition-colors"
                  aria-label="Retry"
                >
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Mobile Optimized with Captcha Support */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-white border-t border-gray-100 flex-shrink-0">
        {/* Optional Email Input */}
        {!session?.visitorEmail && showEmailInput && (
          <div className="mb-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional)"
              className="w-full px-3 py-2 text-sm sm:text-base rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            />
          </div>
        )}

        {/* Captcha Required Banner */}
        {requiresCaptcha && (
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-800 font-medium">Security Verification Required</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Please complete the verification below to send your message
                </p>
              </div>
            </div>
            
            {/* Turnstile Widget - Inline */}
            <div className="flex justify-center py-2">
              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
                theme="light"
                size="normal"
                action="bubble_message"
              />
            </div>
            
            {captchaError && (
              <p className="text-xs text-red-600 mt-2 text-center">{captchaError}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onFocus={() => !session?.visitorEmail && setShowEmailInput(true)}
            placeholder={isOffline ? "Offline - will send when connected" : requiresCaptcha ? "Complete verification to send" : "Type your message..."}
            disabled={sending || requiresCaptcha}
            className="flex-1 px-2 py-2 sm:py-1.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none bg-transparent touch-manipulation disabled:opacity-60"
            style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
          />
          <button
            type="submit"
            disabled={sending || !inputMessage.trim() || isOffline || requiresCaptcha}
            className="p-2.5 sm:p-2 rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* Character count hint for mobile */}
        {inputMessage.length > 200 && (
          <p className="text-xs text-gray-400 mt-1 text-right">
            {inputMessage.length} characters
          </p>
        )}
      </form>
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
