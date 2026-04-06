"use client";

import { useState, useEffect, useCallback } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import { Bug, AlertTriangle, Shield } from "lucide-react";
import Image from "next/image";

import { socialMedia } from "@/data";
import MagicButton from "./ui/MagicButton";
import ContactFormModal from "./ContactFormModal";
import BugReportIntro from "./BugReportIntro";
import BugReportForm from "./BugReportForm";
import { useBubbleSession } from "@/contexts/BubbleSessionContext";
import Logo from "./Logo";

const Footer = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isBugIntroOpen, setIsBugIntroOpen] = useState(false);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const [socialIconsMargin, setSocialIconsMargin] = useState(128); // Default margin-right in px
  
  // Get mask from BubbleSessionContext (single source of truth - no duplicate identity creation)
  const { visitorId: mask } = useBubbleSession();
  const patchId = mask || "..."; // Display visitor mask for admin ban purposes

  // Calculate dynamic margin for social icons based on scroll-to-top button position
  const calculateSocialIconsPosition = useCallback(() => {
    const scrollButton = document.querySelector('[data-scroll-button]') as HTMLElement;
    if (!scrollButton) {
      // Fallback based on screen size
      setSocialIconsMargin(window.innerWidth < 768 ? 112 : 128);
      return;
    }

    const buttonRect = scrollButton.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    const gapBetweenIcons = 5; // 5px gap between social icons and scroll-to-top
    
    // Social icons should be positioned with their right edge 5px to the left of button's left edge
    const socialIconsRightMargin = viewportWidth - buttonRect.left + gapBetweenIcons;
    
    setSocialIconsMargin(Math.max(socialIconsRightMargin, 20)); // Minimum 20px margin
  }, []);

  useEffect(() => {
    // Initial calculation with delay to ensure DOM is ready
    setTimeout(calculateSocialIconsPosition, 100);
    calculateSocialIconsPosition();
    calculateSocialIconsPosition();
    
    window.addEventListener('resize', calculateSocialIconsPosition, { passive: true });
    const interval = setInterval(calculateSocialIconsPosition, 1000);
    
    return () => {
      window.removeEventListener('resize', calculateSocialIconsPosition);
      clearInterval(interval);
    };
  }, [calculateSocialIconsPosition]);

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  const handleBugReportClick = () => {
    setIsBugIntroOpen(true);
  };

  return (
    <footer className="w-full pt-20 pb-0" id="contact">
      {/* background grid */}

      <div className="flex flex-col items-center">
        <h1 className="heading lg:max-w-[45vw]">
          Ready to take <span className="text-purple">your</span> digital
          presence to the next level?
        </h1>
        <p className="text-white-200 md:mt-10 my-5 text-center">
          Reach out to me today and let&apos;s discuss how I can help you
          achieve your goals.
        </p>
        <MagicButton
          title="Let's get in touch"
          icon={<FaLocationArrow />}
          position="right"
          handleClick={handleContactClick}
        />
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
      {/* Bug Report Intro Modal */}
      <BugReportIntro
        isOpen={isBugIntroOpen}
        onClose={() => setIsBugIntroOpen(false)}
        onOpenForm={() => setIsBugFormOpen(true)}
      />
      
      {/* Bug Report Form Modal */}
      <BugReportForm
        isOpen={isBugFormOpen}
        onClose={() => setIsBugFormOpen(false)}
      />
      
      {/* Footer Bottom Section - 3 Column Layout */}
      <div className="flex mt-16 md:flex-row flex-col justify-between items-center py-6 gap-6">
        {/* Left Section - Copyright with Logo */}
        <div className="flex items-center gap-3 md:text-base text-sm md:font-normal font-light">
          <Logo variant="small" className="hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="text-white-100 font-mono">
              <span className="text-purple">&gt;</span> Built by gaurav_
            </span>
            <span className="text-white-100 text-xs opacity-70">
              Copyright © {new Date().getFullYear()} Gaurav Patil
            </span>
            <div className="flex gap-2 mt-1 text-xs">
              <a 
                href="https://www.gauravpatil.online" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple hover:underline"
              >
                🔗 Portfolio
              </a>
              <span className="text-white-100 opacity-50">|</span>
              <a 
                href="https://www.gauravworkspace.store" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white-100 opacity-70 hover:text-purple hover:opacity-100 transition-colors"
              >
                💼 Workspace
              </a>
            </div>
          </div>
        </div>

        {/* Center Section - Three Links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Enhanced Bug Report Button */}
          <button
            onClick={handleBugReportClick}
            className="group relative px-2.5 py-1 rounded-md bg-white-200/5 hover:bg-white-200/10 border border-white-200/20 hover:border-white-200/40 backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5"
            aria-label="Report a Bug"
            title="Found a bug? Let us know!"
          >
            <Bug className="w-3 h-3 text-white-200/70 group-hover:text-white-200 transition-colors" />
            <span className="text-white-200/70 group-hover:text-white-200 text-xs font-medium transition-colors">
              Report a Bug
            </span>
          </button>
          
          <span className="text-white-200/40 hidden md:inline">•</span>
          
          {/* Device ID */}
          <span 
            className="group relative px-2.5 py-1 rounded-md bg-white-200/5 hover:bg-white-200/10 border border-white-200/20 hover:border-white-200/40 backdrop-blur-sm transition-all cursor-pointer flex items-center gap-1.5"
            title="Click to copy your Device Mask"
            onClick={() => {
              navigator.clipboard.writeText(patchId);
              // Optional: Add a toast notification here
            }}
          >
            <span className="text-white-200/70 group-hover:text-white-200 text-xs font-medium">
              {patchId}
            </span>
          </span>
          
          <span className="text-white-200/40 hidden md:inline">•</span>
          
          {/* Admin Access */}
          <a
            href="/admin/login"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-2.5 py-1 rounded-md bg-white-200/5 hover:bg-white-200/10 border border-white-200/20 hover:border-white-200/40 backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5"
            aria-label="Admin Access"
            title="Admin Login"
          >
            <Shield className="w-3 h-3 text-white-200/70 group-hover:text-white-200 transition-colors" />
            <span className="text-white-200/70 group-hover:text-white-200 text-xs font-medium transition-colors">
              Admin
            </span>
          </a>
        </div>

        {/* Right Section - Social Media Icons */}
        <div 
          className="flex items-center md:gap-3 gap-2"
          style={{ marginRight: `${socialIconsMargin}px` }}
        >
          {socialMedia.map((info) => (
            <div
              key={info.id}
              className="w-10 h-10 cursor-pointer flex justify-center items-center backdrop-filter backdrop-blur-lg saturate-180 bg-opacity-75 bg-black-200 rounded-lg border border-black-300 hover:bg-opacity-100 hover:border-purple/50 transition-all"
            >
              <Image
                src={info.img}
                alt="social media icon"
                width={20}
                height={20}
                loading="lazy"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
