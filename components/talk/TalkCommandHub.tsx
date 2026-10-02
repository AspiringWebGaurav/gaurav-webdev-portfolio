"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  IoCloudDoneOutline,
  IoCloudUploadOutline,
  IoLogOutOutline,
  IoCopyOutline,
  IoCheckmark,
  IoDownloadOutline,
  IoTrashOutline,
  IoPaperPlane,
  IoRefreshOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoArchiveOutline,
  IoCodeSlashOutline,
  IoSearchOutline,
  IoLinkOutline,
  IoWarningOutline,
  IoKeyOutline,
  IoFolderOpenOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoSparkles,
} from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";
import type {
  TalkVaultFile,
  TalkMessage,
  TalkMessageTag,
  TalkNotepad,
} from "@/types/talk";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "Saved";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 8) return "Saved just now";
  if (diffSec < 60) return `Saved ${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Saved ${diffMin}m ago`;
  return `Saved ${formatDate(timestamp)}`;
}

function getFileIcon(mime: string, name: string) {
  if (mime.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(name)) {
    return <IoImageOutline className="w-4 h-4 text-pink-500" />;
  }
  if (
    mime.includes("zip") ||
    mime.includes("tar") ||
    mime.includes("rar") ||
    /\.(zip|tar|gz|7z|rar)$/i.test(name)
  ) {
    return <IoArchiveOutline className="w-4 h-4 text-amber-500" />;
  }
  if (
    mime.includes("javascript") ||
    mime.includes("json") ||
    mime.includes("typescript") ||
    /\.(ts|tsx|js|jsx|json|py|go|rs|css|html)$/i.test(name)
  ) {
    return <IoCodeSlashOutline className="w-4 h-4 text-cyan-500" />;
  }
  return <IoDocumentTextOutline className="w-4 h-4 text-[#7C3AED]" />;
}

export const TalkCommandHub: React.FC = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("talk_theme");
      if (saved === "dark") {
        setThemeMode("dark");
        setTheme("dark");
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        if (document.body) document.body.style.backgroundColor = "#07090E";
      } else {
        setThemeMode("light");
        setTheme("light");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        if (document.body) document.body.style.backgroundColor = "#FAFAFA";
      }
    } catch {
      setThemeMode("light");
      setTheme("light");
    }
  }, [setTheme]);

  const isDark = mounted ? themeMode === "dark" : false;

  const toggleTheme = () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    setTheme(nextTheme);
    try {
      localStorage.setItem("talk_theme", nextTheme);
    } catch {}
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        if (document.body) document.body.style.backgroundColor = "#07090E";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        if (document.body) document.body.style.backgroundColor = "#FAFAFA";
      }
    }
  };

  // Mobile Navigation Tab State with Persistence
  const [mobileTab, setMobileTab] = useState<"notepad" | "vault" | "messages">("notepad");

  // Restore persisted tab on mount (from URL query/hash or localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab") as "notepad" | "vault" | "messages" | null;
      const hashTab = window.location.hash.replace("#", "") as "notepad" | "vault" | "messages" | null;
      const valid = ["notepad", "vault", "messages"] as const;

      if (queryTab && valid.includes(queryTab)) {
        setMobileTab(queryTab);
        return;
      }
      if (hashTab && valid.includes(hashTab)) {
        setMobileTab(hashTab);
        return;
      }
      const saved = localStorage.getItem("talk_active_mobile_tab_v1") as "notepad" | "vault" | "messages" | null;
      if (saved && valid.includes(saved)) {
        setMobileTab(saved);
      }
    } catch {}
  }, []);

  const handleTabChange = (tab: "notepad" | "vault" | "messages") => {
    setMobileTab(tab);
    try {
      localStorage.setItem("talk_active_mobile_tab_v1", tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  // Storage Keys for Local-First Zero-Loss Cache
  const TALK_DRAFT_KEY = "talk_notepad_draft_v1";
  const TALK_DRAFT_TIME_KEY = "talk_notepad_draft_time_v1";

  // Smart Sync State Machine
  const [notepadContent, setNotepadContent] = useState("");
  const [notepadStats, setNotepadStats] = useState({ chars: 0, words: 0, lastSaved: Date.now() });
  const [syncStatus, setSyncStatus] = useState<"SYNCED" | "DIRTY" | "SAVING" | "LOCAL_ONLY" | "ERROR">("SYNCED");

  // Thread-Safe Sync References & Delta Tracking
  const contentRef = useRef("");
  const lastSyncedContentRef = useRef("");
  const isDirtyRef = useRef(false);
  const isSyncingRef = useRef(false);
  const pendingSyncAfterCurrentRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxThrottleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Files State (Firebase Storage)
  const [files, setFiles] = useState<TalkVaultFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [fileSearch, setFileSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Messages State
  const [messages, setMessages] = useState<TalkMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedTag, setSelectedTag] = useState<TalkMessageTag>("general");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Feedback Toast
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // ==========================================
  // 1. SMART TYPE & SYNC ENGINE (Local-First + Smart Cloud Reconciliation)
  // ==========================================
  
  // Flushes dirty content to cloud with delta checks, locking & zero-loss fallback
  const flushSync = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxThrottleTimerRef.current) {
      clearTimeout(maxThrottleTimerRef.current);
      maxThrottleTimerRef.current = null;
    }

    const currentText = contentRef.current;

    // Delta check: Never waste network or database quotas if already in sync
    if (currentText === lastSyncedContentRef.current) {
      isDirtyRef.current = false;
      setSyncStatus("SYNCED");
      return;
    }

    // Concurrency lock: queue trailing sync if a request is already flying
    if (isSyncingRef.current) {
      pendingSyncAfterCurrentRef.current = true;
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus("SAVING");

    try {
      const res = await fetch("/api/talk/notepad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notepad) {
          lastSyncedContentRef.current = currentText;
          const now = data.notepad.lastModifiedAt || Date.now();
          setNotepadStats((prev) => ({
            ...prev,
            lastSaved: now,
          }));

          // If no additional keystrokes occurred during in-flight network dispatch
          if (contentRef.current === currentText) {
            isDirtyRef.current = false;
            setSyncStatus("SYNCED");
            try {
              localStorage.removeItem(TALK_DRAFT_KEY);
              localStorage.removeItem(TALK_DRAFT_TIME_KEY);
            } catch {}
          } else {
            // User continued typing while sync was in-flight
            isDirtyRef.current = true;
            setSyncStatus("DIRTY");
          }
        } else {
          setSyncStatus("LOCAL_ONLY");
        }
      } else {
        setSyncStatus("LOCAL_ONLY");
      }
    } catch {
      // Offline resilience: LocalStorage preserves draft intact
      setSyncStatus("LOCAL_ONLY");
    } finally {
      isSyncingRef.current = false;
      if (pendingSyncAfterCurrentRef.current) {
        pendingSyncAfterCurrentRef.current = false;
        flushSync();
      }
    }
  }, []);

  // Hydrates notepad from server & reconciles with any newer offline local draft
  const fetchNotepad = useCallback(async () => {
    let localDraft: string | null = null;
    let localDraftTime = 0;
    try {
      localDraft = localStorage.getItem(TALK_DRAFT_KEY);
      localDraftTime = Number(localStorage.getItem(TALK_DRAFT_TIME_KEY) || 0);
    } catch {}

    try {
      const res = await fetch("/api/talk/notepad");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notepad) {
          const remoteNotepad: TalkNotepad = data.notepad;
          const remoteTime = remoteNotepad.lastModifiedAt || 0;

          // Reconcile: If local draft exists, has newer timestamp than cloud, and differs
          if (localDraft && localDraftTime > remoteTime && localDraft !== remoteNotepad.content) {
            contentRef.current = localDraft;
            lastSyncedContentRef.current = remoteNotepad.content;
            isDirtyRef.current = true;
            setNotepadContent(localDraft);
            setNotepadStats({
              chars: localDraft.length,
              words: localDraft.trim() ? localDraft.trim().split(/\s+/).length : 0,
              lastSaved: localDraftTime,
            });
            setSyncStatus("DIRTY");
            flushSync();
            return;
          }

          // Otherwise cloud content is canonical
          contentRef.current = remoteNotepad.content;
          lastSyncedContentRef.current = remoteNotepad.content;
          isDirtyRef.current = false;
          setNotepadContent(remoteNotepad.content);
          setNotepadStats({
            chars: remoteNotepad.charCount,
            words: remoteNotepad.wordCount,
            lastSaved: remoteNotepad.lastModifiedAt,
          });
          setSyncStatus("SYNCED");
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load notepad from cloud:", err);
    }

    // Fallback if cloud was unreachable on cold boot
    if (localDraft) {
      contentRef.current = localDraft;
      lastSyncedContentRef.current = "";
      isDirtyRef.current = true;
      setNotepadContent(localDraft);
      setSyncStatus("LOCAL_ONLY");
    }
  }, [flushSync]);

  // Reactive type handler: 0ms UI lag, instant local write, adaptive debounce & max throttle
  const handleNotepadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    contentRef.current = val;
    setNotepadContent(val);

    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    setNotepadStats((prev) => ({
      ...prev,
      chars: val.length,
      words,
    }));

    // 1. Instant local write (Zero data loss guarantee)
    try {
      localStorage.setItem(TALK_DRAFT_KEY, val);
      localStorage.setItem(TALK_DRAFT_TIME_KEY, String(Date.now()));
    } catch {}

    // 2. Delta check: If user pressed undo back to synced cloud version
    if (val === lastSyncedContentRef.current) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (maxThrottleTimerRef.current) clearTimeout(maxThrottleTimerRef.current);
      isDirtyRef.current = false;
      setSyncStatus("SYNCED");
      return;
    }

    // 3. Mark as dirty & schedule adaptive smart sync
    isDirtyRef.current = true;
    setSyncStatus("DIRTY");

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushSync();
    }, 1200);

    // Max throttle ceiling (persists at least every 4s during rapid continuous typing)
    if (!maxThrottleTimerRef.current) {
      maxThrottleTimerRef.current = setTimeout(() => {
        flushSync();
      }, 4000);
    }
  };

  const insertSnippet = (snippet: string) => {
    const updated = contentRef.current + (contentRef.current.endsWith("\n") || !contentRef.current ? "" : "\n") + snippet;
    contentRef.current = updated;
    setNotepadContent(updated);
    const words = updated.trim() ? updated.trim().split(/\s+/).length : 0;
    setNotepadStats((prev) => ({
      ...prev,
      chars: updated.length,
      words,
    }));
    try {
      localStorage.setItem(TALK_DRAFT_KEY, updated);
      localStorage.setItem(TALK_DRAFT_TIME_KEY, String(Date.now()));
    } catch {}
    isDirtyRef.current = true;
    setSyncStatus("DIRTY");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushSync();
    }, 800);
  };

  const handleClearNotepad = async () => {
    if (!confirm("Clear your private scratchpad?")) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxThrottleTimerRef.current) {
      clearTimeout(maxThrottleTimerRef.current);
      maxThrottleTimerRef.current = null;
    }

    contentRef.current = "";
    lastSyncedContentRef.current = "";
    isDirtyRef.current = false;
    setNotepadContent("");
    setNotepadStats({
      chars: 0,
      words: 0,
      lastSaved: Date.now(),
    });
    setSyncStatus("SAVING");

    try {
      localStorage.removeItem(TALK_DRAFT_KEY);
      localStorage.removeItem(TALK_DRAFT_TIME_KEY);
    } catch {}

    try {
      const res = await fetch("/api/talk/notepad", { method: "DELETE" });
      if (res.ok) {
        setSyncStatus("SYNCED");
      } else {
        setSyncStatus("ERROR");
      }
    } catch {
      setSyncStatus("ERROR");
    }
  };

  const downloadNotepad = () => {
    const blob = new Blob([contentRef.current], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gaurav-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // 2. FILE VAULT LOGIC
  // ==========================================
  const fetchFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/talk/files");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setFiles(data.files);
        }
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    setIsUploadingFile(true);
    setUploadCount(filesArray.length);

    try {
      const formData = new FormData();
      filesArray.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/talk/files", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setFiles((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const newFiles = (data.files as TalkVaultFile[]).filter((f) => !existingIds.has(f.id));
            return [...newFiles, ...prev];
          });
        }
      }
    } catch (err) {
      console.error("Error uploading files:", err);
    } finally {
      setIsUploadingFile(false);
      setUploadCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file from Firebase Storage?")) return;
    try {
      const res = await fetch(`/api/talk/files?id=${encodeURIComponent(fileId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        alert("Failed to delete file from backend storage.");
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
      alert("Error deleting file from backend.");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // ==========================================
  // 3. MESSAGES FEED LOGIC
  // ==========================================
  const fetchMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch("/api/talk/messages");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch("/api/talk/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newMessageText.trim(),
          tag: selectedTag,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.message) {
          setMessages((prev) => [data.message, ...prev]);
          setNewMessageText("");
        }
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/talk/messages?id=${encodeURIComponent(msgId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleClearAllMessages = async () => {
    if (!confirm("Clear all messages from your stream?")) return;
    try {
      const res = await fetch("/api/talk/messages?clearAll=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to clear messages:", err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/talk/auth/logout", { method: "POST" });
      const data = await res.json();
      router.push(data.redirect || "/talk/login");
      router.refresh();
    } catch {
      router.push("/talk/login");
    }
  };

  useEffect(() => {
    fetchNotepad();
    fetchFiles();
    fetchMessages();
  }, [fetchNotepad, fetchFiles, fetchMessages]);

  // Window & Lifecycle Listeners for Bulletproof Smart Sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isDirtyRef.current) {
        flushSync();
      }
    };

    const handleBeforeUnload = () => {
      if (isDirtyRef.current && contentRef.current !== lastSyncedContentRef.current) {
        try {
          fetch("/api/talk/notepad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: contentRef.current }),
            keepalive: true,
          });
        } catch {}
      }
    };

    const handleOnline = () => {
      if (isDirtyRef.current || syncStatus === "LOCAL_ONLY") {
        flushSync();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("online", handleOnline);
    };
  }, [flushSync, syncStatus]);

  const filteredFiles = files.filter(
    (f) =>
      f.originalName.toLowerCase().includes(fileSearch.toLowerCase()) ||
      f.fileName.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const getTagBadge = (tag: TalkMessageTag) => {
    switch (tag) {
      case "urgent":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center gap-1">
            <IoWarningOutline className="w-3 h-3" /> Urgent
          </span>
        );
      case "link":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900 flex items-center gap-1">
            <IoLinkOutline className="w-3 h-3" /> Link
          </span>
        );
      case "idea":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
            <IoSparkles className="w-3 h-3" /> Idea
          </span>
        );
      case "secret":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 flex items-center gap-1">
            <IoKeyOutline className="w-3 h-3" /> Secret
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            General
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ============================================================== */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ============================================================== */}
      <header className="w-full h-12 sm:h-13 bg-white dark:bg-[#07090E] px-4 sm:px-6 md:px-8 flex items-center justify-between z-20 relative shrink-0">
        <Link
          href="/"
          className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition-opacity"
        >
          talk<span className="text-[#7C3AED]">.</span>
        </Link>

        {/* Status Indicators & Tactile Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status */}
          <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50 dark:bg-[#0E0D17] text-[11px] font-mono">
            {syncStatus === "SYNCED" ? (
              <>
                <IoCloudDoneOutline className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-600 dark:text-slate-300">Synced</span>
              </>
            ) : syncStatus === "DIRTY" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
                <span className="text-[#7C3AED]">Unsaved</span>
              </>
            ) : syncStatus === "SAVING" ? (
              <>
                <CgSpinner className="w-3.5 h-3.5 text-[#7C3AED] animate-spin" />
                <span className="text-[#7C3AED]">Syncing...</span>
              </>
            ) : syncStatus === "LOCAL_ONLY" ? (
              <>
                <IoCloudUploadOutline className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Offline (Saved)</span>
              </>
            ) : (
              <>
                <IoWarningOutline className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-500">Error</span>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="w-8 h-8 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50 dark:bg-[#0E0D17] text-slate-600 dark:text-amber-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
          >
            {isDark ? <IoSunnyOutline className="w-4 h-4" /> : <IoMoonOutline className="w-4 h-4" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="h-8 px-3 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white hover:bg-red-50 dark:bg-[#0E0D17] dark:hover:bg-red-950/30 text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            <IoLogOutOutline className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Shiro Horizontal Dashed Divider */}
        <div className="absolute bottom-0 inset-x-0 h-px pointer-events-none">
          <svg className="w-full h-px text-[#E2E8F0] dark:text-[#1E293B] overflow-visible">
            <line x1="0" y1="0" x2="100%" y2="0" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MOBILE RESPONSIVE TAB SWITCHER (< lg screens) */}
      {/* ============================================================== */}
      <div className="lg:hidden w-full px-2.5 py-1.5 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-white/90 dark:bg-[#07090E]/90 backdrop-blur-md z-10 flex items-center justify-between gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => handleTabChange("notepad")}
          className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            mobileTab === "notepad"
              ? "bg-slate-900 text-white dark:bg-[#7C3AED] shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <IoDocumentTextOutline className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Notes</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("vault")}
          className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
            mobileTab === "vault"
              ? "bg-slate-900 text-white dark:bg-[#7C3AED] shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <IoFolderOpenOutline className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Files</span>
          <span className="text-[10px] font-mono opacity-85 shrink-0">({files.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("messages")}
          className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
            mobileTab === "messages"
              ? "bg-slate-900 text-white dark:bg-[#7C3AED] shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <IoPaperPlane className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Messages</span>
          <span className="text-[10px] font-mono opacity-85 shrink-0">({messages.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. WORKSPACE CONTAINER (DESKTOP GRID / MOBILE ADAPTIVE) */}
      {/* ============================================================== */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-2.5 sm:p-3 lg:p-4 min-h-0 overflow-hidden flex flex-col">
        <div className="h-full min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-3.5 items-stretch">
          {/* ========================================== */}
          {/* COLUMN 1: PRIVATE CLOUD SCRATCHPAD (5 COLS) */}
          {/* ========================================== */}
          <div
            className={`lg:col-span-5 h-full min-h-0 flex flex-col rounded-xl sm:rounded-2xl bg-white dark:bg-[#0E0D17] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.09)] shadow-2xs overflow-hidden transition-all ${
              mobileTab === "notepad" ? "h-full flex" : "hidden lg:flex"
            }`}
          >
            {/* Notepad Header */}
            <div className="h-10 px-3 sm:px-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between bg-slate-50/60 dark:bg-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <IoDocumentTextOutline className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Notes
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                <span>{notepadStats.words}w</span>
                <span>•</span>
                <span>{notepadStats.chars}c</span>
              </div>
            </div>

            {/* Quick Insert Snippet Toolbar */}
            <div className="px-3 py-1.5 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50/30 dark:bg-black/20 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono mr-0.5 shrink-0">
                Insert:
              </span>
              <button
                type="button"
                onClick={() => insertSnippet("\n- [ ] ")}
                className="px-2 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111625] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px] font-mono transition-colors cursor-pointer shrink-0"
              >
                + Task
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("\n### ")}
                className="px-2 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111625] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px] font-mono transition-colors cursor-pointer shrink-0"
              >
                + Heading
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("\n```typescript\n\n```")}
                className="px-2 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111625] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px] font-mono transition-colors cursor-pointer shrink-0"
              >
                + Code
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("\n[Link Label](https://)")}
                className="px-2 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111625] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px] font-mono transition-colors cursor-pointer shrink-0"
              >
                + Link
              </button>
            </div>

            {/* Notepad Editor Area - Fills available height */}
            <div className="p-3 sm:p-4 flex-1 min-h-0 flex flex-col">
              <textarea
                value={notepadContent}
                onChange={handleNotepadChange}
                onBlur={() => flushSync()}
                placeholder="Type here..."
                className="w-full flex-1 min-h-0 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none font-mono text-xs sm:text-sm leading-relaxed overflow-y-auto"
              />
            </div>

            {/* Notepad Footer Controls */}
            <div className="h-10 px-3 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50/50 dark:bg-white/5 flex items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                {syncStatus === "SYNCED" ? (
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                    {formatRelativeTime(notepadStats.lastSaved)}
                  </span>
                ) : syncStatus === "DIRTY" ? (
                  <span className="text-[10px] sm:text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-mono flex items-center gap-1 truncate font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse shrink-0" />
                    Unsaved changes
                  </span>
                ) : syncStatus === "SAVING" ? (
                  <span className="text-[10px] sm:text-[11px] text-[#7C3AED] font-mono flex items-center gap-1 truncate">
                    <CgSpinner className="w-3 h-3 animate-spin text-[#7C3AED] shrink-0" />
                    Syncing...
                  </span>
                ) : syncStatus === "LOCAL_ONLY" ? (
                  <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-mono truncate">
                    Saved locally (offline)
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] text-red-500 font-mono truncate">
                    Sync error
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(notepadContent, "notepad")}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111625] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedId === "notepad" ? (
                    <>
                      <IoCheckmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <IoCopyOutline className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={downloadNotepad}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111625] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors cursor-pointer shadow-2xs"
                >
                  <IoDownloadOutline className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearNotepad}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Clear Scratchpad"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* COLUMN 2: VAULT & MESSAGES (7 COLS) */}
          {/* ========================================== */}
          <div
            className={`lg:col-span-7 h-full min-h-0 flex flex-col gap-3 lg:gap-3.5 ${
              mobileTab === "notepad" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* ========================================== */}
            {/* 2A. IMPORTANT FILES VAULT (FIREBASE STORAGE) */}
            {/* ========================================== */}
            <div
              className={`rounded-xl sm:rounded-2xl bg-white dark:bg-[#0E0D17] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.09)] shadow-2xs flex flex-col min-h-0 overflow-hidden transition-all ${
                mobileTab === "vault" ? "h-full flex" : "hidden lg:flex flex-1"
              }`}
            >
              <div className="h-10 px-3 sm:px-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between bg-slate-50/60 dark:bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <IoFolderOpenOutline className="w-4 h-4 text-[#7C3AED]" />
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Files
                  </h2>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-purple-50 dark:bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-200 dark:border-[#7C3AED]/30">
                    {files.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fetchFiles}
                  title="Refresh files"
                  className="p-1 rounded-md border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111625] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
                >
                  <IoRefreshOutline className={`w-3.5 h-3.5 ${isLoadingFiles ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Drag & Drop Upload Zone - Compact & Elegant */}
              <div className="p-2.5 sm:p-3 shrink-0">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg py-2.5 px-3 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-[#7C3AED] bg-[#7C3AED]/5"
                      : "border-[#CBD5E1] dark:border-[#334155] hover:border-[#7C3AED] dark:hover:border-[#7C3AED] bg-slate-50/50 dark:bg-black/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />

                  <div className="flex items-center justify-center gap-2">
                    {isUploadingFile ? (
                      <>
                        <CgSpinner className="w-4 h-4 text-[#7C3AED] animate-spin" />
                        <p className="text-xs font-medium text-[#7C3AED] font-mono">
                          {uploadCount > 1 ? `Uploading ${uploadCount} files...` : "Uploading..."}
                        </p>
                      </>
                    ) : (
                      <>
                        <IoCloudUploadOutline className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          Drop files or <span className="text-[#7C3AED] underline underline-offset-2">browse</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Search filter if many files */}
              {files.length > 2 && (
                <div className="px-2.5 sm:px-3 pb-2 shrink-0">
                  <div className="relative">
                    <IoSearchOutline className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      placeholder="Search files..."
                      className="w-full h-7 pl-7 pr-3 rounded-md bg-slate-50 dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#334155] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-black dark:focus:border-white font-mono shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* Files List - Fills remaining space & scrolls internally */}
              <div className="flex-1 min-h-0 overflow-y-auto px-2.5 sm:px-3 pb-2.5 space-y-1.5 pr-1">
                {isLoadingFiles ? (
                  <div className="h-full min-h-[60px] flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
                    <CgSpinner className="w-4 h-4 animate-spin text-[#7C3AED]" />
                    <span>Loading...</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="h-full min-h-[60px] flex items-center justify-center text-xs text-slate-400 font-mono">
                    {files.length === 0 ? "No files." : "No matching files."}
                  </div>
                ) : (
                  filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2 rounded-lg bg-slate-50/80 dark:bg-[#111625] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-2.5 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="shrink-0 p-1 rounded bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
                          {getFileIcon(file.mimeType, file.originalName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                            <span>{formatBytes(file.sizeBytes)}</span>
                            <span>•</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(file.downloadUrl, file.id)}
                          title="Copy file URL"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === file.id ? (
                            <IoCheckmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <IoCopyOutline className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={file.originalName}
                          title="Download file"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <IoDownloadOutline className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          title="Delete file"
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <IoTrashOutline className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ========================================== */}
            {/* 2B. "TALK TO ME" DISPATCH FEED */}
            {/* ========================================== */}
            <div
              className={`rounded-xl sm:rounded-2xl bg-white dark:bg-[#0E0D17] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.09)] shadow-2xs flex flex-col min-h-0 overflow-hidden transition-all ${
                mobileTab === "messages" ? "h-full flex" : "hidden lg:flex flex-1"
              }`}
            >
              <div className="h-10 px-3 sm:px-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between bg-slate-50/60 dark:bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <IoPaperPlane className="w-4 h-4 text-[#7C3AED]" />
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Messages
                  </h2>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-purple-50 dark:bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-200 dark:border-[#7C3AED]/30">
                    {messages.length}
                  </span>
                </div>

                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllMessages}
                    className="text-[11px] font-mono text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Message Composer - Compact */}
              <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 pb-2 space-y-1.5 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  {(["general", "urgent", "link", "idea", "secret"] as TalkMessageTag[]).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono capitalize transition-all cursor-pointer shrink-0 ${
                        selectedTag === tag
                          ? "bg-slate-900 text-white dark:bg-[#7C3AED] shadow-2xs font-semibold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 h-8 sm:h-8.5 px-3 rounded-lg bg-slate-50 dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#334155] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-black dark:focus:border-white font-mono shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!newMessageText.trim() || isSendingMessage}
                    className="h-8 sm:h-8.5 px-3 rounded-lg bg-[#0F172A] hover:bg-black dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center cursor-pointer shrink-0"
                  >
                    {isSendingMessage ? (
                      <CgSpinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <IoPaperPlane className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </form>

              {/* Messages Stream - Fills remaining space & scrolls internally */}
              <div className="flex-1 min-h-0 overflow-y-auto px-2.5 sm:px-3 pb-2.5 space-y-1.5 pr-1">
                {isLoadingMessages ? (
                  <div className="h-full min-h-[60px] flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
                    <CgSpinner className="w-4 h-4 animate-spin text-[#7C3AED]" />
                    <span>Loading...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full min-h-[60px] flex items-center justify-center text-xs text-slate-400 font-mono">
                    No messages.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-2 sm:p-2.5 rounded-lg bg-slate-50/80 dark:bg-[#111625] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-1 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getTagBadge(msg.tag)}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            title="Copy message"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <IoCheckmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <IoCopyOutline className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete message"
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <IoTrashOutline className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words whitespace-pre-wrap font-mono">
                        {msg.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};