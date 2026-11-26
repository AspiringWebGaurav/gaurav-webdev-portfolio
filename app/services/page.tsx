"use client";

import React from "react";
import { FileText, MessageSquare, Users } from "lucide-react";
import { HubShell, type HubCardItem } from "@/components/hub/HubShell";

const SERVICES_LIST: HubCardItem[] = [
  {
    id: "resume",
    title: "Interactive Resume",
    hostLabel: "resume.services",
    fullHost: "resume.services.gauravpatil.site",
    href: "https://resume.services.gauravpatil.site",
    subtitle: "Verified Candidate Profile",
    description:
      "Verified candidate profile covering production engineering milestones, systems architecture, and instant ATS resume access.",
    ctaLabel: "Open Interactive Resume",
    tone: "blue",
    features: ["Live Timeline", "ATS Export", "Skill Matrix"],
    icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />,
  },
  {
    id: "talk",
    title: "Talk Command Hub",
    hostLabel: "talk.services",
    fullHost: "talk.services.gauravpatil.site",
    href: "https://talk.services.gauravpatil.site",
    subtitle: "Secure Communication & Vault",
    description:
      "Private real-time workspace protected by HMAC-SHA256 OTP authentication, persistent notes, and encrypted file storage.",
    ctaLabel: "Open Talk Hub",
    tone: "violet",
    features: ["2FA OTP Auth", "Private Notes", "File Vault"],
    icon: <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />,
  },
  {
    id: "contact",
    title: "Recruiter Portal",
    hostLabel: "contact.services",
    fullHost: "contact.services.gauravpatil.site",
    href: "https://contact.services.gauravpatil.site",
    subtitle: "Direct Talent Acquisition",
    description:
      "Dedicated verified gateway for hiring managers and recruiters with instant interview scheduling and direct priority routing.",
    ctaLabel: "Open Recruiter Portal",
    tone: "emerald",
    features: ["Verified SLA", "Direct Line", "Scheduling"],
    icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
  },
];

export default function ServicesHubPage() {
  return (
    <HubShell
      portalId="services-hub"
      sectionLabel="Services"
      subtitle="Candidate, Recruiter & Private Portals"
      heroEyebrow="Edge-Verified Portals"
      heroTitle={
        <>
          Direct Portals.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 dark:from-violet-400 dark:via-purple-300 dark:to-indigo-300">
            Session Isolated.
          </span>
        </>
      }
      heroDescription="Dedicated subdomains for verified resume review, direct recruiter scheduling, and private OTP-gated messaging."
      secondaryNav={{
        label: "Apps",
        url: "https://apps.gauravpatil.site",
      }}
      spotlightFill="#a855f7"
      items={SERVICES_LIST}
      columns={3}
      footerLabel="Services & Portals Hub"
      footerLinks={[
        { label: "apps.hub", url: "https://apps.gauravpatil.site" },
        { label: "portfolio", url: "https://gauravpatil.site" },
      ]}
    />
  );
}
