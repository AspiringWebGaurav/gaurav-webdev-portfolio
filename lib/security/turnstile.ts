/**
 * Cloudflare Turnstile Server-Side Validation Helper
 * Canonical implementation following Cloudflare Turnstile siteverify specification:
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

import { fetchWithTimeout } from "@/lib/api/fetcher";

const TURNSTILE_SECRET_KEY =
  process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
  process.env.TURNSTILE_SECRET ||
  process.env.TURNSTILE_SECRET_KEY ||
  "";

// Default allowed hostnames for the portfolio widgets
const DEFAULT_ALLOWED_HOSTNAMES = [
  "gauravpatil.site",
  "www.gauravpatil.site",
  "contact.gauravpatil.site",
  "resume.gauravpatil.site",
  "localhost",
  "resume.localhost",
  "contact.localhost",
  "127.0.0.1",
];

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

export interface VerifyTurnstileOptions {
  expectedAction?: string | string[];
  expectedHostnames?: string[];
  secretKeyOverride?: string;
}

export type TurnstileOptionsOrSecret = string | VerifyTurnstileOptions;

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string,
  optionsOrSecret?: TurnstileOptionsOrSecret
): Promise<TurnstileVerificationResult> {
  // Allow explicit mock token strictly in local development/testing
  if (
    process.env.NODE_ENV === "development" &&
    token === "dev_bypass_token"
  ) {
    return {
      success: true,
      hostname: "localhost",
      action: "contact_inquiry",
    };
  }

  // 1. Strict Token Format Check: Non-empty string <= 2048 chars
  if (typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      error: "Cloudflare Turnstile verification token is missing. Please complete the security check.",
    };
  }

  const cleanToken = token.trim();
  if (cleanToken.length > 2048) {
    return {
      success: false,
      error: "Cloudflare Turnstile token exceeds maximum permissible length (2048 characters).",
    };
  }

  // Resolve options & secret
  const isOptionsObject =
    typeof optionsOrSecret === "object" && optionsOrSecret !== null;

  const explicitSecret = isOptionsObject
    ? optionsOrSecret.secretKeyOverride
    : typeof optionsOrSecret === "string"
    ? optionsOrSecret
    : undefined;

  let activeSecretKey = explicitSecret;

  if (!activeSecretKey && isOptionsObject && optionsOrSecret.expectedAction) {
    const actions = Array.isArray(optionsOrSecret.expectedAction)
      ? optionsOrSecret.expectedAction
      : [optionsOrSecret.expectedAction];

    if (actions.some((a) => a.includes("resume"))) {
      activeSecretKey =
        process.env.RESUME_TURNSTILE_SECRET_KEY ||
        process.env.RESUME_GAURAVPATIL_SECRET_KEY;
    } else if (actions.some((a) => a.includes("contact_portal") || a.includes("contact_phone") || a.includes("recruiter"))) {
      activeSecretKey = process.env.RECRUITER_TURNSTILE_SECRET_KEY;
    }
  }

  if (!activeSecretKey) {
    activeSecretKey = TURNSTILE_SECRET_KEY;
  }

  if (!activeSecretKey) {
    console.error("CLOUDFLARE_TURNSTILE_SECRET_KEY / TURNSTILE_SECRET is not configured on the server.");
    return {
      success: false,
      error: "Security verification service is unconfigured. Please contact support.",
    };
  }

  // Build expected hostnames set
  const envHostnames = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const optionsHostnames = isOptionsObject ? optionsOrSecret.expectedHostnames : undefined;
  const allowedHostnames = new Set(
    (optionsHostnames || (envHostnames.length > 0 ? envHostnames : DEFAULT_ALLOWED_HOSTNAMES))
      .map((h) => h.toLowerCase())
  );

  // 2. Dispatch canonical siteverify POST request to Cloudflare endpoint
  const formData = new URLSearchParams();
  formData.append("secret", activeSecretKey);
  formData.append("response", cleanToken);
  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  try {
    const response = await fetchWithTimeout(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      },
      10000 // 10s budget per Cloudflare prompt.md
    );

    if (!response.ok) {
      console.warn(`Cloudflare siteverify returned HTTP ${response.status}`);
      return {
        success: false,
        error: `Cloudflare security verification service returned status ${response.status}.`,
      };
    }

    const data = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
      challenge_ts?: string;
      hostname?: string;
      action?: string;
    };

    if (!data.success) {
      const errorCodes = data["error-codes"] || [];
      console.warn("Turnstile siteverify rejected:", errorCodes.join(", "));
      return {
        success: false,
        error: `Security challenge verification failed: ${errorCodes.join(", ") || "Verification expired"}.`,
      };
    }

    // 3. Action validation (if expected action specified)
    const expectedAction = isOptionsObject ? optionsOrSecret.expectedAction : undefined;
    if (expectedAction && data.action) {
      const expectedActions = Array.isArray(expectedAction)
        ? expectedAction
        : [expectedAction];

      if (!expectedActions.includes(data.action)) {
        console.warn(`Turnstile action mismatch: got "${data.action}", expected "${expectedActions.join('", "')}"`);
        return {
          success: false,
          error: "Security verification action mismatch.",
        };
      }
    }

    // 4. Hostname validation
    if (data.hostname && allowedHostnames.size > 0) {
      const returnedHostname = data.hostname.toLowerCase();
      const isAllowed =
        allowedHostnames.has(returnedHostname) ||
        returnedHostname.endsWith(".vercel.app") ||
        returnedHostname.endsWith(".gauravpatil.site") ||
        returnedHostname.endsWith(".localhost") ||
        returnedHostname === "localhost" ||
        returnedHostname === "127.0.0.1" ||
        process.env.NODE_ENV === "development";

      if (!isAllowed) {
        console.warn(`Turnstile hostname mismatch: "${data.hostname}" not in allowlist.`);
        return {
          success: false,
          error: "Security challenge verification domain mismatch.",
        };
      }
    }

    return {
      success: true,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
      action: data.action,
    };
  } catch (err: unknown) {
    console.error("Turnstile siteverify network error:", err);
    return {
      success: false,
      error: "Security verification network timeout. Please try again.",
    };
  }
}
