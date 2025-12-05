"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Navbar from "@/components/admin/Navbar";
import Footer from "@/components/admin/Footer";
import TechStackManager from "@/components/admin/TechStackManager";
import CurrentlyWorkingManager from "@/components/admin/CurrentlyWorkingManager";
import ProjectManager from "@/components/admin/ProjectManager";
import TestimonialManager from "@/components/admin/TestimonialManager";
import WorkExperienceManager from "@/components/admin/WorkExperienceManager";
import ContactSubmissionManager from "@/components/admin/ContactSubmissionManager";
import BubbleManagementHub from "@/components/admin/BubbleManagementHub";
import VisitorAnalyticsManager from "@/components/admin/VisitorAnalyticsManager";
import VisitorAnalyticsErrorBoundary from "@/components/admin/VisitorAnalyticsErrorBoundary";
import BanAppealsManager from "@/components/admin/BanAppealsManager";
import BugHuntManager from "@/components/admin/BugHuntManager";
import VersionNotesModal from "@/components/admin/VersionNotesModal";
import AdminRightsModal from "@/components/admin/AdminRightsModal";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useBugReports } from "@/contexts/BugReportContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useVisitorAnalytics } from "@/contexts/VisitorAnalyticsContext";
import { useBubbleManagement } from "@/contexts/BubbleManagementContext";
import { useBanAppeals } from "@/contexts/BanAppealsContext";
import { useUnreadCountNotification } from "@/hooks/useLiveUpdateNotification";
import { auth } from "@/lib/firebase";

// Panel option interface
export interface PanelOption {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

// Component that uses useSearchParams - wrapped in Suspense
function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showVersionNotes, setShowVersionNotes] = useState(false);
  const [showAdminRights, setShowAdminRights] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { showToastNotification } = useNotifications();

  // Get unread submissions count
  const { getNewSubmissionsCount } = useContactSubmissions();
  const unreadCount = getNewSubmissionsCount();

  // Get active visitor count for badge
  const { activeVisitorCount } = useVisitorAnalytics();

  // Get unread bubble sessions count for badge
  const { getUnreadSessionsCount } = useBubbleManagement();
  const unreadBubbleCount = getUnreadSessionsCount();

  // Get pending ban appeals count for badge
  const { getPendingCount } = useBanAppeals();
  const pendingAppealsCount = getPendingCount();

  // Get new bug reports count for badge
  const { getNewBugReportsCount } = useBugReports();
  const newBugReportsCount = getNewBugReportsCount();

  // Panel options configuration with dynamic badges (excluding recycle bin - it's in navbar)
  const panelOptions: PanelOption[] = [
    { id: "tech-stacks", label: "My Tech Stacks", icon: "⚡" },
    { id: "currently-working", label: "Currently Working", icon: "🚀" },
    { id: "projects", label: "Projects", icon: "📁" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "work-experience", label: "Work Experience", icon: "💼" },
    { id: "contact-submissions", label: "Contact Submissions", icon: "📧", badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "bubble-management", label: "Bubble Management", icon: "💬", badge: unreadBubbleCount > 0 ? unreadBubbleCount : undefined },
    { id: "visitor-analytics", label: "Visitor Analytics", icon: "📊", badge: activeVisitorCount > 0 ? activeVisitorCount : undefined },
    { id: "ban-appeals", label: "Ban Appeals", icon: "🛡️", badge: pendingAppealsCount > 0 ? pendingAppealsCount : undefined },
    { id: "bug-hunt", label: "Bug Hunt", icon: "🐛", badge: newBugReportsCount > 0 ? newBugReportsCount : undefined },
  ];

  // Get active section from URL params, default to "tech-stacks"
  const tabParam = searchParams.get("tab");
  const validTab = panelOptions.find((opt) => opt.id === tabParam);
  const [activeSection, setActiveSection] = useState(
    validTab ? tabParam : "tech-stacks"
  );

  // Get visitorId from URL params for analytics navigation
  const visitorIdParam = searchParams.get("visitorId");

  // Enhanced debug logging with timestamps
  useEffect(() => {
    console.log('[Dashboard] 🔔 Badge Update:', {
      contactSubmissions: unreadCount,
      bubbleMessages: unreadBubbleCount,
      activeVisitors: activeVisitorCount,
      banAppeals: pendingAppealsCount,
      bugReports: newBugReportsCount,
      currentTab: activeSection,
      timestamp: new Date().toISOString()
    });
  }, [unreadCount, unreadBubbleCount, activeVisitorCount, pendingAppealsCount, newBugReportsCount, activeSection]);

  // Live notifications when new items arrive (only show if not already viewing that section)
  useUnreadCountNotification(unreadCount, 'unread contact submission(s)', { 
    enabled: activeSection !== 'contact-submissions',
    soundEnabled: true, // Enable sound for contact submissions
  });
  
  useUnreadCountNotification(unreadBubbleCount, 'unread visitor message(s)', { 
    enabled: activeSection !== 'bubble-management',
    soundEnabled: true, // Enable sound for bubble messages
  });
  
  useUnreadCountNotification(activeVisitorCount, 'active visitor(s) online', { 
    enabled: activeSection !== 'visitor-analytics',
    soundEnabled: false, // No sound for visitor count changes (too frequent)
  });

  useUnreadCountNotification(pendingAppealsCount, 'pending ban appeal(s)', { 
    enabled: activeSection !== 'ban-appeals',
    soundEnabled: true, // Enable sound for new ban appeals
  });

  useUnreadCountNotification(newBugReportsCount, 'new bug report(s)', { 
    enabled: activeSection !== 'bug-hunt',
    soundEnabled: true, // Enable sound for new bug reports
  });

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Mobile breakpoint at 768px
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync active section with URL params on mount and when URL changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const validTab = panelOptions.find((opt) => opt.id === tabParam);

    if (validTab) {
      setActiveSection(tabParam!);
    } else if (!tabParam) {
      // If no tab param, set default to tech-stacks in URL
      router.replace(`${pathname}?tab=tech-stacks`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  // Handle initial mount and welcome message
  useEffect(() => {
    const initDashboard = async () => {
      // Check if user just logged in (session storage flag)
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      
      if (justLoggedIn === 'true') {
        setShowWelcome(true);
        sessionStorage.removeItem('justLoggedIn');
        
        // Hide welcome overlay first
        setTimeout(() => {
          setShowWelcome(false);
        }, 400);
        
        // Show welcome toast AFTER overlay fades out
        setTimeout(() => {
          const user = auth.currentUser;
          const displayName = user?.displayName || user?.email || "User";
          
          console.log('🎉 Showing welcome toast for:', displayName);
          
          // Use the notification queue for immediate UI feedback
          showToastNotification("success", `Welcome back, ${displayName}!`, "Login Successful");
        }, 700); // Show toast after overlay is gone (400ms + 300ms fade)
      }
      
      setLoading(false);
      setAuthorized(true);
      
      // Remove initial load state after animation
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 600);
    };

    initDashboard();
  }, [showToastNotification]);

  // Handle tab change and update URL
  const handleTabChange = (newTab: string) => {
    setActiveSection(newTab);
    router.push(`${pathname}?tab=${newTab}`, { scroll: false });
  };

  if (loading) {
    return null;
  }

  if (!authorized) return null;

  // Get the current active section data for breadcrumb
  const getCurrentSectionData = () => {
    const activeOption = panelOptions.find((opt) => opt.id === activeSection);
    return activeOption
      ? { label: activeOption.label, icon: activeOption.icon }
      : { label: "My Tech Stacks", icon: "⚡" };
  };

  const currentSection = getCurrentSectionData();

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={isInitialLoad ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="h-screen flex flex-col bg-surface overflow-hidden"
      >
      <div className="shrink-0">
        <Navbar 
          onVersionNotesClick={() => setShowVersionNotes(true)}
          onAdminRightsClick={() => setShowAdminRights(true)}
        />

        {/* Tab Grid - 2 rows layout */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {panelOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleTabChange(option.id)}
                className={`
                  relative px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${
                    activeSection === option.id
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <span className="text-base">{option.icon}</span>
                <span className="hidden sm:inline truncate">{option.label}</span>
                <span className="sm:hidden truncate text-xs">{option.label.split(' ')[0]}</span>
                {option.badge && option.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white">
                    {option.badge > 99 ? "99+" : option.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Breadcrumb - Below tabs */}
        <div className="bg-gray-50/50 border-b border-gray-100 px-4 md:px-6 py-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-gray-700">{currentSection.label}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable Section */}
      <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide">
        <div className={activeSection === "visitor-analytics" ? "w-full px-2 py-4" : "max-w-7xl mx-auto p-6"}>
          {activeSection === "tech-stacks" && <TechStackManager />}
          {activeSection === "currently-working" && <CurrentlyWorkingManager />}
          {activeSection === "projects" && <ProjectManager />}
          {activeSection === "testimonials" && <TestimonialManager />}
          {activeSection === "work-experience" && <WorkExperienceManager />}
          {activeSection === "contact-submissions" && <ContactSubmissionManager />}
          {activeSection === "bubble-management" && <BubbleManagementHub />}
          {activeSection === "visitor-analytics" && (
            <VisitorAnalyticsErrorBoundary>
              <VisitorAnalyticsManager visitorIdParam={visitorIdParam} />
            </VisitorAnalyticsErrorBoundary>
          )}
          {activeSection === "ban-appeals" && <BanAppealsManager />}
          {activeSection === "bug-hunt" && <BugHuntManager />}
        </div>
      </main>

      <div className="shrink-0">
        <Footer />
      </div>

      {/* Version Notes Modal */}
      <VersionNotesModal 
        isOpen={showVersionNotes} 
        onClose={() => setShowVersionNotes(false)} 
      />

      {/* Admin Rights Modal */}
      <AdminRightsModal 
        isOpen={showAdminRights} 
        onClose={() => setShowAdminRights(false)} 
      />

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      </motion.div>
    </>
  );
}

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
