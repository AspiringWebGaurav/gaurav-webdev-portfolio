export function generateAutoReply(
  firstname: string,
  lastname: string,
  email: string,
  message: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Message Confirmation</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
    <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">

      <tr>
        <td style="text-align:center;background:#1f2937;padding:20px;color:#fff;">
          <h2 style="margin:0;font-size:20px;">🌟 GAURAV PATIL – Code. Create. Conquer.</h2>
        </td>
      </tr>

      <tr>
        <td>
          <img src="https://res.cloudinary.com/dhrsgpxxp/image/upload/v1748360907/header-mail_vgin8v.png" alt="Gaurav Header" width="600" style="width:100%;height:auto;display:block;" />
        </td>
      </tr>

      <tr>
        <td style="padding:24px;">
          <h3 style="margin-top:0;color:#111827;">👋 Hi ${firstname},</h3>
          <p style="color:#374151;font-size:15px;">Thanks for reaching out! I’ve received your message and will respond personally very soon. Meanwhile, here's why people love working with me:</p>
        </td>
      </tr>

      <tr>
        <td style="padding:0 24px 24px;">
          <div style="background:#f9fafb;padding:16px;border-radius:8px;">
            <p><strong>📛 Name:</strong> ${firstname} ${lastname}</p>
            <p><strong>✉️ Email:</strong> ${email}</p>
            <p><strong>📝 Message:</strong><br/>${message}</p>
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 24px 24px;">
          <h4 style="color:#111827;margin-bottom:10px;">💡 Who is Gaurav?</h4>
          <ul style="padding-left:20px;color:#4b5563;font-size:14px;line-height:1.6;">
            <li>👨‍💻 Full-Stack Dev & UI Engineer</li>
            <li>🧪 Masai School Graduate (1200+ hrs coding)</li>
            <li>🚀 Built 30+ full-stack web apps</li>
            <li>🌐 Remote-ready & timezone-flexible</li>
            <li>🛠️ React, Node.js, Tailwind, Prisma, MongoDB</li>
          </ul>
        </td>
      </tr>

      <tr>
        <td style="padding:0 24px 24px;text-align:center;">
          <a href="https://your-portfolio.com/resume" style="margin:6px;display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">📄 Resume</a>
          <a href="https://your-portfolio.com/projects" style="margin:6px;display:inline-block;padding:10px 20px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;">💡 Projects</a>
          <a href="https://github.com/gauravpatildev" style="margin:6px;display:inline-block;padding:10px 20px;background:#6b7280;color:#fff;border-radius:6px;text-decoration:none;">🐙 GitHub</a>
        </td>
      </tr>

      <tr>
        <td style="padding:0 24px 24px;">
          <h4 style="color:#111827;">📞 Contact Info</h4>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;">
            📱 +91-98765-43210<br />
            📧 gauravofficial@gmail.com<br />
            📧 gaurav.backend.services@outlook.com<br />
            📍 Pune, Maharashtra (Travels: Mumbai, Bangalore, Hyderabad)
          </p>
        </td>
      </tr>

      <tr>
        <td>
          <img src="https://res.cloudinary.com/dhrsgpxxp/image/upload/v1748360908/footer-email_xjfi9c.png" alt="Footer" width="600" style="width:100%;height:auto;display:block;" />
        </td>
      </tr>

      <tr>
        <td style="text-align:center;background:#111827;color:#d1d5db;padding:16px;font-size:13px;">
          🌐 <a href="https://your-portfolio.com" style="color:#60a5fa;text-decoration:none;">Portfolio</a> |
          <a href="https://linkedin.com/in/gauravpatil" style="color:#60a5fa;text-decoration:none;">LinkedIn</a> |
          <a href="https://dev.to/gauravpatil" style="color:#60a5fa;text-decoration:none;">Blog</a>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
