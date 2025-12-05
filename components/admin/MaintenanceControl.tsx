/**
 * Maintenance Control Panel
 * 
 * Admin component to toggle maintenance mode.
 * Shows current status, toggle switch, estimated duration, and last action info.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Power, AlertTriangle, Check, X, Loader2, Clock, User, Timer, MessageCircle, FileText, HelpCircle, Download } from 'lucide-react';
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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
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
        bubbleSettings: data.bubbleSettings,
      });
      setCustomMessage(data.message || '');
      
      // Set estimated duration from settings if available
      if (data.estimatedDuration) {
        setEstimatedHours(Math.floor(data.estimatedDuration / 60));
        setEstimatedMinutes(data.estimatedDuration % 60);
      }
      
      // Set bubble settings from data if available
      if (data.bubbleSettings) {
        setBubbleSettings(data.bubbleSettings);
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
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-4 h-4 text-purple-600" />
          <label className="text-sm font-medium text-gray-700">
            Estimated Duration
          </label>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="72"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Math.max(0, Math.min(72, parseInt(e.target.value) || 0)))}
              className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">hours</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="59"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">minutes</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This will show a countdown timer to visitors. Leave at 0 for no countdown.
        </p>
        {settings?.enabled && settings?.estimatedDuration && (
          <div className="mt-2 text-xs text-purple-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Current: {formatDuration(settings.estimatedDuration)}
          </div>
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
