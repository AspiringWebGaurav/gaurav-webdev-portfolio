"use client";

/**
 * Bug Report Form Modal
 * User-facing bug submission form with attachments, validation, and security
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Bug,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBugReports } from "@/contexts/BugReportContext";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import {
  BugSeverity,
  BugCategory,
  SEVERITY_DESCRIPTIONS,
  CATEGORY_DESCRIPTIONS,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  formatFileSize,
  getBrowserInfo,
} from "@/types/bugReport";

interface BugReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUrl?: string; // Pre-fill URL if opened from a specific page
}

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

interface AttachmentPreview {
  file: File;
  preview: string;
}

export default function BugReportForm({
  isOpen,
  onClose,
  defaultUrl,
}: BugReportFormProps) {
  const { createBugReport } = useBugReports();
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [formOpenTime, setFormOpenTime] = useState<number>(0);
  const [honeypot, setHoneypot] = useState("");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("medium");
  const [category, setCategory] = useState<BugCategory | "">("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [url, setUrl] = useState(defaultUrl || "");
  const [browserInfo, setBrowserInfo] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      setFormOpenTime(Date.now());
      setFingerprint(generateDeviceFingerprint());
      setBrowserInfo(getBrowserInfo());
      if (defaultUrl) setUrl(defaultUrl);
    }
  }, [isOpen, defaultUrl]);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setErrorMessage("");
      setReferenceId("");
      setReporterName("");
      setReporterEmail("");
      setTitle("");
      setSeverity("medium");
      setCategory("");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setActualBehavior("");
      setUrl(defaultUrl || "");
      setBrowserInfo("");
      setAttachments([]);
      setHoneypot("");
    }
  }, [isOpen, defaultUrl]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Check total count
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setErrorMessage(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }

    // Validate and create previews
    const newAttachments: AttachmentPreview[] = [];
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(
          `File "${file.name}" exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`
        );
        continue;
      }

      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setErrorMessage(`File "${file.name}" must be an image (JPEG, PNG, GIF, or WebP)`);
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newAttachments.push({ file, preview });
    }

    setAttachments([...attachments, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    URL.revokeObjectURL(newAttachments[index].preview);
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((att) => URL.revokeObjectURL(att.preview));
    };
  }, [attachments]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    // Security: Check honeypot
    if (honeypot && honeypot.trim().length > 0) {
      console.warn("[Security] Honeypot triggered");
      setStatus("error");
      setErrorMessage("Invalid submission");
      return;
    }

    // Calculate time spent
    const timeSpent = Date.now() - formOpenTime;

    // Security: Check if submitted too quickly
    if (timeSpent < 5000) {
      setStatus("error");
      setErrorMessage("Please take more time to fill out the form");
      return;
    }

    // Basic validation
    if (!title.trim() || title.length < 5) {
      setStatus("error");
      setErrorMessage("Please provide a descriptive title (at least 5 characters)");
      return;
    }

    if (!stepsToReproduce.trim() || stepsToReproduce.length < 10) {
      setStatus("error");
      setErrorMessage("Please provide detailed steps to reproduce (at least 10 characters)");
      return;
    }

    if (!actualBehavior.trim() || actualBehavior.length < 10) {
      setStatus("error");
      setErrorMessage("Please describe what actually happened (at least 10 characters)");
      return;
    }

    try {
      const result = await createBugReport({
        reporterName: reporterName.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
        title: title.trim(),
        severity,
        category: category || undefined,
        stepsToReproduce: stepsToReproduce.trim(),
        expectedBehavior: expectedBehavior.trim() || undefined,
        actualBehavior: actualBehavior.trim(),
        url: url.trim() || undefined,
        browserInfo,
        attachments: attachments.map((att) => att.file),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        fingerprint: fingerprint || undefined,
        honeypot,
        timeSpent,
      });

      if (result.success) {
        setStatus("success");
        setReferenceId(result.referenceId || "");
      } else {
        throw new Error(result.error || "Failed to submit bug report");
      }
    } catch (error: any) {
      console.error("Error submitting bug report:", error);
      setStatus("error");
      setErrorMessage(error.message || "Failed to submit bug report. Please try again.");
    }
  };

  // Success modal content
  const renderSuccessContent = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-4 sm:py-8"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Bug Report Submitted!</h3>
      <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 px-4">
        Thanks — your bug report has been received. We'll review it soon.
      </p>
      {referenceId && (
        <div className="bg-black-200 border border-purple/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-4">
          <p className="text-xs sm:text-sm text-gray-400 mb-2">Reference ID:</p>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl font-mono font-bold text-purple">{referenceId}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referenceId);
              }}
              className="text-xs px-2 sm:px-3 py-1 bg-purple/20 hover:bg-purple/30 rounded transition-colors text-purple"
            >
              Copy
            </button>
          </div>
        </div>
      )}
      <button
        onClick={onClose}
        className="px-4 sm:px-6 py-2 sm:py-3 bg-purple hover:bg-purple/80 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
      >
        Close
      </button>
    </motion.div>
  );

  // Form content
  const renderFormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {/* Reporter Info (Optional) - Compact on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Your Name <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Your Email <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
          />
        </div>
      </div>

      {/* Title (Required) */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
          Bug Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of the issue"
          maxLength={100}
          required
          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
      </div>

      {/* Severity and Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Severity <span className="text-red-400">*</span>
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as BugSeverity)}
            required
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple/50 transition-colors"
          >
            {(Object.keys(SEVERITY_DESCRIPTIONS) as BugSeverity[]).map((sev) => (
              <option key={sev} value={sev}>
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Category <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BugCategory | "")}
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple/50 transition-colors"
          >
            <option value="">Select category</option>
            {(Object.keys(CATEGORY_DESCRIPTIONS) as BugCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Steps to Reproduce (Required) */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
          Steps to Reproduce <span className="text-red-400">*</span>
        </label>
        <textarea
          value={stepsToReproduce}
          onChange={(e) => setStepsToReproduce(e.target.value)}
          placeholder="1) Go to /signup&#10;2) Click Create&#10;3) See error"
          rows={3}
          maxLength={2000}
          required
          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{stepsToReproduce.length}/2000</p>
      </div>

      {/* Expected Behavior (Optional) - Collapsible on mobile */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
          Expected Behavior <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={expectedBehavior}
          onChange={(e) => setExpectedBehavior(e.target.value)}
          placeholder="Describe what should happen..."
          rows={2}
          maxLength={2000}
          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors resize-none"
        />
      </div>

      {/* Actual Behavior (Required) */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
          Actual Behavior <span className="text-red-400">*</span>
        </label>
        <textarea
          value={actualBehavior}
          onChange={(e) => setActualBehavior(e.target.value)}
          placeholder="Describe what actually happened..."
          rows={2}
          maxLength={2000}
          required
          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{actualBehavior.length}/2000</p>
      </div>

      {/* URL and Browser Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Page URL <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Browser/Device <span className="text-gray-500 font-normal">(auto)</span>
          </label>
          <input
            type="text"
            value={browserInfo}
            onChange={(e) => setBrowserInfo(e.target.value)}
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-black-200 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
          />
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
          Screenshots <span className="text-gray-500 font-normal">(optional, up to 5)</span>
        </label>
        <div className="space-y-2 sm:space-y-3">
          {/* Upload button */}
          {attachments.length < MAX_ATTACHMENTS && (
            <label className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-black-200 border border-dashed border-white/20 rounded-lg text-gray-400 hover:border-purple/50 hover:text-purple transition-colors cursor-pointer text-xs sm:text-sm">
              <Upload className="w-4 h-4" />
              <span>Upload screenshots (max 5MB each)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}

          {/* Attachment previews - Optimized grid */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="relative group bg-black-200 border border-white/10 rounded-lg overflow-hidden aspect-square"
                >
                  <img
                    src={att.preview}
                    alt={att.file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1.5 sm:p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1">
                    <p className="text-xs text-gray-400 truncate">{att.file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Screenshots help — JPEG, PNG, GIF, or WebP.
        </p>
      </div>

      {/* Honeypot (hidden) */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Error message */}
      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-medium text-red-400">Error</p>
            <p className="text-xs sm:text-sm text-gray-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2 sm:pt-4 border-t border-white/10 sticky bottom-0 bg-black-100 pb-2 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={status === "submitting"}
          className="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            status === "submitting" ||
            !title.trim() ||
            !stepsToReproduce.trim() ||
            !actualBehavior.trim()
          }
          className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-purple hover:bg-purple/80 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              <span className="hidden sm:inline">Submitting...</span>
              <span className="sm:hidden">Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Submit Bug Report</span>
              <span className="sm:hidden">Submit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4" style={{ isolation: 'isolate' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            onClick={() => status !== "submitting" && onClose()}
            className="absolute inset-0 bg-black/90"
            style={{ zIndex: 1 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 260,
              mass: 0.8
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black-100 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
            style={{ zIndex: 2, maxHeight: 'calc(100vh - 32px)' }}
          >
          {/* Success State */}
          {status === "success" ? (
            <div className="p-5 sm:p-6">
              {renderSuccessContent()}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Report a Bug
                  </h2>
                  <p className="text-xs text-white-200 mt-0.5">
                    Help us improve by reporting issues
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={status === "submitting"}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Close bug report form"
                  title="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white-200" />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto p-4 sm:p-5" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {renderFormContent()}
              </div>
            </>
          )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
