/**
 * Recruiter Portal Work Email & Intake Validation
 * Strictly enforces corporate/work email addresses.
 * Rejects personal webmail (Gmail, Yahoo, Outlook, etc.), disposable domains, and candidate personal emails.
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

  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hotmale.com": "hotmail.com",
  "hotmail.con": "hotmail.com",

  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaboo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahoo.con": "yahoo.com",

  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",

  "iclud.com": "icloud.com",
  "iclou.com": "icloud.com",
  "icloud.con": "icloud.com",

  "protonmai.com": "protonmail.com",
  "protonmial.com": "protonmail.com",
};

// Known free / personal webmail domains that MUST be blocked for recruiter intake
export const FREE_EMAIL_DOMAINS = new Set([
  // Google
  "gmail.com",
  "googlemail.com",

  // Microsoft
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "passport.com",
  "windowslive.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "hotmail.de",
  "hotmail.it",
  "hotmail.es",
  "outlook.in",
  "outlook.de",
  "outlook.fr",
  "outlook.es",
  "outlook.it",
  "live.co.uk",
  "live.fr",
  "live.de",
  "live.it",

  // Yahoo
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "yahoo.co.in",
  "yahoo.in",
  "yahoo.co.uk",
  "yahoo.ca",
  "yahoo.fr",
  "yahoo.de",
  "yahoo.es",
  "yahoo.it",
  "yahoo.com.br",
  "yahoo.com.au",
  "yahoo.co.jp",

  // Apple
  "icloud.com",
  "me.com",
  "mac.com",

  // Proton
  "proton.me",
  "protonmail.com",
  "protonmail.ch",
  "pm.me",

  // AOL
  "aol.com",
  "aim.com",

  // Zoho personal
  "zoho.com",
  "zohomail.com",

  // Generic / Personal mail services
  "mail.com",
  "email.com",
  "usa.com",
  "post.com",
  "myself.com",
  "consultant.com",
  "europe.com",
  "asia.com",
  "dr.com",
  "techie.com",
  "engineer.com",
  "cheerful.com",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "gmx.at",
  "gmx.ch",

  // International personal providers
  "yandex.com",
  "yandex.ru",
  "ya.ru",
  "tutanota.com",
  "tutamail.com",
  "tuta.com",
  "fastmail.com",
  "fastmail.fm",
  "rediffmail.com",
  "inbox.com",
  "lycos.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "sohu.com",
  "web.de",
  "freenet.de",
  "t-online.de",
  "laposte.net",
  "orange.fr",
  "free.fr",
  "sfr.fr",
  "libero.it",
  "virgilio.it",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
  "ig.com.br",
]);

// Known disposable, temporary, and test domains
export const DISPOSABLE_OR_TEST_DOMAINS = new Set([
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "sharklasers.com",
  "throwaway.com",
  "mailinator.com",
  "trashmail.com",
  "dispostable.com",
  "yopmail.com",
  "fakeinbox.com",
  "burnermail.io",
  "getairmail.com",
  "mohmal.com",
  "crazymailing.com",
  "dropmail.me",
  "test.com",
  "testing.com",
  "fake.com",
  "example.com",
  "sample.com",
  "asdf.com",
  "localhost",
  "domain.com",
]);

// Candidate / Owner reserved emails and identifiers
export const OWNER_RESERVED_EMAILS = new Set([
  "gauravpatil9262@gmail.com",
  "gauravpatil5737@gmail.com",
  "aspiringwebgaurav@gmail.com",
  "gaurav@gauravpatil.site",
  "hello@gauravpatil.site",
  "me@gauravpatil.site",
  "work@gauravpatil.site",
  "security@gauravpatil.site",
  "help@gauravpatil.site",
  "no-reply@gauravpatil.site",
]);

const OWNER_USERNAME_PATTERNS = [
  "gauravpatil9262",
  "gauravpatil5737",
  "aspiringwebgaurav",
  "gauravpatil",
  "gaurav.patil",
];

/**
 * Validates whether an email is a legitimate corporate / work email.
 * Returns null if valid, or a descriptive error message if invalid.
 */
export function validateWorkEmail(val: string): string | null {
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) {
    return "Please enter your official company work email.";
  }

  // Basic format check
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed) || trimmed.includes("..")) {
    return "Please enter a valid email address (e.g. name@company.com).";
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return "Invalid email address structure.";
  }

  const [username, domain] = parts;

  // 1. Candidate / Owner email reservation check
  if (OWNER_RESERVED_EMAILS.has(trimmed)) {
    return "This email belongs to Gaurav Patil. Please provide your official recruiter or company work email.";
  }

  if (domain === "gauravpatil.site" || domain.endsWith(".gauravpatil.site")) {
    return "This domain belongs to Gaurav Patil. Recruiter access requires your company work email.";
  }

  if (OWNER_USERNAME_PATTERNS.includes(username)) {
    return "This email belongs to Gaurav Patil. Please provide your official recruiter or company work email.";
  }

  // 2. Check for domain typos (e.g. gmal.com, hotmial.com)
  if (DOMAIN_TYPO_MAP[domain]) {
    return `Invalid domain @${domain}. Personal and misspelled email addresses are not accepted. Please use your official company email.`;
  }

  // 3. Free / Personal Webmail check (Gmail, Yahoo, Outlook, etc.)
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    return `Personal email addresses (@${domain}) are not accepted for recruiter access. Please provide your official company or work email (e.g. name@company.com).`;
  }

  // Check subdomains of free providers (e.g. *.gmail.com)
  for (const freeDomain of FREE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${freeDomain}`)) {
      return `Personal email addresses are not accepted. Please provide your official company or work email.`;
    }
  }

  // 4. Disposable or Test domains check
  if (DISPOSABLE_OR_TEST_DOMAINS.has(domain)) {
    return `Disposable or temporary email addresses are not permitted. Please use your verified corporate email.`;
  }

  for (const blocked of DISPOSABLE_OR_TEST_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) {
      return `Disposable or temporary email addresses are not permitted. Please use your verified corporate email.`;
    }
  }

  // 5. Domain structure validation
  const dotIndex = domain.lastIndexOf(".");
  if (dotIndex === -1 || domain.substring(dotIndex + 1).length < 2) {
    return "Email domain must include a valid top-level domain (e.g. .com, .org, .co).";
  }

  // Ensure domain has at least a 2-char label before the TLD
  const domainParts = domain.split(".");
  if (domainParts.some((p) => p.length === 0)) {
    return "Please enter a valid domain name.";
  }

  return null;
}

/**
 * Convenience helper returning boolean
 */
export function isWorkEmailValid(val: string): boolean {
  return validateWorkEmail(val) === null;
}
