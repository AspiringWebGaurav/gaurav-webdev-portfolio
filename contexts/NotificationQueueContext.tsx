"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  icon?: React.ReactNode;
}

interface NotificationQueueContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationQueueContext = createContext<
  NotificationQueueContextType | undefined
>(undefined);

export function NotificationQueueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [queue, setQueue] = useState<Notification[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration || 3000,
      };

      // Add to queue instead of directly to notifications
      setQueue((prev) => [...prev, newNotification]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setQueue([]);
    setIsProcessing(false);
  }, []);

  // Process queue one at a time
  useEffect(() => {
    if (queue.length > 0 && !isProcessing) {
      setIsProcessing(true);
      const nextNotification = queue[0];

      // Show notification
      setNotifications((prev) => [...prev, nextNotification]);

      // Remove from queue
      setQueue((prev) => prev.slice(1));

      // Auto-remove after duration + extra time for animation
      const totalDuration = (nextNotification.duration || 3000) + 300; // 300ms for exit animation
      
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== nextNotification.id)
        );
        
        // Wait a bit before processing next notification
        setTimeout(() => {
          setIsProcessing(false);
        }, 200); // 200ms gap between notifications
      }, totalDuration);
    }
  }, [queue, isProcessing]);

  const value: NotificationQueueContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationQueueContext.Provider value={value}>
      {children}
    </NotificationQueueContext.Provider>
  );
}

export function useNotificationQueue() {
  const context = useContext(NotificationQueueContext);
  if (!context) {
    throw new Error(
      "useNotificationQueue must be used within NotificationQueueProvider"
    );
  }
  return context;
}
