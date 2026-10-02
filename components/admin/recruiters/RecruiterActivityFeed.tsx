"use client";

import React from "react";
import type { RecruiterActivityEvent } from "@/types/recruiter";
import { formatSubmissionTimestamp } from "@/lib/email/brevo";
import { FaUserCheck, FaDownload, FaPhone, FaWhatsapp, FaEnvelope, FaEye, FaBolt } from "react-icons/fa";

interface RecruiterActivityFeedProps {
  events: RecruiterActivityEvent[];
}

export function RecruiterActivityFeed({ events }: RecruiterActivityFeedProps) {
  const getActionBadge = (action: string) => {
    switch (action) {
      case "AUTH_SUCCESS":
        return {
          icon: <FaUserCheck className="text-emerald-500" />,
          label: "Authenticated (OTP)",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "DOWNLOAD_RESUME":
        return {
          icon: <FaDownload className="text-purple-500" />,
          label: "Downloaded Resume PDF",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "EMAIL_RESUME":
        return {
          icon: <FaEnvelope className="text-indigo-500" />,
          label: "Requested Resume Email",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "CLICK_CALL":
        return {
          icon: <FaPhone className="text-green-500" />,
          label: "Clicked Call Gaurav",
          bg: "bg-green-50 text-green-700 border-green-200",
        };
      case "CLICK_WHATSAPP":
        return {
          icon: <FaWhatsapp className="text-emerald-600" />,
          label: "Clicked WhatsApp Gaurav",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
        };
      case "VIEW_PROJECT_DETAIL":
        return {
          icon: <FaEye className="text-blue-500" />,
          label: "Viewed Project Specs",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      default:
        return {
          icon: <FaBolt className="text-gray-500" />,
          label: action,
          bg: "bg-gray-50 text-gray-700 border-gray-200",
        };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
          Recruiter Activity Stream
        </h3>
        <span className="text-[11px] font-mono text-gray-500">
          {events.length} latest event{events.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            No recruiter activity recorded yet.
          </div>
        ) : (
          events.map((evt) => {
            const badge = getActionBadge(evt.action);
            const timeStr = formatSubmissionTimestamp(new Date(evt.timestamp));

            return (
              <div
                key={evt.id}
                className="p-3 hover:bg-gray-50/70 transition flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs">
                    {badge.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{evt.email}</span>
                      <span className="text-gray-400">({evt.company})</span>
                    </div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-gray-400 shrink-0 text-right">
                  {timeStr}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
