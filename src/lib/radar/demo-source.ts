import { randomUUID } from "node:crypto";
import { bestOffer } from "../catalog";
import { familyOf, getSkis } from "../skis";
import type { Listing } from "./match";
import { SOURCES, type Condition, type SourceId } from "./sources";

/**
 * DEMO: źródło ogłoszeń generujące realistyczne oferty z rynku wtórnego na podstawie katalogu.
 * W produkcji zastępują je adaptery prawdziwych serwisów (np. oficjalne API Allegro).
 * Linki prowadzą do prawdziwych wyszukiwań w danym serwisie.
 */

const CITIES = [
  "Kraków", "Warszawa", "Wrocław", "Katowice", "Bielsko-Biała", "Nowy Targ", "Zakopane", "Poznań", "Gdańsk",
  "Łódź", "Rzeszów", "Nowy Sącz", "Jelenia Góra", "Gliwice", "Lublin", "Szczecin", "Kielce", "Żywiec", "Opole",
];

const CONDITION_WEIGHTS: [Condition, number, [number, number]][] = [
  ["new", 0.12, [0.82, 0.95]],
  ["like_new", 0.28, [0.62, 0.8]],
  ["used", 0.45, [0.42, 0.62]],
  ["worn", 0.15, [0.25, 0.42]],
];

const SOURCE_WEIGHTS: [SourceId, number][] = [
  ["olx", 0.5],
  ["allegro", 0.32],
  ["vinted", 0.18],
];

const pick = <T,>(items: [T, number, ...unknown[]][]): [T, number, ...unknown[]] => {
  let r = Math.random();
  for (const it of items) {
    r -= it[1];
    if (r <= 0) return it;
  }
  return items[items.length - 1];
};

const TITLE_SUFFIX: Record<Condition, string[]> = {
  new: ["nowe, nieużywane", "NOWE z metką", "nowe, nietrafiony prezent"],
  like_new: ["stan idealny", "jak nowe, 1 sezon", "używane kilka dni", "stan bdb+"],
  used: ["stan dobry", "po serwisie", "2 sezony", "zadbane"],
  worn: ["do jazdy rekreacyjnej", "ślady użytkowania", "tanio", "na początek"],
};

const round = (n: number) => (n > 1000 ? Math.round(n / 50) * 50 : Math.round(n / 10) * 10);

export function generateDemoListings(count: number): Listing[] {
  const skis = getSkis();
  const now = Date.now();
  const out: Listing[] = [];
  for (let i = 0; i < count; i++) {
    const ski = skis[Math.floor(Math.random() * skis.length)];
    const [condition, , [lo, hi]] = pick(CONDITION_WEIGHTS) as [Condition, number, [number, number]];
    const [source] = pick(SOURCE_WEIGHTS) as [SourceId, number];
    const length = ski.lengths[Math.floor(Math.random() * ski.lengths.length)].length_cm;
    const newPrice = bestOffer(ski.slug)?.price ?? 2500;
    const price = round(newPrice * (lo + Math.random() * (hi - lo)));
    const suffix = TITLE_SUFFIX[condition][Math.floor(Math.random() * TITLE_SUFFIX[condition].length)];
    const shortModel = ski.model.replace(/\s*\+.*$/, "").replace(/\s*\(.*\)$/, "");
    const withBinding = ski.system_binding ? " z wiązaniami" : "";
    const titles = [
      `Narty ${ski.brand} ${shortModel} ${length} cm${withBinding}, ${suffix}`,
      `${ski.brand} ${shortModel} ${ski.season} ${length}cm ${suffix}`,
      `${ski.brand} ${shortModel} ${length}, ${suffix}`,
    ];
    const posted = new Date(now - Math.random() * 6 * 3600_000);
    out.push({
      id: randomUUID(),
      source,
      external_id: `demo-${randomUUID().slice(0, 8)}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      price,
      url: SOURCES[source].searchUrl(`${ski.brand} ${shortModel}`),
      image: ski.image ?? null,
      location: CITIES[Math.floor(Math.random() * CITIES.length)],
      condition,
      category: "skis",
      length_cm: length,
      size: null,
      family: familyOf(ski),
      ski_slug: ski.slug,
      posted_at: posted.toISOString(),
      seen_at: new Date().toISOString(),
    });
  }
  return out;
}
