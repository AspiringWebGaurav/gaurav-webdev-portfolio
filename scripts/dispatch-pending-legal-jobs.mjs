#!/usr/bin/env node

/**
 * Dispatches any legal notification jobs currently in QUEUED state.
 *
 * Run with: node scripts/dispatch-pending-legal-jobs.mjs
 */

import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 1. Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const apiKey = process.env.BREVO_API_KEY;

async function dispatchAllQueued() {
  console.log("Searching for QUEUED legal notification jobs...");
  const jobsSnap = await db
    .collection("legal_notification_jobs")
    .where("status", "==", "QUEUED")
    .get();

  if (jobsSnap.empty) {
    console.log("No QUEUED jobs found.");
    return;
  }

  console.log(`Found ${jobsSnap.size} QUEUED job(s). Processing...`);

  for (const doc of jobsSnap.docs) {
    const job = doc.data();
    const jobId = doc.id;
    console.log(`\nProcessing Job: ${jobId} (v${job.version} ${job.docType})`);

    const recSnap = await doc.ref.collection("recipients").where("status", "==", "PENDING").get();
    console.log(`  Found ${recSnap.size} pending recipient(s)`);

    let sentCount = 0;
    let failedCount = 0;

    for (const recDoc of recSnap.docs) {
      const rec = recDoc.data();
      console.log(`  -> Sending to ${rec.email} (${rec.name || "Admin"})...`);

      const docTitle = job.docType === "TERMS" ? "Terms of Service" : "Privacy Policy";
      const appBaseUrl = "https://gauravpatil.site";
      const policyUrl = job.docType === "TERMS" ? `${appBaseUrl}/terms` : `${appBaseUrl}/privacy`;

      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: "Gaurav Portfolio", email: "no-reply@gauravpatil.site" },
            to: [{ email: rec.email, name: rec.name || "Gaurav Patil" }],
            replyTo: { email: "no-reply@gauravpatil.site", name: "Gaurav Portfolio" },
            subject: `${docTitle} Update`,
            htmlContent: `
              <div style="font-family:'Google Sans',Roboto,Arial,sans-serif;max-width:580px;margin:0 auto;color:#202124;padding:24px;">
                <div style="font-size:22px;font-weight:600;color:#1a73e8;margin-bottom:16px;">Gaurav <span style="color:#5f6368;font-weight:400;">Portfolio</span></div>
                <h2 style="font-size:18px;margin-bottom:12px;">${docTitle} Update</h2>
                <p style="font-size:14px;line-height:1.6;color:#3c4043;">
                  <strong>I have published an updated revision of the public ${docTitle} governing Gaurav Portfolio, effective ${job.effectiveDate || "January 1, 2026"}.</strong>
                </p>
                <p style="font-size:14px;line-height:1.6;color:#3c4043;">
                  This update won't affect how you explore the portfolio or interact with services, and you don't need to take any action. Your data sovereignty, rights, and privacy protections remain fully preserved.
                </p>
                <div style="margin:24px 0;">
                  <a href="${policyUrl}" style="background-color:#1a73e8;color:#ffffff;padding:10px 18px;text-decoration:none;border-radius:4px;font-weight:500;font-size:13px;display:inline-block;">Review Updated ${docTitle}</a>
                </div>
                <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;" />
                <div style="font-size:12px;color:#70757a;text-align:center;">
                  Gaurav Portfolio &bull; Full-Stack Engineer &bull; <a href="${appBaseUrl}" style="color:#1a73e8;">gauravpatil.site</a>
                </div>
              </div>
            `,
            textContent: `
${docTitle} Update

I have published an updated revision of the public ${docTitle} governing Gaurav Portfolio, effective ${job.effectiveDate || "January 1, 2026"}.

This update won't affect how you explore the portfolio or interact with services, and you don't need to take any action. Your data sovereignty, rights, and privacy protections remain fully preserved.

Review updated ${docTitle}:
${policyUrl}

Sincerely,
Gaurav Patil
Gaurav Portfolio
            `.trim(),
          }),
        });

        const brevoData = await res.json();
        if (res.ok) {
          console.log(`    ✓ Dispatched: ${brevoData.messageId}`);
          await recDoc.ref.update({
            status: "SENT",
            sentAt: new Date().toISOString(),
            brevoMessageId: brevoData.messageId || null,
            attempts: 1,
            updatedAt: new Date().toISOString(),
          });
          sentCount++;
        } else {
          console.error(`    ✗ Failed:`, brevoData);
          await recDoc.ref.update({
            status: "FAILED",
            lastError: JSON.stringify(brevoData),
            attempts: 1,
            updatedAt: new Date().toISOString(),
          });
          failedCount++;
        }
      } catch (err) {
        console.error(`    ✗ Error:`, err);
        failedCount++;
      }
    }

    const now = new Date().toISOString();
    const finalStatus = failedCount === 0 ? "COMPLETED" : sentCount > 0 ? "PARTIAL_FAILURE" : "FAILED";

    await doc.ref.update({
      status: finalStatus,
      sentCount: (job.sentCount || 0) + sentCount,
      failedCount: (job.failedCount || 0) + failedCount,
      pendingCount: 0,
      completedAt: now,
      updatedAt: now,
    });

    console.log(`  ✓ Job ${jobId} updated to status: ${finalStatus}`);
  }

  console.log("\nAll queued jobs successfully processed!");
}

dispatchAllQueued().catch(console.error);
