/**
 * Ban Appeals Manager Component
 * Admin interface for reviewing and managing ban appeals
 */

"use client";

import React, { useState, useMemo } from "react";
import { showToast } from "@/lib/toast";
import { useBanAppeals } from "@/contexts/BanAppealsContext";
import {
  Shield,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  Calendar,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  Skull,
  Info,
} from "lucide-react";
import { BanAppeal } from "@/types/banAppeal";
import { formatDistanceToNow } from "date-fns";

export default function BanAppealsManager() {
  const {
    appeals,
    loading,
    reviewAppeal,
    deleteAppeal,
    getPendingCount,
  } = useBanAppeals();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "normal" | "medium" | "danger" | "severe">("all");
  const [viewingAppeal, setViewingAppeal] = useState<BanAppeal | null>(null);
  const [reviewingAppeal, setReviewingAppeal] = useState<BanAppeal | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [deletingAppeal, setDeletingAppeal] = useState<BanAppeal | null>(null);

  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter and search appeals
  const filteredAppeals = useMemo(() => {
    let filtered = appeals;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((a) => a.banCategory === categoryFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.visitorId.toLowerCase().includes(query) ||
          a.appealReason.toLowerCase().includes(query) ||
          a.banReason.toLowerCase().includes(query) ||
          a.reviewNotes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [appeals, statusFilter, categoryFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const pending = appeals.filter((a) => a.status === "pending").length;
    const accepted = appeals.filter((a) => a.status === "accepted").length;
    const rejected = appeals.filter((a) => a.status === "rejected").length;

    return {
      total: appeals.length,
      pending,
      accepted,
      rejected,
    };
  }, [appeals]);

  /**
   * Get ban category icon
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "normal":
        return <Info className="w-4 h-4" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4" />;
      case "danger":
        return <Shield className="w-4 h-4" />;
      case "severe":
        return <Skull className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  /**
   * Get ban category color
   */
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "normal":
        return "blue";
      case "medium":
        return "yellow";
      case "danger":
        return "orange";
      case "severe":
        return "red";
      default:
        return "gray";
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "accepted":
        return "green";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  /**
   * Handle viewing appeal
   */
  const handleView = (appeal: BanAppeal) => {
    setViewingAppeal(appeal);
  };

  /**
   * Handle review appeal
   */
  const handleReviewStart = (appeal: BanAppeal) => {
    setReviewingAppeal(appeal);
    setReviewNotes("");
  };

  /**
   * Confirm review (accept or reject)
   */
  const confirmReview = async (action: "accept" | "reject") => {
    if (!reviewingAppeal) return;

    try {
      const result = await reviewAppeal({
        id: reviewingAppeal.id,
        action,
        reviewedBy: "admin@portfolio.com", // You can get this from auth context
        reviewNotes: reviewNotes.trim() || undefined,
      });

      if (result.success) {
        setReviewingAppeal(null);
        setReviewNotes("");
        if (viewingAppeal?.id === reviewingAppeal.id) {
          setViewingAppeal(null);
        }
      } else {
        showToast.error(result.error || "Failed to review appeal", "Review Failed");
      }
    } catch (error) {
      console.error("Error reviewing appeal:", error);
      showToast.error("An unexpected error occurred", "Review Failed");
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = (appeal: BanAppeal) => {
    setDeletingAppeal(appeal);
  };

  /**
   * Confirm delete
   */
  const confirmDelete = async () => {
    if (!deletingAppeal) return;

    // Close modal immediately
    const appealToDelete = deletingAppeal;
    setDeletingAppeal(null);

    // Show progress notification
    showToast.info("Deleting appeal...", "Deleting...");

    try {
      const result = await deleteAppeal(appealToDelete.id);

      if (result.success) {
        if (viewingAppeal?.id === appealToDelete.id) {
          setViewingAppeal(null);
        }
      } else {
        showToast.error(result.error || "Failed to delete appeal", "Delete Failed");
      }
    } catch (error) {
      console.error("Error deleting appeal:", error);
      showToast.error("An unexpected error occurred", "Delete Failed");
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
   * Select all filtered appeals
   */
  const selectAll = () => {
    setSelectedIds(new Set(filteredAppeals.map((a) => a.id)));
  };

  /**
   * Deselect all
   */
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Ban Appeals
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and manage visitor ban appeals
          </p>
        </div>

        {/* Batch Actions */}
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                disabled={selectedIds.size === 0}
              >
                Clear
              </button>
              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={toggleSelectionMode}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appeals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.accepted}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.rejected}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search appeals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as typeof categoryFilter)
            }
            className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="danger">Danger</option>
            <option value="severe">Severe</option>
          </select>
        </div>
      </div>

      {/* Appeals List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAppeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Shield className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No ban appeals found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Appeals will appear here when visitors submit them"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppeals.map((appeal) => {
              const statusColor = getStatusColor(appeal.status);
              const categoryColor = getCategoryColor(appeal.banCategory);
              const isSelected = selectedIds.has(appeal.id);

              return (
                <div
                  key={appeal.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                      <button
                        onClick={() => toggleSelection(appeal.id)}
                        className="mt-1 text-gray-400 hover:text-gray-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}

                    {/* Category Icon */}
                    <div
                      className={`p-2 rounded-lg bg-${categoryColor}-100 text-${categoryColor}-600 flex-shrink-0`}
                    >
                      {getCategoryIcon(appeal.banCategory)}
                    </div>

                    {/* Appeal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-gray-900">
                              Visitor ID: {appeal.visitorId.slice(0, 16)}...
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700`}
                            >
                              {appeal.status}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${categoryColor}-100 text-${categoryColor}-700`}
                            >
                              {appeal.banCategory}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Ban Reason: {appeal.banReason}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(appeal)}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {appeal.status === "pending" && (
                            <button
                              onClick={() => handleReviewStart(appeal)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(appeal)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {appeal.appealReason}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(appeal.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {appeal.reviewedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Reviewed by {appeal.reviewedBy}
                          </span>
                        )}
                        {appeal.geoLocation && (
                          <span>
                            📍 {appeal.geoLocation.city}, {appeal.geoLocation.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Appeal Modal */}
      {viewingAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Appeal Details</h2>
              <button
                onClick={() => setViewingAppeal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Category */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(
                    viewingAppeal.status
                  )}-100 text-${getStatusColor(viewingAppeal.status)}-700`}
                >
                  {viewingAppeal.status}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium bg-${getCategoryColor(
                    viewingAppeal.banCategory
                  )}-100 text-${getCategoryColor(viewingAppeal.banCategory)}-700`}
                >
                  {viewingAppeal.banCategory} Ban
                </span>
              </div>

              {/* Visitor Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Visitor ID:</span>
                  <span className="font-mono text-gray-900">
                    {viewingAppeal.visitorId}
                  </span>
                </div>
                {viewingAppeal.deviceInfo && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Device:</span>
                    <span className="text-gray-900">{viewingAppeal.deviceInfo}</span>
                  </div>
                )}
                {viewingAppeal.geoLocation && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">
                      {viewingAppeal.geoLocation.city}, {viewingAppeal.geoLocation.country}
                    </span>
                  </div>
                )}
              </div>

              {/* Ban Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Original Ban</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Reason:</strong> {viewingAppeal.banReason}
                  </p>
                  <p className="text-xs text-gray-600">
                    Banned {formatDistanceToNow(new Date(viewingAppeal.banTimestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Appeal Reason */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Appeal Reason</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {viewingAppeal.appealReason}
                  </p>
                </div>
              </div>

              {/* Review Info */}
              {viewingAppeal.reviewedAt && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Review</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Reviewed by:</span>
                      <span className="text-gray-900">{viewingAppeal.reviewedBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Reviewed:</span>
                      <span className="text-gray-900">
                        {formatDistanceToNow(new Date(viewingAppeal.reviewedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {viewingAppeal.reviewNotes && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-700">{viewingAppeal.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {viewingAppeal.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReviewStart(viewingAppeal)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                  >
                    Review Appeal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Review Appeal</h2>
              <button
                onClick={() => {
                  setReviewingAppeal(null);
                  setReviewNotes("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Appeal Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Ban Reason:</strong> {reviewingAppeal.banReason}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Appeal:</strong> {reviewingAppeal.appealReason}
                </p>
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes are for internal reference only
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => confirmReview("accept")}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept & Unban
                </button>
                <button
                  onClick={() => confirmReview("reject")}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Appeal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Appeal?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will move the appeal to the recycle bin. You can restore it within 30 days.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingAppeal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
