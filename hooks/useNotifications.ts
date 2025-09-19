// hooks/useNotifications.ts
// React hooks for notification system

import { useState, useEffect, useCallback, useContext } from 'react';
import { getNotificationStore, initializeNotifications } from '@/lib/notificationStore';
import { getNotificationListener, initializeNotificationListener } from '@/lib/notificationListener';
import type {
  NotificationState,
  DirectQuestionNotification,
  NotificationPreferences,
  NotificationEvent
} from '@/types/notifications';

/**
 * Main hook for notification system
 */
export function useNotifications(visitorUuid?: string) {
  const [state, setState] = useState<NotificationState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize notification system
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize store and listener
        const store = await initializeNotifications(visitorUuid);
        const listener = await initializeNotificationListener(visitorUuid);

        if (mounted) {
          setState(store.getState());
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize notifications:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
          setIsInitialized(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [visitorUuid]);

  // Subscribe to store updates
  useEffect(() => {
    if (!isInitialized) return;

    const store = getNotificationStore();
    const unsubscribe = store.subscribe((event: NotificationEvent) => {
      // Update state when notifications change
      if (event.type === 'notification_received' ||
          event.type === 'notification_read' ||
          event.type === 'notification_cleared') {
        setState(store.getState());
      }
    });

    return unsubscribe;
  }, [isInitialized]);

  // Actions
  const actions = {
    markAsRead: useCallback(async (notificationIds: string[]) => {
      try {
        const store = getNotificationStore();
        await store.markAsRead(notificationIds);
        
        // Also sync with server
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
    }, []),

    markAsShown: useCallback((notificationIds: string[]) => {
      const store = getNotificationStore();
      store.markAsShown(notificationIds);
    }, []),

    clearNotification: useCallback((notificationId: string) => {
      const store = getNotificationStore();
      store.removeNotification(notificationId);
    }, []),

    clearAll: useCallback(() => {
      const store = getNotificationStore();
      store.clearAll();
    }, []),

    updatePreferences: useCallback((preferences: Partial<NotificationPreferences>) => {
      const store = getNotificationStore();
      store.updatePreferences(preferences);
    }, []),

    refresh: useCallback(async () => {
      const listener = getNotificationListener();
      await listener.refresh();
    }, [])
  };

  return {
    state,
    isInitialized,
    isLoading,
    error,
    actions,
    // Computed values
    unreadCount: state?.unreadCount || 0,
    hasUnreadNotifications: (state?.unreadCount || 0) > 0,
    unreadNotifications: state?.unreadNotifications.filter(n => !n.isRead) || [],
    displayableNotifications: (() => {
      if (!state) return [];
      const store = getNotificationStore();
      return store.getDisplayableNotifications();
    })()
  };
}

/**
 * Hook for notification display logic
 */
export function useNotificationDisplay() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState<DirectQuestionNotification[]>([]);

  const { state, actions } = useNotifications();

  // Auto-show overlay when there are displayable notifications
  useEffect(() => {
    if (state?.preferences.persistentOverlay) {
      const store = getNotificationStore();
      const displayable = store.getDisplayableNotifications();
      
      if (displayable.length > 0) {
        setShowOverlay(true);
        setDisplayedNotifications(displayable);
      }
    }
  }, [state]);

  const toggleOverlay = useCallback((show?: boolean) => {
    setShowOverlay(show !== undefined ? show : !showOverlay);
  }, [showOverlay]);

  const closeOverlay = useCallback(() => {
    setShowOverlay(false);
    // Mark displayed notifications as shown
    if (displayedNotifications.length > 0) {
      const notificationIds = displayedNotifications.map(n => n.id);
      actions.markAsShown(notificationIds);
    }
  }, [displayedNotifications, actions]);

  return {
    showOverlay,
    displayedNotifications,
    toggleOverlay,
    closeOverlay,
    actions
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
  const { state, actions } = useNotifications();
  
  const updatePreference = useCallback((key: keyof NotificationPreferences, value: any) => {
    actions.updatePreferences({ [key]: value });
  }, [actions]);

  return {
    preferences: state?.preferences,
    updatePreference,
    updatePreferences: actions.updatePreferences
  };
}

/**
 * Hook for notification sound management
 */
export function useNotificationSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const { state } = useNotifications();

  const playNotificationSound = useCallback(async (type: 'new_answer' | 'updated_answer' | 'multiple_answers' = 'new_answer') => {
    if (!state?.preferences.soundEnabled) return;

    try {
      setIsPlaying(true);
      
      // Create audio context for better control
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound based on type
      const soundConfig = {
        new_answer: { frequency: 800, duration: 200 },
        updated_answer: { frequency: 600, duration: 150 },
        multiple_answers: { frequency: 1000, duration: 300 }
      };
      
      const config = soundConfig[type];
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(state.preferences.soundVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration / 1000);
      
      // Cleanup
      setTimeout(() => {
        audioContext.close();
        setIsPlaying(false);
      }, config.duration);
      
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
      setIsPlaying(false);
    }
  }, [state?.preferences]);

  return {
    isPlaying,
    playSound: playNotificationSound,
    canPlaySound: state?.preferences.soundEnabled || false
  };
}

/**
 * Hook for managing notification listener
 */
export function useNotificationListener(visitorUuid?: string) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await initializeNotificationListener(visitorUuid);
        if (mounted) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize');
          setIsInitialized(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [visitorUuid]);

  const refresh = useCallback(async () => {
    const listener = getNotificationListener();
    await listener.refresh();
  }, []);

  return {
    isInitialized,
    error,
    listener: getNotificationListener(),
    refresh
  };
}