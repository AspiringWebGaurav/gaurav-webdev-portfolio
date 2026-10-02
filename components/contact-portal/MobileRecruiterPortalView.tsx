"use client";

import React from "react";
import {
  FaHome,
  FaLightbulb,
  FaBriefcase,
  FaCode,
  FaLayerGroup,
  FaFilePdf,
  FaPhone,
  FaSignOutAlt,
  FaComments,
} from "react-icons/fa";
import { OverviewScreen } from "./screens/OverviewScreen";
import { AboutScreen } from "./screens/AboutScreen";
import { ExperienceScreen } from "./screens/ExperienceScreen";
import { SkillsScreen } from "./screens/SkillsScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
import { ResumeScreen } from "./screens/ResumeScreen";
import { ContactScreen } from "./screens/ContactScreen";
import { LiveChatScreen } from "./screens/LiveChatScreen";

interface MobileRecruiterPortalViewProps {
  recruiter: { name: string; company: string; email: string };
  activeSection: string;
  onNavigate: (section: string) => void;
  onSignOut: () => void;
  onTrackAction: (action: string, metadata?: Record<string, unknown>) => void;
}

const navItems = [
  { id: "overview", label: "Home", icon: FaHome },
  { id: "contact", label: "Contact", icon: FaPhone },
  { id: "chat", label: "Chat", icon: FaComments },
  { id: "resume", label: "CV", icon: FaFilePdf },
  { id: "experience", label: "Exp", icon: FaBriefcase },
  { id: "projects", label: "Work", icon: FaLayerGroup },
  { id: "skills", label: "Skills", icon: FaCode },
  { id: "about", label: "Focus", icon: FaLightbulb },
];

export function MobileRecruiterPortalView({
  recruiter,
  activeSection,
  onNavigate,
  onSignOut,
  onTrackAction,
}: MobileRecruiterPortalViewProps) {
  const renderActiveScreen = () => {
    switch (activeSection) {
      case "chat":
        return (
          <LiveChatScreen
            recruiter={recruiter}
            onTrackAction={onTrackAction}
            onSignOut={onSignOut}
          />
        );
      case "about":
        return <AboutScreen />;
      case "experience":
        return <ExperienceScreen />;
      case "skills":
        return <SkillsScreen />;
      case "projects":
        return <ProjectsScreen onTrackAction={onTrackAction} />;
      case "resume":
        return <ResumeScreen recruiter={recruiter} onTrackAction={onTrackAction} />;
      case "contact":
        return <ContactScreen recruiter={recruiter} onTrackAction={onTrackAction} />;
      case "overview":
      default:
        return (
          <OverviewScreen
            recruiter={recruiter}
            onNavigate={onNavigate}
            onTrackAction={onTrackAction}
          />
        );
    }
  };

  return (
    <div className="flex md:hidden flex-col h-full max-h-[100dvh] w-full overflow-hidden select-none bg-[#FAFAFA] text-black">
      {/* Top Mobile Bar with Shiro Styling */}
      <header className="h-12 px-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FFFFFF] z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-black font-admin-sans">Gaurav Patil</span>
          <span className="text-[10px] font-admin-mono text-[#7C3AED] truncate max-w-[120px]">
            · {recruiter.company}
          </span>
        </div>

        <button
          onClick={onSignOut}
          className="p-2 rounded-md bg-[#FFFFFF] text-gray-500 hover:text-red-600 hover:bg-red-50 border border-[#E2E8F0] transition text-xs flex items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
          title="Sign Out"
        >
          <FaSignOutAlt className="text-xs" />
        </button>
      </header>

      {/* Main Screen Content */}
      <main
        className={`flex-1 flex flex-col min-h-0 relative z-10 bg-[#FAFAFA] ${
          activeSection === "chat" ||
          activeSection === "overview" ||
          activeSection === "projects" ||
          activeSection === "experience" ||
          activeSection === "skills"
            ? "overflow-hidden"
            : "overflow-y-auto"
        }`}
      >
        {renderActiveScreen()}
      </main>

      {/* Bottom Icon Bar with Crisp Borders */}
      <nav className="h-14 bg-[#FFFFFF] border-t border-[#E2E8F0] flex items-center justify-around px-2 shrink-0 z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTrackAction("NAVIGATE_SECTION", { section: item.id });
                onNavigate(item.id);
              }}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-md transition ${
                isActive ? "text-[#7C3AED] font-bold" : "text-gray-400 hover:text-black"
              }`}
            >
              <Icon className={`text-sm ${isActive ? "text-[#7C3AED]" : "text-gray-400"}`} />
              <span className="text-[9px] font-admin-mono mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
