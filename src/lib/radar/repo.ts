import "server-only";
import { getDb } from "../db";
import { watchFromRow, type Listing, type Watch } from "./match";
import { MATCH_SORTS, type MatchSort } from "./sort";

export interface MatchRow extends Listing {
  removed_at: string | null;
  match_id: number;
  watch_id: string;
  watch_name: string;
  status: "new" | "saved" | "dismissed";
  matched_at: string;
  notified_at: string | null;
}

export interface WatchWithStats extends Watch {
  total: number;
  fresh: number;
  best: number | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function listWatches(userId: string): WatchWithStats[] {
  const rows = getDb()
    .prepare(
      `SELECT w.*,
         (SELECT COUNT(*) FROM watch_matches m WHERE m.watch_id = w.id AND m.status != 'dismissed') AS total,
         (SELECT COUNT(*) FROM watch_matches m WHERE m.watch_id = w.id AND m.status = 'new') AS fresh,
         (SELECT MIN(l.price) FROM watch_matches m JOIN listings l ON l.id = m.listing_id WHERE m.watch_id = w.id AND m.status != 'dismissed') AS best
       FROM watches w WHERE w.user_id = ? ORDER BY w.created_at DESC`,
    )
    .all(userId) as any[];
  return rows.map((r) => ({ ...watchFromRow(r), total: r.total, fresh: r.fresh, best: r.best }));
}

export function getWatch(userId: string, id: string): Watch | null {
  const r = getDb().prepare("SELECT * FROM watches WHERE id = ? AND user_id = ?").get(id, userId);
  return r ? watchFromRow(r) : null;
}

export function listMatches(
  userId: string,
  opts: { watchId?: string; status?: "new" | "saved" | "dismissed" | "active"; sort?: MatchSort; limit?: number } = {},
): MatchRow[] {
  const where = ["w.user_id = ?"];
  const args: (string | number)[] = [userId];
  if (opts.watchId) {
    where.push("w.id = ?");
    args.push(opts.watchId);
  }
  if (opts.status === "active") where.push("m.status != 'dismissed'");
  else if (opts.status) {
    where.push("m.status = ?");
    args.push(opts.status);
  }
  return getDb()
    .prepare(
      `SELECT l.*, m.id AS match_id, m.watch_id, w.name AS watch_name, m.status, m.created_at AS matched_at, m.notified_at
       FROM watch_matches m JOIN watches w ON w.id = m.watch_id JOIN listings l ON l.id = m.listing_id
       WHERE ${where.join(" AND ")} ORDER BY l.removed_at IS NOT NULL, ${MATCH_SORTS[opts.sort ?? "newest"].sql} LIMIT ?`,
    )
    .all(...args, opts.limit ?? 200) as any[];
}

export function listNotifications(userId: string, limit = 50) {
  return getDb()
    .prepare("SELECT * FROM radar_notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit) as unknown as {
    id: number;
    watch_id: string | null;
    subject: string;
    body: string;
    matches: number;
    channel: string;
    created_at: string;
  }[];
}

export function dashboardStats(userId: string) {
  const db = getDb();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const q = (sql: string, ...a: (string | number)[]) => (db.prepare(sql).get(...a) as any)?.n ?? 0;
  return {
    activeWatches: q("SELECT COUNT(*) AS n FROM watches WHERE user_id = ? AND active = 1", userId),
    matches24h: q(
      "SELECT COUNT(*) AS n FROM watch_matches m JOIN watches w ON w.id = m.watch_id WHERE w.user_id = ? AND m.created_at > ?",
      userId,
      since,
    ),
    unseen: q("SELECT COUNT(*) AS n FROM watch_matches m JOIN watches w ON w.id = m.watch_id WHERE w.user_id = ? AND m.status = 'new'", userId),
    saved: q("SELECT COUNT(*) AS n FROM watch_matches m JOIN watches w ON w.id = m.watch_id WHERE w.user_id = ? AND m.status = 'saved'", userId),
    notifications: q("SELECT COUNT(*) AS n FROM radar_notifications WHERE user_id = ?", userId),
    lastScan: (db.prepare("SELECT MAX(last_run_at) AS t FROM watches WHERE user_id = ?").get(userId) as any)?.t as string | null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
