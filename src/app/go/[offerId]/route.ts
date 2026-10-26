import { getDb } from "@/lib/db";
import { livePrices } from "@/lib/live-prices";

/**
 * Przekierowanie do sklepu. Każde przejście zapisujemy, bo to podstawa rozliczeń z sieciami
 * afiliacyjnymi. Docelowo `offer.url` to link śledzący z feedu (Awin, Webgains, TradeTracker…).
 */
export async function GET(_request: Request, ctx: RouteContext<"/go/[offerId]">) {
  const { offerId } = await ctx.params;
  const slug = offerId.split("__")[0];
  const offer = livePrices(slug)?.offers.find((o) => o.id === offerId);
  if (!offer) return new Response("Nie ma takiej oferty", { status: 404 });

  getDb()
    .prepare("INSERT INTO clicks (offer_id, product_slug, shop, price, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(offer.id, slug, offer.shop, offer.price, new Date().toISOString());

  return new Response(null, {
    status: 302,
    headers: { Location: offer.url, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
