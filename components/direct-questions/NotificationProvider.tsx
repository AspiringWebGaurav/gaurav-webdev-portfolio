// components/direct-questions/NotificationProvider.tsx
// Provider component that initializes and manages the notification system

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeNotifications, getNotificationStore } from '@/lib/notificationStore';
import { initializeNotificationListener, getNotificationListener } from '@/lib/notificationListener';
import type { NotificationState, DirectQuestionNotification } from '@/types/notifications';

interface NotificationContextType {
  state: NotificationState | null;
  isInitialized: boolean;
  error: string | null;
  actions: {
    markAsRead: (notificationIds: string[]) => Promise<void>;
    markAsShown: (notificationIds: string[]) => void;
    clearNotification: (notificationId: string) => void;
    clearAll: () => void;
  };
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: React.ReactNode;
  visitorUuid?: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  visitorUuid
}) => {
  const [state, setState] = useState<NotificationState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log('🔄 Initializing notification system...');
        
        // Initialize the notification store
        const store = await initializeNotifications(visitorUuid);
        
        // Initialize the real-time listener
        const listener = await initializeNotificationListener(visitorUuid);
        
        if (mounted) {
          setState(store.getState());
          setIsInitialized(true);
          setError(null);
          console.log('✅ Notification system initialized successfully');
        }

        // Subscribe to store updates
        const unsubscribe = store.subscribe((event) => {
          if (mounted) {
            setState(store.getState());
          }
        });

        return () => {
          unsubscribe();
        };
      } catch (err) {
        console.error('❌ Failed to initialize notification system:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
          setIsInitialized(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [visitorUuid]);

  const actions = {
    markAsRead: async (notificationIds: string[]) => {
      try {
        const store = getNotificationStore();
        await store.markAsRead(notificationIds);
        
        // Also update server-side
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'mark_read',
            questionIds: notificationIds
          })
        });

        if (!response.ok) {
          console.warn('Failed to sync read status with server');
        }
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    },

    markAsShown: (notificationIds: string[]) => {
      const store = getNotificationStore();
      store.markAsShown(notificationIds);
    },

    clearNotification: (notificationId: string) => {
      const store = getNotificationStore();
      store.removeNotification(notificationId);
    },

    clearAll: () => {
      const store = getNotificationStore();
      store.clearAll();
    }
  };

  const contextValue: NotificationContextType = {
    state,
    isInitialized,
    error,
    actions
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;