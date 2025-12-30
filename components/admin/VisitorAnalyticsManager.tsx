/**
 * Visitor Analytics Manager Component
 * Admin panel component for viewing and managing visitor analytics
 * 
 * AUTO-UNBAN HYBRID SYSTEM:
 * - Primary: On-demand API call when countdown reaches 0:00 (1-2s delay)
 * - Fallback: Firebase Function runs every 1 minute (scheduled backup)
 * - Client countdown: Real-time JavaScript (updates every 1 second)
 * - Expected delay: 1-5 seconds (best case), up to 60 seconds (fallback)
 * - States: [Countdown] → [Unbanning...] → [Unbanned]
 * 
 * COST-OPTIMIZED AUTO-REFRESH:
 * - Only polls when countdown enters "Unbanning..." state
 * - 5-second minimum interval between API calls
 * - Max 15 refresh attempts (75 seconds total polling)
 * - Stops automatically after max attempts to prevent excessive costs
 * - Manual refresh button always available
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

// Visitor detail modal - REDESIGNED FULL SCREEN SINGLE VIEW
interface VisitorDetailModalProps {
  visitorId: string;
  onClose: () => void;
}

function VisitorDetailModal({ visitorId, onClose }: VisitorDetailModalProps) {
  const { fetchVisitorDetail } = useVisitorAnalytics();
  const [detailData, setDetailData] = useState<VisitorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    }, 200);
  };

  // Get the latest session data
  const latestSession: any = detailData?.sessions[0] || {};
  const deviceSnapshot = latestSession.deviceSnapshot || {};

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-50 overflow-hidden transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div 
        className={`h-full flex flex-col transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Ultra Compact Header */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 shadow-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded backdrop-blur-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Visitor Profile - Complete Overview</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <code className="text-xs md:text-sm text-blue-100 font-mono bg-white/20 px-2 py-1 rounded">
                    {visitorId.substring(0, 13)}...
                  </code>
                  {detailData?.profile.mask && (
                    <code className="text-xs md:text-sm text-purple-100 font-mono bg-white/20 px-2 py-1 rounded">
                      Mask: {detailData.profile.mask}
                    </code>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded transition-all border border-white/30 text-sm md:text-base"
              title="Close (ESC)"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Main Content - Maximum Density Grid */}
        <div className="flex-1 overflow-hidden p-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-blue-400 animate-spin mb-4" />
              <p className="text-white text-lg md:text-xl">Loading visitor data...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center">
              <AlertCircle className="w-16 h-16 md:w-20 md:h-20 text-red-400 mb-4" />
              <p className="text-white font-semibold text-xl md:text-2xl mb-2">Unable to Load Data</p>
              <p className="text-gray-300 text-base md:text-lg mb-6">{error}</p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : detailData ? (
            <div className="h-full flex flex-col gap-2 md:gap-3">
              {/* TOP ROW - Status & Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
                {/* Status & Key Metrics - Horizontal */}
                <div className={`p-3 md:p-4 rounded-lg border flex items-center justify-center ${
                  detailData.profile.banned 
                    ? 'bg-red-900/20 border-red-500/50' 
                    : 'bg-green-900/20 border-green-500/50'
                }`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {detailData.profile.banned ? (
                        <Ban className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                      )}
                      <span className={`text-base md:text-lg font-bold ${detailData.profile.banned ? 'text-red-300' : 'text-green-300'}`}>
                        {detailData.profile.banned ? 'BANNED' : 'ACTIVE'}
                      </span>
                    </div>
                    <span className={`text-xs md:text-sm px-2.5 py-1 rounded-full inline-block ${
                      detailData.profile.currentStatus === 'active' 
                        ? 'bg-green-500/30 text-green-200' 
                        : 'bg-gray-500/30 text-gray-300'
                    }`}>
                      {detailData.profile.currentStatus}
                    </span>
                    {detailData.profile.banned && detailData.profile.banReason && (
                      <p className="text-xs md:text-sm text-red-300 mt-1">Reason: {detailData.profile.banReason}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    <span className="text-xs md:text-sm text-blue-300 font-medium">Total Visits</span>
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{detailData.profile.totalVisits}</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                    <span className="text-xs md:text-sm text-purple-300 font-medium">Sessions</span>
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{detailData.profile.totalSessions}</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                    <span className="text-xs md:text-sm text-green-300 font-medium">Resume Views</span>
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{detailData.profile.resumeViews}</p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                    <span className="text-xs md:text-sm text-orange-300 font-medium">Resume Downloads</span>
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{detailData.profile.resumeDownloads}</p>
                </div>
              </div>

              {/* SECOND ROW - Location, Device, Engagement, Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                {/* Location */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    <h3 className="text-sm md:text-base font-bold text-white">Geographic Location</h3>
                  </div>
                  {detailData.profile.geoLocation?.isBot && (
                    <div className="bg-purple-500/20 rounded p-2 mb-2">
                      <p className="text-xs md:text-sm text-purple-300 font-semibold">
                        🤖 {detailData.profile.geoLocation.botName || 'Bot'}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-700">
                      <span className="text-xs md:text-sm text-gray-400">Country</span>
                      <span className={`text-xs md:text-sm font-semibold ${isLocalVisitor ? 'text-orange-400' : 'text-white'}`}>
                        {isLocalVisitor ? '🏠 Local' : detailData.profile.geoLocation?.country || 'Unknown'}
                      </span>
                    </div>
                    {!isLocalVisitor && (
                      <>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-700">
                          <span className="text-xs md:text-sm text-gray-400">City</span>
                          <span className="text-xs md:text-sm font-semibold text-white">
                            {detailData.profile.geoLocation?.city || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs md:text-sm text-gray-400">Timezone</span>
                          <span className="text-xs md:text-sm font-semibold text-white">
                            {detailData.profile.geoLocation?.timezone || 'UTC'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Device */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {detailData.profile.deviceClass === 'desktop' && <Monitor className="w-5 h-5 md:w-6 md:h-6 text-green-400" />}
                    {detailData.profile.deviceClass === 'mobile' && <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-green-400" />}
                    {detailData.profile.deviceClass === 'tablet' && <Tablet className="w-5 h-5 md:w-6 md:h-6 text-green-400" />}
                    <h3 className="text-sm md:text-base font-bold text-white">Device Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-700">
                      <span className="text-xs md:text-sm text-gray-400">Type</span>
                      <span className="text-xs md:text-sm font-semibold text-white capitalize">
                        {detailData.profile.deviceClass}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-700">
                      <span className="text-xs md:text-sm text-gray-400">Browser</span>
                      <span className="text-xs md:text-sm font-semibold text-white">
                        {deviceSnapshot.browser || latestSession.browser?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-700">
                      <span className="text-xs md:text-sm text-gray-400">OS</span>
                      <span className="text-xs md:text-sm font-semibold text-white">
                        {deviceSnapshot.os || latestSession.os?.name || 'Unknown'}
                      </span>
                    </div>
                    {deviceSnapshot.viewportWidth && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs md:text-sm text-gray-400">Screen</span>
                        <span className="text-xs md:text-sm font-semibold text-white">
                          {deviceSnapshot.viewportWidth} × {deviceSnapshot.viewportHeight}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                    <h3 className="text-sm md:text-base font-bold text-white">Engagement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Page Views</p>
                      <p className="text-lg md:text-xl lg:text-2xl font-bold text-white">{detailData.profile.totalPageViews}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Bubbles</p>
                      <p className="text-lg md:text-xl lg:text-2xl font-bold text-white">{detailData.profile.totalBubbleOpens}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Clicks</p>
                      <p className="text-lg md:text-xl lg:text-2xl font-bold text-white">{detailData.profile.totalInteractions}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Forms</p>
                      <p className="text-lg md:text-xl lg:text-2xl font-bold text-white">{detailData.profile.formSubmissions}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Timeline */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                    <h3 className="text-sm md:text-base font-bold text-white">Visit Timeline</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">First Visit</p>
                      <p className="text-xs md:text-sm font-semibold text-white">
                        {new Date(detailData.profile.firstVisit).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Last Visit</p>
                      <p className="text-xs md:text-sm font-semibold text-white">
                        {new Date(detailData.profile.lastVisit).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Avg Session</p>
                      <p className="text-base md:text-lg font-semibold text-blue-400">
                        {formatDuration(detailData.profile.averageSessionDuration)}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Total Active</p>
                      <p className="text-base md:text-lg font-semibold text-green-400">
                        {formatDuration(detailData.profile.totalActiveTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* THIRD ROW - Recent Events, Top Pages, Sessions, Captcha */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-3 flex-1 min-h-0">
                {/* Recent Events */}
                {detailData.recentEvents && detailData.recentEvents.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-4 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                      <h3 className="text-sm md:text-base font-bold text-white">Recent Activity</h3>
                      <span className="ml-auto text-xs md:text-sm bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full font-bold">
                        {detailData.recentEvents.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {detailData.recentEvents.slice(0, 20).map((event, index) => (
                        <div key={event.id || index} className="bg-slate-900/50 rounded p-2 md:p-3 border-l-2 border-blue-500">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-semibold text-blue-300 uppercase tracking-wide truncate">
                                {event.eventType.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs md:text-sm text-gray-400">
                                {new Date(event.timestamp).toLocaleString('en-US', { 
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            {event.eventType === 'resume_download' && (
                              <FileDown className="w-4 h-4 md:w-5 md:h-5 text-orange-400 flex-shrink-0" />
                            )}
                            {event.eventType === 'resume_view' && (
                              <Eye className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                            )}
                            {event.eventType === 'form_submit' && (
                              <Mail className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combined Top Pages & Captcha Column */}
                <div className="flex flex-col gap-2 min-h-0">
                  {/* Page Visit Counts */}
                  {detailData.pageVisitCounts && Object.keys(detailData.pageVisitCounts).length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
                        <h3 className="text-sm md:text-base font-bold text-white">Top Pages</h3>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(detailData.pageVisitCounts)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 8)
                          .map(([page, count]) => (
                            <div key={page} className="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded">
                              <span className="text-xs md:text-sm text-gray-300 truncate flex-1 pr-2" title={page}>
                                {page === '/' ? 'Home' : page.split('/').pop() || page}
                              </span>
                              <span className="text-sm md:text-base font-bold text-blue-400">{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Captcha - if exists */}
                  {(detailData.profile.captchaFailureCount && detailData.profile.captchaFailureCount > 0) && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                        <h3 className="text-sm md:text-base font-bold text-white">Captcha Failures</h3>
                      </div>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-400 mb-2">{detailData.profile.captchaFailureCount}</p>
                      {detailData.profile.lastCaptchaFailure && (
                        <p className="text-xs md:text-sm text-red-300">
                          Last: {new Date(detailData.profile.lastCaptchaFailure).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Sessions List */}
                {detailData.sessions && detailData.sessions.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-4 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                      <h3 className="text-sm md:text-base font-bold text-white">Sessions</h3>
                      <span className="ml-auto text-xs md:text-sm bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full font-bold">
                        {detailData.sessions.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {detailData.sessions.map((session, index) => (
                        <div key={session.sessionId || index} className="bg-slate-900/50 rounded p-2 md:p-3 border-l-2 border-cyan-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs md:text-sm text-cyan-300 font-bold">Session #{detailData.sessions.length - index}</span>
                            <span className={`text-xs md:text-sm px-2 py-1 rounded-full font-medium ${
                              session.isActive 
                                ? 'bg-green-500/30 text-green-200' 
                                : 'bg-gray-500/30 text-gray-300'
                            }`}>
                              {session.isActive ? '● Live' : 'Ended'}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs md:text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Started</span>
                              <span className="text-white font-medium">
                                {new Date(session.startTime).toLocaleString('en-US', { 
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Duration</span>
                              <span className="text-white font-medium">{formatDuration(session.duration)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Pages</span>
                              <span className="text-blue-400 font-bold">{session.pageViews}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Bubbles</span>
                              <span className="text-purple-400 font-bold">{session.bubbleOpens}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Clicks</span>
                              <span className="text-green-400 font-bold">{session.interactions}</span>
                            </div>
                            {session.referrerSource && (
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700">
                                <span className="text-gray-400">Source</span>
                                <span className="text-orange-300 font-medium text-xs md:text-sm truncate ml-2" title={session.referrerSource}>
                                  {session.referrerSource}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-white text-lg md:text-xl">No data available</p>
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isFullPageMode, setIsFullPageMode] = useState(false);

  // Handle ESC key to exit full-page mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullPageMode) {
        setIsFullPageMode(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullPageMode]);

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

  // Toggle row expansion
  const toggleRowExpansion = (visitorId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(visitorId)) {
        newSet.delete(visitorId);
      } else {
        newSet.add(visitorId);
      }
      return newSet;
    });
  };

  // Helper functions
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getDeviceIcon = (deviceClass: DeviceClass) => {
    switch (deviceClass) {
      case "mobile": return <Smartphone className="w-4 h-4 text-gray-600" />;
      case "tablet": return <Tablet className="w-4 h-4 text-gray-600" />;
      default: return <Monitor className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate countdown for temporary bans with real-time updates
  const getbanCountdown = (banExpiresAt: any): string | null => {
    if (!banExpiresAt) return null;
    
    try {
      // Handle both Firestore Timestamp and Date objects
      const expirationTime = banExpiresAt.toDate ? banExpiresAt.toDate() : new Date(banExpiresAt);
      
      // Validate date
      if (isNaN(expirationTime.getTime())) {
        console.warn('[Ban Countdown] Invalid date:', banExpiresAt);
        return "--:--";
      }
      
      const now = new Date();
      const diff = expirationTime.getTime() - now.getTime();
      
      // Show "Unbanning..." for up to 90 seconds after expiry (Cloud Function runs every 1 min)
      if (diff <= 0) {
        const timeSinceExpiry = Math.abs(diff);
        if (timeSinceExpiry < 90000) { // 90 seconds buffer
          return "Unbanning...";
        }
        return "EXPIRED";
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Fixed-width formatting to prevent UI shake
      if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h`;
      if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      if (minutes > 0) return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return `00:${String(seconds).padStart(2, '0')}`;
    } catch (e) {
      console.error('[Ban Countdown] Error calculating countdown:', e);
      return "--:--";
    }
  };

  // Live countdown update for temp bans - updates every second
  const [countdownTick, setCountdownTick] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const lastRefreshTime = useRef<number>(0);
  const refreshAttemptCount = useRef<number>(0);
  const MAX_REFRESH_ATTEMPTS = 15; // Max 15 refreshes during "Unbanning..." state (75 seconds)
  const MIN_REFRESH_INTERVAL = 5000; // Minimum 5 seconds between refreshes
  
  useEffect(() => {
    // Only run countdown if there are temporary bans
    const hasTempBans = visitors.some(v => v.banned && v.banType === 'temporary' && v.banExpiresAt);
    setIsCountdownActive(hasTempBans);
    
    if (!hasTempBans) {
      // Reset counters when no temp bans
      refreshAttemptCount.current = 0;
      return;
    }
    
    // Update countdown every second for real-time display
    const interval = setInterval(() => {
      setCountdownTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [visitors]);

  // Auto-refresh visitor list when any ban expires (COST-OPTIMIZED)
  useEffect(() => {
    const expiredBans = visitors.filter(visitor => {
      if (visitor.banType === 'temporary' && visitor.banExpiresAt) {
        const countdown = getbanCountdown(visitor.banExpiresAt);
        return countdown === "Unbanning..." || countdown === "EXPIRED";
      }
      return false;
    });

    if (expiredBans.length > 0) {
      // Cost-saving checks
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // 1. Respect minimum refresh interval (prevent spam)
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        console.log(`[Admin UI] ⏳ Throttled: Last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago (min: 5s)`);
        return;
      }
      
      // 2. Limit max refresh attempts (prevent infinite polling)
      if (refreshAttemptCount.current >= MAX_REFRESH_ATTEMPTS) {
        console.log(`[Admin UI] 🛑 Max refresh attempts reached (${MAX_REFRESH_ATTEMPTS}). Stop polling to save costs.`);
        console.log(`[Admin UI] 💡 Tip: Manual refresh button still available if needed.`);
        return;
      }
      
      // 3. Only poll aggressively when actually in "Unbanning..." state
      const hasUnbanningState = expiredBans.some(v => {
        const countdown = getbanCountdown(v.banExpiresAt);
        return countdown === "Unbanning...";
      });
      
      if (!hasUnbanningState) {
        // Just expired, wait 2 seconds then do ONE refresh
        console.log(`[Admin UI] Detected ${expiredBans.length} expired ban(s), scheduling single refresh...`);
        const refreshTimer = setTimeout(() => {
          lastRefreshTime.current = Date.now();
          refreshAttemptCount.current++;
          handleRefresh();
        }, 2000);
        return () => clearTimeout(refreshTimer);
      }
      
      // In "Unbanning..." state - poll every 5 seconds (max 15 times = 75 seconds)
      console.log(`[Admin UI] 🔄 Unbanning state detected (attempt ${refreshAttemptCount.current + 1}/${MAX_REFRESH_ATTEMPTS})`);
      const refreshTimer = setTimeout(() => {
        lastRefreshTime.current = Date.now();
        refreshAttemptCount.current++;
        handleRefresh();
      }, 5000);
      return () => clearTimeout(refreshTimer);
    } else {
      // No expired bans - reset counter for next time
      if (refreshAttemptCount.current > 0) {
        console.log(`[Admin UI] ✅ All bans resolved. Reset refresh counter (used ${refreshAttemptCount.current}/${MAX_REFRESH_ATTEMPTS} attempts)`);
        refreshAttemptCount.current = 0;
      }
    }
  }, [countdownTick, visitors]);

  // Render content (filters, table, modals)
  const renderContent = () => (
    <>
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
          {/* Full Screen Button */}
          <div className="flex items-end">
            <button
              onClick={() => setIsFullPageMode(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
              title="Open table in full screen mode"
            >
              <ExternalLink className="w-4 h-4" />
              Full Screen
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
          <div className="flex items-end gap-2 md:col-span-1">
            <button
              onClick={handleSearch}
              className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium ${
                searchQuery || statusFilter !== 'all' || deviceFilter !== 'all' ? 'flex-1' : 'w-full'
              }`}
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
            {(searchQuery || statusFilter !== 'all' || deviceFilter !== 'all') && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all animate-in fade-in slide-in-from-right-2 duration-200"
                title="Clear filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
        // Show data - NEW COMPACT TABLE LAYOUT
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ opacity: loading && visitors.length === 0 ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 overflow-x-auto">
              <div className="flex gap-3 px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-max">
                <div className="w-[40px] flex items-center justify-center flex-shrink-0">
                  {isSelectionMode && (
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={selectedVisitors.size === visitors.length && visitors.length > 0 ? "Deselect all" : "Select all"}
                    >
                      {selectedVisitors.size === visitors.length && visitors.length > 0 ? (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Target className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
                <div className="w-[180px] flex-shrink-0">Location</div>
                <div className="w-[85px] flex-shrink-0 text-center">Status</div>
                <div className="w-[120px] flex-shrink-0">Device</div>
                <div className="w-[55px] flex-shrink-0 text-center">Visits</div>
                <div className="w-[280px] flex-shrink-0">UUID</div>
                <div className="w-[150px] flex-shrink-0">Mask</div>
                <div className="w-[55px] flex-shrink-0 text-center">Views</div>
                <div className="w-[65px] flex-shrink-0 text-center">Down</div>
                <div className="w-[95px] flex-shrink-0">Last Visit</div>
                <div className="w-[115px] flex-shrink-0 text-right sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100 overflow-x-auto">
              <div className="min-w-max">
              {Array.isArray(visitors) && visitors.map((visitor) => {
                // Safety check
                if (!visitor || !visitor.id) {
                  console.warn('Skipping invalid visitor:', visitor);
                  return null;
                }
                
                const isNew = visitor.totalVisits === 1;
                const isLocalVisitor = !visitor.geoLocation || 
                  visitor.geoLocation.city === "Unknown" || 
                  visitor.geoLocation.country === "Unknown";
                const isExpanded = expandedRows.has(visitor.id);

                return (
                  <React.Fragment key={visitor.id}>
                    {/* Compact Row */}
                    <div
                      className={`group hover:bg-gray-50 transition-colors ${
                        isNew ? "bg-blue-50/30" : ""
                      } ${selectedVisitors.has(visitor.id) ? "bg-blue-50 border-l-4 border-l-blue-500" : ""} ${
                        isExpanded ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="flex gap-3 px-3 py-3 items-center text-sm min-w-max">
                        {/* Expand/Select Button */}
                        <div className="w-[40px] flex-shrink-0 flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleRowExpansion(visitor.id)}
                            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                          {isSelectionMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVisitorSelection(visitor.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              {selectedVisitors.has(visitor.id) ? (
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Target className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Location */}
                        <div className="w-[180px] flex-shrink-0 flex items-center gap-2 overflow-hidden">
                          <MapPin className={`w-4 h-4 flex-shrink-0 ${isLocalVisitor ? 'text-orange-500' : (visitor.geoLocation?.isBot ? 'text-purple-500' : 'text-blue-500')}`} />
                          <span className="font-medium text-gray-900 truncate" title={
                            isLocalVisitor 
                              ? "Local/Private Network" 
                              : visitor.geoLocation?.isBot
                                ? `${visitor.geoLocation.botName || 'Bot'} - ${visitor.geoLocation?.city}, ${visitor.geoLocation?.country}`
                                : `${visitor.geoLocation?.city}, ${visitor.geoLocation?.country}`
                          }>
                            {isLocalVisitor 
                              ? "localhost" 
                              : visitor.geoLocation?.isBot 
                                ? `🤖 ${visitor.geoLocation.city}, ${visitor.geoLocation.countryCode}`
                                : `${visitor.geoLocation?.city}, ${visitor.geoLocation?.countryCode}`
                            }
                          </span>
                          {isNew && <span className="flex-shrink-0 text-xs font-semibold text-blue-600">✨</span>}
                          {visitor.banned && (
                            <div className="flex items-center gap-1">
                              <Ban className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                visitor.banType === 'temporary' 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {visitor.banType === 'temporary' ? 'TEMP' : 'PERM'}
                              </span>
                              {visitor.banType === 'temporary' && visitor.banExpiresAt && (() => {
                                const countdown = getbanCountdown(visitor.banExpiresAt);
                                const isUnbanning = countdown === "Unbanning...";
                                return (
                                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded min-w-[65px] justify-center flex-shrink-0 ${
                                    isUnbanning 
                                      ? 'bg-green-50 text-green-700 border border-green-200 animate-pulse' 
                                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                                  }`}>
                                    <span className={isUnbanning ? 'text-green-600' : 'text-orange-600'}>⏱</span>
                                    <span className="tabular-nums">{countdown || "--:--"}</span>
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        <div className="w-[85px] flex-shrink-0 flex justify-center">
                          {visitor.currentStatus === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Offline
                            </span>
                          )}
                        </div>

                        {/* Device */}
                        <div className="w-[120px] flex-shrink-0 flex items-center gap-2 overflow-hidden">
                          {getDeviceIcon(visitor.deviceClass)}
                          <span className="text-gray-700 truncate" title={visitor.deviceString}>
                            {visitor.deviceString?.split('·')[0]?.trim() || visitor.deviceClass}
                          </span>
                        </div>

                        {/* Total Visits */}
                        <div className="w-[55px] flex-shrink-0 text-center">
                          <span className="font-semibold text-gray-900">{visitor.totalVisits}</span>
                        </div>

                        {/* UUID */}
                        <div className="w-[280px] flex-shrink-0 flex items-center gap-1 overflow-hidden">
                          <code className="text-xs font-mono text-indigo-700 truncate" title={visitor.id}>
                            {visitor.id.length > 32 ? `${visitor.id.substring(0, 32)}...` : visitor.id}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(visitor.id);
                              showToast.success('UUID copied!');
                            }}
                            className="flex-shrink-0 p-0.5 hover:bg-indigo-100 rounded"
                            title="Copy UUID"
                          >
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>

                        {/* Mask */}
                        <div className="w-[150px] flex-shrink-0 flex items-center gap-1 overflow-hidden">
                          {visitor.mask ? (
                            <>
                              <code className="text-xs font-mono text-blue-700 truncate" title={visitor.mask}>
                                {visitor.mask}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(visitor.mask);
                                  showToast.success('Mask copied!');
                                }}
                                className="flex-shrink-0 p-0.5 hover:bg-blue-100 rounded"
                                title="Copy Mask"
                              >
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>

                        {/* Views */}
                        <div className="w-[55px] flex-shrink-0 text-center">
                          <span className="font-semibold text-gray-900">{visitor.resumeViews || 0}</span>
                        </div>

                        {/* Downloads */}
                        <div className="w-[65px] flex-shrink-0 text-center">
                          <span className="font-semibold text-gray-900">{visitor.resumeDownloads || 0}</span>
                        </div>

                        {/* Last Visit */}
                        <div className="w-[95px] flex-shrink-0 flex items-center gap-1.5 text-gray-600 overflow-hidden">
                          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate text-xs" title={new Date(visitor.lastVisit).toLocaleString()}>
                            {getRelativeTime(visitor.lastVisit)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="w-[115px] flex-shrink-0 flex items-center justify-end gap-1 sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                          {/* Full Screen */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisitorId(visitor.id);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Open in full screen"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          
                          {/* Ban/Unban */}
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
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Unban visitor"
                            >
                              <CheckCircle className="w-4 h-4" />
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
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Ban visitor"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(visitor.id);
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Delete visitor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-t border-blue-100">
                        <div className="px-4 py-4 space-y-3">
                          {/* IDs and Technical Info */}
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-indigo-200 shadow-sm">
                              <Target className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-xs font-mono text-gray-700">
                                UUID: <span className="text-indigo-700 font-semibold">{visitor.id}</span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(visitor.id);
                                  showToast.success('UUID copied!');
                                }}
                                className="ml-1 p-0.5 hover:bg-indigo-100 rounded"
                              >
                                <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                            
                            {visitor.mask && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm">
                                <span className="text-xs font-mono text-gray-700">
                                  Mask: <span className="text-blue-700 font-semibold">{visitor.mask}</span>
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(visitor.mask);
                                    showToast.success('Mask copied!');
                                  }}
                                  className="p-0.5 hover:bg-blue-100 rounded"
                                >
                                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            )}

                            {(visitor.geoLocation as any)?.isp && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-xs text-gray-700">
                                  ISP: <span className="font-semibold">{(visitor.geoLocation as any).isp}</span>
                                </span>
                              </div>
                            )}

                            {(visitor.geoLocation as any)?.isBot && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-300 shadow-sm">
                                <span className="text-xs text-purple-700 font-bold">
                                  🤖 Bot: <span className="font-semibold">{(visitor.geoLocation as any).botName || 'Crawler'}</span>
                                </span>
                              </div>
                            )}

                            {visitor.deviceString && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <Monitor className="w-3.5 h-3.5 text-gray-600" />
                                <span className="text-xs text-gray-700 font-semibold">{visitor.deviceString}</span>
                              </div>
                            )}
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Total Visits</p>
                              <p className="text-lg font-bold text-gray-900">{visitor.totalVisits}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Sessions</p>
                              <p className="text-lg font-bold text-gray-900">{visitor.totalSessions}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Avg. Duration</p>
                              <p className="text-lg font-bold text-gray-900">{formatDuration(visitor.averageSessionDuration)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Page Views</p>
                              <p className="text-lg font-bold text-gray-900">{visitor.totalPageViews}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Bubble Opens</p>
                              <p className="text-lg font-bold text-gray-900">{visitor.totalBubbleOpens}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Form Submits</p>
                              <p className="text-lg font-bold text-gray-900">{visitor.formSubmissions || 0}</p>
                            </div>
                          </div>

                          {/* Timestamps */}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>First: {new Date(visitor.firstVisit).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Last: {new Date(visitor.lastVisit).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Ban Info */}
                          {visitor.banned && visitor.banReason && (
                            <div className={`border rounded-lg p-3 ${
                              visitor.banType === 'temporary' 
                                ? 'bg-orange-50 border-orange-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <p className={`text-xs font-semibold ${
                                  visitor.banType === 'temporary' 
                                    ? 'text-orange-800' 
                                    : 'text-red-800'
                                }`}>
                                  {visitor.banType === 'temporary' ? '⏱️ Temporary Ban' : '🚫 Permanent Ban'}
                                </p>
                                {visitor.banType === 'temporary' && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                                    TEMP
                                  </span>
                                )}
                                {visitor.banType === 'permanent' && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                                    PERM
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${
                                visitor.banType === 'temporary' 
                                  ? 'text-orange-700' 
                                  : 'text-red-700'
                              }`}>
                                <strong>Reason:</strong> {visitor.banReason}
                              </p>
                              {visitor.banTimestamp && (
                                <p className={`text-xs mt-1 ${
                                  visitor.banType === 'temporary' 
                                    ? 'text-orange-600' 
                                    : 'text-red-600'
                                }`}>
                                  Banned on: {new Date(visitor.banTimestamp).toLocaleString()}
                                </p>
                              )}
                              {visitor.banType === 'temporary' && visitor.banDuration && (
                                <p className="text-xs text-orange-600 mt-1">
                                  <strong>Duration:</strong> {visitor.banDuration} minutes
                                </p>
                              )}
                              {visitor.banType === 'temporary' && visitor.banExpiresAt && (() => {
                                const countdown = getbanCountdown(visitor.banExpiresAt);
                                const isUnbanning = countdown === "Unbanning...";
                                return (
                                  <div className="mt-2 p-2 bg-orange-100 rounded border border-orange-300">
                                    <p className="text-xs text-orange-800">
                                      <strong>Expires in:</strong>{" "}
                                      <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded border ${
                                        isUnbanning 
                                          ? 'bg-green-50 text-green-700 border-green-200 animate-pulse' 
                                          : 'bg-orange-50 text-orange-700 border-orange-200'
                                      }`}>
                                        <span className={isUnbanning ? 'text-green-600' : 'text-orange-600'}>⏱</span>
                                        <span className="tabular-nums min-w-[50px] text-center">
                                          {countdown || "--:--"}
                                        </span>
                                      </span>
                                    </p>
                                    <p className="text-[10px] text-orange-600 mt-1">
                                      {isUnbanning 
                                        ? "🔄 Hybrid unban: Client tries immediate, server as backup" 
                                        : visitor.autoUnbanEnabled 
                                          ? "✅ Hybrid unban: Immediate API + scheduled backup (1-60s delay)" 
                                          : "⚠️ Manual unban required"
                                      }
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2 border-t border-blue-200">
                            <button
                              onClick={() => handleViewDetail(visitor.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Full Details & Event Timeline
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
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
    </>
  );

  // Full-page mode
  if (isFullPageMode) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden flex flex-col">
        {/* Full Page Header */}
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-7 h-7 text-white" />
              <h2 className="text-2xl font-bold text-white">Visitor Data - Full Screen View</h2>
              {isSelectionMode && selectedVisitors.size > 0 && (
                <span className="px-3 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full border border-white/30">
                  {selectedVisitors.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all disabled:opacity-50 border border-white/30 font-medium shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setIsFullPageMode(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
                title="Exit full screen mode (Press ESC)"
              >
                <X className="w-5 h-5" />
                <span>Exit Full Screen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full Screen Content - Table fills entire remaining space */}
        <div className="flex-1 overflow-auto">
          <div className="h-full p-6">
            <div className="h-full bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
              <div className="flex-1 overflow-auto p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal mode
  return (
    <div className="bg-white rounded-lg shadow-sm p-2 space-y-4 w-full max-w-full">
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
            onClick={() => setIsFullPageMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Open in full page mode"
          >
            <ExternalLink className="w-4 h-4" />
            Full Page View
          </button>
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

      {renderContent()}
    </div>
  );
}
