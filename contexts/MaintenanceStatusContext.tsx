/**
 * Maintenance Status Context
 * 
 * Provides shared maintenance status across the app.
 * Wraps the existing MaintenanceMonitor Firebase listener to avoid duplicate reads.
 * Zero additional Firebase cost - reuses existing real-time listener.
 */

"use client";

import React, { createContext, useContext, ReactNode } from 'react';

export interface MaintenanceStatusData {
  enabled: boolean;
  estimatedEndTime: Date | null;
  isOverdue: boolean;
  overdueBy: number;
  estimatedDuration: number | null;
  enabledAt: Date | null;
  title?: string;
  message?: string;
}

interface MaintenanceStatusContextType {
  status: MaintenanceStatusData;
  isLoading: boolean;
}

const MaintenanceStatusContext = createContext<MaintenanceStatusContextType | null>(null);

export interface MaintenanceStatusProviderProps {
  children: ReactNode;
  value: MaintenanceStatusData;
  isLoading?: boolean;
}

/**
 * Provider component - wraps MaintenanceMonitor to share its state
 */
export function MaintenanceStatusProvider({ 
  children, 
  value, 
  isLoading = false 
}: MaintenanceStatusProviderProps) {
  return (
    <MaintenanceStatusContext.Provider value={{ status: value, isLoading }}>
      {children}
    </MaintenanceStatusContext.Provider>
  );
}

/**
 * Hook to access maintenance status from anywhere in the app
 * Zero Firebase cost - uses data from existing MaintenanceMonitor listener
 */
export function useMaintenanceStatus(): MaintenanceStatusContextType {
  const context = useContext(MaintenanceStatusContext);
  
  if (!context) {
    // Return default values if context not available (fail-safe)
    return {
      status: {
        enabled: false,
        estimatedEndTime: null,
        isOverdue: false,
        overdueBy: 0,
        estimatedDuration: null,
        enabledAt: null,
      },
      isLoading: true,
    };
  }
  
  return context;
}
