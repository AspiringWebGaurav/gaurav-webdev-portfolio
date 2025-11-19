/**
 * Unban Visitor Modal Component
 * Simple confirmation modal for unbanning visitors
 */

"use client";

import React, { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { showToast } from "@/lib/toast";

import { auth } from "@/lib/firebase";

interface UnbanModalProps {
  visitorId: string;
  banReason?: string;
  onClose: () => void;
  onUnbanSuccess: () => void;
}

export default function UnbanModal({ visitorId, banReason, onClose, onUnbanSuccess }: UnbanModalProps) {
  const [loading, setLoading] = useState(false);
  const [unbanReason, setUnbanReason] = useState("");

  const handleUnban = async () => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        showToast.error("Authentication required");
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/visitor-analytics/unban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visitorId,
          unbanReason: unbanReason || "Unbanned by admin",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unban visitor");
      }

      showToast.success("Visitor unbanned successfully");
      onUnbanSuccess();
      onClose();
    } catch (error) {
      console.error("[Unban Modal] Error:", error);
      showToast.error(error instanceof Error ? error.message : "Failed to unban visitor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Unban Visitor</h2>
              <p className="text-green-100 text-sm">Restore access</p>
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
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Visitor UUID:</p>
            <p className="text-sm font-mono text-gray-900 break-all">{visitorId}</p>
            {banReason && (
              <>
                <p className="text-sm text-gray-600 font-medium mt-3 mb-1">Current Ban Reason:</p>
                <p className="text-sm text-gray-900">{banReason}</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unban Reason (Optional)
            </label>
            <textarea
              value={unbanReason}
              onChange={(e) => setUnbanReason(e.target.value)}
              placeholder="Reason for unbanning (e.g., Appeal approved, Mistake, etc.)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Note</p>
                <p className="text-xs text-blue-700 mt-1">
                  This visitor will immediately regain access to the portfolio. This action will be logged for audit purposes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUnban}
            disabled={loading}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Unbanning...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Unban Visitor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
