export const TALK_PORTAL_HOST = "talk.gauravpatil.site";
export const TALK_COOKIE_NAME = "talk_session_token";
export const TALK_CHALLENGE_COOKIE_NAME = "talk_otp_challenge_id";

export const TALK_ADMIN_EMAIL = "gauravpatil5737@gmail.com";
export const TALK_ADMIN_NAME = "Gaurav Patil";

export const TALK_OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const TALK_OTP_MAX_ATTEMPTS = 3;
export const TALK_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const TALK_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 604800 seconds

export const TALK_COLLECTIONS = {
  OTP: "talk_otp_challenges",
  FILES: "talk_vault_files",
  NOTEPAD: "talk_notepad",
  MESSAGES: "talk_messages",
} as const;
