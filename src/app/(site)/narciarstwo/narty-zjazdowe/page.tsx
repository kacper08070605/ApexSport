import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SkiCatalog } from "@/components/SkiCatalog";
import { getProductSummaries, getShops } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Narty zjazdowe: ceny i specyfikacje",
  description:
    "Narty zjazdowe z cenami z polskich sklepów, historią cen i pełną specyfikacją producenta. Filtruj po przeznaczeniu, szerokości, poziomie i roczniku.",
};

export default function SkiCatalogPage() {
  const products = getProductSummaries();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Narty zjazdowe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {products.length} pozycji · ceny z {getShops().length} sklepów, aktualizowane codziennie · każdy rocznik osobno
          </p>
        </div>
        <Link href="/dobor-nart" className="group panel lift flex items-center gap-4 px-5 py-3">
          <span>
            <span className="block text-xs font-semibold text-primary">Nie wiesz, co wybrać?</span>
            <span className="font-medium">Dobór nart w 5 krokach</span>
          </span>
          <span className="text-xl text-primary transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div className="h-[600px] animate-pulse panel" />}>
          <SkiCatalog products={products} />
        </Suspense>
      </div>
    </div>
  );
}
