"use client";

import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

export type ConfirmationVariant = "danger" | "warning" | "info" | "success";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: React.ReactNode;
  warningMessage?: string;
  itemCount?: number;
  isLoading?: boolean;
}

const variantConfig: Record<ConfirmationVariant, {
  gradient: string;
  iconColor: string;
  buttonBg: string;
  buttonHover: string;
  Icon: typeof AlertCircle;
}> = {
  danger: {
    gradient: "from-red-600 to-red-700",
    iconColor: "text-red-600",
    buttonBg: "bg-red-600",
    buttonHover: "hover:bg-red-700",
    Icon: AlertCircle,
  },
  warning: {
    gradient: "from-orange-600 to-orange-700",
    iconColor: "text-orange-600",
    buttonBg: "bg-orange-600",
    buttonHover: "hover:bg-orange-700",
    Icon: AlertTriangle,
  },
  info: {
    gradient: "from-blue-600 to-blue-700",
    iconColor: "text-blue-600",
    buttonBg: "bg-blue-600",
    buttonHover: "hover:bg-blue-700",
    Icon: Info,
  },
  success: {
    gradient: "from-green-600 to-green-700",
    iconColor: "text-green-600",
    buttonBg: "bg-green-600",
    buttonHover: "hover:bg-green-700",
    Icon: CheckCircle,
  },
};

/**
 * Enterprise-grade confirmation modal component
 * Replaces native browser confirm() dialogs with modern, accessible UI
 * 
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 * 
 * <ConfirmationModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={() => {
 *     handleDelete();
 *     setShowConfirm(false);
 *   }}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   variant="danger"
 *   confirmText="Delete"
 * />
 * ```
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  warningMessage,
  itemCount,
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const IconComponent = config.Icon;

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.gradient} text-white px-6 py-4 flex items-center gap-3 rounded-t-xl`}>
          <div className="p-2 bg-white/20 rounded-lg">
            {icon || <IconComponent className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            {variant === "danger" && (
              <p className="text-red-100 text-sm">
                This action cannot be undone
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-900 mb-3">
              {message}
              {itemCount !== undefined && itemCount > 0 && (
                <>
                  {" "}
                  <span className={`font-bold ${config.iconColor}`}>
                    {itemCount}
                  </span>{" "}
                  item{itemCount > 1 ? 's' : ''}?
                </>
              )}
            </p>

            {warningMessage && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">⚠️ Warning:</span> {warningMessage}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 ${config.buttonBg} text-white rounded-lg ${config.buttonHover} transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {icon || <IconComponent className="w-4 h-4" />}
                  {confirmText}
                  {itemCount !== undefined && itemCount > 0 && (
                    <span>({itemCount})</span>
                  )}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
