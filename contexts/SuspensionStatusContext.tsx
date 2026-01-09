/**
 * Suspension Status Context
 * 
 * Provides shared suspension status across the app.
 * Wraps the SuspensionMonitor Firebase listener to avoid duplicate reads.
 * Zero additional Firebase cost - reuses existing real-time listener.
 */

"use client";

import React, { createContext, useContext, ReactNode } from 'react';

export interface SuspensionStatusData {
  enabled: boolean;
  reason: string;
  estimatedDuration: number | null;
  enabledAt: Date | null;
  enabledBy: string | null;
  lastUpdated: Date | null;
}

interface SuspensionStatusContextType {
  status: SuspensionStatusData;
  isLoading: boolean;
}

const SuspensionStatusContext = createContext<SuspensionStatusContextType | null>(null);

export interface SuspensionStatusProviderProps {
  children: ReactNode;
  value: SuspensionStatusData;
  isLoading?: boolean;
}

/**
 * Provider component - wraps SuspensionMonitor to share its state
 */
export function SuspensionStatusProvider({ 
  children, 
  value, 
  isLoading = false 
}: SuspensionStatusProviderProps) {
  return (
    <SuspensionStatusContext.Provider value={{ status: value, isLoading }}>
      {children}
    </SuspensionStatusContext.Provider>
  );
}

/**
 * Hook to access suspension status from anywhere in the app
 * Zero Firebase cost - uses data from existing SuspensionMonitor listener
 */
export function useSuspensionStatus(): SuspensionStatusContextType {
  const context = useContext(SuspensionStatusContext);
  
  if (!context) {
    // Return default values if context not available (fail-safe)
    return {
      status: {
        enabled: false,
        reason: '',
        estimatedDuration: null,
        enabledAt: null,
        enabledBy: null,
        lastUpdated: null,
      },
      isLoading: true,
    };
  }
  
  return context;
}
