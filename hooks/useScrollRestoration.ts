'use client'

import { useEffect, useRef } from 'react'

/**
 * Enterprise Scroll Restoration - Production Grade
 * 
 * Industry-standard implementation matching Gmail, Twitter, LinkedIn patterns.
 * Optimized for React SSR/hydration and dynamic content loading.
 * 
 * Features:
 * - React hydration-aware (waits for useEffect to indicate ready state)
 * - Detects when dynamic content is truly loaded (not just layout changes)
 * - MutationObserver + idle callback for content stability detection
 * - Automatic fallback to in-memory storage if sessionStorage fails
 * - Timeout protection to prevent infinite waiting
 * - Graceful degradation on errors
 * - Safe cleanup mechanisms
 * - Edge case handling (negative scrolls, infinity, NaN)
 * - Dev-only logging (zero console cost in production)
 * - Passive event listeners for better scroll performance
 * 
 * How it works:
 * 1. Waits for React hydration (first useEffect run)
 * 2. Monitors DOM mutations (new content being added)
 * 3. Uses requestIdleCallback to detect when browser is idle
 * 4. Restores scroll when content is stable
 * 
 * Reference: https://web.dev/articles/bfcache
 */

const KEY = 'scroll_pos'
const MAX_WAIT_TIME = 5000 // Failsafe: max 5s wait for content load
const IDLE_TIMEOUT = 150 // Wait 150ms of idle time before restoring
let inMemoryBackup: number | null = null // Fallback if storage fails
const isDev = process.env.NODE_ENV === 'development' // Only log in dev

export function useScrollRestoration() {
  const restoredRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mutationObserverRef = useRef<MutationObserver | null>(null)
  const idleCallbackRef = useRef<number | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    // Clean up any stale localStorage backups on mount (from other tabs or old sessions)
    try {
      const backup = localStorage.getItem(KEY + '_backup')
      if (backup) {
        try {
          const data = JSON.parse(backup)
          // Remove if older than 2 seconds
          if (!data || Date.now() - data.timestamp > 2000) {
            localStorage.removeItem(KEY + '_backup')
          }
        } catch {
          localStorage.removeItem(KEY + '_backup')
        }
      }
    } catch {}

    // CRITICAL: Disable browser's native scroll restoration
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
    } catch (error) {
      if (isDev) console.warn('[ScrollRestore] Failed to disable native restoration:', error)
    }

    // Save scroll position when page might enter bfcache
    const handlePageHide = () => {
      try {
        const position = window.scrollY
        if (!isFinite(position) || position < 0) return
        
        try {
          sessionStorage.setItem(KEY, String(position))
        } catch {
          inMemoryBackup = position // Fallback
        }
      } catch (error) {
        if (isDev) console.warn('[ScrollRestore] Save failed:', error)
      }
    }

    // Additional handler for hard refresh (beforeunload fires even on Ctrl+F5)
    const handleBeforeUnload = () => {
      try {
        const position = window.scrollY
        if (!isFinite(position) || position < 0) return
        
        // Save to both storages for redundancy
        try {
          sessionStorage.setItem(KEY, String(position))
          // Also save to localStorage with timestamp for hard refresh recovery
          const data = { position, timestamp: Date.now() }
          localStorage.setItem(KEY + '_backup', JSON.stringify(data))
        } catch {
          inMemoryBackup = position
        }
      } catch {}
    }

    // Restore scroll position from bfcache or regular load
    const handlePageShow = () => {
      // Only restore once per page load
      if (restoredRef.current) return
      restoredRef.current = true

      try {
        // Try to get saved position from sessionStorage or fallback
        let savedPosition: string | null = null
        
        try {
          // PRIORITY 1: Check for force update scroll position (from admin update)
          savedPosition = sessionStorage.getItem('preUpdateScrollPosition')
          if (savedPosition) {
            if (isDev) console.log('📍 [ScrollRestore] Force update scroll position found:', savedPosition)
            // Clean up immediately after reading
            sessionStorage.removeItem('preUpdateScrollPosition')
          } else {
            // PRIORITY 2: Regular scroll restoration
            savedPosition = sessionStorage.getItem(KEY)
            
            // PRIORITY 3: If sessionStorage is empty, check localStorage backup (for hard refresh)
            if (!savedPosition) {
              const backup = localStorage.getItem(KEY + '_backup')
              if (backup) {
                try {
                  const data = JSON.parse(backup)
                  // Only use backup if it's VERY recent (within last 2 seconds for hard refresh only)
                  // This prevents cross-tab interference while supporting hard refresh
                  if (data && Date.now() - data.timestamp < 2000) {
                    savedPosition = String(data.position)
                    if (isDev) console.log('[ScrollRestore] Using localStorage backup after hard refresh')
                  }
                  // Always clean up backup immediately
                  localStorage.removeItem(KEY + '_backup')
                } catch {
                  // Clean up corrupted backup
                  try { localStorage.removeItem(KEY + '_backup') } catch {}
                }
              }
            }
          }
        } catch {
          if (inMemoryBackup !== null) {
            savedPosition = String(inMemoryBackup)
          }
        }

        if (!savedPosition) return

        const position = parseInt(savedPosition, 10)
        
        // Validate position (check for NaN, negative, or unreasonably large values)
        if (!isFinite(position) || position <= 0 || position > 999999) return

        // Enterprise approach: Wait for React hydration + DOM mutations to stabilize
        const waitForDynamicContent = (callback: () => void) => {
          let mutationCount = 0
          let idleTimer: NodeJS.Timeout | null = null
          const startTime = Date.now()

          const checkIfReady = () => {
            // Failsafe: max wait time exceeded
            if (Date.now() - startTime > MAX_WAIT_TIME) {
              cleanup()
              callback()
              return
            }

            // Clear existing idle timer
            if (idleTimer) clearTimeout(idleTimer)

            // Wait for browser to be idle (no mutations for IDLE_TIMEOUT ms)
            idleTimer = setTimeout(() => {
              cleanup()
              callback()
            }, IDLE_TIMEOUT)
          }

          const cleanup = () => {
            if (mutationObserverRef.current) {
              mutationObserverRef.current.disconnect()
              mutationObserverRef.current = null
            }
            if (idleTimer) {
              clearTimeout(idleTimer)
              idleTimer = null
            }
            if (idleCallbackRef.current && typeof window.cancelIdleCallback === 'function') {
              window.cancelIdleCallback(idleCallbackRef.current)
              idleCallbackRef.current = null
            }
          }

          try {
            // Monitor DOM mutations (new content being added - like Firebase data rendering)
            mutationObserverRef.current = new MutationObserver((mutations) => {
              // Only count significant mutations (childList changes = new content)
              const significantMutations = mutations.filter(
                m => m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)
              )
              
              if (significantMutations.length > 0) {
                mutationCount += significantMutations.length
                checkIfReady()
              }
            })

            // Observe the main content area for changes
            mutationObserverRef.current.observe(document.body, {
              childList: true,
              subtree: true,
              // Don't observe attributes/characterData - only structural changes
            })

            // Use requestIdleCallback if available (better than setTimeout)
            if (typeof window.requestIdleCallback === 'function') {
              idleCallbackRef.current = window.requestIdleCallback(() => {
                // Browser is idle, check if we have mutations
                checkIfReady()
              }, { timeout: IDLE_TIMEOUT })
            } else {
              // Fallback: just check after idle timeout
              setTimeout(() => checkIfReady(), IDLE_TIMEOUT)
            }
            
            // IMPORTANT: Also trigger initial check regardless of mutations
            // This ensures scroll restoration even if no mutations occur
            checkIfReady()
          } catch (observerError) {
            // Fallback 1: Try simpler height-based detection
            if (isDev) console.warn('[ScrollRestore] MutationObserver failed, using fallback:', observerError)
            
            let lastHeight = document.documentElement.scrollHeight
            const heightCheckInterval = setInterval(() => {
              const currentHeight = document.documentElement.scrollHeight
              
              if (currentHeight === lastHeight || Date.now() - startTime > MAX_WAIT_TIME) {
                clearInterval(heightCheckInterval)
                callback()
              } else {
                lastHeight = currentHeight
              }
            }, 200)
          }
        }

        // Wait for dynamic content to fully render
        const restoreScroll = () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }

          const attemptScroll = () => {
            try {
              const maxScroll = document.documentElement.scrollHeight - window.innerHeight
              const safePosition = Math.min(position, Math.max(0, maxScroll))
              
              // Attempt 1: Smooth scroll
              window.scrollTo({ top: safePosition, behavior: 'smooth' })

              // Verify scroll happened after a brief delay
              setTimeout(() => {
                const currentScroll = window.scrollY
                const scrollDiff = Math.abs(currentScroll - safePosition)
                
                // If scroll failed (difference > 50px) and we have retries left
                if (scrollDiff > 50 && retryCountRef.current < maxRetries) {
                  retryCountRef.current++
                  if (isDev) console.warn(`[ScrollRestore] Scroll incomplete, retry ${retryCountRef.current}/${maxRetries}`)
                  attemptScroll() // Retry
                } else {
                  // Success or max retries reached - cleanup
                  try {
                    sessionStorage.removeItem(KEY)
                    inMemoryBackup = null
                  } catch {}
                }
              }, 100)
            } catch (error) {
              if (isDev) console.warn('[ScrollRestore] Smooth scroll failed, trying instant:', error)
              
              // Fallback 1: Instant scroll
              try {
                window.scrollTo({ top: position, behavior: 'instant' })
              } catch (instantError) {
                if (isDev) console.warn('[ScrollRestore] Instant scroll failed, trying direct:', instantError)
                
                // Fallback 2: Direct property assignment
                try {
                  window.scrollTo(0, position)
                } catch (directError) {
                  if (isDev) console.warn('[ScrollRestore] Direct scroll failed, trying element:', directError)
                  
                  // Fallback 3: Direct DOM manipulation (last resort)
                  try {
                    document.documentElement.scrollTop = position
                    document.body.scrollTop = position
                  } catch (domError) {
                    // All methods failed - cleanup and move on
                    if (isDev) console.error('[ScrollRestore] All scroll methods failed:', domError)
                  }
                }
              }
              
              // Cleanup even if scroll failed
              try {
                sessionStorage.removeItem(KEY)
                inMemoryBackup = null
              } catch {}
            }
          }

          // Use RAF for better timing, with fallback if RAF fails
          try {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                attemptScroll()
              })
            })
          } catch (rafError) {
            // RAF failed (very rare) - try direct
            if (isDev) console.warn('[ScrollRestore] RAF failed, executing directly:', rafError)
            attemptScroll()
          }
        }

        // Failsafe timeout - force restore after max wait time
        timeoutRef.current = setTimeout(() => {
          if (mutationObserverRef.current) {
            mutationObserverRef.current.disconnect()
            mutationObserverRef.current = null
          }
          if (idleCallbackRef.current && typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(idleCallbackRef.current)
            idleCallbackRef.current = null
          }
          restoreScroll()
        }, MAX_WAIT_TIME)

        // Wait for initial page load, then check for dynamic content
        if (document.readyState === 'complete') {
          // Page already loaded, wait for dynamic content height to stabilize
          waitForDynamicContent(restoreScroll)
        } else {
          // Wait for full page load first
          const loadHandler = () => {
            // After load, wait for dynamic content
            waitForDynamicContent(restoreScroll)
          }
          
          window.addEventListener('load', loadHandler, { once: true })
        }
      } catch (error) {
        if (isDev) console.warn('[ScrollRestore] Restore failed:', error)
      }
    }

    // Browser Page Lifecycle events (passive listeners for better performance)
    try {
      window.addEventListener('pagehide', handlePageHide, { passive: true })
      window.addEventListener('pageshow', handlePageShow, { passive: true })
      // Critical: beforeunload fires even on hard refresh (Ctrl+F5)
      window.addEventListener('beforeunload', handleBeforeUnload, { passive: true })
      
      handlePageShow()
    } catch (error) {
      if (isDev) console.warn('[ScrollRestore] Event listener setup failed:', error)
    }

    // Cleanup function with comprehensive error handling
    return () => {
      try {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      } catch {}
      
      try {
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect()
          mutationObserverRef.current = null
        }
      } catch {}
      
      try {
        if (idleCallbackRef.current && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleCallbackRef.current)
          idleCallbackRef.current = null
        }
      } catch {}
      
      try {
        window.removeEventListener('pagehide', handlePageHide)
      } catch {}
      
      try {
        window.removeEventListener('pageshow', handlePageShow)
      } catch {}
      
      try {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      } catch {}
      
      try {
        inMemoryBackup = null
        retryCountRef.current = 0
      } catch {}
    }
  }, [])
}

export default function ScrollRestoration() {
  useScrollRestoration()
  return null
}
