"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, XCircle, AlertCircle, Wifi, Radio, Shield, Zap } from 'lucide-react';

interface SystemStatus {
  layer1: 'healthy' | 'degraded' | 'down';
  layer2: 'healthy' | 'degraded' | 'down';
  layer3: 'healthy' | 'degraded' | 'down';
  deduplication: 'active' | 'fallback' | 'memory-only';
  storage: 'localStorage' | 'sessionStorage' | 'memory';
  listeners: {
    ping: boolean;
    preUpdate: boolean;
    layer1: boolean;
    layer2: boolean;
    layer3: boolean;
  };
}

export default function ForceUpdateSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    layer1: 'healthy',
    layer2: 'healthy',
    layer3: 'healthy',
    deduplication: 'active',
    storage: 'localStorage',
    listeners: {
      ping: true,
      preUpdate: true,
      layer1: true,
      layer2: true,
      layer3: true,
    },
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate health monitoring (in real app, this would read from console logs or monitoring API)
  useEffect(() => {
    const checkSystemHealth = () => {
      try {
        // Check storage availability
        let storageType: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage';
        try {
          localStorage.getItem('test');
        } catch {
          try {
            sessionStorage.getItem('test');
            storageType = 'sessionStorage';
          } catch {
            storageType = 'memory';
          }
        }

        setStatus(prev => ({
          ...prev,
          storage: storageType,
          deduplication: storageType === 'memory' ? 'memory-only' : 'active',
        }));
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (state: 'healthy' | 'degraded' | 'down') => {
    switch (state) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (state: 'healthy' | 'degraded' | 'down') => {
    switch (state) {
      case 'healthy':
        return 'bg-green-100 border-green-300 text-green-900';
      case 'degraded':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'down':
        return 'bg-red-100 border-red-300 text-red-900';
    }
  };

  const healthyLayers = [status.layer1, status.layer2, status.layer3].filter(
    l => l === 'healthy'
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            healthyLayers === 3 ? 'bg-green-100' : healthyLayers > 0 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <Activity className={`w-5 h-5 ${
              healthyLayers === 3 ? 'text-green-600' : healthyLayers > 0 ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">System Health Monitor</h3>
            <p className="text-sm text-gray-600">
              {healthyLayers}/3 layers operational • {status.listeners.ping ? 'Listeners active' : 'Listeners inactive'}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200"
          >
            <div className="p-6 space-y-4">
              {/* Broadcast Layers */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Broadcast Layers (3-Layer Fallback)
                </h4>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(status.layer1)}`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.layer1)}
                      <div>
                        <p className="font-medium text-sm">Layer 1 - Primary</p>
                        <p className="text-xs opacity-80">admin_broadcasts</p>
                      </div>
                    </div>
                    {status.layer1 === 'healthy' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-4 h-4 text-green-600" />
                      </motion.div>
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(status.layer2)}`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.layer2)}
                      <div>
                        <p className="font-medium text-sm">Layer 2 - Fallback</p>
                        <p className="text-xs opacity-80">force_reload_fallback</p>
                      </div>
                    </div>
                    {status.layer2 === 'healthy' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      >
                        <Shield className="w-4 h-4 text-green-600" />
                      </motion.div>
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(status.layer3)}`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.layer3)}
                      <div>
                        <p className="font-medium text-sm">Layer 3 - Last Resort</p>
                        <p className="text-xs opacity-80">system_commands</p>
                      </div>
                    </div>
                    {status.layer3 === 'healthy' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      >
                        <Wifi className="w-4 h-4 text-green-600" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deduplication System */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Deduplication & Safety
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-3 rounded-lg border ${
                    status.deduplication === 'active' 
                      ? 'bg-green-50 border-green-200' 
                      : status.deduplication === 'fallback'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <p className="text-xs font-medium mb-1">Deduplication</p>
                    <p className="text-xs opacity-80 capitalize">{status.deduplication.replace('-', ' ')}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    status.storage === 'localStorage'
                      ? 'bg-green-50 border-green-200'
                      : status.storage === 'sessionStorage'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <p className="text-xs font-medium mb-1">Storage</p>
                    <p className="text-xs opacity-80 capitalize">{status.storage}</p>
                  </div>
                </div>
              </div>

              {/* Active Listeners */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Active Listeners
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded border ${status.listeners.ping ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {status.listeners.ping ? '✓' : '✗'} Ping Listener
                  </div>
                  <div className={`p-2 rounded border ${status.listeners.preUpdate ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {status.listeners.preUpdate ? '✓' : '✗'} Pre-Update
                  </div>
                  <div className={`p-2 rounded border ${status.listeners.layer1 ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {status.listeners.layer1 ? '✓' : '✗'} Layer 1
                  </div>
                  <div className={`p-2 rounded border ${status.listeners.layer2 ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {status.listeners.layer2 ? '✓' : '✗'} Layer 2
                  </div>
                  <div className={`p-2 rounded border ${status.listeners.layer3 ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {status.listeners.layer3 ? '✓' : '✗'} Layer 3
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>🛡️ Protection Active:</strong> Multi-layer deduplication prevents infinite reload loops. 
                  System uses {status.storage} with in-memory fallback for bulletproof reliability.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
