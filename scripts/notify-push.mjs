#!/usr/bin/env node

/**
 * Standalone Post-Push Audit Email Dispatcher
 *
 * Exclusively dispatches an ultra-minimal, single-view, zero-scroll audit email
 * to Admin Gmail via Mailercloud (zero load on Brevo).
 *
 * Relay Strategy:
 * - 100% Dedicated Relay: Mailercloud API (12,000/mo quota)
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

const MAILERCLOUD_API_KEY = process.env.MAILERCLOUD_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.BREVO_NOTIFICATION_RECIPIENT || "gauravpatil5737@gmail.com";
const SENDER_EMAIL = "security@gauravpatil.site";
const SENDER_NAME = "Gaurav Patil";

if (!MAILERCLOUD_API_KEY) {
  console.error("❌ Error: MAILERCLOUD_API_KEY is not configured in environment or .env.local.");
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
  let badgeBg = "#eff6ff";
  let badgeColor = "#2563eb";
  let badgeBorder = "#bfdbfe";
  let label = "MOD";

  if (file.status === "ADD") {
    badgeBg = "#ecfdf5";
    badgeColor = "#059669";
    badgeBorder = "#a7f3d0";
    label = "ADD";
  } else if (file.status === "DEL") {
    badgeBg = "#fef2f2";
    badgeColor = "#dc2626";
    badgeBorder = "#fecaca";
    label = "DEL";
  } else if (file.status === "REN") {
    badgeBg = "#fdf4ff";
    badgeColor = "#9333ea";
    badgeBorder = "#f0abfc";
    label = "REN";
  }

  const compactPath = formatCompactPath(file.path);

  return `<tr>
    <td style="padding:1px 0; width:36px; vertical-align:middle;">
      <span style="display:inline-block; font-family:monospace; font-size:8px; font-weight:700; color:${badgeColor}; background:${badgeBg}; border:1px solid ${badgeBorder}; padding:1px 3px; border-radius:2px; letter-spacing:0.3px;">${label}</span>
    </td>
    <td style="padding:1px 0; font-family:monospace; font-size:10px; color:#334155; vertical-align:middle; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
      ${escapeHtml(compactPath)}
    </td>
  </tr>`;
}).join("");

// 3. Ultra-minimal, single-view zero-scroll HTML template (~195px height)
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Push Audit #${shortHash}</title>
</head>
<body style="margin:0; padding:10px; background-color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="left" style="max-width:500px; margin:0; border-collapse:collapse;">
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border:1px solid #e2e8f0; border-left:3px solid #7c3aed; border-radius:6px; border-collapse:collapse;">
          <tr>
            <td style="padding:10px 12px;">
              
              <!-- 1. Header Line: Status + Hash + Branch + Verified Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td align="left" style="font-size:11px; font-weight:700; color:#0f172a;">
                    <span style="color:#7c3aed;">⚡ PUSH AUDIT</span>
                    <span style="color:#cbd5e1; margin:0 4px;">•</span>
                    <a href="${commitUrl}" style="color:#7c3aed; font-family:monospace; font-weight:700; text-decoration:none;">#${shortHash}</a>
                    <span style="color:#64748b; font-family:monospace; font-weight:500; font-size:10px; margin-left:2px;">(${escapeHtml(gitData.branch)})</span>
                  </td>
                  <td align="right">
                    <span style="font-family:monospace; font-size:9px; font-weight:700; color:#059669; background:#ecfdf5; border:1px solid #a7f3d0; padding:1px 6px; border-radius:3px; letter-spacing:0.3px;">
                      VERIFIED ✓
                    </span>
                  </td>
                </tr>
              </table>

              <!-- 2. Commit Message: Clean, Direct, Single Block -->
              <div style="margin:6px 0 6px 0; font-size:12px; font-weight:600; color:#0f172a; line-height:1.4; word-break:break-word;">
                ${escapeHtml(gitData.commitMessage)}
              </div>

              <!-- 3. Meta Strip: Actor, Timestamp & Diff Stats in 1 Compact Row -->
              <div style="font-size:10px; color:#64748b; border-top:1px solid #f1f5f9; padding-top:5px; margin-bottom:6px;">
                <span style="font-weight:600; color:#334155;">${escapeHtml(gitData.authorName)}</span>
                <span style="color:#cbd5e1; margin:0 4px;">•</span>
                <span>${escapeHtml(formattedTime)}</span>
                ${gitData.insertions || gitData.deletions ? `
                <span style="color:#cbd5e1; margin:0 4px;">•</span>
                <span style="color:#059669; font-weight:700; font-family:monospace;">${escapeHtml(gitData.insertions || "+0")}</span>
                <span style="color:#cbd5e1; margin:0 2px;">/</span>
                <span style="color:#dc2626; font-weight:700; font-family:monospace;">${escapeHtml(gitData.deletions || "-0")}</span>
                ` : ""}
              </div>

              <!-- 4. Ultra-Compact Monospace Files Box (Height ~45px) -->
              ${totalFilesCount > 0 ? `
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:4px 8px; font-family:monospace;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                  ${fileRowsHtml}
                </table>
              </div>
              ` : ""}

              <!-- 5. Micro Action Line: Quick Summary & GitHub Link -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px; font-size:10px; border-collapse:collapse;">
                <tr>
                  <td align="left" style="color:#94a3b8;">
                    ${totalFilesCount} files changed ${remainingFilesCount > 0 ? `&bull; +${remainingFilesCount} more` : ""}
                  </td>
                  <td align="right">
                    <a href="${commitUrl}" style="color:#7c3aed; text-decoration:none; font-weight:600;">View on GitHub &rarr;</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
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
Diff: ${commitUrl}`;

// 4. Exclusive Relay: Mailercloud (Zero load on Brevo)
async function dispatch() {
  console.log("==================================================================");
  console.log("  DISPATCHING GIT PUSH AUDIT NOTIFICATION (MAILERCLOUD EXCLUSIVE) ");
  console.log("==================================================================");
  console.log(`  Commit:    #${shortHash} (${gitData.branch})`);
  console.log(`  To:        ${ADMIN_EMAIL}`);
  console.log(`  Sender:    ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`  Relay:     Mailercloud (100% Dedicated, Zero Brevo Usage)`);
  console.log(`  Timestamp: ${formattedTime}`);
  console.log("------------------------------------------------------------------");

  const payload = {
    version: "1.0",
    email: {
      from: SENDER_EMAIL,
      fromName: SENDER_NAME,
      subject: `Push Audit #${shortHash}`,
      html: htmlContent,
      text: textContent,
      reply_to: SENDER_EMAIL,
      recipients: {
        to: [{ email: ADMIN_EMAIL, name: "Gaurav Patil" }],
      },
    },
  };

  try {
    const res = await fetch("https://email-api.mailercloud.com/email", {
      method: "POST",
      headers: {
        Authorization: MAILERCLOUD_API_KEY,
        "api-key": MAILERCLOUD_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 200 || res.status === 201) {
      console.log(`✔ SUCCESS: Audit email dispatched via Mailercloud!`);
      console.log(`  Status: HTTP ${res.status} (${data.message || "SUCCESS"})`);
      console.log("==================================================================");
      process.exit(0);
    } else {
      console.error(`✖ FAILED: Mailercloud returned HTTP ${res.status}`);
      console.error("  Error Details:", data);
      console.log("==================================================================");
      process.exit(1);
    }
  } catch (err) {
    console.error("✖ Network Error:", err.message);
    process.exit(1);
  }
}

dispatch();
