"use client";

/**
 * Bug Hunt Manager - Admin dashboard for bug reports
 * Lists all bug reports with filtering, sorting, and management options
 */

import React, { useState, useMemo } from "react";
import {
  Bug,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Loader2,
  Eye,
  Trash2,
  CheckCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBugReports } from "@/contexts/BugReportContext";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { showToast } from "@/lib/toast";
import {
  BugReport,
  BugSeverity,
  BugStatus,
  generateReferenceId,
} from "@/types/bugReport";
import BugDetailModal from "@/components/admin/BugDetailModal";

export default function BugHuntManager() {
  const { bugReports, loading, refreshBugReports, deleteBugReport } =
    useBugReports();
  const { moveToRecycleBin } = useRecycleBin();

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<BugSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<BugStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "severity">("newest");
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Filter and sort bug reports
  const filteredReports = useMemo(() => {
    let filtered = [...bugReports];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(search) ||
          report.id.toLowerCase().includes(search) ||
          generateReferenceId(report.id).toLowerCase().includes(search) ||
          report.reporterEmail?.toLowerCase().includes(search)
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
      const severityOrder: Record<BugSeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      filtered.sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );
    }

    return filtered;
  }, [bugReports, searchTerm, severityFilter, statusFilter, sortBy]);

  // Get counts by status
  const statusCounts = useMemo(() => {
    return {
      new: bugReports.filter((r) => r.status === "new").length,
      inProgress: bugReports.filter((r) => r.status === "in-progress").length,
      resolved: bugReports.filter((r) => r.status === "resolved").length,
      total: bugReports.length,
    };
  }, [bugReports]);

  // Get counts by severity
  const severityCounts = useMemo(() => {
    return {
      critical: bugReports.filter((r) => r.severity === "critical").length,
      high: bugReports.filter((r) => r.severity === "high").length,
      medium: bugReports.filter((r) => r.severity === "medium").length,
      low: bugReports.filter((r) => r.severity === "low").length,
    };
  }, [bugReports]);

  // Severity color classes
  const getSeverityColor = (severity: BugSeverity) => {
    switch (severity) {
      case "critical":
        return "text-red-700 bg-red-100 border-red-300";
      case "high":
        return "text-orange-700 bg-orange-100 border-orange-300";
      case "medium":
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
      case "low":
        return "text-blue-700 bg-blue-100 border-blue-300";
    }
  };

  // Status color classes
  const getStatusColor = (status: BugStatus) => {
    switch (status) {
      case "new":
        return "text-purple-700 bg-purple-100 border-purple-300";
      case "in-progress":
        return "text-blue-700 bg-blue-100 border-blue-300";
      case "resolved":
        return "text-green-700 bg-green-100 border-green-300";
      case "duplicate":
        return "text-gray-700 bg-gray-100 border-gray-300";
      case "wont-fix":
        return "text-gray-700 bg-gray-100 border-gray-300";
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  // Toggle item selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all filtered bug reports
  const selectAll = () => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReports.map(r => r.id)));
    }
  };

  // Handle single delete
  const handleDelete = async (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  // Confirm single delete
  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;

    const report = bugReports.find(r => r.id === deleteTarget.id);
    if (!report) return;

    setDeleteTarget(null);

    showToast.info("Processing deletion...", "Deleting...");

    try {
      // Move to recycle bin first (silent mode)
      const recycleBinResult = await moveToRecycleBin(
        "bugReport",
        report,
        report.id,
        true
      );

      if (!recycleBinResult.success) {
        showToast.error(
          recycleBinResult.error || "Failed to move to recycle bin",
          "Delete Failed"
        );
        return;
      }

      // Then delete from active reports (silent mode)
      const deleteResult = await deleteBugReport(report.id, true);

      if (deleteResult.success) {
        showToast.success(
          "Bug report moved to recycle bin",
          "Moved to Recycle Bin"
        );
      } else {
        showToast.error(
          deleteResult.error || "Failed to delete bug report",
          "Delete Failed"
        );
      }
    } catch (error) {
      console.error("Error deleting bug report:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to delete bug report",
        "Delete Failed"
      );
    }
  };

  // Handle batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      showToast.warning("Please select items to delete", "No Selection");
      return;
    }

    const selectedReports = bugReports.filter(r => selectedIds.has(r.id));
    
    if (selectedReports.length === 0) {
      showToast.warning("Selected items not found", "No Items Found");
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBatchDeleteConfirm(false);
      return;
    }

    // Close modal immediately
    setShowBatchDeleteConfirm(false);

    // Show progress notification
    const totalItems = selectedReports.length;
    showToast.info(
      `Processing ${totalItems} bug report${totalItems > 1 ? 's' : ''}...`,
      "Deleting..."
    );

    try {
      let successCount = 0;
      let failCount = 0;
      const failedTitles: string[] = [];

      // Delete each selected report with silent mode
      for (const report of selectedReports) {
        try {
          // Move to recycle bin (SILENT MODE)
          const recycleBinResult = await moveToRecycleBin(
            "bugReport",
            report,
            report.id,
            true
          );

          if (!recycleBinResult.success) {
            failCount++;
            failedTitles.push(report.title);
            continue;
          }

          // Delete from active reports (SILENT MODE)
          const deleteResult = await deleteBugReport(report.id, true);
          
          if (deleteResult.success) {
            successCount++;
          } else {
            failCount++;
            failedTitles.push(report.title);
          }
        } catch (error) {
          console.error(`Failed to delete bug report ${report.id}:`, error);
          failCount++;
          failedTitles.push(report.title);
        }
      }

      // Clear selection and exit selection mode
      setSelectedIds(new Set());
      setIsSelectionMode(false);

      // Show final result
      if (successCount === totalItems) {
        showToast.success(
          `Successfully moved ${successCount} bug report${successCount > 1 ? 's' : ''} to recycle bin`,
          "Batch Delete Complete"
        );
      } else if (successCount > 0) {
        showToast.warning(
          `Moved ${successCount} bug report${successCount > 1 ? 's' : ''} to recycle bin. ${failCount} failed.`,
          "Partially Complete"
        );
      } else {
        showToast.error(
          `Failed to move all ${totalItems} bug report${totalItems > 1 ? 's' : ''} to recycle bin`,
          "Batch Delete Failed"
        );
      }
    } catch (error) {
      console.error("Batch delete error:", error);
      showToast.error("An error occurred during batch deletion", "Error");
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Bug className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Bug Hunt</h1>
              <p className="text-gray-600">Manage and triage bug reports</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-black">{statusCounts.total}</p>
              </div>
              <Bug className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New</p>
                <p className="text-2xl font-bold text-purple-400">{statusCounts.new}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-400">{statusCounts.inProgress}</p>
              </div>
              <Loader2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{statusCounts.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Severity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600 mb-1">Critical</p>
            <p className="text-xl font-bold text-red-600">{severityCounts.critical}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-xs text-orange-600 mb-1">High</p>
            <p className="text-xl font-bold text-orange-600">{severityCounts.high}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-600 mb-1">Medium</p>
            <p className="text-xl font-bold text-yellow-600">{severityCounts.medium}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 mb-1">Low</p>
            <p className="text-xl font-bold text-blue-600">{severityCounts.low}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by title, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Batch Selection Toggle */}
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isSelectionMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {isSelectionMode ? "Cancel" : "Select"}
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-lg text-purple-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {/* Severity Filter */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="wont-fix">Won't Fix</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-purple-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="severity">Severity</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Batch Action Bar */}
        {isSelectionMode && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={selectAll}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 transition-colors text-sm"
              >
                {selectedIds.size === filteredReports.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Select All
                  </>
                )}
              </button>
              <span className="text-sm text-gray-600">
                {selectedIds.size} of {filteredReports.length} selected
              </span>
            </div>
            <button
              onClick={() => setShowBatchDeleteConfirm(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        )}

        {/* Bug Reports List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || severityFilter !== "all" || statusFilter !== "all"
                  ? "No bug reports match your filters"
                  : "No bug reports yet"}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors ${
                  !isSelectionMode ? "cursor-pointer" : ""
                } ${selectedIds.has(report.id) ? "ring-2 ring-purple-500 bg-purple-50" : ""}`}
                onClick={() => !isSelectionMode && setSelectedBugId(report.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(report.id);
                      }}
                      className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {selectedIds.has(report.id) ? (
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* Severity Indicator */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${getSeverityColor(
                        report.severity
                      )}`}
                    >
                      <Bug className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-black truncate mb-1">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-purple-700">
                            {generateReferenceId(report.id)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getSeverityColor(
                              report.severity
                            )}`}
                          >
                            {report.severity}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                              report.status
                            )}`}
                          >
                            {report.status}
                          </span>
                          {report.category && (
                            <span className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 bg-gray-100">
                              {report.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-600">{formatDate(report.createdAt)}</p>
                        {report.attachments.length > 0 && (
                          <p className="text-xs text-purple-700 mt-1">
                            {report.attachments.length} attachment{report.attachments.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reporter Info */}
                    {(report.reporterName || report.reporterEmail) && (
                      <p className="text-sm text-gray-600 mb-2">
                        From: {report.reporterName || "Anonymous"}
                        {report.reporterEmail && (
                          <span className="text-gray-500"> ({report.reporterEmail})</span>
                        )}
                      </p>
                    )}

                    {/* URL */}
                    {report.url && (
                      <p className="text-xs text-gray-500 truncate mb-2">
                        URL: {report.url}
                      </p>
                    )}

                    {/* Admin Notes Count */}
                    {report.adminNotes.length > 0 && (
                      <p className="text-xs text-blue-700">
                        {report.adminNotes.length} admin note{report.adminNotes.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBugId(report.id);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
                    {!isSelectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(report.id, report.title);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black mb-1">
                  Delete Bug Report?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete "{deleteTarget.title}"?
                </p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                This will move the bug report to the recycle bin. You can restore it within 30 days.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSingleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black mb-1">
                  Delete {selectedIds.size} Bug Report{selectedIds.size > 1 ? "s" : ""}?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete {selectedIds.size} bug report{selectedIds.size > 1 ? "s" : ""}?
                </p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                This will move all selected bug reports to the recycle bin. You can restore them within 30 days.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete {selectedIds.size}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bug Detail Modal */}
      <AnimatePresence>
        {selectedBugId && (
          <BugDetailModal
            bugId={selectedBugId}
            onClose={() => setSelectedBugId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
