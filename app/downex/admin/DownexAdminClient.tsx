"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Laptop,
  Search,
  Copy,
  Check,
  LogOut,
  Unlock,
  RefreshCw,
  ShieldAlert,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Menu,
  Megaphone,
  Pause,
  Play,
  Trash2,
  Send,
  Sun,
  Moon,
  RotateCcw,
} from "lucide-react";
import { FaGoogle } from "react-icons/fa6";
import { AdminSession } from "@/lib/admin/auth";
import {
  BUILTIN_MARQUEE_MODES,
  resolveModeMeta,
  type MarqueeNotice,
  type MarqueeNoticeColor,
  type MarqueeNoticeDirection,
  type MarqueeNoticeTone,
} from "@/lib/downex/notices";

export interface Machine {
  hwid: string;
  name?: string;
  version: string;
  os: string;
  arch?: string;
  last_seen: number;
  first_seen?: number;
  is_banned: boolean;
  ban_reason?: string;
  last_ip?: string;
  is_connected?: boolean;
  downloads_completed?: number;
  total_bytes?: number;
}

const STORAGE_SESSION_KEY = "downex_admin_session_data";
const STORAGE_TOKEN_KEY = "downex_admin_session_token";
const STORAGE_LAST_ACTIVE_KEY = "downex_last_active";
const SIDEBAR_COLLAPSED_KEY = "downex_admin_sidebar_collapsed";
const STORAGE_UI_STATE_KEY = "downex_admin_ui_state";

interface CustomModeOption {
  label: string;
  color: MarqueeNoticeColor;
}

interface PersistedAdminUiState {
  adminTab?: "CLIENTS" | "NOTICES";
  filterTab?: "ALL" | "ONLINE" | "BANNED";
  searchQuery?: string;
  currentPage?: number;
  noticeText?: string;
  noticeTone?: MarqueeNoticeTone;
  noticeModeLabel?: string;
  noticeModeColor?: MarqueeNoticeColor;
  savedCustomModes?: CustomModeOption[];
  noticeDirection?: MarqueeNoticeDirection;
  noticeShowCountdown?: boolean;
  durationMode?: "preset" | "custom" | "exact";
  presetDurationMs?: number | null;
  customDurationValue?: string;
  customDurationUnit?: "minutes" | "hours" | "days";
  exactEndTime?: string;
  previewDark?: boolean;
  authEmail?: string;
}

const MODE_COLOR_STYLES: Record<
  MarqueeNoticeColor,
  {
    dot: string;
    btnActive: string;
    badge: string;
    previewLight: string;
    previewDark: string;
  }
> = {
  zinc: {
    dot: "bg-zinc-500",
    btnActive: "bg-zinc-900 border-zinc-900 text-white",
    badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
    previewLight: "bg-zinc-100/80 border-zinc-200/90 text-zinc-700",
    previewDark: "bg-zinc-900/75 border-zinc-700/70 text-zinc-200",
  },
  emerald: {
    dot: "bg-emerald-500",
    btnActive: "bg-emerald-600 border-emerald-600 text-white",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    previewLight: "bg-zinc-100/80 border-zinc-200/90 text-zinc-700",
    previewDark: "bg-zinc-900/75 border-zinc-700/70 text-zinc-200",
  },
  rose: {
    dot: "bg-rose-500",
    btnActive: "bg-rose-600 border-rose-600 text-white",
    badge: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    previewLight: "bg-rose-50/80 border-rose-200/80 text-zinc-800",
    previewDark: "bg-rose-950/35 border-rose-800/60 text-zinc-100",
  },
  amber: {
    dot: "bg-amber-500",
    btnActive: "bg-amber-600 border-amber-600 text-white",
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    previewLight: "bg-amber-50/80 border-amber-200/80 text-zinc-800",
    previewDark: "bg-amber-950/30 border-amber-800/60 text-zinc-100",
  },
  sky: {
    dot: "bg-sky-500",
    btnActive: "bg-sky-600 border-sky-600 text-white",
    badge: "bg-sky-500/10 text-sky-700 border-sky-500/30",
    previewLight: "bg-sky-50/75 border-sky-200/80 text-zinc-800",
    previewDark: "bg-sky-950/30 border-sky-800/60 text-zinc-100",
  },
  violet: {
    dot: "bg-violet-500",
    btnActive: "bg-violet-600 border-violet-600 text-white",
    badge: "bg-violet-500/10 text-violet-700 border-violet-500/30",
    previewLight: "bg-violet-50/75 border-violet-200/80 text-zinc-800",
    previewDark: "bg-violet-950/30 border-violet-800/60 text-zinc-100",
  },
  indigo: {
    dot: "bg-indigo-500",
    btnActive: "bg-indigo-600 border-indigo-600 text-white",
    badge: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
    previewLight: "bg-indigo-50/75 border-indigo-200/80 text-zinc-800",
    previewDark: "bg-indigo-950/30 border-indigo-800/60 text-zinc-100",
  },
};

const READY_MARQUEE_TEMPLATES: Array<{
  title: string;
  text: string;
  tone: Exclude<MarqueeNoticeTone, "custom">;
  durationMs: number | null;
  showCountdown: boolean;
}> = [
  {
    title: "Next Update 2d",
    text: "Next update expected in 2 days — faster downloads & UI polish",
    tone: "update",
    durationMs: 2 * 24 * 60 * 60 * 1000,
    showCountdown: true,
  },
  {
    title: "New Version Out",
    text: "New Downex update available — click Check updates in the sidebar",
    tone: "update",
    durationMs: 24 * 60 * 60 * 1000,
    showCountdown: false,
  },
  {
    title: "Maintenance",
    text: "Quick server check in progress — active downloads stay safe",
    tone: "warning",
    durationMs: 2 * 60 * 60 * 1000,
    showCountdown: true,
  },
  {
    title: "Urgent Restart",
    text: "Please restart Downex to apply the latest engine update",
    tone: "alert",
    durationMs: 6 * 60 * 60 * 1000,
    showCountdown: false,
  },
  {
    title: "Speed Tip",
    text: "Tip: Adjust parallel threads in Settings for faster multi-part speeds",
    tone: "tip",
    durationMs: 12 * 60 * 60 * 1000,
    showCountdown: false,
  },
  {
    title: "Queue Info",
    text: "Schedule queued links to start and pause cleanly without supervision",
    tone: "event",
    durationMs: 24 * 60 * 60 * 1000,
    showCountdown: false,
  },
  {
    title: "Official Link",
    text: "Always verify and download Downex only from gauravpatil.site",
    tone: "info",
    durationMs: null,
    showCountdown: false,
  },
  {
    title: "Thank You",
    text: "Thank you for using Downex — more improvements arriving soon",
    tone: "info",
    durationMs: 7 * 24 * 60 * 60 * 1000,
    showCountdown: false,
  },
];

interface DownexAdminClientProps {
  initialSession: AdminSession | null;
  initialMachines?: Machine[];
  initialNotices?: MarqueeNotice[];
  initialTab?: "CLIENTS" | "NOTICES";
}

const NOTICE_DURATION_PRESETS: Array<{ label: string; ms: number | null }> = [
  { label: "30m", ms: 30 * 60 * 1000 },
  { label: "2 Hours", ms: 2 * 60 * 60 * 1000 },
  { label: "6 Hours", ms: 6 * 60 * 60 * 1000 },
  { label: "12 Hours", ms: 12 * 60 * 60 * 1000 },
  { label: "1 Day", ms: 24 * 60 * 60 * 1000 },
  { label: "2 Days", ms: 2 * 24 * 60 * 60 * 1000 },
  { label: "7 Days", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "Until Stopped", ms: null },
];

export default function DownexAdminClient({
  initialSession,
  initialMachines = [],
  initialNotices = [],
  initialTab = "CLIENTS",
}: DownexAdminClientProps) {
  const [session, setSession] = useState<AdminSession | null>(initialSession);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState<boolean>(!initialSession);
  const [adminTab, setAdminTab] = useState<"CLIENTS" | "NOTICES">(initialTab);
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [notices, setNotices] = useState<MarqueeNotice[]>(initialNotices);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "ONLINE" | "BANNED">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [actionBusyHwid, setActionBusyHwid] = useState<string | null>(null);

  // Marquee Notice Composer State
  const [noticeText, setNoticeText] = useState("");
  const [noticeTone, setNoticeTone] = useState<MarqueeNoticeTone>("update");
  const [noticeModeLabel, setNoticeModeLabel] = useState<string>("UPDATE");
  const [noticeModeColor, setNoticeModeColor] = useState<MarqueeNoticeColor>("emerald");
  const [savedCustomModes, setSavedCustomModes] = useState<CustomModeOption[]>([]);
  const [noticeDirection, setNoticeDirection] = useState<MarqueeNoticeDirection>("rtl");
  const [noticeShowCountdown, setNoticeShowCountdown] = useState<boolean>(false);
  const [durationMode, setDurationMode] = useState<"preset" | "custom" | "exact">("preset");
  const [presetDurationMs, setPresetDurationMs] = useState<number | null>(null);
  const [customDurationValue, setCustomDurationValue] = useState<string>("2");
  const [customDurationUnit, setCustomDurationUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [exactEndTime, setExactEndTime] = useState<string>("");
  const [previewDark, setPreviewDark] = useState<boolean>(false);
  const [isSavingNotice, setIsSavingNotice] = useState<boolean>(false);
  const [noticeBusyId, setNoticeBusyId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [copiedHwid, setCopiedHwid] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [signedOutMsg, setSignedOutMsg] = useState(false);

  // Downex PC-App Collapsible Sidebar State + Mobile Drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Single-View Fixed Pagination State (zero layout shake, appears strictly when data overflows UI window)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [maxRowsWithoutPagination, setMaxRowsWithoutPagination] = useState<number>(9);
  const tableViewportRef = useRef<HTMLDivElement>(null);

  // Auth Form State
  const [authStage, setAuthStage] = useState<"LOGIN" | "OTP">("LOGIN");
  const [authEmail, setAuthEmail] = useState<string>("gauravpatil5737@gmail.com");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [authChallengeId, setAuthChallengeId] = useState<string | null>(null);
  const [authMaskedEmail, setAuthMaskedEmail] = useState<string | null>(null);
  const [authExpiresAt, setAuthExpiresAt] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // 6-digit OTP input boxes state & timers
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isOtpSuccess, setIsOtpSuccess] = useState<boolean>(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(3);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Hydration guard so defaults never overwrite stored persistence on mount
  const [isUiStateHydrated, setIsUiStateHydrated] = useState<boolean>(false);
  const prevFilterRef = useRef<{ filterTab: "ALL" | "ONLINE" | "BANNED"; searchQuery: string }>({
    filterTab: "ALL",
    searchQuery: "",
  });

  // Enforce crisp light theme (no theme toggle) + hydrate full persisted admin UI state
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
      document.documentElement.setAttribute("data-admin", "true");
    }

    try {
      const savedSidebar = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (savedSidebar === "true") {
        setIsSidebarCollapsed(true);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get("tab");

      const rawUi = localStorage.getItem(STORAGE_UI_STATE_KEY);
      if (rawUi) {
        const parsed = JSON.parse(rawUi) as PersistedAdminUiState;
        const resolvedTab =
          urlTab === "notices"
            ? "NOTICES"
            : urlTab === "clients"
            ? "CLIENTS"
            : parsed.adminTab === "NOTICES" || parsed.adminTab === "CLIENTS"
            ? parsed.adminTab
            : initialTab;
        setAdminTab(resolvedTab);

        if (parsed.filterTab === "ALL" || parsed.filterTab === "ONLINE" || parsed.filterTab === "BANNED") {
          setFilterTab(parsed.filterTab);
          prevFilterRef.current.filterTab = parsed.filterTab;
        }
        if (typeof parsed.searchQuery === "string") {
          setSearchQuery(parsed.searchQuery);
          prevFilterRef.current.searchQuery = parsed.searchQuery;
        }
        if (typeof parsed.currentPage === "number" && parsed.currentPage >= 1) {
          setCurrentPage(parsed.currentPage);
        }
        if (typeof parsed.noticeText === "string") setNoticeText(parsed.noticeText);
        if (
          parsed.noticeTone === "info" ||
          parsed.noticeTone === "update" ||
          parsed.noticeTone === "alert" ||
          parsed.noticeTone === "tip" ||
          parsed.noticeTone === "warning" ||
          parsed.noticeTone === "event" ||
          parsed.noticeTone === "custom"
        ) {
          setNoticeTone(parsed.noticeTone);
        }
        if (typeof parsed.noticeModeLabel === "string" && parsed.noticeModeLabel) {
          setNoticeModeLabel(parsed.noticeModeLabel);
        }
        if (parsed.noticeModeColor && parsed.noticeModeColor in MODE_COLOR_STYLES) {
          setNoticeModeColor(parsed.noticeModeColor);
        }
        if (Array.isArray(parsed.savedCustomModes)) {
          setSavedCustomModes(
            parsed.savedCustomModes.filter(
              (m): m is CustomModeOption =>
                Boolean(m && typeof m.label === "string" && m.color in MODE_COLOR_STYLES)
            )
          );
        }
        if (parsed.noticeDirection === "ltr" || parsed.noticeDirection === "rtl") {
          setNoticeDirection(parsed.noticeDirection);
        }
        if (typeof parsed.noticeShowCountdown === "boolean") {
          setNoticeShowCountdown(parsed.noticeShowCountdown);
        }
        if (parsed.durationMode === "preset" || parsed.durationMode === "custom" || parsed.durationMode === "exact") {
          setDurationMode(parsed.durationMode);
        }
        if (parsed.presetDurationMs === null || typeof parsed.presetDurationMs === "number") {
          setPresetDurationMs(parsed.presetDurationMs);
        }
        if (typeof parsed.customDurationValue === "string") setCustomDurationValue(parsed.customDurationValue);
        if (parsed.customDurationUnit === "minutes" || parsed.customDurationUnit === "hours" || parsed.customDurationUnit === "days") {
          setCustomDurationUnit(parsed.customDurationUnit);
        }
        if (typeof parsed.exactEndTime === "string") setExactEndTime(parsed.exactEndTime);
        if (typeof parsed.previewDark === "boolean") setPreviewDark(parsed.previewDark);
        if (typeof parsed.authEmail === "string" && parsed.authEmail) setAuthEmail(parsed.authEmail);
      } else if (urlTab === "notices" || urlTab === "clients") {
        setAdminTab(urlTab === "notices" ? "NOTICES" : "CLIENTS");
      }
    } catch {} finally {
      setIsUiStateHydrated(true);
    }
  }, [initialTab]);

  // Persist entire Admin Panel UI state continuously & sync URL tab parameter cleanly
  useEffect(() => {
    if (!isUiStateHydrated || typeof window === "undefined") return;

    try {
      const payload: PersistedAdminUiState = {
        adminTab,
        filterTab,
        searchQuery,
        currentPage,
        noticeText,
        noticeTone,
        noticeModeLabel,
        noticeModeColor,
        savedCustomModes,
        noticeDirection,
        noticeShowCountdown,
        durationMode,
        presetDurationMs,
        customDurationValue,
        customDurationUnit,
        exactEndTime,
        previewDark,
        authEmail,
      };
      localStorage.setItem(STORAGE_UI_STATE_KEY, JSON.stringify(payload));

      const url = new URL(window.location.href);
      const desiredParam = adminTab === "NOTICES" ? "notices" : "clients";
      if (url.searchParams.get("tab") !== desiredParam) {
        url.searchParams.set("tab", desiredParam);
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch {}
  }, [
    isUiStateHydrated,
    adminTab,
    filterTab,
    searchQuery,
    currentPage,
    noticeText,
    noticeTone,
    noticeModeLabel,
    noticeModeColor,
    savedCustomModes,
    noticeDirection,
    noticeShowCountdown,
    durationMode,
    presetDurationMs,
    customDurationValue,
    customDurationUnit,
    exactEndTime,
    previewDark,
    authEmail,
  ]);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  // Downex Keyboard Shortcuts: Ctrl+B / F8 (sidebar), Ctrl+K / '/' (search)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebarCollapse();
      } else if (e.key === "F8") {
        e.preventDefault();
        toggleSidebarCollapse();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") ||
        (e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [toggleSidebarCollapse]);

  // Session Initialization & Sliding Refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("auth_token");
    if (urlToken) {
      localStorage.setItem(STORAGE_TOKEN_KEY, urlToken);
      setToken(urlToken);
      urlParams.delete("auth_token");
      const newQuery = urlParams.toString();
      window.history.replaceState({}, "", window.location.pathname + (newQuery ? `?${newQuery}` : ""));
    }

    const stepParam = urlParams.get("step");
    const challengeParam = urlParams.get("challenge_id");
    const maskedEmailParam = urlParams.get("masked_email");
    const emailParam = urlParams.get("email");

    if (stepParam === "otp" && challengeParam) {
      setAuthStage("OTP");
      setAuthChallengeId(challengeParam);
      if (maskedEmailParam) setAuthMaskedEmail(decodeURIComponent(maskedEmailParam));
      if (emailParam) setAuthEmail(decodeURIComponent(emailParam));
      setAuthExpiresAt(Date.now() + 5 * 60 * 1000);
      setResendCooldown(60);
      urlParams.delete("step");
      urlParams.delete("challenge_id");
      urlParams.delete("masked_email");
      urlParams.delete("email");
      const newQuery = urlParams.toString();
      window.history.replaceState({}, "", window.location.pathname + (newQuery ? `?${newQuery}` : ""));
    }

    if (urlParams.get("unauthorized") === "true") {
      setIsUnauthorized(true);
    }

    const storedToken = urlToken || localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedSessionJson = localStorage.getItem(STORAGE_SESSION_KEY);

    if (storedToken && !token) {
      setToken(storedToken);
    }

    if (initialSession) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(initialSession));
      setIsHydrating(false);
      return;
    }

    let hasLocalSession = false;
    if (storedSessionJson) {
      try {
        const parsed = JSON.parse(storedSessionJson);
        if (parsed && parsed.email && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
          setSession(parsed);
          hasLocalSession = true;
        }
      } catch {}
    }

    const headers: Record<string, string> = {};
    if (storedToken) {
      headers["Authorization"] = `Bearer ${storedToken}`;
    }

    fetch("/api/admin/downex/session", { headers })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Unauthorized");
      })
      .then((data) => {
        if (data.authenticated && data.session) {
          setSession(data.session);
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data.session));
          if (data.token) {
            localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
            setToken(data.token);
          }
        }
      })
      .catch(() => {
        if (!hasLocalSession) {
          setSession(null);
        }
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [initialSession, token]);

  // Fetch Latest Devices
  const fetchMachines = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const activeToken =
        token || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }
      const res = await fetch(`/api/admin/downex/machines?t=${Date.now()}`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const list: Machine[] = data.machines || [];
        setMachines(list);
        setActionFeedback({
          text: `List updated (${list.length} devices).`,
          type: "success",
        });
      }
    } catch {
      setActionFeedback({
        text: "Could not refresh list.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionFeedback(null), 2800);
    }
  }, [session, token]);

  // Live SSE Stream
  useEffect(() => {
    if (!session) return;

    let es: EventSource | null = null;
    try {
      const activeToken =
        token || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TOKEN_KEY) : "");
      const streamUrl = activeToken
        ? `/api/admin/downex/stream?token=${encodeURIComponent(activeToken)}`
        : "/api/admin/downex/stream";
      es = new EventSource(streamUrl);

      es.addEventListener("connected", () => {
        setIsLiveStream(true);
      });

      es.addEventListener("machines", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && Array.isArray(payload.machines)) {
            setMachines(payload.machines);
            setIsLiveStream(true);
          }
        } catch {}
      });

      es.addEventListener("notices", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && Array.isArray(payload.notices)) {
            setNotices(payload.notices);
            setIsLiveStream(true);
          }
        } catch {}
      });

      es.onerror = () => {
        setIsLiveStream(false);
      };
    } catch {}

    return () => {
      if (es) es.close();
    };
  }, [session, token]);

  // Cross-Tab Sync & Activity Tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_SESSION_KEY) {
        if (!e.newValue) {
          setSession(null);
          setToken(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.email) setSession(parsed);
          } catch {}
        }
      } else if (e.key === STORAGE_TOKEN_KEY) {
        setToken(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);

    let lastActiveRecord = 0;
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastActiveRecord > 15000) {
        lastActiveRecord = now;
        try {
          localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, now.toString());
        } catch {}
      }
    };

    window.addEventListener("mousedown", recordActivity);
    window.addEventListener("keydown", recordActivity);
    window.addEventListener("touchstart", recordActivity);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mousedown", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      window.removeEventListener("touchstart", recordActivity);
    };
  }, []);

  // OTP Countdown Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (isVerifyingOtp || isOtpSuccess) return;
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const updated = [...digits];
      updated[index] = "";
      setDigits(updated);
      return;
    }
    const lastChar = cleanValue.slice(-1);
    const updated = [...digits];
    updated[index] = lastChar;
    setDigits(updated);
    if (index < 5 && lastChar) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOtpSuccess) return;
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isVerifyingOtp || isOtpSuccess) return;
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;
    const updated = [...digits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || "";
    }
    setDigits(updated);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = authEmail.trim();
    if (!targetEmail) {
      setAuthError("Please enter your email address.");
      return;
    }
    setIsSendingOtp(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await fetch("/api/downex/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Could not send code.");
        return;
      }
      setAuthChallengeId(data.challengeId);
      setAuthMaskedEmail(data.maskedEmail);
      setAuthExpiresAt(data.expiresAt || Date.now() + 5 * 60 * 1000);
      setResendCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      setRemainingAttempts(3);
      setAuthStage("OTP");
      setTimeout(() => inputRefs.current[0]?.focus(), 60);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifyingOtp || isOtpSuccess || !authChallengeId) return;
    const otpCode = digits.join("").trim();
    if (otpCode.length !== 6) {
      setAuthError("Please enter all 6 digits.");
      triggerShake();
      return;
    }
    setIsVerifyingOtp(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/downex/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: authChallengeId, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || "Incorrect code.");
        triggerShake();
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      setIsOtpSuccess(true);
      setAuthSuccess("Verified. Opening admin...");
      if (typeof window !== "undefined") {
        if (data.token) {
          localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
          setToken(data.token);
        }
        if (data.session) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data.session));
        }
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, Date.now().toString());
      }
      setTimeout(() => {
        setSession(data.session);
        setIsOtpSuccess(false);
        setAuthStage("LOGIN");
      }, 400);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Verification failed");
      triggerShake();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleLogin = () => {
    const returnUrl = typeof window !== "undefined" ? window.location.href : "/admin";
    window.location.href = `/api/admin/auth/google?target=downex&returnTo=${encodeURIComponent(returnUrl)}`;
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY);
      }
      await Promise.all([
        fetch("/api/admin/downex/session", { method: "DELETE" }).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
      document.cookie = "downex_admin_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "admin_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      if (typeof window !== "undefined" && window.location.hostname.endsWith(".gauravpatil.site")) {
        document.cookie =
          "downex_admin_session=; domain=.gauravpatil.site; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie =
          "admin_session=; domain=.gauravpatil.site; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      }
      setSession(null);
      setToken(null);
      setSignedOutMsg(true);
      setAuthStage("LOGIN");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDirective = async (hwid: string, action: "BAN" | "UNBAN") => {
    setActionBusyHwid(hwid);
    setActionFeedback(null);
    try {
      const activeToken =
        token || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }
      const res = await fetch("/api/admin/downex/directive", {
        method: "POST",
        headers,
        body: JSON.stringify({
          hwid,
          action,
          reason:
            action === "BAN"
              ? "This is hardware patched. Formatting System and reinstalling App will not bypass this."
              : undefined,
        }),
      });

      if (res.ok) {
        setActionFeedback({
          text: `${hwid} ${action === "BAN" ? "banned" : "unbanned"}.`,
          type: "success",
        });
        setMachines((prev) =>
          prev.map((m) =>
            m.hwid === hwid
              ? {
                  ...m,
                  is_banned: action === "BAN",
                  ban_reason: action === "BAN" ? "Banned by Admin" : undefined,
                }
              : m
          )
        );
      } else {
        const err = await res.json();
        setActionFeedback({
          text: `Failed: ${err.error || "Rejected"}`,
          type: "error",
        });
      }
    } catch (err: unknown) {
      setActionFeedback({
        text: err instanceof Error ? err.message : "Network error",
        type: "error",
      });
    } finally {
      setActionBusyHwid(null);
      setTimeout(() => setActionFeedback(null), 3200);
    }
  };

  const onlineMachinesCount = useMemo(() => {
    const now = Date.now();
    return machines.filter(
      (m) => !m.is_banned && (m.is_connected === true || now - (m.last_seen || 0) < 300000)
    ).length;
  }, [machines]);

  const bannedMachinesCount = useMemo(() => {
    return machines.filter((m) => m.is_banned).length;
  }, [machines]);

  const filteredMachines = useMemo(() => {
    const now = Date.now();
    return machines.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const safeHwid = (m.hwid || "").toLowerCase();
      const safeVersion = (m.version || "").toLowerCase();
      const matchesSearch =
        !q ||
        safeHwid.includes(q) ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.os && m.os.toLowerCase().includes(q)) ||
        (m.last_ip && m.last_ip.toLowerCase().includes(q)) ||
        safeVersion.includes(q);

      if (!matchesSearch) return false;
      if (filterTab === "ONLINE") {
        return !m.is_banned && (m.is_connected === true || now - (m.last_seen || 0) < 300000);
      }
      if (filterTab === "BANNED") {
        return m.is_banned;
      }
      return true;
    });
  }, [machines, searchQuery, filterTab]);

  // Dynamically measure fixed card height to show pagination strictly when data exceeds one screen
  useEffect(() => {
    const el = tableViewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const computeFit = () => {
      const rect = el.getBoundingClientRect();
      const isDesktop = typeof window !== "undefined" ? window.innerWidth >= 768 : true;
      const headerHeight = isDesktop ? 37 : 0;
      const rowHeight = isDesktop ? 49 : 85;
      const footerHeight = 44;

      const usableFull = Math.max(rowHeight, rect.height - headerHeight - 2);
      const nextMaxWithoutFooter = Math.max(4, Math.floor(usableFull / rowHeight));

      const usableWithFooter = Math.max(rowHeight, rect.height - headerHeight - footerHeight - 2);
      const nextWithFooter = Math.max(3, Math.floor(usableWithFooter / rowHeight));

      setMaxRowsWithoutPagination((prev) =>
        prev !== nextMaxWithoutFooter ? nextMaxWithoutFooter : prev
      );
      setPageSize((prev) => (prev !== nextWithFooter ? nextWithFooter : prev));
    };

    computeFit();
    const ro = new ResizeObserver(computeFit);
    ro.observe(el);
    window.addEventListener("resize", computeFit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeFit);
    };
  }, [session, adminTab]);

  const showPagination = filteredMachines.length > maxRowsWithoutPagination;
  const activePageSize = showPagination ? pageSize : Math.max(1, filteredMachines.length);
  const totalPages = showPagination
    ? Math.max(1, Math.ceil(filteredMachines.length / activePageSize))
    : 1;
  const safeCurrentPage = showPagination ? Math.min(currentPage, totalPages) : 1;

  useEffect(() => {
    if (isUiStateHydrated && showPagination && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [isUiStateHydrated, showPagination, currentPage, totalPages]);

  useEffect(() => {
    if (!isUiStateHydrated) return;
    if (
      prevFilterRef.current.filterTab !== filterTab ||
      prevFilterRef.current.searchQuery !== searchQuery
    ) {
      prevFilterRef.current = { filterTab, searchQuery };
      setCurrentPage(1);
    }
  }, [isUiStateHydrated, filterTab, searchQuery]);

  const paginatedMachines = useMemo(() => {
    if (!showPagination) return filteredMachines;
    const start = (safeCurrentPage - 1) * activePageSize;
    return filteredMachines.slice(start, start + activePageSize);
  }, [filteredMachines, showPagination, safeCurrentPage, activePageSize]);

  const dynamicPageNumbers = useMemo(() => {
    const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) pages.push(p);
      return pages;
    }

    pages.push(1);
    const windowStart = Math.max(2, safeCurrentPage - 1);
    const windowEnd = Math.min(totalPages - 1, safeCurrentPage + 1);

    if (windowStart > 2) pages.push("ellipsis-left");
    for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
    if (windowEnd < totalPages - 1) pages.push("ellipsis-right");
    pages.push(totalPages);

    return pages;
  }, [totalPages, safeCurrentPage]);

  const displayAdminName = useMemo(() => {
    const rawName = (session?.name || "").trim();
    if (rawName && !rawName.includes("@")) return rawName;
    const rawEmail = (session?.email || "").trim();
    if (!rawEmail) return "Gaurav Patil";
    if (rawEmail.toLowerCase().includes("gauravpatil")) return "Gaurav Patil";
    const localPart = rawEmail.split("@")[0].replace(/[0-9._-]+/g, " ").trim();
    if (!localPart) return "Admin";
    return localPart.replace(/\b\w/g, (c) => c.toUpperCase());
  }, [session?.name, session?.email]);

  const displayAdminInitials = useMemo(() => {
    const parts = displayAdminName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayAdminName.slice(0, 2).toUpperCase() || "AD";
  }, [displayAdminName]);

  const activeNoticesCount = useMemo(() => {
    return notices.filter(
      (n) => n.active && (n.expiresAt === null || n.expiresAt > nowTick)
    ).length;
  }, [notices, nowTick]);

  const computeResolvedExpiresAt = useCallback((): number | null => {
    const now = Date.now();
    if (durationMode === "preset") {
      return presetDurationMs && presetDurationMs > 0 ? now + presetDurationMs : null;
    }
    if (durationMode === "custom") {
      const val = Math.max(1, Number(customDurationValue) || 1);
      const mult =
        customDurationUnit === "minutes"
          ? 60 * 1000
          : customDurationUnit === "hours"
          ? 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
      return now + val * mult;
    }
    if (durationMode === "exact" && exactEndTime) {
      const parsed = new Date(exactEndTime).getTime();
      if (Number.isFinite(parsed) && parsed > now) return parsed;
    }
    return null;
  }, [durationMode, presetDurationMs, customDurationValue, customDurationUnit, exactEndTime]);

  const formatRemainingCountdown = useCallback((expiresAt: number | null, refNow: number): string => {
    if (expiresAt === null) return "Until Stopped";
    const diff = expiresAt - refNow;
    if (diff <= 0) return "Expired";
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${Math.max(1, mins)}m left`;
  }, []);

  const handleCreateNotice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = noticeText.trim();
    if (!cleanText || isSavingNotice) return;

    const resolvedExpiresAt = computeResolvedExpiresAt();
    if (durationMode === "exact" && resolvedExpiresAt === null) {
      setActionFeedback({ text: "Pick a future end date and time.", type: "error" });
      setTimeout(() => setActionFeedback(null), 2800);
      return;
    }

    setIsSavingNotice(true);
    try {
      const activeToken =
        token || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      const resolvedMeta = resolveModeMeta({
        tone: noticeTone,
        modeLabel: noticeModeLabel,
        modeColor: noticeModeColor,
      });

      const res = await fetch("/api/admin/downex/notices", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: cleanText,
          tone: noticeTone,
          modeLabel: resolvedMeta.label,
          modeColor: resolvedMeta.color,
          direction: noticeDirection,
          showCountdown: noticeShowCountdown,
          expiresAt: resolvedExpiresAt,
        }),
      });
      const data = await res.json();
      if (res.ok && data.notice) {
        setNotices((prev) => [data.notice, ...prev.filter((n) => n.id !== data.notice.id)]);
        setNoticeText("");
        setActionFeedback({ text: "Live notice sent to all Downex apps.", type: "success" });
      } else {
        setActionFeedback({ text: data.error || "Could not send notice.", type: "error" });
      }
    } catch {
      setActionFeedback({ text: "Network error sending notice.", type: "error" });
    } finally {
      setIsSavingNotice(false);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleToggleNoticeActive = async (notice: MarqueeNotice) => {
    if (noticeBusyId) return;
    setNoticeBusyId(notice.id);
    try {
      const activeToken =
        token || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      const res = await fetch("/api/admin/downex/notices", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: notice.id, active: !notice.active }),
      });
      const data = await res.json();
      if (res.ok && data.notice) {
        setNotices((prev) => prev.map((n) => (n.id === notice.id ? data.notice : n)));
      }
    } finally {
      setNoticeBusyId(null);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (noticeBusyId) return;
    setNoticeBusyId(id);
    try {
      const activeToken =
        token || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);
      const headers: Record<string, string> = {};
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

      const res = await fetch(`/api/admin/downex/notices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
        setActionFeedback({ text: "Notice removed.", type: "info" });
        setTimeout(() => setActionFeedback(null), 2500);
      }
    } finally {
      setNoticeBusyId(null);
    }
  };

  const formatIstTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Never";
    try {
      const d = new Date(timestamp);
      const timeStr = d.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const todayIst = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
      const targetIst = d.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
      if (todayIst === targetIst) return `${timeStr} IST`;

      const dateStr = d.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
      });
      return `${dateStr}, ${timeStr} IST`;
    } catch {
      return "Never";
    }
  };

  // Shared 1:1 Downex Window Top Header
  const renderTopHeader = (isAuthenticatedView: boolean) => (
    <header className="relative z-40 flex items-center justify-between h-10 px-3.5 bg-white/95 border-b border-zinc-200/80 select-none backdrop-blur-md shrink-0 w-full">
      <div className="flex items-center gap-2 select-none min-w-0">
        {isAuthenticatedView && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-1 -ml-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
        <img
          src="/brand/downex-logo.png"
          alt="Downex"
          className="w-[18px] h-[18px] shrink-0 object-contain pointer-events-none"
        />
        <span className="font-extrabold text-[13.5px] tracking-tight text-zinc-900 pointer-events-none leading-none">
          downex
        </span>
        <span className="text-[9.5px] font-bold text-emerald-600 tracking-[0.14em] uppercase font-mono-tabular pointer-events-none leading-none">
          admin
        </span>

        {isAuthenticatedView && (
          <>
            <span className="hidden sm:inline-block h-3.5 w-px bg-zinc-200 mx-1" />
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-mono-tabular font-semibold uppercase tracking-wider rounded ${
                isLiveStream
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-zinc-100 text-zinc-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveStream ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                }`}
              />
              <span>{isLiveStream ? "Live" : "Connecting"}</span>
            </div>
          </>
        )}
      </div>

      {!isAuthenticatedView && (
        <span className="text-[10px] font-mono-tabular text-zinc-400 uppercase tracking-wider">
          Private Access
        </span>
      )}
    </header>
  );

  // Hydrating Screen
  if (isHydrating && !session) {
    return (
      <div className="h-screen w-screen flex flex-col justify-between bg-white text-zinc-900 select-none overflow-hidden font-sans">
        {renderTopHeader(false)}

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="flex items-center gap-2.5 font-mono-tabular text-xs text-zinc-500 tracking-wider">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Checking session...</span>
          </div>
        </main>

        <footer className="h-9 px-6 flex items-center justify-center border-t border-zinc-200/80 text-[10px] font-mono-tabular text-zinc-400">
          Downex Admin &bull; 2026
        </footer>
      </div>
    );
  }

  // Unauthenticated: Clean Sign-In & OTP View
  if (!session) {
    const otpSecondsLeft = authExpiresAt
      ? Math.max(0, Math.ceil((authExpiresAt - nowTick) / 1000))
      : null;

    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-[#FAFAFA] text-zinc-900 select-none font-sans">
        {renderTopHeader(false)}

        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono-tabular text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
                  {authStage === "LOGIN" ? "Downex Admin" : "Verification"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-sans text-zinc-900 tracking-[-0.03em]">
                {authStage === "LOGIN" ? "Sign in to Downex Admin." : "Enter Code."}
              </h1>
              <p className="text-xs text-zinc-600 font-sans leading-relaxed">
                {authStage === "LOGIN"
                  ? "Only authorized admin accounts can sign in."
                  : `A 6-digit code was sent to ${authMaskedEmail || "your email"}.`}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {signedOutMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono-tabular text-[11px] font-semibold">
                      Signed out successfully.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignedOutMsg(false)}
                    className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isUnauthorized && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="font-mono-tabular text-[11px] font-semibold">
                      Access denied. Unauthorized email.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUnauthorized(false)}
                    className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono-tabular text-[11px] leading-relaxed">{authError}</p>
                      {authStage === "OTP" && remainingAttempts !== null && remainingAttempts > 0 && (
                        <p className="font-mono-tabular text-[10px] text-rose-600 mt-0.5">
                          {remainingAttempts} of 3 attempts left.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthError(null)}
                    className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <p className="font-mono-tabular text-[11px] font-semibold">{authSuccess}</p>
                </div>
              )}

              {authStage === "LOGIN" ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black transition-all font-sans text-xs font-semibold flex items-center justify-center gap-2.5 cursor-pointer shadow-sm rounded-lg active:scale-[0.98]"
                  >
                    <FaGoogle className="w-4 h-4 text-[#EA4335]" />
                    <span>Continue with Google</span>
                  </button>

                  <p className="text-[11px] text-zinc-500 text-center pt-1 leading-relaxed">
                    By signing in you agree to Downex{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-zinc-300 hover:text-zinc-900 underline-offset-2"
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-zinc-300 hover:text-zinc-900 underline-offset-2"
                    >
                      Policies
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`flex justify-between items-center gap-1.5 sm:gap-2 my-2 ${
                      isShaking ? "animate-shake" : ""
                    }`}
                  >
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        aria-label={`Digit ${idx + 1} of 6`}
                        disabled={isVerifyingOtp || isOtpSuccess}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className={`w-10 h-12 sm:w-11 sm:h-12 text-center font-mono-tabular text-lg sm:text-xl font-bold rounded-lg border transition-all outline-none ${
                          digit
                            ? "border-emerald-500 bg-emerald-50/40 text-zinc-900 shadow-sm"
                            : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400"
                        } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isVerifyingOtp || isOtpSuccess || digits.join("").length !== 6}
                    className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black disabled:opacity-40 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all rounded-lg cursor-pointer shadow-sm"
                  >
                    {isOtpSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified...</span>
                      </>
                    ) : isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking code...</span>
                      </>
                    ) : (
                      <span>Verify &amp; Continue &rarr;</span>
                    )}
                  </button>

                  <div className="pt-2 flex items-center justify-between border-t border-zinc-100 text-[11px] font-mono-tabular">
                    <span className="text-zinc-500">
                      {otpSecondsLeft !== null && otpSecondsLeft > 0
                        ? `Expires in ${Math.floor(otpSecondsLeft / 60)}:${(otpSecondsLeft % 60)
                            .toString()
                            .padStart(2, "0")}`
                        : "Code expired"}
                    </span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={resendCooldown > 0 || isSendingOtp}
                      className={`font-semibold transition-colors ${
                        resendCooldown > 0
                          ? "text-zinc-400 cursor-not-allowed"
                          : "text-emerald-600 hover:underline cursor-pointer"
                      }`}
                    >
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend code"}
                    </button>
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStage("LOGIN");
                        setAuthError(null);
                      }}
                      className="text-[11px] font-mono-tabular text-zinc-500 hover:text-zinc-900 cursor-pointer"
                    >
                      &larr; Back to sign in
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="h-9 px-6 flex items-center justify-center border-t border-zinc-200/80 text-[10.5px] font-mono-tabular text-zinc-400 bg-white">
          Downex Admin &bull; 2026
        </footer>
      </div>
    );
  }

  // Left Sidebar Content: Client List at top, Admin Email + Sign Out anchored cleanly at bottom-left
  const renderSidebarContent = (collapsed: boolean, onCloseMobile?: () => void) => (
    <>
      <div className="flex flex-col overflow-x-hidden pt-2.5">
        <nav className={collapsed ? "px-2 space-y-1" : "px-2.5 space-y-0.5"}>
          <button
            type="button"
            title={collapsed ? `Client List (${machines.length})` : undefined}
            onClick={() => {
              if (adminTab === "CLIENTS") {
                setFilterTab("ALL");
              } else {
                setAdminTab("CLIENTS");
              }
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11.5px] font-mono-tabular transition-colors text-left rounded cursor-pointer ${
              collapsed ? "w-10 h-10 mx-auto justify-center p-0 relative rounded-md" : ""
            } ${
              adminTab === "CLIENTS"
                ? "bg-black text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60 font-medium"
            }`}
          >
            <div className={`flex items-center ${collapsed ? "justify-center relative" : "gap-2.5 min-w-0"}`}>
              <Laptop size={15} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">Client List</span>}

              {collapsed && machines.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-3.5 px-0.5 rounded-full text-[8.5px] font-mono-tabular font-bold flex items-center justify-center leading-none bg-zinc-100 text-zinc-900 shadow-sm pointer-events-none">
                  {machines.length > 99 ? "99+" : machines.length}
                </span>
              )}
            </div>

            {!collapsed && (
              <span
                className={`px-1.5 py-0.5 text-[9.5px] rounded font-mono-tabular ${
                  adminTab === "CLIENTS"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200/70 text-zinc-600"
                }`}
              >
                {machines.length}
              </span>
            )}
          </button>

          <button
            type="button"
            title={collapsed ? `Marquee Notices (${activeNoticesCount})` : undefined}
            onClick={() => {
              setAdminTab("NOTICES");
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11.5px] font-mono-tabular transition-colors text-left rounded cursor-pointer ${
              collapsed ? "w-10 h-10 mx-auto justify-center p-0 relative rounded-md" : ""
            } ${
              adminTab === "NOTICES"
                ? "bg-black text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60 font-medium"
            }`}
          >
            <div className={`flex items-center ${collapsed ? "justify-center relative" : "gap-2.5 min-w-0"}`}>
              <Megaphone size={15} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">Marquee Notices</span>}

              {collapsed && activeNoticesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-3.5 px-0.5 rounded-full text-[8.5px] font-mono-tabular font-bold flex items-center justify-center leading-none bg-emerald-500 text-white shadow-sm pointer-events-none">
                  {activeNoticesCount > 99 ? "99+" : activeNoticesCount}
                </span>
              )}
            </div>

            {!collapsed && (
              <span
                className={`px-1.5 py-0.5 text-[9.5px] rounded font-mono-tabular ${
                  adminTab === "NOTICES"
                    ? "bg-white/20 text-white"
                    : activeNoticesCount > 0
                    ? "bg-emerald-500/15 text-emerald-700 font-semibold"
                    : "bg-zinc-200/70 text-zinc-600"
                }`}
              >
                {activeNoticesCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Bottom-Left Console Account & Sign Out */}
      <div className="shrink-0 border-t border-zinc-200/80 select-none">
        {collapsed ? (
          <div className="p-2 flex flex-col items-center gap-1.5">
            <div
              title={displayAdminName}
              className="w-10 h-6 flex items-center justify-center rounded bg-white border border-zinc-200 text-[10px] font-mono-tabular font-bold text-zinc-700"
            >
              {displayAdminInitials}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              title={isSigningOut ? "Signing out..." : "Sign Out"}
              aria-label={isSigningOut ? "Signing out..." : "Sign Out"}
              className={`w-10 h-10 flex items-center justify-center rounded-md border transition-all cursor-pointer shadow-sm active:scale-[0.96] ${
                isSigningOut
                  ? "bg-zinc-100 border-zinc-200 text-zinc-500 cursor-wait"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              {isSigningOut ? (
                <RefreshCw size={15} className="animate-spin text-rose-500" />
              ) : (
                <LogOut size={15} strokeWidth={2} />
              )}
            </button>
          </div>
        ) : (
          <div className="p-2.5 space-y-2">
            <div
              title={session?.email || displayAdminName}
              className="px-1 text-[11.5px] font-mono-tabular font-semibold text-zinc-800 whitespace-nowrap"
            >
              {displayAdminName}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`w-full h-7 px-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] font-mono-tabular font-semibold rounded-md border transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                isSigningOut
                  ? "bg-zinc-100 border-zinc-200 text-zinc-500 cursor-wait"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              {isSigningOut ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-rose-500" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );

  // Authenticated Workspace
  return (
    <div className="h-screen w-screen flex flex-col bg-white text-zinc-900 select-none overflow-hidden font-sans">
      {renderTopHeader(true)}

      {/* Signing Out Transition Overlay */}
      {isSigningOut && (
        <div className="fixed inset-0 top-10 z-50 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
          <div className="px-4 py-2.5 rounded-lg border border-zinc-200 bg-white shadow-sm flex items-center gap-2.5 text-xs font-mono-tabular text-zinc-700">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
            <span>Signing out...</span>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-10 z-50 flex md:hidden">
          <div
            className="fixed inset-0 top-10 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-[210px] h-full bg-[#FAFAFA] border-r border-zinc-200 flex flex-col justify-between shadow-lg">
            {renderSidebarContent(false, () => setIsMobileMenuOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Two-Column Body */}
      <div className="flex-1 flex relative min-h-0">
        {/* Left Sidebar: Client List + Bottom Console Account/Sign Out */}
        <aside
          className={`hidden md:flex relative z-30 h-full flex-col justify-between select-none border-r shrink-0 transition-all duration-300 ease-in-out bg-[#FAFAFA] border-zinc-200 text-zinc-900 ${
            isSidebarCollapsed ? "w-[64px]" : "w-[196px]"
          }`}
        >
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            aria-label={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            className="absolute -right-2.5 top-[25px] -translate-y-1/2 z-40 w-5 h-5 rounded-full bg-white border border-zinc-200/90 shadow-sm hover:shadow-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 active:scale-90 hover:scale-110 transition-all duration-200 ease-out cursor-pointer"
          >
            <ChevronLeft
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isSidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>

          {renderSidebarContent(isSidebarCollapsed)}
        </aside>

        {/* Right Main Area */}
        <main className="relative flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-white">
          {/* Floating Notice Toast (zero layout shift) */}
          {actionFeedback && (
            <div
              className={`absolute top-14 right-4 z-40 px-3 py-2 rounded-lg border shadow-md text-xs flex items-center gap-2.5 ${
                actionFeedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : actionFeedback.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700"
              }`}
            >
              <span className="font-mono-tabular text-[11px]">{actionFeedback.text}</span>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="p-0.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {adminTab === "CLIENTS" ? (
            <>
              {/* Top Control Bar: Search, All/Online/Banned Filters, and Single Refresh Button */}
              <div className="px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-zinc-200/80 shrink-0 gap-2.5">
            {/* Search Input (Downex style) */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                  isSearchFocused ? "text-emerald-600" : "text-zinc-400"
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search ID... (Ctrl+K)"
                aria-label="Search ID"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (searchQuery) {
                      setSearchQuery("");
                    } else {
                      searchInputRef.current?.blur();
                    }
                  }
                }}
                className={`w-full h-8 px-3 py-1.5 pl-8 pr-16 text-xs font-mono-tabular rounded-lg transition-all placeholder:text-zinc-400 focus:outline-none border ${
                  isSearchFocused
                    ? "ring-2 ring-emerald-500/30 bg-white border-emerald-500/80"
                    : "bg-zinc-100 border-transparent hover:border-zinc-300"
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block text-[9.5px] font-mono-tabular px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-500 border border-zinc-300/60 select-none">
                    Ctrl+K
                  </kbd>
                )}
              </div>
            </div>

            {/* Right Controls: Filters (All / Online / Banned) + One Refresh Button */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-1 font-mono-tabular text-[10.5px]">
                <button
                  type="button"
                  onClick={() => setFilterTab("ALL")}
                  className={`h-8 px-3 font-semibold uppercase rounded-md transition-colors cursor-pointer ${
                    filterTab === "ALL"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                  }`}
                >
                  All ({machines.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("ONLINE")}
                  className={`h-8 px-3 font-semibold uppercase rounded-md transition-colors cursor-pointer ${
                    filterTab === "ONLINE"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                  }`}
                >
                  Online ({onlineMachinesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("BANNED")}
                  className={`h-8 px-3 font-semibold uppercase rounded-md transition-colors cursor-pointer ${
                    filterTab === "BANNED"
                      ? "bg-rose-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                  }`}
                >
                  Banned ({bannedMachinesCount})
                </button>
              </div>

              <button
                type="button"
                onClick={fetchMachines}
                disabled={isLoading}
                className="h-8 px-3 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-mono-tabular text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
                <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Client Table Area (Single Fixed View + Pure Dynamic Pagination when data overflows) */}
          <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
            <div
              ref={tableViewportRef}
              className="flex-1 min-h-0 flex flex-col border border-zinc-200 rounded-lg bg-white overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-hidden">
                {filteredMachines.length === 0 ? (
                  <div className="h-full px-4 flex items-center justify-center text-center font-mono-tabular text-xs text-zinc-400">
                    {isLoading ? "Loading devices..." : "No devices found."}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table (4 Symmetric Columns: ID left-aligned, 3 equal-width centered columns) */}
                    <div className="hidden md:block h-full overflow-x-auto overflow-y-hidden">
                      <table className="w-full table-fixed border-collapse">
                        <thead>
                          <tr className="h-[37px] border-b border-zinc-200 bg-[#FAFAFA] font-mono-tabular text-[10px] text-zinc-500 uppercase tracking-wider">
                            <th className="w-[34%] px-4 font-semibold text-left">ID</th>
                            <th className="w-[22%] px-4 font-semibold text-center">Last Active</th>
                            <th className="w-[22%] px-4 font-semibold text-center">Status</th>
                            <th className="w-[22%] px-4 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-xs">
                          {paginatedMachines.map((m) => {
                            const timeDiffSec = Math.floor((Date.now() - (m.last_seen || 0)) / 1000);
                            const isOnline =
                              !m.is_banned && (m.is_connected === true || timeDiffSec < 300);
                            const isBusy = actionBusyHwid === m.hwid;
                            const isCopied = copiedHwid === m.hwid;

                            return (
                              <tr key={m.hwid} className="h-[49px] hover:bg-zinc-50/80 transition-colors">
                                <td className="px-4 text-left">
                                  <div className="flex items-center gap-2 font-mono-tabular text-xs font-semibold text-zinc-900">
                                    <span>{m.hwid}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(m.hwid);
                                        setCopiedHwid(m.hwid);
                                        setTimeout(() => setCopiedHwid(null), 1500);
                                      }}
                                      className="p-1 rounded hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
                                      title="Copy ID"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                <td
                                  className="px-4 text-center text-zinc-600 font-mono-tabular text-xs whitespace-nowrap"
                                  title={
                                    m.last_seen
                                      ? new Date(m.last_seen).toLocaleString("en-US", {
                                          timeZone: "Asia/Kolkata",
                                          hour12: true,
                                        }) + " IST"
                                      : "Never"
                                  }
                                >
                                  {formatIstTimestamp(m.last_seen)}
                                </td>

                                <td className="px-4 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center gap-1.5 px-2 py-0.5 text-[9.5px] font-mono-tabular font-bold uppercase rounded border ${
                                      m.is_banned
                                        ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                        : isOnline
                                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                                    }`}
                                  >
                                    {isOnline && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    )}
                                    <span>
                                      {m.is_banned ? "BANNED" : isOnline ? "ONLINE" : "OFFLINE"}
                                    </span>
                                  </span>
                                </td>

                                <td className="px-4 text-center">
                                  {m.is_banned ? (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleDirective(m.hwid, "UNBAN")}
                                      className="h-7 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-500/30 font-mono-tabular text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      <Unlock className="w-3 h-3" />
                                      <span>{isBusy ? "Working..." : "UNBAN"}</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleDirective(m.hwid, "BAN")}
                                      className="h-7 px-3 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-mono-tabular text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      <ShieldAlert className="w-3 h-3" />
                                      <span>{isBusy ? "Working..." : "BAN"}</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List (< md) */}
                    <div className="md:hidden h-full overflow-hidden divide-y divide-zinc-100">
                      {paginatedMachines.map((m) => {
                        const timeDiffSec = Math.floor((Date.now() - (m.last_seen || 0)) / 1000);
                        const isOnline =
                          !m.is_banned && (m.is_connected === true || timeDiffSec < 300);
                        const isBusy = actionBusyHwid === m.hwid;
                        const isCopied = copiedHwid === m.hwid;

                        return (
                          <div key={m.hwid} className="h-[85px] px-3.5 py-2.5 flex flex-col justify-between bg-white">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-mono-tabular text-xs font-semibold text-zinc-900 min-w-0">
                                <span className="truncate">{m.hwid}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(m.hwid);
                                    setCopiedHwid(m.hwid);
                                    setTimeout(() => setCopiedHwid(null), 1500);
                                  }}
                                  className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 shrink-0 cursor-pointer"
                                  title="Copy ID"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9.5px] font-mono-tabular font-bold uppercase rounded border shrink-0 ${
                                  m.is_banned
                                    ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                    : isOnline
                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                    : "bg-zinc-100 text-zinc-500 border-zinc-200"
                                }`}
                              >
                                {isOnline && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                                <span>{m.is_banned ? "BANNED" : isOnline ? "ONLINE" : "OFFLINE"}</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono-tabular text-zinc-500">
                                {formatIstTimestamp(m.last_seen)}
                              </span>
                              {m.is_banned ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDirective(m.hwid, "UNBAN")}
                                  className="h-7 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 font-mono-tabular text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>{isBusy ? "Working..." : "UNBAN"}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDirective(m.hwid, "BAN")}
                                  className="h-7 px-3 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-mono-tabular text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>{isBusy ? "Working..." : "BAN"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Pure Dynamic Pagination Bar (shown strictly when data exceeds the UI window) */}
              {showPagination && (
                <div className="h-11 shrink-0 border-t border-zinc-200 bg-[#FAFAFA] px-4 flex items-center justify-between gap-3 font-mono-tabular text-[11px] text-zinc-500 select-none">
                  <span className="tabular-nums whitespace-nowrap">
                    {`Showing ${(safeCurrentPage - 1) * activePageSize + 1}-${Math.min(
                      safeCurrentPage * activePageSize,
                      filteredMachines.length
                    )} of ${filteredMachines.length}`}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={safeCurrentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {dynamicPageNumbers.map((entry, idx) =>
                      typeof entry === "string" ? (
                        <span
                          key={`${entry}-${idx}`}
                          className="h-7 min-w-[24px] inline-flex items-center justify-center text-zinc-400 text-[11px]"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => setCurrentPage(entry)}
                          className={`h-7 min-w-[28px] px-2 inline-flex items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums transition-colors cursor-pointer ${
                            safeCurrentPage === entry
                              ? "bg-zinc-900 border-zinc-900 text-white"
                              : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {entry}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
            </>
          ) : (() => {
            const previewMeta = resolveModeMeta({
              tone: noticeTone,
              modeLabel: noticeModeLabel,
              modeColor: noticeModeColor,
            });
            const previewStyle = MODE_COLOR_STYLES[previewMeta.color];

            return (
            <div className="flex-1 min-h-0 flex flex-col p-4 gap-2.5 overflow-hidden">
              {/* Live Titlebar Glass Preview */}
              <div className="shrink-0 border border-zinc-200 rounded-lg bg-[#FAFAFA] p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-mono-tabular font-semibold uppercase tracking-wider text-zinc-500">
                    Titlebar Live Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewDark((d) => !d)}
                    className="h-6 px-2.5 rounded border border-zinc-200 bg-white hover:bg-zinc-100 text-[10.5px] font-mono-tabular font-semibold text-zinc-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {previewDark ? (
                      <>
                        <Moon className="w-3 h-3 text-indigo-500" />
                        <span>Dark Theme</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Light Theme</span>
                      </>
                    )}
                  </button>
                </div>

                <div
                  className={`h-9 px-3 rounded-md border flex items-center justify-between gap-3 transition-colors ${
                    previewDark
                      ? "bg-zinc-950 border-zinc-800 text-zinc-100"
                      : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    <span className="font-extrabold text-[13px] tracking-tight leading-none">
                      downex
                    </span>
                    <span
                      className={`text-[9px] font-bold tracking-[0.14em] uppercase font-mono-tabular leading-none ${
                        previewDark ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    >
                      download manager
                    </span>
                  </div>

                  {/* Frosted Glass Marquee Capsule */}
                  <div className="flex-1 min-w-0 flex justify-center px-2">
                    <div
                      className={`downex-marquee-group relative h-[24px] w-full max-w-[400px] rounded-full border backdrop-blur-md overflow-hidden flex items-center transition-colors ${
                        previewDark ? previewStyle.previewDark : previewStyle.previewLight
                      }`}
                    >
                      <div className="downex-marquee-track relative w-full h-full overflow-hidden">
                        <div
                          key={`${noticeDirection}-${noticeTone}-${previewMeta.label}-${previewMeta.color}-${noticeText || "sample"}`}
                          style={{ animationDuration: "10s", animationIterationCount: "infinite" }}
                          className={`absolute inset-y-0 flex items-center whitespace-nowrap gap-1.5 text-[11px] leading-none font-medium ${
                            noticeDirection === "ltr"
                              ? "downex-marquee-item-ltr"
                              : "downex-marquee-item-rtl"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${previewStyle.dot}`} />
                          <span className="font-semibold uppercase tracking-wide opacity-80 leading-none">
                            {previewMeta.label}:
                          </span>
                          <span className="leading-none">
                            {noticeText.trim() ||
                              "Next update expected in 2 days — faster downloads & UI polish"}
                          </span>
                          {noticeShowCountdown && (
                            <span className="font-mono-tabular text-[10.5px] leading-none opacity-75">
                              ({formatRemainingCountdown(computeResolvedExpiresAt(), nowTick)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-zinc-400">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Composer Form */}
              <form
                onSubmit={handleCreateNotice}
                className="shrink-0 border border-zinc-200 rounded-lg bg-white p-3 space-y-2"
              >
                {/* Message + Direction */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    maxLength={240}
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    placeholder="Write notice (e.g. Next update expected in 2 days — faster downloads)"
                    className="flex-1 min-w-[240px] h-8 px-3 text-xs font-sans rounded-md bg-zinc-50 border border-zinc-200 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                  />

                  <div className="flex items-center gap-1 font-mono-tabular text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => setNoticeDirection("ltr")}
                      className={`h-8 px-2.5 rounded-md font-semibold border cursor-pointer transition-colors ${
                        noticeDirection === "ltr"
                          ? "bg-zinc-900 border-zinc-900 text-white"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      L &rarr; R
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticeDirection("rtl")}
                      className={`h-8 px-2.5 rounded-md font-semibold border cursor-pointer transition-colors ${
                        noticeDirection === "rtl"
                          ? "bg-zinc-900 border-zinc-900 text-white"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      R &rarr; L
                    </button>
                  </div>
                </div>

                {/* Built-In Modes + Saved Custom Modes + Custom Mode Creator */}
                <div className="flex flex-wrap items-center gap-1.5 font-mono-tabular text-[10px]">
                  <span className="text-zinc-400 uppercase tracking-wider font-semibold mr-0.5">
                    Mode:
                  </span>

                  {BUILTIN_MARQUEE_MODES.map((m) => {
                    const isSelected = noticeTone === m.tone;
                    const style = MODE_COLOR_STYLES[m.color];
                    return (
                      <button
                        key={m.tone}
                        type="button"
                        onClick={() => {
                          setNoticeTone(m.tone);
                          setNoticeModeLabel(m.label);
                          setNoticeModeColor(m.color);
                        }}
                        className={`h-7 px-2 rounded border font-semibold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? style.btnActive
                            : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : style.dot
                          }`}
                        />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}

                  {savedCustomModes.map((cm) => {
                    const isSelected =
                      noticeTone === "custom" &&
                      noticeModeLabel.toUpperCase() === cm.label.toUpperCase() &&
                      noticeModeColor === cm.color;
                    const style = MODE_COLOR_STYLES[cm.color];
                    return (
                      <div key={`${cm.label}-${cm.color}`} className="inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setNoticeTone("custom");
                            setNoticeModeLabel(cm.label);
                            setNoticeModeColor(cm.color);
                          }}
                          className={`h-7 pl-2 pr-1.5 rounded-l border border-r-0 font-semibold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isSelected
                              ? style.btnActive
                              : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? "bg-white" : style.dot
                            }`}
                          />
                          <span>{cm.label}</span>
                        </button>
                        <button
                          type="button"
                          title={`Remove custom mode ${cm.label}`}
                          onClick={() =>
                            setSavedCustomModes((prev) =>
                              prev.filter(
                                (item) =>
                                  !(item.label === cm.label && item.color === cm.color)
                              )
                            )
                          }
                          className={`h-7 px-1 rounded-r border font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? `${style.btnActive} opacity-90 hover:opacity-100`
                              : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setNoticeTone("custom")}
                    className={`h-7 px-2 rounded border font-semibold uppercase transition-colors cursor-pointer ${
                      noticeTone === "custom"
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : "bg-white border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    + Custom
                  </button>

                  {noticeTone === "custom" && (
                    <div className="inline-flex flex-wrap items-center gap-1.5 pl-1 ml-0.5 border-l border-zinc-200">
                      <input
                        type="text"
                        maxLength={14}
                        value={noticeModeLabel}
                        onChange={(e) => setNoticeModeLabel(e.target.value.toUpperCase())}
                        placeholder="MODE NAME"
                        className="w-24 h-7 px-2 rounded border border-zinc-300 bg-white text-[10.5px] font-semibold uppercase text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                      <div className="inline-flex items-center gap-1">
                        {(Object.keys(MODE_COLOR_STYLES) as MarqueeNoticeColor[]).map((col) => (
                          <button
                            key={col}
                            type="button"
                            title={col}
                            onClick={() => setNoticeModeColor(col)}
                            className={`w-4 h-4 rounded-full ${MODE_COLOR_STYLES[col].dot} cursor-pointer transition-transform ${
                              noticeModeColor === col
                                ? "ring-2 ring-offset-1 ring-zinc-900 scale-110"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const clean = noticeModeLabel.trim().toUpperCase().slice(0, 14);
                          if (!clean) return;
                          setSavedCustomModes((prev) => {
                            if (prev.some((m) => m.label === clean && m.color === noticeModeColor)) {
                              return prev;
                            }
                            return [...prev, { label: clean, color: noticeModeColor }];
                          });
                        }}
                        className="h-7 px-2 rounded border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold uppercase cursor-pointer"
                      >
                        Save Mode
                      </button>
                    </div>
                  )}
                </div>

                {/* Ready Templates Strip */}
                <div className="flex flex-wrap items-center gap-1 font-mono-tabular text-[10px]">
                  <span className="text-zinc-400 uppercase tracking-wider font-semibold mr-0.5">
                    Templates:
                  </span>
                  {READY_MARQUEE_TEMPLATES.map((tpl) => {
                    const tplStyle =
                      MODE_COLOR_STYLES[
                        BUILTIN_MARQUEE_MODES.find((m) => m.tone === tpl.tone)?.color || "zinc"
                      ];
                    return (
                      <button
                        key={tpl.title}
                        type="button"
                        title={tpl.text}
                        onClick={() => {
                          setNoticeText(tpl.text);
                          setNoticeTone(tpl.tone);
                          const modeInfo = BUILTIN_MARQUEE_MODES.find((m) => m.tone === tpl.tone);
                          if (modeInfo) {
                            setNoticeModeLabel(modeInfo.label);
                            setNoticeModeColor(modeInfo.color);
                          }
                          setDurationMode("preset");
                          setPresetDurationMs(tpl.durationMs);
                          setNoticeShowCountdown(tpl.showCountdown);
                        }}
                        className="h-6 px-2 rounded border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-400 text-zinc-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tplStyle.dot}`} />
                        <span>{tpl.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Duration Presets + Custom Timer + Countdown Toggle + Submit */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1 font-mono-tabular text-[10.5px]">
                    {NOTICE_DURATION_PRESETS.map((p) => {
                      const active = durationMode === "preset" && presetDurationMs === p.ms;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setDurationMode("preset");
                            setPresetDurationMs(p.ms);
                          }}
                          className={`h-7 px-2 rounded border transition-colors cursor-pointer ${
                            active
                              ? "bg-zinc-900 border-zinc-900 text-white font-semibold"
                              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setDurationMode("custom")}
                      className={`h-7 px-2 rounded border transition-colors cursor-pointer ${
                        durationMode === "custom"
                          ? "bg-zinc-900 border-zinc-900 text-white font-semibold"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      Custom
                    </button>

                    <button
                      type="button"
                      onClick={() => setDurationMode("exact")}
                      className={`h-7 px-2 rounded border transition-colors cursor-pointer ${
                        durationMode === "exact"
                          ? "bg-zinc-900 border-zinc-900 text-white font-semibold"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      End Time
                    </button>

                    {durationMode === "custom" && (
                      <div className="inline-flex items-center gap-1 ml-1">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={customDurationValue}
                          onChange={(e) => setCustomDurationValue(e.target.value)}
                          className="w-14 h-7 px-2 rounded border border-zinc-300 bg-white text-xs text-zinc-900"
                        />
                        <select
                          value={customDurationUnit}
                          onChange={(e) =>
                            setCustomDurationUnit(e.target.value as "minutes" | "hours" | "days")
                          }
                          className="h-7 px-1.5 rounded border border-zinc-300 bg-white text-[11px] text-zinc-900"
                        >
                          <option value="minutes">Mins</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    )}

                    {durationMode === "exact" && (
                      <input
                        type="datetime-local"
                        value={exactEndTime}
                        onChange={(e) => setExactEndTime(e.target.value)}
                        className="h-7 px-2 ml-1 rounded border border-zinc-300 bg-white text-[11px] text-zinc-900"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-mono-tabular text-zinc-600 cursor-pointer select-none mr-1">
                      <input
                        type="checkbox"
                        checked={noticeShowCountdown}
                        onChange={(e) => setNoticeShowCountdown(e.target.checked)}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                      />
                      <span>Show timer</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setNoticeText("");
                        setNoticeTone("update");
                        setNoticeModeLabel("UPDATE");
                        setNoticeModeColor("emerald");
                        setNoticeDirection("rtl");
                        setDurationMode("preset");
                        setPresetDurationMs(null);
                        setCustomDurationValue("2");
                        setCustomDurationUnit("hours");
                        setExactEndTime("");
                        setNoticeShowCountdown(false);
                        setPreviewDark(false);
                        setActionFeedback({ text: "Composer reset to clean state.", type: "info" });
                        setTimeout(() => setActionFeedback(null), 2200);
                      }}
                      title="Reset composer and settings to defaults"
                      className="h-8 px-2.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-mono-tabular text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingNotice || !noticeText.trim()}
                      className="h-8 px-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-mono-tabular text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSavingNotice ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{isSavingNotice ? "Sending..." : "Send Live"}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Active & Saved Notices List */}
              <div className="flex-1 min-h-0 flex flex-col border border-zinc-200 rounded-lg bg-white overflow-hidden">
                <div className="h-9 px-4 border-b border-zinc-200 bg-[#FAFAFA] flex items-center justify-between font-mono-tabular text-[10px] text-zinc-500 uppercase tracking-wider shrink-0">
                  <span className="font-semibold">Broadcast List ({notices.length})</span>
                  <span>Random Order Active: {activeNoticesCount}</span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-100">
                  {notices.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-6 font-mono-tabular text-xs text-zinc-400">
                      No marquee notices yet.
                    </div>
                  ) : (
                    notices.map((n) => {
                      const isExpired = n.expiresAt !== null && n.expiresAt <= nowTick;
                      const isLiveNow = n.active && !isExpired;
                      const busy = noticeBusyId === n.id;
                      const nMeta = resolveModeMeta(n);
                      const nStyle = MODE_COLOR_STYLES[nMeta.color];

                      return (
                        <div
                          key={n.id}
                          className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 text-[9px] font-mono-tabular font-bold uppercase rounded border shrink-0 ${nStyle.badge}`}
                              >
                                {nMeta.label}
                              </span>
                              <span className="text-xs font-medium text-zinc-900 truncate">
                                {n.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[10.5px] font-mono-tabular text-zinc-500">
                              <span>{n.direction === "rtl" ? "R → L" : "L → R"}</span>
                              <span>&bull;</span>
                              <span>{formatRemainingCountdown(n.expiresAt, nowTick)}</span>
                              {n.showCountdown && (
                                <>
                                  <span>&bull;</span>
                                  <span>Live Timer On</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 text-[9.5px] font-mono-tabular font-bold uppercase rounded border ${
                                isLiveNow
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                  : isExpired
                                  ? "bg-zinc-100 text-zinc-500 border-zinc-200"
                                  : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                              }`}
                            >
                              {isLiveNow ? "LIVE" : isExpired ? "EXPIRED" : "PAUSED"}
                            </span>

                            {!isExpired && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggleNoticeActive(n)}
                                title={n.active ? "Pause notice" : "Resume notice"}
                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 cursor-pointer disabled:opacity-40"
                              >
                                {n.active ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDeleteNotice(n.id)}
                              title="Delete notice"
                              className="h-7 w-7 inline-flex items-center justify-center rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            );
          })()}
        </main>
      </div>
    </div>
  );
}
