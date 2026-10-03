"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaScaleBalanced,
  FaUserSecret,
  FaCode,
  FaRobot,
  FaEnvelope,
  FaShieldHalved,
  FaEye,
  FaBullseye,
  FaWhatsapp,
  FaFileLines,
  FaGlobe,
  FaRocket,
  FaEnvelopeOpenText,
} from "react-icons/fa6";
import { IoChatbubbleEllipses } from "react-icons/io5";
import type { LegalDocument } from "@/types/legal";
import { MarkdownLegalRenderer } from "./MarkdownLegalRenderer";

export interface TermsOfServiceContentProps {
  initialData?: Omit<LegalDocument, "draft">;
  initialFocus?: string;
}

function getTermsSectionIcon(id: string) {
  switch (id) {
    case "subdomains-governance":
      return <FaGlobe className="w-4 h-4 text-purple" />;
    case "self-launchpad-terms":
      return <FaRocket className="w-4 h-4 text-purple" />;
    case "contact-portal-terms":
      return <FaEnvelopeOpenText className="w-4 h-4 text-purple" />;
    case "talk-terms":
      return <IoChatbubbleEllipses className="w-5 h-5 text-purple" />;
    case "anonymity":
      return <FaUserSecret className="w-4 h-4 text-purple" />;
    case "ip":
      return <FaCode className="w-4 h-4 text-purple" />;
    case "abuse-mitigation":
      return <FaRobot className="w-4 h-4 text-purple" />;
    case "email-standards":
    case "legal-contact":
      return <FaEnvelope className="w-4 h-4 text-purple" />;
    case "assistant-terms":
      return <IoChatbubbleEllipses className="w-5 h-5 text-purple" />;
    case "whatsapp-terms":
      return <FaWhatsapp className="w-5 h-5 text-[#25D366]" />;
    case "resume-terms":
      return <FaFileLines className="w-4 h-4 text-purple" />;
    case "admin-governance":
      return <FaShieldHalved className="w-4 h-4 text-purple" />;
    default:
      return <FaScaleBalanced className="w-4 h-4 text-purple" />;
  }
}

function TermsContentInner({ initialData, initialFocus }: TermsOfServiceContentProps) {
  const [focusParam, setFocusParam] = useState<string | null>(initialFocus ?? null);

  useEffect(() => {
    if (typeof window !== "undefined" && !initialFocus) {
      const sp = new URLSearchParams(window.location.search);
      const f = sp.get("focus");
      if (f) setFocusParam(f);
    }
  }, [initialFocus]);

  const [filterMode, setFilterMode] = useState<"all" | "subdomains" | "contact" | "assistant" | "whatsapp">(
    focusParam === "subdomains"
      ? "subdomains"
      : focusParam === "whatsapp"
      ? "whatsapp"
      : focusParam === "assistant"
      ? "assistant"
      : focusParam === "contact"
      ? "contact"
      : "all"
  );
  const [highlightedSection, setHighlightedSection] = useState<string | null>(
    focusParam === "subdomains"
      ? "subdomains-governance"
      : focusParam === "whatsapp"
      ? "whatsapp-terms"
      : focusParam === "assistant"
      ? "assistant-terms"
      : focusParam === "contact"
      ? "anonymity"
      : null
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.replace("#", "");
    const targetId =
      hash ||
      (focusParam === "subdomains"
        ? "subdomains-governance"
        : focusParam === "whatsapp"
        ? "whatsapp-terms"
        : focusParam === "assistant"
        ? "assistant-terms"
        : focusParam === "contact"
        ? "anonymity"
        : null);

    if (targetId) {
      setHighlightedSection(targetId);

      const scrollToTarget = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };

      // Multi-stage timers ensure exact positioning across mobile and desktop layout hydrations
      const t1 = setTimeout(scrollToTarget, 80);
      const t2 = setTimeout(scrollToTarget, 300);
      const t3 = setTimeout(scrollToTarget, 650);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [focusParam]);

  const handleTabSelect = (mode: "all" | "subdomains" | "contact" | "assistant" | "whatsapp", targetId?: string) => {
    setFilterMode(mode);
    if (targetId) {
      setHighlightedSection(targetId);
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] dark:bg-black-100 text-slate-900 dark:text-white relative overflow-hidden py-10 sm:py-16 px-5 sm:px-10 lg:px-16 xl:px-24 w-full">
      {/* Background Grid */}
      <div className="h-full w-full bg-[#FAFAFA] dark:bg-black-100 bg-grid-black/[0.025] dark:bg-grid-white/[0.03] absolute top-0 left-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-black-100 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      <div className="w-full mx-auto max-w-4xl lg:max-w-none">
        {/* Top Controls: Back Link & Filter Mode Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sm:mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#7C3AED] dark:text-purple hover:text-slate-950 dark:hover:text-white transition-colors duration-200 group"
          >
            <FaArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Portfolio
          </Link>

          {/* Dynamic View Mode Tabs */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] rounded-xl p-1 text-xs gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => handleTabSelect("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === "all"
                  ? "bg-slate-950 hover:bg-black text-white dark:bg-purple dark:text-black font-semibold shadow-sm"
                  : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FaEye className="w-3 h-3" />
              <span>Full Terms</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect("subdomains", "subdomains-governance")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === "subdomains"
                  ? "bg-[#7C3AED] text-white font-semibold shadow-sm shadow-[#7C3AED]/40"
                  : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FaGlobe className="w-3 h-3 text-purple-200 dark:text-[#CBACF9]" />
              <span>All Subdomains</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect("contact", "anonymity")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === "contact"
                  ? "bg-[#7C3AED] text-white font-semibold shadow-sm shadow-[#7C3AED]/40"
                  : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FaBullseye className="w-3 h-3 text-purple-200 dark:text-[#CBACF9]" />
              <span>Contact Form Only</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect("assistant", "assistant-terms")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === "assistant"
                  ? "bg-[#7C3AED] text-white font-semibold shadow-sm shadow-[#7C3AED]/40"
                  : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <IoChatbubbleEllipses className="w-3 h-3 text-purple-200 dark:text-[#CBACF9]" />
              <span>Personal Assistant (AI)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect("whatsapp", "whatsapp-terms")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === "whatsapp"
                  ? "bg-[#25D366] text-black font-semibold shadow-sm shadow-[#25D366]/40"
                  : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FaWhatsapp className={`w-3.5 h-3.5 ${filterMode === "whatsapp" ? "text-black" : "text-[#25D366]"}`} />
              <span>WhatsApp Terms</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mb-10 sm:mb-12">
          <p className="uppercase tracking-widest text-xs text-[#7C3AED] dark:text-purple font-medium mb-3">
            Legal &amp; Operating Standards
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 font-mono">
            <span>Version: {initialData?.publishedVersion || "1.1.0"}</span>
            <span>•</span>
            <span>Original Effective: {initialData?.effectiveDate || "January 1, 2026"}</span>
            <span>•</span>
            <span className="text-[#7C3AED] dark:text-purple font-semibold">Last Updated: {initialData?.lastUpdatedDate || "October 3, 2026"}</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Jurisdiction: {initialData?.jurisdiction || "Standard Global"}</span>
          </div>

          {filterMode === "subdomains" && (
            <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-[#7C3AED]/15 border border-purple-200 dark:border-[#7C3AED]/30 text-xs text-slate-700 dark:text-neutral-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <FaGlobe className="w-4 h-4 text-[#7C3AED] dark:text-[#CBACF9] shrink-0" />
                <span>
                  Filtering active: Spotlighting unified architecture &amp; operating governance across all subdomains (gauravpatil.site, self, contact, resume, talk, and admin).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="text-[#7C3AED] dark:text-purple hover:underline text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                View full terms
              </button>
            </div>
          )}

          {filterMode === "contact" && (
            <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-[#7C3AED]/15 border border-purple-200 dark:border-[#7C3AED]/30 text-xs text-slate-700 dark:text-neutral-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <FaBullseye className="w-4 h-4 text-[#7C3AED] dark:text-[#CBACF9] shrink-0" />
                <span>
                  Filtering active: Spotlighting terms governing Contact Form submissions, Confidentiality Rights, and Communication Standards.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="text-[#7C3AED] dark:text-purple hover:underline text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                View full terms
              </button>
            </div>
          )}

          {filterMode === "assistant" && (
            <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-[#7C3AED]/15 border border-purple-200 dark:border-[#7C3AED]/30 text-xs text-slate-700 dark:text-neutral-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <IoChatbubbleEllipses className="w-4 h-4 text-[#7C3AED] dark:text-[#CBACF9] shrink-0" />
                <span>
                  Filtering active: Spotlighting terms of service, AI accuracy disclaimer, and acceptable use standards for Gaurav Personal Assistant (Beta).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="text-[#7C3AED] dark:text-purple hover:underline text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                View full terms
              </button>
            </div>
          )}

          {filterMode === "whatsapp" && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-[#25D366]/15 border border-emerald-200 dark:border-[#25D366]/30 text-xs text-slate-700 dark:text-neutral-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <FaWhatsapp className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>
                  Filtering active: Spotlighting terms governing WhatsApp Recruiter Communication, Anti-Spam Quotas, and Instant Opt-Out Rights.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="text-[#25D366] hover:underline text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                View full terms
              </button>
            </div>
          )}
        </header>

        {/* Content Box */}
        <div className="w-full rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none backdrop-blur-xl p-6 sm:p-10 lg:p-12 space-y-8 text-slate-600 dark:text-neutral-300 leading-relaxed text-sm sm:text-base">
          {initialData?.sections && initialData.sections.length > 0 ? (
            initialData.sections.map((section) => {
              const isVisible =
                filterMode === "all" ||
                (filterMode === "subdomains" &&
                  (section.id === "subdomains-governance" ||
                    section.id === "self-launchpad-terms" ||
                    section.id === "contact-portal-terms" ||
                    section.id === "resume-terms" ||
                    section.id === "talk-terms" ||
                    section.id === "admin-governance")) ||
                (filterMode === "contact" &&
                  (section.filterMode === "contact" ||
                    section.id === "anonymity" ||
                    section.id === "abuse-mitigation" ||
                    section.id === "email-standards" ||
                    section.id === "contact-portal-terms")) ||
                (filterMode === "assistant" &&
                  (section.filterMode === "assistant" || section.id === "assistant-terms")) ||
                (filterMode === "whatsapp" &&
                  (section.filterMode === "whatsapp" || section.id === "whatsapp-terms"));

              if (!isVisible) return null;

              const isHighlighted =
                highlightedSection === section.id ||
                (filterMode === "subdomains" &&
                  (section.id === "subdomains-governance" ||
                    section.id === "self-launchpad-terms" ||
                    section.id === "contact-portal-terms" ||
                    section.id === "resume-terms" ||
                    section.id === "talk-terms" ||
                    section.id === "admin-governance")) ||
                (filterMode === "contact" &&
                  (section.filterMode === "contact" || section.id === "anonymity" || section.id === "contact-portal-terms")) ||
                (filterMode === "assistant" &&
                  (section.filterMode === "assistant" || section.id === "assistant-terms")) ||
                (filterMode === "whatsapp" &&
                  (section.filterMode === "whatsapp" || section.id === "whatsapp-terms"));

              const isWhatsappTheme = section.filterMode === "whatsapp" || section.id === "whatsapp-terms";

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className={`space-y-4 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
                    isHighlighted
                      ? isWhatsappTheme
                        ? "bg-[#25D366]/10 border border-[#25D366]/50 shadow-[0_0_30px_rgba(37,211,102,0.15)] ring-1 ring-[#25D366]/50"
                        : "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-[#7C3AED]/50"
                      : section.filterMode !== "all"
                      ? "border border-white/[0.06] bg-white/[0.02]"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                      {getTermsSectionIcon(section.id)}
                      <span>{section.heading}</span>
                    </h2>
                    {isHighlighted && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isWhatsappTheme
                            ? "bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40"
                            : filterMode === "subdomains" || section.id.includes("subdomain") || section.id.includes("launchpad")
                            ? "bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50"
                            : "bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50"
                        }`}
                      >
                        {isWhatsappTheme
                          ? "WhatsApp Term"
                          : section.id === "subdomains-governance" || section.id === "self-launchpad-terms" || section.id === "talk-terms"
                          ? "Subdomain Term"
                          : section.id === "resume-terms"
                          ? "Resume Portal Term"
                          : section.filterMode === "contact" || section.id === "contact-portal-terms"
                          ? "Contact Term"
                          : "Assistant Deep-Dive"}
                      </span>
                    )}
                  </div>
                  <MarkdownLegalRenderer content={section.contentMarkdown} />
                </section>
              );
            })
          ) : (
            <>
              {/* Section 1: Acceptance */}
          {filterMode === "all" && (
            <section id="acceptance" className="space-y-3 scroll-mt-24 sm:scroll-mt-32">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <FaScaleBalanced className="w-4 h-4 text-purple" />
                <span>1. Acceptance of Terms &amp; Universal Architecture Commitment</span>
              </h2>
              <p>
                By accessing, browsing, submitting inquiries, authenticating, or otherwise interacting with <span className="text-purple font-semibold">Gaurav Portfolio</span> and its verified ecosystem of subdomains—including <code className="text-purple font-mono">gauravpatil.site</code>, <code className="text-purple font-mono">self.gauravpatil.site</code>, <code className="text-purple font-mono">contact.gauravpatil.site</code>, <code className="text-purple font-mono">resume.gauravpatil.site</code>, <code className="text-purple font-mono">talk.gauravpatil.site</code>, and <code className="text-purple font-mono">admin.gauravpatil.site</code>—you acknowledge and agree to be bound by these Terms of Service and all related policies. This platform commits to a strict 
                <strong className="text-white"> Mobile-First 10/10 Production Standard</strong>, ensuring zero horizontal overflow, 
                fluid responsive typography, touch-ergonomic 44px hit targets, accessible reduced-motion fallbacks, and single-view contact and showcase workflows 
                across all modern smartphones, tablets, and desktop workstations. If you do not agree with any provision, you may discontinue viewing or utilizing this platform.
              </p>
            </section>
          )}

          {/* Section 2: Universal Subdomain Governance */}
          {(filterMode === "all" || filterMode === "subdomains") && (
            <section
              id="subdomains-governance"
              className={`space-y-4 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
                highlightedSection === "subdomains-governance" || filterMode === "subdomains"
                  ? "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-[#7C3AED]/50"
                  : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <FaGlobe className="w-4 h-4 text-purple" />
                  <span>2. Universal Subdomain Architecture &amp; Operating Governance</span>
                </h2>
                {(highlightedSection === "subdomains-governance" || filterMode === "subdomains") && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50">
                    Subdomain Term
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                To deliver optimal security, high performance, and purpose-driven user experiences, the Gaurav Portfolio digital infrastructure is partitioned into dedicated, edge-routed subdomains under <code className="text-purple font-mono">gauravpatil.site</code>. Each subdomain operates with explicit security boundaries, tailored routing rules, and isolated session models:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-neutral-300">
                <li><strong className="text-white">gauravpatil.site (Flagship Ecosystem Hub):</strong> Primary web presence showcasing production case studies, interactive Three.js 3D Globe models, engineering articles, client testimonials, and central inquiry gateways.</li>
                <li><strong className="text-white">self.gauravpatil.site (Interactive Projects Launchpad):</strong> Ultra-fast, single-view zero-scroll launchpad aggregating all 14 production web applications, SaaS tools, and client platforms with instant outbound redirection.</li>
                <li><strong className="text-white">contact.gauravpatil.site (Recruiter &amp; Executive Contact Gateway):</strong> Focused, zero-distraction communications portal engineered specifically for executive recruiters, talent acquisition partners, and enterprise clients.</li>
                <li><strong className="text-white">resume.gauravpatil.site (Verified Candidate Credentials Portal):</strong> Isolated candidate verification portal featuring interactive credentials, verified PDF resumes, and 30-minute cryptographic session lifecycles.</li>
                <li><strong className="text-white">talk.gauravpatil.site (Talk Command Hub):</strong> Real-time command center and interactive communication interface with authenticated session controls and rate-limited API access.</li>
                <li><strong className="text-white">admin.gauravpatil.site (Superadmin CMS &amp; Governance Cockpit):</strong> Strictly isolated administrative zone restricted to authorized Superadmins via Google OAuth 2.0 PKCE, salted HMAC-SHA256 2FA OTP, and zero-lockout IP security controls.</li>
              </ul>
            </section>
          )}

          {/* Section 3: Interactive Projects Launchpad (self.gauravpatil.site) */}
          {(filterMode === "all" || filterMode === "subdomains") && (
            <section
              id="self-launchpad-terms"
              className={`space-y-4 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
                highlightedSection === "self-launchpad-terms" || filterMode === "subdomains"
                  ? "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-[#7C3AED]/50"
                  : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <FaRocket className="w-4 h-4 text-purple" />
                  <span>3. Interactive Projects Launchpad (self.gauravpatil.site) &amp; Outbound Ecosystem</span>
                </h2>
                {(highlightedSection === "self-launchpad-terms" || filterMode === "subdomains") && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50">
                    Launchpad Term
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                The official interactive showcase and projects directory is hosted on <code className="text-purple font-mono">self.gauravpatil.site</code>. Use of the launchpad is subject to the following terms and operating conditions:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-neutral-300">
                <li><strong className="text-white">Single-View Zero-Scroll Constraint:</strong> <code className="text-purple font-mono">self.gauravpatil.site</code> is engineered under an uncompromising zero-vertical-scroll constraint (<code className="text-purple font-mono">h-[100dvh] overflow-hidden</code>) across all viewports (320px mobile to 4K desktop). Visitors agree not to tamper with or inject styles that disrupt this architectural layout.</li>
                <li><strong className="text-white">Outbound Redirection to Live Deployments:</strong> The launchpad serves as an authoritative directory redirecting visitors to external live applications (<code className="text-purple font-mono">send2me.eu.cc</code>, <code className="text-purple font-mono">deggy.com</code>, <code className="text-purple font-mono">shopit.eu.cc</code>, <code className="text-purple font-mono">promptora.eu.cc</code>, <code className="text-purple font-mono">nexuschat.eu.cc</code>, <code className="text-purple font-mono">cloudbox.eu.cc</code>, <code className="text-purple font-mono">zenithbank.eu.cc</code>, <code className="text-purple font-mono">devpulse.eu.cc</code>, <code className="text-purple font-mono">streamflow.eu.cc</code>, <code className="text-purple font-mono">crypto-tracker.eu.cc</code>, <code className="text-purple font-mono">taskflow.eu.cc</code>, <code className="text-purple font-mono">codecraft.eu.cc</code>, <code className="text-purple font-mono">eventhub.eu.cc</code>, <code className="text-purple font-mono">fitpulse.eu.cc</code>, and related platforms).</li>
                <li><strong className="text-white">Third-Party Hosting &amp; Sandbox Disclaimers:</strong> External application links route directly to independent production environments, third-party cloud infrastructure (e.g. Vercel, independent cloud VPS), and external database sandboxes. Gaurav Patil does not warrant third-party hosting availability, uptime, latency, or data entered into external sandbox databases beyond <code className="text-purple font-mono">*.gauravpatil.site</code>.</li>
                <li><strong className="text-white">Telemetry &amp; Zero-Tracking Guarantee:</strong> <code className="text-purple font-mono">self.gauravpatil.site</code> does not deploy invasive tracking scripts, commercial ad pixels, or cross-site tracking cookies. Dynamic state changes reflect purely within client-side memory.</li>
              </ul>
            </section>
          )}

          {/* Section 4: Recruiter Contact Portal */}
          {(filterMode === "all" || filterMode === "subdomains" || filterMode === "contact") && (
            <section
              id="contact-portal-terms"
              className={`space-y-4 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
                highlightedSection === "contact-portal-terms" || filterMode === "contact" || filterMode === "subdomains"
                  ? "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-[#7C3AED]/50"
                  : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <FaEnvelopeOpenText className="w-4 h-4 text-purple" />
                  <span>4. Recruiter &amp; Executive Contact Gateway (contact.gauravpatil.site)</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50">
                  {filterMode === "contact" ? "Contact Form Term" : "Subdomain Term"}
                </span>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                The dedicated executive contact portal at <code className="text-purple font-mono">contact.gauravpatil.site</code> is engineered to provide recruiters and prospective enterprise partners with a streamlined, confidential communication pathway:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-neutral-300">
                <li><strong className="text-white">Authorized Scope of Use:</strong> Reserved for bona fide recruitment inquiries, executive talent discussions, technical consulting proposals, and verified business collaboration.</li>
                <li><strong className="text-white">Cloudflare Turnstile Verification:</strong> Public inquiry endpoints are guarded by Cloudflare Turnstile cryptographic challenges to prevent automated form submission, payload injection, and spam.</li>
                <li><strong className="text-white">Transactional Brevo API Pipeline:</strong> Messages are delivered through authenticated Brevo API transactions with strict SPF, DKIM, and DMARC alignment originating from <code className="text-purple font-mono">gauravpatil.site</code>.</li>
                <li><strong className="text-white">Zero Commercial Spam Guarantee:</strong> Submitted contact details are never enrolled in commercial marketing sequences or sold to third-party data brokers.</li>
              </ul>
            </section>
          )}

          {/* Section 5: Verified Interactive Resume Portal */}
          {(filterMode === "all" || filterMode === "subdomains") && (
            <section
              id="resume-terms"
              className={`space-y-4 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
                highlightedSection === "resume-terms" || filterMode === "subdomains"
                  ? "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-[#7C3AED]/50"
                  : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <FaFileLines className="w-4 h-4 text-purple" />
                  <span>5. Verified Interactive Resume Portal (resume.gauravpatil.site) Terms &amp; Security</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50">
                  Resume Portal Term
                </span>
              </div>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-neutral-300">
                <li><strong className="text-white">Dedicated Domain Isolation:</strong> <code className="text-purple font-mono">resume.gauravpatil.site</code> is an isolated candidate presentation gateway engineered specifically for recruiters, engineering leaders, and hiring managers. Direct access from the main domain <code className="text-purple font-mono">/resume</code> is automatically redirected to <code className="text-purple font-mono">https://resume.gauravpatil.site</code>.</li>
                <li><strong className="text-white">Cryptographic 30-Minute Inactivity Expiry:</strong> For security and privacy, unlocked resume sessions are bound to an encrypted HMAC session token with an enforced 30-minute inactivity time-to-live (TTL). Once expired or explicitly revoked via the <strong>Log out</strong> trigger, memory caches and session access are atomically purged.</li>
                <li><strong className="text-white">Anti-Abuse &amp; Cloudflare Turnstile Verification:</strong> Public mutation endpoints and access gates are protected by Cloudflare Turnstile to prevent automated scraping, bot attacks, and denial of service.</li>
                <li><strong className="text-white">Dynamic Administrative Governance:</strong> Resume availability is dynamically controlled by Gaurav Patil via administrative lifecycle triggers (<code className="text-purple font-mono">active</code>, <code className="text-purple font-mono">hired</code>, <code className="text-purple font-mono">suspended</code>). When marked hired or suspended, the portal presents an authoritative executive status badge in lieu of full candidate credentials.</li>
                <li><strong className="text-white">Authorized Candidate Evaluation:</strong> Information and case studies presented on <code className="text-purple font-mono">resume.gauravpatil.site</code> are provided solely for professional recruitment evaluation, hiring, and technical verification. Redistribution, commercial scraping, or unauthorized disclosure of candidate contact details is strictly prohibited.</li>
              </ul>
            </section>
          )}

          {/* Section 6: Talk Command Hub */}
          {(filterMode === "all" || filterMode === "subdomains") && (
            <section
              id="talk-terms"
              className={`space-y-4 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
                highlightedSection === "talk-terms" || filterMode === "subdomains"
                  ? "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-[#7C3AED]/50"
                  : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <IoChatbubbleEllipses className="w-5 h-5 text-purple" />
                  <span>6. Talk Command Hub (talk.gauravpatil.site) Real-Time Gateway</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50">
                  Subdomain Term
                </span>
              </div>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-neutral-300">
                <li><strong className="text-white">Authenticated Session Access:</strong> Access requires valid session verification via secure cookies and time-limited tokens. Unauthorized attempts to bypass authentication or probe internal endpoints are strictly prohibited.</li>
                <li><strong className="text-white">Real-Time Stream Isolation:</strong> Messages and command executions are isolated per session with strict rate-limiting to preserve server stability and prevent resource exhaustion.</li>
                <li><strong className="text-white">Professional Code of Conduct:</strong> All communications conducted through <code className="text-purple font-mono">talk.gauravpatil.site</code> must adhere to professional communication standards. Abusive, disruptive, or automated exploitation scripts will result in immediate session termination and IP blocking.</li>
              </ul>
            </section>
          )}

          {/* Section 7: Administrative Subsystem Governance */}
          {(filterMode === "all" || filterMode === "subdomains") && (
            <section id="admin-governance" className="space-y-3 scroll-mt-24 sm:scroll-mt-32">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <FaShieldHalved className="w-4 h-4 text-purple" />
                <span>7. Administrative Subsystem Isolation &amp; 2FA Governance</span>
              </h2>
              <p>
                The administrative panel (<code className="text-purple font-mono">/admin/*</code> and <code className="text-purple font-mono">admin.gauravpatil.site</code>) is an isolated workspace strictly restricted to authorized Superadmins. Administrative access requires Google OAuth 2.0 PKCE, salted HMAC-SHA256 Two-Factor Authentication (OTP), and zero-lockout IP security verification. Administrative access and data operations are governed separately under the <Link href="/admin/terms" prefetch={false} className="text-purple hover:underline font-semibold">Administrator Terms of Service</Link>.
              </p>
            </section>
          )}

          {/* Section 8: Anonymity & Confidentiality (Spotlighted) */}
          <section
            id="anonymity"
            className={`space-y-3 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
              highlightedSection === "anonymity" || filterMode === "contact"
                ? "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] ring-1 ring-[#7C3AED]/50"
                : "border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <FaUserSecret className="w-4 h-4 text-purple" />
                <span>8. Right to Confidential &amp; Anonymous Communication</span>
              </h2>
              {(highlightedSection === "anonymity" || filterMode === "contact") && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50">
                  Contact Form Term
                </span>
              )}
            </div>
            <p>
              Users and prospective partners are welcome to initiate contact anonymously:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-white">Confidential Inquiries:</strong> Submitting an inquiry with the default &ldquo;Anonymous / Confidential&rdquo; role is fully permitted and legally respected as preliminary communication.
              </li>
              <li>
                <strong className="text-white">Non-Disclosure Friendly:</strong> Mutual non-disclosure agreements (NDAs) can be executed upon request prior to exchanging proprietary project details.
              </li>
            </ul>
          </section>

          {/* Section 9: Intellectual Property */}
          {filterMode === "all" && (
            <section id="ip" className="space-y-3 scroll-mt-24 sm:scroll-mt-32">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <FaCode className="w-4 h-4 text-purple" />
                <span>9. Intellectual Property &amp; Engineering Architecture</span>
              </h2>
              <p>
                All original visual design systems, dark luxury glassmorphic layouts, Three.js 3D Globe implementations, and full-stack software architectures showcased on this platform are the intellectual property of <strong className="text-white">Gaurav Patil</strong>. Client deliverables and bespoke software engineering codebases are transferred strictly per individual written engagement agreements upon milestone completion.
              </p>
            </section>
          )}

          {/* Section 10: Automated Abuse Mitigation */}
          <section
            id="abuse-mitigation"
            className={`space-y-3 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
              highlightedSection === "abuse-mitigation" || filterMode === "contact"
                ? "bg-white/[0.04] border border-white/[0.15]"
                : "border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <FaRobot className="w-4 h-4 text-purple" />
                <span>10. Automated Abuse Mitigation &amp; Cloudflare Verification</span>
              </h2>
              {filterMode === "contact" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.08] text-neutral-300 border border-white/[0.15]">
                  Security Protocol
                </span>
              )}
            </div>
            <p>
              To maintain high uptime and system integrity, public mutation endpoints (such as the contact form) are protected by <strong className="text-white">Cloudflare Turnstile</strong>. Automated scraping, malicious payload injection, bot spam, and denial-of-service attempts are strictly prohibited and actively mitigated.
            </p>
          </section>

          {/* Section 11: Transactional Emails */}
          <section
            id="email-standards"
            className={`space-y-3 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
              highlightedSection === "email-standards" || filterMode === "contact"
                ? "bg-white/[0.04] border border-white/[0.15]"
                : "border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <FaEnvelope className="w-4 h-4 text-purple" />
                <span>11. Transactional Communication Standards &amp; Mandatory Legal Update Announcements</span>
              </h2>
              {filterMode === "contact" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.08] text-neutral-300 border border-white/[0.15]">
                  Communication Policy
                </span>
              )}
            </div>
            <p>
              All transactional emails, contact receipts, security alerts, and mandatory policy notices are dispatched from the authenticated server domain <span className="text-purple font-mono">gauravpatil.site</span> via Brevo API. Official sender identities include <code className="text-purple font-mono">hello@gauravpatil.site</code> (inquiries and auto-replies), <code className="text-purple font-mono">security@gauravpatil.site</code> (authentication alerts and audit logs), <code className="text-purple font-mono">help@gauravpatil.site</code> (support), and <code className="text-purple font-mono">no-reply@gauravpatil.site</code> (system OTPs and automated legal announcements). A strict zero-spam guarantee is maintained: submitted contact emails are never enrolled in promotional marketing sequences.
            </p>
            <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs sm:text-sm">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple" />
                Mandatory Legal &amp; Policy Update Announcement Notice
              </h3>
              <ul className="list-disc list-inside space-y-1.5 pl-1 text-neutral-300">
                <li>
                  <strong className="text-white">Automatic Registration for Policy Updates:</strong> Submitting an email address through any service of this portfolio &mdash; including Contact Form inquiries, Live Chat email OTP authentication, support requests, or direct communications &mdash; registers that address to receive mandatory policy, legal, and security announcements in accordance with your acceptance of use.
                </li>
                <li>
                  <strong className="text-white">Mandatory Non-Marketing Announcements:</strong> When material updates are made to the public Terms of Service, Privacy Policy, or critical security procedures, automated informational notices are broadcast directly from <code className="text-purple font-mono">no-reply@gauravpatil.site</code> or <code className="text-purple font-mono">security@gauravpatil.site</code>. These communications are strictly non-commercial, transactional legal disclosures and contain zero marketing or promotional sequences.
                </li>
                <li>
                  <strong className="text-white">No Unsubscribe &amp; Immunity from Automated Client-Level Unsubscribe:</strong> Because legal update announcements are mandatory contractual disclosures required to maintain operational and legal transparency for all users who have interacted with Gaurav Portfolio or its authenticated services, <strong className="text-white">no unsubscribe or opt-out option is provided</strong>. Even if automated email client features (such as Google/Gmail&apos;s automatic &ldquo;Unsubscribe&rdquo; header or client-level spam filters) are invoked, you acknowledge and agree that you will continue to receive mandatory legal, policy, and security notices as per this policy and your acceptance of use.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 12: Personal Assistant Terms */}
          <section
            id="assistant-terms"
            className={`space-y-6 p-4 sm:p-7 rounded-2xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
              highlightedSection === "assistant-terms" || filterMode === "assistant"
                ? "bg-[#7C3AED]/10 border border-[#7C3AED]/50 shadow-[0_0_35px_rgba(124,58,237,0.18)] ring-1 ring-[#7C3AED]/50"
                : "border border-transparent"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                <IoChatbubbleEllipses className="w-5 h-5 text-purple" />
                <span>12. Personal Assistant (Beta) Operational Terms &amp; AI Disclaimer</span>
              </h2>
              {(highlightedSection === "assistant-terms" || filterMode === "assistant") && (
                <span className="px-3 py-1 rounded-full text-[10.5px] font-mono font-bold bg-[#7C3AED]/30 text-[#CBACF9] border border-[#7C3AED]/50">
                  Assistant Deep-Dive &amp; Learn More
                </span>
              )}
            </div>

            {/* Subsection 1: Purpose & Interactive Capabilities */}
            <div className="space-y-3 bg-white/[0.02] p-4 sm:p-5 rounded-xl border border-white/[0.06]">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple" />
                Purpose &amp; Scope of Gaurav Assistant &amp; Live Chat
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                The Personal Assistant and Live Chat system are engineered to provide an interactive, personal communication channel with Gaurav Patil. It provides direct, automated insights into engineering benchmarks, architecture patterns, and project deliverables, while facilitating immediate 1-to-1 live communication.
              </p>
            </div>

            {/* Subsection 2: Live Chat Real-Time & Fallback Delivery Architecture */}
            <div className="space-y-3 bg-white/[0.02] p-4 sm:p-5 rounded-xl border border-white/[0.06]">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live Chat Real-Time Dispatch &amp; Notification Architecture
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                When you initiate a conversation through <strong className="text-white">Live Chat with Gaurav</strong>, the backend operates a hybrid real-time communication pipeline:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-neutral-300">
                <li>
                  <strong className="text-white">Active Online Streaming:</strong> If Gaurav is actively online and connected to the session, incoming messages arrive instantly in real-time.
                </li>
                <li>
                  <strong className="text-white">Automated Inbox Dispatch:</strong> If Gaurav is away or offline, the server instantaneously generates and dispatches an automated lead notification directly to Gaurav&apos;s private inbox containing your verified sender details and full message transcript with 1-click direct response routing.
                </li>
                <li>
                  <strong className="text-white">Single-Use 6-Digit Email Verification:</strong> To eliminate spam and protect system resources, access to Live Chat requires a single-use 6-digit OTP code dispatched exclusively from <code className="text-purple font-mono">no-reply@gauravpatil.site</code>. Verification codes expire in 5 minutes.
                </li>
                <li>
                  <strong className="text-white">4-Hour Active Session Token:</strong> Once verified, an encrypted session remains active for 4 hours. You may close and reopen the chat window anytime within this window without re-authenticating. Visitors may explicitly terminate their session at any time using the <strong className="text-white">Sign out</strong> button in the top-right header.
                </li>
              </ul>
            </div>

            {/* Subsection 3: Custom Mail Domain Support */}
            <div className="space-y-3 bg-white/[0.02] p-4 sm:p-5 rounded-xl border border-white/[0.06]">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple" />
                Official Verified Senders &amp; Support Pipeline
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                All communications, support tickets, and contact verification flows originate exclusively from the authenticated domain <span className="text-purple font-mono font-semibold">gauravpatil.site</span>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-1">
                  <span className="text-xs sm:text-sm text-purple font-mono font-bold">hello@gauravpatil.site</span>
                  <p className="text-xs text-neutral-400">General portfolio inquiries, recruiter outreach, and direct developer contact.</p>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-1">
                  <span className="text-xs sm:text-sm text-purple font-mono font-bold">help@gauravpatil.site</span>
                  <p className="text-xs text-neutral-400">Assistant technical support, bug reports, and portfolio navigation guidance.</p>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-1">
                  <span className="text-xs sm:text-sm text-purple font-mono font-bold">security@gauravpatil.site</span>
                  <p className="text-xs text-neutral-400">Security notifications, 2FA OTP codes, and vulnerability disclosure reports.</p>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-1">
                  <span className="text-xs sm:text-sm text-purple font-mono font-bold">no-reply@gauravpatil.site</span>
                  <p className="text-xs text-neutral-400">Automated Live Chat OTP passcodes, system receipts, and non-interactive alerts.</p>
                </div>
              </div>
            </div>

            {/* Subsection 4: AI Disclaimer & Acceptable Use */}
            <div className="space-y-3 bg-white/[0.02] p-4 sm:p-5 rounded-xl border border-white/[0.06]">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple" />
                AI Accuracy Disclaimer &amp; Acceptable Use
              </h3>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-neutral-300">
                <li>
                  <strong className="text-white">Generative Limitations:</strong> While tuned for accuracy, automated assistant responses may occasionally produce incomplete or summarized statements. Official portfolio source code and direct communication with Gaurav remain authoritative benchmarks.
                </li>
                <li>
                  <strong className="text-white">Acceptable Use:</strong> Visitors agree not to attempt prompt-injections, reverse-engineer underlying system prompts, extract internal configuration, or send abusive payloads.
                </li>
                <li>
                  <strong className="text-white">Continuous Beta Evolution:</strong> The assistant is under active development and may undergo live feature updates or brief maintenance windows without notice.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 13: WhatsApp Recruiter & Visitor Communication Channel */}
          {(filterMode === "all" || filterMode === "whatsapp") && (
            <section
              id="whatsapp-terms"
              className={`space-y-4 p-4 sm:p-6 rounded-xl transition-all duration-300 scroll-mt-24 sm:scroll-mt-32 ${
                highlightedSection === "whatsapp-terms" || filterMode === "whatsapp"
                  ? "bg-[#25D366]/10 border border-[#25D366]/50 shadow-[0_0_30px_rgba(37,211,102,0.15)] ring-1 ring-[#25D366]/50"
                  : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <FaWhatsapp className="w-5 h-5 text-[#25D366]" />
                  <span>13. WhatsApp Recruiter &amp; Visitor Communication Channel</span>
                </h2>
                {(highlightedSection === "whatsapp-terms" || filterMode === "whatsapp") && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40">
                    WhatsApp Term
                  </span>
                )}
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed">
                Gaurav Portfolio provides an official Meta WhatsApp Business Cloud API integration allowing recruiters, hiring managers, and prospective clients to connect directly with Gaurav Patil. Use of this channel is subject to the following terms:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                    Authorized Professional Scope
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    This WhatsApp channel is exclusively intended for professional recruitment discussions, job opportunities, engineering inquiries, and technical collaboration proposals. Promotional spam, harassment, or unsolicited marketing is strictly prohibited.
                  </p>
                </div>

                <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                    Message Quota &amp; Anti-Spam Safeguards
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    To prevent spam and protect direct communication channels, sessions are allocated up to 3 direct inquiry message slots. Messages are delivered instantaneously to Gaurav Patil in real time with 1-click email response triggers.
                  </p>
                </div>

                <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                    Unsubscribe &amp; Immediate Data Erasure
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    You may opt out at any time by replying <code className="text-[#25D366] font-mono font-semibold">STOP</code>. Replying STOP immediately unsubscribes your number and permanently erases your conversation history from the database (GDPR Right to Erasure). You can resume anytime by replying <code className="text-[#25D366] font-mono font-semibold">START</code>.
                  </p>
                </div>

                <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                    Data Portability &amp; Self-Service Export
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Under GDPR Article 20, you retain full ownership of your conversation records. You can type <code className="text-[#25D366] font-mono font-semibold">/exportmydata</code> anytime in WhatsApp to instantly receive a cryptographically signed ZIP archive with your complete records (links are strictly time-limited to 10 minutes for privacy).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-neutral-400">
                  Looking for detailed data protection specifics?
                </span>
                <Link
                  href="/privacy?focus=whatsapp#whatsapp-data-export"
                  className="text-[#25D366] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>View WhatsApp Privacy &amp; Data Export Policy</span> &rarr;
                </Link>
              </div>
            </section>
          )}

          {/* Section 14: Limitation of Liability */}
          <section id="liability" className="space-y-3 scroll-mt-24 sm:scroll-mt-32">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
              <FaScaleBalanced className="w-4 h-4 text-purple" />
              <span>14. Limitation of Liability &amp; Disclaimers</span>
            </h2>
            <p>
              This website, its subdomains (<code className="text-purple font-mono">gauravpatil.site</code>, <code className="text-purple font-mono">self.gauravpatil.site</code>, <code className="text-purple font-mono">contact.gauravpatil.site</code>, <code className="text-purple font-mono">resume.gauravpatil.site</code>, <code className="text-purple font-mono">talk.gauravpatil.site</code>, <code className="text-purple font-mono">admin.gauravpatil.site</code>), and its demonstrative artifacts are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. In no event shall Gaurav Patil be liable for indirect, incidental, or consequential damages resulting from the use of this website.
            </p>
          </section>

          {/* Section 15: Legal Contact */}
          <section id="legal-contact" className="space-y-4 scroll-mt-24 sm:scroll-mt-32">
            <h2 className="text-xl font-semibold text-white">
              15. Inquiries &amp; Legal Notices
            </h2>
            <p>
              For contract proposals, bespoke engineering consulting, or professional engagement agreements across any subdomain:
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-white-100">
                <span className="font-semibold text-white">Direct Professional Line:</span>{" "}
                <a
                  href="mailto:gaurav@gauravpatil.site"
                  className="text-purple font-medium hover:underline"
                >
                  gaurav@gauravpatil.site
                </a>
                <span className="block text-xs text-neutral-400 mt-0.5">
                  (Reserved strictly for professional proposals, consulting contracts, and executive recruiter correspondence)
                </span>
              </p>
              <p className="text-white-100 pt-1">
                <span className="font-semibold text-white">General Inquiries &amp; Notices:</span>{" "}
                <a
                  href="mailto:hello@gauravpatil.site"
                  className="text-purple font-medium hover:underline"
                >
                  hello@gauravpatil.site
                </a>
              </p>
            </div>
          </section>
            </>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-white-200">
          <p>© {new Date().getFullYear()} Gaurav Portfolio. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}

export function TermsOfServiceContent(props: TermsOfServiceContentProps = {}) {
  return <TermsContentInner {...props} />;
}
