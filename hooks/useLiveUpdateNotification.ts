/**
 * Live Update Notification Hook
 * 
 * Detects changes in real-time and shows notifications to admin
 * when new data arrives (messages, submissions, etc.)
 */

'use client';

import { useEffect, useRef } from 'react';
import { showToast as toast } from "@/lib/toast";


interface LiveUpdateOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  showNotification?: boolean;
}

export function useLiveUpdateNotification<T>(
  data: T[],
  options: LiveUpdateOptions = {}
) {
  const {
    enabled = true,
    soundEnabled = false,
    showNotification = true,
  } = options;

  const previousCountRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !Array.isArray(data)) return;

    const currentCount = data.length;

    // Skip notification on first load
    if (!isInitializedRef.current) {
      previousCountRef.current = currentCount;
      isInitializedRef.current = true;
      return;
    }

    // Check if there's new data
    if (currentCount > previousCountRef.current) {
      const newItemsCount = currentCount - previousCountRef.current;
      
      if (showNotification) {
        toast.info(`${newItemsCount} new ${newItemsCount === 1 ? 'item' : 'items'} arrived`, 'New Items', {
          autoClose: 3000,
        });
      }

      if (soundEnabled) {
        playNotificationSound();
      }
    }

    previousCountRef.current = currentCount;
  }, [data, enabled, soundEnabled, showNotification]);
}

/**
 * Hook to detect specific changes in unread counts with custom messages
 */
export function useUnreadCountNotification(
  count: number,
  label: string,
  options: LiveUpdateOptions = {}
) {
  const {
    enabled = true,
    soundEnabled = false,
    showNotification = true,
  } = options;

  const previousCountRef = useRef<number>(count); // Initialize with current count
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // On first render, just store the current count
    if (!isInitializedRef.current) {
      previousCountRef.current = count;
      isInitializedRef.current = true;
      console.log(`[LiveNotification] Initialized ${label}:`, count);
      return;
    }

    // Check if count increased
    if (count > previousCountRef.current) {
      const newItemsCount = count - previousCountRef.current;
      
      console.log(`[LiveNotification] ${label} increased:`, {
        from: previousCountRef.current,
        to: count,
        new: newItemsCount
      });
      
      if (showNotification) {
        toast.info(
          `${newItemsCount} new ${label}`,
          '🔔 New Update',
          {
            autoClose: 5000,
          }
        );
      }

      if (soundEnabled) {
        playNotificationSound();
      }
    }

    previousCountRef.current = count;
  }, [count, label, enabled, soundEnabled, showNotification]);
}

/**
 * Play notification sound (optional)
 */
function playNotificationSound() {
  if (typeof window === 'undefined') return;
  
  try {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}
