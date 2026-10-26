import { bestOffer } from "../catalog";
import { familyOf, getSkis } from "../skis";

/** Linie modeli z katalogu z najniższą ceną nowych nart (dowolny rocznik). */
export function familyOptions(): { family: string; brand: string; newPrice?: number }[] {
  const map = new Map<string, { family: string; brand: string; newPrice?: number }>();
  for (const s of getSkis()) {
    const f = familyOf(s);
    const price = bestOffer(s.slug)?.price;
    const cur = map.get(f);
    if (!cur) map.set(f, { family: f, brand: s.brand, newPrice: price });
    else if (price && (!cur.newPrice || price < cur.newPrice)) cur.newPrice = price;
  }
  return [...map.values()].sort((a, b) => a.family.localeCompare(b.family));
}
