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
  FaBuilding,
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

interface DesktopRecruiterPortalViewProps {
  recruiter: { name: string; company: string; email: string };
  activeSection: string;
  onNavigate: (section: string) => void;
  onSignOut: () => void;
  onTrackAction: (action: string, metadata?: Record<string, unknown>) => void;
}

const navItems = [
  { id: "overview", label: "Overview", icon: FaHome },
  { id: "contact", label: "Contact", icon: FaPhone },
  { id: "chat", label: "Direct Chat", icon: FaComments },
  { id: "resume", label: "Resume", icon: FaFilePdf },
  { id: "experience", label: "Experience", icon: FaBriefcase },
  { id: "projects", label: "Projects", icon: FaLayerGroup },
  { id: "skills", label: "Skills", icon: FaCode },
  { id: "about", label: "Philosophy", icon: FaLightbulb },
];

export function DesktopRecruiterPortalView({
  recruiter,
  activeSection,
  onNavigate,
  onSignOut,
  onTrackAction,
}: DesktopRecruiterPortalViewProps) {
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
    <div className="hidden md:flex flex-col h-full max-h-[100dvh] w-full overflow-hidden select-none bg-[#FAFAFA] text-black">
      {/* 1. Edge-to-Edge Top Navigation Bar */}
      <header className="w-full h-[57px] bg-[#FFFFFF] px-6 sm:px-8 flex items-center justify-between z-20 relative shrink-0 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <span className="font-admin-sans text-[20px] sm:text-[24px] font-extrabold tracking-tight text-black">
            recruiter portal<span className="text-[#7C3AED]">.</span>
          </span>
          <span className="text-[#CBD5E1] font-admin-mono text-sm">/</span>
          <span className="font-admin-mono text-xs uppercase tracking-widest text-[#64748B] font-semibold">
            {activeSection}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-admin-mono text-[#64748B]">
            <FaBuilding className="text-[#7C3AED] text-[11px]" />
            <span className="font-semibold text-black">{recruiter.name}</span>
            <span>·</span>
            <span>{recruiter.company}</span>
          </div>

          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-md bg-[#FFFFFF] hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-[#E2E8F0] text-gray-600 transition text-xs font-admin-mono flex items-center gap-1.5 shadow-2xs"
            title="End Session"
          >
            <FaSignOutAlt className="text-xs" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout with Pinned Shiro Sidebar */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Pinned Left Sidebar */}
        <aside className="w-60 bg-[#FFFFFF] border-r border-[#E2E8F0] shrink-0 flex flex-col justify-between py-4 select-none">
          <nav className="space-y-1 px-3">
            <div className="px-3 py-1 text-[10px] uppercase font-admin-mono tracking-widest text-gray-400 font-semibold mb-2">
              Navigation
            </div>
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
                  className={`w-full px-3 py-2 rounded-md text-xs font-medium transition flex items-center gap-2.5 text-left ${
                    isActive
                      ? "bg-[#F5F3FF] text-[#7C3AED] font-semibold border border-[#DDD6FE]"
                      : "text-gray-600 hover:text-black hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Icon className={`text-xs ${isActive ? "text-[#7C3AED]" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-4 pt-3.5 border-t border-[#E2E8F0] text-[11px] font-admin-mono">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold text-gray-900 whitespace-nowrap text-xs">
                  Available to Hire
                </span>
              </div>
              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                Active
              </span>
            </div>
            <div className="text-[10px] text-gray-500 whitespace-nowrap pl-3.5">
              Remote &bull; Full-Time &bull; Immediate
            </div>
          </div>
        </aside>

        {/* Right Feature Workspace */}
        <main
          className={`flex-1 min-h-0 bg-[#FAFAFA] relative flex flex-col ${
            activeSection === "chat" || activeSection === "overview" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
}
