"use client";

/**
 * Crash Detail Modal
 * Detailed view of crash report with screenshot, stack trace, and admin actions
 * THIS IS THE KEY COMPONENT - Shows live screenshot of crash
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  CheckCircle,
  Code,
  Info,
  MessageSquare,
  Trash2,
  UserPlus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrashReports } from "../../contexts/CrashReportContext";
import { getSeverityColor, getStatusColor } from "../../types/crashReport";

interface Props {
  crashId: string;
  onClose: () => void;
}

export default function CrashDetailModal({ crashId, onClose }: Props) {
  const {
    crashReports,
    updateCrashReport,
    addAdminNote,
    deleteCrashReport,
  } = useCrashReports();

  const report = crashReports.find((r) => r.id === crashId);

  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"stack" | "info">("stack");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!report) {
    return null;
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyFullReport = async () => {
    try {
      const fullReport = `
=== CRASH REPORT ===
ID: ${report.id}
Title: ${report.title || report.errorName}
Severity: ${report.severity.toUpperCase()}
Status: ${report.status}
Occurrences: ${report.occurenceCount}
First Seen: ${new Date(report.firstSeen).toLocaleString()}
Last Seen: ${new Date(report.lastSeen).toLocaleString()}

=== ERROR DETAILS ===
${report.errorName}: ${report.errorMessage}

=== STACK TRACE ===
${report.errorStack}

${report.componentStack ? `=== COMPONENT STACK ===\n${report.componentStack}\n` : ''}

=== CONTEXT ===
URL: ${report.url || 'N/A'}
User Agent: ${report.userAgent || 'N/A'}
Session ID: ${report.sessionId || 'N/A'}
Visitor ID: ${report.visitorId || 'N/A'}

=== RUNTIME ===
React: ${report.reactVersion || 'N/A'}
Next.js: ${report.nextVersion || 'N/A'}
Environment: ${report.environment || 'N/A'}

${report.adminNotes.length > 0 ? `=== ADMIN NOTES ===\n${report.adminNotes.map(note => `[${new Date(note.createdAt).toLocaleString()}] ${note.createdBy}: ${note.content}`).join('\n')}\n` : ''}
`.trim();

      await navigator.clipboard.writeText(fullReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy full report:", err);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateCrashReport(report.id, { status: status as any });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      await addAdminNote(report.id, noteText);
      setNoteText("");
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  const handleDeleteClick = () => {
    console.log("Delete button clicked, showing confirmation");
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    console.log("Delete confirmed, executing deletion");
    try {
      await deleteCrashReport(report.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete crash report");
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    console.log("Delete cancelled");
    setShowDeleteConfirm(false);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-gray-900 rounded-xl border border-white/10 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh page"
            >
              <RefreshCw className="w-5 h-5 text-white/60 hover:text-white" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                    report.severity
                  )}`}
                >
                  {report.severity.toUpperCase()}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                    report.status
                  )}`}
                >
                  {report.status}
                </span>
                {report.occurenceCount > 1 && (
                  <span className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {report.occurenceCount}x occurrences
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">
                {report.title || report.errorName}
              </h2>
              <p className="text-sm text-white/60">
                {new Date(report.createdAt).toLocaleString()} • {typeof report.browserInfo === 'object' ? `${report.browserInfo.name || 'Unknown'} ${report.browserInfo.version || ''}` : report.browserInfo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Copy Full Report Button */}
            <button
              onClick={copyFullReport}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              title="Copy full crash report"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Full Report
                </>
              )}
            </button>

            {/* Open in Full Page Button */}
            <a
              href={`/admin/crash-reports/${report.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              title="Open in full page"
            >
              <ExternalLink className="w-4 h-4" />
              Full Page
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-white/10 bg-white/5">
          <button
            onClick={() => setActiveTab("stack")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "stack"
                ? "bg-purple/20 text-purple-300"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Stack Trace
            </div>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "bg-purple/20 text-purple-300"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Details
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* TAB: Stack Trace */}
          {activeTab === "stack" && (
            <div className="space-y-4">
              {/* Error Message */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-red-400">Error Message</h3>
                  <button
                    onClick={() => copyToClipboard(report.errorMessage)}
                    className="text-xs flex items-center gap-1 text-white/60 hover:text-white transition"
                  >
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-white font-mono text-sm">{report.errorMessage}</p>
              </div>

              {/* Stack Trace */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">Stack Trace</h3>
                  <button
                    onClick={() => copyToClipboard(report.errorStack)}
                    className="text-xs flex items-center gap-1 text-white/60 hover:text-white transition"
                  >
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="text-xs text-gray-300 overflow-auto max-h-96 font-mono bg-black/20 p-4 rounded">
                  {report.errorStack}
                </pre>
              </div>

              {/* Component Stack */}
              {report.componentStack && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Component Stack</h3>
                  <pre className="text-xs text-gray-300 overflow-auto max-h-48 font-mono bg-black/20 p-4 rounded">
                    {report.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB: Details */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Environment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Environment</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-white/50">URL:</span>
                      <div className="text-white mt-1 break-all">{report.url}</div>
                    </div>
                    <div>
                      <span className="text-white/50">Browser:</span>
                      <div className="text-white mt-1">
                        {typeof report.browserInfo === 'object' 
                          ? `${report.browserInfo.name || 'Unknown'} ${report.browserInfo.version || ''} on ${report.browserInfo.os || 'Unknown OS'}`
                          : report.browserInfo}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/50">Session:</span>
                      <div className="text-white mt-1 font-mono text-xs">{report.sessionId}</div>
                    </div>
                    {report.visitorId && (
                      <div>
                        <span className="text-white/50">Visitor:</span>
                        <div className="text-white mt-1 font-mono text-xs">{report.visitorId}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-white/50">Occurrences:</span>
                      <div className="text-white mt-1">{report.occurenceCount}</div>
                    </div>
                    <div>
                      <span className="text-white/50">First seen:</span>
                      <div className="text-white mt-1">
                        {new Date(report.firstSeen).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/50">Last seen:</span>
                      <div className="text-white mt-1">
                        {new Date(report.lastSeen).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/50">Affected users:</span>
                      <div className="text-white mt-1">{report.affectedUsers.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Status Management</h3>
                <div className="flex flex-wrap gap-2">
                  {["new", "acknowledged", "in-progress", "resolved", "ignored"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-4 py-2 rounded-lg text-sm transition ${
                        report.status === status
                          ? "bg-purple/30 text-purple-300 border border-purple/50"
                          : "bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-white" />
                  <h3 className="font-semibold text-white">Admin Notes</h3>
                </div>

                {/* Existing Notes */}
                {report.adminNotes && report.adminNotes.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {report.adminNotes.map((note) => (
                      <div key={note.id} className="bg-black/20 p-3 rounded-lg">
                        <p className="text-sm text-white">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {note.createdBy} • {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Note */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddNote()}
                    className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-purple/40"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="px-4 py-2 bg-purple/20 hover:bg-purple/30 rounded-lg transition disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete Report
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  console.log("showDeleteConfirm state:", showDeleteConfirm);

  // Use portal to render modals
  if (typeof document === "undefined") {
    return null;
  }

  return (
    <>
      {createPortal(modalContent, document.body)}
      
      {showDeleteConfirm && (
        <>
          {console.log("Rendering delete confirmation modal")}
          {createPortal(
            <div 
              className="fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
              style={{ zIndex: 9999 }}
              onClick={handleDeleteCancel}
            >
              <div
                className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with Icon */}
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Delete Crash Report</h3>
                      <p className="text-sm text-gray-400">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  <p className="text-gray-300 leading-relaxed">
                    Are you sure you want to permanently delete this crash report?
                  </p>
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-200">
                        <p className="font-semibold mb-1">Warning:</p>
                        <ul className="space-y-1 text-red-300">
                          <li>• All crash data will be permanently removed</li>
                          <li>• Screenshots and stack traces will be deleted</li>
                          <li>• This cannot be recovered</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 px-6 py-5 bg-white/5 border-t border-white/10">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-red-500/20"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </>
  );
}
