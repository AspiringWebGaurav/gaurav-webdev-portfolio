'use client'

import { useEffect, useRef } from 'react'

/**
 * Enterprise Scroll Restoration
 * 
 * Clean implementation based on bfcache (back/forward cache) pattern.
 * Used by Gmail, Twitter, LinkedIn, YouTube, and all modern React apps.
 * 
 * Key Principles:
 * 1. Use browser's Page Lifecycle API (pageshow/pagehide)
 * 2. Save on pagehide, restore on pageshow
 * 3. Session-only storage
 * 4. Never interfere with normal scrolling
 * 
 * Reference: https://web.dev/articles/bfcache
 */

const KEY = 'scroll_pos'

export function useScrollRestoration() {
  const restoredRef = useRef(false)

  useEffect(() => {
    // CRITICAL: Disable browser's native scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // Save scroll position when page might enter bfcache
    const handlePageHide = () => {
      try {
        sessionStorage.setItem(KEY, String(window.scrollY))
      } catch {}
    }

    // Restore scroll position from bfcache or regular load
    const handlePageShow = () => {
      // Only restore once per page load
      if (restoredRef.current) return
      restoredRef.current = true

      try {
        const saved = sessionStorage.getItem(KEY)
        if (!saved) return

        const position = parseInt(saved, 10)
        if (position <= 0) return

        // Wait for content to load
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Smooth scroll to saved position
            window.scrollTo({
              top: position,
              behavior: 'smooth'
            })

            // Clear after restoration
            setTimeout(() => {
              try {
                sessionStorage.removeItem(KEY)
              } catch {}
            }, 1000)
          })
        })
      } catch {}
    }

    // Browser Page Lifecycle events
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    // Initial restoration on mount
    handlePageShow()

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])
}

export default function ScrollRestoration() {
  useScrollRestoration()
  return null
}
