/**
 * Visitor Analytics Type Definitions
 * Privacy-focused, server-synced analytics system with compliance guardrails
 */

// Event types that can be tracked - OPTIMIZED: Only high-value events
export type VisitorEventType =
  | "resume_view"        // User views resume
  | "resume_download"    // User downloads resume (HIGH VALUE!)
  | "contact_open"       // User opens contact form
  | "form_submit";       // User submits form (HIGH VALUE!)

// Device classification
export type DeviceClass = "mobile" | "tablet" | "desktop" | "unknown";

// Visitor status
export type VisitorStatus = "active" | "offline";

// Geographic region (privacy-compliant: city/country level only)
export interface GeoLocation {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  timezone?: string;
  isBot?: boolean;
  botName?: string;
  source?: string; // 'ipapi.co', 'ip-api.com', 'ipwhois.io', 'server'
}

// Single event record (server-logged)
export interface VisitorEvent {
  id: string;
  visitorId: string; // Hashed/anonymized visitor identifier
  sessionId: string;
  eventType: VisitorEventType;
  timestamp: Date; // Server timestamp (source of truth)
  metadata?: {
    page?: string;
    referrer?: string;
    duration?: number; // milliseconds
    interactionType?: string;
    [key: string]: any;
  };
}

// Session record (bounded time period for a visitor)
export interface VisitorSession {
  id: string;
  visitorId: string;
  startTime: Date; // Server timestamp
  endTime?: Date; // Server timestamp (undefined if active)
  duration?: number; // Calculated server-side in seconds
  pageViews: number;
  bubbleOpens: number;
  interactions: number;
  deviceSnapshot: DeviceSnapshot;
  geoLocation?: GeoLocation;
  referrerSource?: string; // High-level: search, direct, referral domain
  isActive: boolean;
}

// Device metadata snapshot (non-PII technical data)
export interface DeviceSnapshot {
  deviceClass: DeviceClass;
  os?: string; // e.g., "Windows", "macOS", "Android", "iOS"
  browser?: string; // e.g., "Chrome", "Safari", "Firefox"
  browserVersion?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  userAgent?: string; // Stored for admin reference only
  networkQuality?: "slow" | "moderate" | "fast" | "unknown";
}

// Aggregated visitor profile (server-computed)
export interface VisitorProfile {
  id: string; // UUID - permanent visitor identifier
  mask?: string; // Public mask for portfolio/ban reference
  firstVisit: Date;
  lastVisit: Date;
  totalVisits: number;
  totalSessions: number;
  averageSessionDuration: number; // seconds
  totalActiveTime: number; // cumulative seconds across all sessions
  totalPageViews: number;
  totalBubbleOpens: number;
  totalInteractions: number;
  resumeViews: number;
  resumeDownloads: number;
  formSubmissions: number;
  currentStatus: VisitorStatus;
  deviceClass: DeviceClass; // Most recent device
  deviceString?: string; // Human-readable device summary (e.g., "Windows · Chrome")
  geoLocation?: GeoLocation; // Most recent location
  geoHistory?: GeoLocation[]; // Location changes across sessions (if any)
  captchaFailureCount?: number; // Total captcha failures
  lastCaptchaFailure?: Date; // Most recent captcha failure
  banned: boolean; // Future ban/unban support
  banReason?: string;
  banCategory?: string; // Ban severity category
  banType?: 'temporary' | 'permanent'; // Ban type
  banDuration?: number; // Duration in minutes (for temporary bans)
  banExpiresAt?: Date; // Expiration timestamp (for temporary bans)
  autoUnbanEnabled?: boolean; // Auto-unban feature flag
  banTimestamp?: Date;
  bannedBy?: string; // Admin ID who banned
  bannedByUid?: string; // Admin UID who banned
  createdAt: Date;
  updatedAt: Date;
}

// Visitor detail view data (fetched on-demand)
export interface VisitorDetailData {
  profile: VisitorProfile;
  sessions: VisitorSession[];
  recentEvents: VisitorEvent[];
  interactionTimeline: InteractionTimelineItem[];
  pageVisitCounts: Record<string, number>; // page URL -> visit count
  deviceHistory: DeviceSnapshot[];
}

// Timeline item for interaction density visualization
export interface InteractionTimelineItem {
  timestamp: Date;
  eventType: VisitorEventType;
  description: string;
  metadata?: Record<string, any>;
}

// Analytics aggregates (summary cards)
export interface AnalyticsAggregates {
  totalUniqueVisitors: number;
  newVisitors: number; // Within selected time range
  returningVisitors: number;
  averageSessionDuration: number; // seconds
  totalSessions: number;
  totalPageViews: number;
  totalInteractions: number;
  // NEW: All 4 critical analytics events
  totalResumeViews: number; // Total times resume was viewed
  totalResumeDownloads: number; // Total times resume was downloaded
  totalFormSubmissions: number; // Total form submissions
  visitorsWhoDownloaded: number; // Unique visitors who downloaded (for conversion rate)
  visitorsWhoSubmitted: number; // Unique visitors who submitted forms
  activeVisitors: number; // Real-time or near-real-time
  topRegions: RegionStat[];
  topDevices: DeviceStat[];
  topBrowsers: BrowserStat[];
}

// Regional statistics
export interface RegionStat {
  country: string;
  countryCode: string;
  visitorCount: number;
  sessionCount: number;
}

// Device statistics
export interface DeviceStat {
  deviceClass: DeviceClass;
  count: number;
  percentage: number;
}

// Browser statistics
export interface BrowserStat {
  browser: string;
  count: number;
  percentage: number;
}

// Admin audit log entry
export interface AnalyticsAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: "view_list" | "view_detail" | "export_data" | "ban_visitor" | "unban_visitor";
  targetVisitorId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Event ingestion DTO (from client to server)
export interface EventIngestionDTO {
  eventType: VisitorEventType;
  metadata?: {
    page?: string;
    referrer?: string;
    duration?: number;
    interactionType?: string;
    [key: string]: any;
  };
}

// Visitor list filters
export interface VisitorFilters {
  status?: VisitorStatus | "all";
  deviceClass?: DeviceClass | "all";
  country?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string; // Search by visitor ID or location
  banned?: boolean | "all";
}

// Visitor list query params
export interface VisitorListParams extends VisitorFilters {
  page?: number;
  limit?: number;
  sortBy?: "lastVisit" | "firstVisit" | "totalVisits" | "totalInteractions";
  sortOrder?: "asc" | "desc";
}

// API response types
export interface VisitorListResponse {
  success: boolean;
  visitors: VisitorProfile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface VisitorDetailResponse {
  success: boolean;
  data: VisitorDetailData;
}

export interface AggregatesResponse {
  success: boolean;
  aggregates: AnalyticsAggregates;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface EventIngestionResponse {
  success: boolean;
  visitorId: string;
  sessionId: string;
  message?: string;
}

// Analytics operation result
export interface AnalyticsOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  validationErrors?: { field: string; message: string }[];
}

// Constants
export const MAX_EVENTS_PER_SESSION = 10000; // Anti-abuse limit
export const SESSION_TIMEOUT_MINUTES = 30; // Inactivity timeout
export const MAX_SESSION_DURATION_HOURS = 12; // Max continuous session
export const DEFAULT_RETENTION_DAYS = 90; // Data retention policy
export const ACTIVE_VISITOR_THRESHOLD_MINUTES = 5; // Consider active if seen within 5 min
export const MAX_GEO_HISTORY_LENGTH = 10; // Limit geo location history

// Validation helpers
export function isValidEventType(type: string): type is VisitorEventType {
  const validTypes: VisitorEventType[] = [
    "resume_view",
    "resume_download", 
    "contact_open",
    "form_submit"
  ];
  return validTypes.includes(type as VisitorEventType);
}

export function isValidDeviceClass(device: string): device is DeviceClass {
  const validDevices: DeviceClass[] = ["mobile", "tablet", "desktop", "unknown"];
  return validDevices.includes(device as DeviceClass);
}

// Helper to convert Firestore data to typed objects
export function firestoreToVisitorProfile(doc: any): VisitorProfile {
  const data = doc.data();
  return {
    id: doc.id,
    mask: data.mask, // Include mask for admin reference
    firstVisit: data.firstVisit?.toDate() || new Date(),
    lastVisit: data.lastVisit?.toDate() || new Date(),
    totalVisits: data.totalVisits || 0,
    totalSessions: data.totalSessions || 0,
    averageSessionDuration: data.averageSessionDuration || 0,
    totalActiveTime: data.totalActiveTime || 0,
    totalPageViews: data.totalPageViews || 0,
    totalBubbleOpens: data.totalBubbleOpens || 0,
    totalInteractions: data.totalInteractions || 0,
    resumeViews: data.resumeViews || 0,
    resumeDownloads: data.resumeDownloads || 0,
    formSubmissions: data.formSubmissions || 0,
    currentStatus: data.currentStatus || "offline",
    deviceClass: data.deviceClass || "unknown",
    deviceString: data.deviceString,
    geoLocation: data.geoLocation,
    geoHistory: data.geoHistory || [],
    banned: data.banned || false,
    banReason: data.banReason,
    banTimestamp: data.banTimestamp?.toDate(),
    bannedBy: data.bannedBy,
    banCategory: data.banCategory,
    banType: data.banType,
    banDuration: data.banDuration,
    banExpiresAt: data.banExpiresAt?.toDate(),
    autoUnbanEnabled: data.autoUnbanEnabled,
    bannedByUid: data.bannedByUid,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export function firestoreToVisitorSession(doc: any): VisitorSession {
  const data = doc.data();
  return {
    id: doc.id,
    visitorId: data.visitorId,
    startTime: data.startTime?.toDate() || new Date(),
    endTime: data.endTime?.toDate(),
    duration: data.duration,
    pageViews: data.pageViews || 0,
    bubbleOpens: data.bubbleOpens || 0,
    interactions: data.interactions || 0,
    deviceSnapshot: data.deviceSnapshot || { deviceClass: "unknown" },
    geoLocation: data.geoLocation,
    referrerSource: data.referrerSource,
    isActive: data.isActive ?? false,
  };
}

export function firestoreToVisitorEvent(doc: any): VisitorEvent {
  const data = doc.data();
  return {
    id: doc.id,
    visitorId: data.visitorId,
    sessionId: data.sessionId,
    eventType: data.eventType,
    timestamp: data.timestamp?.toDate() || new Date(),
    metadata: data.metadata,
  };
}

// Device class detection helper
export function detectDeviceClass(userAgent: string, viewportWidth?: number): DeviceClass {
  if (!userAgent) return "unknown";
  
  const ua = userAgent.toLowerCase();
  
  // Check for mobile patterns
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return "mobile";
  }
  
  // Check for tablet patterns
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "tablet";
  }
  
  // Use viewport width as fallback
  if (viewportWidth) {
    if (viewportWidth < 768) return "mobile";
    if (viewportWidth < 1024) return "tablet";
    return "desktop";
  }
  
  return "desktop";
}

// Extract browser info from user agent
export function extractBrowserInfo(userAgent: string): { browser?: string; browserVersion?: string; os?: string } {
  if (!userAgent) return {};
  
  const ua = userAgent;
  let browser: string | undefined;
  let browserVersion: string | undefined;
  let os: string | undefined;
  
  // Detect browser
  if (/edg/i.test(ua)) {
    browser = "Edge";
    browserVersion = ua.match(/edg\/(\d+)/i)?.[1];
  } else if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
    browser = "Chrome";
    browserVersion = ua.match(/chrome\/(\d+)/i)?.[1];
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
    browserVersion = ua.match(/version\/(\d+)/i)?.[1];
  } else if (/firefox/i.test(ua)) {
    browser = "Firefox";
    browserVersion = ua.match(/firefox\/(\d+)/i)?.[1];
  }
  
  // Detect OS
  if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/mac/i.test(ua)) {
    os = "macOS";
  } else if (/android/i.test(ua)) {
    os = "Android";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }
  
  return { browser, browserVersion, os };
}
