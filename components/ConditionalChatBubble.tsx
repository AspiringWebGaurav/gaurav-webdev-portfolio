'use client';

import { usePathname } from 'next/navigation';
import ChatBubble from './ChatBubble';

/**
 * Conditionally renders ChatBubble only on portfolio front-end pages
 * Excludes: /admin/* and /banned routes
 */
export default function ConditionalChatBubble() {
  const pathname = usePathname();
  
  // Don't show bubble on admin or banned routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/banned')) {
    return null;
  }
  
  return <ChatBubble />;
}
