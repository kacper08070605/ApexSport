"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { formatPrice, type ProductSummary } from "@/lib/catalog";
import { plural } from "@/lib/labels";
import { groupByFamily, searchSkis } from "@/lib/search";
import { ProductCard } from "./ProductCard";

const EXAMPLES = ["atomic s9", "hero 24/25", "slalom", "enforcer", "völkl", "fischer curv"];

export function SearchResults({ products }: { products: ProductSummary[] }) {
  const query = useSearchParams().get("q") ?? "";

  const groups = useMemo(() => {
    const byslug = new Map(products.map((p) => [p.ski.slug, p]));
    const hits = searchSkis(products.map((p) => p.ski), query);
    return groupByFamily(hits).map((g) => ({
      family: g.family,
      products: g.skis.map((s) => byslug.get(s.slug)!),
    }));
  }, [products, query]);

  const total = groups.reduce((n, g) => n + g.products.length, 0);

  return (
    <div>
      <h1 className="text-3xl font-semibold">
        {query ? <>Wyniki dla „{query}”</> : "Wyszukiwarka"}
      </h1>
      {query && (
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {plural(total, "produkt", "produkty", "produktów")} w {groups.length}{" "}
          {plural(groups.length, "linii modelu", "liniach modeli", "liniach modeli")}
        </p>
      )}

      {total === 0 && (
        <div className="mt-6 panel p-6">
          <p>{query ? "Nic nie znaleźliśmy." : "Wpisz markę, model albo rocznik."} Spróbuj na przykład:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <Link key={e} href={`/szukaj?q=${encodeURIComponent(e)}`} className="rounded-md border bg-card px-3 py-1 text-sm hover:border-foreground/30">
                {e}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-10">
        {groups.map((g) => {
          const prices = g.products.map((p) => p.min).filter((m): m is number => m !== undefined);
          return (
            <section key={g.family}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1">
                <h2 className="text-2xl font-semibold">{g.family}</h2>
                <p className="text-sm text-muted-foreground">
                  {g.products.length} {plural(g.products.length, "rocznik", "roczniki", "roczników")}
                  {prices.length > 0 && <> · od {formatPrice(Math.min(...prices))}</>}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {g.products.map((p) => (
                  <ProductCard key={p.ski.slug} product={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
