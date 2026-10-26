import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";
import { getProductSummaries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Porównaj narty",
  description: "Do trzech modeli nart obok siebie: cena, taliowanie, promień, długości i kształt w tej samej skali.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Porównaj</h1>
      <div className="mt-4">
        <Suspense fallback={<p className="text-muted-foreground">Wczytywanie…</p>}>
          <CompareView products={getProductSummaries()} />
        </Suspense>
      </div>
    </div>
  );
}
