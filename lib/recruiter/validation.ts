/**
 * Recruiter Portal Email Validation & Typo Autocorrection
 * Accepts all corporate and personal emails (including Gmail, Yahoo, Outlook, and candidate emails).
 * Detects and autocorrects domain typos (e.g. gmal.com -> gmail.com).
 */

// Common domain typos mapped to their canonical equivalents
export const DOMAIN_TYPO_MAP: Record<string, string> = {
  "gmal.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmale.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gemail.com": "gmail.com",
  "gmal": "gmail.com",
  "gmail": "gmail.com",
  "googlemail.con": "googlemail.com",

  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hotmale.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmial": "hotmail.com",
  "hotmail": "hotmail.com",

  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaboo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho": "yahoo.com",
  "yahoo": "yahoo.com",

  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlok": "outlook.com",
  "outlook": "outlook.com",

  "iclud.com": "icloud.com",
  "iclou.com": "icloud.com",
  "icloud.con": "icloud.com",

  "protonmai.com": "protonmail.com",
  "protonmial.com": "protonmail.com",
};

// Known test/disposable domains to reject
export const BLOCKED_DOMAINS = new Set([
  "test.com",
  "testing.com",
  "fake.com",
  "asdf.com",
  "tempmail.com",
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwaway.com",
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  autocorrected?: string;
}

/**
 * Validates email with domain typo detection and autocorrection suggestion.
 * Fully accepts Gmail, personal emails, work emails, and candidate Gmail addresses.
 */
export function validateEmailWithTypo(val: string): EmailValidationResult {
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: "Please enter your email." };
  }

  // Check for common typo domains before general regex check
  if (trimmed.includes("@")) {
    const parts = trimmed.split("@");
    if (parts.length === 2) {
      const [username, domain] = parts;
      if (DOMAIN_TYPO_MAP[domain]) {
        const canonicalDomain = DOMAIN_TYPO_MAP[domain];
        const suggested = `${username}@${canonicalDomain}`;
        return {
          isValid: false,
          error: `Invalid domain @${domain}. Did you mean @${canonicalDomain}?`,
          suggestion: suggested,
          autocorrected: suggested,
        };
      }
    }
  }

  // RFC standard email check
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed) || trimmed.includes("..")) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g. name@company.com or name@gmail.com).",
    };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid email address." };
  }

  const domain = parts[1];

  // Blocked disposable domain check
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Disposable or temporary email addresses are not accepted.",
    };
  }

  // Check TLD length
  const dotIndex = domain.lastIndexOf(".");
  if (dotIndex === -1 || domain.substring(dotIndex + 1).length < 2) {
    return {
      isValid: false,
      error: "Please enter an email with a valid domain (e.g. .com, .org).",
    };
  }

  return { isValid: true };
}

/**
 * Returns error string or null if valid (compatible with form validation)
 */
export function validateWorkEmail(val: string): string | null {
  const result = validateEmailWithTypo(val);
  return result.isValid ? null : (result.error || "Please enter a valid email address.");
}

/**
 * Helper to autocorrect known typos (e.g. user@gmal.com -> user@gmail.com)
 */
export function getAutocorrectedEmail(val: string): string {
  const trimmed = val.trim();
  if (!trimmed.includes("@")) return trimmed;
  const parts = trimmed.split("@");
  if (parts.length !== 2) return trimmed;
  const [username, domain] = parts;
  const lowerDomain = domain.toLowerCase();
  if (DOMAIN_TYPO_MAP[lowerDomain]) {
    return `${username}@${DOMAIN_TYPO_MAP[lowerDomain]}`;
  }
  return trimmed;
}
