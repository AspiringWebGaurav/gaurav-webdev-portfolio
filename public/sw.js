// Enterprise Service Worker with Silent Operation
const CACHE_NAME = 'portfolio-enterprise-v1';
const CRITICAL_CACHE = 'portfolio-critical-v1';
const RUNTIME_CACHE = 'portfolio-runtime-v1';

// Critical assets that must be cached immediately
const CRITICAL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png'
];

// Asset manifest for version control
let ASSET_MANIFEST = null;

// Silent mode - no console logs in production
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const log = isDev ? console.log.bind(console, '[SW]') : () => {};
const warn = isDev ? console.warn.bind(console, '[SW]') : () => {};
const error = console.error.bind(console, '[SW]'); // Always log errors

class EnterpriseServiceWorker {
  constructor() {
    this.isFirstLoad = false;
    this.criticalAssetsReady = false;
    this.initializeAssetManifest();
  }

  async initializeAssetManifest() {
    try {
      const response = await fetch('/_next/static/asset-manifest.json');
      if (response.ok) {
        ASSET_MANIFEST = await response.json();
        log('Asset manifest loaded:', ASSET_MANIFEST);
      }
    } catch (err) {
      warn('Asset manifest not found, using fallback');
    }
  }

  // Install: Cache critical assets atomically
  async handleInstall(event) {
    log('Installing service worker...');
    
    event.waitUntil(
      this.installCriticalAssets()
        .then(() => {
          this.criticalAssetsReady = true;
          return self.skipWaiting();
        })
        .catch(err => {
          error('Critical asset installation failed:', err);
          // Fail fast - don't activate if critical assets fail
          throw err;
        })
    );
  }

  async installCriticalAssets() {
    const cache = await caches.open(CRITICAL_CACHE);
    const criticalRequests = CRITICAL_ASSETS.map(url => new Request(url, {
      cache: 'reload' // Bypass browser cache for fresh assets
    }));
    
    // Atomic installation - all or nothing
    const responses = await Promise.all(
      criticalRequests.map(request =>
        fetch(request).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch ${request.url}: ${response.status}`);
          }
          return response;
        })
      )
    );
    
    await Promise.all(
      criticalRequests.map((request, index) =>
        cache.put(request, responses[index])
      )
    );
    
    log('Critical assets cached atomically');
  }

  // Activate: Clean up old caches
  async handleActivate(event) {
    log('Activating service worker...');
    
    event.waitUntil(
      this.cleanupOldCaches()
        .then(() => self.clients.claim())
        .then(() => {
          log('Service worker activated');
        })
    );
  }

  async cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [CACHE_NAME, CRITICAL_CACHE, RUNTIME_CACHE];
    
    await Promise.all(
      cacheNames
        .filter(cacheName => !validCaches.includes(cacheName))
        .map(cacheName => {
          log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
    );
  }

  // Fetch: Enterprise-grade request handling
  async handleFetch(event) {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and extensions
    if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
      return;
    }
    
    event.respondWith(this.enterpriseFetch(request));
  }

  async enterpriseFetch(request) {
    const url = new URL(request.url);
    
    try {
      // Critical assets: Cache-first with network fallback
      if (this.isCriticalAsset(url.pathname)) {
        return await this.handleCriticalAsset(request);
      }
      
      // Static assets: Stale-while-revalidate
      if (this.isStaticAsset(url.pathname)) {
        return await this.handleStaticAsset(request);
      }
      
      // Navigation: Network-first with cache fallback
      if (request.mode === 'navigate') {
        return await this.handleNavigation(request);
      }
      
      // Default: Network-first
      return await this.handleDefault(request);
      
    } catch (error) {
      error('Fetch failed for:', request.url, error);
      return this.createOfflineResponse(request);
    }
  }

  async handleCriticalAsset(request) {
    const cache = await caches.open(CRITICAL_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      log('Serving critical asset from cache:', request.url);
      // Fix MIME type for cached responses
      return this.fixResponseMimeType(cached, request);
    }
    
    // Network fallback for critical assets
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }

  async handleStaticAsset(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const url = new URL(request.url);
    
    // For CSS files, use network-first to ensure freshness
    if (this.isCSSAsset(url.pathname)) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
          return response;
        }
        // Fallback to cache if network fails
        const cached = await cache.match(request);
        return cached ? this.fixResponseMimeType(cached, request) : response;
      } catch (error) {
        // Return cached version if available
        const cached = await cache.match(request);
        if (cached) return this.fixResponseMimeType(cached, request);
        throw error;
      }
    }
    
    // For other static assets, use cache-first
    const cached = await cache.match(request);
    if (cached) {
      // Serve from cache, update in background
      this.updateAssetInBackground(request, cache);
      return this.fixResponseMimeType(cached, request);
    }
    
    // Network first for new assets
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }

  async handleNavigation(request) {
    try {
      // Network first for navigation
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (err) {
      // Fallback to cached version
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      
      // Ultimate fallback to home page
      const homePage = await cache.match('/');
      return homePage || this.createOfflineResponse(request);
    }
  }

  async handleDefault(request) {
    const response = await fetch(request);
    
    if (response.ok && this.shouldCache(request)) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  }

  // Background asset update
  async updateAssetInBackground(request, cache) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
        log('Background updated:', request.url);
      }
    } catch (err) {
      // Silent failure for background updates
      warn('Background update failed:', request.url);
    }
  }

  // Helper methods
  isCriticalAsset(pathname) {
    return CRITICAL_ASSETS.some(asset => pathname.includes(asset)) ||
           pathname.includes('/critical-') ||
           pathname === '/' ||
           pathname === '/manifest.json';
  }

  isStaticAsset(pathname) {
    return pathname.startsWith('/_next/static/') ||
           /\.(js|css|woff|woff2|png|jpg|jpeg|gif|svg|ico)$/.test(pathname);
  }

  isCSSAsset(pathname) {
    return pathname.includes('.css') || pathname.startsWith('/_next/static/css/');
  }

  shouldCache(request) {
    const url = new URL(request.url);
    return url.origin === location.origin &&
           !url.pathname.startsWith('/api/') &&
           this.isStaticAsset(url.pathname);
  }

  createOfflineResponse(request) {
    if (request.mode === 'navigate') {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Offline</title></head>
          <body>
            <h1>You're offline</h1>
            <p>Please check your internet connection.</p>
          </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response(null, { status: 503 });
  }

  // Fix MIME type for cached responses
  fixResponseMimeType(response, request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Get correct MIME type based on file extension
    const mimeType = this.getMimeType(pathname);
    const currentContentType = response.headers.get('Content-Type');
    
    // If MIME type is already correct, return as is
    if (currentContentType && currentContentType.includes(mimeType)) {
      return response;
    }
    
    // Create new response with correct MIME type
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Type', mimeType + '; charset=utf-8');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  // Get correct MIME type for file
  getMimeType(pathname) {
    if (pathname.includes('.css') || pathname.includes('/css/')) {
      return 'text/css';
    }
    if (pathname.includes('.js') || pathname.includes('/chunks/')) {
      return 'application/javascript';
    }
    if (pathname.includes('.woff') || pathname.includes('.woff2')) {
      return 'font/woff2';
    }
    if (pathname.includes('.json')) {
      return 'application/json';
    }
    if (/\.(png|jpg|jpeg|gif|webp)$/.test(pathname)) {
      return 'image/' + pathname.split('.').pop();
    }
    if (pathname.includes('.svg')) {
      return 'image/svg+xml';
    }
    if (pathname.includes('.ico')) {
      return 'image/x-icon';
    }
    
    // Default fallback
    return 'application/octet-stream';
  }
}

// Initialize enterprise service worker
const enterpriseSW = new EnterpriseServiceWorker();

self.addEventListener('install', event => enterpriseSW.handleInstall(event));
self.addEventListener('activate', event => enterpriseSW.handleActivate(event));
self.addEventListener('fetch', event => enterpriseSW.handleFetch(event));

// Message handling for cache management
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        criticalReady: enterpriseSW.criticalAssetsReady,
        caches: [CACHE_NAME, CRITICAL_CACHE, RUNTIME_CACHE]
      });
      break;
    case 'CLEAR_CACHE':
      caches.keys().then(names =>
        Promise.all(names.map(name => caches.delete(name)))
      ).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

log('Enterprise Service Worker script loaded');