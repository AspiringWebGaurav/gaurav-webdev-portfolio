"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { showToast } from "@/lib/toast";
import { createVersionNotification, createErrorNotification } from "@/lib/notificationHelpers";
import { X } from "lucide-react";

interface VersionHistory {
  id: string;
  version: string;
  changelog: string[];
  createdAt: Date;
}

// Version shortcuts
const VERSION_SHORTCUTS = [
  {
    label: "Patch",
    format: (current: string) => incrementVersion(current, "patch"),
    icon: "🔧",
  },
  {
    label: "Minor",
    format: (current: string) => incrementVersion(current, "minor"),
    icon: "✨",
  },
  {
    label: "Major",
    format: (current: string) => incrementVersion(current, "major"),
    icon: "🚀",
  },
];

// Changelog shortcuts
const CHANGELOG_SHORTCUTS = [
  "Added new feature",
  "Fixed bug",
  "Updated",
  "Improved",
  "Enhanced UI",
  "Security patch",
];

function incrementVersion(current: string, type: "major" | "minor" | "patch"): string {
  if (!current) current = "v0.0.0";

  const match = current.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return "v0.0.1";

  let [, major, minor, patch] = match.map(Number);

  if (type === "major") {
    major++;
    minor = 0;
    patch = 0;
  } else if (type === "minor") {
    minor++;
    patch = 0;
  } else {
    patch++;
  }

  return `v${major}.${minor}.${patch}`;
}

export default function VersionNotesManagerMobile() {
  const [version, setVersion] = useState("");
  const [changelogInput, setChangelogInput] = useState("");
  const [changelog, setChangelog] = useState<string[]>([]);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [latestVersion, setLatestVersion] = useState("v0.0.0");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyQuery = query(
        collection(db, "portfolioVersionHistory"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as VersionHistory[];
      setHistory(historyData);

      // Set latest version from database
      if (historyData.length > 0) {
        setLatestVersion(historyData[0].version);
      } else {
        setLatestVersion("v0.0.0");
      }
    } catch (error) {
      console.error("Error:", error);
      await createErrorNotification("Failed to load history", "Version Notes");
    } finally {
      setLoading(false);
    }
  };

  const addChangelogItem = () => {
    if (changelogInput.trim()) {
      setChangelog([...changelog, changelogInput.trim()]);
      setChangelogInput("");
    }
  };

  const removeChangelogItem = (index: number) => {
    setChangelog(changelog.filter((_, i) => i !== index));
  };

  const isVersionExists = (ver: string) => {
    return history.some((item) => item.version.toLowerCase() === ver.toLowerCase());
  };

  const isSaveDisabled = () => {
    return !version.trim() || changelog.length === 0 || isVersionExists(version.trim()) || saving;
  };

  const handleSave = async () => {
    if (isSaveDisabled()) return;
    setSaving(true);
    try {
      const newVersion = {
        version: version.trim(),
        changelog,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, "portfolioVersionHistory"), newVersion);
      await createVersionNotification("create", version.trim());
      setVersion("");
      setChangelog([]);
      setChangelogInput("");
      await loadHistory(); // Reload to get fresh data

      // Trigger hard refresh after a short delay to show success message
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      await createErrorNotification("Failed to save version", "Version Notes");
    } finally {
      setSaving(false);
    }
  };

  const handleVersionShortcut = (type: "major" | "minor" | "patch") => {
    // Use latestVersion from state (synced with database)
    const newVersion = incrementVersion(latestVersion, type);

    if (!isVersionExists(newVersion)) {
      setVersion(newVersion);
    } else {
      showToast.error("Version already exists!");
    }
  };

  const handleChangelogShortcut = (text: string) => {
    setChangelogInput(text);
  };

  const versionExists = isVersionExists(version.trim());

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="shrink-0 w-full px-3 py-2 bg-white border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Add New Version</h2>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Version Number *</label>

            {/* Version Shortcuts */}
            <div className="flex gap-1.5 mb-1.5">
              {VERSION_SHORTCUTS.map((shortcut) => {
                // Use latestVersion from state (synced with database)
                const nextVersion = shortcut.format(latestVersion);
                const isDisabled = isVersionExists(nextVersion);

                return (
                  <button
                    key={shortcut.label}
                    onClick={() =>
                      handleVersionShortcut(
                        shortcut.label.toLowerCase() as "major" | "minor" | "patch"
                      )
                    }
                    disabled={isDisabled}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      isDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                        : "bg-blue-100 text-blue-700 active:scale-95"
                    }`}
                  >
                    <span className="text-xs">{shortcut.icon}</span>
                    <span className="text-xs">{nextVersion}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., v1.0.0"
              className={
                "w-full px-2.5 py-1.5 text-sm rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-1 " +
                (versionExists
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500")
              }
            />
            {versionExists && (
              <p className="text-xs text-red-600 font-medium mt-0.5 flex items-center gap-1">
                <span>⚠️</span> Version exists
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Changelog Items *
            </label>

            {/* Changelog Shortcuts */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              {CHANGELOG_SHORTCUTS.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handleChangelogShortcut(text)}
                  className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-900 active:scale-95 transition-transform"
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={changelogInput}
                onChange={(e) => setChangelogInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChangelogItem();
                  }
                }}
                placeholder="Add item..."
                className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={addChangelogItem}
                disabled={!changelogInput.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs rounded-md font-semibold transition-colors active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
          {changelog.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Added ({changelog.length})</p>
              <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin">
                {changelog.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 p-1.5 rounded-md bg-blue-50 border border-blue-100"
                  >
                    <span className="flex-1 text-xs text-gray-800">{item}</span>
                    <button
                      onClick={() => removeChangelogItem(index)}
                      className="shrink-0 w-5 h-5 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-all active:scale-90"
                      aria-label="Remove item"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaveDisabled()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md font-semibold transition-all active:scale-[0.98]"
          >
            {saving ? "Saving..." : "Save Version"}
          </button>
        </div>
      </div>
      <div className="flex-1 w-full px-3 py-2 overflow-y-auto scrollbar-thin bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Version History</h2>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mb-2">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-xs font-semibold text-gray-700 mb-0.5">No version history yet</p>
            <p className="text-xs text-gray-500">Add your first version above</p>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {history.map((item) => (
              <div key={item.id} className="p-2.5 rounded-md bg-white border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-blue-600">{item.version}</span>
                  <span className="text-xs text-gray-500">
                    {item.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="space-y-1">
                  {item.changelog.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 text-xs text-gray-700 leading-relaxed"
                    >
                      <span className="text-blue-500 text-xs">•</span>
                      <span className="flex-1">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
