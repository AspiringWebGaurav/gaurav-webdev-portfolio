"use client";

import React from 'react';
import { AlertTriangle, ShieldCheck, Database, X } from 'lucide-react';
import { motion } from 'motion/react';

interface CacheClearWarningProps {
  cacheStats: {
    identity: { entries: number };
    uuid: { entries: number };
    browser: { routes: number };
    server: { memory: number; routes: number };
  };
  databaseStatus: {
    uuidCount: number;
    fingerprintCount: number;
    maskCount: number;
  };
  connectedClients: number;
  onCancel: () => void;
  onContinue: () => void;
}

export default function CacheClearWarning({
  cacheStats,
  databaseStatus,
  connectedClients,
  onCancel,
  onContinue,
}: CacheClearWarningProps) {
  const [understood, setUnderstood] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Danger Header */}
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-900">
              ⚠️ CRITICAL: Advanced Operation
            </h3>
            <p className="text-sm text-red-700 mt-1">
              This will clear all application caches. Please review carefully.
            </p>
          </div>
        </div>
      </div>

      {/* What Will Be Cleared */}
      <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
        <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
          <X className="w-4 h-4" />
          What Will Be Cleared:
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-bold">🔴</span>
            <div>
              <p className="font-medium text-orange-900">In-Memory Caches</p>
              <p className="text-orange-700">
                • Identity cache ({cacheStats.identity.entries} visitors)
              </p>
              <p className="text-orange-700">
                • UUID translation cache ({cacheStats.uuid.entries} entries)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">🟡</span>
            <div>
              <p className="font-medium text-orange-900">Browser Storage</p>
              <p className="text-orange-700">
                • Cache Storage API ({cacheStats.browser.routes} cached routes)
              </p>
              <p className="text-orange-700">• LocalStorage temporary data</p>
              <p className="text-orange-700">• SessionStorage</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold">🟡</span>
            <div>
              <p className="font-medium text-orange-900">Server Caches</p>
              <p className="text-orange-700">
                • Next.js route cache ({cacheStats.server.routes} routes)
              </p>
              <p className="text-orange-700">
                • Server memory ({cacheStats.server.memory.toFixed(1)} MB)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">🟢</span>
            <div>
              <p className="font-medium text-orange-900">Global Broadcast</p>
              <p className="text-orange-700">
                • {connectedClients} active tab{connectedClients !== 1 ? 's' : ''} will be
                notified
              </p>
              <p className="text-orange-700">• Minimized tabs will receive notification</p>
            </div>
          </div>
        </div>
      </div>

      {/* What Stays Protected */}
      <div className="bg-green-50 border border-green-300 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          What Stays Protected (GUARANTEED):
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Database className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Database Collections (READ-ONLY)</p>
              <p className="text-green-700">
                ✅ og_uuid: {databaseStatus.uuidCount.toLocaleString()} entries (unchanged)
              </p>
              <p className="text-green-700">
                ✅ og_uuid_fingerprints: {databaseStatus.fingerprintCount.toLocaleString()}{' '}
                entries
              </p>
              <p className="text-green-700">
                ✅ og_uuid_masks: {databaseStatus.maskCount.toLocaleString()} entries
              </p>
              <p className="text-green-700 font-medium mt-2">
                ✅ All visitor data: PRESERVED FOREVER
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">🔒</span>
            <div>
              <p className="font-medium text-green-900">Active Sessions</p>
              <p className="text-green-700">✅ Admin sessions: MAINTAINED</p>
              <p className="text-green-700">✅ Visitor sessions: PRESERVED</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">🔒</span>
            <div>
              <p className="font-medium text-green-900">Authentication State</p>
              <p className="text-green-700">✅ Firebase Auth: NO CHANGE</p>
              <p className="text-green-700">✅ Login status: MAINTAINED</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Impact */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Expected Impact:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Next visitor request: Rebuilds cache from database</li>
          <li>• Performance: Slightly slower first load (~50-100ms)</li>
          <li>• Duration: 2-5 seconds to complete</li>
          <li>• Downtime: NONE (system stays online)</li>
        </ul>
      </div>

      {/* Confirmation */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="mt-1 w-4 h-4 text-purple-600 rounded"
          />
          <span className="text-sm text-gray-700">
            <span className="font-semibold">I understand the risks</span> and confirm that I
            want to proceed with clearing all application caches. I understand that the
            database will remain unchanged and all visitor data is protected.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          disabled={!understood}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            understood
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Cache Dashboard →
        </button>
      </div>
    </motion.div>
  );
}
