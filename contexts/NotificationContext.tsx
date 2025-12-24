"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { auth } from "@/lib/firebase";
import smartPolling from "@/lib/smartPolling";
import {
  Notification,
  CreateNotificationInput,
  NotificationType,
} from "@/types/notification";
import { showToast } from "@/lib/toast";
import { setNotificationService } from "@/lib/notificationHelpers";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  createNotification: (
    input: Omit<CreateNotificationInput, "userId">
  ) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  showToastNotification: (type: NotificationType, message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);

      if (!response.ok) {
        // Handle error gracefully - just log and set empty notifications
        console.warn(
          "Could not fetch notifications:",
          response.status,
          response.statusText
        );
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const data = await response.json();
      const notifs = data.notifications || [];

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
    } catch (error) {
      // Handle any network or parsing errors gracefully
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch notifications when user changes
  useEffect(() => {
    if (userId) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId, refreshNotifications]);

  // Smart polling for realtime notifications (only when admin is active)
  useEffect(() => {
    if (!userId) return;

    const pollerId = smartPolling.start(
      async () => {
        await refreshNotifications();
      },
      {
        intervals: {
          realtime: 5000,  // 5s when admin is actively using dashboard
          active: 30000,   // 30s when admin is on page but idle
          idle: 120000,    // 2min when tab visible but admin away
          background: 0,   // Stop when tab hidden (saves 100%!)
        },
        priority: 'critical', // Notifications are critical for admin
        tag: 'admin-notifications',
      }
    );

    return () => smartPolling.stop(pollerId);
  }, [userId, refreshNotifications]);

  const createNotification = useCallback(
    async (input: Omit<CreateNotificationInput, "userId">) => {
      if (!userId) {
        console.warn("Cannot create notification: No user logged in");
        return;
      }

      try {
        const response = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, userId }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to create notification:",
            response.status,
            response.statusText
          );
          return;
        }

        await refreshNotifications();
      } catch (error) {
        console.error("Error creating notification:", error);
      }
    },
    [userId, refreshNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId, userId, action: "mark-read" }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to mark notification as read:",
            response.status,
            response.statusText
          );
          return;
        }

        await refreshNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [userId, refreshNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "mark-all-read" }),
      });

      if (!response.ok) {
        console.warn(
          "Failed to mark all as read:",
          response.status,
          response.statusText
        );
        showToast.error("Failed to mark all as read", "Mark Failed");
        return;
      }

      await refreshNotifications();
      showToast.success("All notifications marked as read", "Marked as Read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      showToast.error("Failed to mark all as read", "Mark Error");
    }
  }, [userId, refreshNotifications]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const response = await fetch("/api/notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId, userId }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to delete notification:",
            response.status,
            response.statusText
          );
          showToast.error("Failed to delete notification", "Delete Failed");
          return;
        }

        await refreshNotifications();
      } catch (error) {
        console.error("Error deleting notification:", error);
        showToast.error("Failed to delete notification", "Delete Error");
      }
    },
    [userId, refreshNotifications]
  );

  const clearAllNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "clear-all" }),
      });

      if (!response.ok) {
        console.warn(
          "Failed to clear all notifications:",
          response.status,
          response.statusText
        );
        showToast.error("Failed to clear all notifications", "Clear Failed");
        return;
      }

      await refreshNotifications();
      showToast.success("All notifications cleared", "Cleared");
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      showToast.error("Failed to clear all notifications", "Clear Error");
    }
  }, [userId, refreshNotifications]);

  const showToastNotification = useCallback(
    (type: NotificationType, message: string, title?: string) => {
      const toastTitle = title || (type.charAt(0).toUpperCase() + type.slice(1));
      
      // Use centralized toast system
      switch (type) {
        case "success":
          showToast.success(message, toastTitle);
          break;
        case "error":
          showToast.error(message, toastTitle);
          break;
        case "warning":
          showToast.warning(message, toastTitle);
          break;
        case "info":
        default:
          showToast.info(message, toastTitle);
          break;
      }
    },
    []
  );

  // Set notification service for helper functions
  useEffect(() => {
    setNotificationService({
      createNotification,
      showToast: showToastNotification,
    });
  }, [createNotification, showToastNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        createNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications,
        showToastNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
