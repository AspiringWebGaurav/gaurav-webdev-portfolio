"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/utils/adminAuth";
import { ThemeToggle, LiveSyncToggle } from "@/components/admin/ThemeProvider";
import { useAdminSwipeNavigation } from "@/hooks/useSwipeGestures";
import { usePagePreloading } from "@/hooks/usePerformanceOptimization";

interface UnifiedNavbarProps {
  visitorStats?: { total: number; active: number; banned: number };
  appealStats?: { total: number; pending: number };
  aiQuestionCount?: number;
  isRealTimeActive?: boolean;
  onLiveSyncToggle?: (enabled: boolean) => void;
}

export default function UnifiedNavbar({
  visitorStats = { total: 0, active: 0, banned: 0 },
  appealStats = { total: 0, pending: 0 },
  aiQuestionCount = 0,
  isRealTimeActive = false,
  onLiveSyncToggle,
}: UnifiedNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Swipe gestures and performance optimizations
  const { isSwipeActive, swipeDirection } = useAdminSwipeNavigation();
  const { handleMouseEnter, handleMouseLeave } = usePagePreloading();

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const getPageTitle = () => {
    switch (pathname) {
      case "/admin":
        return {
          title: "Dashboard Overview",
          subtitle: "Smart Tracking Admin",
        };
      case "/admin/visitors":
        return {
          title: "Visitors Management",
          subtitle: "Smart Tracking Admin",
        };
      case "/admin/appeals":
        return {
          title: "Appeals Management",
          subtitle: "Smart Tracking Admin",
        };
      case "/admin/ai-assistant":
        return {
          title: "AI Assistant Management",
          subtitle: "Smart Tracking Admin",
        };
      default:
        return { title: "Smart Tracking Admin", subtitle: "Dashboard" };
    }
  };

  const getPageIcon = () => {
    switch (pathname) {
      case "/admin":
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "/admin/visitors":
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        );
      case "/admin/appeals":
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "/admin/ai-assistant":
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
    }
  };

  const getIconGradient = () => {
    switch (pathname) {
      case "/admin":
        return "from-blue-500 to-purple-500";
      case "/admin/visitors":
        return "from-emerald-500 to-teal-500";
      case "/admin/appeals":
        return "from-amber-500 to-orange-500";
      case "/admin/ai-assistant":
        return "from-purple-500 to-pink-500";
      default:
        return "from-blue-500 to-purple-500";
    }
  };

  const isActivePage = (path: string) => pathname === path;

  const { title, subtitle } = getPageTitle();

  return (
    <>
      {/* Full-width Dark Navbar */}
      <header className="navbar-full-width dark-surface border-b border-slate-700 sticky top-0 z-40 backdrop-blur-md">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              {/* Page Title with Icon */}
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 bg-gradient-to-r ${getIconGradient()} rounded-lg flex items-center justify-center`}
                >
                  {getPageIcon()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  <p className="text-xs text-slate-300">{subtitle}</p>
                </div>
              </div>

              {/* Live Sync Toggle - Only show on dashboard and visitors */}
              {(pathname === "/admin" || pathname === "/admin/visitors") &&
                onLiveSyncToggle && (
                  <LiveSyncToggle
                    isEnabled={isRealTimeActive}
                    onToggle={onLiveSyncToggle}
                  />
                )}

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex space-x-1">
                <button
                  onClick={() => router.push("/admin")}
                  onMouseEnter={() => handleMouseEnter("/admin")}
                  onMouseLeave={() => handleMouseLeave("/admin")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium touch-feedback ${
                    isActivePage("/admin")
                      ? "bg-blue-500 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push("/admin/visitors")}
                  onMouseEnter={() => handleMouseEnter("/admin/visitors")}
                  onMouseLeave={() => handleMouseLeave("/admin/visitors")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium touch-feedback ${
                    isActivePage("/admin/visitors")
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  Visitors ({visitorStats.total})
                </button>
                <button
                  onClick={() => router.push("/admin/appeals")}
                  onMouseEnter={() => handleMouseEnter("/admin/appeals")}
                  onMouseLeave={() => handleMouseLeave("/admin/appeals")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 relative font-medium touch-feedback ${
                    isActivePage("/admin/appeals")
                      ? "bg-amber-500 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  Appeals ({appealStats.total})
                  {appealStats.pending > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                      {appealStats.pending}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => router.push("/admin/ai-assistant")}
                  onMouseEnter={() => handleMouseEnter("/admin/ai-assistant")}
                  onMouseLeave={() => handleMouseLeave("/admin/ai-assistant")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium touch-feedback ${
                    isActivePage("/admin/ai-assistant")
                      ? "bg-purple-500 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  AI Assistant ({aiQuestionCount})
                </button>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
                aria-label={
                  isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
                }
                aria-expanded={isMobileMenuOpen}
                title={
                  isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
                }
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Admin Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">Gaurav</p>
                  <p className="text-xs text-slate-300">Administrator</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">G</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden dark-surface-secondary border-b border-slate-700 z-30">
          <div className="px-6 py-4 space-y-2">
            <button
              onClick={() => {
                router.push("/admin");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                isActivePage("/admin")
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                router.push("/admin/visitors");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                isActivePage("/admin/visitors")
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              Visitors ({visitorStats.total})
            </button>
            <button
              onClick={() => {
                router.push("/admin/appeals");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors relative font-medium ${
                isActivePage("/admin/appeals")
                  ? "bg-amber-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              Appeals ({appealStats.total})
              {appealStats.pending > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {appealStats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                router.push("/admin/ai-assistant");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                isActivePage("/admin/ai-assistant")
                  ? "bg-purple-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              AI Assistant ({aiQuestionCount})
            </button>
          </div>
        </div>
      )}

      {/* Swipe Gesture Indicators */}
      {isSwipeActive && (
        <>
          <div
            className={`swipe-indicator left ${
              swipeDirection === "right" ? "active" : ""
            }`}
          />
          <div
            className={`swipe-indicator right ${
              swipeDirection === "left" ? "active" : ""
            }`}
          />
        </>
      )}
    </>
  );
}
