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
  showCountdown: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
}

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

export function normalizeNotices(
  rawMap: Record<string, unknown> | null | undefined
): MarqueeNotice[] {
  if (!rawMap || typeof rawMap !== "object") return [];

  const list: MarqueeNotice[] = [];
  for (const [key, value] of Object.entries(rawMap)) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!text) continue;

    const tone = sanitizeTone(item.tone);
    const direction: MarqueeNoticeDirection = item.direction === "rtl" ? "rtl" : "ltr";
    const meta = resolveModeMeta({
      tone,
      modeLabel: typeof item.modeLabel === "string" ? item.modeLabel : undefined,
      modeColor: typeof item.modeColor === "string" ? sanitizeColor(item.modeColor) : undefined,
    });

    list.push({
      id: typeof item.id === "string" && item.id ? item.id : key,
      text,
      tone,
      modeLabel: typeof item.modeLabel === "string" && item.modeLabel.trim() ? item.modeLabel.trim().toUpperCase().slice(0, 14) : meta.label,
      modeColor: meta.color,
      direction,
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
