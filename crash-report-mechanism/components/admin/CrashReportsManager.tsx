"use client";

/**
 * Crash Reports Manager - Enterprise Edition
 * Main admin dashboard view for managing crash reports
 * Features: Pagination, Advanced Filtering, White Background Theme
 */

import React, { useState, useMemo } from "react";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Camera,
  Clock,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrashReports } from "../../contexts/CrashReportContext";
import CrashReportCard from "./CrashReportCard";
import CrashDetailModal from "./CrashDetailModal";
import CrashReportFilters from "./CrashReportFilters";
import { CrashSeverity, CrashStatus } from "../../types/crashReport";
import { formatDistanceToNow } from "date-fns";

// Pagination constants
const ITEMS_PER_PAGE = 10;

export default function CrashReportsManager() {
  const {
    crashReports,
    loading,
    lastUpdated,
    refreshCrashReports,
    getNewCount,
    getCriticalCount,
    getUnreadCount,
    getUrgentCount,
    getImmediateActionCount,
  } = useCrashReports();

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<CrashSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CrashStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "severity" | "occurence">("newest");
  const [selectedCrashId, setSelectedCrashId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort crash reports
  const filteredReports = useMemo(() => {
    let filtered = [...crashReports];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.errorMessage.toLowerCase().includes(search) ||
          report.title?.toLowerCase().includes(search) ||
          report.errorName.toLowerCase().includes(search) ||
          report.id.toLowerCase().includes(search)
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((report) => report.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === "severity") {
      const severityOrder: Record<CrashSeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      filtered.sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );
    } else if (sortBy === "occurence") {
      filtered.sort((a, b) => b.occurenceCount - a.occurenceCount);
    }

    return filtered;
  }, [crashReports, searchTerm, severityFilter, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, severityFilter, statusFilter, sortBy]);

  // Summary stats
  const stats = useMemo(
    () => ({
      total: crashReports.length,
      new: getNewCount(),
      critical: getCriticalCount(),
      unread: getUnreadCount(),
      urgent: getImmediateActionCount(),
    }),
    [crashReports, getNewCount, getCriticalCount, getUnreadCount, getImmediateActionCount]
  );

  if (loading && crashReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Loading crash reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Crash Reports</h2>
          <p className="text-gray-600 mt-1">
            Monitor and resolve application crashes - {stats.total} total reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-update indicator */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="relative">
              <Clock className="w-4 h-4 text-gray-600" />
              {loading && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Auto-updating</div>
              <div className="text-xs text-gray-500">
                {lastUpdated 
                  ? `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
                  : 'Loading...'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - White background enterprise style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Crashes */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">New</span>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.new}</div>
          <p className="text-xs text-gray-500 mt-1">Unacknowledged crashes</p>
        </div>

        {/* Critical Crashes */}
        <div className="bg-white border border-red-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-red-600">Critical</span>
            <div className="p-2 bg-red-50 rounded-lg relative">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              {stats.critical > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
          <p className="text-xs text-gray-500 mt-1">High severity issues</p>
        </div>

        {/* Unread Crashes */}
        <div className="bg-white border border-orange-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-orange-600">Unread</span>
            <div className="p-2 bg-orange-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600">{stats.unread}</div>
          <p className="text-xs text-gray-500 mt-1">Needs review</p>
        </div>

        {/* Urgent - Immediate Action Required */}
        <div className={`bg-gradient-to-br ${stats.urgent > 0 ? 'from-red-50 to-red-100 border-red-300' : 'from-gray-50 to-gray-100 border-gray-200'} border-2 rounded-lg p-5 hover:shadow-md transition-all`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
              <span>🚨</span>
              URGENT
            </span>
            {stats.urgent > 0 && (
              <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                ACTION
              </div>
            )}
          </div>
          <div className={`text-3xl font-bold ${stats.urgent > 0 ? 'text-red-700' : 'text-gray-400'}`}>
            {stats.urgent}
          </div>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            {stats.urgent > 0 ? 'Immediate action required!' : 'All clear'}
          </p>
        </div>
      </div>

      {/* Filters Only - White background */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Severity Filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
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
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none w-full h-[42px] pl-3 pr-9 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="severity">By Severity</option>
              <option value="occurence">Most Frequent</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || severityFilter !== "all" || statusFilter !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Search: {searchTerm}
                </span>
              )}
              {severityFilter !== "all" && (
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {severityFilter.toUpperCase()}
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {statusFilter}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSeverityFilter("all");
                setStatusFilter("all");
              }}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-gray-900">{paginatedReports.length}</span> of{" "}
          <span className="font-semibold text-gray-900">{filteredReports.length}</span> crashes
          {filteredReports.length !== stats.total && ` (filtered from ${stats.total})`}
        </p>
        
        {filteredReports.length > 0 && (
          <span className="text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Crash Reports List - White card style */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg text-center py-16">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <AlertTriangle className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-900 mb-2">No crash reports found</p>
            <p className="text-gray-600">
              {searchTerm || severityFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Your app is running smoothly! 🎉"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {paginatedReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <CrashReportCard
                    report={report}
                    onClick={() => setSelectedCrashId(report.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination Controls - Enterprise style */}
          {totalPages > 1 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">{filteredReports.length}</span>{" "}
                  results
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1;

                      if (!showPage) {
                        // Show ellipsis
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-colors ${
                            page === currentPage
                              ? "bg-blue-600 text-white shadow-sm"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile page indicator */}
                  <div className="sm:hidden px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCrashId && (
          <CrashDetailModal
            crashId={selectedCrashId}
            onClose={() => setSelectedCrashId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
