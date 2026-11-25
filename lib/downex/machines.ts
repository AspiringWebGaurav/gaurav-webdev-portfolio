export interface DownexMachine {
  hwid: string;
  name?: string;
  version: string;
  os: string;
  arch?: string;
  first_seen?: number;
  last_seen: number;
  is_banned: boolean;
  is_connected?: boolean;
  ban_reason?: string;
  last_ip?: string;
  downloads_completed?: number;
  total_bytes?: number;
}

const DOWNEX_HWID_PATTERN = /^DWNX-[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/;

export function normalizeDownexHwid(raw?: string | null): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

export function isValidDownexHwid(raw?: string | null): boolean {
  const normalized = normalizeDownexHwid(raw);
  return DOWNEX_HWID_PATTERN.test(normalized);
}

export function sortMachinesByInstallOrder<T extends Pick<DownexMachine, "hwid" | "first_seen" | "last_seen">>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const aOrder = Number(a.first_seen || a.last_seen || 0);
    const bOrder = Number(b.first_seen || b.last_seen || 0);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.hwid || "").localeCompare(b.hwid || "");
  });
}

export function normalizeMachinesMap(
  rawMap: Record<string, Record<string, unknown>> | null | undefined
): DownexMachine[] {
  if (!rawMap || typeof rawMap !== "object") return [];

  const byHwid = new Map<string, DownexMachine>();

  for (const [key, rawVal] of Object.entries(rawMap)) {
    if (!rawVal || typeof rawVal !== "object") continue;

    const val = rawVal as Record<string, unknown>;
    const candidateHwid =
      typeof val.hwid === "string" && val.hwid.trim()
        ? normalizeDownexHwid(val.hwid)
        : normalizeDownexHwid(key);

    if (!isValidDownexHwid(candidateHwid)) continue;

    const lastSeen = Number(val.last_seen || 0);
    const existing = byHwid.get(candidateHwid);
    if (existing && existing.last_seen > lastSeen) continue;

    const firstSeenRaw = Number(val.first_seen || 0);

    byHwid.set(candidateHwid, {
      ...(val as Partial<DownexMachine>),
      hwid: candidateHwid,
      version:
        typeof val.version === "string" && val.version.trim()
          ? val.version.trim()
          : "0.0.1",
      os:
        typeof val.os === "string" && val.os.trim()
          ? val.os.trim()
          : "Windows 11 x64",
      last_seen: lastSeen,
      first_seen: firstSeenRaw > 0 ? firstSeenRaw : lastSeen || undefined,
      is_banned: val.is_banned === true,
      is_connected: val.is_connected === true,
    });
  }

  return sortMachinesByInstallOrder(Array.from(byHwid.values()));
}
