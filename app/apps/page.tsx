"use client";

import React from "react";
import { Download, Copy, Clock, BookOpen } from "lucide-react";
import { HubShell, type HubCardItem } from "@/components/hub/HubShell";

const PC_APPS: HubCardItem[] = [
  {
    id: "downex",
    title: "Downex",
    hostLabel: "downex.apps",
    fullHost: "downex.apps.gauravpatil.site",
    href: "https://downex.apps.gauravpatil.site",
    external: true,
    subtitle: "High-Speed Download Manager",
    description:
      "Fast Windows download manager with 32-connection acceleration, Chromium browser catch, and silent background updates.",
    ctaLabel: "Open Downex",
    tone: "violet",
    status: {
      label: "Live · v0.0.1",
      state: "live",
    },
    features: ["Tauri v2", "32x Threads", "Auto Catch"],
    icon: <Download className="w-4 h-4 sm:w-5 sm:h-5" />,
  },
  {
    id: "cp",
    title: "CP Engine",
    hostLabel: "cp.apps",
    fullHost: "cp.apps.gauravpatil.site",
    href: "https://cp.apps.gauravpatil.site",
    external: true,
    subtitle: "Win32 Explorer Accelerator",
    description:
      "Native Windows Explorer accelerator. Intercepts Ctrl+C / Ctrl+V and streams files through 4MB unbuffered IOCP workers.",
    ctaLabel: "Open CP Engine",
    tone: "emerald",
    status: {
      label: "Live · v0.0.1",
      state: "live",
    },
    features: ["Win32 Native", "4MB IOCP", "Zero Freeze"],
    icon: <Copy className="w-4 h-4 sm:w-5 sm:h-5" />,
  },
  {
    id: "sm",
    title: "ScheduleMe",
    hostLabel: "sm.apps",
    fullHost: "sm.apps.gauravpatil.site",
    href: "https://sm.apps.gauravpatil.site",
    external: true,
    subtitle: "Windows Power Scheduler",
    description:
      "Lightweight Windows automation tool that lives in the tray, starts cleanly with Windows, and runs timed power actions.",
    ctaLabel: "Open ScheduleMe",
    tone: "amber",
    status: {
      label: "Updating · v0.0.1",
      state: "maintenance",
    },
    features: ["System Tray", "Auto-Start", "Zero Overhead"],
    icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
  },
  {
    id: "gpn",
    title: "GPN Notes",
    hostLabel: "gpn.apps",
    fullHost: "gpn.apps.gauravpatil.site",
    href: "https://gpn.apps.gauravpatil.site",
    external: true,
    subtitle: "Encrypted Local-First Notes",
    description:
      "Private encrypted personal notes with real-time peer sync, offline SQLite storage, and rich TipTap editing.",
    ctaLabel: "Open GPN Notes",
    tone: "cyan",
    status: {
      label: "Web Live",
      state: "live",
    },
    features: ["Web & Desktop", "Yjs CRDT", "E2EE SQLite"],
    icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
  },
];

export default function AppsHubPage() {
  return (
    <HubShell
      portalId="apps-hub"
      sectionLabel="Apps"
      subtitle="Windows Native & Local-First Software"
      heroEyebrow="PC Software & Utilities"
      heroTitle={
        <>
          Built for Windows.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 dark:from-violet-400 dark:via-indigo-300 dark:to-cyan-300">
            Zero Bloat.
          </span>
        </>
      }
      heroDescription="Native Rust, Tauri, and Win32 tools crafted for speed, offline privacy, and quiet system integration."
      secondaryNav={{
        label: "Services",
        url: "https://services.gauravpatil.site",
      }}
      spotlightFill="#8b5cf6"
      items={PC_APPS}
      columns={4}
      footerLabel="PC Apps & Tools Suite"
      footerLinks={[
        { label: "services", url: "https://services.gauravpatil.site" },
        { label: "resume", url: "https://resume.services.gauravpatil.site" },
        { label: "contact", url: "https://contact.services.gauravpatil.site" },
        { label: "talk", url: "https://talk.services.gauravpatil.site" },
      ]}
    />
  );
}
