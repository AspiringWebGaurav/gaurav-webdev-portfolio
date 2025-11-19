"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { showToast } from "@/lib/toast";
import { createVersionNotification, createErrorNotification } from "@/lib/notificationHelpers";

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
    desc: "Bug fixes",
  },
  {
    label: "Minor",
    format: (current: string) => incrementVersion(current, "minor"),
    icon: "✨",
    desc: "New features",
  },
  {
    label: "Major",
    format: (current: string) => incrementVersion(current, "major"),
    icon: "🚀",
    desc: "Breaking changes",
  },
];

// Changelog shortcuts
const CHANGELOG_SHORTCUTS = [
  "Added new feature",
  "Fixed bug in",
  "Updated",
  "Improved performance",
  "Enhanced UI/UX",
  "Refactored code",
  "Security patch",
];

function incrementVersion(current: string, type: "major" | "minor" | "patch"): string {
  // Get the latest version from current or default to v0.0.0
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

export default function VersionNotesManager() {
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
        limit(100)
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

  const saveVersion = async () => {
    if (isSaveDisabled()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "portfolioVersionHistory"), {
        version: version.trim(),
        changelog: changelog,
        createdAt: Timestamp.now(),
      });
      await createVersionNotification("create", version.trim());
      setVersion("");
      setChangelog([]);
      await loadHistory(); // Reload to get fresh data

      // Trigger hard refresh after a short delay to show success message
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      await createErrorNotification("Failed to save", "Version Notes");
    } finally {
      setSaving(false);
    }
  };

  const handleVersionShortcut = (type: "major" | "minor" | "patch") => {
    // Use latestVersion from state (synced with database)
    const newVersion = incrementVersion(latestVersion, type);

    // Check if this version already exists
    if (!isVersionExists(newVersion)) {
      setVersion(newVersion);
    } else {
      showToast.error("This version already exists!");
    }
  };

  const handleChangelogShortcut = (text: string) => {
    setChangelogInput(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const versionExists = version.trim() && isVersionExists(version.trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-base font-bold text-gray-900 mb-3 shrink-0">Add New Version</h2>
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Version Number *</label>

            {/* Version Shortcuts */}
            <div className="flex gap-1.5 mb-2">
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
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                      isDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                    title={
                      isDisabled
                        ? `${nextVersion} already exists`
                        : `${shortcut.desc}: ${nextVersion}`
                    }
                  >
                    <span>{shortcut.icon}</span>
                    <span>{shortcut.label}</span>
                    <span className="text-xs opacity-70">{nextVersion}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., v1.0.0"
              className={`w-full px-3 py-2 rounded border bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                versionExists
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {versionExists && (
              <p className="text-xs text-red-500 mt-1">⚠️ This version already exists</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Changelog Items *
            </label>

            {/* Changelog Shortcuts */}
            <div className="flex flex-wrap gap-1 mb-2">
              {CHANGELOG_SHORTCUTS.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handleChangelogShortcut(text)}
                  className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
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
                placeholder="Type and press Enter"
                className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addChangelogItem}
                disabled={!changelogInput.trim()}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter or click Add</p>
          </div>
          {changelog.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-700">Added Items ({changelog.length})</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                {changelog.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-2 p-2.5 rounded bg-gray-100 group"
                  >
                    <span className="text-gray-900 text-sm flex-1">• {item}</span>
                    <button
                      onClick={() => removeChangelogItem(index)}
                      className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={saveVersion}
          disabled={isSaveDisabled()}
          className="w-full px-6 py-2.5 mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-semibold transition-colors shrink-0"
          title={
            !version.trim()
              ? "Enter version number"
              : changelog.length === 0
              ? "Add at least one changelog item"
              : versionExists
              ? "This version already exists"
              : "Save version"
          }
        >
          {saving ? "Saving..." : "Save Version"}
        </button>
      </div>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Version History</h2>
          <span className="text-xs text-gray-500 font-medium">
            {history.length} version{history.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded p-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-500 font-medium">No versions yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first version</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:dark:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base text-gray-900">{item.version}</span>
                  <span className="text-xs text-gray-500">
                    {item.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {item.changelog.map((change, idx) => (
                    <p key={idx} className="text-sm text-gray-600">
                      • {change}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
