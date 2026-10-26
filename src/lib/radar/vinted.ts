import { randomUUID } from "node:crypto";
import { normalize } from "../search";
import { recognize, type Listing } from "./match";
import type { Category, Condition, Gender } from "./sources";

/**
 * Prawdziwe ogłoszenia z Vinted: publiczna strona katalogu (wyszukiwanie z filtrami kategorii, ceny i stanu).
 * Vinted nie ma publicznego API, a regulamin nie przewiduje automatycznego pobierania,
 * więc to źródło służy tylko do pokazu: mało zapytań, przerwa między nimi, bez udawania przeglądarki.
 * Wyłączenie: RADAR_VINTED=false.
 */

const BASE = "https://www.vinted.pl";
const UA = "ApexRadar/0.1 (projekt studencki)";
const MAX_PHRASES = 12;
const PAUSE_MS = 1500;

export const vintedEnabled = () => process.env.RADAR_VINTED !== "false";

const CONDITION_MAP: [RegExp, Condition][] = [
  [/nowy z metką|nowy bez metki/i, "new"],
  [/bardzo dobry/i, "like_new"],
  [/^dobry/i, "used"],
  [/zadowalający/i, "worn"],
];

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Czy ogłoszenie pasuje do kategorii (wyszukiwarka Vinted zwraca też akcesoria i inne rzeczy). */
function fitsCategory(title: string, category: Category): boolean {
  if (/\b(kij|kask|gogle|kurtk|spodn|rękawic|skarpet|biegow|skate)/i.test(title)) return false;
  // narty: tylko zjazdowe, bez skiturowych; buty: skiturowe tak, wysokogórskie i trekkingowe nie
  if (category === "skis" && /\bskitur/i.test(title)) return false;
  if (category === "boots" && /(wysokogórsk|trekking|turistick|horolez|gojzar|hiking|approach|trail|sneaker|półautomat|do raków)/i.test(title))
    return false;
  // „lyže” to po czesku narty, a „lyžiarky”/„lyžáky” to buty
  const boot = /\b(but|boot|skischuh|lyžiark|lyziark|lyžák|lyzak|pancer|clapari|skistøvl|pjäx)/i.test(title);
  if (category === "boots") return boot || !/\bnart/i.test(title);
  // narty: wyniki są już z kategorii „Narty zjazdowe”, odrzucamy tylko źle skategoryzowane buty
  return !boot;
}

/**
 * Kafelek ogłoszenia ma atrybut title w formacie
 * „Tytuł, Marka: X, Stan: Y, Rozmiar: 43, 1350.00 zł, 1420.40 zł” (druga cena zawiera opłatę dla kupującego).
 */
export function parseCatalog(html: string, category: Category = "skis", now = new Date().toISOString()): Listing[] {
  const out = new Map<string, Listing>();
  const re = /<a href="(\/items\/(\d+)-[^"?]*)[^"]*"[^>]*data-testid="product-item-id-\2--overlay-link"[^>]*title="([^"]+)"/g;
  for (const m of html.matchAll(re)) {
    const [, path, id, rawTitle] = m;
    if (out.has(id)) continue;
    const parts = decode(rawTitle).split(", ");
    const priceIdx = parts.findIndex((p) => /^\d+(\.\d+)? zł$/.test(p));
    if (priceIdx < 0) continue;
    const meta = parts.slice(0, priceIdx);
    const field = (name: string) => meta.find((p) => p.startsWith(`${name}: `))?.slice(name.length + 2) ?? "";
    const bare = meta.filter((p) => !/^(Marka|Stan|Rozmiar): /.test(p)).join(", ");
    // marka bywa tylko w polu „Marka” („Buty narciarskie 42”), a frazy porównujemy z tytułem
    const brand = field("Marka");
    const title =
      brand && !/^(inna|inne|bez marki)$/i.test(brand) && !bare.toLowerCase().includes(brand.toLowerCase()) ? `${bare} (${brand})` : bare;
    const rec = category === "skis" ? recognize(title) : { family: null, skiSlug: null, length: null };
    if (!fitsCategory(title, category)) continue;
    const size = Number(field("Rozmiar").replace(",", "."));
    const img = [...html.slice(Math.max(0, m.index - 2500), m.index).matchAll(/<img src="(https:\/\/images\d*\.vinted\.net\/[^"]+)"/g)].at(-1);
    out.set(id, {
      id: randomUUID(),
      source: "vinted",
      external_id: id,
      title,
      price: Math.round(Number(parts[priceIdx].replace(" zł", ""))),
      url: `${BASE}${path}`,
      image: img ? decode(img[1]) : null,
      location: null,
      condition: CONDITION_MAP.find(([r]) => r.test(field("Stan")))?.[1] ?? null,
      category,
      length_cm: rec.length,
      size: category === "boots" && size >= 15 && size <= 50 ? size : null,
      family: rec.family,
      ski_slug: rec.skiSlug,
      posted_at: now,
      seen_at: now,
    });
  }
  return [...out.values()];
}

/**
 * Kategorie katalogu Vinted. Buty narciarskie są w czterech miejscach drzewa:
 * Mężczyźni / Kobiety / Dziewczynki / Chłopcy → Obuwie → Obuwie sportowe → Buty narciarskie.
 */
const BOOT_CATALOGS: Record<Gender, number[]> = {
  men: [2683],
  women: [2652],
  kids: [2715, 2746],
  all: [2683, 2652, 2715, 2746],
};
const SKI_CATALOGS = [4733]; // Sport → Sporty zimowe → Narty zjazdowe

/** Stan na Vinted: 6 nowy z metką, 1 nowy bez metki, 2 bardzo dobry, 3 dobry, 4 zadowalający. */
const STATUS_IDS: Record<Condition, number[]> = { new: [6, 1], like_new: [2], used: [3], worn: [4] };

export interface VintedQuery {
  phrase: string;
  category: Category;
  gender: Gender;
  minPrice: number | null;
  maxPrice: number | null;
  conditions: Condition[];
}

/**
 * Adres wyszukiwania z filtrami po stronie Vinted (kategoria, cena, stan), sortowanie po trafności.
 * Bez filtrów pierwsza strona wyników to w większości przypadkowe rzeczy, a dalszych stron nie czytamy.
 */
export function vintedSearchUrl(q: VintedQuery): string {
  // wyszukiwarka Vinted nie znajduje fraz z „ö” itp., więc pytamy bez znaków diakrytycznych
  const params = new URLSearchParams({ search_text: normalize(q.phrase).trim() });
  for (const id of q.category === "boots" ? BOOT_CATALOGS[q.gender] : SKI_CATALOGS) params.append("catalog[]", String(id));
  if (q.minPrice != null) params.set("price_from", String(q.minPrice));
  if (q.maxPrice != null) params.set("price_to", String(q.maxPrice));
  if (q.minPrice != null || q.maxPrice != null) params.set("currency", "PLN");
  for (const id of q.conditions.flatMap((c) => STATUS_IDS[c])) params.append("status_ids[]", String(id));
  return `${BASE}/catalog?${params}`;
}

export async function fetchVintedListings(queries: VintedQuery[]): Promise<Listing[]> {
  if (!vintedEnabled()) return [];
  const out: Listing[] = [];
  for (const [i, q] of queries.slice(0, MAX_PHRASES).entries()) {
    if (i) await new Promise((r) => setTimeout(r, PAUSE_MS));
    const res = await fetch(vintedSearchUrl(q), { headers: { "User-Agent": UA }, cache: "no-store" }).catch(() => null);
    if (!res?.ok) continue;
    out.push(...parseCatalog(await res.text(), q.category));
  }
  return out;
}
