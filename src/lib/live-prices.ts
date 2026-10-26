import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ProductPrices } from "./types";

/**
 * Aktualne ceny czytane z pliku przy każdym żądaniu. Strony produktów są generowane
 * statycznie z cen z chwili buildu; API (alerty, przekierowania) musi widzieć ceny
 * po ostatnim uruchomieniu scripts/update-prices.mjs.
 */
export function livePrices(slug: string): ProductPrices | undefined {
  const data = JSON.parse(readFileSync(path.join(process.cwd(), "data/offers.json"), "utf-8"));
  return data.products[slug];
}

export function liveBestPrice(slug: string): number | undefined {
  const p = livePrices(slug);
  return p?.min ?? undefined;
}
