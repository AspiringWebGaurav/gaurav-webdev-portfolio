"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { VERSION } from "../../app/config/version";
import { CHANGELOG } from "../../app/config/changelog";
import { X, Download, Copy, Check, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export default function VersionWithChangelog() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [version, setVersion] = useState(VERSION);
  const [changelog, setChangelog] = useState(CHANGELOG);

  useEffect(() => {
    setMounted(true);
    // Load version and changelog from Firestore versionHistory collection
    const loadVersionData = async () => {
      try {
        // Get latest version from portfolioVersionHistory
        const historyQuery = query(
          collection(db, "portfolioVersionHistory"),
          orderBy("createdAt", "desc"),
          limit(100) // Get all versions for changelog
        );
        const historySnapshot = await getDocs(historyQuery);

        if (!historySnapshot.empty) {
          // Get the latest version (first document)
          const latestDoc = historySnapshot.docs[0];
          const latestData = latestDoc.data();

          if (latestData?.version) {
            setVersion(latestData.version);
          }

          // Build changelog from all versions
          const allVersions = historySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              version: data.version,
              date: new Date(data.createdAt?.toDate()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              changes: data.changelog || [],
            };
          });

          setChangelog(allVersions);
        }
      } catch (error) {
        console.error("Error loading version data:", error);
      }
    };

    loadVersionData();
  }, []);

  // Reset to first page when modal opens
  useEffect(() => {
    if (showChangelog) {
      setCurrentPage(0);
    }
  }, [showChangelog]);

  // Keyboard navigation for changelog modal
  useEffect(() => {
    if (!showChangelog) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showChangelog, currentPage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showConfirm || showChangelog) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showConfirm, showChangelog]);

  const handleCopy = async () => {
    const text = changelog
      .map(
        (log) => `${log.version} (${log.date})\n${log.changes.map((c) => `• ${c}`).join("\n")}\n`
      )
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const content = `
      <html>
        <head>
          <title>Portfolio Changelog - ${version}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
            .version { margin: 30px 0; }
            .version-header { display: flex; gap: 15px; align-items: center; margin-bottom: 15px; }
            .version-number { font-size: 20px; font-weight: bold; color: #0ea5e9; }
            .version-date { color: #666; }
            ul { list-style: none; padding-left: 0; }
            li { margin: 8px 0; padding-left: 20px; position: relative; }
            li:before { content: "•"; position: absolute; left: 0; color: #0ea5e9; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Portfolio Version History</h1>
          ${changelog
            .map(
              (log) => `
            <div class="version">
              <div class="version-header">
                <span class="version-number">${log.version}</span>
                <span class="version-date">${log.date}</span>
              </div>
              <ul>
                ${log.changes.map((change) => `<li>${change}</li>`).join("")}
              </ul>
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(content);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 250);
    }
  };

  const handleNextPage = () => {
    if (currentPage < changelog.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const ConfirmModal = () => (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4"
      onClick={() => setShowConfirm(false)}
    >
      <div
        className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-sky-400" />
          </div>
          <h2 className="text-lg md:text-2xl font-bold mb-2 text-white">Version Changelog</h2>
          <p className="text-xs md:text-base text-zinc-400 mb-6">
            View the complete history of updates and changes to this application.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-2.5 md:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm md:text-base font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setShowChangelog(true);
              }}
              className="flex-1 px-4 py-2.5 md:py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm md:text-base font-medium transition-colors"
            >
              Continue to Read
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ChangelogModal = () => {
    const currentLog = changelog[currentPage];
    const totalPages = changelog.length;

    return (
      <div
        className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4"
        onClick={() => setShowChangelog(false)}
      >
        <div
          className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl h-[85vh] md:h-[80vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-800 shrink-0">
            <div>
              <h2 className="text-base md:text-2xl font-bold text-white">Version History</h2>
              <p className="text-xs md:text-sm text-zinc-400 mt-1">
                Portfolio Changelog • {currentPage + 1} of {totalPages}
              </p>
            </div>
            <button
              onClick={() => setShowChangelog(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
            </button>
          </div>

          {/* Content - Single Version Display */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="h-full flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-4">
                <span className="text-base md:text-xl font-bold text-sky-400">
                  {currentLog.version}
                </span>
                <span className="text-xs md:text-sm text-zinc-400 bg-zinc-800 px-2.5 py-1 md:px-3 rounded-full w-fit">
                  {currentLog.date}
                </span>
              </div>
              <ul className="space-y-2">
                {currentLog.changes.map((change, i) => (
                  <li
                    key={i}
                    className="text-xs md:text-base text-zinc-300 flex items-start gap-2 md:gap-3 bg-zinc-800/50 p-2.5 md:p-3 rounded-lg"
                  >
                    <span className="text-sky-500 shrink-0">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="border-t border-zinc-800 p-3 md:p-4 bg-zinc-900/80 shrink-0">
            <div className="flex items-center justify-between gap-4 mb-3 md:mb-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-medium transition-colors ${
                  currentPage === 0
                    ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                }`}
                aria-label="Previous version"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm">Previous</span>
              </button>

              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {changelog.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`transition-all rounded-full ${
                      idx === currentPage
                        ? "w-6 md:w-8 h-2 md:h-2.5 bg-sky-500"
                        : "w-2 md:w-2.5 h-2 md:h-2.5 bg-zinc-600 hover:bg-zinc-500"
                    }`}
                    aria-label={`Go to version ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-medium transition-colors ${
                  currentPage === totalPages - 1
                    ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                }`}
                aria-label="Next version"
              >
                <span className="text-xs md:text-sm">Next</span>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Footer - Actions */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm">Copy All</span>
                  </>
                )}
              </button>
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 hover:scale-105 active:scale-95"
        aria-label="View version changelog"
      >
        <span className="text-blue-600">{version}</span>
        <svg
          className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {mounted && showConfirm && createPortal(<ConfirmModal />, document.body)}
      {mounted && showChangelog && createPortal(<ChangelogModal />, document.body)}
    </>
  );
}
