/**
 * Git Push Audit Email Notification Service
 *
 * Dispatches an ultra-minimal, single-view, zero-scroll audit notification
 * whenever changes are pushed to GitHub.
 *
 * Relay Invariant:
 * - Relay: Brevo API v3 (Direct transactional pipeline)
 * - Sender: Gaurav Patil <security@gauravpatil.site>
 * - To: Admin Gmail (gauravpatil5737@gmail.com)
 *
 * Layout Standard:
 * - Ultra-minimal Swiss card (Height ~190-220px, strictly ZERO vertical scroll on mobile/desktop)
 * - Seamless white canvas blending natively with email clients
 * - Compact monospace file badges with ellipsis paths
 */

import { EMAIL_IDENTITIES } from "./identities";
import { sendTransactionalEmail, type SendEmailResult } from "./brevo";
import { sendResendEmail } from "./resend";

export interface GitPushAuditFile {
  status: "MOD" | "ADD" | "DEL" | "REN" | string;
  path: string;
}

export interface GitPushAuditParams {
  commitHash: string;
  commitMessage: string;
  branch?: string;
  authorName?: string;
  authorEmail?: string;
  timestamp?: string | Date;
  filesChanged?: Array<GitPushAuditFile | string> | string;
  insertions?: string;
  deletions?: string;
  repoName?: string;
}

export interface GitPushAuditResult extends SendEmailResult {
  provider?: "RESEND" | "BREVO";
}

function escapeHtml(text?: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatAuditTimestamp(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString();

  return d.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
}

function formatCompactPath(fullPath: string, maxLen = 42): string {
  if (fullPath.length <= maxLen) return fullPath;
  const parts = fullPath.split("/");
  if (parts.length > 2) {
    const end = parts.slice(-2).join("/");
    if (end.length + 4 <= maxLen) return `.../${end}`;
  }
  const basename = parts[parts.length - 1];
  if (basename.length <= maxLen) return `.../${basename}`;
  return fullPath.substring(0, maxLen - 3) + "...";
}

function normalizeFiles(filesInput?: Array<GitPushAuditFile | string> | string): GitPushAuditFile[] {
  if (!filesInput) return [];
  if (Array.isArray(filesInput)) {
    return filesInput.map((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.startsWith("[ADD]") || trimmed.startsWith("A ")) {
          return { status: "ADD", path: trimmed.replace(/^(\[ADD\]|A\s+)/, "").trim() };
        }
        if (trimmed.startsWith("[DEL]") || trimmed.startsWith("D ")) {
          return { status: "DEL", path: trimmed.replace(/^(\[DEL\]|D\s+)/, "").trim() };
        }
        return { status: "MOD", path: trimmed.replace(/^(\[MOD\]|M\s+)/, "").trim() };
      }
      return item;
    });
  }
  if (typeof filesInput === "string") {
    return filesInput
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((p) => ({ status: "MOD", path: p }));
  }
  return [];
}

/**
 * Renders the anti-spam, React Email-inspired, single-view zero-scroll HTML audit card.
 * Total height ~190-220px, strictly fitting within any email client window without scrollbars.
 * Engineered for maximum deliverability (DKIM/SPF aligned, zero spam triggers, clean table markup).
 */
export function renderPushAuditHtml(params: GitPushAuditParams): string {
  const shortHash = params.commitHash ? params.commitHash.substring(0, 7) : "HEAD";
  const safeMessage = escapeHtml(params.commitMessage || "Automated sync");
  const branch = escapeHtml(params.branch || "main");
  const authorName = escapeHtml(params.authorName || "Gaurav Patil");
  const repoName = escapeHtml(params.repoName || "AspiringWebGaurav/gaurav-webdev-portfolio");
  const formattedTime = escapeHtml(formatAuditTimestamp(params.timestamp));
  const commitUrl = `https://github.com/${repoName}/commit/${params.commitHash}`;

  const allFiles = normalizeFiles(params.filesChanged);
  const totalFilesCount = allFiles.length;

  const displayLimit = 3;
  const displayedFiles = allFiles.slice(0, displayLimit);
  const remainingFilesCount = totalFilesCount - displayedFiles.length;

  const fileRowsHtml = displayedFiles.map((file) => {
    let labelColor = "#2563eb";
    let label = "MOD";

    if (file.status === "ADD") {
      labelColor = "#059669";
      label = "ADD";
    } else if (file.status === "DEL") {
      labelColor = "#dc2626";
      label = "DEL";
    } else if (file.status === "REN") {
      labelColor = "#9333ea";
      label = "REN";
    }

    const compactPath = formatCompactPath(file.path);

    return `<tr>
      <td style="padding:2px 0; width:34px; font-family:ui-monospace,Menlo,Monaco,'Cascadia Mono',monospace; font-size:10px; font-weight:700; color:${labelColor}; vertical-align:middle;">
        ${label}
      </td>
      <td style="padding:2px 0; font-family:ui-monospace,Menlo,Monaco,'Cascadia Mono',monospace; font-size:11px; color:#334155; vertical-align:middle; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        ${escapeHtml(compactPath)}
      </td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="color-scheme" content="light" />
  <title>Push Audit #${shortHash}</title>
</head>
<body style="margin:0; padding:12px; background-color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="left" style="max-width:520px; margin:0; border-collapse:collapse;">
    <tr>
      <td style="padding:0;">
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:16px 18px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          
          <!-- Header Badge: Minimalist Swiss typography (Zero Emojis, Zero Tickmarks) -->
          <div style="margin-bottom:10px;">
            <span style="display:inline-block; padding:2px 8px; background-color:#f5f3ff; border:1px solid #ddd6fe; color:#7c3aed; font-size:10px; font-family:ui-monospace,Menlo,Monaco,monospace; font-weight:700; border-radius:3px; letter-spacing:0.5px; text-transform:uppercase;">
              PUSH AUDIT &bull; #${shortHash} (${branch})
            </span>
          </div>

          <!-- Commit Message -->
          <div style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#0f172a; line-height:1.45; word-break:break-word;">
            ${safeMessage}
          </div>

          <!-- Meta Strip: Author, Timestamp, Diff Stats -->
          <div style="font-size:11px; color:#64748b; margin-bottom:10px;">
            <span style="font-weight:600; color:#334155;">${authorName}</span>
            <span style="color:#cbd5e1; margin:0 4px;">&bull;</span>
            <span>${formattedTime}</span>
            ${params.insertions || params.deletions ? `
            <span style="color:#cbd5e1; margin:0 4px;">&bull;</span>
            <span style="color:#059669; font-weight:600; font-family:ui-monospace,Menlo,Monaco,monospace;">${escapeHtml(params.insertions || "+0")}</span>
            <span style="color:#cbd5e1; margin:0 2px;">/</span>
            <span style="color:#dc2626; font-weight:600; font-family:ui-monospace,Menlo,Monaco,monospace;">${escapeHtml(params.deletions || "-0")}</span>
            ` : ""}
          </div>

          <!-- Monospace Files Box -->
          ${totalFilesCount > 0 ? `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:6px 10px; font-family:ui-monospace,Menlo,Monaco,monospace;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${fileRowsHtml}
            </table>
          </div>
          ` : ""}

          <!-- Micro Action & Origin Strip: Inside Card for Pure Single-View Zero-Scroll -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px; font-size:11px; border-collapse:collapse;">
            <tr>
              <td align="left" style="color:#64748b; font-size:11px; vertical-align:middle;">
                ${totalFilesCount} files changed ${remainingFilesCount > 0 ? `&bull; +${remainingFilesCount} more` : ""}
              </td>
              <td align="right" style="vertical-align:middle;">
                <a href="${commitUrl}" style="color:#7c3aed; text-decoration:none; font-weight:600; font-size:11px;">View diff on GitHub &rarr;</a>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px; padding-top:6px; border-top:1px solid #f1f5f9; font-size:10px; border-collapse:collapse;">
            <tr>
              <td align="left" style="color:#94a3b8; font-size:10px;">
                Gaurav Portfolio Infrastructure &bull; India
              </td>
              <td align="right" style="color:#94a3b8; font-size:10px;">
                Pre-Push Gate Passed
              </td>
            </tr>
          </table>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderPushAuditText(params: GitPushAuditParams): string {
  const shortHash = params.commitHash ? params.commitHash.substring(0, 7) : "HEAD";
  const formattedTime = formatAuditTimestamp(params.timestamp);
  const repoName = params.repoName || "AspiringWebGaurav/gaurav-webdev-portfolio";
  const branch = params.branch || "main";
  const files = normalizeFiles(params.filesChanged);
  const diffStats = params.insertions || params.deletions ? ` (${params.insertions || ""} ${params.deletions || ""})`.trim() : "";

  return `[GIT PUSH AUDIT]
Status: VERIFIED (Pre-Push Gate Passed)
Commit: #${shortHash} (${branch})
Message: ${params.commitMessage}
Actor: ${params.authorName || "Gaurav Patil"} <${params.authorEmail || "gauravpatil5737@gmail.com"}>
Time: ${formattedTime}
Changes: ${files.length} files${diffStats ? ` ${diffStats}` : ""}
${files.slice(0, 5).map((f) => `- [${f.status}] ${f.path}`).join("\n")}
${files.length > 5 ? `+ ${files.length - 5} more files\n` : ""}
Diff: https://github.com/${repoName}/commit/${params.commitHash}

Sent by Gaurav Portfolio Infrastructure • India`;
}

/**
 * Dispatches the push audit email.
 * Strategy:
 * 1. Primary: Resend API (Dedicated relay preserving Brevo quota).
 * 2. Failover: Brevo REST API v3 (Automatic fallback if Resend fails or key absent).
 */
export async function sendGitPushAuditEmail(params: GitPushAuditParams): Promise<GitPushAuditResult> {
  const adminEmail =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.BREVO_NOTIFICATION_RECIPIENT?.trim() ||
    "gauravpatil5737@gmail.com";

  const shortHash = params.commitHash ? params.commitHash.substring(0, 7) : "HEAD";
  const subject = `Push Audit #${shortHash}`;
  const html = renderPushAuditHtml(params);
  const text = renderPushAuditText(params);

  // 1. Attempt Primary Dispatch via Resend
  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      const resendResult = await sendResendEmail({
        from: `Gaurav Patil <${EMAIL_IDENTITIES.SECURITY.email}>`,
        to: [{ email: adminEmail, name: "Gaurav Patil" }],
        replyTo: { email: EMAIL_IDENTITIES.SECURITY.email, name: "Gaurav Patil" },
        subject,
        html,
        text,
        tags: [
          { name: "category", value: "git_push_audit" },
          { name: "environment", value: "production" },
        ],
      });

      if (resendResult.success) {
        return {
          success: true,
          messageId: resendResult.messageId,
          statusCode: resendResult.statusCode || 200,
          provider: "RESEND",
        };
      }

      console.warn("⚠️ Warning: Resend push audit dispatch failed, executing Brevo failover:", resendResult.error);
    } catch (resendErr: unknown) {
      console.warn("⚠️ Warning: Resend exception during push audit, executing Brevo failover:", (resendErr as Error).message);
    }
  }

  // 2. Automatic Failover to Brevo REST API v3
  const brevoResult = await sendTransactionalEmail({
    purpose: "SECURITY_ALERT",
    identity: EMAIL_IDENTITIES.SECURITY,
    to: [{ email: adminEmail, name: "Gaurav Patil" }],
    replyTo: { email: EMAIL_IDENTITIES.SECURITY.email, name: "Gaurav Patil" },
    subject,
    htmlContent: html,
    textContent: text,
    tags: ["git_push_audit", "security_log"],
  });

  return {
    ...brevoResult,
    provider: "BREVO",
  };
}

