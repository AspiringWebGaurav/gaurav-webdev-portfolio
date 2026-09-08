/**
 * Core Mailercloud High-Capacity Email Service
 *
 * Dedicated server-side driver for Mailercloud Email API (12,000 emails/month).
 * Optimized for rich media, image-heavy emails, newsletter subscriber broadcasts,
 * and future blogging notifications.
 *
 * Security Mandate: Never expose MAILERCLOUD_API_KEY to browser/client-side code.
 */

import { adminLogger } from "@/lib/admin/logger";

const MAILERCLOUD_EMAIL_API_ENDPOINT = "https://email-api.mailercloud.com/email";

export interface MailercloudRecipient {
  email: string;
  name?: string;
}

export interface MailercloudAttachment {
  name: string;
  url?: string;
}

export interface SendMailercloudEmailOptions {
  from?: string;
  fromName?: string;
  to: MailercloudRecipient[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailercloudAttachment[];
  idempotencyKey?: string;
}

export interface SendMailercloudResult {
  success: boolean;
  status: "SENT" | "FAILED" | "DELIVERY_UNCERTAIN";
  messageId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Executes an authenticated HTTP POST to Mailercloud Email API.
 */
export async function sendMailercloudEmail(
  options: SendMailercloudEmailOptions
): Promise<SendMailercloudResult> {
  const apiKey = process.env.MAILERCLOUD_API_KEY;
  if (!apiKey) {
    adminLogger.error(
      "sendMailercloudEmail",
      new Error("MAILERCLOUD_API_KEY missing"),
      "Missing API key in environment"
    );
    return {
      success: false,
      status: "FAILED",
      error: "MAILERCLOUD_API_KEY is not configured in server environment.",
    };
  }

  const cleanSubject = options.subject.replace(/[\r\n]/g, " ").trim();
  const fromEmail = options.from?.trim() || "newsletter@gauravpatil.site";
  const fromName = options.fromName?.trim() || "Gaurav Patil";
  const replyTo = options.replyTo?.trim() || "newsletter@gauravpatil.site";

  const emailPayload: Record<string, unknown> = {
    from: fromEmail,
    fromName,
    subject: cleanSubject,
    html: options.html,
    text: options.text || "",
    reply_to: replyTo,
    recipients: {
      to: options.to.map((rec) => ({
        email: rec.email.trim().toLowerCase(),
        name: rec.name?.trim() || undefined,
      })),
    },
  };

  if (options.attachments && options.attachments.length > 0) {
    emailPayload.attachments = options.attachments.map((att) => ({
      name: att.name,
      url: att.url,
    }));
  }

  const requestBody = {
    version: "1.0",
    email: emailPayload,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const startTime = Date.now();

  try {
    const res = await fetch(MAILERCLOUD_EMAIL_API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));

    if (res.ok && (res.status === 200 || res.status === 201)) {
      const isSuccess = data.status === "SUCCESS" || data.statusCode === 1000;
      if (isSuccess) {
        const messageId = (data.message as string) || `mc_${Date.now()}`;
        adminLogger.info("sendMailercloudEmail:Success", "Mailercloud accepted outbound email", {
          idempotencyKey: options.idempotencyKey,
          recipientCount: options.to.length,
          durationMs,
          mailercloudMessageId: messageId,
        });

        return {
          success: true,
          status: "SENT",
          messageId,
          statusCode: res.status,
        };
      }
    }

    // Handle provider rejection
    const errorMessage =
      (data.message as string) ||
      (data.error as string) ||
      (Array.isArray(data.errors) ? JSON.stringify(data.errors) : `Mailercloud returned HTTP ${res.status}`);

    if (res.status >= 500) {
      adminLogger.warn(
        "sendMailercloudEmail:Ambiguous5xx",
        `Ambiguous HTTP ${res.status} from Mailercloud`,
        { status: res.status, error: errorMessage, durationMs }
      );
      return {
        success: false,
        status: "DELIVERY_UNCERTAIN",
        error: `Mailercloud returned HTTP ${res.status}. Delivery unconfirmed.`,
        statusCode: res.status,
      };
    }

    adminLogger.warn("sendMailercloudEmail:Rejection", "Mailercloud rejected email dispatch", {
      status: res.status,
      error: errorMessage,
      durationMs,
    });

    return {
      success: false,
      status: "FAILED",
      error: errorMessage,
      statusCode: res.status,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const error = err as Error;
    const isTimeout = error.name === "AbortError";

    adminLogger.warn(
      "sendMailercloudEmail:NetworkException",
      isTimeout ? "Mailercloud gateway timed out" : "Network exception in Mailercloud dispatch",
      {
        isTimeout,
        error: error.message,
        durationMs: Date.now() - startTime,
      }
    );

    return {
      success: false,
      status: "DELIVERY_UNCERTAIN",
      error: isTimeout
        ? "Mailercloud gateway timed out (10s). Delivery status unconfirmed."
        : "Network error connecting to Mailercloud API. Delivery status unconfirmed.",
    };
  }
}
