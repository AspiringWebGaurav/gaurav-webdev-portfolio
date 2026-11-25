/**
 * Downex Admin Email Framework — OTP Verification Email
 *
 * Ultra-compact single-view transactional email template for Downex Admin,
 * strictly matching the portfolio admin email pattern and optimized for Android
 * mobile screens (zero scrolling required, fits entirely in one screen view).
 */

import { sendTransactionalEmail, escapeHtml } from "./brevo";

export interface DownexOtpEmailParams {
  email: string;
  otp: string;
  clientIp?: string | null;
  userAgent?: string;
  expiresMinutes?: number;
}

export async function dispatchDownexAdminOtpEmail(params: DownexOtpEmailParams) {
  const expiresMin = params.expiresMinutes || 5;
  const safeOtp = escapeHtml(params.otp.trim());

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Downex Admin Verification Code</title>
</head>
<body style="margin:0;padding:12px 14px;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#111827;line-height:1.45;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="left" style="border-collapse:collapse;margin:0 auto;max-width:480px;width:100%;">
    <tr>
      <td align="left" style="padding:0;text-align:left;">

        <!-- Header: Minimal Brand Row -->
        <div style="margin:0 0 10px 0;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="vertical-align:middle;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:800;color:#09090b;letter-spacing:-0.5px;">downex</span>
                <span style="font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;margin-left:6px;padding:2px 6px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:3px;display:inline-block;">admin</span>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:9.5px;color:#6b7280;text-transform:uppercase;">Security Code</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Greeting & Single-line Context -->
        <p style="margin:0 0 6px 0;font-weight:600;color:#111827;font-size:14px;">Hi Gaurav,</p>
        <p style="margin:0 0 10px 0;color:#374151;font-size:13.5px;line-height:1.4;">Here is your verification code to complete sign-in to the Downex Admin Panel:</p>

        <!-- Large Mono Passcode Block (Instant 1-view glance & easy tap-copy) -->
        <div style="margin:10px 0 10px 0;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #10b981;border-radius:4px;text-align:center;">
          <span style="font-family:-apple-system,BlinkMacSystemFont,'SFMono-Regular',Consolas,'Courier New',monospace;font-size:30px;font-weight:800;letter-spacing:6px;color:#09090b;line-height:1.15;display:inline-block;">${safeOtp}</span>
        </div>

        <!-- Expiry Helper Text -->
        <p style="margin:0 0 8px 0;font-size:12.5px;color:#6b7280;line-height:1.4;">
          This code is valid for ${expiresMin} minutes. If you did not request this code, you can safely ignore this email.
        </p>

        <!-- Unmonitored Mailbox Notice (Compact) -->
        <div style="margin:8px 0 8px 0;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #10b981;border-radius:4px;font-size:11px;color:#475569;line-height:1.4;">
          <strong>Unmonitored Mailbox:</strong> This is an automated message sent from an unmonitored address. Please do not reply directly to this email.
        </div>

        <!-- Sign-off -->
        <p style="margin:8px 0 0 0;font-size:13px;color:#374151;font-weight:500;">Downex Admin</p>

        <!-- Footer Divider & Links -->
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:10px 0 6px 0;" />
        <p style="margin:0;font-size:11px;color:#64748b;line-height:1.35;">
          <span>downex.apps.gauravpatil.site</span> &nbsp;&bull;&nbsp; Automated security notice
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `Hi Gaurav,\n\nHere is your verification code to complete sign-in to the Downex Admin Panel:\n\n${params.otp.trim()}\n\nThis code is valid for ${expiresMin} minutes. If you did not request this code, you can safely ignore this email.\n\nUnmonitored Mailbox: This is an automated message. Please do not reply directly.\n\nDownex Admin\ndownex.apps.gauravpatil.site`;

  return sendTransactionalEmail({
    purpose: "SECURITY_OTP",
    senderName: "Downex Admin",
    to: [{ email: params.email, name: "Gaurav Patil" }],
    subject: `Your Downex Admin Verification Code: ${params.otp.trim()}`,
    htmlContent,
    textContent,
    tags: ["downex_admin", "otp_verification"],
  });
}
