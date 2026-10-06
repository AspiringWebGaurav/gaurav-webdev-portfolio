"use client";

import React, { useState } from "react";
import { FaDownload, FaEnvelope, FaFilePdf, FaCheck, FaGraduationCap, FaAward, FaExternalLinkAlt } from "react-icons/fa";
import { getSubdomainUrl } from "@/lib/theme/navigation";

interface ResumeScreenProps {
  recruiter: { name: string; company: string; email: string };
  onTrackAction: (action: string, metadata?: Record<string, unknown>) => void;
}

export function ResumeScreen({ recruiter, onTrackAction }: ResumeScreenProps) {
  const [emailStatus, setEmailStatus] = useState<"IDLE" | "SENDING" | "SENT" | "ERROR">("IDLE");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleDownload = () => {
    onTrackAction("DOWNLOAD_RESUME");
    window.open("https://gauravpatil.site/resume.pdf", "_blank", "noopener,noreferrer");
  };

  const handleEmailToMe = async () => {
    if (emailStatus === "SENDING") return;
    setEmailStatus("SENDING");
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/contact-portal/resume/email", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setEmailStatus("SENT");
        setFeedbackMsg(`Sent to ${recruiter.email}`);
        onTrackAction("EMAIL_RESUME");
      } else {
        setEmailStatus("ERROR");
        setFeedbackMsg(data.error || "Failed to dispatch email.");
      }
    } catch {
      setEmailStatus("ERROR");
      setFeedbackMsg("Network error. Please try downloading directly.");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto text-black">
      {/* Header */}
      <div>
        <div className="text-xs font-admin-mono text-[#7C3AED] uppercase tracking-wider mb-1 font-semibold">
          Official Credentials & Verification
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold font-admin-sans tracking-tight text-black mb-2">
          Resume & Experience Hub<span className="text-[#7C3AED]">.</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Explore the live interactive resume on{" "}
          <a
            href={getSubdomainUrl("https://resume.gauravpatil.site")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onTrackAction("VIEW_INTERACTIVE_RESUME");
            }}
            className="text-[#7C3AED] hover:underline font-semibold"
          >
            resume.gauravpatil.site
          </a>
          , download the comprehensive CV PDF, or have a copy dispatched directly to your inbox.
        </p>
      </div>

      {/* Main Resume Summary Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 sm:p-6 shadow-2xs my-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-4 mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED]">
              <FaFilePdf className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold font-admin-sans text-black">
                Gaurav_Patil_Resume.pdf
              </h3>
              <div className="text-xs font-admin-mono text-gray-400">
                Staff / Senior Full-Stack Systems Engineer · Updated Oct 2026
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <a
              href={getSubdomainUrl("https://resume.gauravpatil.site")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                onTrackAction("VIEW_INTERACTIVE_RESUME");
              }}
              className="px-3.5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <FaExternalLinkAlt className="text-[10px]" />
              <span>Interactive Resume</span>
            </a>

            <button
              onClick={handleEmailToMe}
              disabled={emailStatus === "SENDING" || emailStatus === "SENT"}
              className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition flex items-center gap-2 shadow-2xs disabled:opacity-50"
            >
              <FaEnvelope className="text-xs" />
              <span>
                {emailStatus === "SENDING"
                  ? "Dispatching..."
                  : emailStatus === "SENT"
                  ? "Dispatched"
                  : "Email to My Inbox"}
              </span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-gray-800 border border-[#E2E8F0] rounded-md text-xs font-medium transition flex items-center gap-1.5"
            >
              <FaDownload className="text-xs text-gray-500" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`mb-4 p-3 rounded-md text-xs flex items-center gap-2 animate-in fade-in ${
              emailStatus === "SENT"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {emailStatus === "SENT" ? (
              <FaCheck className="text-emerald-600 shrink-0" />
            ) : null}
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* 3 Highlights Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-md bg-[#FAFAFA] border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-xs font-bold font-admin-sans text-black mb-1">
              <FaAward className="text-[#7C3AED]" />
              <span>Experience</span>
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              NeoSOFT engineer + founder of 4 shipped production apps (Send2Me, Switchyy, DareToSend, XURL).
            </div>
          </div>

          <div className="p-3.5 rounded-md bg-[#FAFAFA] border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-xs font-bold font-admin-sans text-black mb-1">
              <FaGraduationCap className="text-indigo-600" />
              <span>Education</span>
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              Bachelor of Engineering (Computer Engineering) + 1200h Masai School software engineering immersion.
            </div>
          </div>

          <div className="p-3.5 rounded-md bg-[#FAFAFA] border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-xs font-bold font-admin-sans text-black mb-1">
              <FaCheck className="text-emerald-600" />
              <span>Availability</span>
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              Actively interviewing for Staff / Senior Software Engineer roles (Full-Stack / Systems).
            </div>
          </div>
        </div>
      </div>

      {/* Footer Dispatch Channel Note */}
      <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between text-xs font-admin-mono text-gray-500 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-gray-700">Official Candidate Credentials</span>
        </span>
        <div className="flex items-center gap-2 text-gray-500">
          <a
            href={getSubdomainUrl("https://resume.gauravpatil.site")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7C3AED] hover:underline font-semibold"
          >
            resume.gauravpatil.site
          </a>
          <span>&bull;</span>
          <span>1-Click Dispatch &bull; Updated 2026</span>
        </div>
      </div>
    </div>
  );
}
