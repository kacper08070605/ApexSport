import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/SearchResults";
import { getProductSummaries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Wyszukiwarka",
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Szukam…</p>}>
        <SearchResults products={getProductSummaries()} />
      </Suspense>
    </div>
  );
}
