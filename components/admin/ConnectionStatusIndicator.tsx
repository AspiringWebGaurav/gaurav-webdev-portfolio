/**
 * Connection Status Indicator
 * Shows online/offline status in the admin dashboard
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show if online
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border bg-red-50 border-red-200 text-red-700">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline - Updates paused</span>
      </div>
    </div>
  );
}
