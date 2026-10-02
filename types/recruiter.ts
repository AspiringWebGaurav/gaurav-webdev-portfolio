/**
 * Recruiter Portal Type Definitions
 * contact.gauravpatil.site
 */

export interface RecruiterProfile {
  id: string; // SHA-256 hash of normalized email (deterministic doc ID)
  email: string; // Normalized lowercase email
  name: string; // Recruiter full name
  company: string; // Organization / Company name
  phone?: string | null; // Optional recruiter phone
  verified: boolean; // Verification status (true)
  firstVerifiedAt: number; // Epoch ms of first OTP verification
  lastActiveAt: number; // Epoch ms of latest activity (slides on active use)
  totalVisits: number; // Monotonic counter of verified sessions
  lastAction?: string; // Latest logged engagement action
  countryCode?: string | null; // Authoritative cf-ipcountry (if present)
}

export type ChallengeStatus = "ACTIVE" | "VERIFIED" | "EXPIRED" | "INVALIDATED";

export interface RecruiterChallenge {
  id: string; // "ch_rec_<nanoid>"
  email: string;
  name: string;
  company: string;
  phone?: string | null;
  otpHash: string; // Salted HMAC-SHA256 hash using RECRUITER_OTP_SECRET
  otpSalt: string; // 16-byte random hex salt
  attemptsCount: number; // Incremented on wrong OTP; max 3
  resendCount: number; // Max 3 resends with 60s cooldown
  status: ChallengeStatus;
  isConsumed: boolean; // True on success or invalidation
  createdAt: number;
  expiresAt: number; // now + 5 minutes
  lastResentAt: number;
  clientIp: string;
  countryCode?: string | null;
}

export type RecruiterSessionStatus = "ACTIVE" | "REVOKED";

export interface RecruiterSessionRecord {
  id: string; // "ses_rec_<uuid>"
  recruiterId: string; // Foreign key to recruiter_profiles.id
  email: string;
  name: string;
  company: string;
  tokenHash: string; // SHA-256 hash of token signature
  createdAt: number;
  lastActiveAt: number; // Refreshed on activity (inactivity check)
  status: RecruiterSessionStatus;
  clientIp: string;
  userAgent?: string;
  phoneUnmasked?: boolean;
  phoneUnmaskedAt?: number;
}

export interface RecruiterSessionTokenPayload {
  sessionId: string;
  recruiterId: string;
  email: string;
  name: string;
  company: string;
  issuedAt: number;
}

export type RecruiterActionType =
  | "AUTH_SUCCESS"
  | "NAVIGATE_SECTION"
  | "VIEW_PROJECT_DETAIL"
  | "DOWNLOAD_RESUME"
  | "EMAIL_RESUME"
  | "CLICK_CALL"
  | "CLICK_WHATSAPP"
  | "CLICK_EMAIL"
  | "CLICK_LINKEDIN"
  | "CLICK_GITHUB"
  | "CLICK_LIVE_PROJECT"
  | "LIVE_CHAT_MESSAGE"
  | "REQUEST_PHONE_OTP"
  | "UNMASK_PHONE";

export interface RecruiterActivityEvent {
  id: string; // "act_<timestamp>_<nanoid>"
  recruiterId: string;
  email: string;
  company: string;
  action: RecruiterActionType;
  metadata?: Record<string, unknown>;
  timestamp: number;
  clientIp: string;
}

export interface EmailChannel {
  email: string;
  label: string;
  badge?: string;
}

export interface ProtectedContactPayload {
  phone: string | null;
  phoneDisplay: string;
  whatsappUrl: string | null;
  secondaryPhone?: string | null;
  secondaryPhoneDisplay?: string;
  email: string;
  emails?: EmailChannel[];
  linkedin: string;
  github: string;
  isMasked?: boolean;
}

export interface RecruiterSessionPublicState {
  authenticated: boolean;
  recruiter?: {
    name: string;
    company: string;
    email: string;
  } | null;
}
