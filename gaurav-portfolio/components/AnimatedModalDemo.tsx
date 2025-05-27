"use client";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
  useModal,
} from "./ui/animated-modal";

import { FaEnvelope, FaWpforms, FaLocationArrow } from "react-icons/fa";
import { SignupFormDemo } from "./SignupFormDemo";
import { IconMailFilled, IconForms } from "@tabler/icons-react";

export function AnimatedModalDemo() {
  const { setOpen } = useModal();
  const [step, setStep] = useState<"choice" | "form">("choice");

  useEffect(() => {
    const openModal = () => {
      setStep("form");
      setOpen(true);
    };
    window.addEventListener("openContactForm", openModal);
    return () => window.removeEventListener("openContactForm", openModal);
  }, [setOpen]);

  return (
    <div className="py-10 flex items-center justify-center">
      <Modal>
        <ModalTrigger className="relative inline-flex h-12 w-full md:w-60 overflow-hidden rounded-lg p-[1px] group focus:outline-none">
          {/* Outer border animation */}
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />

          {/* Inner button content */}
          <span className="relative inline-flex h-full w-full items-center justify-center rounded-lg bg-slate-950 px-7 text-sm font-medium text-white backdrop-blur-3xl overflow-hidden gap-2">
            {/* Sliding out */}
            <span className="flex items-center gap-2 transform transition-transform duration-500 ease-in-out group-hover:translate-x-[150%]">
              Let’s get in touch
              <FaLocationArrow className="text-white text-sm" />
            </span>

            {/* Sliding in */}
            <span className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-100%] transition-all duration-500 ease-in-out z-10">
              GMAIL
              <FaEnvelope />
              <span>|</span>
              <FaWpforms />
              Contact Form
            </span>
          </span>
        </ModalTrigger>

        <ModalBody>
          {step === "choice" ? (
            <ModalContent>
              <h4 className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8">
                Which mode would you like to contact?
              </h4>
              <div className="flex flex-col gap-4">
                <a
                  href="mailto:gauravpatil5737@gmail.com"
                  className="flex items-center justify-center gap-3 px-4 py-3 rounded-md border border-purple bg-white dark:bg-black text-black dark:text-white font-semibold hover:bg-purple/10"
                >
                  <FaEnvelope />
                  Contact via Gmail
                </a>
                <button
                  onClick={() => setStep("form")}
                  className="flex items-center justify-center gap-3 px-4 py-3 rounded-md border border-purple bg-white dark:bg-black text-black dark:text-white font-semibold hover:bg-purple/10"
                >
                  <FaWpforms />
                  Contact Form
                </button>
              </div>
            </ModalContent>
          ) : (
            <>
              <ModalContent>
                <SignupFormDemo />
              </ModalContent>
              <ModalFooter className="gap-4">
                <button
                  onClick={() => setStep("choice")}
                  className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:text-white border border-gray-300 rounded-md text-sm w-28"
                >
                  Back
                </button>
              </ModalFooter>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}

const PlaneIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" />
    </svg>
  );
};

const VacationIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M17.553 16.75a7.5 7.5 0 0 0 -10.606 0" />
      <path d="M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196z" />
      <path d="M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196" />
      <path d="M15 9l-3 5.196" />
      <path d="M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25" />
    </svg>
  );
};

const ElevatorIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 4m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z" />
      <path d="M10 10l2 -2l2 2" />
      <path d="M10 14l2 2l2 -2" />
    </svg>
  );
};

const FoodIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M20 20c0 -3.952 -.966 -16 -4.038 -16s-3.962 9.087 -3.962 14.756c0 -5.669 -.896 -14.756 -3.962 -14.756c-3.065 0 -4.038 12.048 -4.038 16" />
    </svg>
  );
};

const MicIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 12.9a5 5 0 1 0 -3.902 -3.9" />
      <path d="M15 12.9l-3.902 -3.899l-7.513 8.584a2 2 0 1 0 2.827 2.83l8.588 -7.515z" />
    </svg>
  );
};

const ParachuteIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M22 12a10 10 0 1 0 -20 0" />
      <path d="M22 12c0 -1.66 -1.46 -3 -3.25 -3c-1.8 0 -3.25 1.34 -3.25 3c0 -1.66 -1.57 -3 -3.5 -3s-3.5 1.34 -3.5 3c0 -1.66 -1.46 -3 -3.25 -3c-1.8 0 -3.25 1.34 -3.25 3" />
      <path d="M2 12l10 10l-3.5 -10" />
      <path d="M15.5 12l-3.5 10l10 -10" />
    </svg>
  );
};
