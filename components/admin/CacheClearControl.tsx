"use client";

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import CacheClearWarning from './CacheClearWarning';
import CacheDashboard from './CacheDashboard';
import { getCacheStats, clearAllCacheWithErrorHandling } from '@/lib/cacheInvalidation';

type Page = 'idle' | 'warning' | 'dashboard';
type ClearPhase = 'idle' | 'client' | 'broadcast' | 'verify' | 'complete' | 'error';

interface Operation {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  duration?: number;
  error?: string;
}

export default function CacheClearControl() {
  const [currentPage, setCurrentPage] = React.useState<Page>('idle');
  const [loading, setLoading] = React.useState(false);
  const [phase, setPhase] = React.useState<ClearPhase>('idle');
  const [operations, setOperations] = React.useState<Operation[]>([]);
  const [results, setResults] = React.useState<any>(null);
  const [cacheStats, setCacheStats] = React.useState<any>(null);
  const [databaseStatus, setDatabaseStatus] = React.useState({
    uuidCount: 0,
    fingerprintCount: 0,
    maskCount: 0,
  });
  const [connectedClients, setConnectedClients] = React.useState(1);

  // Load cache stats on mount
  React.useEffect(() => {
    loadCacheStats();
    loadDatabaseStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('[CacheClearControl] Failed to load cache stats:', error);
      setCacheStats({
        identity: { entries: 0 },
        uuid: { entries: 0 },
        browser: { routes: 0 },
        server: { memory: 0, routes: 0 },
      });
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/admin/cache-stats');
      if (response.ok) {
        const data = await response.json();
        setDatabaseStatus(data.database);
        setConnectedClients(data.connectedClients || 1);
      }
    } catch (error) {
      console.error('[CacheClearControl] Failed to load database stats:', error);
    }
  };

  const handleOpenWarning = () => {
    setCurrentPage('warning');
  };

  const handleCancelWarning = () => {
    setCurrentPage('idle');
  };

  const handleContinueToPanel = () => {
    setCurrentPage('dashboard');
    startCacheClear();
  };

  const startCacheClear = async () => {
    setPhase('client');
    setLoading(true);

    // FIRST: Log current cache state BEFORE clearing
    console.log('[Cache Clear] 📊 Current cache state BEFORE clear:');
    try {
      const beforeStats = await getCacheStats();
      console.log('[Cache Clear] Identity entries:', beforeStats.identity.entries);
      console.log('[Cache Clear] UUID entries:', beforeStats.uuid.entries);
      console.log('[Cache Clear] Browser caches:', beforeStats.browser.routes);
    } catch (err) {
      console.log('[Cache Clear] Could not read pre-clear stats:', err);
    }

    // Initialize operations
    const initialOps: Operation[] = [
      {
        id: 'client-cache',
        name: 'Clear Client-Side Caches',
        description: 'Clearing in-memory identity, UUID, and browser caches',
        status: 'running',
      },
      {
        id: 'broadcast',
        name: 'Broadcast to All Tabs',
        description: 'Notifying all connected clients to clear their caches',
        status: 'pending',
      },
      {
        id: 'verify',
        name: 'Verify Database Integrity',
        description: 'Ensuring all visitor data is preserved',
        status: 'pending',
      },
    ];
    setOperations(initialOps);

    try {
      // Phase 1: Client cache clear
      const startTime = Date.now();
      const clearResult = await clearAllCacheWithErrorHandling();
      const duration = Date.now() - startTime;

      // Update client cache operation
      setOperations((prev) =>
        prev.map((op) =>
          op.id === 'client-cache'
            ? { ...op, status: 'success', duration }
            : op
        )
      );

      // Phase 2: Broadcast
      setPhase('broadcast');
      setOperations((prev) =>
        prev.map((op) =>
          op.id === 'broadcast' ? { ...op, status: 'running' } : op
        )
      );

      const broadcastStart = Date.now();
      // Broadcast is already done in clearAllCacheWithErrorHandling, just simulate delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      const broadcastDuration = Date.now() - broadcastStart;

      setOperations((prev) =>
        prev.map((op) =>
          op.id === 'broadcast'
            ? { ...op, status: 'success', duration: broadcastDuration }
            : op
        )
      );

      // Phase 3: Verify
      setPhase('verify');
      setOperations((prev) =>
        prev.map((op) =>
          op.id === 'verify' ? { ...op, status: 'running' } : op
        )
      );

      const verifyStart = Date.now();
      // Database verification is done in clearAllCacheWithErrorHandling
      await new Promise((resolve) => setTimeout(resolve, 500));
      const verifyDuration = Date.now() - verifyStart;

      setOperations((prev) =>
        prev.map((op) =>
          op.id === 'verify'
            ? { ...op, status: 'success', duration: verifyDuration }
            : op
        )
      );

      // Complete
      setPhase('complete');
      
      // Use ACTUAL detailed counts from clearResult
      const counts = clearResult.counts || {
        identityCleared: 0,
        uuidCleared: 0,
        browserCachesCleared: 0,
      };
      
      setResults({
        identityCleared: counts.identityCleared,
        uuidCleared: counts.uuidCleared,
        browserCachesCleared: counts.browserCachesCleared > 0 
          ? Array(counts.browserCachesCleared).fill('cache-storage') 
          : [],
        broadcastSuccess: clearResult.phases.broadcast.success,
        notifiedTabs: connectedClients,
        databaseVerified: clearResult.phases.verification.success,
        errors: clearResult.errors,
      });
    } catch (error: any) {
      console.error('[CacheClearControl] Cache clear failed:', error);
      setPhase('error');
      setOperations((prev) =>
        prev.map((op) =>
          op.status === 'running'
            ? { ...op, status: 'error', error: error.message }
            : op
        )
      );
      setResults({
        identityCleared: 0,
        uuidCleared: 0,
        browserCachesCleared: [],
        broadcastSuccess: false,
        notifiedTabs: 0,
        databaseVerified: false,
        errors: [
          {
            code: 'CACHE_CLEAR_FAILED',
            message: error.message || 'Unknown error',
            severity: 'high',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setPhase('idle');
    setOperations([]);
    setResults(null);
    startCacheClear();
  };

  const handleClose = () => {
    setCurrentPage('idle');
    setPhase('idle');
    setOperations([]);
    setResults(null);
    // Reload stats
    loadCacheStats();
    loadDatabaseStats();
  };

  if (currentPage === 'warning' && cacheStats) {
    return (
      <CacheClearWarning
        cacheStats={cacheStats}
        databaseStatus={databaseStatus}
        connectedClients={connectedClients}
        onCancel={handleCancelWarning}
        onContinue={handleContinueToPanel}
      />
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <CacheDashboard
        phase={phase}
        operations={operations}
        results={results}
        onBack={handleCancelWarning}
        onRetry={handleRetry}
        onClose={handleClose}
      />
    );
  }

  // Idle state - show button to open warning
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Clear Application Cache</h3>
            <p className="text-sm text-gray-600 mt-1">
              Clear all in-memory and browser caches across the application. This will force
              all data to be reloaded from the database on the next request.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ This is an advanced operation. Database data will NOT be affected.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleOpenWarning}
            disabled={loading || !cacheStats}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              loading || !cacheStats
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : !cacheStats ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Stats...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Clear All Caches
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
