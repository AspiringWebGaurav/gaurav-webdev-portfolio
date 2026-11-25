import React from "react";
import { cookies } from "next/headers";
import { DOWNEX_ADMIN_COOKIE_NAME, ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/auth";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";
import { MarqueeNotice, normalizeNotices } from "@/lib/downex/notices";
import { normalizeMachinesMap, type DownexMachine } from "@/lib/downex/machines";
import DownexAdminClient from "./DownexAdminClient";

export const dynamic = "force-dynamic";

export default async function DownexAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const initialTab: "CLIENTS" | "NOTICES" =
    sp?.tab === "notices" ? "NOTICES" : "CLIENTS";

  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get(DOWNEX_ADMIN_COOKIE_NAME)?.value ||
    cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const verifiedSession = sessionCookie ? await verifyAdminSession(sessionCookie) : null;

  let initialMachines: DownexMachine[] = [];
  let initialNotices: MarqueeNotice[] = [];

  if (verifiedSession) {
    const [machinesMap, noticesMap] = await Promise.all([
      rtdbDataSource.getValue<Record<string, Record<string, unknown>>>("ecosystem/apps/downex/machines"),
      rtdbDataSource.getValue<Record<string, unknown>>("ecosystem/apps/downex/notices"),
    ]);

    initialMachines = normalizeMachinesMap(machinesMap);

    initialNotices = normalizeNotices(noticesMap);
  }

  return (
    <DownexAdminClient
      initialSession={verifiedSession}
      initialMachines={initialMachines}
      initialNotices={initialNotices}
      initialTab={initialTab}
    />
  );
}
