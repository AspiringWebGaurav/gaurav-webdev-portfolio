"use client";

import { useState } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import { Bug, AlertTriangle, Shield } from "lucide-react";
import Image from "next/image";

import { socialMedia } from "@/data";
import MagicButton from "./ui/MagicButton";
import ContactFormModal from "./ContactFormModal";
import BugReportIntro from "./BugReportIntro";
import BugReportForm from "./BugReportForm";
import { useBubbleSession } from "@/contexts/BubbleSessionContext";

const Footer = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isBugIntroOpen, setIsBugIntroOpen] = useState(false);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  
  // Get mask from BubbleSessionContext (single source of truth - no duplicate identity creation)
  const { visitorId: mask } = useBubbleSession();
  const patchId = mask || "..."; // Display visitor mask for admin ban purposes

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
      <div className="flex mt-16 md:flex-row flex-col justify-between items-center py-6 gap-6">
        {/* Left Section - Content */}
        <div className="md:text-base text-sm md:font-normal font-light flex flex-wrap items-center justify-center md:justify-start gap-3">
          <span className="text-white-100">Copyright © 2025 Gaurav Patil</span>
          
          <span className="text-white-200/40">•</span>
          
          {/* Enhanced Bug Report Button */}
          <button
            onClick={handleBugReportClick}
            className="group relative px-3 py-1 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 flex items-center gap-1.5"
            aria-label="Report a Bug"
            title="Found a bug? Let us know!"
          >
            <Bug className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
            <span className="text-red-400 group-hover:text-red-300 text-xs font-medium transition-colors">
              Report a Bug
            </span>
            <AlertTriangle className="w-3 h-3 text-orange-400 group-hover:animate-pulse" />
          </button>
          
          <span className="text-white-200/40">•</span>
          
          {/* Admin Access */}
          <a
            href="/admin/login"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-3 py-1 rounded-lg bg-purple/5 hover:bg-purple/10 border border-purple/20 hover:border-purple/40 transition-all duration-300 flex items-center gap-1.5"
            aria-label="Admin Access"
            title="Admin Login"
          >
            <Shield className="w-3.5 h-3.5 text-purple/60 group-hover:text-purple transition-colors" />
            <span className="text-purple/60 group-hover:text-purple text-xs font-medium transition-colors">
              Admin
            </span>
          </a>
          
          <span className="text-white-200/40">•</span>
          
          {/* Device ID */}
          <span 
            className="group relative px-3 py-1.5 rounded-lg bg-black-200/50 border border-white-200/10 hover:border-green-400/30 font-mono text-xs transition-all cursor-pointer flex items-center gap-2"
            title="Click to copy your Device Mask"
            onClick={() => {
              navigator.clipboard.writeText(patchId);
              // Optional: Add a toast notification here
            }}
          >
            <span className="text-white-200/60 font-sans">Visitor ID:</span>
            <span className="text-green-400 group-hover:text-green-300 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              {patchId}
            </span>
          </span>
        </div>

        {/* Right Section - Social Media Icons */}
        <div className="flex items-center md:gap-6 gap-4 md:mr-16">
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
              />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
