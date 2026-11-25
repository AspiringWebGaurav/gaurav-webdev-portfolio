export type MarqueeNoticeTone =
  | "info"
  | "update"
  | "alert"
  | "tip"
  | "warning"
  | "event"
  | "custom";

export type MarqueeNoticeColor =
  | "zinc"
  | "emerald"
  | "rose"
  | "sky"
  | "amber"
  | "violet"
  | "indigo";

export type MarqueeNoticeDirection = "ltr" | "rtl";

export interface MarqueeNotice {
  id: string;
  text: string;
  tone: MarqueeNoticeTone;
  modeLabel?: string;
  modeColor?: MarqueeNoticeColor;
  direction: MarqueeNoticeDirection;
  speed?: number;
  showCountdown: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
}

export const MARQUEE_SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const DEFAULT_MARQUEE_SPEED = 1;

export const BUILTIN_MARQUEE_MODES: Array<{
  tone: Exclude<MarqueeNoticeTone, "custom">;
  label: string;
  color: MarqueeNoticeColor;
}> = [
  { tone: "info", label: "NORMAL", color: "zinc" },
  { tone: "update", label: "UPDATE", color: "emerald" },
  { tone: "tip", label: "TIP", color: "violet" },
  { tone: "warning", label: "WARNING", color: "amber" },
  { tone: "alert", label: "ALERT", color: "rose" },
  { tone: "event", label: "INFO", color: "sky" },
];

const VALID_TONES = new Set<string>([
  "info",
  "update",
  "alert",
  "tip",
  "warning",
  "event",
  "custom",
]);

const VALID_COLORS = new Set<string>([
  "zinc",
  "emerald",
  "rose",
  "sky",
  "amber",
  "violet",
  "indigo",
]);

export function sanitizeTone(raw: unknown): MarqueeNoticeTone {
  return typeof raw === "string" && VALID_TONES.has(raw)
    ? (raw as MarqueeNoticeTone)
    : "info";
}

export function sanitizeColor(raw: unknown, fallback: MarqueeNoticeColor = "zinc"): MarqueeNoticeColor {
  return typeof raw === "string" && VALID_COLORS.has(raw)
    ? (raw as MarqueeNoticeColor)
    : fallback;
}

export function resolveModeMeta(notice: {
  tone: MarqueeNoticeTone;
  modeLabel?: string;
  modeColor?: MarqueeNoticeColor;
}): { label: string; color: MarqueeNoticeColor } {
  if (notice.tone === "custom") {
    const clean = (notice.modeLabel || "").trim().toUpperCase().slice(0, 14);
    return {
      label: clean || "CUSTOM",
      color: sanitizeColor(notice.modeColor, "indigo"),
    };
  }
  const found = BUILTIN_MARQUEE_MODES.find((m) => m.tone === notice.tone);
  return {
    label: found?.label || "NOTICE",
    color: sanitizeColor(notice.modeColor, found?.color || "zinc"),
  };
}

export function sanitizeNoticeSpeed(raw: unknown): number {
  const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(num) || num <= 0) return DEFAULT_MARQUEE_SPEED;
  return Math.min(2, Math.max(0.5, Math.round(num * 100) / 100));
}

export function computeMarqueeDurationSec(text: string, speed?: number): number {
  const safeSpeed = sanitizeNoticeSpeed(speed);
  const baseDuration = Math.min(34, Math.max(16, 14 + text.length * 0.14));
  return Math.round(Math.min(48, Math.max(8, baseDuration / safeSpeed)) * 10) / 10;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripDuplicateNoticePrefix(
  rawText: string,
  modeLabel?: string,
  tone?: MarqueeNoticeTone
): string {
  let clean = rawText.trim();
  const candidates = new Set<string>([
    "NOTICE",
    "NORMAL",
    "UPDATE",
    "ALERT",
    "TIP",
    "WARNING",
    "INFO",
    "CUSTOM",
  ]);
  if (modeLabel && modeLabel.trim()) {
    candidates.add(modeLabel.trim().toUpperCase());
  }
  if (tone && tone.trim()) {
    candidates.add(tone.trim().toUpperCase());
  }

  const pattern = new RegExp(
    `^(?:${Array.from(candidates).map(escapeRegExp).join("|")})\\s*(?::|—|–|-\\s+)\\s*`,
    "i"
  );

  // Guard against multi-prefix inputs like "TIP: Tip: ..." across any mode
  for (let i = 0; i < 4; i++) {
    const next = clean.replace(pattern, "").trimStart();
    if (!next || next === clean) break;
    clean = next;
  }

  return clean;
}

export function normalizeNotices(
  rawMap: Record<string, unknown> | null | undefined
): MarqueeNotice[] {
  if (!rawMap || typeof rawMap !== "object") return [];

  const list: MarqueeNotice[] = [];
  for (const [key, value] of Object.entries(rawMap)) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const rawText = typeof item.text === "string" ? item.text.trim() : "";
    if (!rawText) continue;

    const tone = sanitizeTone(item.tone);
    const direction: MarqueeNoticeDirection = item.direction === "rtl" ? "rtl" : "ltr";
    const meta = resolveModeMeta({
      tone,
      modeLabel: typeof item.modeLabel === "string" ? item.modeLabel : undefined,
      modeColor: typeof item.modeColor === "string" ? sanitizeColor(item.modeColor) : undefined,
    });
    const modeLabel =
      typeof item.modeLabel === "string" && item.modeLabel.trim()
        ? item.modeLabel.trim().toUpperCase().slice(0, 14)
        : meta.label;
    const text = stripDuplicateNoticePrefix(rawText, modeLabel, tone);
    if (!text) continue;

    list.push({
      id: typeof item.id === "string" && item.id ? item.id : key,
      text,
      tone,
      modeLabel,
      modeColor: meta.color,
      direction,
      speed: sanitizeNoticeSpeed(item.speed),
      showCountdown: item.showCountdown === true,
      active: item.active !== false,
      createdAt: Number(item.createdAt || Date.now()),
      updatedAt: Number(item.updatedAt || item.createdAt || Date.now()),
      expiresAt:
        typeof item.expiresAt === "number" && Number.isFinite(item.expiresAt)
          ? item.expiresAt
          : null,
    });
  }

  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export function filterActiveNotices(
  notices: MarqueeNotice[],
  now = Date.now()
): MarqueeNotice[] {
  return notices.filter(
    (n) => n.active && (n.expiresAt === null || n.expiresAt > now)
  );
}
