/**
 * Shared Legal Summary & Notification Prose Formatter
 *
 * Formats a clean, professional announcement letter:
 * - Direct, personal developer opening (Rule 2.12 compliant: zero corporate plurals)
 * - Dynamic effective date formatting
 * - Clear reassurance on data sovereignty and privacy protections
 * - Zero internal logs, zero version numbers
 *
 * Client & Server safe (zero Node.js dependencies).
 */

export function getFormattedCurrentDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export function escapeLegalHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface FormattedLegalProse {
  html: string;
  text: string;
  leadSentence: string;
  isBulletList: boolean;
  bulletItems: string[];
}

export function formatLegalSummaryProse(
  param1: string,
  param2: string,
  param3?: string,
  param4?: string
): FormattedLegalProse {
  // Gracefully handle various call signatures:
  // Signature A: (docTitle, effectiveDate, lastUpdatedDate?)
  // Signature B: (rawSummary, docTitle, effectiveDate, lastUpdatedDate?)
  let docTitle = param1;
  let effectiveDate = param2;
  let lastUpdatedDate = param3;

  if (param4 !== undefined) {
    docTitle = param2;
    effectiveDate = param3 || "";
    lastUpdatedDate = param4;
  } else if (param3 && (param1.toLowerCase().includes("terms") || param1.toLowerCase().includes("privacy"))) {
    docTitle = param1;
    effectiveDate = param2;
    lastUpdatedDate = param3;
  }

  // Preserve crafted date if present; default to January 1, 2026
  const resolvedEffectiveDate =
    effectiveDate && effectiveDate.trim() !== ""
      ? effectiveDate.trim()
      : "January 1, 2026";

  const resolvedLastUpdated =
    lastUpdatedDate && lastUpdatedDate.trim() !== ""
      ? lastUpdatedDate.trim()
      : getFormattedCurrentDate();

  const safeDocTitle = escapeLegalHtml(docTitle);
  const safeEffectiveDate = escapeLegalHtml(resolvedEffectiveDate);
  const safeLastUpdated = escapeLegalHtml(resolvedLastUpdated);

  let leadSentenceHtml = "";
  let leadSentenceText = "";

  if (resolvedLastUpdated && resolvedLastUpdated !== resolvedEffectiveDate) {
    leadSentenceHtml = `<strong>I have published an updated revision of the public ${safeDocTitle} governing Gaurav Portfolio, updated on ${safeLastUpdated} (effective ${safeEffectiveDate}).</strong>`;
    leadSentenceText = `I have published an updated revision of the public ${docTitle} governing Gaurav Portfolio, updated on ${resolvedLastUpdated} (effective ${resolvedEffectiveDate}).`;
  } else {
    leadSentenceHtml = `<strong>I have published an updated revision of the public ${safeDocTitle} governing Gaurav Portfolio, effective ${safeEffectiveDate}.</strong>`;
    leadSentenceText = `I have published an updated revision of the public ${docTitle} governing Gaurav Portfolio, effective ${resolvedEffectiveDate}.`;
  }

  const html = `
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#202124;">
      ${leadSentenceHtml}
    </p>
    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#3c4043;">
      This update won't affect how you explore the portfolio or interact with services, and you don't need to take any action. Your data sovereignty, rights, and privacy protections remain fully preserved.
    </p>
  `.trim();

  const text = `
${leadSentenceText}

This update won't affect how you explore the portfolio or interact with services, and you don't need to take any action. Your data sovereignty, rights, and privacy protections remain fully preserved.
  `.trim();

  return {
    html,
    text,
    leadSentence: leadSentenceText,
    isBulletList: false,
    bulletItems: [],
  };
}

