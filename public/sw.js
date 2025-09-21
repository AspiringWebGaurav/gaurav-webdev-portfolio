// Gaurav's Portfolio - Service Worker for PWA functionality
const CACHE_NAME = 'gaurav-portfolio-v1.0.0';
const STATIC_CACHE_NAME = 'gaurav-portfolio-static-v1';
const DYNAMIC_CACHE_NAME = 'gaurav-portfolio-dynamic-v1';

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
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
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
      console.log('[SW] Serving from static cache:', url.pathname);
      return staticResponse;
    }

    // Check dynamic cache
    const dynamicResponse = await caches.match(request, { cacheName: DYNAMIC_CACHE_NAME });
    if (dynamicResponse) {
      console.log('[SW] Serving from dynamic cache:', url.pathname);
      return dynamicResponse;
    }

    // Fetch from network
    console.log('[SW] Fetching from network:', url.pathname);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      await cacheResponse(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
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
      console.log('[SW] Serving external asset from cache:', request.url);
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
    
    console.log('[SW] Caching response:', url.pathname);
    await cache.put(request, response);
    
  } catch (error) {
    console.error('[SW] Failed to cache response:', error);
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
  
  console.log(`[SW] Cleaned up ${entriesToRemove.length} old cache entries`);
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
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
      default:
        console.log('[SW] Unknown message type:', event.data.type);
    }
  }
});

// Clear all caches utility function
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Log service worker lifecycle
console.log('[SW] Service Worker script loaded');