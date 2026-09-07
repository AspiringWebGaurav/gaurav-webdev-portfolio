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
• Terms of Service: ${termsUrl} (Standard terms, engineering deliverables, and acceptable use)
• Privacy Policy: ${privacyUrl} (Data minimization, zero tracking cookies, and encryption safeguards)
• Security Architecture: ${securityUrl} (Technical safeguards and responsible disclosure)
• Accessibility Statement: ${accessibilityUrl} (WCAG 2.1 AA compliance and inclusive design commitment)
• Contact & Inquiries: ${contactUrl} (Direct developer outreach and confidential inquiries)

Review updated ${docTitle.toLowerCase()}:
${policyUrl}

Sincerely,
Gaurav Patil
Gaurav Portfolio

-------------------------------------------------------------------------------
Terms: ${termsUrl}
Privacy: ${privacyUrl}
Security: ${securityUrl}
Accessibility: ${accessibilityUrl}
Contact: ${contactUrl}

Gaurav Portfolio • Full-Stack Engineer • ${appBaseUrl.replace(/^https?:\/\//, "")}
You have received this mandatory service announcement to update you about important changes to Gaurav Portfolio.
Please do not reply to this email, as replies to this automated address are not monitored.
`.trim();

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px 16px;background-color:#ffffff;font-family:'Google Sans',Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#202124;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:580px;margin:0 auto;">
    <tr>
      <td style="padding:0;font-family:'Google Sans',Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        
        <!-- Google-Style Header Logo -->
        <div style="margin-bottom:16px;">
          <span style="font-size:24px;font-weight:600;color:#1a73e8;letter-spacing:-0.5px;">Gaurav</span>
          <span style="font-size:24px;font-weight:400;color:#5f6368;letter-spacing:-0.5px;"> Portfolio</span>
        </div>

        <!-- Google-Style Top Divider -->
        <hr style="border:none;border-top:1px solid #dadce0;margin:0 0 24px 0;" />

        <!-- Google-Style Primary Headline -->
        <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:400;color:#1a73e8;line-height:1.25;letter-spacing:-0.2px;">
          ${escapeHtml(headlineTitle)}
        </h1>

        <!-- Greeting -->
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#202124;">
          ${escapeHtml(greeting)}
        </p>

        <!-- Context Sentence -->
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#3c4043;">
          You're receiving this email as per policy and acceptance of use, because you may have used my services, accessed authenticated services, or interacted with Gaurav Portfolio.
        </p>

        <!-- Core Update Prose (Clean Developer Policy Notice & Reassurance) -->
        ${prose.html}

        <!-- Current Agreements & Platform Resources List -->
        <div style="margin:20px 0 22px 0;">
          <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#202124;">
            Current platform agreements &amp; resources:
          </p>
          <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.9;color:#1a73e8;">
            <li style="margin-bottom:4px;">
              <a href="${termsUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:underline;font-weight:500;">Terms of Service</a>
              <span style="color:#5f6368;"> &mdash; Standard terms, engineering deliverables, and acceptable use</span>
            </li>
            <li style="margin-bottom:4px;">
              <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:underline;font-weight:500;">Privacy Policy</a>
              <span style="color:#5f6368;"> &mdash; Data minimization, zero tracking cookies, and encryption safeguards</span>
            </li>
            <li style="margin-bottom:4px;">
              <a href="${securityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:underline;font-weight:500;">Security Architecture &amp; Disclosures</a>
              <span style="color:#5f6368;"> &mdash; Technical safeguards and responsible disclosure reporting</span>
            </li>
            <li style="margin-bottom:4px;">
              <a href="${accessibilityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:underline;font-weight:500;">Accessibility Statement</a>
              <span style="color:#5f6368;"> &mdash; WCAG 2.1 AA compliance and inclusive design commitment</span>
            </li>
            <li style="margin-bottom:4px;">
              <a href="${contactUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:underline;font-weight:500;">Contact &amp; Confidential Inquiries</a>
              <span style="color:#5f6368;"> &mdash; Direct developer outreach and private communication</span>
            </li>
          </ul>
        </div>

        <!-- Google-Style Action CTA Button -->
        <div style="margin:22px 0 28px 0;">
          <a href="${policyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#1a73e8;color:#ffffff;font-size:14px;font-weight:500;padding:10px 24px;border-radius:4px;text-decoration:none;letter-spacing:0.01em;">
            Review updated ${escapeHtml(docTitle.toLowerCase())}
          </a>
        </div>

        <!-- Google-Style Sign-Off -->
        <div style="margin:24px 0 0 0;font-size:14px;line-height:1.6;color:#3c4043;">
          Sincerely,<br />
          <strong style="color:#202124;">Gaurav Patil</strong><br />
          <span style="color:#5f6368;">Gaurav Portfolio</span>
        </div>

        <!-- Google-Style Bottom Divider -->
        <hr style="border:none;border-top:1px solid #dadce0;margin:32px 0 20px 0;" />

        <!-- Clean Enterprise Footer Navigation (Zero Broken Symbols) -->
        <div style="text-align:center;margin:0 0 16px 0;font-size:12px;color:#5f6368;line-height:1.8;">
          <a href="${termsUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Terms of Service</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Privacy Policy</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${securityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Security</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${accessibilityUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Accessibility</a>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <a href="${contactUrl}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;font-weight:500;">Contact</a>
        </div>

        <!-- Google-Style Legal Entity & Mandatory Notice -->
        <div style="text-align:center;font-size:12px;color:#70757a;line-height:1.5;margin-bottom:8px;">
          Gaurav Portfolio &bull; Full-Stack Engineer &bull; <a href="${appBaseUrl}" style="color:#70757a;text-decoration:none;">${appBaseUrl.replace(/^https?:\/\//, "")}</a>
        </div>

        <p style="margin:0 0 16px 0;font-size:11px;line-height:1.5;color:#70757a;text-align:center;">
          You have received this mandatory service announcement to update you about important changes to Gaurav Portfolio.<br />
          Please do not reply to this email, as replies to this automated address are not monitored.
        </p>

        <!-- Google-Style Bottom Watermark -->
        <div style="text-align:center;margin-top:16px;">
          <span style="font-size:16px;font-weight:600;color:#1a73e8;letter-spacing:-0.4px;">Gaurav</span>
          <span style="font-size:16px;font-weight:400;color:#70757a;letter-spacing:-0.4px;"> Portfolio</span>
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
}): Promise<SendEmailResult> {
  const { subject, htmlContent, textContent } = buildLegalNotificationEmail({
    docType: params.docType,
    version: params.version,
    effectiveDate: params.effectiveDate,
    lastUpdatedDate: params.lastUpdatedDate,
    changeSummary: params.changeSummary,
    recipientName: params.toName,
    recipientType: params.recipientType,
  });

  return await sendTransactionalEmail({
    identity: EMAIL_IDENTITIES.NO_REPLY,
    senderName: "Gaurav Portfolio",
    to: [{ email: params.toEmail, name: params.toName }],
    replyTo: { email: EMAIL_IDENTITIES.NO_REPLY.email, name: "Gaurav Portfolio" },
    subject,
    htmlContent,
    textContent,
    idempotencyKey: params.idempotencyKey,
  });
}
