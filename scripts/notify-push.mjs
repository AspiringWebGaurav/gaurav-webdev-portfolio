#!/usr/bin/env node

/**
 * Standalone Post-Push Audit Email Dispatcher
 *
 * Dispatches an ultra-minimal, single-view, zero-scroll audit email
 * to Admin Gmail via Brevo REST API v3.
 *
 * Relay Strategy:
 * - Relay: Brevo API v3 (300/day quota)
 * - Sender: Gaurav Patil <security@gauravpatil.site>
 * - Recipient: Admin Gmail (gauravpatil5737@gmail.com)
 *
 * Layout Standard:
 * - Ultra-minimal Swiss card (Height ~190-210px, strictly ZERO vertical scroll on mobile/desktop)
 * - Single-line header, compact commit message, inline metadata & diff chips
 * - Concise 3-file summary box with ellipsis paths
 *
 * Run with: node scripts/notify-push.mjs
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// 1. Load environment variables from .env.local
function loadEnv() {
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
}

loadEnv();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.BREVO_NOTIFICATION_RECIPIENT || "gauravpatil5737@gmail.com";
const SENDER_EMAIL = "security@gauravpatil.site";
const SENDER_NAME = "Gaurav Patil";

if (!RESEND_API_KEY && !BREVO_API_KEY) {
  console.error("❌ Error: Neither RESEND_API_KEY nor BREVO_API_KEY is configured in environment or .env.local.");
  process.exit(1);
}


// 2. Extract git commit metadata with file statuses & diff stats
function getGitMetadata() {
  try {
    const commitHash = execSync("git log -1 --format=%H", { encoding: "utf-8" }).trim();
    const commitMessage = execSync("git log -1 --format=%s", { encoding: "utf-8" }).trim();
    const authorName = execSync("git log -1 --format=%an", { encoding: "utf-8" }).trim();
    const authorEmail = execSync("git log -1 --format=%ae", { encoding: "utf-8" }).trim();
    const timestampRaw = execSync("git log -1 --format=%cI", { encoding: "utf-8" }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();

    // Derive repository remote URL
    let repoSlug = "AspiringWebGaurav/gaurav-webdev-portfolio";
    try {
      const remoteUrl = execSync("git config --get remote.origin.url", { encoding: "utf-8" }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
      if (match) repoSlug = match[1];
    } catch {}

    // Parse status and path for each changed file
    const filesOutput = execSync("git diff-tree --no-commit-id --name-status -r HEAD", { encoding: "utf-8" }).trim();
    const filesChanged = filesOutput
      ? filesOutput
          .split("\n")
          .map((line) => {
            const parts = line.trim().split(/\t+/);
            const rawStatus = parts[0] ? parts[0].charAt(0).toUpperCase() : "M";
            const filePath = parts.slice(1).join("\t") || parts[0] || "";
            let status = "MOD";
            if (rawStatus === "A") status = "ADD";
            else if (rawStatus === "D") status = "DEL";
            else if (rawStatus === "R") status = "REN";
            return { status, path: filePath };
          })
          .filter((f) => Boolean(f.path))
      : [];

    // Parse insertions and deletions from git show
    let insertions = "";
    let deletions = "";
    try {
      const statOutput = execSync("git show --shortstat --format= HEAD", { encoding: "utf-8" }).trim();
      const insMatch = statOutput.match(/(\d+)\s+insertion/);
      const delMatch = statOutput.match(/(\d+)\s+deletion/);
      if (insMatch) insertions = `+${Number(insMatch[1]).toLocaleString()}`;
      if (delMatch) deletions = `-${Number(delMatch[1]).toLocaleString()}`;
    } catch {}

    return {
      commitHash,
      commitMessage,
      authorName,
      authorEmail,
      timestampRaw,
      branch,
      repoSlug,
      filesChanged,
      insertions,
      deletions,
    };
  } catch (err) {
    console.warn("⚠️ Warning: Failed to query git metadata, using fallback:", err.message);
    return {
      commitHash: "unknown",
      commitMessage: "Manual push notification",
      authorName: "Gaurav Patil",
      authorEmail: ADMIN_EMAIL,
      timestampRaw: new Date().toISOString(),
      branch: "main",
      repoSlug: "AspiringWebGaurav/gaurav-webdev-portfolio",
      filesChanged: [],
      insertions: "",
      deletions: "",
    };
  }
}

const gitData = getGitMetadata();
const shortHash = gitData.commitHash ? gitData.commitHash.substring(0, 7) : "HEAD";

function formatTimestamp(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  return d.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCompactPath(fullPath, maxLen = 42) {
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

const formattedTime = formatTimestamp(gitData.timestampRaw);
const commitUrl = `https://github.com/${gitData.repoSlug}/commit/${gitData.commitHash}`;
const totalFilesCount = gitData.filesChanged.length;

// Display top 3 key files with compact monospace rows (no wrapping)
const displayLimit = 3;
const displayedFiles = gitData.filesChanged.slice(0, displayLimit);
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
    <td style="padding:2px 0; width:34px; font-family:monospace; font-size:10px; font-weight:700; color:${labelColor}; vertical-align:middle;">
      ${label}
    </td>
    <td style="padding:2px 0; font-family:monospace; font-size:11px; color:#334155; vertical-align:middle; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
      ${escapeHtml(compactPath)}
    </td>
  </tr>`;
}).join("");

// 3. Clean, anti-spam, single-view zero-scroll React Email layout
const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
              PUSH AUDIT &bull; #${shortHash} (${escapeHtml(gitData.branch)})
            </span>
          </div>

          <!-- Commit Message -->
          <div style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#0f172a; line-height:1.45; word-break:break-word;">
            ${escapeHtml(gitData.commitMessage)}
          </div>

          <!-- Meta Strip: Author, Timestamp, Diff Stats -->
          <div style="font-size:11px; color:#64748b; margin-bottom:10px;">
            <span style="font-weight:600; color:#334155;">${escapeHtml(gitData.authorName)}</span>
            <span style="color:#cbd5e1; margin:0 4px;">&bull;</span>
            <span>${escapeHtml(formattedTime)}</span>
            ${gitData.insertions || gitData.deletions ? `
            <span style="color:#cbd5e1; margin:0 4px;">&bull;</span>
            <span style="color:#059669; font-weight:600; font-family:ui-monospace,Menlo,Monaco,monospace;">${escapeHtml(gitData.insertions || "+0")}</span>
            <span style="color:#cbd5e1; margin:0 2px;">/</span>
            <span style="color:#dc2626; font-weight:600; font-family:ui-monospace,Menlo,Monaco,monospace;">${escapeHtml(gitData.deletions || "-0")}</span>
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

const textContent = `[GIT PUSH AUDIT]
Status: VERIFIED (Pre-Push Gate Passed)
Commit: #${shortHash} (${gitData.branch})
Message: ${gitData.commitMessage}
Actor: ${gitData.authorName} <${gitData.authorEmail}>
Time: ${formattedTime}
Changes: ${totalFilesCount} files (${gitData.insertions || "+0"} / ${gitData.deletions || "-0"})
${gitData.filesChanged.slice(0, 5).map((f) => `- [${f.status}] ${f.path}`).join("\n")}
${remainingFilesCount > 0 ? `+ ${remainingFilesCount} more files\n` : ""}
Diff: ${commitUrl}

Sent by Gaurav Portfolio Infrastructure • India`;


// 4. Dual-Engine Dispatch: Resend (Primary) with Brevo (Fallback)
async function dispatch() {
  console.log("==================================================================");
  console.log("              DISPATCHING GIT PUSH AUDIT NOTIFICATION             ");
  console.log("==================================================================");
  console.log(`  Commit:    #${shortHash} (${gitData.branch})`);
  console.log(`  To:        ${ADMIN_EMAIL}`);
  console.log(`  Sender:    ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`  Primary:   Resend REST API (Tokyo ap-northeast-1)`);
  console.log(`  Fallback:  Brevo REST API v3`);
  console.log(`  Timestamp: ${formattedTime}`);
  console.log("------------------------------------------------------------------");

  // 1. Attempt Primary Dispatch via Resend
  if (RESEND_API_KEY) {
    try {
      console.log("  [Relay] Attempting primary dispatch via Resend REST API...");
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
          to: [ADMIN_EMAIL],
          reply_to: `${SENDER_NAME} <${SENDER_EMAIL}>`,
          subject: `Push Audit #${shortHash}`,
          html: htmlContent,
          text: textContent,
          tags: [
            { name: "category", value: "git_push_audit" },
            { name: "environment", value: "production" },
          ],
        }),
      });

      const resendData = await resendRes.json().catch(() => ({}));
      if (resendRes.ok) {
        console.log(`✔ SUCCESS: Audit email dispatched via Resend!`);
        console.log(`  Message ID: ${resendData.id || "SUCCESS"}`);
        console.log(`  Relay Used: Resend (Preserved Brevo Quota)`);
        console.log("==================================================================");
        process.exit(0);
      } else {
        console.warn(`⚠️ Warning: Resend returned HTTP ${resendRes.status}, falling back to Brevo...`);
        console.warn("  Error Details:", resendData);
      }
    } catch (resendErr) {
      console.warn("⚠️ Warning: Network error contacting Resend, falling back to Brevo:", resendErr.message);
    }
  }

  // 2. Fallback to Brevo REST API v3
  if (!BREVO_API_KEY) {
    console.error("✖ FAILED: Resend failed and BREVO_API_KEY is not configured.");
    console.log("==================================================================");
    process.exit(1);
  }

  console.log("  [Relay] Executing failover dispatch via Brevo REST API v3...");
  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: ADMIN_EMAIL, name: "Gaurav Patil" }],
    replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
    subject: `Push Audit #${shortHash}`,
    htmlContent: htmlContent,
    textContent: textContent,
    tags: ["git_push_audit", "security_log"],
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 200 || res.status === 201) {
      console.log(`✔ SUCCESS: Audit email dispatched via Brevo fallback!`);
      console.log(`  Message ID: ${data.messageId || "SUCCESS"}`);
      console.log(`  Relay Used: Brevo Fallback`);
      console.log("==================================================================");
      process.exit(0);
    } else {
      console.error(`✖ FAILED: Brevo fallback returned HTTP ${res.status}`);
      console.error("  Error Details:", data);
      console.log("==================================================================");
      process.exit(1);
    }
  } catch (err) {
    console.error("✖ Network Error on Brevo fallback:", err.message);
    process.exit(1);
  }
}

dispatch();

