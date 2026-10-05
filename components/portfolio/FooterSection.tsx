"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaLocationArrow } from "react-icons/fa6";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

import MagicButton from "@/components/ui/MagicButton";
import { ContactModal } from "@/components/contact/ContactModal";
import type { CtaDocument, FooterDocument, SocialLinkDocument } from "@/types/portfolio";
import { SEED_CTA, SEED_FOOTER, SEED_SOCIAL_LINKS } from "@/lib/dal/repositories/seed-data";

interface FooterSectionProps {
  cta?: CtaDocument;
  footer?: FooterDocument;
  socialLinks?: SocialLinkDocument[];
}

export const FooterSection = ({
  cta = SEED_CTA,
  footer = SEED_FOOTER,
  socialLinks = SEED_SOCIAL_LINKS,
}: FooterSectionProps) => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const pathname = usePathname();
  const isDirectInitRef = useRef(false);

  // Helper to open the contact form and push /contact to browser address bar
  const handleOpenContact = useCallback(() => {
    setIsContactOpen(true);
    if (typeof window !== "undefined" && window.location.pathname !== "/contact") {
      window.history.pushState({ contactModal: true }, "", "/contact");
    }
  }, []);

  // Helper to close the contact form and cleanly revert the address bar
  const handleCloseContact = useCallback(() => {
    setIsContactOpen(false);
    if (typeof window !== "undefined" && window.location.pathname === "/contact") {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  // Synchronize modal state on initial mount, browser back/forward (popstate), and custom events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkShouldOpen = () => {
      const currentPath = window.location.pathname;
      const search = window.location.search;
      const params = new URLSearchParams(search);

      return (
        currentPath === "/contact" ||
        params.get("contact") === "true" ||
        params.get("contact") === "open"
      );
    };

    if (checkShouldOpen() && !isDirectInitRef.current) {
      isDirectInitRef.current = true;
      setIsContactOpen(true);

      // Smoothly anchor background page layout to the contact section
      requestAnimationFrame(() => {
        const el = document.getElementById("contact");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    // Handle browser Back and Forward navigation smoothly
    const handlePopState = () => {
      const shouldOpen = checkShouldOpen();
      setIsContactOpen(shouldOpen);
    };

    // Support external custom open trigger
    const handleOpenCustom = () => {
      handleOpenContact();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("open-contact-modal", handleOpenCustom);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("open-contact-modal", handleOpenCustom);
    };
  }, [handleOpenContact]);

  // Synchronize when Next.js client-side route navigation targets /contact
  useEffect(() => {
    if (pathname === "/contact") {
      setIsContactOpen(true);
    }
  }, [pathname]);

  const sortedSocial = [...socialLinks].sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderSocialIcon = (item: SocialLinkDocument) => {
    if (item.iconType === "custom_path" && item.customPathD) {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-slate-700 dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-purple transition-colors"
        >
          <path d={item.customPathD} />
        </svg>
      );
    }

    const preset = item.presetName || item.platform.toLowerCase();
    if (preset.includes("github")) {
      return <FaGithub className="w-5 h-5 text-slate-700 dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-purple transition-colors" />;
    }
    if (preset.includes("twitter") || preset.includes("x")) {
      return <FaTwitter className="w-5 h-5 text-slate-700 dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-purple transition-colors" />;
    }
    if (preset.includes("linkedin")) {
      return <FaLinkedin className="w-5 h-5 text-slate-700 dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-purple transition-colors" />;
    }

    // Default fallback icon
    return <Image src="/git.svg" alt={item.platform} width={20} height={20} className="invert-0 dark:invert" />;
  };

  return (
    <footer className="w-full pt-20 pb-10">
      {/* Dynamic CTA Banner */}
      {cta.isEnabled !== false && (
        <div className="flex flex-col items-center">
          <h2 className="heading lg:max-w-[45vw]">
            {cta.headingPrefix || "Ready to take "}
            <span className="text-[#7C3AED] dark:text-purple">{cta.headingHighlight || "your"}</span>
            {cta.headingSuffix || " digital presence to the next level?"}
          </h2>
          <p className="text-slate-600 dark:text-white-200 md:mt-10 my-5 text-center leading-relaxed">
            {cta.description ||
              "Reach out to me today and let's discuss how I can help you achieve your goals."}
          </p>
          <MagicButton
            title={cta.buttonText || "Let's get in touch"}
            icon={<FaLocationArrow />}
            position="right"
            handleClick={handleOpenContact}
          />
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-500 dark:text-neutral-400 font-admin-mono">
            <span>Hiring or Recruiter Inquiry?</span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <a
                href="https://resume.gauravpatil.site"
                target="_blank"
                rel="noopener noreferrer"
                title="https://resume.gauravpatil.site"
                className="group text-[#7C3AED] dark:text-purple hover:text-purple-600 dark:hover:text-[#CBACF9] font-semibold inline-flex items-center transition-colors touch-manipulation"
              >
                <span>Verified Resume Portal</span>
                <span className="inline-block max-w-0 opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out text-[11px] font-normal text-slate-500 dark:text-neutral-400 group-hover:ml-1 group-focus-visible:ml-1">
                  (resume.gauravpatil.site)
                </span>
                <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </a>
              <span className="text-slate-300 dark:text-neutral-600 hidden sm:inline">·</span>
              <a
                href="https://contact.gauravpatil.site"
                target="_blank"
                rel="noopener noreferrer"
                title="https://contact.gauravpatil.site"
                className="group text-[#7C3AED] dark:text-purple hover:text-purple-600 dark:hover:text-[#CBACF9] font-semibold inline-flex items-center transition-colors touch-manipulation"
              >
                <span>Recruiter Portal</span>
                <span className="inline-block max-w-0 opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out text-[11px] font-normal text-slate-500 dark:text-neutral-400 group-hover:ml-1 group-focus-visible:ml-1">
                  (contact.gauravpatil.site)
                </span>
                <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer Bottom: Copyright, Legal Links, Social Icons */}
      <div className="flex flex-col md:flex-row justify-between items-center w-full mt-20 pt-8 border-t border-slate-200/90 dark:border-white/[0.08] gap-4">
        {/* Left: Copyright & Legal Links */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 font-normal">
          <span>
            © {new Date().getFullYear()} {footer.copyrightName || "Gaurav Patil"}
          </span>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
          <a
            href="https://resume.gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Resume
          </a>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
          <a
            href="https://contact.gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Recruiter Portal
          </a>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
          <Link
            href={footer.termsUrl || "/terms"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Terms
          </Link>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
          <Link
            href={footer.privacyUrl || "/privacy"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Privacy
          </Link>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
          <Link
            href="/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Chat Guide
          </Link>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
          <Link
            href="/security"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Security
          </Link>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
          <Link
            href="/accessibility"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Accessibility
          </Link>
        </div>

        {/* Right: Social Media Links (offset left to prevent overlap with dynamic ScrollToTop & Assistant actions) */}
        <div className="flex items-center justify-center md:justify-end gap-3.5 md:mr-32 lg:mr-36">
          {sortedSocial.map((info) => (
            <a
              key={info.id}
              href={info.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 min-w-[44px] min-h-[44px] cursor-pointer flex justify-center items-center backdrop-filter backdrop-blur-lg bg-white hover:bg-slate-100 dark:bg-black-200/75 dark:hover:bg-black-100 rounded-lg border border-slate-200/90 dark:border-black-300 hover:border-[#7C3AED]/50 dark:hover:border-purple/50 active:scale-95 transition-all duration-200 group touch-manipulation shadow-2xs"
              aria-label={`Link to ${info.platform}`}
            >
              {renderSocialIcon(info)}
            </a>
          ))}
        </div>
      </div>

      {/* Dynamic Interactive Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={handleCloseContact}
      />
    </footer>
  );
};
