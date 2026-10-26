import type { Metadata } from "next";
import { Suspense } from "react";
import { SelectorApp } from "@/components/selector/SelectorApp";
import type { PriceInfo } from "@/components/selector/SelectorResults";
import { bestOffer, getShop, shopCount } from "@/lib/catalog";
import { getSkis } from "@/lib/skis";

export const metadata: Metadata = {
  title: "Dobór nart: długość, szerokość i konkretne modele",
  description:
    "Dobór nart zjazdowych w 5 krokach: wzrost, waga, poziom, styl jazdy i budżet. Wynik to długość, zalecana szerokość i promień oraz modele z najniższą ceną w sklepach.",
};

export default function SkiSelectorPage() {
  const skis = getSkis();
  const prices: Record<string, PriceInfo> = {};
  for (const s of skis) {
    const best = bestOffer(s.slug);
    if (best) prices[s.slug] = { price: best.price, shop: getShop(best.shop)?.name ?? best.shop, offerId: best.id, shops: shopCount(s.slug) };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-xs font-semibold text-primary">Narty zjazdowe</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Dobór nart</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">
        Pięć krótkich kroków. Liczymy długość, szerokość pod butem i promień skrętu, a potem porównujemy z parametrami
        {" "}{skis.length} nart w katalogu i pokazujemy, gdzie kupisz je najtaniej.
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-[600px] animate-pulse panel" />}>
          <SelectorApp skis={skis} prices={prices} />
        </Suspense>
      </div>
    </div>
  );
}
