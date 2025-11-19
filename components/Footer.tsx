"use client";

import { useState, useEffect } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import Image from "next/image";

import { socialMedia } from "@/data";
import MagicButton from "./ui/MagicButton";
import ContactFormModal from "./ContactFormModal";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";

const Footer = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [patchId, setPatchId] = useState<string>("...");

  useEffect(() => {
    // Fetch UUID once - it never changes so no need to poll
    const fetchUUID = async () => {
      try {
        const res = await fetch('/api/my-uuid');
        const data = await res.json();
        setPatchId(data.visitorId);
      } catch {
        setPatchId("offline");
      }
    };

    fetchUUID();
    // REMOVED: Polling interval (UUID is static, no need to refetch)
  }, []);

  const handleAdminClick = () => {
    window.open("/admin/dashboard", "_blank");
  };

  const handleContactClick = () => {
    setIsContactModalOpen(true);
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
      <div className="flex mt-16 md:flex-row flex-col justify-between items-center py-6 gap-4">
        <div className="md:text-base text-sm md:font-normal font-light flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span>Copyright © 2025 Gaurav Patil</span>
          <span className="text-white-200">•</span>
          <button
            onClick={handleAdminClick}
            className="text-purple hover:text-purple/80 transition-colors font-normal"
            aria-label="Open Admin Panel"
            title="Open Admin Panel"
          >
            admin?
          </button>
          <span className="text-white-200">•</span>
          <span 
            className="text-gray-500 font-mono text-xs hover:text-gray-400 transition-colors cursor-pointer"
            title="Click to copy UUID"
            onClick={() => navigator.clipboard.writeText(patchId)}
          >
            {patchId}
          </span>
        </div>

        <div className="flex items-center md:gap-3 gap-6 lg:mr-14">
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
