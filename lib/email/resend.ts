/**
 * Core Resend Transactional Email Service
 *
 * Dedicated outbound client for Resend API.
 * Features:
 * - Direct official SDK and resilient HTTP fetch fallback
 * - 10s AbortController timeout protection
 * - Automatic multipart generation (HTML + Plain Text) to prevent spam filtering
 * - Structured error handling with zero unhandled exceptions
 */

const RESEND_API_ENDPOINT = "https://api.resend.com/emails";


export interface ResendRecipient {
  email: string;
  name?: string;
}

export interface ResendAttachment {
  filename: string;
  content: string; // Base64 string or raw content
  contentType?: string;
}

export interface SendResendEmailOptions {
  from?: string;
  to: string | string[] | ResendRecipient[];
  cc?: string | string[] | ResendRecipient[];
  bcc?: string | string[] | ResendRecipient[];
  replyTo?: string | ResendRecipient;
  subject: string;
  html: string;
  text?: string;
  attachments?: ResendAttachment[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
}

export interface SendResendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Strips HTML tags to produce a clean plain-text fallback if one is not provided.
 * Critical for spam filter avoidance (multipart requirement).
 */
export function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&bull;/g, "•")
    .replace(/&rarr;/g, "->")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Formats a recipient into "Name <email@example.com>" or "email@example.com"
 */
function formatRecipient(rec: string | ResendRecipient): string {
  if (typeof rec === "string") return rec.trim();
  if (rec.name?.trim()) {
    return `${rec.name.trim()} <${rec.email.trim()}>`;
  }
  return rec.email.trim();
}

function normalizeRecipients(
  recs?: string | string[] | ResendRecipient[]
): string[] {
  if (!recs) return [];
  if (typeof recs === "string") return [recs.trim()];
  return recs.map(formatRecipient);
}

/**
 * Dispatches an email via Resend with timeout safety and dual multipart.
 */
export async function sendResendEmail(
  options: SendResendEmailOptions
): Promise<SendResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured in server environment.",
    };
  }

  const from = options.from?.trim() || "Gaurav Patil <security@gauravpatil.site>";
  const to = normalizeRecipients(options.to);
  const cc = normalizeRecipients(options.cc);
  const bcc = normalizeRecipients(options.bcc);

  if (to.length === 0) {
    return {
      success: false,
      error: "At least one recipient is required.",
    };
  }

  let replyTo: string | undefined;
  if (options.replyTo) {
    replyTo = formatRecipient(options.replyTo);
  }

  // Ensure plain text exists for spam score optimization
  const text = options.text?.trim() || stripHtmlToText(options.html);

  // Direct REST API fetch with 10s AbortController timeout protection
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const restPayload: Record<string, unknown> = {
      from,
      to,
      subject: options.subject,
      html: options.html,
      text,
    };

    if (cc.length > 0) restPayload.cc = cc;
    if (bcc.length > 0) restPayload.bcc = bcc;
    if (replyTo) restPayload.reply_to = replyTo;
    if (options.tags) {
      restPayload.tags = options.tags.map((tag) => ({
        name: tag.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256),
        value: tag.value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256),
      }));
    }
    if (options.headers) restPayload.headers = options.headers;
    if (options.attachments) {
      restPayload.attachments = options.attachments.map((att) => ({
        filename: att.filename,
        content: att.content.replace(/^data:[^;]+;base64,/, ""),
        content_type: att.contentType,
      }));
    }

    const res = await fetch(RESEND_API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(restPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        success: true,
        messageId: (data.id as string) || "resend_accepted",
        statusCode: res.status,
      };
    }

    return {
      success: false,
      error: (data.message as string) || `Resend API returned HTTP ${res.status}`,
      statusCode: res.status,
    };
  } catch (fetchErr: unknown) {
    clearTimeout(timeoutId);
    const errorObj = fetchErr as Error;
    return {
      success: false,
      error: errorObj.message || "Network error communicating with Resend.",
      statusCode: 500,
    };
  }
}

