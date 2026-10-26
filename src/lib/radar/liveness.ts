import "server-only";
import { db } from "../db";
import type { Listing } from "./match";

/**
 * Czy ogłoszenie nadal istnieje. Sprzedane lub usunięte ogłoszenie Vinted zwraca 404.
 * Sprawdzamy tylko Vinted: OLX blokuje zapytania bota, a Allegro i próbka OLX mają własne źródła.
 */

const UA = "ApexRadar/0.1 (projekt studencki)";
const RECHECK_HOURS = 6;

export type Liveness = "alive" | "removed" | "unknown";

export async function checkListing(l: Pick<Listing, "id" | "source" | "url">): Promise<Liveness> {
  if (l.source !== "vinted") return "unknown";
  const res = await fetch(l.url, { headers: { "User-Agent": UA }, redirect: "manual", cache: "no-store" }).catch(() => null);
  const state: Liveness = !res ? "unknown" : res.status === 404 || res.status === 410 ? "removed" : res.status < 400 ? "alive" : "unknown";
  if (state !== "unknown") {
    const now = new Date().toISOString();
    await db.run("UPDATE listings SET checked_at = ?, removed_at = CASE WHEN ? THEN COALESCE(removed_at, ?) ELSE NULL END WHERE id = ?", now, state === "removed", now, l.id);
  }
  return state;
}

/** Przy skanie sprawdza kilka najdawniej sprawdzanych ogłoszeń z aktywnych dopasowań. */
export async function recheckMatches(opts: { userId?: string; limit?: number } = {}): Promise<number> {
  const since = new Date(Date.now() - RECHECK_HOURS * 3_600_000).toISOString();
  const rows = await db.all(`SELECT DISTINCT l.id, l.source, l.url, l.checked_at FROM watch_matches m
       JOIN watches w ON w.id = m.watch_id JOIN listings l ON l.id = m.listing_id
       WHERE l.source = 'vinted' AND l.removed_at IS NULL AND m.status != 'dismissed'
         AND (l.checked_at IS NULL OR l.checked_at < ?) ${opts.userId ? "AND w.user_id = ?" : ""}
       ORDER BY l.checked_at IS NOT NULL, l.checked_at LIMIT ?`, since, ...(opts.userId ? [opts.userId] : []), opts.limit ?? 12) as Pick<Listing, "id" | "source" | "url">[];
  let removed = 0;
  for (const [i, l] of rows.entries()) {
    if (i) await new Promise((r) => setTimeout(r, 400));
    if ((await checkListing(l)) === "removed") removed++;
  }
  return removed;
}
