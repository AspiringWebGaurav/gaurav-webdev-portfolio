"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CrashReport } from "@/crash-report-mechanism/types/crashReport";
import { ArrowLeft, RefreshCw, Calendar, Clock, AlertCircle, Monitor } from "lucide-react";
import { getSeverityColor, getStatusColor } from "@/crash-report-mechanism/types/crashReport";
import NextImage from "next/image";

export default function CrashReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const crashId = params.id as string;
  
  const [report, setReport] = useState<CrashReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"screenshot" | "stack" | "info">("screenshot");
  const [error, setError] = useState<string | null>(null);

  const fetchCrashReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/crash-reports/${crashId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch crash report");
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrashReport();
  }, [crashId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crash report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Crash Report</h2>
          <p className="text-gray-600 mb-6">{error || "Crash report not found"}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const severityColor = getSeverityColor(report.severity);
  const statusColor = getStatusColor(report.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">Crash Report Details</h1>
                <p className="text-sm text-gray-500">ID: {report.id}</p>
              </div>
            </div>

            {/* Right: Refresh */}
            <button
              onClick={fetchCrashReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Badges & Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColor}`}>
              {report.severity}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              {report.status}
            </span>
            {report.priority === "urgent" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                🚨 URGENT
              </span>
            )}
            {report.status === "new" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                New
              </span>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(report.timestamp).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {new Date(report.timestamp).toLocaleTimeString()}
            </div>
            {report.occurenceCount > 1 && (
              <span className="text-xs text-orange-600 font-medium">
                Occurred {report.occurenceCount}x
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("screenshot")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "screenshot"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Screenshot
            </button>
            <button
              onClick={() => setActiveTab("stack")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "stack"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Stack Trace
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "info"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              System Info
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Screenshot Tab */}
            {activeTab === "screenshot" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Screenshot at Crash Time</h3>
                {report.screenshot?.url ? (
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <NextImage
                      src={report.screenshot.url}
                      alt="Crash Screenshot"
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-12 text-center">
                    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No screenshot available</p>
                  </div>
                )}
                <p className="mt-3 text-sm text-gray-500">
                  Note: Test crashes may show placeholder images. Real crashes capture the actual browser state.
                </p>
              </div>
            )}

            {/* Stack Trace Tab */}
            {activeTab === "stack" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Stack Trace</h3>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Error Message</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-900 font-mono text-sm">{report.errorMessage}</p>
                  </div>
                </div>

                {report.errorStack && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Stack Trace</h4>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                        {report.errorStack}
                      </pre>
                    </div>
                  </div>
                )}

                {report.componentStack && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Component Stack</h4>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-blue-400 text-xs font-mono whitespace-pre-wrap">
                        {report.componentStack}
                      </pre>
                    </div>
                  </div>
                )}

                {report.url && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">URL at Crash</h4>
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                      <code className="text-sm text-blue-600">{report.url}</code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Info Tab */}
            {activeTab === "info" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                  
                  {report.browserInfo && typeof report.browserInfo === 'object' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(report.browserInfo).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                          <div className="text-sm text-gray-900 font-medium break-words">
                            {String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {report.userAgent && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">User Agent</h4>
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                      <code className="text-xs text-gray-800 break-all">{report.userAgent}</code>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Crash Metadata</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div><span className="font-medium">Crash ID:</span> {report.id}</div>
                        <div><span className="font-medium">First Seen:</span> {new Date(report.firstSeen).toLocaleString()}</div>
                        {report.lastSeen && (
                          <div><span className="font-medium">Last Seen:</span> {new Date(report.lastSeen).toLocaleString()}</div>
                        )}
                        <div><span className="font-medium">Total Occurrences:</span> {report.occurenceCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
