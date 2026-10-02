/**
 * Recruiter Portal Email Validation, Typo Autocorrection & Anti-Abuse Shield
 * Accepts all genuine corporate and personal emails (including Gmail, Yahoo, Outlook, etc.).
 * Detects and automatically fixes domain typos (e.g. gmal.com -> gmail.com).
 * Actively detects and rejects abusive words, vulgarity, offensive terms, and troll/disposable inputs.
 */

// Common domain typos mapped to their canonical equivalents
export const DOMAIN_TYPO_MAP: Record<string, string> = {
  // Gmail typos
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
  "gmai": "gmail.com",
  "gamil": "gmail.com",
  "gmial": "gmail.com",
  "googlemail.con": "googlemail.com",

  // Hotmail typos
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hotmale.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmial": "hotmail.com",
  "hotmail": "hotmail.com",

  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaboo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho": "yahoo.com",
  "yahoo": "yahoo.com",

  // Outlook typos
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlok": "outlook.com",
  "outlook": "outlook.com",

  // iCloud typos
  "iclud.com": "icloud.com",
  "iclou.com": "icloud.com",
  "icloud.con": "icloud.com",

  // ProtonMail typos
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
  "trashmail.com",
  "yopmail.com",
  "sharklasers.com",
  "dispostable.com",
]);

// Blocked troll/disposable exact prefixes
export const BLOCKED_PREFIXES = new Set([
  "test",
  "testing",
  "fake",
  "spam",
  "asdf",
  "asdfasdf",
  "qwerty",
  "admin",
  "administrator",
  "root",
  "null",
  "undefined",
  "none",
  "nobody",
  "noone",
  "noreply",
  "no-reply",
  "abuse",
  "sample",
  "example",
  "temp",
]);

// Known abusive, vulgar, offensive keywords and slurs
export const ABUSIVE_PATTERNS = [
  // Profanity & Vulgarity
  "fuck",
  "fucker",
  "fucking",
  "fck",
  "fuk",
  "motherfucker",
  "shit",
  "bullshit",
  "shitty",
  "bitch",
  "cunt",
  "dick",
  "dickhead",
  "pussy",
  "cock",
  "asshole",
  "bastard",
  "slut",
  "whore",
  "prick",
  "retard",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "porn",
  "xxx",
  "penis",
  "vagina",
  "dildo",
  "blowjob",
  "stfu",
  "gtfo",

  // Insults & Harassment
  "noob",
  "n00b",
  "idiot",
  "moron",
  "stupid",
  "dumbass",
  "loser",
  "scumbag",
  "scammer",
  "spammer",
  "hacker",
  "getalife",

  // Regional / Hindi Slurs
  "chutiya",
  "chutiye",
  "chutya",
  "bhosdike",
  "bhosadike",
  "bhosdi",
  "madarchod",
  "bhenchod",
  "behenchod",
  "gandu",
  "gaandu",
  "harami",
  "kamina",
  "kamine",
  "randi",
  "raand",
  "lodu",
  "lauda",
  "lawda",
  "lund",
  "saala",
  "kutta",
  "kutte",
];

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  autocorrected?: string;
}

/**
 * Detects abusive, profane, or inappropriate email prefixes or domains
 */
export function checkEmailAbuse(val: string): { isAbusive: boolean; error?: string } {
  if (!val || typeof val !== "string") {
    return { isAbusive: false };
  }

  const trimmed = val.trim().toLowerCase();
  if (!trimmed) {
    return { isAbusive: false };
  }

  const parts = trimmed.split("@");
  const prefix = parts[0] || "";
  const domain = parts[1] || "";

  // 1. Exact match on known spam / disposable prefixes
  if (prefix && BLOCKED_PREFIXES.has(prefix)) {
    return {
      isAbusive: true,
      error: "Please enter a genuine personal or corporate email address.",
    };
  }

  // 2. Normalized representation for leetspeak and symbols: e.g. f.u.c.k, f*ck, sh1t, fuk, n00b
  const normalize = (str: string) =>
    str
      .replace(/[0o]/g, "o")
      .replace(/[1il!|]/g, "i")
      .replace(/[@4a]/g, "a")
      .replace(/[$5s]/g, "s")
      .replace(/[3e]/g, "e")
      .replace(/[^a-z]/g, ""); // strip all non-alphabet characters

  const normalizedPrefix = normalize(prefix);
  const normalizedDomain = domain ? normalize(domain.split(".")[0]) : "";
  const normalizedFull = normalize(trimmed);

  for (const pattern of ABUSIVE_PATTERNS) {
    if (
      normalizedPrefix.includes(pattern) ||
      prefix.includes(pattern) ||
      (normalizedDomain && normalizedDomain.includes(pattern)) ||
      (normalizedFull && normalizedFull.includes(pattern))
    ) {
      return {
        isAbusive: true,
        error: "Abusive, vulgar, or inappropriate email addresses are not accepted.",
      };
    }
  }

  // 3. Repeated nonsense characters: e.g. aaaaaaa@... or asdfghjkl@...
  if (/^([a-z])\1{5,}@/i.test(trimmed)) {
    return {
      isAbusive: true,
      error: "Please enter a valid, non-random email address.",
    };
  }

  return { isAbusive: false };
}

/**
 * Helper to autocorrect known typos (e.g. user@gmal.com -> user@gmail.com, user@gmal -> user@gmail.com)
 */
export function getAutocorrectedEmail(val: string): string {
  const trimmed = val.trim();
  if (!trimmed.includes("@")) return trimmed;
  const parts = trimmed.split("@");
  if (parts.length !== 2) return trimmed;
  const [username, domain] = parts;
  const lowerDomain = domain.toLowerCase().trim();
  const cleanDomain = lowerDomain.replace(/\.+$/, ""); // strip trailing dots e.g. "gmal." -> "gmal"

  // 1. Direct typo map match
  if (DOMAIN_TYPO_MAP[lowerDomain]) {
    return `${username}@${DOMAIN_TYPO_MAP[lowerDomain]}`;
  }
  if (DOMAIN_TYPO_MAP[cleanDomain]) {
    return `${username}@${DOMAIN_TYPO_MAP[cleanDomain]}`;
  }

  // 2. Autocorrect gmal variations (e.g. gmal, gmal.com, gmal.co, gmal.in, gmal.org, gmal.c)
  if (
    cleanDomain === "gmal" ||
    cleanDomain === "gmail" ||
    cleanDomain === "gmaill" ||
    cleanDomain.startsWith("gmal.") ||
    cleanDomain.startsWith("gamil.") ||
    cleanDomain.startsWith("gmial.") ||
    cleanDomain.startsWith("gmaill.")
  ) {
    return `${username}@gmail.com`;
  }

  return trimmed;
}

/**
 * Validates email with anti-abuse filtering, domain typo detection, and autocorrection.
 */
export function validateEmailWithTypo(val: string): EmailValidationResult {
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: "Please enter your email." };
  }

  // 1. Anti-Abuse Check first
  const abuseCheck = checkEmailAbuse(trimmed);
  if (abuseCheck.isAbusive) {
    return {
      isValid: false,
      error: abuseCheck.error || "Abusive or inappropriate email addresses are not accepted.",
    };
  }

  // 2. Autocorrection typo check
  const autocorrected = getAutocorrectedEmail(trimmed);
  const hasTypo = autocorrected !== trimmed;

  // 3. RFC standard email check (validate against autocorrected address)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(autocorrected) || autocorrected.includes("..")) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g. name@company.com or name@gmail.com).",
    };
  }

  const parts = autocorrected.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid email address." };
  }

  const domain = parts[1];

  // 4. Blocked disposable domain check
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Disposable or temporary email addresses are not accepted.",
    };
  }

  // 5. Check TLD length
  const dotIndex = domain.lastIndexOf(".");
  if (dotIndex === -1 || domain.substring(dotIndex + 1).length < 2) {
    return {
      isValid: false,
      error: "Please enter an email with a valid domain (e.g. .com, .org).",
    };
  }

  return {
    isValid: true,
    autocorrected,
    suggestion: hasTypo ? autocorrected : undefined,
  };
}

/**
 * Returns error string or null if valid (compatible with form validation)
 */
export function validateWorkEmail(val: string): string | null {
  const result = validateEmailWithTypo(val);
  return result.isValid ? null : (result.error || "Please enter a valid email address.");
}
