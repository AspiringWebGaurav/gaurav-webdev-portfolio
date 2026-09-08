/**
 * Legal Update Notification Email Builder & Sender
 *
 * Dispatches a beautifully crafted announcement letter inspired by Google Payments:
 * - Direct, professional opening ("We're updating our terms of service")
 * - Bolds the core update and effective date milestone
 * - "No action required / no impact" reassurance paragraph
 * - Clean list of current legal agreements
 * - "Sincerely, Gaurav Patil" sign-off
 * - Google-style Help Center and Contact Us footer links
 * - Zero internal logs, zero version numbers (e.g. 0.0.2)
 * - Sourced strictly from no-reply@gauravpatil.site with no-reply routing
 */

import { EMAIL_IDENTITIES } from "./identities";
import { sendTransactionalEmail, SendEmailResult, escapeHtml, resolveAppUrl } from "./brevo";
import { sendResendEmail } from "./resend";
import { formatLegalSummaryProse } from "../legal/prose";


export interface BuildLegalNotificationParams {
  docType: "TERMS" | "PRIVACY";
  version: string;
  effectiveDate: string;
  lastUpdatedDate?: string;
  changeSummary: string;
  recipientName?: string;
  recipientType?: "VISITOR" | "ADMIN_AUDIT";
}

export { formatLegalSummaryProse };

export function buildLegalNotificationEmail(params: BuildLegalNotificationParams): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const docTitle = params.docType === "TERMS" ? "Terms of Service" : "Privacy Policy";
  const rawBaseUrl = resolveAppUrl();
  const appBaseUrl = rawBaseUrl.includes("localhost") ? "https://gauravpatil.site" : rawBaseUrl;
  const termsUrl = `${appBaseUrl}/terms`;
  const privacyUrl = `${appBaseUrl}/privacy`;
  const securityUrl = `${appBaseUrl}/security`;
  const accessibilityUrl = `${appBaseUrl}/accessibility`;
  const contactUrl = `${appBaseUrl}/#contact`;
  const policyUrl = params.docType === "TERMS" ? termsUrl : privacyUrl;

  // Single-entity subject line & headline (Rule 2.12 compliant: zero corporate plurals)
  // Calm, simple enterprise format (like Google, Stripe, Apple) to prevent spam flagging
  const subject =
    params.docType === "TERMS"
      ? "Terms of Service Update"
      : "Privacy Policy Update";

  const headlineTitle =
    params.docType === "TERMS"
      ? "Terms of Service Update"
      : "Privacy Policy Update";

  const recipientName = params.recipientName?.trim();
  const greeting =
    recipientName && recipientName !== "Visitor"
      ? `Dear ${recipientName},`
      : "Dear Customer,";

  const safeEffectiveDate = escapeHtml(params.effectiveDate);
  const safeLastUpdatedDate = params.lastUpdatedDate ? escapeHtml(params.lastUpdatedDate) : undefined;
  const prose = formatLegalSummaryProse(docTitle, safeEffectiveDate, safeLastUpdatedDate);

  const textContent = `
${headlineTitle}

${greeting}

You're receiving this email as per policy and acceptance of use, because you may have used my services, accessed authenticated services, or interacted with Gaurav Portfolio.

${prose.text}

Current platform agreements & resources:
• Terms of Service: ${termsUrl} (Standard terms, deliverables, and acceptable use)
• Privacy Policy: ${privacyUrl} (Data minimization, zero cookies, and encryption safeguards)
• Security Architecture: ${securityUrl} (Technical safeguards and responsible disclosure)
• Accessibility Statement: ${accessibilityUrl} (WCAG 2.1 AA compliance and inclusive design commitment)
• Contact & Inquiries: ${contactUrl} (Direct developer outreach and private communication)

Review updated ${docTitle.toLowerCase()}:
${policyUrl}

Sincerely,
Gaurav Patil
Gaurav Portfolio

-------------------------------------------------------------------------------
Terms: ${termsUrl} • Privacy: ${privacyUrl} • Security: ${securityUrl}
Accessibility: ${accessibilityUrl} • Contact: ${contactUrl}

Gaurav Portfolio • Full-Stack Engineer • India • ${appBaseUrl.replace(/^https?:\/\//, "")}
Mandatory service announcement • Replies to this automated address are not monitored.
`.trim();

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px 16px;background-color:#ffffff;font-family:'Google Sans',Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#202124;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:580px;margin:0 auto;">
    <tr>
      <td style="padding:0;font-family:'Google Sans',Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        
        <!-- Header: Logo & Symmetric Revision Badge -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
          <tr>
            <td align="left" style="vertical-align:middle;">
              <span style="font-size:22px;font-weight:600;color:#1a73e8;letter-spacing:-0.5px;">Gaurav</span>
              <span style="font-size:22px;font-weight:400;color:#5f6368;letter-spacing:-0.5px;"> Portfolio</span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="display:inline-block;padding:3px 9px;border-radius:12px;background-color:#e8f0fe;color:#1967d2;font-size:11px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;">
                Legal Revision
              </span>
            </td>
          </tr>
        </table>

        <!-- Top Divider -->
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px 0;" />

        <!-- Primary Headline -->
        <h1 style="margin:0 0 16px 0;font-size:23px;font-weight:500;color:#1a73e8;line-height:1.3;letter-spacing:-0.2px;">
          ${escapeHtml(headlineTitle)}
        </h1>

        <!-- Greeting -->
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#202124;">
          ${escapeHtml(greeting)}
        </p>

        <!-- Context Sentence -->
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3c4043;">
          You're receiving this email as per policy and acceptance of use, because you may have used my services, accessed authenticated services, or interacted with Gaurav Portfolio.
        </p>

        <!-- Core Update Prose (Clean Developer Policy Notice & Reassurance) -->
        ${prose.html}

        <!-- Symmetric Agreement Resources Container Box -->
        <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin:18px 0 22px 0;">
          <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:8px;">
            Current platform agreements &amp; resources:
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:12px;line-height:1.8;">
            <tr>
              <td style="padding:2px 0;">
                <a href="${termsUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Terms of Service</a>
                <span style="color:#5f6368;"> &mdash; Standard terms, deliverables, and acceptable use</span>
              </td>
            </tr>
            <tr>
              <td style="padding:2px 0;">
                <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Privacy Policy</a>
                <span style="color:#5f6368;"> &mdash; Data minimization, zero cookies, and encryption safeguards</span>
              </td>
            </tr>
            <tr>
              <td style="padding:2px 0;">
                <a href="${securityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Security Architecture</a>
                <span style="color:#5f6368;"> &mdash; Technical safeguards and responsible disclosure</span>
              </td>
            </tr>
            <tr>
              <td style="padding:2px 0;">
                <a href="${accessibilityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Accessibility Statement</a>
                <span style="color:#5f6368;"> &mdash; WCAG 2.1 AA compliance and inclusive design commitment</span>
              </td>
            </tr>
            <tr>
              <td style="padding:2px 0;">
                <a href="${contactUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Contact &amp; Inquiries</a>
                <span style="color:#5f6368;"> &mdash; Direct developer outreach and private communication</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Bulletproof Action CTA Button -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:20px 0 24px 0;">
          <tr>
            <td align="left" style="border-radius:6px;background-color:#1a73e8;">
              <a href="${policyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 22px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.01em;">
                Review updated ${escapeHtml(docTitle.toLowerCase())} &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- Sign-Off -->
        <div style="margin:20px 0 0 0;font-size:14px;line-height:1.6;color:#3c4043;">
          Sincerely,<br />
          <strong style="color:#202124;">Gaurav Patil</strong><br />
          <span style="color:#5f6368;font-size:13px;">Gaurav Portfolio</span>
        </div>

        <!-- Symmetric Bottom Divider -->
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px 0;" />

        <!-- Clean Symmetric 3-Tier Footer -->
        <div style="text-align:center;margin:0 0 10px 0;font-size:12px;color:#5f6368;line-height:1.6;">
          <a href="${termsUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Terms</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Privacy</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${securityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Security</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${accessibilityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Accessibility</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${contactUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Contact</a>
        </div>

        <div style="text-align:center;font-size:11px;color:#70757a;line-height:1.6;margin-bottom:6px;">
          Gaurav Portfolio &bull; Full-Stack Engineer &bull; India &bull; <a href="${appBaseUrl}" style="color:#70757a;text-decoration:none;">${appBaseUrl.replace(/^https?:\/\//, "")}</a>
        </div>

        <div style="text-align:center;font-size:11px;color:#9aa0a6;line-height:1.5;">
          Mandatory service announcement &bull; Replies to this automated address are not monitored
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    htmlContent,
    textContent,
  };
}

export interface LegalNotificationResult extends SendEmailResult {
  provider?: "RESEND" | "BREVO";
}

export async function sendLegalNotificationEmail(params: {
  toEmail: string;
  toName?: string;
  docType: "TERMS" | "PRIVACY";
  version: string;
  effectiveDate: string;
  lastUpdatedDate?: string;
  changeSummary: string;
  recipientType?: "VISITOR" | "ADMIN_AUDIT";
  idempotencyKey?: string;
  provider?: "RESEND" | "BREVO" | "AUTO";
}): Promise<LegalNotificationResult> {
  const { subject, htmlContent, textContent } = buildLegalNotificationEmail({
    docType: params.docType,
    version: params.version,
    effectiveDate: params.effectiveDate,
    lastUpdatedDate: params.lastUpdatedDate,
    changeSummary: params.changeSummary,
    recipientName: params.toName,
    recipientType: params.recipientType,
  });

  const providerPreference = params.provider || "AUTO";

  // 1. Attempt Primary Dispatch via Resend (when AUTO or RESEND)
  if (providerPreference !== "BREVO" && process.env.RESEND_API_KEY?.trim()) {
    try {
      const resendResult = await sendResendEmail({
        from: `Gaurav Portfolio <${EMAIL_IDENTITIES.NO_REPLY.email}>`,
        to: [{ email: params.toEmail, name: params.toName }],
        replyTo: { email: EMAIL_IDENTITIES.NO_REPLY.email, name: "Gaurav Portfolio" },
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: "category", value: "legal_update" },
          { name: "document_type", value: params.docType.toLowerCase() },
          { name: "version", value: params.version },
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

      console.warn("⚠️ Warning: Resend legal notification failed, falling back to Brevo:", resendResult.error);
    } catch (resendErr) {
      console.warn("⚠️ Warning: Resend exception during legal notification, falling back to Brevo:", (resendErr as Error).message);
    }
  }

  // 2. Automatic Failover to Brevo REST API v3
  const brevoResult = await sendTransactionalEmail({
    identity: EMAIL_IDENTITIES.NO_REPLY,
    senderName: "Gaurav Portfolio",
    to: [{ email: params.toEmail, name: params.toName }],
    replyTo: { email: EMAIL_IDENTITIES.NO_REPLY.email, name: "Gaurav Portfolio" },
    subject,
    htmlContent,
    textContent,
    idempotencyKey: params.idempotencyKey,
  });

  return {
    ...brevoResult,
    provider: "BREVO",
  };
}

