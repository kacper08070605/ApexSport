import offersData from "../../data/offers.json";
import shopsData from "../../data/shops.json";
import { getSkis, skiName } from "./skis";
import type { Offer, PricePoint, ProductPrices, Shop, Ski } from "./types";

const prices = offersData.products as Record<string, ProductPrices>;
const shops = shopsData as Shop[];

export const PRICES_UPDATED_AT = offersData.updated_at;

export function getShops(): Shop[] {
  return shops;
}

export function getShop(id: string): Shop | undefined {
  return shops.find((s) => s.id === id);
}

export function getPrices(slug: string): ProductPrices | undefined {
  return prices[slug];
}

/** Oferty od najtańszej; niedostępne na końcu. */
export function sortedOffers(slug: string): Offer[] {
  const p = prices[slug];
  if (!p) return [];
  return p.offers
    .slice()
    .sort(
      (a, b) =>
        Number(a.availability === "out_of_stock") - Number(b.availability === "out_of_stock") ||
        a.price - b.price,
    );
}

export function bestOffer(slug: string): Offer | undefined {
  return sortedOffers(slug).find((o) => o.availability !== "out_of_stock");
}

export function shopCount(slug: string): number {
  return prices[slug]?.offers.filter((o) => o.availability !== "out_of_stock").length ?? 0;
}

function average(points: PricePoint[]) {
  return points.reduce((sum, p) => sum + p.min, 0) / points.length;
}

/** Zmiana najniższej ceny względem średniej z ostatnich 30 dni (ujemna = taniej). */
export function priceChange30d(slug: string): number | undefined {
  const h = prices[slug]?.history;
  if (!h || h.length < 31) return undefined;
  const avg = average(h.slice(-31, -1));
  return (h.at(-1)!.min - avg) / avg;
}

export function lowestEver(slug: string): PricePoint | undefined {
  const h = prices[slug]?.history;
  if (!h?.length) return undefined;
  return h.reduce((low, p) => (p.min < low.min ? p : low));
}

export interface ProductSummary {
  ski: Ski;
  name: string;
  min?: number;
  shops: number;
  change30d?: number;
}

export function summarize(ski: Ski): ProductSummary {
  return {
    ski,
    name: skiName(ski),
    min: bestOffer(ski.slug)?.price,
    shops: shopCount(ski.slug),
    change30d: priceChange30d(ski.slug),
  };
}

export function getProductSummaries(): ProductSummary[] {
  return getSkis().map(summarize);
}

/** Obniżka najtańszej oferty względem ceny regularnej podanej przez sklep (ujemna = taniej). */
export function shopDiscount(slug: string): number | undefined {
  const best = bestOffer(slug);
  if (!best || best.list_price <= best.price) return undefined;
  return (best.price - best.list_price) / best.list_price;
}

/** Największe spadki: względem średniej z 30 dni, a dopóki nie ma historii, względem ceny regularnej w sklepie. */
export function biggestDrops(limit = 4): ProductSummary[] {
  const drop = (p: ProductSummary) => p.change30d ?? shopDiscount(p.ski.slug) ?? 0;
  return getProductSummaries()
    .filter((p) => drop(p) < -0.02)
    .sort((a, b) => drop(a) - drop(b))
    .slice(0, limit);
}

export const formatPrice = (n: number) =>
  `${n.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export const formatPercent = (x: number) =>
  `${x > 0 ? "+" : "−"}${Math.abs(Math.round(x * 100))}%`;
