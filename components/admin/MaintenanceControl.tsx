/**
 * Maintenance Control Panel
 * 
 * Admin component to toggle maintenance mode.
 * Shows current status, toggle switch, estimated duration, and last action info.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Power, AlertTriangle, Check, X, Loader2, Clock, User, Timer, MessageCircle, FileText, HelpCircle, Download, RotateCcw } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface BubbleSettings {
  hideBubbleCompletely: boolean;
  allowResumeView: boolean;
  allowResumeDownload: boolean;
  allowAskDirect: boolean;
  allowPredefinedQuestions: boolean;
  disabledMessage: string;
}

interface MaintenanceSettings {
  enabled: boolean;
  title: string;
  message: string;
  showContactForm: boolean;
  enabledAt: string | null;
  enabledBy: string | null;
  disabledAt: string | null;
  disabledBy: string | null;
  estimatedDuration: number | null; // in minutes
  autoEndEnabled: boolean;
  autoEndAt: string | null;
  bubbleSettings?: BubbleSettings;
}

export default function MaintenanceControl() {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [autoEndEnabled, setAutoEndEnabled] = useState(false);
  const [autoEndCountdown, setAutoEndCountdown] = useState<string | null>(null);
  
  // Bubble settings for maintenance mode
  const [bubbleSettings, setBubbleSettings] = useState<BubbleSettings>({
    hideBubbleCompletely: false,
    allowResumeView: true,
    allowResumeDownload: true,
    allowAskDirect: false,
    allowPredefinedQuestions: true,
    disabledMessage: 'Disabled by admin due to maintenance',
  });

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Countdown timer for auto-end
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
          // Trigger the status API to perform auto-disable, then refresh
          // This ensures the auto-disable actually happens
          fetch('/api/maintenance/status', { cache: 'no-store' })
            .then(() => {
              // Small delay then refresh settings without showing loading spinner
              setTimeout(() => fetchSettingsSilent(), 500);
            })
            .catch(() => {
              setTimeout(() => fetchSettingsSilent(), 1000);
            });
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
        setAutoEndCountdown(null);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [settings?.enabled, settings?.autoEndEnabled, settings?.autoEndAt]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchSettingsInternal();
    } finally {
      setLoading(false);
    }
  };

  // Silent fetch - doesn't show loading spinner (used for auto-refresh)
  const fetchSettingsSilent = async () => {
    try {
      setError(null);
      await fetchSettingsInternal();
    } catch (err) {
      // Silent fail
    }
  };

  const fetchSettingsInternal = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Not authenticated');
        return;
      }
      
      const token = await user.getIdToken();
      const response = await fetch('/api/maintenance/toggle', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings({
        enabled: data.enabled,
        title: data.title,
        message: data.message,
        showContactForm: data.showContactForm,
        enabledAt: data.enabledAt,
        enabledBy: data.enabledBy,
        disabledAt: data.disabledAt,
        disabledBy: data.disabledBy,
        estimatedDuration: data.estimatedDuration,
        autoEndEnabled: data.autoEndEnabled ?? false,
        autoEndAt: data.autoEndAt,
        bubbleSettings: data.bubbleSettings,
      });
      setCustomMessage(data.message || '');
      setAutoEndEnabled(data.autoEndEnabled ?? false);
      
      // Set estimated duration from settings if available
      if (data.estimatedDuration) {
        setEstimatedHours(Math.floor(data.estimatedDuration / 60));
        setEstimatedMinutes(data.estimatedDuration % 60);
      } else {
        // Reset to defaults when maintenance is off
        if (!data.enabled) {
          setEstimatedHours(0);
          setEstimatedMinutes(30);
          setAutoEndEnabled(false);
        }
      }
      
      // Set bubble settings from data if available
      if (data.bubbleSettings) {
        setBubbleSettings(data.bubbleSettings);
      } else if (!data.enabled) {
        // Reset bubble settings when maintenance is off
        setBubbleSettings({
          hideBubbleCompletely: false,
          allowResumeView: true,
          allowResumeDownload: true,
          allowAskDirect: false,
          allowPredefinedQuestions: true,
          disabledMessage: 'Disabled by admin due to maintenance',
        });
      }
      
    } catch (err: any) {
      console.error('Failed to fetch maintenance settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
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
      
      // Calculate total minutes
      const totalMinutes = (estimatedHours * 60) + estimatedMinutes;
      
      const response = await fetch('/api/maintenance/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          enabled: pendingAction,
          message: customMessage || undefined,
          estimatedDuration: pendingAction && totalMinutes > 0 ? totalMinutes : undefined,
          autoEndEnabled: pendingAction && autoEndEnabled && totalMinutes > 0,
          bubbleSettings: pendingAction ? bubbleSettings : undefined,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Toggle failed');
      }
      
      // Refresh settings after successful toggle
      await fetchSettings();
      
    } catch (err: any) {
      console.error('Failed to toggle maintenance:', err);
      setError(err.message || 'Failed to toggle maintenance mode');
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not set';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} minute${mins !== 1 ? 's' : ''}`;
    if (mins === 0) return `${hrs} hour${hrs !== 1 ? 's' : ''}`;
    return `${hrs}h ${mins}m`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Error state
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
      {/* Status Card */}
      <div className={`p-5 rounded-xl border-2 transition-all ${
        settings?.enabled 
          ? 'bg-red-50 border-red-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              settings?.enabled ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {settings?.enabled ? (
                <Wrench className="w-6 h-6 text-red-600" />
              ) : (
                <Check className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Maintenance Mode
              </h4>
              <p className={`text-sm ${settings?.enabled ? 'text-red-600' : 'text-green-600'}`}>
                {settings?.enabled ? '🔧 Currently ENABLED' : '✅ Currently DISABLED'}
              </p>
              {/* Show auto-end history when disabled by system */}
              {!settings?.enabled && settings.disabledBy === 'System (Auto-End)' && settings.disabledAt && (
                <div className="mt-2 flex items-start gap-2 text-xs text-green-700 bg-green-100 px-2 py-1.5 rounded">
                  <RotateCcw className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Auto-ended by System</div>
                    <div className="text-green-600">
                      {formatDate(settings.disabledAt)}
                      {settings.estimatedDuration && (
                        <span className="ml-1">
                          ({formatDuration(settings.estimatedDuration)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => handleToggleClick(!settings?.enabled)}
            disabled={toggling}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              settings?.enabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {settings?.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Estimated Duration Editor */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
        {/* Header with Title and Clear */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-purple-600" />
            <label className="text-sm font-semibold text-gray-800">
              Estimated Duration
            </label>
          </div>
          {/* Clear button */}
          {(estimatedHours > 0 || estimatedMinutes > 0) ? (
            <button
              type="button"
              onClick={() => {
                setEstimatedHours(0);
                setEstimatedMinutes(0);
              }}
              className="h-7 px-2.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-all flex items-center gap-1 shadow-sm"
              title="Clear duration"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">No duration set</span>
          )}
        </div>
        
        {/* Time Input Section */}
        <div className="flex items-center justify-center gap-4 py-1.5 mb-2">
          {/* Hours Input Group */}
          <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setEstimatedHours(Math.max(0, estimatedHours - 1))}
              className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-700 active:bg-purple-200 transition-all border-r border-gray-200 font-medium text-xl"
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
              <span className="text-[11px] text-gray-500 font-medium -mt-0.5">HOURS</span>
            </div>
            <button
              type="button"
              onClick={() => setEstimatedHours(Math.min(72, estimatedHours + 1))}
              className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-700 active:bg-purple-200 transition-all border-l border-gray-200 font-medium text-xl"
            >
              +
            </button>
          </div>
          
          <span className="text-2xl text-gray-400 font-bold">:</span>
          
          {/* Minutes Input Group */}
          <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setEstimatedMinutes(Math.max(0, estimatedMinutes - 1))}
              className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-700 active:bg-purple-200 transition-all border-r border-gray-200 font-medium text-xl"
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
              <span className="text-[11px] text-gray-500 font-medium -mt-0.5">MINS</span>
            </div>
            <button
              type="button"
              onClick={() => setEstimatedMinutes(Math.min(59, estimatedMinutes + 1))}
              className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-700 active:bg-purple-200 transition-all border-l border-gray-200 font-medium text-xl"
            >
              +
            </button>
          </div>
        </div>
        
        {/* Quick Shortcuts */}
        <div className="space-y-1.5 bg-white rounded-lg p-2 border border-gray-200">
          {/* Minutes Row */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-500 font-semibold w-10 shrink-0">MIN</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {[1, 2, 3, 5, 8, 10, 15, 20, 30, 45].map((mins) => {
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
                      isSelected
                        ? 'bg-purple-600 shadow-md'
                        : 'bg-gray-100 hover:bg-purple-100'
                    }`}
                    style={{ color: isSelected ? 'white' : 'black' }}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Hours Row */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-500 font-semibold w-10 shrink-0">HRS</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {[1, 2, 3, 4, 5, 6, 8, 12, 24, 48].map((hrs) => {
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
                      isSelected
                        ? 'bg-purple-600 shadow-md'
                        : 'bg-gray-100 hover:bg-purple-100'
                    }`}
                    style={{ color: isSelected ? 'white' : 'black' }}
                  >
                    {hrs}h
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Shows countdown to visitors. Leave at 0 for no timer.
          </p>
          {settings?.enabled && settings?.estimatedDuration && (
            <div className="text-xs text-purple-600 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              Active: {formatDuration(settings.estimatedDuration)}
            </div>
          )}
        </div>
      </div>

      {/* Auto-End Maintenance Toggle */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <label className="text-sm font-medium text-gray-700">
              Auto-End Maintenance
            </label>
          </div>
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => setAutoEndEnabled(!autoEndEnabled)}
            disabled={settings?.enabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              autoEndEnabled ? 'bg-blue-600' : 'bg-gray-300'
            } ${settings?.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoEndEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <p className="text-xs text-gray-600 mb-3">
          {autoEndEnabled 
            ? '✅ Maintenance will automatically end after the estimated duration.'
            : 'When enabled, maintenance mode will automatically turn off after the set duration.'}
        </p>
        
        {/* Show calculated auto-end time when toggle is ON and duration is set */}
        {autoEndEnabled && (estimatedHours > 0 || estimatedMinutes > 0) && !settings?.enabled && (
          <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Will auto-end at: {new Date(Date.now() + ((estimatedHours * 60 + estimatedMinutes) * 60 * 1000)).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
        
        {/* Show warning if no duration set */}
        {autoEndEnabled && estimatedHours === 0 && estimatedMinutes === 0 && (
          <div className="p-2 bg-yellow-100 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Set an estimated duration above for auto-end to work.
            </p>
          </div>
        )}
        
        {/* Show current auto-end status when maintenance is active */}
        {settings?.enabled && settings?.autoEndEnabled && settings?.autoEndAt && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-200">
            <p className="text-xs text-green-800 font-medium mb-1 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Auto-End Active
            </p>
            <p className="text-xs text-green-700">
              Scheduled: {new Date(settings.autoEndAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {autoEndCountdown && (
              <p className="text-sm text-green-800 font-semibold mt-1 flex items-center gap-1">
                <Timer className="w-4 h-4" />
                Remaining: {autoEndCountdown}
              </p>
            )}
          </div>
        )}
        
        {/* Show when maintenance is active but auto-end is not enabled */}
        {settings?.enabled && !settings?.autoEndEnabled && (
          <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <X className="w-3 h-3" />
              Auto-end not enabled. Maintenance must be disabled manually.
            </p>
          </div>
        )}
        
        {settings?.enabled && (
          <p className="text-xs text-gray-500 mt-2 italic">
            Toggle is disabled while maintenance is active. Disable maintenance first to change this setting.
          </p>
        )}
      </div>

      {/* Custom Message Editor */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maintenance Message
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="We're performing scheduled maintenance. Please check back soon!"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          This message will be shown to visitors on the maintenance page.
        </p>
      </div>

      {/* Chat Bubble Settings During Maintenance */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-purple-600" />
          <h4 className="text-sm font-medium text-gray-700">
            Chat Bubble Settings During Maintenance
          </h4>
        </div>
        
        {/* Hide Bubble Completely - Master Toggle */}
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setBubbleSettings(prev => ({ ...prev, hideBubbleCompletely: !prev.hideBubbleCompletely }))}
              className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center cursor-pointer ${
                bubbleSettings.hideBubbleCompletely 
                  ? 'border-red-600 bg-white shadow-sm' 
                  : 'border-gray-400 bg-white hover:border-gray-500'
              }`}
            >
              {bubbleSettings.hideBubbleCompletely && <Check className="w-4 h-4 text-red-600 stroke-[3]" />}
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Hide Chat Bubble Completely</span>
            </div>
          </label>
          <p className="text-xs text-red-600 mt-2 ml-8">When enabled, the bubble won&apos;t appear on the maintenance page at all.</p>
        </div>
        
        <div className={`space-y-3 ${bubbleSettings.hideBubbleCompletely ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Allow Resume View */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setBubbleSettings(prev => ({ ...prev, allowResumeView: !prev.allowResumeView }))}
              className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center cursor-pointer ${
                bubbleSettings.allowResumeView 
                  ? 'border-purple-600 bg-white shadow-sm' 
                  : 'border-gray-400 bg-white hover:border-gray-500'
              }`}
            >
              {bubbleSettings.allowResumeView && <Check className="w-4 h-4 text-purple-600 stroke-[3]" />}
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Allow Resume View</span>
            </div>
          </label>

          {/* Allow Resume Download */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setBubbleSettings(prev => ({ ...prev, allowResumeDownload: !prev.allowResumeDownload }))}
              className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center cursor-pointer ${
                bubbleSettings.allowResumeDownload 
                  ? 'border-purple-600 bg-white shadow-sm' 
                  : 'border-gray-400 bg-white hover:border-gray-500'
              }`}
            >
              {bubbleSettings.allowResumeDownload && <Check className="w-4 h-4 text-purple-600 stroke-[3]" />}
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Allow Resume Download</span>
            </div>
          </label>

          {/* Allow Ask Direct */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setBubbleSettings(prev => ({ ...prev, allowAskDirect: !prev.allowAskDirect }))}
              className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center cursor-pointer ${
                bubbleSettings.allowAskDirect 
                  ? 'border-purple-600 bg-white shadow-sm' 
                  : 'border-gray-400 bg-white hover:border-gray-500'
              }`}
            >
              {bubbleSettings.allowAskDirect && <Check className="w-4 h-4 text-purple-600 stroke-[3]" />}
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Allow Ask Me Direct (Chat)</span>
            </div>
          </label>

          {/* Allow Predefined Questions */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setBubbleSettings(prev => ({ ...prev, allowPredefinedQuestions: !prev.allowPredefinedQuestions }))}
              className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center cursor-pointer ${
                bubbleSettings.allowPredefinedQuestions 
                  ? 'border-purple-600 bg-white shadow-sm' 
                  : 'border-gray-400 bg-white hover:border-gray-500'
              }`}
            >
              {bubbleSettings.allowPredefinedQuestions && <Check className="w-4 h-4 text-purple-600 stroke-[3]" />}
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Allow Predefined Questions</span>
            </div>
          </label>
        </div>

        {/* Disabled Message */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Disabled Feature Message
          </label>
          <input
            type="text"
            value={bubbleSettings.disabledMessage}
            onChange={(e) => setBubbleSettings(prev => ({ ...prev, disabledMessage: e.target.value }))}
            placeholder="Disabled by admin due to maintenance"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Message shown when visitors try to use disabled features.
          </p>
        </div>
        
        {/* Current Status */}
        {settings?.enabled && settings?.bubbleSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Current Bubble Settings:</p>
            <div className="flex flex-wrap gap-2">
              {settings.bubbleSettings.hideBubbleCompletely ? (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                  Bubble Hidden Completely
                </span>
              ) : (
                <>
                  <span className={`text-xs px-2 py-1 rounded-full ${settings.bubbleSettings.allowResumeView ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Resume View: {settings.bubbleSettings.allowResumeView ? 'On' : 'Off'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${settings.bubbleSettings.allowResumeDownload ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Download: {settings.bubbleSettings.allowResumeDownload ? 'On' : 'Off'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${settings.bubbleSettings.allowAskDirect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Ask Direct: {settings.bubbleSettings.allowAskDirect ? 'On' : 'Off'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${settings.bubbleSettings.allowPredefinedQuestions ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Predefined Q: {settings.bubbleSettings.allowPredefinedQuestions ? 'On' : 'Off'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Last Action Info */}
      {(settings?.enabledAt || settings?.disabledAt) && (
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Last Activity</h5>
          <div className="space-y-2 text-sm">
            {settings?.enabled ? (
              <>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Enabled: {formatDate(settings.enabledAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>By: {settings.enabledBy || 'Unknown'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Disabled: {formatDate(settings.disabledAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>By: {settings.disabledBy || 'Unknown'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  pendingAction ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    pendingAction ? 'text-red-600' : 'text-green-600'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {pendingAction ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                {pendingAction 
                  ? 'This will redirect all visitors to the maintenance page. Only admin pages will remain accessible.'
                  : 'This will restore normal access to the portfolio for all visitors.'}
              </p>
              
              {pendingAction && (estimatedHours > 0 || estimatedMinutes > 0) && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 text-sm">
                    <Timer className="w-4 h-4" />
                    <span>Estimated duration: {formatDuration((estimatedHours * 60) + estimatedMinutes)}</span>
                  </div>
                </div>
              )}
              
              {/* Auto-End Information in Confirmation Modal */}
              {pendingAction && autoEndEnabled && (estimatedHours > 0 || estimatedMinutes > 0) && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 text-sm mb-1">
                    <RotateCcw className="w-4 h-4" />
                    <span className="font-medium">Auto-End Enabled</span>
                  </div>
                  <p className="text-xs text-green-600 ml-6">
                    Maintenance will automatically end at:{' '}
                    <span className="font-semibold">
                      {new Date(Date.now() + ((estimatedHours * 60 + estimatedMinutes) * 60 * 1000)).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>
              )}
              
              {pendingAction && !autoEndEnabled && (
                <div className="mb-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Auto-end is OFF. You&apos;ll need to manually disable maintenance.
                  </p>
                </div>
              )}
              
              {pendingAction && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm mb-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">Chat Bubble Settings:</span>
                  </div>
                  {bubbleSettings.hideBubbleCompletely ? (
                    <div className="ml-6 p-2 bg-red-100 rounded border border-red-200">
                      <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Chat Bubble Completely Hidden
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-blue-600 space-y-1 ml-6">
                      <p>• Resume View: {bubbleSettings.allowResumeView ? '✓ Enabled' : '✗ Disabled'}</p>
                      <p>• Resume Download: {bubbleSettings.allowResumeDownload ? '✓ Enabled' : '✗ Disabled'}</p>
                      <p>• Ask Direct Chat: {bubbleSettings.allowAskDirect ? '✓ Enabled' : '✗ Disabled'}</p>
                      <p>• Predefined Questions: {bubbleSettings.allowPredefinedQuestions ? '✓ Enabled' : '✗ Disabled'}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmToggle}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    pendingAction 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {pendingAction ? 'Enable Maintenance' : 'Disable Maintenance'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
