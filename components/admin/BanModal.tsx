/**
 * Ban Visitor Modal Component
 * Comprehensive ban UI with reason selection and categories
 * Enhanced with Temporary/Permanent ban types and auto-unban feature
 */

"use client";

import React, { useState } from "react";
import { X, Ban, AlertTriangle, Shield, Skull, Info, Timer, Clock } from "lucide-react";
import { showToast } from "@/lib/toast";

import { auth } from "@/lib/firebase";

interface BanModalProps {
  visitorId: string;
  onClose: () => void;
  onBanSuccess: () => void;
}

const BAN_REASONS = [
  "Spam/Unwanted Content",
  "Abusive Behavior",
  "Harassment",
  "Inappropriate Content",
  "Security Violation",
  "Terms of Service Violation",
  "Custom Reason",
];

const BAN_CATEGORIES = [
  {
    id: "normal",
    label: "Normal",
    description: "Standard policy violation",
    color: "blue",
    icon: Info,
    reviewTime: "24-48 hours",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Moderate policy violation",
    color: "yellow",
    icon: AlertTriangle,
    reviewTime: "48-72 hours",
  },
  {
    id: "danger",
    label: "Danger",
    description: "Serious policy violation",
    color: "orange",
    icon: Shield,
    reviewTime: "72-96 hours",
  },
  {
    id: "severe",
    label: "Severe",
    description: "Critical security violation",
    color: "red",
    icon: Skull,
    reviewTime: "96-120 hours",
  },
];

export default function BanModal({ visitorId, onClose, onBanSuccess }: BanModalProps) {
  const [banType, setBanType] = useState<"temporary" | "permanent">("permanent");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("normal");
  const [loading, setLoading] = useState(false);
  
  // Duration controls (for temporary bans)
  const [durationDays, setDurationDays] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [autoUnbanEnabled, setAutoUnbanEnabled] = useState(true);

  const handleBan = async () => {
    if (!selectedReason) {
      showToast.error("Please select a ban reason");
      return;
    }

    if (selectedReason === "Custom Reason" && !customReason.trim()) {
      showToast.error("Please enter a custom reason");
      return;
    }

    // Validate duration for temporary bans
    if (banType === "temporary") {
      const totalMinutes = (durationDays * 24 * 60) + (durationHours * 60) + durationMinutes;
      if (totalMinutes <= 0) {
        showToast.error("Please set a valid duration for temporary ban");
        return;
      }
    }

    setLoading(true);

    // Retry logic for network failures
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const user = auth.currentUser;
        if (!user) {
          showToast.error("Authentication required - please login again");
          setLoading(false);
          return;
        }

        let token: string;
        try {
          token = await user.getIdToken();
        } catch (tokenError) {
          throw new Error("Failed to get authentication token");
        }

        // Calculate total duration in minutes
        const totalMinutes = banType === "temporary" 
          ? (durationDays * 24 * 60) + (durationHours * 60) + durationMinutes 
          : null;

        console.log(`[Ban Modal] Attempting ban (attempt ${attempt}/${maxRetries})...`);

        const response = await fetch("/api/visitor-analytics/ban", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mask: visitorId,
            reason: selectedReason,
            category: selectedCategory,
            customReason: selectedReason === "Custom Reason" ? customReason : undefined,
            banType,
            banDuration: totalMinutes,
            autoUnbanEnabled: banType === "temporary" ? autoUnbanEnabled : false,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          
          // Don't retry auth errors
          if (response.status === 401 || response.status === 403) {
            throw new Error(error.error || "Authentication failed - please login again");
          }
          
          throw new Error(error.error || "Failed to ban visitor");
        }

        // Success!
        console.log('[Ban Modal] Ban successful');
        showToast.success(
          banType === "temporary" 
            ? `Visitor temporarily banned for ${formatDuration(totalMinutes!)}` 
            : "Visitor permanently banned"
        );
        onBanSuccess();
        onClose();
        return; // Exit on success

      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(`[Ban Modal] Attempt ${attempt} failed:`, lastError.message);

        // Don't retry auth errors
        if (lastError.message.includes("Authentication") || lastError.message.includes("login")) {
          showToast.error(lastError.message);
          setLoading(false);
          return;
        }

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`[Ban Modal] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    setLoading(false);
    const errorMessage = lastError?.message || "Failed to ban visitor after multiple attempts";
    console.error("[Ban Modal] All retry attempts failed:", errorMessage);
    showToast.error(
      `${errorMessage}. Please check your connection and try again.`,
      { autoClose: 5000 }
    );
  };

  const formatDuration = (minutes: number): string => {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    
    return parts.join(" ") || "0m";
  };

  const setQuickDuration = (minutes: number) => {
    setDurationDays(0);
    setDurationHours(Math.floor(minutes / 60));
    setDurationMinutes(minutes % 60);
  };

  const getCategoryColorClasses = (color: string) => {
    const colors = {
      blue: "border-blue-500 bg-blue-50 hover:bg-blue-100",
      yellow: "border-yellow-500 bg-yellow-50 hover:bg-yellow-100",
      orange: "border-orange-500 bg-orange-50 hover:bg-orange-100",
      red: "border-red-500 bg-red-50 hover:bg-red-100",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getCategoryIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      yellow: "text-yellow-600",
      orange: "text-orange-600",
      red: "text-red-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const selectedCategoryData = BAN_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Ban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ban Visitor</h2>
              <p className="text-red-100 text-sm font-mono">{visitorId.substring(0, 20)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Ban Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Select Ban Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 px-4 py-4 rounded-lg border-2 cursor-pointer transition-all ${
                  banType === "temporary"
                    ? "border-blue-500 bg-blue-50/10"
                    : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="banType"
                  value="temporary"
                  checked={banType === "temporary"}
                  onChange={(e) => setBanType(e.target.value as "temporary" | "permanent")}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-gray-200">Temporary Ban</span>
                  </div>
                  <span className="text-xs text-gray-400">Auto-unban after duration</span>
                </div>
              </label>
              
              <label
                className={`flex items-center gap-3 px-4 py-4 rounded-lg border-2 cursor-pointer transition-all ${
                  banType === "permanent"
                    ? "border-red-500 bg-red-50/10"
                    : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="banType"
                  value="permanent"
                  checked={banType === "permanent"}
                  onChange={(e) => setBanType(e.target.value as "temporary" | "permanent")}
                  className="w-4 h-4 text-red-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Ban className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-bold text-gray-200">Permanent Ban</span>
                  </div>
                  <span className="text-xs text-gray-400">Until admin revokes</span>
                </div>
              </label>
            </div>
          </div>

          {/* Duration Controls (only for temporary bans) */}
          {banType === "temporary" && (
            <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <label className="text-sm font-semibold text-gray-200">
                    Ban Duration <span className="text-red-400">*</span>
                  </label>
                </div>
                {(durationDays > 0 || durationHours > 0 || durationMinutes > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDurationDays(0);
                      setDurationHours(0);
                      setDurationMinutes(0);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Quick Duration Presets */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Quick Presets:</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "1 min", minutes: 1 },
                    { label: "5 min", minutes: 5 },
                    { label: "10 min", minutes: 10 },
                    { label: "30 min", minutes: 30 },
                    { label: "1 hour", minutes: 60 },
                    { label: "24 hours", minutes: 1440 },
                  ].map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => setQuickDuration(preset.minutes)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Duration Input */}
              <div className="space-y-3">
                <label className="text-xs text-gray-400 block">Custom Duration:</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Days */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Days</label>
                    <div className="flex items-center bg-gray-800 rounded-lg border border-gray-600">
                      <button
                        type="button"
                        onClick={() => setDurationDays(Math.max(0, durationDays - 1))}
                        className="w-9 h-10 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Math.max(0, Math.min(365, parseInt(e.target.value) || 0)))}
                        className="flex-1 text-center bg-transparent text-white font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setDurationDays(Math.min(365, durationDays + 1))}
                        className="w-9 h-10 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Hours</label>
                    <div className="flex items-center bg-gray-800 rounded-lg border border-gray-600">
                      <button
                        type="button"
                        onClick={() => setDurationHours(Math.max(0, durationHours - 1))}
                        className="w-9 h-10 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={durationHours}
                        onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                        className="flex-1 text-center bg-transparent text-white font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setDurationHours(Math.min(23, durationHours + 1))}
                        className="w-9 h-10 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Minutes */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Minutes</label>
                    <div className="flex items-center bg-gray-800 rounded-lg border border-gray-600">
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(Math.max(0, durationMinutes - 1))}
                        className="w-9 h-10 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="flex-1 text-center bg-transparent text-white font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(Math.min(59, durationMinutes + 1))}
                        className="w-9 h-10 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-unban Toggle */}
              <div className="mt-4 flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                <input
                  type="checkbox"
                  id="autoUnban"
                  checked={autoUnbanEnabled}
                  onChange={(e) => setAutoUnbanEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="autoUnban" className="flex-1 text-sm text-gray-300 cursor-pointer">
                  Automatically unban after duration expires (server-side)
                </label>
              </div>

              {/* Duration Preview */}
              {(durationDays > 0 || durationHours > 0 || durationMinutes > 0) && (
                <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <p className="text-xs text-blue-300">
                    <strong className="font-semibold">Duration:</strong>{" "}
                    {formatDuration((durationDays * 24 * 60) + (durationHours * 60) + durationMinutes)}
                    {autoUnbanEnabled && " (auto-unban enabled)"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ban Reason Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Select Ban Reason <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {BAN_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedReason === reason
                      ? "border-red-500 bg-red-50/10"
                      : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="banReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm font-medium text-gray-200">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === "Custom Reason" && (
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Enter Custom Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the reason for banning this visitor..."
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-400 mt-1">{customReason.length}/200 characters</p>
            </div>
          )}

          {/* Ban Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Select Ban Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {BAN_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? getCategoryColorClasses(category.color)
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className={`w-5 h-5 ${isSelected ? getCategoryIconColor(category.color) : "text-gray-400"}`} />
                      <span className={`font-bold ${isSelected ? "text-gray-900" : "text-gray-300"}`}>
                        {category.label}
                      </span>
                    </div>
                    <p className={`text-xs ${isSelected ? "text-gray-700" : "text-gray-500"}`}>
                      {category.description}
                    </p>
                  </button>
                );
              })}
            </div>
            {selectedCategoryData && (
              <div className="mt-3 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg">
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">{selectedCategoryData.label} Selected:</strong>{" "}
                  Review time: {selectedCategoryData.reviewTime}
                </p>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-amber-900/20 border border-amber-600 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Warning</p>
                <p className="text-xs text-amber-200 mt-1">
                  {banType === "temporary" 
                    ? `This visitor will be blocked for ${formatDuration((durationDays * 24 * 60) + (durationHours * 60) + durationMinutes)}. ${autoUnbanEnabled ? 'They will be automatically unbanned when the duration expires.' : 'Manual unban will be required after duration.'}`
                    : "This visitor will be permanently blocked from accessing the portfolio until manually unbanned by an admin."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBan}
            disabled={loading || !selectedReason || (selectedReason === "Custom Reason" && !customReason.trim()) || (banType === "temporary" && (durationDays * 24 * 60 + durationHours * 60 + durationMinutes) <= 0)}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Banning...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                {banType === "temporary" ? "Temporary Ban" : "Permanent Ban"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
