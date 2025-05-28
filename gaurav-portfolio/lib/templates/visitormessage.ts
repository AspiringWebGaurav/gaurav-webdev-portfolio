export function generateVisitorMessage(
  firstname: string,
  lastname: string,
  email: string,
  message: string,
  istTime: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Visitor Submission</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial, sans-serif;">

    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <!-- Header -->
      <tr>
        <td style="background:#1e293b;padding:24px;text-align:center;color:#ffffff;">
          <h2 style="margin:0;font-size:22px;">👑 BOSS MODE: New Portfolio Contact</h2>
          <p style="margin:4px 0;font-size:14px;color:#94a3b8;">From your personal contact form</p>
        </td>
      </tr>

      <!-- Visitor Details -->
      <tr>
        <td style="padding:24px;">
          <h3 style="margin:0 0 12px;color:#111827;">🧾 Submission Summary</h3>
          <table cellpadding="8" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:8px;font-size:15px;color:#374151;">
            <tr><td><strong>📛 Name</strong></td><td>${firstname} ${lastname}</td></tr>
            <tr><td><strong>✉️ Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>📝 Message</strong></td><td>${message}</td></tr>
            <tr><td><strong>🕒 Time (IST)</strong></td><td>${istTime}</td></tr>
            <tr><td><strong>🌐 Nationality Guess</strong></td><td>${
              email.endsWith(".in")
                ? "🇮🇳 Seems Indian"
                : "🌍 Possibly Foreigner"
            }</td></tr>
            <tr><td><strong>📍 Location (to add)</strong></td><td><em>Enable GeoIP / JS capture</em></td></tr>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="text-align:center;padding:20px;">
          <a href="mailto:${email}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;display:inline-block;font-weight:bold;">
            📤 Reply to ${firstname}
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#1e293b;color:#cbd5e1;text-align:center;padding:16px;font-size:13px;">
          ⚡ Gaurav Portfolio MailBot<br/>
          💼 Triggered from <a href="https://your-portfolio.com" style="color:#60a5fa;text-decoration:none;">your-portfolio.com</a>
        </td>
      </tr>
    </table>

  </body>
</html>
`;
}
