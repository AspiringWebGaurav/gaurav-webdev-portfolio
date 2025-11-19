'use client';

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { showToast } from "@/lib/toast";

import { BubbleSettings as BubbleSettingsType } from '@/types/bubble';

export default function BubbleSettings() {
  const [settings, setSettings] = useState<Partial<BubbleSettingsType>>({
    bubbleText: 'Chat with me!',
    welcomeMessage: 'Hi there! How can I help you today?',
    quickActionsTitle: 'Quick Actions',
    predefinedQuestionsTitle: 'Common Questions',
    tooltipDelay: 500,
    bubbleColor: '#2563eb',
    bubblePosition: 'bottom-right',
    enableTooltip: true,
    chatPlaceholder: 'Type your message...',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/bubble/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/bubble/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showToast.success('Settings saved successfully!');
      } else {
        showToast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Bubble Settings</h2>
        <p className="text-gray-600 text-sm mt-1">
          Customize the appearance and behavior of your chat bubble
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* General Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bubble Text
              </label>
              <input
                type="text"
                value={settings.bubbleText}
                onChange={(e) => setSettings({ ...settings, bubbleText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Message
              </label>
              <textarea
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat Placeholder
              </label>
              <input
                type="text"
                value={settings.chatPlaceholder}
                onChange={(e) => setSettings({ ...settings, chatPlaceholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Section Titles */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Titles</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Actions Title
              </label>
              <input
                type="text"
                value={settings.quickActionsTitle}
                onChange={(e) => setSettings({ ...settings, quickActionsTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Predefined Questions Title
              </label>
              <input
                type="text"
                value={settings.predefinedQuestionsTitle}
                onChange={(e) =>
                  setSettings({ ...settings, predefinedQuestionsTitle: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bubble Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.bubbleColor}
                  onChange={(e) => setSettings({ ...settings, bubbleColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={settings.bubbleColor}
                  onChange={(e) => setSettings({ ...settings, bubbleColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bubble Position
              </label>
              <select
                value={settings.bubblePosition}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bubblePosition: e.target.value as 'bottom-right' | 'bottom-left',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tooltip Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tooltip Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableTooltip}
                onChange={(e) => setSettings({ ...settings, enableTooltip: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Enable Tooltip Notifications
              </label>
            </div>

            {settings.enableTooltip && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tooltip Delay (ms)
                </label>
                <input
                  type="number"
                  value={settings.tooltipDelay}
                  onChange={(e) =>
                    setSettings({ ...settings, tooltipDelay: parseInt(e.target.value) })
                  }
                  min="0"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
