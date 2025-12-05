'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChatBubble from './ChatBubble';

/**
 * Conditionally renders ChatBubble only on portfolio front-end pages
 * Excludes: /admin/* and /banned routes
 * Also hides bubble on /maintenance when hideBubbleCompletely is enabled
 */
export default function ConditionalChatBubble() {
  const pathname = usePathname();
  const [hideBubble, setHideBubble] = useState(false);
  
  // Listen for maintenance settings to check hideBubbleCompletely
  useEffect(() => {
    // Only check if we're on the maintenance page
    if (!pathname?.startsWith('/maintenance')) {
      setHideBubble(false);
      return;
    }
    
    const unsubscribe = onSnapshot(
      doc(db, 'siteSettings', 'maintenance'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Hide bubble if maintenance is enabled AND hideBubbleCompletely is true
          if (data?.enabled && data?.bubbleSettings?.hideBubbleCompletely) {
            setHideBubble(true);
          } else {
            setHideBubble(false);
          }
        }
      },
      (error) => {
        console.error('[ConditionalChatBubble] Error listening to maintenance:', error);
        setHideBubble(false);
      }
    );
    
    return () => unsubscribe();
  }, [pathname]);
  
  // Don't show bubble on admin or banned routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/banned')) {
    return null;
  }
  
  // Don't show bubble on maintenance page if hideBubbleCompletely is enabled
  if (pathname?.startsWith('/maintenance') && hideBubble) {
    return null;
  }
  
  return <ChatBubble />;
}
