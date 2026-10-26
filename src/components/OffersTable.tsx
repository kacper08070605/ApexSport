import { ExternalLink, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDay, formatPrice, getShop, sortedOffers } from "@/lib/catalog";
import type { Availability } from "@/lib/types";
import { cn } from "@/lib/utils";

const AVAILABILITY: Record<Availability, { label: string; dot: string }> = {
  in_stock: { label: "Dostępny", dot: "bg-deal" },
  low_stock: { label: "Ostatnie sztuki", dot: "bg-warn" },
  out_of_stock: { label: "Niedostępny", dot: "bg-muted-foreground" },
};

export function OffersTable({ slug }: { slug: string }) {
  const offers = sortedOffers(slug);
  const best = offers.find((o) => o.availability !== "out_of_stock");
  if (!offers.length) return null;

  return (
    <section className="panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-4">
        <h2 className="text-lg font-semibold">Oferty sklepów</h2>
        <span className="text-xs text-muted-foreground">Cena za parę, z wiązaniem jeśli jest w zestawie</span>
      </div>
      <ul className="divide-y">
        {offers.map((o) => {
          const shop = getShop(o.shop);
          const av = AVAILABILITY[o.availability];
          const isBest = o.id === best?.id;
          const off = o.availability === "out_of_stock";
          return (
            <li
              key={o.id}
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[170px_1fr_auto_140px]",
                isBest && "bg-deal-soft/60",
                off && "opacity-55",
              )}
            >
              <div>
                <p className="font-medium">{shop?.name}</p>
                {isBest && (
                  <Badge variant="secondary" className="mt-1 bg-deal/10 text-deal">
                    Najniższa cena
                  </Badge>
                )}
              </div>
              <div className="order-3 col-span-2 text-xs text-muted-foreground sm:order-none sm:col-span-1">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <span className={cn("size-1.5 rounded-full", av.dot)} />
                  {av.label}
                </span>
                {o.lengths.length > 0 && <span> · długości: {o.lengths.join(", ")} cm</span>}
                {shop?.delivery && (
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <Truck className="size-3.5" />
                    {shop.delivery}
                  </span>
                )}
                {o.checked_at && <span className="mt-0.5 block">Cena sprawdzona {formatDay(o.checked_at)}</span>}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{formatPrice(o.price)}</p>
                {o.list_price > o.price && <p className="text-xs text-muted-foreground line-through">{formatPrice(o.list_price)}</p>}
              </div>
              <div className="order-4 col-span-2 sm:order-none sm:col-span-1">
                {off ? (
                  <Button variant="outline" disabled className="h-10 w-full">
                    Brak w sklepie
                  </Button>
                ) : (
                  <Button asChild variant={isBest ? "default" : "outline"} className="h-10 w-full">
                    <a href={`/go/${o.id}`} target="_blank" rel="nofollow sponsored noopener">
                      Do sklepu
                      <ExternalLink />
                    </a>
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
