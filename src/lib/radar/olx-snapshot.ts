import { randomUUID } from "node:crypto";
import snapshot from "../../../data/olx-snapshot.json";
import { recognize, type Listing } from "./match";

/**
 * OLX: jednorazowa próbka publicznych ogłoszeń zapisana w data/olx-snapshot.json (do pokazu projektu).
 * Bot nie łączy się z OLX; przy każdym skanie podaje te same ogłoszenia, a baza pomija już znane.
 * Wyłączenie: RADAR_OLX_SNAPSHOT=false.
 */

export const olxSnapshotEnabled = () => process.env.RADAR_OLX_SNAPSHOT !== "false";

const MONTHS = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];

/** „Dzisiaj o 11:45”, „Odświeżono dnia 22 października 2026”, „20 października 2026” → ISO. */
function parseDate(text: string, fetchedAt: string): string {
  const today = text.match(/dzisiaj o (\d{1,2}):(\d{2})/i);
  if (today) return `${fetchedAt.slice(0, 10)}T${today[1].padStart(2, "0")}:${today[2]}:00+02:00`;
  const d = text.match(/(\d{1,2}) (\p{L}+) (\d{4})/u);
  const month = d ? MONTHS.indexOf(d[2].toLowerCase()) : -1;
  if (d && month >= 0) return new Date(Date.UTC(Number(d[3]), month, Number(d[1]), 10)).toISOString();
  return fetchedAt;
}

export function olxSnapshotListings(): Listing[] {
  const now = new Date().toISOString();
  return snapshot.items.map((it) => {
    const rec = recognize(it.title);
    return {
      id: randomUUID(),
      source: "olx",
      external_id: it.url.match(/-ID(\w+)\.html$/)?.[1] ?? it.url,
      title: it.title,
      price: it.price,
      url: it.url,
      // miniatura z listy wyników; większy wariant tego samego zdjęcia
      image: it.image?.replace(/s=\d+x\d+/, "s=644x461") ?? null,
      location: it.city,
      condition: it.condition === "Nowe" ? "new" : "used",
      category: "skis",
      length_cm: rec.length,
      size: null,
      family: rec.family,
      ski_slug: rec.skiSlug,
      posted_at: new Date(parseDate(it.date, snapshot.fetched_at)).toISOString(),
      seen_at: now,
    } satisfies Listing;
  });
}
