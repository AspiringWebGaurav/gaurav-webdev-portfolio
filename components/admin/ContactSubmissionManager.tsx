"use client";

import React, { useState, useMemo } from "react";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { showToast } from "@/lib/toast";
import {
  Mail,
  MailOpen,
  Trash2,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  MessageSquare,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import { ContactSubmission } from "@/types/contactSubmission";
import { formatDistanceToNow } from "date-fns";

export default function ContactSubmissionManager() {
  const {
    submissions,
    loading,
    deleteSubmission,
    markAsReplied,
    markAsRead,
    getNewSubmissionsCount,
  } = useContactSubmissions();

  const { moveToRecycleBin } = useRecycleBin();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unread" | "read"
  >("all");
  const [viewingSubmission, setViewingSubmission] =
    useState<ContactSubmission | null>(null);
  const [deletingSubmission, setDeletingSubmission] =
    useState<ContactSubmission | null>(null);
  
  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Filter and search submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "unread") {
        filtered = filtered.filter((s) => s.status === "new");
      } else if (statusFilter === "read") {
        filtered = filtered.filter(
          (s) => s.status === "read" || s.status === "replied"
        );
      } else {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [submissions, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const unread = submissions.filter((s) => s.status === "new").length;
    const read = submissions.filter(
      (s) => s.status === "read" || s.status === "replied"
    ).length;

    return {
      total: submissions.length,
      unread: unread,
      read: read,
    };
  }, [submissions]);

  /**
   * Handle viewing submission
   */
  const handleView = async (submission: ContactSubmission) => {
    setViewingSubmission(submission);

    // Mark as read if it's new
    if (submission.status === "new") {
      await markAsRead(submission.id);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async (id: string) => {
    const submission = submissions.find((s) => s.id === id);
    if (submission) {
      setDeletingSubmission(submission);
    }
  };

  /**
   * Confirm delete - Move to recycle bin instead of permanent delete
   */
  const confirmDelete = async () => {
    if (!deletingSubmission) return;

    // Close modal immediately
    const submissionToDelete = deletingSubmission;
    setDeletingSubmission(null);

    // Show progress notification
    showToast.info("Processing deletion...", "Deleting...");

    try {
      // Move to recycle bin first (silent mode - we'll show our own notification)
      const recycleBinResult = await moveToRecycleBin(
        "contactSubmission",
        submissionToDelete,
        submissionToDelete.id,
        true
      );

      // Check if recycle bin move failed
      if (!recycleBinResult.success) {
        showToast.error(
          recycleBinResult.error || "Failed to move to recycle bin",
          "Delete Failed"
        );
        return;
      }

      // Then delete from active submissions (silent mode)
      const deleteResult = await deleteSubmission(submissionToDelete.id, true);

      if (viewingSubmission?.id === submissionToDelete.id) {
        setViewingSubmission(null);
      }

      // Show single notification for the complete operation
      if (deleteResult.success) {
        showToast.success(
          "Submission moved to recycle bin",
          "Moved to Recycle Bin"
        );
      } else {
        showToast.error(
          deleteResult.error || "Failed to delete submission",
          "Delete Failed"
        );
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to delete submission",
        "Delete Failed"
      );
    }
  };

  /**
   * Toggle selection mode
   */
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  /**
   * Toggle item selection
   */
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  /**
   * Select all filtered submissions
   */
  const selectAll = () => {
    if (selectedIds.size === filteredSubmissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  /**
   * Handle batch delete with silent mode for individual operations
   * Shows a single comprehensive notification at the end
   */
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      showToast.warning(
        "Please select items to delete",
        "No Selection"
      );
      return;
    }

    const selectedSubmissions = submissions.filter(s => selectedIds.has(s.id));
    
    if (selectedSubmissions.length === 0) {
      showToast.warning(
        "Selected items not found",
        "No Items Found"
      );
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBatchDeleteConfirm(false);
      return;
    }

    // Close modal immediately
    setShowBatchDeleteConfirm(false);

    // Show progress notification
    const totalItems = selectedSubmissions.length;
    showToast.info(
      `Processing ${totalItems} submission${totalItems > 1 ? 's' : ''}...`,
      "Deleting..."
    );

    // Process deletions in background
    try {
      let successCount = 0;
      let failCount = 0;
      let recycleBinFailures = 0;
      let deleteFailures = 0;
      const failedNames: string[] = [];

      // Delete each selected submission with silent mode
      for (const submission of selectedSubmissions) {
        let movedToRecycleBin = false;
        let deletedFromActive = false;

        try {
          // Step 1: Move to recycle bin (SILENT MODE)
          const recycleBinResult = await moveToRecycleBin(
            "contactSubmission",
            submission,
            submission.id,
            true
          );
          movedToRecycleBin = recycleBinResult.success;

          if (!movedToRecycleBin) {
            // Failed to move to recycle bin, count as failure
            failCount++;
            recycleBinFailures++;
            failedNames.push(submission.name);
            continue; // Skip deletion if recycle bin move failed
          }

          // Step 2: Delete from active submissions (SILENT MODE)
          const deleteResult = await deleteSubmission(submission.id, true);
          deletedFromActive = deleteResult.success;
          
          if (deletedFromActive) {
            successCount++;
          } else {
            failCount++;
            deleteFailures++;
            failedNames.push(submission.name);
          }
        } catch (error) {
          console.error(`Failed to delete submission ${submission.id}:`, error);
          failCount++;
          
          if (!movedToRecycleBin) {
            recycleBinFailures++;
          } else if (!deletedFromActive) {
            deleteFailures++;
          }
          
          failedNames.push(submission.name);
        }
      }

      // Close viewing modal if selected item was deleted
      if (viewingSubmission && selectedIds.has(viewingSubmission.id)) {
        setViewingSubmission(null);
      }

      // Reset selection state
      setSelectedIds(new Set());
      setIsSelectionMode(false);

      // Show SINGLE comprehensive notification based on results
      if (failCount === 0) {
        // All successful
        showToast.success(
          `Successfully deleted ${successCount} submission${successCount > 1 ? 's' : ''} and moved to recycle bin`,
          "Batch Delete Successful"
        );
      } else if (successCount === 0) {
        // All failed
        showToast.error(
          `Failed to delete ${failCount} submission${failCount > 1 ? 's' : ''}. Please try again.`,
          "Batch Delete Failed"
        );
      } else {
        // Partial success - show detailed message
        const failedList = failedNames.slice(0, 3).join(', ');
        const moreCount = failCount > 3 ? ` and ${failCount - 3} more` : '';
        
        showToast.warning(
          `${successCount} deleted successfully, ${failCount} failed. Failed items: ${failedList}${moreCount}`,
          "Batch Delete Partial Success"
        );
      }
    } catch (error) {
      console.error("Unexpected error in batch delete:", error);
      
      // Reset state even on error
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBatchDeleteConfirm(false);
      
      showToast.error(
        "An unexpected error occurred during batch delete. Please try again.",
        "Batch Delete Failed"
      );
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: string) => {
    const badges = {
      new: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
          <Mail className="w-3 h-3" />
          Unread
        </span>
      ),
      read: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
          <MailOpen className="w-3 h-3" />
          Read
        </span>
      ),
      replied: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Replied
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || null;
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.unread}</div>
          <div className="text-sm text-blue-600">Unread</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{stats.read}</div>
          <div className="text-sm text-green-600">Read</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or message..."
              className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "unread" | "read"
                )
              }
              className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by status"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isSelectionMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title={isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
            >
              <CheckSquare className="w-4 h-4" />
              {isSelectionMode ? "Cancel" : "Select"}
            </button>

            {isSelectionMode && (
              <>
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  title={selectedIds.size === filteredSubmissions.length ? "Deselect all" : "Select all"}
                >
                  {selectedIds.size === filteredSubmissions.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedIds.size === filteredSubmissions.length ? "Deselect All" : "Select All"}
                </button>

                <button
                  onClick={() => setShowBatchDeleteConfirm(true)}
                  disabled={selectedIds.size === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                    selectedIds.size === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  title={selectedIds.size === 0 ? "No items selected" : `Delete ${selectedIds.size} selected item${selectedIds.size > 1 ? 's' : ''}`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Selection Mode Info Banner */}
      {isSelectionMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Selection Mode Active
                </p>
                <p className="text-xs text-blue-700">
                  {selectedIds.size === 0
                    ? "Click checkboxes to select submissions"
                    : `${selectedIds.size} submission${selectedIds.size > 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSelectionMode}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Exit Selection Mode
            </button>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Mail className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No submissions found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Contact form submissions will appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  submission.status === "new" ? "bg-blue-50/30" : ""
                } ${isSelectionMode ? "" : "cursor-pointer"}`}
                onClick={() => !isSelectionMode && handleView(submission)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Checkbox in selection mode */}
                  {isSelectionMode && (
                    <div className="flex items-center pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(submission.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {selectedIds.has(submission.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {submission.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {submission.email}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Read Status Badge */}
                        {submission.status === "read" || submission.status === "replied" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ✕ Unread
                          </span>
                        )}

                        {/* Replied Status Badge */}
                        {submission.isReplied ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            ✓ Replied
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ✕ Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {submission.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(submission.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {submission.isReplied && submission.repliedAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Replied{" "}
                          {formatDistanceToNow(new Date(submission.repliedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {submission.status === "new" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(submission.id);
                          showToast.success(
                            "Submission marked as read",
                            "Marked as Read"
                          );
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as Read"
                      >
                        <MailOpen className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(submission.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Submission Modal - Compact Single View */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 flex items-center justify-between rounded-t-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <div>
                  <h3 className="text-lg font-bold">Contact Submission Details</h3>
                  <p className="text-blue-100 text-xs">Review and manage submission</p>
                </div>
              </div>
              <button
                onClick={() => setViewingSubmission(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Compact Grid Layout */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* Top Stats Bar */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase">Received</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">{formatDistanceToNow(new Date(viewingSubmission.createdAt), { addSuffix: true })}</p>
                  <p className="text-xs text-gray-600">{new Date(viewingSubmission.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <MailOpen className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase">Read</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {viewingSubmission.status === "new" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                        ✕ Unread
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Read
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {viewingSubmission.status === "new" ? "Not marked as read" : "Marked as read"}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-purple-700 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase">Replied</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {viewingSubmission.isReplied ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                        ✓ Replied
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                        ✕ Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {viewingSubmission.isReplied && viewingSubmission.repliedAt 
                      ? formatDistanceToNow(new Date(viewingSubmission.repliedAt), { addSuffix: true }) 
                      : "No reply yet"}
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700 mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase">Sender</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate">{viewingSubmission.name}</p>
                  <p className="text-xs text-gray-600 truncate">{viewingSubmission.email}</p>
                </div>
              </div>

              {/* Main Content - 3 Column Layout */}
              <div className="grid grid-cols-12 gap-4">
                {/* Left: Contact Info - 3 columns */}
                <div className="col-span-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Full Name</label>
                      <p className="text-sm font-semibold text-gray-900">{viewingSubmission.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email Address</label>
                      <a href={`mailto:${viewingSubmission.email}`} className="text-sm font-semibold text-blue-600 hover:underline block truncate">
                        {viewingSubmission.email}
                      </a>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Timeline
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Submitted At</label>
                        <p className="text-xs text-gray-900">{new Date(viewingSubmission.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      {viewingSubmission.status === "read" || viewingSubmission.status === "replied" ? (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Marked as Read</label>
                          <p className="text-xs text-gray-900">{viewingSubmission.updatedAt ? new Date(viewingSubmission.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}</p>
                        </div>
                      ) : null}
                      {viewingSubmission.isReplied && viewingSubmission.repliedAt && (
                        <>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Replied At</label>
                            <p className="text-xs text-gray-900">{new Date(viewingSubmission.repliedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          {viewingSubmission.repliedBy && (
                            <div>
                              <label className="text-xs font-medium text-gray-500">Replied By</label>
                              <p className="text-xs text-gray-900">{viewingSubmission.repliedBy}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Message - 6 columns */}
                <div className="col-span-6 bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 h-[340px] overflow-y-auto">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{viewingSubmission.message}</p>
                  </div>
                </div>

                {/* Right: Actions & Reply - 3 columns */}
                <div className="col-span-3 space-y-3">
                  {/* Actions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-900 uppercase mb-2">Actions</h4>
                    <div className="space-y-2">
                      {viewingSubmission.status === "new" && (
                        <button
                          onClick={() => {
                            markAsRead(viewingSubmission.id);
                            showToast.success(
                              "Submission marked as read",
                              "Marked as Read"
                            );
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                          Mark as Read
                        </button>
                      )}
                      {!viewingSubmission.isReplied && (
                        <button
                          onClick={async () => {
                            const currentUser = "admin@portfolio.com";
                            const result = await markAsReplied(viewingSubmission.id, currentUser);
                            if (result.success && result.data && !Array.isArray(result.data)) {
                              setViewingSubmission(result.data);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark as Replied
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleDelete(viewingSubmission.id);
                          setViewingSubmission(null);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Reply Info */}
                  {viewingSubmission.isReplied && viewingSubmission.replyMessage ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-green-900 uppercase mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Your Reply
                      </h4>
                      <div className="bg-white border border-green-200 rounded p-2 max-h-[220px] overflow-y-auto">
                        <p className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">{viewingSubmission.replyMessage}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2">Reply via Email</h4>
                      <a
                        href={`mailto:${viewingSubmission.email}`}
                        className="text-xs text-blue-600 hover:underline break-all"
                      >
                        {viewingSubmission.email}
                      </a>
                      <p className="text-xs text-gray-500 mt-2">Admin can reply manually via email</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-5 py-3 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setViewingSubmission(null)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex items-center gap-3 rounded-t-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
                <p className="text-red-100 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-900 mb-6">
                Are you sure you want to delete the submission from{" "}
                <span className="font-semibold">{deletingSubmission.name}</span>{" "}
                ({deletingSubmission.email})?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setDeletingSubmission(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex items-center gap-3 rounded-t-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Confirm Batch Deletion</h3>
                <p className="text-red-100 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-900 mb-3">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-red-600">{selectedIds.size}</span>{" "}
                  submission{selectedIds.size > 1 ? 's' : ''}?
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">⚠️ Warning:</span> All selected submissions will be moved to the recycle bin.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBatchDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedIds.size} Item{selectedIds.size > 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => setShowBatchDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
