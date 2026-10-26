import { normalize, searchSkis } from "../search";
import { familyOf, getSkis } from "../skis";
import { CATEGORIES, GENDERS, type Category, type Condition, type Gender, type SourceId } from "./sources";

export interface Listing {
  id: string;
  source: SourceId;
  external_id: string;
  title: string;
  price: number;
  url: string;
  image: string | null;
  location: string | null;
  condition: Condition | null;
  category: Category;
  length_cm: number | null;
  /** rozmiar EU (buty) */
  size: number | null;
  family: string | null;
  ski_slug: string | null;
  posted_at: string;
  seen_at: string;
}

export interface Watch {
  id: string;
  user_id: string;
  name: string;
  category: Category;
  gender: Gender;
  families: string[];
  keywords: string;
  min_price: number | null;
  max_price: number | null;
  len_min: number | null;
  len_max: number | null;
  size_min: number | null;
  size_max: number | null;
  conditions: Condition[];
  sources: SourceId[];
  notify: "instant" | "daily" | "off";
  active: boolean;
  created_at: string;
  last_run_at: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function watchFromRow(r: any): Watch {
  return {
    ...r,
    category: r.category ?? "skis",
    gender: r.gender ?? "all",
    families: JSON.parse(r.families || "[]"),
    conditions: JSON.parse(r.conditions || "[]"),
    sources: JSON.parse(r.sources || "[]"),
    active: Boolean(r.active),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Czy wszystkie słowa nazwy modelu (bez marki) są w tytule, np. „redster” i „s9”. */
function namedIn(family: string, brand: string, title: string): boolean {
  const t = ` ${normalize(title)} `;
  const brandWords = new Set(normalize(brand).split(/\s+/));
  return normalize(family)
    .split(/\s+/)
    .filter((w) => w && !brandWords.has(w))
    .every((w) => t.includes(` ${w} `) || t.replace(/\s+/g, "").includes(w));
}

/**
 * Rozpoznaje model z tytułu ogłoszenia („Narty Atomic Redster S9 165 cm + wiązania”)
 * i długość w cm. Używa tej samej wyszukiwarki co katalog.
 */
export function recognize(title: string): { family: string | null; skiSlug: string | null; length: number | null } {
  const words = normalize(title)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !["narty", "nart", "cm", "stan", "z", "i", "na", "do", "bdb", "wiazania", "wiazaniami"].includes(w));
  // szukamy najdłuższego dopasowania: najpierw cały tytuł, potem coraz krótsze fragmenty
  for (let n = Math.min(words.length, 5); n >= 2; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const hit = searchSkis(getSkis(), words.slice(i, i + n).join(" "))
        .slice(0, 5)
        .find((h) => namedIn(familyOf(h.ski), h.ski.brand, title));
      if (hit) return { family: familyOf(hit.ski), skiSlug: hit.ski.slug, length: lengthIn(title, familyOf(hit.ski)) };
    }
  }
  return { family: null, skiSlug: null, length: lengthIn(title) };
}

/**
 * Długość w cm: „165 cm”, „107cm” (dziecięce też, żeby filtr długości je odrzucił),
 * a bez „cm” liczba 110–199, o ile nie należy do nazwy modelu (np. „Bent 110”).
 */
function lengthIn(title: string, family?: string): number | null {
  const withCm = [...title.matchAll(/\b(\d{2,3})\s?cm\b/gi)].map((m) => Number(m[1])).find((n) => n >= 60 && n <= 210);
  if (withCm) return withCm;
  const modelNumbers = new Set(family ? normalize(family).match(/\d+/g) : []);
  // przy kilku liczbach („Bent 110 180”) długością jest zwykle największa
  const bare = [...title.matchAll(/(?<![\d,]|\d\.)\b(1[1-9]\d)\b(?![.,]\d)/g)].map((m) => m[1]).filter((n) => !modelNumbers.has(n));
  return bare.length ? Math.max(...bare.map(Number)) : null;
}

/** Rozmiar butów do 33 to centymetry (mondopoint), powyżej rozmiar EU. */
export const isMondoRange = (w: Pick<Watch, "size_min" | "size_max">) => (w.size_max ?? w.size_min ?? 99) <= 33;

/** Przybliżone przeliczenie rozmiaru EU na mondopoint: 42 → 26,3 cm, 45 → 28,3 cm. */
export const euToMondo = (eu: number) => (eu - 2.5) / 1.5;

export function formatSizeRange(w: Pick<Watch, "size_min" | "size_max">): string {
  const f = (n: number | null) => (n == null ? "?" : String(n).replace(".", ","));
  return isMondoRange(w) ? `${f(w.size_min)}–${f(w.size_max)} cm (mondo)` : `rozmiar ${f(w.size_min)}–${f(w.size_max)} EU`;
}

/** „tecnica, scarpa mtn” → ["tecnica", "scarpa mtn"] */
export function keywordPhrases(keywords: string): string[] {
  return keywords
    .split(/[,;\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Czy ogłoszenie spełnia warunki wyszukiwania. */
export function matches(watch: Watch, l: Listing): boolean {
  if ((l.category ?? "skis") !== watch.category) return false;
  if (watch.sources.length && !watch.sources.includes(l.source)) return false;
  if (watch.min_price != null && l.price < watch.min_price) return false;
  if (watch.max_price != null && l.price > watch.max_price) return false;
  if (watch.category === "boots" && l.size != null) {
    // zakres wpisany w cm (mondopoint, np. 26–27,5) porównujemy po przeliczeniu rozmiaru EU z ogłoszenia
    const mondo = isMondoRange(watch);
    const size = mondo ? euToMondo(l.size) : l.size;
    const slack = mondo ? 0.5 : 0; // przeliczenie EU → cm jest przybliżone
    if (watch.size_min != null && size < watch.size_min - slack) return false;
    if (watch.size_max != null && size > watch.size_max + slack) return false;
  }
  if (watch.category === "skis" && l.length_cm != null) {
    if (watch.len_min != null && l.length_cm < watch.len_min) return false;
    if (watch.len_max != null && l.length_cm > watch.len_max) return false;
  }
  if (watch.conditions.length && (!l.condition || !watch.conditions.includes(l.condition))) return false;

  const byFamily = watch.families.length > 0 && l.family != null && watch.families.includes(l.family);
  // frazy po przecinku to alternatywy („tecnica, scarpa”), słowa w jednej frazie muszą wystąpić razem
  const phrases = keywordPhrases(watch.keywords).map((p) => normalize(p).split(/\s+/).filter(Boolean));
  const title = normalize(l.title);
  const byKeywords = phrases.some((tokens) => tokens.every((t) => title.includes(t)));

  if (watch.families.length === 0 && phrases.length === 0) return true;
  return byFamily || byKeywords;
}

/** Krótki opis kryteriów do list i e-maili. */
export function describeWatch(w: Watch): string {
  const parts: string[] = [];
  if (w.category !== "skis")
    parts.push(w.gender !== "all" ? `${CATEGORIES[w.category].label} ${GENDERS[w.gender].toLowerCase()}` : CATEGORIES[w.category].label);
  if (w.families.length) parts.push(w.families.join(", "));
  if (w.keywords) parts.push(`„${w.keywords}”`);
  if (w.min_price != null || w.max_price != null)
    parts.push(
      w.min_price != null && w.max_price != null
        ? `${w.min_price}–${w.max_price} zł`
        : w.max_price != null
          ? `do ${w.max_price} zł`
          : `od ${w.min_price} zł`,
    );
  if (w.category === "skis" && (w.len_min != null || w.len_max != null)) parts.push(`${w.len_min ?? "?"}–${w.len_max ?? "?"} cm`);
  if (w.category === "boots" && (w.size_min != null || w.size_max != null))
    parts.push(formatSizeRange(w));
  return parts.join(" · ") || "wszystkie narty";
}
