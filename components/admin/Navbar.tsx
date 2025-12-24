"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LogOut,
  User as UserIcon,
  Settings,
  FileText,
  Trash2,
  RefreshCw,
  Activity,
  Shield,
  Wrench,
  Clock,
} from "lucide-react";
import { useMaintenanceStatus } from "@/contexts/MaintenanceStatusContext";
import { isLocalhost } from "@/lib/environmentUtils";
import BrandLogo from "./BrandLogo";
import NotificationBell from "./NotificationBell";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { useRefreshDashboard } from "@/hooks/useRefreshDashboard";

interface NavbarProps {
  showNotifications?: boolean;
  onVersionNotesClick?: () => void;
  onAdminRightsClick?: () => void;
}

export default function Navbar({
  showNotifications = true,
  onVersionNotesClick,
  onAdminRightsClick,
}: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHealthStatus, setShowHealthStatus] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState("");
  const [maintenanceTimeLeft, setMaintenanceTimeLeft] = useState<string>("");
  const [maintenanceElapsed, setMaintenanceElapsed] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { stats } = useRecycleBin();
  const { refresh, isRefreshing, lastRefresh, healthStatus } = useRefreshDashboard();
  const { status: maintenanceStatus } = useMaintenanceStatus();
  
  // Check if we should show maintenance marquee (client-side only)
  const showMaintenanceMarquee = isClient && isLocalhost() && maintenanceStatus.enabled;

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug: Log maintenance status
  useEffect(() => {
    if (isClient) {
      console.log('[Admin Navbar] Maintenance Debug:', {
        isClient,
        isLocalhost: isLocalhost(),
        maintenanceEnabled: maintenanceStatus.enabled,
        showMarquee: showMaintenanceMarquee,
        estimatedEndTime: maintenanceStatus.estimatedEndTime,
      });
    }
  }, [isClient, maintenanceStatus.enabled, showMaintenanceMarquee]);

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const istTime = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setCurrentTime(istTime);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update maintenance countdown timer
  useEffect(() => {
    if (!maintenanceStatus.enabled || !maintenanceStatus.estimatedEndTime) {
      setMaintenanceTimeLeft("");
      setMaintenanceElapsed("");
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(maintenanceStatus.estimatedEndTime!);
      const diff = end.getTime() - now.getTime();

      // Calculate elapsed time since maintenance started
      if (maintenanceStatus.enabledAt) {
        const start = new Date(maintenanceStatus.enabledAt);
        const elapsedMs = now.getTime() - start.getTime();
        const elapsedHours = Math.floor(elapsedMs / (60 * 60 * 1000));
        const elapsedMinutes = Math.floor((elapsedMs % (60 * 60 * 1000)) / (60 * 1000));
        const elapsedSeconds = Math.floor((elapsedMs % (60 * 1000)) / 1000);

        if (elapsedHours > 0) {
          setMaintenanceElapsed(`${elapsedHours}h ${elapsedMinutes}m ${elapsedSeconds}s`);
        } else {
          setMaintenanceElapsed(`${elapsedMinutes}m ${elapsedSeconds}s`);
        }
      }

      // Calculate time remaining
      if (diff <= 0) {
        const minutesOver = Math.floor((now.getTime() - end.getTime()) / (60 * 1000));
        setMaintenanceTimeLeft(`Overdue ${minutesOver}m`);
        return;
      }

      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      if (hours > 0) {
        setMaintenanceTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setMaintenanceTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [maintenanceStatus.enabled, maintenanceStatus.estimatedEndTime, maintenanceStatus.enabledAt]);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  // Lock body scroll and handle escape key when health modal is open
  useEffect(() => {
    if (showHealthStatus) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowHealthStatus(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showHealthStatus]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/admin/login");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshProgress(0);
    setRefreshStatus("Starting...");
    
    await refresh({
      clearCache: true,
      maxRetries: 3,
      retryDelay: 1000,
      onProgress: (progress, status) => {
        setRefreshProgress(progress);
        setRefreshStatus(status);
      },
    });
    
    // Reset progress after completion
    setTimeout(() => {
      setRefreshProgress(0);
      setRefreshStatus("");
    }, 2000);
  };

  const getHealthStatusColor = () => {
    if (!healthStatus) return "gray";
    if (healthStatus.summary.down > 0) return "red";
    if (healthStatus.summary.degraded > 0) return "yellow";
    return "green";
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return "Never";
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
    <header className={`sticky top-0 z-50 w-full border-b shadow-sm transition-all duration-500 ${
      showMaintenanceMarquee 
        ? 'border-orange-500/20 bg-black/20 backdrop-blur-xl' 
        : 'border-gray-200 bg-white/95 backdrop-blur-xl'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Section - Logo and Brand Name */}
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 sm:gap-3 shrink-0 hover:opacity-90 transition-opacity cursor-pointer group"
            aria-label="Go to Dashboard"
          >
            <div className="shrink-0">
              <BrandLogo className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm sm:text-base lg:text-lg bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#3B82F6] bg-clip-text text-transparent whitespace-nowrap group-hover:from-[#7C3AED] group-hover:to-[#2563EB] transition-all">
                Portfolio Admin
              </span>
            </div>
          </button>

          {/* Middle Section - Maintenance Marquee or Clock */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            {showMaintenanceMarquee ? (
              <div className="relative bg-gradient-to-r from-orange-900/20 via-amber-900/20 to-orange-900/20 backdrop-blur-md rounded-lg border border-orange-500/20 px-4 py-2 animate-pulse">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <Wrench className="w-4 h-4 text-orange-400 flex-shrink-0" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  <span className="text-sm font-bold text-orange-200/90 uppercase tracking-wide">MAINTENANCE ACTIVE</span>
                  <span className="text-orange-300/60">•</span>
                  <span className="text-sm text-orange-200/90 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-300" />
                    Elapsed: {maintenanceElapsed}
                  </span>
                  <span className="text-orange-300/60">•</span>
                  <span className="text-sm text-orange-200/90 font-mono flex items-center gap-1.5">
                    Ends: {maintenanceTimeLeft}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm font-mono text-gray-700">
                  {currentTime}
                  <span className="text-xs text-gray-500 ml-1">IST</span>
                </span>
              </div>
            )}
          </div>

          {/* Right Section - Notifications, Recycle Bin, and Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {authLoading ? (
              // Loading skeleton for right section
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ) : (
              <>
                {/* Clock (left of refresh button when maintenance active) */}
                {showMaintenanceMarquee && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 border border-orange-500/20">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-xs font-mono text-slate-300">
                      {currentTime.split(' ')[0]}
                    </span>
                  </div>
                )}
                
                {/* Refresh Button with Progress */}
                <div className="relative">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`relative p-2 rounded-lg transition-all group ${
                      isRefreshing
                        ? "bg-blue-50 cursor-not-allowed"
                        : "hover:bg-blue-50 hover:scale-105 active:scale-95"
                    }`}
                    aria-label="Refresh Dashboard"
                    title={`Last refresh: ${formatLastRefresh()}`}
                  >
                    <RefreshCw
                      className={`w-5 h-5 transition-all duration-500 ${
                        isRefreshing
                          ? "text-blue-600 animate-spin"
                          : "text-gray-600 group-hover:text-blue-600 group-hover:rotate-180"
                      }`}
                    />
                    {isRefreshing && refreshProgress > 0 && (
                      <div className="absolute inset-0 rounded-lg border-2 border-blue-500 opacity-50">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300 rounded-lg opacity-20"
                          style={{ width: `${refreshProgress}%` }}
                        />
                      </div>
                    )}
                    {!isRefreshing && healthStatus && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                          getHealthStatusColor() === "green"
                            ? "bg-green-500"
                            : getHealthStatusColor() === "yellow"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        } animate-pulse`}
                      />
                    )}
                  </button>
                  
                  {/* Health Status Tooltip */}
                  {isRefreshing && refreshStatus && (
                    <div className="absolute top-full mt-2 right-0 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                      {refreshStatus}
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  )}
                </div>

                {/* Health Status Button */}
                <button
                  onClick={() => setShowHealthStatus(!showHealthStatus)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95"
                  aria-label="Health Status"
                  title="System Health Status"
                >
                  <Activity className="w-5 h-5 text-gray-600 hover:text-indigo-600 transition-colors" />
                  {healthStatus && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                        getHealthStatusColor() === "green"
                          ? "bg-green-500"
                          : getHealthStatusColor() === "yellow"
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-red-500 animate-pulse"
                      }`}
                    />
                  )}
                </button>

                {showNotifications && <NotificationBell />}

                {/* Recycle Bin Button with Enhanced Badge */}
                <button
                  onClick={() => router.push("/admin/recycle-bin")}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95"
                  aria-label="Recycle Bin"
                  title={`Recycle Bin${stats.total > 0 ? ` (${stats.total} item${stats.total > 1 ? 's' : ''})` : ''}`}
                >
                  <Trash2 className="w-5 h-5 text-gray-600 hover:text-red-600 transition-colors" />
                  {stats.total > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-white">
                      {stats.total > 99 ? "99+" : stats.total}
                    </span>
                  )}
                </button>

                {/* Profile Menu */}
                <div className="relative" ref={profileMenuRef}>
                  {/* Profile Picture */}
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-indigo-400 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                    aria-label="Profile menu"
                  >
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="eager"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.nextElementSibling) {
                            (
                              target.nextElementSibling as HTMLElement
                            ).style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ${
                        user?.photoURL ? "hidden" : ""
                      }`}
                    >
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shrink-0">
                          {user?.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user?.displayName || "User"}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              loading="eager"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                if (target.nextElementSibling) {
                                  (
                                    target.nextElementSibling as HTMLElement
                                  ).style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ${
                              user?.photoURL ? "hidden" : ""
                            }`}
                          >
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.displayName || "User"}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {user?.email || ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Add profile navigation if needed
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onVersionNotesClick) {
                            onVersionNotesClick();
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Version Notes</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onAdminRightsClick) {
                            onAdminRightsClick();
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Rights</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Add settings navigation if needed
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
    
    {/* Health Status Modal - Rendered via Portal */}
    {showHealthStatus && healthStatus && typeof document !== 'undefined' && createPortal(
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] animate-in fade-in duration-200"
          onClick={() => setShowHealthStatus(false)}
          aria-hidden="true"
        />
        
        {/* Modal */}
        <div className="fixed inset-0 z-[10000] overflow-y-auto pointer-events-none">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200" 
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      getHealthStatusColor() === "green"
                        ? "bg-green-100"
                        : getHealthStatusColor() === "yellow"
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}>
                      <Activity className={`w-5 h-5 ${
                        getHealthStatusColor() === "green"
                          ? "text-green-600"
                          : getHealthStatusColor() === "yellow"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        System Health Monitor
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHealthStatus(false)}
                    className="p-2 hover:bg-white/80 rounded-lg transition-colors group flex-shrink-0"
                    aria-label="Close modal"
                    type="button"
                  >
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="px-4 py-3 bg-white rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Healthy</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {healthStatus.summary.healthy}
                    </p>
                  </div>
                  
                  <div className="px-4 py-3 bg-white rounded-xl border border-yellow-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Degraded</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {healthStatus.summary.degraded}
                    </p>
                  </div>
                  
                  <div className="px-4 py-3 bg-white rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Down</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {healthStatus.summary.down}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-3">
                  {healthStatus.healthChecks.map((check, index) => (
                    <div
                      key={index}
                      className={`px-4 py-4 rounded-xl border transition-all hover:shadow-lg ${
                        check.status === "healthy"
                          ? "bg-green-50/50 border-green-200 hover:bg-green-50"
                          : check.status === "degraded"
                          ? "bg-yellow-50/50 border-yellow-200 hover:bg-yellow-50"
                          : "bg-red-50/50 border-red-200 hover:bg-red-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-1">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                check.status === "healthy"
                                  ? "bg-green-500 shadow-green-500/50 shadow-lg animate-pulse"
                                  : check.status === "degraded"
                                  ? "bg-yellow-500 shadow-yellow-500/50 shadow-lg animate-pulse"
                                  : "bg-red-500 shadow-red-500/50 shadow-lg animate-pulse"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-base font-bold text-gray-800 capitalize">
                                {check.service.replace(/-/g, ' ')}
                              </span>
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                                check.status === "healthy"
                                  ? "bg-green-100 text-green-700"
                                  : check.status === "degraded"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {check.status}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1.5">
                                <span className="font-medium">Response:</span>
                                <span className={`font-mono font-bold ${
                                  check.responseTime < 100
                                    ? "text-green-600"
                                    : check.responseTime < 500
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}>
                                  {check.responseTime}ms
                                </span>
                              </span>
                              
                              {check.itemCount !== undefined && (
                                <span className="flex items-center gap-1.5">
                                  <span className="font-medium">Items:</span>
                                  <span className="font-bold text-indigo-600">
                                    {check.itemCount}
                                  </span>
                                </span>
                              )}
                            </div>
                            
                            {check.error && (
                              <div className="mt-3 px-3 py-2 bg-red-100 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                                <span className="font-bold">Error:</span> {check.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-medium text-gray-600">Total Response Time:</span>
                    <span className="font-mono font-bold text-blue-600 text-base">
                      {healthStatus.duration}ms
                    </span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    type="button"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all hover:shadow-lg disabled:hover:shadow-none text-sm flex items-center gap-2 flex-shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  );
}
