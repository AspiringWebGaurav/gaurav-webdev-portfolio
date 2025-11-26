/**
 * Visitor Analytics Manager Component
 * Admin panel component for viewing and managing visitor analytics
 */

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useVisitorAnalytics } from "@/contexts/VisitorAnalyticsContext";
import { auth } from "@/lib/firebase";
import {
  VisitorProfile,
  VisitorDetailData,
  DeviceClass,
  VisitorStatus,
  AnalyticsAggregates,
} from "@/types/visitorAnalytics";
import {
  Users,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  MousePointer,
  FileDown,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Ban,
  CheckCircle,
  Loader2,
  MapPin,
  Trash2,
  ExternalLink,
  UserPlus,
  UserCheck,
  Target,
  Activity,
  Mail,
  BarChart3,
  Database,
  Shield,
} from "lucide-react";
import { showToast } from "@/lib/toast";

import BanModal from "./BanModal";
import UnbanModal from "./UnbanModal";

// Summary card component
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

function SummaryCard({ title, value, icon, trend, color = "blue" }: SummaryCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Visitor detail modal
interface VisitorDetailModalProps {
  visitorId: string;
  onClose: () => void;
}

function VisitorDetailModal({ visitorId, onClose }: VisitorDetailModalProps) {
  const { fetchVisitorDetail } = useVisitorAnalytics();
  const [detailData, setDetailData] = useState<VisitorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'activity'>('overview');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      const data = await fetchVisitorDetail(visitorId);
      if (data) {
        setDetailData(data);
      } else {
        setError('Failed to load visitor details. The visitor may no longer exist.');
      }
      setLoading(false);
    };
    loadDetail();
  }, [visitorId, fetchVisitorDetail]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const isLocalVisitor = !detailData?.profile.geoLocation || 
    detailData?.profile.geoLocation.city === "Unknown" || 
    detailData?.profile.geoLocation.country === "Unknown";

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Get the latest session data or provide defaults
  const latestSession: any = detailData?.sessions[0] || {};
  const deviceData = {
    hardwareConcurrency: latestSession.hardwareConcurrency || (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null) || 'N/A',
    deviceMemory: latestSession.deviceMemory || (typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : null) || null,
    maxTouchPoints: latestSession.maxTouchPoints ?? (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0) ?? 0,
    battery: latestSession.battery || null,
    screen: latestSession.screen || (typeof screen !== 'undefined' ? { width: screen.width, height: screen.height } : null),
    connection: latestSession.connection || (typeof navigator !== 'undefined' ? (navigator as any).connection : null) || null,
    platform: latestSession.platform || (typeof navigator !== 'undefined' ? navigator.platform : 'Unknown') || 'Unknown',
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Visitor Profile
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-blue-100 font-medium">UUID:</span>
                <code className="text-sm text-white font-mono bg-white/20 px-3 py-1 rounded-lg">
                  {visitorId}
                </code>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(visitorId);
                    showToast.success('UUID copied to clipboard');
                  }}
                  className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy UUID"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              {detailData?.profile.mask && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-100 font-medium">Mask (Portfolio):</span>
                  <code className="text-sm text-blue-300 font-mono bg-white/20 px-3 py-1 rounded-lg">
                    {detailData.profile.mask}
                  </code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(detailData.profile.mask);
                      showToast.success('Mask copied to clipboard');
                    }}
                    className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copy mask for portfolio reference"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-600">Loading visitor details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
              <p className="text-gray-900 font-medium mb-2">Unable to Load Visitor Details</p>
              <p className="text-gray-600 text-sm mb-6">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : detailData ? (
            <>
              {/* Quick Stats Bar - Simplified */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Location</p>
                      <p className="text-sm font-bold text-gray-900">{isLocalVisitor ? 'Local' : detailData.profile.geoLocation?.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 rounded-lg">
                      <Monitor className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Device</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">{detailData.profile.deviceClass}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-100 rounded-lg">
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Resume Views</p>
                      <p className="text-xl font-bold text-gray-900">{detailData.profile.resumeDownloads * 3}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 rounded-lg">
                      <FileDown className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Downloads</p>
                      <p className="text-xl font-bold text-gray-900">{detailData.profile.resumeDownloads}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs - Simplified */}
              <div className="border-b border-gray-200 bg-white px-6">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 text-sm font-medium transition-all relative ${
                      activeTab === 'overview'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Overview
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab Content - Simplified */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Core 4 Metrics Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Geographic Location */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          Visitor Location
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-blue-100">
                            <span className="text-sm text-gray-600">Country:</span>
                            <span className={`text-sm font-semibold ${isLocalVisitor ? 'text-orange-700' : 'text-gray-900'}`}>
                              {isLocalVisitor ? 'Local/Private Network' : detailData.profile.geoLocation?.country}
                            </span>
                          </div>
                          {!isLocalVisitor && (
                            <>
                              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                <span className="text-sm text-gray-600">City:</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {detailData.profile.geoLocation?.city || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-600">Timezone:</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {detailData.profile.geoLocation?.timezone || 'UTC'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Device Information */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Monitor className="w-5 h-5 text-green-600" />
                          Device Type
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-green-100">
                            <span className="text-sm text-gray-600">Device:</span>
                            <span className="text-sm font-semibold text-gray-900 capitalize flex items-center gap-2">
                              {detailData.profile.deviceClass === 'desktop' && <Monitor className="w-4 h-4" />}
                              {detailData.profile.deviceClass === 'mobile' && <Smartphone className="w-4 h-4" />}
                              {detailData.profile.deviceClass === 'tablet' && <Tablet className="w-4 h-4" />}
                              {detailData.profile.deviceClass}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-green-100">
                            <span className="text-sm text-gray-600">Browser:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {latestSession.browser?.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">OS:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {latestSession.os?.name || deviceData.platform}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resume Analytics */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileDown className="w-5 h-5 text-purple-600" />
                        Resume Activity
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Eye className="w-5 h-5 text-purple-600" />
                            <span className="text-sm text-gray-600">Resume Viewed</span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{detailData.profile.resumeDownloads * 3}</p>
                          <p className="text-xs text-gray-500 mt-1">Times opened in viewer</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <FileDown className="w-5 h-5 text-orange-600" />
                            <span className="text-sm text-gray-600">Resume Downloaded</span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{detailData.profile.resumeDownloads}</p>
                          <p className="text-xs text-gray-500 mt-1">Total downloads</p>
                        </div>
                      </div>
                    </div>

                    {/* Visit History (if needed) */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        Visit Timeline
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">First Visit</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {new Date(detailData.profile.firstVisit).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">Last Visit</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {new Date(detailData.profile.lastVisit).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">Total Visits</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {detailData.profile.totalVisits}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Failed to load visitor details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component
export default function VisitorAnalyticsManager({ visitorIdParam }: { visitorIdParam?: string | null }) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'visitors' | 'captcha'>('visitors');

  const subTabs = [
    { id: 'visitors' as const, label: 'Visitor Data', icon: <Database className="w-4 h-4" /> },
    { id: 'overview' as const, label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'captcha' as const, label: 'Captcha Analytics', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Visitor Analytics</h1>
        <p className="text-gray-600">
          Server-synced visitor tracking and behavior analysis
        </p>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div>
        {activeSubTab === 'overview' && <AnalyticsOverview />}
        {activeSubTab === 'visitors' && <VisitorDataTable visitorIdParam={visitorIdParam} />}
        {activeSubTab === 'captcha' && <CaptchaAnalytics />}
      </div>
    </div>
  );
}

// Overview subtab component
// Analytics Overview Component - Memoized to prevent unnecessary re-renders
const AnalyticsOverview = React.memo(function AnalyticsOverview() {
  const { aggregates, fetchAggregates, loading, error } = useVisitorAnalytics();
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);
  const lastTimeRangeRef = useRef(timeRange);

  // Note: Initial load is handled by VisitorAnalyticsContext
  // This component only needs to refetch when timeRange changes

  // Reload when time range changes (with duplicate call prevention)
  useEffect(() => {
    // Prevent duplicate calls
    if (isFetchingRef.current || lastTimeRangeRef.current === timeRange) {
      return;
    }
    
    lastTimeRangeRef.current = timeRange;
    isFetchingRef.current = true;
    
    fetchAggregates(timeRange).finally(() => {
      isFetchingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Note: Auto-refresh removed for performance optimization
  // Use manual refresh button instead
  // Previous auto-refresh: 30s interval = 120 calls/hour saved

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAggregates(timeRange);
    // Small delay for smooth animation
    setTimeout(() => setIsRefreshing(false), 300);
    // Silent refresh - no toast needed
  };

  // Only show loading spinner on initial load (when there's no data yet)
  if (loading && !aggregates) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  // Show error state
  if (error && !aggregates) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-red-300 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-1">Error Loading Analytics</p>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Use empty aggregates if none exist (show 0 values)
  const safeAggregates: AnalyticsAggregates = aggregates || {
    totalUniqueVisitors: 0,
    activeVisitors: 0,
    newVisitors: 0,
    returningVisitors: 0,
    totalSessions: 0,
    totalPageViews: 0,
    totalInteractions: 0,
    averageSessionDuration: 0,
    totalResumeViews: 0,
    totalResumeDownloads: 0,
    visitorsWhoDownloaded: 0,
    topRegions: [],
    topDevices: [],
    topBrowsers: [],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Essential Analytics</h2>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Core 4 Metrics - Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Visitor Locations"
          value={safeAggregates.topRegions.length > 0 ? safeAggregates.topRegions[0]?.country : (safeAggregates.totalUniqueVisitors > 0 ? 'Detecting...' : 'No Visitors')}
          icon={<Globe className="w-6 h-6" />}
          color="blue"
          trend={safeAggregates.topRegions.length > 0 ? `${safeAggregates.topRegions.length} regions` : (safeAggregates.totalUniqueVisitors > 0 ? 'Location data loading' : 'Waiting for visitors')}
        />
        <SummaryCard
          title="Device Types"
          value={safeAggregates.topDevices[0] ? safeAggregates.topDevices[0].deviceClass.charAt(0).toUpperCase() + safeAggregates.topDevices[0].deviceClass.slice(1) : 'No Data'}
          icon={<Monitor className="w-6 h-6" />}
          color="green"
          trend={safeAggregates.topDevices[0] ? `${safeAggregates.topDevices[0].percentage.toFixed(0)}% of traffic` : 'Waiting for visitors'}
        />
        <SummaryCard
          title="Resume Viewed"
          value={formatNumber(safeAggregates.totalResumeViews)}
          icon={<Eye className="w-6 h-6" />}
          color="purple"
          trend="Times opened in viewer"
        />
        <SummaryCard
          title="Resume Downloaded"
          value={formatNumber(safeAggregates.totalResumeDownloads)}
          icon={<FileDown className="w-6 h-6" />}
          color="orange"
          trend={`${safeAggregates.totalUniqueVisitors > 0 ? ((safeAggregates.visitorsWhoDownloaded / safeAggregates.totalUniqueVisitors) * 100).toFixed(1) : 0.0}% conversion rate`}
        />
      </div>

      {/* Region Breakdown */}
      {safeAggregates.topRegions.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Top Visitor Locations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {safeAggregates.topRegions.slice(0, 6).map((region, idx) => (
              <div key={region.countryCode} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCountryFlag(region.countryCode)}</span>
                    <span className="font-medium text-gray-900">{region.country}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{region.visitorCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Breakdown */}
      {safeAggregates.topDevices.length > 0 && (
        <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-green-600" />
            Device Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {safeAggregates.topDevices.map((device) => (
              <div key={device.deviceClass} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize flex items-center gap-2">
                    {device.deviceClass === 'desktop' && <Monitor className="w-4 h-4 text-gray-600" />}
                    {device.deviceClass === 'mobile' && <Smartphone className="w-4 h-4 text-gray-600" />}
                    {device.deviceClass === 'tablet' && <Tablet className="w-4 h-4 text-gray-600" />}
                    {device.deviceClass}
                  </span>
                  <span className="text-sm font-bold text-green-600">{device.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all" 
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 mt-1 block">{device.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Helper function to get country flag emoji
function getCountryFlag(countryCode: string): string {
  if (countryCode === 'XX' || !countryCode) return '🌍';
  if (countryCode === 'LOCAL') return '🏠'; // Localhost icon
  if (countryCode === 'INTL') return '🌐'; // Global visitor icon
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Captcha Analytics Component
function CaptchaAnalytics() {
  const [loading, setLoading] = useState(true);
  const [captchaEvents, setCaptchaEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFailures: 0,
    uniqueVisitors: 0,
    avgAttemptsPerVisitor: 0,
    successRate: 0,
  });
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchCaptchaData();
  }, [timeRange]);

  const fetchCaptchaData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/visitor-analytics/events?eventTypes=captcha_failed,captcha_success,captcha_required&limit=500`);
      if (response.ok) {
        const data = await response.json();
        const events = data.events || [];
        
        // Process events for analytics
        const failedEvents = events.filter((e: any) => e.eventType === 'captcha_failed');
        const successEvents = events.filter((e: any) => e.eventType === 'captcha_success');
        const uniqueVisitors = new Set(failedEvents.map((e: any) => e.visitorId)).size;
        const totalAttempts = failedEvents.length + successEvents.length;
        const successRate = totalAttempts > 0 ? (successEvents.length / totalAttempts) * 100 : 0;

        setStats({
          totalFailures: failedEvents.length,
          uniqueVisitors,
          avgAttemptsPerVisitor: uniqueVisitors > 0 ? (failedEvents.length / uniqueVisitors) : 0,
          successRate,
        });

        // Group by visitor for display
        const visitorMap = new Map();
        failedEvents.forEach((event: any) => {
          if (!visitorMap.has(event.visitorId)) {
            visitorMap.set(event.visitorId, {
              visitorId: event.visitorId,
              failures: [],
              totalAttempts: 0,
            });
          }
          const visitor = visitorMap.get(event.visitorId);
          visitor.failures.push({
            timestamp: event.timestamp,
            attempts: event.metadata?.attempts || 1,
            page: event.metadata?.page || 'Unknown',
            sessionId: event.sessionId,
          });
          visitor.totalAttempts += event.metadata?.attempts || 1;
        });

        setCaptchaEvents(Array.from(visitorMap.values()).sort((a, b) => b.totalAttempts - a.totalAttempts));
      }
    } catch (error) {
      console.error('[CaptchaAnalytics] Error fetching data:', error);
      showToast.error('Failed to load captcha analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Failures"
          value={stats.totalFailures}
          icon={<Shield className="w-5 h-5" />}
          color="red"
        />
        <SummaryCard
          title="Unique Visitors"
          value={stats.uniqueVisitors}
          icon={<Users className="w-5 h-5" />}
          color="orange"
        />
        <SummaryCard
          title="Avg Attempts/Visitor"
          value={stats.avgAttemptsPerVisitor.toFixed(1)}
          icon={<Target className="w-5 h-5" />}
          color="purple"
        />
        <SummaryCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Header with Refresh */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Captcha Failure Details</h2>
          <button
            onClick={fetchCaptchaData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Failures Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {captchaEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">No Captcha Failures</p>
            <p className="text-gray-400 text-sm mt-2">
              All visitors are passing security verification successfully
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor UUID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Failures
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latest Failure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {captchaEvents.map((visitor) => {
                  const latestFailure = visitor.failures[0];
                  return (
                    <tr key={visitor.visitorId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">
                          {visitor.visitorId.substring(0, 20)}...
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {visitor.failures.length} failures
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatTimestamp(latestFailure.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {latestFailure.page}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(visitor.visitorId);
                            showToast.success('UUID copied to clipboard');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Copy UUID
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">About Captcha Analytics</p>
            <p className="text-xs text-blue-700 mt-1">
              This tracks visitors who triggered rate limits and failed captcha verification. 
              High failure rates may indicate bot activity or UX issues with the captcha widget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Visitor Data subtab component
function VisitorDataTable({ visitorIdParam }: { visitorIdParam?: string | null }) {
  const {
    visitors,
    loading,
    error,
    totalVisitors,
    hasMore,
    currentPage,
    fetchVisitors,
    setFilters,
    setPage,
    resetFilters,
    deleteVisitor,
    batchDeleteVisitors,
    deleteAllData,
  } = useVisitorAnalytics();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "offline">("all");
  const [deviceFilter, setDeviceFilter] = useState<DeviceClass | "all">("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [banTargetId, setBanTargetId] = useState<string | null>(null);
  const [banTargetReason, setBanTargetReason] = useState<string | undefined>(undefined);

  // Initial data load
  useEffect(() => {
    fetchVisitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open modal if visitorIdParam is provided
  useEffect(() => {
    if (visitorIdParam && !loading && visitors.length > 0) {
      // Check if the visitor exists in the current list
      const visitorExists = visitors.some(v => v.id === visitorIdParam);
      
      if (visitorExists) {
        setSelectedVisitorId(visitorIdParam);
        setShowDetailModal(true);
      } else {
        // Visitor not found in current list, show a message
        console.warn(`[VisitorAnalytics] Visitor ${visitorIdParam} not found in current visitor list`);
        showToast.error('Visitor not found. They may have left or been deleted.');
      }
    }
  }, [visitorIdParam, loading, visitors]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVisitors();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters
  const handleSearch = () => {
    setFilters({
      searchQuery: searchQuery || undefined,
      status: statusFilter,
      deviceClass: deviceFilter,
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDeviceFilter("all");
    resetFilters();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVisitors();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleBan = (mask: string) => {
    setBanTargetId(mask);
    setShowBanModal(true);
  };

  const handleUnban = (mask: string, reason?: string) => {
    setBanTargetId(mask);
    setBanTargetReason(reason);
    setShowUnbanModal(true);
  };

  const handleBanSuccess = () => {
    fetchVisitors();
    setBanTargetId(null);
  };

  const handleUnbanSuccess = () => {
    fetchVisitors();
    setBanTargetId(null);
    setBanTargetReason(undefined);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    const result = await deleteVisitor(deleteTargetId);
    if (result.success) {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      setSelectedVisitors((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deleteTargetId);
        return newSet;
      });
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedVisitors(new Set());
  };

  const handleBatchDelete = () => {
    if (selectedVisitors.size === 0) {
      showToast.error("No visitors selected");
      return;
    }
    setShowBatchDeleteConfirm(true);
  };

  const confirmBatchDelete = async () => {
    // Close modal immediately
    setShowBatchDeleteConfirm(false);
    
    const totalItems = selectedVisitors.size;
    
    // Show progress notification
    showToast.info(`Deleting ${totalItems} visitor${totalItems > 1 ? 's' : ''}...`, undefined, {
      autoClose: 3000,
    });
    
    // Process deletions in background
    const result = await batchDeleteVisitors(Array.from(selectedVisitors));
    if (result.success) {
      setSelectedVisitors(new Set());
      setIsSelectionMode(false);
    }
  };

  const toggleVisitorSelection = (id: string) => {
    setSelectedVisitors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVisitors.size === visitors.length && visitors.length > 0) {
      setSelectedVisitors(new Set());
    } else {
      setSelectedVisitors(new Set(visitors.map(v => v.id)));
    }
  };

  const handleDeleteAll = async () => {
    // Close modal immediately
    setShowDeleteConfirm(false);
    
    // Show progress notification
    showToast.info("Deleting all visitor data...", undefined, {
      autoClose: 3000,
    });
    
    // Process deletion in background
    const result = await deleteAllData();
    if (result.success) {
      setSelectedVisitors(new Set());
    }
  };

  const handleViewDetail = (visitorId: string) => {
    setSelectedVisitorId(visitorId);
    setShowDetailModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Visitor Data</h2>
          {isSelectionMode && selectedVisitors.size > 0 && (
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {selectedVisitors.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Select Button */}
          <div className="flex items-end">
            <button
              onClick={toggleSelectionMode}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isSelectionMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
              title={isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
            >
              <CheckCircle className="w-4 h-4" />
              {isSelectionMode ? "Cancel" : "Select"}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by ID or location..."
                className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device
            </label>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <button
              onClick={handleSearch}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selection Mode Actions */}
        {isSelectionMode && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              title={selectedVisitors.size === visitors.length && visitors.length > 0 ? "Deselect all" : "Select all"}
            >
              {selectedVisitors.size === visitors.length && visitors.length > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              {selectedVisitors.size === visitors.length && visitors.length > 0 ? "Deselect All" : "Select All"}
            </button>

            <button
              onClick={handleBatchDelete}
              disabled={selectedVisitors.size === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                selectedVisitors.size === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
              title={selectedVisitors.size === 0 ? "No visitors selected" : `Delete ${selectedVisitors.size} selected visitor${selectedVisitors.size > 1 ? 's' : ''}`}
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedVisitors.size})
            </button>

            {!isSelectionMode && visitors.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Data
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selection Mode Info Banner */}
      {isSelectionMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Selection Mode Active
                </p>
                <p className="text-xs text-blue-700">
                  {selectedVisitors.size === 0
                    ? "Click checkboxes to select visitors"
                    : `${selectedVisitors.size} visitor${selectedVisitors.size > 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSelectionMode}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Exit Selection Mode
            </button>
          </div>
        </div>
      )}

      {/* Visitor List */}
      {loading && (!visitors || visitors.length === 0) ? (
        // Only show loading spinner if there's NO existing data (initial load)
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-base font-medium text-gray-700">Loading visitor data...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your analytics</p>
        </div>
      ) : error ? (
        // Error state - show error message with retry option
        <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-lg border-2 border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-base font-medium text-red-700">Error loading visitors</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : !visitors || visitors.length === 0 ? (
        // No data and not loading - show empty state with helpful message
        <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-20 h-20 text-gray-400 mb-5" />
          <p className="text-lg font-semibold text-gray-700">No visitors found</p>
          <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
            Visitors will appear here once they interact with your portfolio
          </p>
          {(statusFilter !== 'all' || deviceFilter !== 'all' || searchQuery) && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-600">Try adjusting your filters:</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <X className="w-3 h-3" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        // Show data with subtle loading indicator during refresh
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ opacity: loading && visitors.length === 0 ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
            <div className="divide-y divide-gray-200">
              {Array.isArray(visitors) && visitors.map((visitor) => {
                // Safety check - skip if visitor is null/undefined
                if (!visitor || !visitor.id) {
                  console.warn('Skipping invalid visitor:', visitor);
                  return null;
                }
                
                const formatDuration = (seconds: number) => {
                  if (!seconds || isNaN(seconds)) return '0s';
                  if (seconds < 60) return `${Math.round(seconds)}s`;
                  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
                  return `${Math.round(seconds / 3600)}h`;
                };

                const getDeviceIcon = () => {
                  switch (visitor.deviceClass) {
                    case "mobile": return <Smartphone className="w-5 h-5 text-gray-400" />;
                    case "tablet": return <Tablet className="w-5 h-5 text-gray-400" />;
                    default: return <Monitor className="w-5 h-5 text-gray-400" />;
                  }
                };

                const isNew = visitor.totalVisits === 1;

                const isLocalVisitor = !visitor.geoLocation || 
                  visitor.geoLocation.city === "Unknown" || 
                  visitor.geoLocation.country === "Unknown";

                return (
                  <div
                    key={visitor.id}
                    className={`group p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                      isNew ? "bg-gradient-to-r from-blue-50/40 to-purple-50/20" : ""
                    } ${selectedVisitors.has(visitor.id) ? "bg-blue-50 border-l-4 border-l-blue-600 shadow-sm" : ""} ${!isSelectionMode ? "cursor-pointer" : ""}`}
                    onClick={() => !isSelectionMode && handleViewDetail(visitor.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox - Only show in selection mode */}
                      {isSelectionMode && (
                        <div className="flex-shrink-0 pt-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVisitorSelection(visitor.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {selectedVisitors.has(visitor.id) ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Target className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Device Icon with background */}
                            <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-gray-200 group-hover:border-blue-300 group-hover:shadow-sm transition-all">
                              {getDeviceIcon()}
                            </div>
                            
                            {/* Location & Status */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className={`w-4 h-4 flex-shrink-0 ${isLocalVisitor ? 'text-orange-500' : 'text-blue-500'}`} />
                                <h3 className={`font-semibold text-base truncate ${isLocalVisitor ? 'text-orange-900' : 'text-gray-900'}`}>
                                  {isLocalVisitor ? (
                                    <span className="flex items-center gap-2">
                                      <span>Local/Private Network</span>
                                      <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                        localhost
                                      </span>
                                    </span>
                                  ) : (
                                    `${visitor.geoLocation?.city}, ${visitor.geoLocation?.country}`
                                  )}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Status Badge */}
                                {visitor.currentStatus === "active" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm"></span>
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                    Offline
                                  </span>
                                )}
                                
                                {/* New Visitor Badge */}
                                {isNew && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 border border-blue-200">
                                    <span className="text-blue-600">✨</span> New
                                  </span>
                                )}

                                {/* Banned Badge */}
                                {visitor.banned && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-md border-2 border-red-700">
                                    <Ban className="w-3.5 h-3.5" /> BANNED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {/* Ban/Unban Button */}
                            {visitor.banned ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!visitor.mask) {
                                    showToast.error('Cannot unban: Visitor mask not found');
                                    return;
                                  }
                                  handleUnban(visitor.mask, visitor.banReason);
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 hover:border-green-300 transition-all flex items-center gap-1.5"
                                title="Unban visitor"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!visitor.mask) {
                                    showToast.error('Cannot ban: Visitor mask not found');
                                    return;
                                  }
                                  handleBan(visitor.mask);
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 hover:border-red-300 transition-all flex items-center gap-1.5"
                                title="Ban visitor"
                              >
                                <Ban className="w-4 h-4" />
                                Ban
                              </button>
                            )}
                            
                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewDetail(visitor.id)}
                              className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        </div>
                        
                        {/* Stats Grid - Essential Only */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Location
                            </p>
                            <p className="text-sm font-bold text-gray-900">{visitor.geoLocation?.country || 'Unknown'}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all">
                            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              Device
                            </p>
                            <p className="text-sm font-bold text-gray-900 capitalize">{visitor.deviceClass}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all">
                            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Resume Views
                            </p>
                            <p className="text-sm font-bold text-gray-900">{visitor.resumeDownloads * 3}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all">
                            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                              <FileDown className="w-3 h-3" />
                              Downloads
                            </p>
                            <p className="text-sm font-bold text-gray-900">{visitor.resumeDownloads}</p>
                          </div>
                        </div>
                        
                        {/* Footer - Enhanced Info */}
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Full UUID - Expandable */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-md border border-indigo-200 hover:border-indigo-400 transition-all group/uuid">
                              <Target className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                              <span className="text-xs font-mono text-gray-700 font-medium">
                                UUID: <span className="text-indigo-700">{visitor.id}</span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(visitor.id);
                                  showToast.success('UUID copied!');
                                }}
                                className="ml-1 p-1 hover:bg-indigo-50 rounded transition-colors"
                                title="Copy UUID"
                              >
                                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Mask for Portfolio Reference */}
                            {visitor.mask && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-md border border-blue-200 hover:border-blue-400 transition-all">
                                <span className="text-xs font-mono text-gray-600 font-medium">
                                  Mask: <span className="text-blue-700">{visitor.mask}</span>
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(visitor.mask);
                                    showToast.success('Mask copied for ban reference!');
                                  }}
                                  className="ml-1 p-1 hover:bg-blue-100 rounded transition-colors"
                                  title="Copy mask (see on portfolio)"
                                >
                                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            )}

                            {/* ISP */}
                            {(visitor.geoLocation as any)?.isp && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-md border border-blue-200">
                                <Globe className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <span className="text-xs text-gray-700">
                                  <span className="font-medium">ISP:</span> {(visitor.geoLocation as any).isp}
                                </span>
                              </div>
                            )}

                            {/* Last Visit */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-md border border-purple-200">
                              <Clock className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                              <span className="text-xs text-gray-700">
                                <span className="font-medium">Last:</span> {new Date(visitor.lastVisit).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            {/* Device */}
                            {visitor.deviceString && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-md border border-gray-200">
                                <Monitor className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                <span className="text-xs text-gray-700 font-medium">{visitor.deviceString}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalVisitors > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {visitors.length} of {totalVisitors} visitors
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">Page {currentPage}</span>
                  <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={!hasMore || loading}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVisitorId && (
        <VisitorDetailModal
          visitorId={selectedVisitorId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedVisitorId(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Visitor?</h3>
                <p className="text-sm text-gray-600 mt-1">This will move the visitor to recycle bin</p>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                The visitor data will be moved to the recycle bin and can be restored within 30 days.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete {selectedVisitors.size} Visitors?</h3>
                <p className="text-sm text-gray-600 mt-1">This will move them to recycle bin</p>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {selectedVisitors.size} visitor{selectedVisitors.size > 1 ? 's' : ''} will be moved to the recycle bin and can be restored within 30 days.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBatchDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Data Confirmation Modal */}
      {showDeleteConfirm && !deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete All Analytics Data?</h3>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                This will permanently delete:
              </p>
              <ul className="mt-2 ml-6 text-sm text-red-700 space-y-1 list-disc">
                <li>All visitor profiles</li>
                <li>All session data</li>
                <li>All tracking events</li>
                <li>All audit logs</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && banTargetId && (
        <BanModal 
          visitorId={banTargetId} 
          onClose={() => setShowBanModal(false)} 
          onBanSuccess={handleBanSuccess} 
        />
      )}

      {/* Unban Modal */}
      {showUnbanModal && banTargetId && (
        <UnbanModal 
          visitorId={banTargetId} 
          banReason={banTargetReason} 
          onClose={() => setShowUnbanModal(false)} 
          onUnbanSuccess={handleUnbanSuccess} 
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
