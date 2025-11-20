/**
 * API route for sending bug report notifications
 * Sends email notifications for high/critical severity bug reports
 * Note: Requires 'resend' package to be installed for email functionality
 */

import { NextRequest, NextResponse } from "next/server";

// Optional: Install 'resend' package with: npm install resend
// Then uncomment the line below:
// import { Resend } from "resend";
// const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/bug-reports/notify
 * Send notification email for a bug report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bugReportId, referenceId, title, severity, reporterEmail } = body;

    if (!bugReportId || !referenceId || !title || !severity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Only send notifications for high and critical severity
    if (severity !== "high" && severity !== "critical") {
      return NextResponse.json({ success: true, skipped: true });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

    // Check if Resend is available
    // If you want to enable email notifications, install 'resend' package
    // and uncomment the Resend import at the top
    
    // Placeholder response - replace with actual Resend implementation
    console.log(`[Bug Hunt] Would send email notification for ${severity} bug: ${title}`);
    console.log(`[Bug Hunt] Reference ID: ${referenceId}`);
    console.log(`[Bug Hunt] Admin email: ${adminEmail}`);
    
    // TODO: Uncomment when Resend is installed
    /*
    const { data, error } = await resend.emails.send({
      from: "Bug Hunt <noreply@yourdomain.com>", // Update with your domain
      to: [adminEmail],
      subject: `🚨 ${severity.toUpperCase()} Bug Report: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🐛 New Bug Report</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">${title}</h2>
              
              <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <span style="background: ${
                  severity === "critical" ? "#dc2626" : "#ea580c"
                }; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                  ${severity}
                </span>
              </div>
              
              <p style="color: #666; margin-bottom: 10px;">
                <strong>Reference ID:</strong> ${referenceId}
              </p>
              
              ${
                reporterEmail
                  ? `<p style="color: #666; margin-bottom: 10px;">
                       <strong>Reporter:</strong> ${reporterEmail}
                     </p>`
                  : ""
              }
              
              <p style="color: #666; margin-bottom: 20px;">
                <strong>Submitted:</strong> ${new Date().toLocaleString()}
              </p>
              
              <a href="${
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
              }/admin/dashboard?tab=bug-hunt" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Dashboard
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated notification from Bug Hunt.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending bug report notification:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    */

    return NextResponse.json({ success: true, notificationLogged: true });
  } catch (error: any) {
    console.error("Error sending bug report notification:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
