"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  User as UserIcon,
  Settings,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import NotificationBell from "./NotificationBell";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { useTechStack } from "@/contexts/TechStackContext";
import { useProjects } from "@/contexts/ProjectContext";
import { useTestimonials } from "@/contexts/TestimonialContext";
import { useWorkExperiences } from "@/contexts/WorkExperienceContext";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useBanAppeals } from "@/contexts/BanAppealsContext";
import { useCurrentlyWorking } from "@/contexts/CurrentlyWorkingContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useBubbleManagement } from "@/contexts/BubbleManagementContext";
import { useVisitorAnalytics } from "@/contexts/VisitorAnalyticsContext";

interface NavbarProps {
  showNotifications?: boolean;
  onVersionNotesClick?: () => void;
}

export default function Navbar({
  showNotifications = true,
  onVersionNotesClick,
}: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { stats, refreshItems: refreshRecycleBin } = useRecycleBin();
  const { fetchItems: refreshTechStack } = useTechStack();
  const { fetchProjects } = useProjects();
  const { fetchTestimonials, refreshTestimonials } = useTestimonials();
  const { fetchWorkExperiences } = useWorkExperiences();
  const { fetchSubmissions, refreshSubmissions } = useContactSubmissions();
  const { loadAppeals, refreshAppeals } = useBanAppeals();
  const { fetchItems: refreshCurrentlyWorking } = useCurrentlyWorking();
  const { refreshNotifications } = useNotifications();
  const { refreshSessions } = useBubbleManagement();
  const { fetchVisitors, fetchAggregates, refreshActiveCount } = useVisitorAnalytics();

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

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close profile menu when clicking outside
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

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/admin/code-gate");
    } catch (error) {
      showToast.error("Failed to logout");
    }
  };

  const handleHardRefresh = async () => {
    showToast.info("Restarting dashboard...", "Please wait");
    
    try {
      // Clear all caches in parallel (fast, no await)
      Promise.all([
        // Clear browser caches
        'caches' in window ? caches.keys().then(names => 
          Promise.all(names.map(name => caches.delete(name)))
        ) : Promise.resolve(),
        // Clear IndexedDB
        'indexedDB' in window && indexedDB.databases ? 
          indexedDB.databases().then(dbs => 
            Promise.all(dbs.map(db => 
              db.name ? new Promise<void>((resolve) => {
                const req = indexedDB.deleteDatabase(db.name!);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
              }) : Promise.resolve()
            ))
          ) : Promise.resolve(),
      ]).catch(() => {}); // Silent fail for cache clearing

      // Clear storage (sync operation)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}

      // Refresh all services in parallel batches (3 batches for speed)
      await Promise.all([
        // Batch 1: Core data
        refreshTechStack?.(true).catch(() => {}),
        fetchProjects?.(false).catch(() => {}),
        refreshTestimonials?.().catch(() => {}),
        fetchWorkExperiences?.().catch(() => {}),
      ]);

      await Promise.all([
        // Batch 2: User data
        refreshSubmissions?.().catch(() => {}),
        refreshAppeals?.().catch(() => {}),
        refreshCurrentlyWorking?.(true).catch(() => {}),
        refreshNotifications?.().catch(() => {}),
      ]);

      await Promise.all([
        // Batch 3: Analytics & system
        refreshSessions?.().catch(() => {}),
        fetchVisitors?.().catch(() => {}),
        fetchAggregates?.().catch(() => {}),
        refreshActiveCount?.().catch(() => {}),
        refreshRecycleBin?.().catch(() => {}),
      ]);

      showToast.success("Dashboard restarted successfully!", "Restart Complete");
    } catch (error) {
      console.error("Hard refresh error:", error);
      showToast.error("Refresh completed with some errors", "Restart Error");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm">
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

          {/* Middle Section - Live Clock (IST) */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 border border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-mono text-gray-700">
                {currentTime}
                <span className="text-xs text-gray-500 ml-1">IST</span>
              </span>
            </div>
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
                {/* Hard Refresh Button */}
                <button
                  onClick={handleHardRefresh}
                  className="relative p-2 hover:bg-red-50 rounded-lg transition-all hover:scale-105 active:scale-95 group"
                  aria-label="Emergency Restart"
                  title="Emergency restart - Clears all caches and refreshes all data"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors group-hover:rotate-180 duration-500" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
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
  );
}
