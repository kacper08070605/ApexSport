import { randomUUID } from "node:crypto";
import { recognize, type Listing } from "./match";

/**
 * Adapter oficjalnego REST API Allegro (https://developer.allegro.pl).
 * Wymaga zarejestrowanej aplikacji (ALLEGRO_CLIENT_ID, ALLEGRO_CLIENT_SECRET) z dostępem
 * do wyszukiwania ofert (GET /offers/listing). Bez kluczy adapter jest wyłączony.
 *
 * Uwaga: nie testowany na prawdziwym koncie; Allegro ogranicza dostęp do wyszukiwania
 * ofert do zweryfikowanych aplikacji. Szczegóły w dokumentacji API.
 */

const API = "https://api.allegro.pl";
const AUTH = "https://allegro.pl/auth/oauth/token";
// kategoria „Narty zjazdowe” w drzewie Allegro; do potwierdzenia przez GET /sale/categories
const SKI_CATEGORY = process.env.ALLEGRO_SKI_CATEGORY_ID;

export const allegroEnabled = () => Boolean(process.env.ALLEGRO_CLIENT_ID && process.env.ALLEGRO_CLIENT_SECRET);

async function token(): Promise<string> {
  const basic = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${AUTH}?grant_type=client_credentials`, { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  if (!res.ok) throw new Error(`Allegro auth ${res.status}`);
  return (await res.json()).access_token;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchAllegroListings(phrases: string[]): Promise<Listing[]> {
  if (!allegroEnabled()) return [];
  const t = await token();
  const out: Listing[] = [];
  for (const phrase of phrases.slice(0, 20)) {
    const params = new URLSearchParams({ phrase, limit: "40", sort: "-startTime" });
    if (SKI_CATEGORY) params.set("category.id", SKI_CATEGORY);
    const res = await fetch(`${API}/offers/listing?${params}`, {
      headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.allegro.public.v1+json" },
    });
    if (!res.ok) continue;
    const j: any = await res.json();
    for (const o of [...(j.items?.promoted ?? []), ...(j.items?.regular ?? [])]) {
      const rec = recognize(o.name);
      out.push({
        id: randomUUID(),
        source: "allegro",
        external_id: String(o.id),
        title: o.name,
        price: Math.round(Number(o.sellingMode?.price?.amount ?? 0)),
        url: `https://allegro.pl/oferta/${o.id}`,
        image: o.images?.[0]?.url ?? null,
        location: o.location?.city ?? null,
        condition: null,
        category: "skis",
        length_cm: rec.length,
        size: null,
        family: rec.family,
        ski_slug: rec.skiSlug,
        posted_at: new Date().toISOString(),
        seen_at: new Date().toISOString(),
      });
    }
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
