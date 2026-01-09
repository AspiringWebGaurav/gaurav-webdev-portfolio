'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, AlertTriangle, Check, X, Loader2, Clock, User, MessageSquare, Timer, RotateCcw, Heart, Briefcase, Wrench, Plane } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface SuspensionSettings {
  enabled: boolean;
  reason: string;
  estimatedDuration: number | null;
  enabledAt: string | null;
  enabledBy: string | null;
  disabledAt: string | null;
  disabledBy: string | null;
  lastUpdated: string | null;
  autoEndEnabled?: boolean;
  autoEndAt?: string | null;
}

const REASON_PRESETS = [
  { icon: Heart, label: 'Medical', text: 'Temporarily unavailable due to medical reasons. Will return soon.' },
  { icon: User, label: 'Personal', text: 'Taking time off for personal family matters. Thank you for understanding.' },
  { icon: Plane, label: 'Travel', text: 'Currently traveling with limited availability. Services will resume shortly.' },
  { icon: Wrench, label: 'Maintenance', text: 'Performing system maintenance and improvements. Back soon!' },
  { icon: Briefcase, label: 'Business', text: 'Away on business. Portfolio temporarily suspended.' },
  { icon: MessageSquare, label: 'Custom', text: '' },
];

export default function SuspensionControl() {
  const [settings, setSettings] = useState<SuspensionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<number>(5);
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0);
  const [autoEndEnabled, setAutoEndEnabled] = useState(false);
  const [autoEndCountdown, setAutoEndCountdown] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings?.enabled || !settings?.autoEndEnabled || !settings?.autoEndAt) {
      setAutoEndCountdown(null);
      return;
    }

    const updateCountdown = () => {
      try {
        const endTime = new Date(settings.autoEndAt!).getTime();
        const now = Date.now();
        const diff = endTime - now;

        if (diff <= 0) {
          setAutoEndCountdown('Auto-ending...');
          fetch('/api/suspension/status', { cache: 'no-store' })
            .then(() => setTimeout(() => fetchSettingsSilent(), 500))
            .catch(() => setTimeout(() => fetchSettingsSilent(), 1000));
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setAutoEndCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setAutoEndCountdown(`${minutes}m ${seconds}s`);
        } else {
          setAutoEndCountdown(`${seconds}s`);
        }
      } catch (err) {
        console.error('[SuspensionControl] Countdown error:', err);
        setAutoEndCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings?.enabled, settings?.autoEndEnabled, settings?.autoEndAt]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchSettingsInternal();
    } catch (err: any) {
      console.error('[SuspensionControl] Fetch error:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsSilent = async () => {
    try {
      setError(null);
      await fetchSettingsInternal();
    } catch (err) {
      console.error('[SuspensionControl] Silent fetch error:', err);
    }
  };

  const fetchSettingsInternal = async () => {
    const response = await fetch('/api/suspension/status', {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    const data = await response.json();
    
    const safeSettings: SuspensionSettings = {
      enabled: data.enabled ?? false,
      reason: data.reason || '',
      estimatedDuration: data.estimatedDuration ?? null,
      enabledAt: data.enabledAt || null,
      enabledBy: data.enabledBy || null,
      disabledAt: data.disabledAt || null,
      disabledBy: data.disabledBy || null,
      lastUpdated: data.lastUpdated || null,
      autoEndEnabled: data.autoEndEnabled ?? false,
      autoEndAt: data.autoEndAt || null,
    };
    
    setSettings(safeSettings);
    setCustomReason(safeSettings.reason);
    setCharacterCount(safeSettings.reason.length);
    setAutoEndEnabled(safeSettings.autoEndEnabled);
    
    if (safeSettings.estimatedDuration) {
      setEstimatedHours(Math.floor(safeSettings.estimatedDuration / 60));
      setEstimatedMinutes(safeSettings.estimatedDuration % 60);
    } else if (!safeSettings.enabled) {
      setEstimatedHours(0);
      setEstimatedMinutes(0);
      setAutoEndEnabled(false);
    }
    
    const matchedPreset = REASON_PRESETS.findIndex(p => p.text === safeSettings.reason);
    setSelectedPreset(matchedPreset >= 0 ? matchedPreset : 5);
  };

  const handleToggleClick = (newState: boolean) => {
    setPendingAction(newState);
    setShowConfirm(true);
  };

  const handleConfirmToggle = async () => {
    setShowConfirm(false);
    setToggling(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const token = await user.getIdToken();
      const totalMinutes = (estimatedHours * 60) + estimatedMinutes;
      
      const response = await fetch('/api/suspension/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          enabled: pendingAction,
          reason: pendingAction ? (customReason || 'Temporarily suspended due to personal reasons') : undefined,
          estimatedDuration: pendingAction && totalMinutes > 0 ? totalMinutes : null,
          autoEndEnabled: pendingAction && autoEndEnabled && totalMinutes > 0,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Toggle failed');
      }
      
      await fetchSettings();
      
    } catch (err: any) {
      console.error('[SuspensionControl] Toggle error:', err);
      setError(err.message || 'Failed to update suspension status');
      setPendingAction(!pendingAction);
    } finally {
      setToggling(false);
    }
  };

  const handleReasonChange = (value: string) => {
    const trimmed = value.substring(0, 500);
    setCustomReason(trimmed);
    setCharacterCount(trimmed.length);
    setSelectedPreset(5);
  };

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    const preset = REASON_PRESETS[index];
    if (preset.text) {
      setCustomReason(preset.text);
      setCharacterCount(preset.text.length);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(timestamp));
    } catch {
      return 'Invalid date';
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not set';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} minute${mins !== 1 ? 's' : ''}`;
    if (mins === 0) return `${hrs} hour${hrs !== 1 ? 's' : ''}`;
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchSettings}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.enabled ? (
              <>
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
                <div>
                  <p className="text-lg font-bold text-red-600">Services Suspended</p>
                  <p className="text-sm text-gray-600">All visitors seeing suspension page</p>
                </div>
              </>
            ) : (
              <>
                <span className="relative flex h-4 w-4">
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                </span>
                <div>
                  <p className="text-lg font-bold text-green-600">Services Operational</p>
                  <p className="text-sm text-gray-600">Portfolio accessible to all visitors</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {settings?.enabled && settings?.enabledAt && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>Enabled by {settings.enabledBy || 'Admin'} on {formatTimestamp(settings.enabledAt)}</span>
            </div>
          )}
          {!settings?.enabled && settings?.disabledAt && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Disabled by {settings.disabledBy || 'Admin'} on {formatTimestamp(settings.disabledAt)}</span>
              </div>
              {settings.disabledBy === 'System (Auto-End)' && (
                <div className="mt-2 flex items-start gap-2 text-xs text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                  <RotateCcw className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Automatically ended by system</div>
                    {settings.estimatedDuration && (
                      <div className="text-green-600 mt-0.5">
                        Duration: {formatDuration(settings.estimatedDuration)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {settings?.enabled && settings?.autoEndEnabled && autoEndCountdown && (
          <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 rounded-xl border-2 border-orange-300 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Timer className="w-5 h-5 text-orange-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                </div>
                <span className="text-sm font-bold text-orange-900">AUTO-END COUNTDOWN</span>
              </div>
              <span className="text-2xl font-bold font-mono text-orange-700 bg-white px-3 py-1 rounded-lg border border-orange-300 shadow-sm">{autoEndCountdown}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Scheduled end: {formatTimestamp(settings.autoEndAt)}
              </span>
              <span className="text-orange-700 font-semibold bg-orange-100 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>
          </div>
        )}
        
        {/* Warning when auto-end is enabled but countdown not visible yet */}
        {settings?.enabled && settings?.autoEndEnabled && !autoEndCountdown && settings?.autoEndAt && (
          <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">Auto-End Scheduled</p>
                <p className="text-xs text-orange-700 mt-1">
                  Will automatically end at: {formatTimestamp(settings.autoEndAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!settings?.enabled && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Quick Reason Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {REASON_PRESETS.map((preset, index) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === index;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetSelect(index)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Suspension Reason {selectedPreset === 5 && '(Custom)'}
            </label>
            <textarea
              value={customReason}
              onChange={(e) => handleReasonChange(e.target.value)}
              placeholder="Enter custom suspension reason..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-400 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                This message will be displayed to visitors on the suspension page
              </p>
              <p className="text-xs text-gray-500">
                {characterCount}/500
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <label className="text-sm font-semibold text-gray-900">
                  Expected Duration
                </label>
              </div>
              {(estimatedHours > 0 || estimatedMinutes > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setEstimatedHours(0);
                    setEstimatedMinutes(0);
                  }}
                  className="h-7 px-2.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-all flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 py-2 mb-3">
              <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm">
                <button
                  type="button"
                  onClick={() => setEstimatedHours(Math.max(0, estimatedHours - 1))}
                  className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-700 transition-all border-r border-gray-200 font-medium text-xl"
                >
                  −
                </button>
                <div className="flex flex-col items-center px-3 min-w-[50px]">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={estimatedHours}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEstimatedHours(Math.max(0, Math.min(72, val)));
                    }}
                    className="w-full h-6 text-center text-base font-bold text-gray-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[11px] text-gray-500 font-medium">HOURS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEstimatedHours(Math.min(72, estimatedHours + 1))}
                  className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-700 transition-all border-l border-gray-200 font-medium text-xl"
                >
                  +
                </button>
              </div>

              <span className="text-2xl text-gray-400 font-bold">:</span>

              <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm">
                <button
                  type="button"
                  onClick={() => setEstimatedMinutes(Math.max(0, estimatedMinutes - 1))}
                  className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-700 transition-all border-r border-gray-200 font-medium text-xl"
                >
                  −
                </button>
                <div className="flex flex-col items-center px-3 min-w-[50px]">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={estimatedMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEstimatedMinutes(Math.max(0, Math.min(59, val)));
                    }}
                    className="w-full h-6 text-center text-base font-bold text-gray-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[11px] text-gray-500 font-medium">MINS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEstimatedMinutes(Math.min(59, estimatedMinutes + 1))}
                  className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-700 transition-all border-l border-gray-200 font-medium text-xl"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-white rounded-lg p-2 border border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-500 font-semibold w-10 shrink-0">MIN</span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {[5, 10, 15, 30, 45].map((mins) => {
                    const isSelected = estimatedHours === 0 && estimatedMinutes === mins;
                    return (
                      <button
                        key={`m-${mins}`}
                        type="button"
                        onClick={() => {
                          setEstimatedHours(0);
                          setEstimatedMinutes(mins);
                        }}
                        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                          isSelected ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 hover:bg-red-100'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-500 font-semibold w-10 shrink-0">HRS</span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {[1, 2, 4, 8, 12, 24, 48].map((hrs) => {
                    const isSelected = estimatedHours === hrs && estimatedMinutes === 0;
                    return (
                      <button
                        key={`h-${hrs}`}
                        type="button"
                        onClick={() => {
                          setEstimatedHours(hrs);
                          setEstimatedMinutes(0);
                        }}
                        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                          isSelected ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 hover:bg-red-100'
                        }`}
                      >
                        {hrs}h
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Shows countdown to visitors. Leave at 0:00 for no timer.
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-orange-600" />
                <label className="text-sm font-medium text-gray-900">
                  Auto-End Suspension
                </label>
              </div>
              <button
                type="button"
                onClick={() => setAutoEndEnabled(!autoEndEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoEndEnabled ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoEndEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-2">
              {autoEndEnabled
                ? '✅ Suspension will automatically end after the set duration.'
                : 'When enabled, suspension mode will automatically turn off after the set duration.'}
            </p>

            {autoEndEnabled && (estimatedHours > 0 || estimatedMinutes > 0) && (
              <div className="p-2 bg-orange-100 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-800 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" />
                  Will auto-end at:{' '}
                  {new Date(Date.now() + ((estimatedHours * 60 + estimatedMinutes) * 60 * 1000)).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {autoEndEnabled && estimatedHours === 0 && estimatedMinutes === 0 && (
              <div className="p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Set a duration above for auto-end to work.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {settings?.enabled && (
        <div className="p-5 bg-white rounded-xl border-2 border-red-200 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-600" />
            Active Suspension Details
          </h4>
          
          <div className="space-y-3">
            {settings.reason && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Reason:</p>
                <p className="text-sm text-gray-800 leading-relaxed">{settings.reason}</p>
              </div>
            )}
            
            {settings.estimatedDuration && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expected Duration:
                </p>
                <p className="text-sm font-bold text-blue-800">{formatDuration(settings.estimatedDuration)}</p>
              </div>
            )}
            
            {settings.autoEndEnabled && (
              <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">Auto-End Active</span>
                  </div>
                  <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-[10px] font-bold rounded-full uppercase">
                    Enabled
                  </span>
                </div>
                {settings.autoEndAt && autoEndCountdown && (
                  <div className="mt-2 pt-2 border-t border-orange-200">
                    <p className="text-xs text-orange-700 mb-1.5">Time Remaining:</p>
                    <p className="text-xl font-bold font-mono text-orange-800 bg-white px-3 py-1.5 rounded-md border border-orange-300">{autoEndCountdown}</p>
                    <p className="text-[10px] text-orange-600 mt-1.5">Will end at: {formatTimestamp(settings.autoEndAt)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-2">
        {settings?.enabled ? (
          <button
            onClick={() => handleToggleClick(false)}
            disabled={toggling}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {toggling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Disable Suspension & Restore Services
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => handleToggleClick(true)}
            disabled={toggling}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {toggling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <AlertOctagon className="w-5 h-5" />
                Enable Suspension Mode
              </>
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${pendingAction ? 'bg-red-100' : 'bg-green-100'}`}>
                  <AlertTriangle className={`w-6 h-6 ${pendingAction ? 'text-red-600' : 'text-green-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {pendingAction ? 'Enable Suspension?' : 'Disable Suspension?'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pendingAction 
                      ? 'All visitors will be redirected to the suspension page. Admin dashboard will remain accessible.'
                      : 'Services will be restored and visitors can access your portfolio normally.'
                    }
                  </p>
                  {pendingAction && autoEndEnabled && (estimatedHours > 0 || estimatedMinutes > 0) && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      ⏱️ Will auto-end in {formatDuration((estimatedHours * 60) + estimatedMinutes)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmToggle}
                  className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors ${
                    pendingAction
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
