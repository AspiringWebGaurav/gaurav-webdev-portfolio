"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  IoArrowUp,
  IoLockClosedOutline,
  IoChevronDown,
  IoCheckmarkDoneOutline,
} from "react-icons/io5";
import { FaComments, FaBolt, FaShieldAlt } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import { BsLightningChargeFill } from "react-icons/bs";
import { useChatAutoScroll } from "@/components/chat/useChatAutoScroll";

interface ChatMessage {
  id: string;
  sender: "gaurav" | "visitor" | "user";
  senderName?: string;
  text: string;
  createdAt?: string;
  timestamp?: string;
}

const PAGE_SIZE = 15;
const CHAT_CACHE_KEY = "recruiter_chat_cache";
const CHAT_LOCKED_KEY = "recruiter_chat_locked";

type DeliveryStage = "idle" | "sending" | "notifying" | "notified";

interface LiveChatScreenProps {
  recruiter: { name: string; company: string; email: string };
  onTrackAction?: (action: string, metadata?: Record<string, unknown>) => void;
  onSignOut?: () => void;
}

export function LiveChatScreen({
  recruiter,
  onTrackAction,
}: LiveChatScreenProps) {
  const firstName = recruiter.name.split(" ")[0] || recruiter.name || "there";

  const welcomeMessage: ChatMessage = useMemo(
    () => ({
      id: "msg_welcome",
      sender: "gaurav",
      senderName: "Gaurav Jayendra Patil",
      text: `Hi ${firstName}! Welcome to my verified direct channel.\n\nWhether you'd like to discuss senior full-stack/systems roles at ${recruiter.company}, review architecture, or schedule a technical call, feel free to send a message below.\n\nYour message triggers an instant high-priority email alert directly to my inbox on the spot with a 1-click magic link. I will follow up shortly — you'll see my reply right here in real time.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }),
    [firstName, recruiter.company]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(CHAT_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [welcomeMessage];
  });

  const [isVisitorLocked, setIsVisitorLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem(CHAT_LOCKED_KEY) === "true";
      } catch {}
    }
    return false;
  });

  const [deliveryStage, setDeliveryStage] = useState<DeliveryStage>(() => {
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem(CHAT_LOCKED_KEY) === "true") {
          return "notified";
        }
      } catch {}
    }
    return "idle";
  });

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return !sessionStorage.getItem(CHAT_CACHE_KEY);
      } catch {}
    }
    return true;
  });

  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [isCircuitBroken, setIsCircuitBroken] = useState(false);
  const [isSessionPaused, setIsSessionPaused] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const consecutiveErrorsRef = useRef(0);
  const isIdleRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const lockStartedAtRef = useRef<number | null>(null);

  // Server message segmentation for pagination
  const serverMessages = useMemo(
    () => messages.filter((m) => m.id !== "msg_welcome"),
    [messages]
  );
  const totalServerMessages = serverMessages.length;
  const hasOlderMessages = totalServerMessages > visibleLimit;
  const remainingOlderCount = Math.max(0, totalServerMessages - visibleLimit);

  const displayedMessages = useMemo(() => {
    if (!hasOlderMessages) {
      return [welcomeMessage, ...serverMessages];
    }
    return serverMessages.slice(-visibleLimit);
  }, [hasOlderMessages, welcomeMessage, serverMessages, visibleLimit]);

  const latestVisitorMsgId = useMemo(() => {
    for (let i = displayedMessages.length - 1; i >= 0; i--) {
      if (displayedMessages[i].sender !== "gaurav") {
        return displayedMessages[i].id;
      }
    }
    return null;
  }, [displayedMessages]);

  // Production Auto-Scroll Controller
  const {
    scrollContainerRef,
    messagesContentRef,
    composerContainerRef,
    handleScroll,
    scrollToLatest,
    prepareHistoryPrepend,
    finishHistoryPrepend,
    showScrollBottom,
    hasNewMessageBelow,
  } = useChatAutoScroll({
    conversationKey: recruiter.email || "recruiter_chat",
    messages: displayedMessages,
    adminSender: "gaurav",
    visitorSender: "visitor",
    bottomTolerance: 28,
    nearBottomThreshold: 100,
    isOpen: true,
  });

  // Load older history with scroll-offset preservation
  const handleLoadOlderMessages = () => {
    if (isLoadingOlder || !hasOlderMessages) return;
    setIsLoadingOlder(true);

    const snapshot = prepareHistoryPrepend();

    const timerId = setTimeout(() => {
      setVisibleLimit((prev) => Math.min(prev + PAGE_SIZE, totalServerMessages));
      setIsLoadingOlder(false);
      finishHistoryPrepend(snapshot);
    }, 120);

    timersRef.current.push(timerId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      abortControllerRef.current?.abort();
      broadcastRef.current?.close();
    };
  }, []);

  // Idle state reset
  const resetIdleState = useCallback(() => {
    isIdleRef.current = false;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true;
    }, 10 * 60 * 1000);
  }, []);

  // 1. Fetch transcript and lock state from server
  const fetchMessages = useCallback(
    async (isManualRetry = false) => {
      if (isManualRetry) {
        consecutiveErrorsRef.current = 0;
        setIsCircuitBroken(false);
      }

      try {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const res = await fetch("/api/assistant/chat/messages", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
        });

        // If unauthorized, pause polling gracefully without revoking recruiter portal session
        if (res.status === 401) {
          consecutiveErrorsRef.current += 1;
          setIsCircuitBroken(true);
          setSendError("Live chat connection unverified. Please refresh to reconnect.");
          return;
        }

        const data = await res.json();
        if (res.ok && data.ok) {
          consecutiveErrorsRef.current = 0;
          if (isCircuitBroken) setIsCircuitBroken(false);

          const locked = data.isVisitorLocked === true;
          setIsVisitorLocked(locked);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(CHAT_LOCKED_KEY, locked ? "true" : "false");
            } catch {}
          }
          setDeliveryStage((prev) => {
            if (locked) {
              if (prev === "notifying" || prev === "sending") return prev;
              return "notified";
            }
            return "idle";
          });

          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const serverMsgs: ChatMessage[] = data.messages.map(
              (m: {
                id: string;
                sender: "visitor" | "gaurav";
                senderName?: string;
                text: string;
                createdAt?: string;
              }) => ({
                id: m.id,
                sender: m.sender,
                senderName: m.senderName,
                text: m.text,
                timestamp: m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
              })
            );

            setMessages((prev) => {
              const prevServer = prev.filter((m) => m.id !== "msg_welcome");
              if (
                prevServer.length === serverMsgs.length &&
                prevServer.every(
                  (m, i) => m.id === serverMsgs[i]?.id && m.text === serverMsgs[i]?.text
                )
              ) {
                return prev;
              }
              const nextAll = [welcomeMessage, ...serverMsgs];
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(nextAll));
                } catch {}
              }
              return nextAll;
            });
          } else {
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify([welcomeMessage]));
              } catch {}
            }
          }
          setIsInitialLoading(false);
        } else {
          throw new Error(data.message || "Failed to sync");
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        consecutiveErrorsRef.current += 1;
        // Circuit Breaker: 5 consecutive failures pause polling
        if (consecutiveErrorsRef.current >= 5) {
          setIsCircuitBroken(true);
        }
        setIsInitialLoading(false);
      }
    },
    [welcomeMessage, isCircuitBroken]
  );

  // Multi-Tab & In-App Shared Broadcast Sync Channel
  useEffect(() => {
    const handleRefresh = () => {
      fetchMessages(true);
    };

    window.addEventListener("refresh-live-chat-transcript", handleRefresh);

    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel("live_chat_transcript_sync");
        broadcastRef.current = bc;
        bc.onmessage = (event) => {
          if (event.data?.type === "REFRESH_TRANSCRIPT") {
            fetchMessages(true);
          }
        };
      } catch {
        // Safe fallback
      }
    }

    return () => {
      window.removeEventListener("refresh-live-chat-transcript", handleRefresh);
    };
  }, [fetchMessages]);

  // 2. Zero-Burn Polling Scheduler with State-Aware Cadence
  useEffect(() => {
    fetchMessages();
    resetIdleState();

    let timeoutId: NodeJS.Timeout | null = null;
    let sessionPauseTimer: NodeJS.Timeout | null = null;
    let isDisposed = false;

    // Auto-pause polling after 25 minutes of continuous idle
    const armSessionPauseTimer = () => {
      if (sessionPauseTimer) clearTimeout(sessionPauseTimer);
      sessionPauseTimer = setTimeout(() => {
        setIsSessionPaused(true);
      }, 25 * 60 * 1000);
    };

    armSessionPauseTimer();

    const scheduleNextPoll = () => {
      if (isDisposed) return;

      if (
        consecutiveErrorsRef.current >= 5 ||
        document.visibilityState === "hidden" ||
        isSessionPaused
      ) {
        return;
      }

      let delayMs = 15000;

      if (isVisitorLocked) {
        if (!lockStartedAtRef.current) lockStartedAtRef.current = Date.now();
        const waitingMs = Date.now() - lockStartedAtRef.current;

        if (waitingMs < 2 * 60 * 1000) {
          delayMs = 5000; // 0 - 2 mins: 5s
        } else if (waitingMs < 8 * 60 * 1000) {
          delayMs = 10000; // 2 - 8 mins: 10s
        } else if (waitingMs < 20 * 60 * 1000) {
          delayMs = 20000; // 8 - 20 mins: 20s
        } else {
          delayMs = 30000; // > 20 mins: 30s
        }
      } else {
        lockStartedAtRef.current = null;
        delayMs = isIdleRef.current ? 30000 : 15000;
      }

      // Exponential error backoff
      if (consecutiveErrorsRef.current === 1) delayMs = Math.max(delayMs, 8000);
      else if (consecutiveErrorsRef.current >= 2) delayMs = Math.max(delayMs, 16000);

      timeoutId = setTimeout(async () => {
        if (!isDisposed && document.visibilityState === "visible" && !isSessionPaused) {
          await fetchMessages();
          scheduleNextPoll();
        }
      }, delayMs);
    };

    scheduleNextPoll();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isSessionPaused) {
        resetIdleState();
        armSessionPauseTimer();
        fetchMessages(true);
        scheduleNextPoll();
      } else if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const handleOnline = () => {
      if (!isSessionPaused) {
        fetchMessages(true);
        scheduleNextPoll();
      }
    };

    const handleUserActivity = () => {
      resetIdleState();
      armSessionPauseTimer();
      if (isSessionPaused) {
        setIsSessionPaused(false);
        fetchMessages(true);
        scheduleNextPoll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("pointerdown", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });

    return () => {
      isDisposed = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (sessionPauseTimer) clearTimeout(sessionPauseTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pointerdown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [fetchMessages, resetIdleState, isVisitorLocked, isSessionPaused]);

  // Adjust textarea height dynamically up to 120px
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    resetIdleState();
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  // Dispatch message with optimistic update and rollback on failure
  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || isVisitorLocked) return;

    setSendError(null);
    setIsSending(true);
    setDeliveryStage("sending");

    // Optimistic message
    const tempId = `usr_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: "visitor",
      senderName: recruiter.name,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => {
      const next = [...prev, optimisticMsg];
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(next));
          sessionStorage.setItem(CHAT_LOCKED_KEY, "true");
        } catch {}
      }
      return next;
    });

    setInputText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsVisitorLocked(true);

    try {
      const res = await fetch("/api/assistant/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Rollback optimistic bubble & restore draft
        setMessages((prev) => {
          const rolledBack = prev.filter((m) => m.id !== tempId);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(rolledBack));
              sessionStorage.setItem(CHAT_LOCKED_KEY, "false");
            } catch {}
          }
          return rolledBack;
        });
        setInputText(trimmed);
        setSendError(data.message || "Failed to deliver message. Please try again.");
        setIsVisitorLocked(false);
      } else {
        onTrackAction?.("LIVE_CHAT_SEND", {
          company: recruiter.company,
          email: recruiter.email,
        });

        broadcastRef.current?.postMessage({
          type: "REFRESH_TRANSCRIPT",
          threadId: data.thread?.id,
        });

        setDeliveryStage("notifying");
        const timerId = setTimeout(() => {
          setDeliveryStage("notified");
        }, 1200);
        timersRef.current.push(timerId);
      }
    } catch {
      // Rollback optimistic bubble & restore draft
      setMessages((prev) => {
        const rolledBack = prev.filter((m) => m.id !== tempId);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(rolledBack));
            sessionStorage.setItem(CHAT_LOCKED_KEY, "false");
          } catch {}
        }
        return rolledBack;
      });
      setInputText(trimmed);
      setSendError("Network error. Please check your connection.");
      setIsVisitorLocked(false);
      setDeliveryStage("idle");
    } finally {
      setIsSending(false);
      fetchMessages();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full w-full overflow-hidden select-none bg-[#FAFAFA] text-black relative">
      {/* 1. Header Bar with Shiro Styling */}
      <div className="shrink-0 px-4 sm:px-6 py-3 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED]">
            <FaComments className="text-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-admin-sans tracking-tight text-black">
                Direct Line with Gaurav
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-admin-mono font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Alerts Active
              </span>
            </div>
            <p className="text-[11px] font-admin-mono text-gray-500">
              Verified corporate access for <span className="font-semibold text-black">{recruiter.company}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-admin-mono px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-gray-600 hidden md:flex items-center gap-1.5">
            <FaShieldAlt className="text-[#7C3AED] text-[10px]" />
            <span>Turn-Based · End-to-End Logged</span>
          </span>
        </div>
      </div>

      {/* 2. Message Feed Area (Strictly Internal Scroll) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-5 space-y-4 relative"
      >
        <div ref={messagesContentRef} className="max-w-3xl mx-auto space-y-4 pb-2">
          {/* History Pagination Trigger */}
          {hasOlderMessages && (
            <div className="flex justify-center pt-1 pb-2">
              <button
                type="button"
                onClick={handleLoadOlderMessages}
                disabled={isLoadingOlder}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-gray-600 hover:text-black hover:border-gray-300 text-xs font-admin-mono transition shadow-2xs cursor-pointer"
              >
                {isLoadingOlder ? (
                  <>
                    <CgSpinner className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                    <span>Loading history...</span>
                  </>
                ) : (
                  <span>Load older messages ({remainingOlderCount})</span>
                )}
              </button>
            </div>
          )}

          {/* Skeleton Loader during initial message load */}
          {isInitialLoading ? (
            <div className="space-y-4 py-2 animate-pulse">
              {/* Gaurav message skeleton */}
              <div className="flex flex-col items-start space-y-1.5">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="w-28 h-3 bg-gray-200 rounded" />
                  <div className="w-12 h-3 bg-gray-100 rounded" />
                </div>
                <div className="w-[85%] sm:w-[72%] bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-xs p-4 shadow-2xs space-y-2.5">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>

              {/* Recruiter message skeleton */}
              <div className="flex flex-col items-end space-y-1.5">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="w-20 h-3 bg-gray-200 rounded" />
                  <div className="w-10 h-3 bg-gray-100 rounded" />
                </div>
                <div className="w-[60%] sm:w-[45%] bg-[#090D16]/70 rounded-2xl rounded-tr-xs p-3.5 shadow-2xs space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-700 rounded w-4/5" />
                </div>
              </div>

              {/* Gaurav response skeleton */}
              <div className="flex flex-col items-start space-y-1.5">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="w-28 h-3 bg-gray-200 rounded" />
                  <div className="w-12 h-3 bg-gray-100 rounded" />
                </div>
                <div className="w-[75%] sm:w-[60%] bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-xs p-4 shadow-2xs space-y-2.5">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-admin-mono text-gray-400 pt-3">
                <CgSpinner className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                <span>Syncing direct channel history...</span>
              </div>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isGaurav = msg.sender === "gaurav";
              const isLatestVisitorMsg = msg.id === latestVisitorMsgId;

              return (
                <div key={msg.id} className="space-y-1.5">
                  <div
                    className={`flex flex-col ${isGaurav ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-admin-mono font-semibold text-gray-400 uppercase tracking-wider">
                        {isGaurav ? "Gaurav Jayendra Patil" : recruiter.name}
                      </span>
                      {msg.timestamp && (
                        <span className="text-[10px] font-admin-mono text-gray-400">
                          · {msg.timestamp}
                        </span>
                      )}
                      {!isGaurav && (
                        <span className="text-[10px] font-admin-mono text-emerald-600 flex items-center gap-0.5 font-medium ml-1">
                          <IoCheckmarkDoneOutline className="text-xs" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                        isGaurav
                          ? "bg-[#FFFFFF] border border-[#E2E8F0] text-gray-800 rounded-tl-xs"
                          : "bg-[#090D16] text-white rounded-tr-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                    </div>
                  </div>

                  {/* Gaurav Reply Status Badge */}
                  {isGaurav && msg.id !== "msg_welcome" && (
                    <div className="flex items-center justify-start pl-1 select-none">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-admin-mono font-semibold shadow-2xs">
                        <BsLightningChargeFill className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span>Gaurav replied · {msg.timestamp}</span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic System Notification Lifecycle Badge below latest recruiter message */}
                  {!isGaurav && isLatestVisitorMsg && (isVisitorLocked || isSending || deliveryStage !== "idle") && (
                    <div className="flex items-center justify-end pr-1 pt-0.5 select-none animate-in fade-in duration-200">
                      {deliveryStage === "sending" || isSending ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10.5px] sm:text-[11px] font-admin-mono font-medium shadow-2xs animate-pulse">
                          <CgSpinner className="w-3 h-3 animate-spin text-[#7C3AED]" />
                          <span>Delivering to Gaurav&apos;s direct channel...</span>
                        </div>
                      ) : deliveryStage === "notifying" ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] text-[10.5px] sm:text-[11px] font-admin-mono font-medium shadow-2xs animate-pulse">
                          <BsLightningChargeFill className="w-3 h-3 text-[#7C3AED] shrink-0" />
                          <span>Notifying Gaurav on high priority...</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] text-[10.5px] sm:text-[11px] font-admin-mono font-medium shadow-2xs">
                          <BsLightningChargeFill className="w-3 h-3 text-[#7C3AED] shrink-0" />
                          <span>System has notified Gaurav on high priority. Gaurav&apos;s reply will show here.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Circuit Breaker & Quota Sleep Reconnect Banners */}
          {isCircuitBroken && (
            <div className="flex items-center justify-center py-2 animate-in fade-in">
              <button
                type="button"
                onClick={() => fetchMessages(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-admin-mono hover:bg-amber-100 transition shadow-2xs cursor-pointer"
              >
                <span>Connection paused · Tap to reconnect</span>
              </button>
            </div>
          )}

          {isSessionPaused && (
            <div className="flex items-center justify-center py-2 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setIsSessionPaused(false);
                  fetchMessages(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-admin-mono hover:bg-slate-200 transition shadow-2xs cursor-pointer"
              >
                <span>Sync paused (idle) · Tap to resume</span>
              </button>
            </div>
          )}

          {sendError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-admin-mono text-center animate-in fade-in">
              {sendError}
            </div>
          )}
        </div>
      </div>

      {/* Floating Jump to Bottom Button */}
      {(showScrollBottom || hasNewMessageBelow) && (
        <button
          type="button"
          onClick={() => scrollToLatest("smooth", "latest-button")}
          className="absolute right-6 sm:right-10 bottom-24 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-admin-mono font-semibold bg-white border border-[#DDD6FE] text-[#7C3AED] shadow-md hover:bg-purple-50 transition cursor-pointer select-none active:scale-95 animate-in fade-in"
          aria-label="Scroll to latest message"
        >
          <BsLightningChargeFill className="text-xs" />
          <span>{hasNewMessageBelow ? "New message below" : "Jump to latest"}</span>
          <IoChevronDown className="text-xs" />
        </button>
      )}

      {/* 3. Bottom Composer Area (Zero-Scroll Bounded) */}
      <div
        ref={composerContainerRef}
        className="shrink-0 p-3 sm:p-4 bg-[#FFFFFF] border-t border-[#E2E8F0] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-3xl mx-auto">
          {/* Quick Starter Chips for fresh chats */}
          {!isVisitorLocked && serverMessages.length === 0 && !isInitialLoading && (
            <div className="mb-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10.5px] font-admin-mono text-gray-400 mr-1 hidden sm:inline">
                Suggested:
              </span>
              {[
                `Discuss Senior Full-Stack role at ${recruiter.company}`,
                `Schedule a technical screening call`,
                `Inquire about engineering availability`,
              ].map((promptText) => (
                <button
                  key={promptText}
                  type="button"
                  onClick={() => {
                    setInputText(promptText);
                    inputRef.current?.focus();
                  }}
                  className="text-[11px] font-admin-mono px-2.5 py-1 rounded-full bg-[#F8FAFC] hover:bg-[#F5F3FF] border border-[#E2E8F0] hover:border-[#DDD6FE] text-gray-600 hover:text-[#7C3AED] transition-all cursor-pointer shadow-2xs"
                >
                  {promptText}
                </button>
              ))}
            </div>
          )}

          {isVisitorLocked ? (
            <div className="w-full py-3.5 px-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-gray-600 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-medium">
                <IoLockClosedOutline className="text-sm text-[#7C3AED] shrink-0" />
                <span>
                  Message delivered to Gaurav&apos;s personal inbox &bull; Awaiting his reply to unlock
                </span>
              </div>
              <span className="text-[10px] font-admin-mono px-2.5 py-0.5 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] font-semibold shrink-0">
                Awaiting Reply
              </span>
            </div>
          ) : (
            <div className="relative flex items-end w-full bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-purple-100 rounded-xl transition shadow-2xs p-1">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                placeholder="Type your message to Gaurav (Enter to send, Shift+Enter for newline)..."
                className="w-full py-2 pl-3.5 pr-12 text-xs sm:text-[13px] bg-transparent text-black placeholder-gray-400 focus:outline-none resize-none min-h-[40px] max-h-32 leading-relaxed"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isSending}
                className={`absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  inputText.trim() && !isSending
                    ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-2xs active:scale-95"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                {isSending ? (
                  <CgSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <IoArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-admin-mono text-gray-400">
            <span className="flex items-center gap-1 text-[#7C3AED]">
              <FaBolt className="text-[9px]" />
              <span>Sends an instant live alert to Gaurav&apos;s email on the spot.</span>
            </span>
            <span className="hidden sm:inline">Press Enter ↵ to dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
