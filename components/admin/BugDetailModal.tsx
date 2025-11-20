"use client";

/**
 * Bug Detail Modal - Admin view for individual bug report
 * Shows all details, attachments, admin notes, and allows status updates
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Bug,
  AlertCircle,
  Image as ImageIcon,
  MessageSquare,
  Save,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  Globe,
  Monitor,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBugReports } from "@/contexts/BugReportContext";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { showToast } from "@/lib/toast";
import {
  BugSeverity,
  BugStatus,
  BugCategory,
  generateReferenceId,
  SEVERITY_DESCRIPTIONS,
} from "@/types/bugReport";

interface BugDetailModalProps {
  bugId: string;
  onClose: () => void;
}

export default function BugDetailModal({ bugId, onClose }: BugDetailModalProps) {
  const { getBugReportById, updateBugReport, addAdminNote, deleteBugReport } =
    useBugReports();
  const { moveToRecycleBin } = useRecycleBin();

  const [mounted, setMounted] = useState(false);
  const [bug, setBug] = useState(getBugReportById(bugId));
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [status, setStatus] = useState<BugStatus>(bug?.status || "new");
  const [severity, setSeverity] = useState<BugSeverity>(bug?.severity || "medium");
  const [category, setCategory] = useState<BugCategory | "">(bug?.category || "");
  const [assignedTo, setAssignedTo] = useState(bug?.assignedTo || "");
  const [adminNoteText, setAdminNoteText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Update bug when context changes
    const updatedBug = getBugReportById(bugId);
    if (updatedBug) {
      setBug(updatedBug);
      setStatus(updatedBug.status);
      setSeverity(updatedBug.severity);
      setCategory(updatedBug.category || "");
      setAssignedTo(updatedBug.assignedTo || "");
    }
  }, [bugId, getBugReportById]);

  if (!bug) {
    return null;
  }

  // Handle save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBugReport({
        id: bugId,
        status,
        severity,
        category: category || undefined,
        assignedTo: assignedTo || undefined,
        resolvedBy: status === "resolved" ? "admin@example.com" : undefined,
        resolvedAt: status === "resolved" ? new Date() : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle add admin note
  const handleAddNote = async () => {
    if (!adminNoteText.trim()) return;

    setSaving(true);
    try {
      await addAdminNote({
        bugReportId: bugId,
        content: adminNoteText.trim(),
        createdBy: "admin@example.com", // TODO: Get from auth
      });
      setAdminNoteText("");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this bug report? It will be moved to the recycle bin and can be restored within 30 days.")) return;

    setSaving(true);
    
    try {
      // Move to recycle bin first (silent mode)
      const recycleBinResult = await moveToRecycleBin(
        "bugReport",
        bug,
        bug.id,
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
      const deleteResult = await deleteBugReport(bugId, true);

      if (deleteResult.success) {
        showToast.success(
          "Bug report moved to recycle bin",
          "Moved to Recycle Bin"
        );
        onClose();
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
    } finally {
      setSaving(false);
    }
  };

  // Severity color
  const getSeverityColor = (sev: BugSeverity) => {
    switch (sev) {
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

  // Status color
  const getStatusColor = (stat: BugStatus) => {
    switch (stat) {
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Bug className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Bug Report Details</h2>
                <p className="text-sm text-gray-600 font-mono">
                  {generateReferenceId(bug.id)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            {/* Left Column - Bug Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Badges */}
              <div>
                <h3 className="text-2xl font-bold text-black mb-3">{bug.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${getSeverityColor(
                      bug.severity
                    )}`}
                  >
                    {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(
                      bug.status
                    )}`}
                  >
                    {bug.status === 'in-progress' ? 'In Progress' : 
                     bug.status === 'wont-fix' ? "Won't Fix" :
                     bug.status.charAt(0).toUpperCase() + bug.status.slice(1)}
                  </span>
                  {bug.category && (
                    <span className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-700 bg-gray-100">
                      {bug.category.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Reporter Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Reporter Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    Name: <span className="text-black">{bug.reporterName || "Anonymous"}</span>
                  </p>
                  {bug.reporterEmail && (
                    <p className="text-gray-600">
                      Email: <span className="text-black">{bug.reporterEmail}</span>
                    </p>
                  )}
                  <p className="text-gray-600">
                    Submitted:{" "}
                    <span className="text-black">{bug.createdAt.toLocaleString()}</span>
                  </p>
                  {bug.browserInfo && (
                    <p className="text-gray-600">
                      Browser: <span className="text-black">{bug.browserInfo}</span>
                    </p>
                  )}
                  {bug.url && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      URL:
                      <a
                        href={bug.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 underline flex items-center gap-1"
                      >
                        {bug.url.substring(0, 50)}
                        {bug.url.length > 50 && "..."}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Steps to Reproduce */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-black mb-3">Steps to Reproduce</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
              </div>

              {/* Expected Behavior */}
              {bug.expectedBehavior && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">Expected Behavior</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{bug.expectedBehavior}</p>
                </div>
              )}

              {/* Actual Behavior */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-black mb-3">Actual Behavior</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{bug.actualBehavior}</p>
              </div>

              {/* Attachments */}
              {bug.attachments.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Attachments ({bug.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {bug.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(att.url)}
                      >
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <p className="text-white text-xs text-center px-2 truncate">
                            {att.fileName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Admin Notes ({bug.adminNotes.length})
                </h4>

                {/* Existing Notes */}
                <div className="space-y-3 mb-4">
                  {bug.adminNotes.map((note) => (
                    <div key={note.id} className="bg-white border border-gray-300 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-700">{note.createdBy}</span>
                        <span className="text-xs text-gray-500">
                          {note.createdAt.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note */}
                <div className="space-y-2">
                  <textarea
                    value={adminNoteText}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                    placeholder="Add admin note..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!adminNoteText.trim() || saving}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    Add Note
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Admin Controls */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-black mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BugStatus)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-purple-500"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="wont-fix">Won't Fix</option>
                </select>
              </div>

              {/* Severity */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-black mb-2">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  {SEVERITY_DESCRIPTIONS[severity]}
                </p>
              </div>

              {/* Category */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-black mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BugCategory | "")}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-purple-500"
                >
                  <option value="">None</option>
                  <option value="ui">UI</option>
                  <option value="performance">Performance</option>
                  <option value="functional">Functional</option>
                  <option value="visual">Visual</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Assigned To */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-black mb-2">Assigned To</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>

                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-300 text-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Report
                </button>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 space-y-1">
                <p>Created: {bug.createdAt.toLocaleString()}</p>
                <p>Updated: {bug.updatedAt.toLocaleString()}</p>
                {bug.resolvedAt && <p>Resolved: {bug.resolvedAt.toLocaleString()}</p>}
                {bug.spamScore !== undefined && (
                  <p>Spam Score: {bug.spamScore}/100</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Image Lightbox */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
