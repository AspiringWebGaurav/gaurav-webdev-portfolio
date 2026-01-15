/**
 * Abuse Policy Context
 * 
 * Provides abuse policy state across the app.
 * Follows existing pattern from MaintenanceStatusContext and SuspensionStatusContext.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { abusePolicyManager, AbusePolicyState } from '@/lib/abusePolicyManager';

interface AbusePolicyContextType {
  state: AbusePolicyState;
  remainingTime: number;
  isActive: boolean;
}

const AbusePolicyContext = createContext<AbusePolicyContextType | null>(null);

export interface AbusePolicyProviderProps {
  children: ReactNode;
}

/**
 * Provider component - wraps abusePolicyManager to share its state
 */
export function AbusePolicyProvider({ children }: AbusePolicyProviderProps) {
  const [state, setState] = useState<AbusePolicyState>(abusePolicyManager.getState());
  const [remainingTime, setRemainingTime] = useState(0);

  // Subscribe to abuse policy state changes
  useEffect(() => {
    const unsubscribe = abusePolicyManager.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Update remaining time every second when banned
  useEffect(() => {
    if (!state.isBanned || !state.banExpiresAt) {
      setRemainingTime(0);
      return;
    }

    // Initial calculation
    const updateRemainingTime = () => {
      const remaining = abusePolicyManager.getRemainingTime();
      setRemainingTime(remaining);
      
      // If expired, force state refresh
      if (remaining <= 0 && state.isBanned) {
        setState(abusePolicyManager.getState());
      }
    };

    updateRemainingTime();

    // Update every second
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [state.isBanned, state.banExpiresAt]);

  const isActive = state.isBanned && remainingTime > 0;

  return (
    <AbusePolicyContext.Provider value={{ state, remainingTime, isActive }}>
      {children}
    </AbusePolicyContext.Provider>
  );
}

/**
 * Hook to access abuse policy state from anywhere in the app
 */
export function useAbusePolicyStatus(): AbusePolicyContextType {
  const context = useContext(AbusePolicyContext);
  
  if (!context) {
    // Return default values if context not available (fail-safe)
    return {
      state: {
        failedAttempts: 0,
        isBanned: false,
        banStartTime: null,
        banExpiresAt: null,
      },
      remainingTime: 0,
      isActive: false,
    };
  }
  
  return context;
}
