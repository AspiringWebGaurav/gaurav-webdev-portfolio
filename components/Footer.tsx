"use client";

import { useState, useEffect } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import { socialMedia } from "@/data";
import MagicButton from "./ui/MagicButton";
import ContactModal from "./ContactModal";
import GlobalLoader from "./GlobalLoader";
import SuccessNotification from "./SuccessNotification";

const Footer = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [savedScrollY, setSavedScrollY] = useState(0);

  const openContactWithLoader = () => {
    setSavedScrollY(window.scrollY);
    document.body.style.overflow = "hidden";
    setIsGlobalLoading(true);
    setTimeout(() => {
      setIsGlobalLoading(false);
      setIsContactModalOpen(true);
    }, 2000);
  };

  const closeModal = () => {
    setIsContactModalOpen(false);
    document.body.style.overflow = "unset";
    window.scrollTo(0, savedScrollY);
  };

  const handleFormSuccess = (name: string) => {
    setSuccessName(name);
    setShowSuccess(true);
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    document.body.style.overflow = "unset";
    window.scrollTo(0, savedScrollY);
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <>
      <footer className="w-full pt-20 pb-10" id="contact">
        {/* your existing gradient / decorations here */}

        <div className="flex flex-col items-center">
          <h1 className="heading lg:max-w-[45vw]">
            Ready to take <span className="text-purple">your</span> digital
            presence to the next level?
          </h1>
          <p className="text-white/60 md:mt-10 my-5 text-center">
            Reach out today and let&apos;s discuss how I can help you achieve
            your goals.
          </p>

          <MagicButton
            title="Let's get in touch"
            icon={<FaLocationArrow />}
            position="right"
            handleClick={openContactWithLoader}
          />
        </div>

        {/* Bottom row */}
        <div className="flex mt-16 md:flex-row flex-col justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="md:text-base text-sm font-light">© 2025 Gaurav Patil</p>
            <span className="text-gray-500">•</span>
            <button
              onClick={() => window.open('/admin', '_blank')}
              className="md:text-base text-sm font-light text-gray-400 hover:text-blue-400 transition-colors duration-200 cursor-pointer"
              title="Admin Login"
            >
              admin?
            </button>
          </div>
          <div className="flex items-center md:gap-3 gap-6 mr-12">
            {socialMedia.map((i) => (
              <div
                key={i.id}
                className="w-10 h-10 flex justify-center items-center bg-black/60 rounded-lg border border-white/20"
              >
                <img src={i.img} alt="icon" width={20} height={20} />
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* UI layers */}
      <GlobalLoader isOpen={isGlobalLoading} />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />

      <SuccessNotification
        isOpen={showSuccess}
        onClose={closeSuccess}
        userName={successName}
      />
    </>
  );
};

export default Footer;
