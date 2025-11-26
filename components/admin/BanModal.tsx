/**
 * Ban Visitor Modal Component
 * Comprehensive ban UI with reason selection and categories
 */

"use client";

import React, { useState } from "react";
import { X, Ban, AlertTriangle, Shield, Skull, Info } from "lucide-react";
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
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("normal");
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    if (!selectedReason) {
      showToast.error("Please select a ban reason");
      return;
    }

    if (selectedReason === "Custom Reason" && !customReason.trim()) {
      showToast.error("Please enter a custom reason");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        showToast.error("Authentication required");
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/visitor-analytics/ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mask: visitorId,  // Admin sends mask (visitorId is actually mask from VisitorAnalyticsManager)
          reason: selectedReason,
          category: selectedCategory,
          customReason: selectedReason === "Custom Reason" ? customReason : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to ban visitor");
      }

      showToast.success("Visitor banned successfully");
      onBanSuccess();
      onClose();
    } catch (error) {
      console.error("[Ban Modal] Error:", error);
      showToast.error(error instanceof Error ? error.message : "Failed to ban visitor");
    } finally {
      setLoading(false);
    }
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
                  This visitor will be immediately blocked from accessing the portfolio. They will be redirected to a ban page with the selected reason and review time.
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
            disabled={loading || !selectedReason || (selectedReason === "Custom Reason" && !customReason.trim())}
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
                Ban Visitor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
