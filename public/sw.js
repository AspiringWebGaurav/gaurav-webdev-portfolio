// Gaurav's Portfolio - Service Worker for PWA functionality
const CACHE_NAME = 'gaurav-portfolio-v1.0.0';
const STATIC_CACHE_NAME = 'gaurav-portfolio-static-v1';
const DYNAMIC_CACHE_NAME = 'gaurav-portfolio-dynamic-v1';

// Production logging utility - only critical errors
const log = {
  error: (message, error) => {
    // Only log critical errors in production
    if (error) {
      console.error(`[SW] CRITICAL: ${message}`, error);
    }
  },
  debug: (message) => {
    // Silent in production - no debug logs
  },
  info: (message) => {
    // Silent in production - no info logs
  }
};

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/og-image.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

// Assets to cache dynamically
const CACHE_STRATEGIES = {
  images: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  styles: /\.(css)$/,
  scripts: /\.(js)$/,
  fonts: /\.(woff|woff2|ttf|otf)$/
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        log.error('Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // Skip API routes that need real-time data to prevent 503 errors
  if (url.pathname.includes('/api/direct-questions') ||
      url.pathname.includes('/api/visitors/') ||
      url.pathname.includes('/.well-known/vercel/jwe')) {
    return; // Let the request go directly to network
  }

  // Handle same-origin requests
  if (url.origin === location.origin) {
    event.respondWith(handleSameOriginRequest(request));
  }
  // Handle external requests (CDN, APIs, etc.)
  else {
    event.respondWith(handleCrossOriginRequest(request));
  }
});

// Handle same-origin requests with cache-first strategy
async function handleSameOriginRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Check static cache first
    const staticResponse = await caches.match(request, { cacheName: STATIC_CACHE_NAME });
    if (staticResponse) {
      return staticResponse;
    }

    // Check dynamic cache
    const dynamicResponse = await caches.match(request, { cacheName: DYNAMIC_CACHE_NAME });
    if (dynamicResponse) {
      return dynamicResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      await cacheResponse(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    log.error('Fetch failed', error);
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return generic offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your internet connection.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      }
    );
  }
}

// Handle cross-origin requests with network-first strategy
async function handleCrossOriginRequest(request) {
  try {
    // Try network first for external resources
    const networkResponse = await fetch(request);
    
    // Cache successful responses if they're cacheable assets
    if (networkResponse.ok && shouldCacheAsset(request.url)) {
      await cacheResponse(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback to cache for external resources
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache available, let the request fail naturally
    throw error;
  }
}

// Cache response based on asset type
async function cacheResponse(request, response) {
  const url = new URL(request.url);
  
  // Don't cache non-GET requests or failed responses
  if (request.method !== 'GET' || !response.ok) {
    return;
  }
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    // Cache with size limits to prevent storage bloat
    const cacheSize = await getCacheSize(DYNAMIC_CACHE_NAME);
    if (cacheSize > 50) { // Limit to 50 items in dynamic cache
      await cleanupOldestCacheEntries(DYNAMIC_CACHE_NAME, 10);
    }
    
    await cache.put(request, response);
    
  } catch (error) {
    log.error('Failed to cache response', error);
  }
}

// Check if asset should be cached
function shouldCacheAsset(url) {
  return Object.values(CACHE_STRATEGIES).some(pattern => pattern.test(url));
}

// Get cache size
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  return keys.length;
}

// Cleanup oldest cache entries
async function cleanupOldestCacheEntries(cacheName, keepCount) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  // Remove oldest entries (FIFO)
  const entriesToRemove = keys.slice(0, keys.length - keepCount);
  await Promise.all(
    entriesToRemove.map(key => cache.delete(key))
  );
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
    }
  }
});

// Clear all caches utility function
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  log.error('Unhandled promise rejection', event.reason);
  event.preventDefault();
});