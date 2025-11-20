"use client";

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import type { AbuseLogsResponse, AbuseLogEntry } from '@/types/codeGate';
import { Shield, AlertTriangle, Ban, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function LoginAbusePage() {
  const [logs, setLogs] = useState<AbuseLogEntry[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    bannedCount: 0,
    recentAttempts: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAbuseLogs();
  }, [filter]);

  const fetchAbuseLogs = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast.error('You must be logged in to view this page', 'Unauthorized');
        return;
      }

      const token = await user.getIdToken();
      const url = filter === 'all' 
        ? '/api/code-gate/abuse-logs'
        : `/api/code-gate/abuse-logs?eventType=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch abuse logs');
      }

      const data: AbuseLogsResponse = await response.json();
      setLogs(data.logs);
      setStats({
        totalCount: data.totalCount,
        bannedCount: data.bannedCount,
        recentAttempts: data.recentAttempts
      });
    } catch (error) {
      console.error('Failed to fetch abuse logs:', error);
      showToast.error('Failed to load abuse logs', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_attempt':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'banned':
        return <Ban className="w-4 h-4 text-red-600" />;
      case 'code_success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'direct_access_blocked':
        return <Shield className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'failed_attempt':
        return 'bg-yellow-50 border-yellow-200';
      case 'banned':
        return 'bg-red-50 border-red-200';
      case 'code_success':
        return 'bg-green-50 border-green-200';
      case 'direct_access_blocked':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: any) => {
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login Abuse Monitor
          </h1>
          <p className="text-gray-600">
            Track unauthorized access attempts, failed code verifications, and banned users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Events</h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Bans</h3>
              <Ban className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.bannedCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Recent Attempts (24h)</h3>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.recentAttempts}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex gap-2 p-4 overflow-x-auto">
            {['all', 'failed_attempt', 'banned', 'direct_access_blocked', 'code_success'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterType === 'all' ? 'All Events' : formatEventType(filterType)}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-gray-600">Loading abuse logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No events recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitor ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Path/Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className={`${getEventColor(log.eventType)} hover:bg-opacity-70 transition-colors`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getEventIcon(log.eventType)}
                          <span className="text-sm font-medium text-gray-900">
                            {formatEventType(log.eventType)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {log.visitorId.substring(0, 16)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.ipAddress || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.attemptedPath || log.attemptedCode || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchAbuseLogs}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>
      </div>
    </div>
  );
}
