"use client";

/**
 * Crash Report Filters
 * Filter and sort controls for crash reports
 */

import React from "react";
import { ChevronDown } from "lucide-react";
import { CrashSeverity, CrashStatus } from "../../types/crashReport";

interface Props {
  severityFilter: CrashSeverity | "all";
  statusFilter: CrashStatus | "all";
  sortBy: "newest" | "severity" | "occurence";
  onSeverityChange: (value: CrashSeverity | "all") => void;
  onStatusChange: (value: CrashStatus | "all") => void;
  onSortChange: (value: "newest" | "severity" | "occurence") => void;
}

export default function CrashReportFilters({
  severityFilter,
  statusFilter,
  sortBy,
  onSeverityChange,
  onStatusChange,
  onSortChange,
}: Props) {
  return (
    <>
      {/* Severity Filter */}
      <div className="relative">
        <select
          value={severityFilter}
          onChange={(e) => onSeverityChange(e.target.value as any)}
          className="appearance-none w-full h-[42px] pl-3 pr-9 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as any)}
          className="appearance-none w-full h-[42px] pl-3 pr-9 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="unread">Unread</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
          <option value="critical">Critical</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      {/* Sort By */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as any)}
          className="appearance-none w-full h-[42px] pl-3 pr-9 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="newest">Newest First</option>
          <option value="severity">By Severity</option>
          <option value="occurence">Most Frequent</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </>
  );
}
