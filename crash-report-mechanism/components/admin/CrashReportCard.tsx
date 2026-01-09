"use client";

/**
 * Crash Report Card
 * List item component showing crash summary
 */

import React from "react";
import { Camera, Users, Calendar, TrendingUp } from "lucide-react";
import { CrashReport, getSeverityColor, getStatusColor } from "../../types/crashReport";

interface Props {
  report: CrashReport;
  onClick: () => void;
}

export default function CrashReportCard({ report, onClick }: Props) {
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className="group p-5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Main content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getSeverityColor(
                report.severity
              )}`}
            >
              {report.severity.toUpperCase()}
            </span>

            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getStatusColor(
                report.status
              )}`}
            >
              {report.status}
            </span>

            {report.occurenceCount > 1 && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {report.occurenceCount}x
              </span>
            )}

            {report.screenshot && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Screenshot
              </span>
            )}
          </div>

          {/* Title/Error Name */}
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors text-lg line-clamp-1">
            {report.title || report.errorName}
          </h3>

          {/* Error Message */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
            {report.errorMessage}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{formatRelativeTime(report.createdAt)}</span>
            </div>

            {report.affectedUsers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{report.affectedUsers.length} user{report.affectedUsers.length > 1 ? "s" : ""}</span>
              </div>
            )}

            <div className="truncate text-gray-400">
              {report.url.replace(/^https?:\/\//, "").substring(0, 50)}
            </div>
          </div>
        </div>

        {/* Right: Quick info */}
        <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
          <div className="text-right">
            <div className="font-mono text-gray-700 font-medium">{report.errorName}</div>
            <div className="text-gray-400 mt-0.5">{report.category}</div>
          </div>

          {report.assignedTo && (
            <div className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-medium">
              Assigned
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
