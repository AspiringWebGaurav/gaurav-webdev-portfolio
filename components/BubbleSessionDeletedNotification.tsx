'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useBubbleSession } from '@/contexts/BubbleSessionContext';

/**
 * Shows a notification when the admin deletes the current session
 * Allows visitor to start a new conversation
 * 
 * IMPORTANT: Does NOT show on maintenance, banned, or admin pages
 * as session loss on these pages is expected and not due to admin action
 */
export default function BubbleSessionDeletedNotification() {
  const pathname = usePathname();
  const { visitorId } = useBubbleSession();
  const [wasDeleted, setWasDeleted] = useState(false);
  const [previousVisitorId, setPreviousVisitorId] = useState<string | null>(null);

  // Don't show notification on special pages where session loss is expected
  const isSpecialPage = pathname?.startsWith('/maintenance') || 
                        pathname?.startsWith('/banned') || 
                        pathname?.startsWith('/admin');

  useEffect(() => {
    // Never trigger "deleted" state on special pages
    if (isSpecialPage) {
      // Reset state when navigating to special pages
      setWasDeleted(false);
      return;
    }

    // Track if we had a session that disappeared (only on normal pages)
    if (previousVisitorId && !visitorId) {
      setWasDeleted(true);
      
      // Auto-dismiss after 10 seconds
      const timeout = setTimeout(() => {
        setWasDeleted(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }

    if (visitorId) {
      setPreviousVisitorId(visitorId);
    }
  }, [visitorId, previousVisitorId, isSpecialPage]);

  // Don't render on special pages or if not deleted
  if (isSpecialPage || !wasDeleted) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100001] max-w-md mx-auto px-4 animate-in slide-in-from-top duration-300">
      <div className="bg-white border-l-4 border-orange-500 shadow-xl rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            Conversation Closed
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            This conversation has been closed by the administrator. Feel free to start a new conversation!
          </p>
        </div>
        <button
          onClick={() => setWasDeleted(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
