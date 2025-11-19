"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import {
  useNotificationQueue,
  Notification,
  NotificationType,
} from "@/contexts/NotificationQueueContext";

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };
  return icons[type];
};

const getNotificationStyles = (type: NotificationType) => {
  const styles = {
    success: {
      bg: "bg-gradient-to-r from-green-50 to-emerald-50",
      border: "border-green-200",
      icon: "text-green-600",
      text: "text-green-900",
      closeHover: "hover:bg-green-100",
    },
    error: {
      bg: "bg-gradient-to-r from-red-50 to-rose-50",
      border: "border-red-200",
      icon: "text-red-600",
      text: "text-red-900",
      closeHover: "hover:bg-red-100",
    },
    warning: {
      bg: "bg-gradient-to-r from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      icon: "text-yellow-600",
      text: "text-yellow-900",
      closeHover: "hover:bg-yellow-100",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      text: "text-blue-900",
      closeHover: "hover:bg-blue-100",
    },
  };
  return styles[type];
};

function NotificationItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotificationQueue();
  const [progress, setProgress] = useState(100);
  const styles = getNotificationStyles(notification.type);

  useEffect(() => {
    const duration = notification.duration || 3000;
    const interval = 10;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95, x: 100 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, x: 100, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.8,
      }}
      className={`relative overflow-hidden rounded-lg border-2 ${styles.border} ${styles.bg} shadow-lg backdrop-blur-sm w-full max-w-sm`}
    >
      {/* Progress bar */}
      <motion.div
        className={`absolute top-0 left-0 h-1 ${
          notification.type === "success"
            ? "bg-green-500"
            : notification.type === "error"
            ? "bg-red-500"
            : notification.type === "warning"
            ? "bg-yellow-500"
            : "bg-blue-500"
        }`}
        initial={{ width: "100%" }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />

      <div className="p-4 pt-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
            {notification.icon || <NotificationIcon type={notification.type} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {notification.title && (
              <h4 className={`font-semibold ${styles.text} text-sm mb-1`}>
                {notification.title}
              </h4>
            )}
            <p className={`${styles.text} text-sm opacity-90`}>
              {notification.message}
            </p>
          </div>

          {/* Close button - TOP RIGHT */}
          <button
            onClick={() => removeNotification(notification.id)}
            className={`flex-shrink-0 p-1 rounded-md transition-colors ${styles.closeHover} ${styles.icon} -mt-1 -mr-1`}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationQueueContainer() {
  const { notifications } = useNotificationQueue();

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem notification={notification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
