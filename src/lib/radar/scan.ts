import "server-only";
import { bestOffer } from "../catalog";
import { db } from "../db";
import { sendEmail } from "../mail";
import { allegroEnabled, fetchAllegroListings } from "./allegro";
import { generateDemoListings } from "./demo-source";
import { describeWatch, keywordPhrases, matches, watchFromRow, type Listing, type Watch } from "./match";
import { effectivePlan } from "./plans";
import { SOURCES } from "./sources";
import { fetchVintedListings, vintedEnabled, type VintedQuery } from "./vinted";
import { olxSnapshotEnabled, olxSnapshotListings } from "./olx-snapshot";
import { sendDiscord } from "./discord";
import { recheckMatches } from "./liveness";
import { SITE_URL } from "../site";

const SITE = SITE_URL;
const FIRST_RUN_LOOKBACK_DAYS = 7;

export interface ScanResult {
  fetched: number;
  newMatches: number;
  notified: number;
  removed: number;
}

/** Zapis paczkami (jedno zapytanie na 200 ogłoszeń): baza bywa daleko od serwera, a każde zapytanie to osobna podróż. */
async function saveListings(listings: Listing[]): Promise<Listing[]> {
  const saved: Listing[] = [];
  for (let i = 0; i < listings.length; i += 200) {
    const chunk = listings.slice(i, i + 200);
    const rows = await db.all<{ source: string; external_id: string }>(
      `INSERT INTO listings (id, source, external_id, title, price, url, image, location, condition, category, length_cm, size, family, ski_slug, posted_at, seen_at)
       VALUES ${chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}
       ON CONFLICT (source, external_id) DO NOTHING RETURNING source, external_id`,
      ...chunk.flatMap((l) => [l.id, l.source, l.external_id, l.title, l.price, l.url, l.image, l.location, l.condition, l.category, l.length_cm, l.size, l.family, l.ski_slug, l.posted_at, l.seen_at]),
    );
    const added = new Set(rows.map((r) => `${r.source}:${r.external_id}`));
    saved.push(...chunk.filter((l) => added.has(`${l.source}:${l.external_id}`)));
  }
  return saved;
}

const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;

/** Treść e-maila z listą nowych ogłoszeń dla jednego wyszukiwania. */
function emailFor(watch: Watch, items: Listing[]): { subject: string; body: string } {
  const subject =
    items.length === 1
      ? `Nowe ogłoszenie: ${items[0].title.slice(0, 60)} za ${zl(items[0].price)}`
      : `${items.length} nowe ogłoszenia dla „${watch.name}”, od ${zl(Math.min(...items.map((i) => i.price)))}`;
  const lines = items.map((l) => {
    const fresh = l.ski_slug ? bestOffer(l.ski_slug)?.price : undefined;
    const vsNew = fresh ? `, nowe od ${zl(fresh)} (−${Math.round((1 - l.price / fresh) * 100)}%)` : "";
    return `• ${l.title}\n  ${zl(l.price)}${vsNew} · ${SOURCES[l.source].label} · ${l.location ?? ""}\n  ${l.url}`;
  });
  const body = [
    `Wyszukiwanie: ${watch.name} (${describeWatch(watch)})`,
    "",
    ...lines,
    "",
    `Wszystkie ogłoszenia i ustawienia: ${SITE}/panel/wyszukiwania/${watch.id}`,
  ].join("\n");
  return { subject, body };
}

interface Recipient {
  user_id: string;
  email: string;
  discord_webhook: string | null;
}

async function notify(to: Recipient, watch: Watch, items: Listing[]) {
  const { subject, body } = emailFor(watch, items);
  const channels: string[] = [await sendEmail(to.email, subject, body)];
  if (to.discord_webhook) {
    const ok = await sendDiscord(to.discord_webhook, `**${subject}**`, items, `${SITE}/panel/wyszukiwania/${watch.id}`);
    channels.push(ok ? "discord" : "discord_error");
  }
  const now = new Date().toISOString();
  await db.run("INSERT INTO radar_notifications (user_id, watch_id, subject, body, matches, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", to.user_id, watch.id, subject, body, items.length, channels.join(","), now);
  for (const l of items)
    await db.run("UPDATE watch_matches SET notified_at = ? WHERE watch_id = ? AND listing_id = ?", now, watch.id, l.id);
}

/**
 * Jeden przebieg bota: pobiera nowe ogłoszenia ze źródeł, dopasowuje je do aktywnych
 * wyszukiwań i wysyła powiadomienia „od razu” (plan Pro). Podsumowania dzienne: sendDigests().
 */
export async function runScan(opts: { userId?: string; demoCount?: number } = {}): Promise<ScanResult> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const rows = await db.all(`SELECT w.*, u.email, u.plan, u.plan_until, u.discord_webhook FROM watches w JOIN users u ON u.id = w.user_id
       WHERE w.active = 1 ${opts.userId ? "AND w.user_id = ?" : ""}`, ...(opts.userId ? [opts.userId] : [])) as any[];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // 1. pobranie ogłoszeń
  const incoming: Listing[] = [];
  if (process.env.RADAR_DEMO === "true") incoming.push(...generateDemoListings(opts.demoCount ?? 12));
  const forSource = (source: string) => rows.filter((r) => JSON.parse(r.sources || "[]").includes(source));
  const phrasesFor = (source: string) =>
    [...new Set(forSource(source).flatMap((r) => [...JSON.parse(r.families), ...keywordPhrases(r.keywords)]))] as string[];
  /** jedno zapytanie na frazę wyszukiwania, z jego kategorią, ceną i stanem (filtry po stronie Vinted) */
  const queriesFor = (source: string) => {
    const seen = new Map<string, VintedQuery>();
    for (const r of forSource(source))
      for (const phrase of [...JSON.parse(r.families), ...keywordPhrases(r.keywords)] as string[]) {
        const q: VintedQuery = {
          phrase,
          category: r.category ?? "skis",
          gender: r.category === "boots" ? (r.gender ?? "all") : "all",
          minPrice: r.min_price,
          maxPrice: r.max_price,
          conditions: JSON.parse(r.conditions || "[]"),
        };
        seen.set(JSON.stringify({ ...q, phrase: phrase.toLowerCase() }), q);
      }
    return [...seen.values()];
  };
  if (olxSnapshotEnabled()) incoming.push(...olxSnapshotListings());
  if (vintedEnabled()) incoming.push(...(await fetchVintedListings(queriesFor("vinted")).catch(() => [])));
  if (allegroEnabled()) incoming.push(...(await fetchAllegroListings(phrasesFor("allegro")).catch(() => [])));
  await saveListings(incoming);

  // 2. dopasowanie
  let newMatches = 0;
  let notified = 0;
  const now = new Date().toISOString();
  for (const row of rows) {
    const watch = watchFromRow(row);
    const since =
      watch.last_run_at ?? new Date(Date.now() - FIRST_RUN_LOOKBACK_DAYS * 86_400_000).toISOString();
    const candidates = await db.all("SELECT * FROM listings WHERE seen_at > ?", since) as unknown as Listing[];
    const hits = candidates.filter((l) => matches(watch, l));
    let found: Listing[] = [];
    if (hits.length) {
      const added = await db.all<{ listing_id: string }>(
        `INSERT INTO watch_matches (watch_id, listing_id, created_at) VALUES ${hits.map(() => "(?, ?, ?)").join(", ")}
         ON CONFLICT (watch_id, listing_id) DO NOTHING RETURNING listing_id`,
        ...hits.flatMap((l) => [watch.id, l.id, now]),
      );
      const ids = new Set(added.map((r) => r.listing_id));
      found = hits.filter((l) => ids.has(l.id));
    }
    await db.run("UPDATE watches SET last_run_at = ? WHERE id = ?", now, watch.id);
    newMatches += found.length;

    // 3. powiadomienie natychmiastowe tylko w planie Pro
    const pro = effectivePlan(row.plan, row.plan_until) === "pro";
    if (found.length && watch.notify === "instant" && pro) {
      await notify(row, watch, found.sort((a, b) => a.price - b.price));
      notified++;
    }
  }
  // sprzedane i usunięte ogłoszenia oznaczamy, żeby nie prowadziły do „page not found”
  const removed = await recheckMatches({ userId: opts.userId }).catch(() => 0);
  return { fetched: incoming.length, newMatches, notified, removed };
}

/** Podsumowanie dzienne: wszystkie niewysłane dopasowania, jeden e-mail na wyszukiwanie. */
export async function sendDigests(opts: { userId?: string } = {}): Promise<number> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const rows = await db.all(`SELECT w.*, u.email, u.plan, u.plan_until, u.discord_webhook FROM watches w JOIN users u ON u.id = w.user_id
       WHERE w.active = 1 AND w.notify != 'off' ${opts.userId ? "AND w.user_id = ?" : ""}`, ...(opts.userId ? [opts.userId] : [])) as any[];
  /* eslint-enable @typescript-eslint/no-explicit-any */
  let sent = 0;
  for (const row of rows) {
    const watch = watchFromRow(row);
    const pending = await db.all(`SELECT l.* FROM watch_matches m JOIN listings l ON l.id = m.listing_id
         WHERE m.watch_id = ? AND m.notified_at IS NULL AND m.status != 'dismissed' ORDER BY l.price`, watch.id) as unknown as Listing[];
    if (!pending.length) continue;
    await notify(row, watch, pending);
    sent++;
  }
  return sent;
}
