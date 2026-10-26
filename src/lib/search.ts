import { CATEGORY_LABEL } from "./labels";
import type { Ski } from "./types";

/** Pola potrzebne do wyszukiwania; pasuje i pełna narta, i lekki indeks w przeglądarce. */
export type Searchable = Pick<Ski, "brand" | "model" | "family" | "season" | "category">;

const familyName = (s: Searchable) => s.family ?? `${s.brand} ${s.model}`;

/** Małe litery, bez polskich znaków i diakrytyków (Völkl → volkl, Stöckli → stockli). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9/ ]+/g, " ");
}

/** "25/26", "2025/26", "25-26", "2025-2026" → "2025/26". */
function seasonToken(token: string): string | undefined {
  const m = token.match(/^(?:20)?(\d{2})[/-](?:20)?(\d{2})$/);
  return m ? `20${m[1]}/${m[2]}` : undefined;
}

function haystack(ski: Searchable): string {
  return normalize(
    [ski.brand, ski.model, familyName(ski), ski.season, CATEGORY_LABEL[ski.category], ski.category].join(" "),
  );
}

export interface SearchHit<T extends Searchable> {
  ski: T;
  score: number;
}

/**
 * Każde słowo zapytania musi wystąpić w nazwie (jako początek słowa lub fragment),
 * a rocznik można podać jako 25/26, 2025/26 albo 25-26.
 */
export function searchSkis<T extends Searchable>(skis: T[], query: string): SearchHit<T>[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const hits: SearchHit<T>[] = [];
  for (const ski of skis) {
    const text = haystack(ski);
    const words = text.split(/\s+/);
    let score = 0;
    let ok = true;
    for (const t of tokens) {
      const season = seasonToken(t);
      if (season) {
        if (ski.season !== season) ok = false;
        else score += 3;
        continue;
      }
      if (words.some((w) => w === t)) score += 3;
      else if (words.some((w) => w.startsWith(t))) score += 2;
      else if (text.includes(t)) score += 1;
      else ok = false;
    }
    if (ok) hits.push({ ski, score });
  }
  return hits.sort((a, b) => b.score - a.score || b.ski.season.localeCompare(a.ski.season));
}

/** Wyniki pogrupowane po linii modelu: „Atomic Redster S9” → [2025/26, 2024/25]. */
export function groupByFamily<T extends Searchable>(hits: SearchHit<T>[]): { family: string; skis: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const h of hits) {
    const f = familyName(h.ski);
    groups.set(f, [...(groups.get(f) ?? []), h.ski]);
  }
  return [...groups].map(([family, skis]) => ({
    family,
    skis: skis.sort((a, b) => b.season.localeCompare(a.season)),
  }));
}
