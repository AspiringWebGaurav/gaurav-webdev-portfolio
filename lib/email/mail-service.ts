/**
 * Admin Outbound Mail Service
 *
 * Dedicated outbound engine for the Admin Mail Center (/admin/mail).
 * Enforces server-side sender identity resolution, safe HTML compilation,
 * multi-tier rate limiting, and failure-aware status classification.
 */

import { adminLogger } from "@/lib/admin/logger";
import { escapeHtml, formatBrevoIdempotencyKey } from "./brevo";
import {
  EMAIL_IDENTITIES,
  EmailIdentityType,
  PRIMARY_EMAIL_DOMAIN,
} from "./identities";
import {
  renderCompactEmailLayout,
  EMAIL_SPACING,
  EMAIL_TYPOGRAPHY,
} from "./layout";
import type { MailRecipient, MailSenderKey } from "@/lib/dal/repositories/types";

const BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export interface MailSenderIdentity {
  key: MailSenderKey;
  logicalKey: EmailIdentityType;
  email: string;
  displayName: string;
  purpose: string;
  defaultReplyTo: string;
  isNoReply: boolean;
  isLegacy: boolean;
  domain: string;
  legacyEmail?: string;
  brevoSenderId?: number;
  provider?: "BREVO";
}

export const ADMIN_MAIL_SENDERS: Record<MailSenderKey, MailSenderIdentity> = {
  HELLO: {
    key: "HELLO",
    logicalKey: "HELLO",
    email: EMAIL_IDENTITIES.HELLO.primary.email,
    displayName: EMAIL_IDENTITIES.HELLO.primary.name,
    purpose: EMAIL_IDENTITIES.HELLO.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.HELLO.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.HELLO.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    legacyEmail: EMAIL_IDENTITIES.HELLO.legacy.email,
  },
  ME: {
    key: "ME",
    logicalKey: "ME",
    email: EMAIL_IDENTITIES.ME.primary.email,
    displayName: EMAIL_IDENTITIES.ME.primary.name,
    purpose: EMAIL_IDENTITIES.ME.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.ME.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.ME.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    legacyEmail: EMAIL_IDENTITIES.ME.legacy.email,
  },
  WORK: {
    key: "WORK",
    logicalKey: "WORK",
    email: EMAIL_IDENTITIES.WORK.primary.email,
    displayName: EMAIL_IDENTITIES.WORK.primary.name,
    purpose: EMAIL_IDENTITIES.WORK.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.WORK.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.WORK.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    legacyEmail: EMAIL_IDENTITIES.WORK.legacy.email,
  },
  SECURITY: {
    key: "SECURITY",
    logicalKey: "SECURITY",
    email: EMAIL_IDENTITIES.SECURITY.primary.email,
    displayName: EMAIL_IDENTITIES.SECURITY.primary.name,
    purpose: EMAIL_IDENTITIES.SECURITY.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.SECURITY.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.SECURITY.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    legacyEmail: EMAIL_IDENTITIES.SECURITY.legacy.email,
  },
  HELP: {
    key: "HELP",
    logicalKey: "HELP",
    email: EMAIL_IDENTITIES.HELP.primary.email,
    displayName: EMAIL_IDENTITIES.HELP.primary.name,
    purpose: EMAIL_IDENTITIES.HELP.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.HELP.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.HELP.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    legacyEmail: EMAIL_IDENTITIES.HELP.legacy.email,
  },
  NO_REPLY: {
    key: "NO_REPLY",
    logicalKey: "NO_REPLY",
    email: EMAIL_IDENTITIES.NO_REPLY.primary.email,
    displayName: EMAIL_IDENTITIES.NO_REPLY.primary.name,
    purpose: EMAIL_IDENTITIES.NO_REPLY.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.NO_REPLY.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.NO_REPLY.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    legacyEmail: EMAIL_IDENTITIES.NO_REPLY.legacy.email,
    provider: "BREVO",
  },
  NEWSLETTER: {
    key: "NEWSLETTER",
    logicalKey: "NEWSLETTER",
    email: EMAIL_IDENTITIES.NEWSLETTER.primary.email,
    displayName: EMAIL_IDENTITIES.NEWSLETTER.primary.name,
    purpose: EMAIL_IDENTITIES.NEWSLETTER.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.NEWSLETTER.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.NEWSLETTER.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    provider: "BREVO",
  },
  BLOG: {
    key: "BLOG",
    logicalKey: "BLOG",
    email: EMAIL_IDENTITIES.BLOG.primary.email,
    displayName: EMAIL_IDENTITIES.BLOG.primary.name,
    purpose: EMAIL_IDENTITIES.BLOG.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.BLOG.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.BLOG.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    provider: "BREVO",
  },
  SUPPORT: {
    key: "SUPPORT",
    logicalKey: "SUPPORT",
    email: EMAIL_IDENTITIES.SUPPORT.primary.email,
    displayName: EMAIL_IDENTITIES.SUPPORT.primary.name,
    purpose: EMAIL_IDENTITIES.SUPPORT.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.SUPPORT.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.SUPPORT.primary.isNoReply,
    isLegacy: false,
    domain: PRIMARY_EMAIL_DOMAIN,
    provider: "BREVO",
  },
  LEGACY_HELLO: {
    key: "LEGACY_HELLO",
    logicalKey: "HELLO",
    email: EMAIL_IDENTITIES.HELLO.primary.email,
    displayName: EMAIL_IDENTITIES.HELLO.primary.name,
    purpose: EMAIL_IDENTITIES.HELLO.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.HELLO.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.HELLO.primary.isNoReply,
    isLegacy: true,
    domain: PRIMARY_EMAIL_DOMAIN,
  },
  LEGACY_SECURITY: {
    key: "LEGACY_SECURITY",
    logicalKey: "SECURITY",
    email: EMAIL_IDENTITIES.SECURITY.primary.email,
    displayName: EMAIL_IDENTITIES.SECURITY.primary.name,
    purpose: EMAIL_IDENTITIES.SECURITY.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.SECURITY.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.SECURITY.primary.isNoReply,
    isLegacy: true,
    domain: PRIMARY_EMAIL_DOMAIN,
  },
  LEGACY_HELP: {
    key: "LEGACY_HELP",
    logicalKey: "HELP",
    email: EMAIL_IDENTITIES.HELP.primary.email,
    displayName: EMAIL_IDENTITIES.HELP.primary.name,
    purpose: EMAIL_IDENTITIES.HELP.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.HELP.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.HELP.primary.isNoReply,
    isLegacy: true,
    domain: PRIMARY_EMAIL_DOMAIN,
  },
  LEGACY_NO_REPLY: {
    key: "LEGACY_NO_REPLY",
    logicalKey: "NO_REPLY",
    email: EMAIL_IDENTITIES.NO_REPLY.primary.email,
    displayName: EMAIL_IDENTITIES.NO_REPLY.primary.name,
    purpose: EMAIL_IDENTITIES.NO_REPLY.primary.purpose,
    defaultReplyTo: EMAIL_IDENTITIES.NO_REPLY.primary.defaultReplyTo,
    isNoReply: EMAIL_IDENTITIES.NO_REPLY.primary.isNoReply,
    isLegacy: true,
    domain: PRIMARY_EMAIL_DOMAIN,
  },
};

// =============================================================================
// Rate Limiting (Configurable Server-Side In-Memory + Upstash Sync)
// =============================================================================

interface RateLimitTracker {
  count: number;
  resetTime: number;
  lastTimestamp: number;
}

const adminBurstMap = new Map<string, number[]>();
const adminHourlyMap = new Map<string, RateLimitTracker>();
let globalDailyCount = 0;
let globalDailyReset = Date.now() + 24 * 60 * 60 * 1000;

const BURST_WINDOW_MS = 30 * 1000; // 30 seconds
const MAX_BURST = 5; // Max 5 sends per 30s
const HOURLY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_HOURLY = 30; // Max 30 sends per hour per admin
const MAX_GLOBAL_DAILY = 150; // Safety cap to protect transactional quota

function pruneExpiredAdminRateLimits(now: number) {
  if (adminBurstMap.size > 50) {
    for (const [key, tsList] of adminBurstMap.entries()) {
      const active = tsList.filter((t) => now - t < BURST_WINDOW_MS);
      if (active.length === 0) adminBurstMap.delete(key);
      else adminBurstMap.set(key, active);
    }
  }

  if (adminHourlyMap.size > 50) {
    for (const [key, entry] of adminHourlyMap.entries()) {
      if (now > entry.resetTime) adminHourlyMap.delete(key);
    }
  }
}

export async function checkAdminMailRateLimit(
  adminEmail: string,
  clientIp: string
): Promise<{ allowed: boolean; reason?: string; retryAfterSeconds?: number }> {
  const now = Date.now();
  const normalizedKey = `${adminEmail.toLowerCase()}:${clientIp}`;

  pruneExpiredAdminRateLimits(now);

  // 1. Global Daily Safety Threshold
  if (now > globalDailyReset) {
    globalDailyCount = 0;
    globalDailyReset = now + 24 * 60 * 60 * 1000;
  }

  if (globalDailyCount >= MAX_GLOBAL_DAILY) {
    return {
      allowed: false,
      reason: "Daily administrative outbound email threshold reached. Please try again tomorrow.",
      retryAfterSeconds: Math.ceil((globalDailyReset - now) / 1000),
    };
  }

  // 2. Burst Protection (Max 5 per 30s + 2.5s cooldown)
  const timestamps = adminBurstMap.get(normalizedKey) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < BURST_WINDOW_MS);
  if (recentTimestamps.length >= MAX_BURST) {
    return {
      allowed: false,
      reason: `Burst rate limit reached (max ${MAX_BURST} emails per 30 seconds). Please wait.`,
      retryAfterSeconds: Math.ceil((BURST_WINDOW_MS - (now - recentTimestamps[0])) / 1000),
    };
  }

  const lastSend = recentTimestamps[recentTimestamps.length - 1];
  if (lastSend && now - lastSend < 2500) {
    return {
      allowed: false,
      reason: "Please wait a moment before initiating another email dispatch.",
      retryAfterSeconds: 3,
    };
  }

  // 3. Hourly Admin Quota (Max 30 / hr)
  const hourlyEntry = adminHourlyMap.get(normalizedKey);
  if (hourlyEntry && now < hourlyEntry.resetTime && hourlyEntry.count >= MAX_HOURLY) {
    const retryAfter = Math.ceil((hourlyEntry.resetTime - now) / 1000);
    return {
      allowed: false,
      reason: `Hourly admin mail limit reached (${MAX_HOURLY}/hr). Please retry in ${Math.ceil(retryAfter / 60)} minutes.`,
      retryAfterSeconds: retryAfter,
    };
  }

  return { allowed: true };
}

export function recordAdminMailSend(adminEmail: string, clientIp: string) {
  const now = Date.now();
  const normalizedKey = `${adminEmail.toLowerCase()}:${clientIp}`;

  pruneExpiredAdminRateLimits(now);

  globalDailyCount++;

  const timestamps = adminBurstMap.get(normalizedKey) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < BURST_WINDOW_MS);
  recentTimestamps.push(now);
  adminBurstMap.set(normalizedKey, recentTimestamps);

  const hourlyEntry = adminHourlyMap.get(normalizedKey);
  if (!hourlyEntry || now > hourlyEntry.resetTime) {
    adminHourlyMap.set(normalizedKey, {
      count: 1,
      lastTimestamp: now,
      resetTime: now + HOURLY_WINDOW_MS,
    });
  } else {
    hourlyEntry.count++;
    hourlyEntry.lastTimestamp = now;
  }
}


// =============================================================================
// Zero-Dependency Safe HTML Compiler
// =============================================================================

/**
 * Compiles rich text / markdown into safe, responsive HTML without external dependencies.
 * Strictly whitelists formatting primitives while prohibiting scripts, objects, and iframes.
 */
export function compileSafeHtml(rawText: string, subject = ""): string {
  if (!rawText) return "";

  // 1. Raw character escape to eliminate injection
  let escaped = escapeHtml(rawText);

  // 2. Format images: ![alt](https://...) - only allow valid http/https URLs
  escaped = escaped.replace(
    /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
    `<div style="margin:16px 0;text-align:center;"><img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto;border:1px solid #E2E8F0;" /></div>`
  );

  // 3. Format links: [text](https://...) - only allow valid http/https URLs
  escaped = escaped.replace(
    /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
    `<a href="$2" style="color:#7C3AED;text-decoration:underline;font-weight:600;" target="_blank" rel="noopener noreferrer">$1</a>`
  );

  // 4. Format headings
  escaped = escaped.replace(/^### (.*$)/gim, `<h3 style="font-size:15px;font-weight:700;color:#0F172A;margin:16px 0 6px;">$1</h3>`);
  escaped = escaped.replace(/^## (.*$)/gim, `<h2 style="font-size:17px;font-weight:700;color:#0F172A;margin:18px 0 8px;">$1</h2>`);
  escaped = escaped.replace(/^# (.*$)/gim, `<h1 style="font-size:19px;font-weight:700;color:#0F172A;margin:20px 0 10px;">$1</h1>`);

  // 5. Format paragraphs and line breaks
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("<h") || trimmed.startsWith("<div")) {
        return trimmed;
      }

      let formatted = block.replace(/\n/g, "<br />");
      // Format **bold**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Format *italic*
      formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
      // Format `code`
      formatted = formatted.replace(
        /`(.*?)`/g,
        `<code style="background-color:#f1f5f9;padding:2px 4px;font-size:13px;border-radius:2px;font-family:${EMAIL_TYPOGRAPHY.fontMono};">$1</code>`
      );

      return `<p style="${EMAIL_SPACING.paragraphMargin}color:#1e293b;line-height:1.6;">${formatted}</p>`;
    })
    .join("\n");

  return renderCompactEmailLayout({
    title: subject,
    bodyContentHtml: paragraphs,
    footerType: "STANDARD",
  });
}

// =============================================================================
// Core Brevo Dispatcher Pipeline
// =============================================================================

export interface DispatchAdminMailParams {
  senderKey: MailSenderKey;
  senderName?: string;
  to: MailRecipient[];
  cc?: MailRecipient[];
  bcc?: MailRecipient[];
  subject: string;
  body: string;
  attachments?: { name: string; content: string }[];
  idempotencyKey: string;
  adminEmail: string;
  provider?: "BREVO";
  pacingDelayMs?: number;
  onRecipientProgress?: (current: number, total: number, result: DispatchAdminMailResult) => void;
}

export interface DispatchAdminMailResult {
  success: boolean;
  status: "SENT" | "FAILED" | "DELIVERY_UNCERTAIN";
  messageId?: string;
  error?: string;
  provider?: "BREVO";
}

interface DispatchSingleAttemptParams {
  identity: MailSenderIdentity;
  senderDisplayName: string;
  to: MailRecipient[];
  cc?: MailRecipient[];
  bcc?: MailRecipient[];
  cleanSubject: string;
  htmlContent: string;
  textContent: string;
  attachments?: { name: string; content: string }[];
  idempotencyKey: string;
}

/**
 * Executes a single atomic 1-to-1 dispatch attempt via Brevo REST API v3.
 */
async function dispatchSingleAttempt(
  params: DispatchSingleAttemptParams
): Promise<DispatchAdminMailResult> {
  const {
    identity,
    senderDisplayName,
    to,
    cc,
    bcc,
    cleanSubject,
    htmlContent,
    textContent,
    attachments,
    idempotencyKey,
  } = params;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      status: "FAILED",
      error: "BREVO_API_KEY is not configured in server environment.",
    };
  }

  const payload: Record<string, unknown> = {
    sender: {
      name: senderDisplayName,
      email: identity.email,
    },
    to: to.map((rec) => ({
      email: rec.email.trim().toLowerCase(),
      name: rec.name?.trim() || undefined,
    })),
    replyTo: {
      email: identity.defaultReplyTo,
      name: senderDisplayName,
    },
    subject: cleanSubject,
    htmlContent,
    textContent,
    tags: ["admin_mail", `sender_${identity.key.toLowerCase()}`],
  };

  if (cc && cc.length > 0) {
    payload.cc = cc.map((rec) => ({
      email: rec.email.trim().toLowerCase(),
      name: rec.name?.trim() || undefined,
    }));
  }

  if (bcc && bcc.length > 0) {
    payload.bcc = bcc.map((rec) => ({
      email: rec.email.trim().toLowerCase(),
      name: rec.name?.trim() || undefined,
    }));
  }

  if (attachments && attachments.length > 0) {
    payload.attachment = attachments.map((att) => ({
      name: att.name,
      content: att.content.replace(/^data:[^;]+;base64,/, ""),
    }));
  }

  const brevoIdempotencyKey = formatBrevoIdempotencyKey(idempotencyKey);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const startTime = Date.now();

  try {
    const res = await fetch(BREVO_API_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
        "Idempotency-Key": brevoIdempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));

    if (res.ok && (res.status === 200 || res.status === 201)) {
      const messageId = (data.messageId as string) || "msg_accepted";
      adminLogger.info("dispatchAdminMail:Success", "Brevo accepted outbound mail", {
        idempotencyKey,
        senderKey: identity.key,
        recipientCount: to.length,
        durationMs,
        brevoMessageId: messageId,
      });

      return {
        success: true,
        status: "SENT",
        messageId,
        provider: "BREVO",
      };
    }

    const errorMessage =
      (data.message as string) ||
      (data.error as string) ||
      `Brevo API returned HTTP ${res.status}`;

    if (res.status >= 500) {
      return {
        success: false,
        status: "DELIVERY_UNCERTAIN",
        error: `Provider returned HTTP ${res.status}. Delivery unconfirmed.`,
      };
    }

    return {
      success: false,
      status: "FAILED",
      error: errorMessage,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const error = err as Error;
    const isTimeout = error.name === "AbortError";

    return {
      success: false,
      status: "DELIVERY_UNCERTAIN",
      error: isTimeout
        ? "Brevo email gateway timed out (10s). Delivery status unconfirmed."
        : "Network error connecting to Brevo API. Delivery status unconfirmed.",
    };
  }
}

/**
 * Universal Outbound Email Dispatcher
 *
 * Automatically detects multi-recipient requests and executes individualized 1-by-1
 * sequential delivery with asynchronous pacing (delayMs) to guarantee zero recipient leakage
 * and eliminate burst-rate spam classification across all destination mail servers.
 */
export async function dispatchAdminMail(
  params: DispatchAdminMailParams
): Promise<DispatchAdminMailResult> {
  // 1. Resolve Verified Sender Identity
  const identity = ADMIN_MAIL_SENDERS[params.senderKey];
  if (!identity) {
    return {
      success: false,
      status: "FAILED",
      error: `SENDER_NOT_ALLOWED: Identity "${params.senderKey}" is not authorized.`,
    };
  }

  const cleanSubject = params.subject.replace(/[\r\n]/g, " ").trim();
  const htmlContent = compileSafeHtml(params.body, cleanSubject);
  const textContent = params.body.trim();
  const senderDisplayName = params.senderName?.trim() || identity.displayName || "Gaurav Patil";

  // 2. Sequential 1-by-1 Paced Delivery Engine (When multiple recipients in "to")
  if (params.to.length > 1) {
    const pacingDelayMs = params.pacingDelayMs ?? 1250;
    adminLogger.info(
      "dispatchAdminMail:SequentialPacedMode",
      `Multiple recipients detected (${params.to.length}). Executing sequential 1-by-1 paced delivery (pacing: ${pacingDelayMs}ms).`,
      { senderKey: identity.key, recipientCount: params.to.length }
    );

    let successCount = 0;
    let primaryMessageId = "";
    let lastError = "";

    for (let i = 0; i < params.to.length; i++) {
      const recipient = params.to[i];
      const singleIdempotencyKey = `${params.idempotencyKey}_seq_${i}_${recipient.email.replace(/[^a-zA-Z0-9]/g, "_")}`;

      // CC/BCC are only included with the very first recipient to prevent spamming CC/BCC N times
      const isFirst = i === 0;
      const res = await dispatchSingleAttempt({
        identity,
        senderDisplayName,
        to: [recipient],
        cc: isFirst ? params.cc : undefined,
        bcc: isFirst ? params.bcc : undefined,
        cleanSubject,
        htmlContent,
        textContent,
        attachments: params.attachments,
        idempotencyKey: singleIdempotencyKey,
      });

      if (res.success) {
        successCount++;
        if (!primaryMessageId) primaryMessageId = res.messageId || "";
      } else {
        lastError = res.error || "Unknown dispatch error";
      }

      if (params.onRecipientProgress) {
        params.onRecipientProgress(i + 1, params.to.length, res);
      }

      // Asynchronous pacing delay between dispatches (only between messages, not after the last)
      if (i < params.to.length - 1 && pacingDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, pacingDelayMs));
      }
    }

    const anySucceeded = successCount > 0;
    const allSucceeded = successCount === params.to.length;

    return {
      success: anySucceeded,
      status: allSucceeded ? "SENT" : anySucceeded ? "SENT" : "FAILED",
      messageId: primaryMessageId || `batch_seq_${Date.now()}`,
      provider: "BREVO",
      error: allSucceeded
        ? undefined
        : `Sequential delivery completed: ${successCount}/${params.to.length} delivered. Last error: ${lastError}`,
    };
  }

  // 3. Single Recipient Direct Dispatch
  return dispatchSingleAttempt({
    identity,
    senderDisplayName,
    to: params.to,
    cc: params.cc,
    bcc: params.bcc,
    cleanSubject,
    htmlContent,
    textContent,
    attachments: params.attachments,
    idempotencyKey: params.idempotencyKey,
  });
}

export interface SequentialBatchParams {
  senderKey: MailSenderKey;
  senderName?: string;
  recipients: MailRecipient[];
  subject: string;
  body: string;
  adminEmail: string;
  provider?: "BREVO";
  attachments?: { name: string; content: string }[];
  delayBetweenMs?: number;
  onProgress?: (index: number, total: number, result: DispatchAdminMailResult) => void;
}

export interface SequentialBatchResult {
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    recipient: MailRecipient;
    success: boolean;
    status: "SENT" | "FAILED" | "DELIVERY_UNCERTAIN";
    messageId?: string;
    error?: string;
    provider?: "BREVO";
  }>;
}

/**
 * Sequential Asynchronous Batch Dispatch Engine
 *
 * Dispatches individualized emails to each recipient one-by-one with an asynchronous
 * cadence delay (pacing). Prevents burst-rate spam classification on recipient mail servers
 * (Google Gmail, Yahoo, Microsoft) and guarantees zero recipient leakage.
 */
export async function dispatchSequentialBatch(
  params: SequentialBatchParams
): Promise<SequentialBatchResult> {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const delayMs = params.delayBetweenMs ?? 1200;
  const results: SequentialBatchResult["results"] = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < params.recipients.length; i++) {
    const recipient = params.recipients[i];
    const itemKey = `${batchId}_${i}_${recipient.email.replace(/[^a-zA-Z0-9]/g, "_")}`;

    const res = await dispatchAdminMail({
      senderKey: params.senderKey,
      senderName: params.senderName,
      to: [recipient],
      subject: params.subject,
      body: params.body,
      adminEmail: params.adminEmail,
      provider: params.provider,
      attachments: params.attachments,
      idempotencyKey: itemKey,
    });

    results.push({
      recipient,
      success: res.success,
      status: res.status,
      messageId: res.messageId,
      error: res.error,
      provider: res.provider,
    });

    if (res.success) {
      sent++;
    } else {
      failed++;
    }

    if (params.onProgress) {
      params.onProgress(i + 1, params.recipients.length, res);
    }

    // Pacing delay between recipients to prevent spam burst triggers on Google/Yahoo/Outlook
    if (i < params.recipients.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    total: params.recipients.length,
    sent,
    failed,
    results,
  };
}
