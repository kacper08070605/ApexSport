"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatPrice, type ProductSummary } from "@/lib/catalog";
import { CATEGORY_LABEL, LEVEL_LABEL } from "@/lib/labels";
import { formatDims, formatRange, lengthRange, radiusRange, referenceGeometry } from "@/lib/skis";
import type { Ski } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { SkiSilhouette } from "./SkiSilhouette";

const COLORS = ["var(--primary)", "#2563eb", "var(--deal)"];
const MAX = 3;

export function CompareView({ products }: { products: ProductSummary[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const slugs = (params.get("narty") ?? "").split(",").filter(Boolean).slice(0, MAX);
  const selected = slugs
    .map((s) => products.find((p) => p.ski.slug === s))
    .filter((p): p is ProductSummary => p !== undefined);

  const setSlugs = (next: string[]) =>
    router.replace(next.length ? `${pathname}?narty=${next.join(",")}` : pathname, { scroll: false });

  const shapes = selected.flatMap(({ ski, name }, i) => {
    const geo = referenceGeometry(ski);
    return geo ? [{ ...geo, length_cm: geo.length_cm ?? 170, label: `${name} ${ski.season}`, color: COLORS[i] }] : [];
  });

  const cheapest = Math.min(...selected.map((p) => p.min ?? Infinity));

  const rows: { label: string; value: (p: ProductSummary) => React.ReactNode }[] = [
    {
      label: "Najniższa cena",
      value: (p) =>
        p.min !== undefined ? (
          <span className={`text-base font-semibold ${p.min === cheapest && selected.length > 1 ? "text-deal" : ""}`}>
            {formatPrice(p.min)}
          </span>
        ) : (
          "brak ofert"
        ),
    },
    { label: "Rocznik", value: (p) => p.ski.season },
    { label: "Przeznaczenie", value: (p) => CATEGORY_LABEL[p.ski.category] },
    { label: "Poziom", value: (p) => p.ski.levels.map((l) => LEVEL_LABEL[l]).join(", ") },
    {
      label: "Taliowanie",
      value: (p) => {
        const g = referenceGeometry(p.ski);
        return g ? `${formatDims(g)} mm${g.length_cm ? ` (${g.length_cm} cm)` : ""}` : "brak danych";
      },
    },
    {
      label: "Promień",
      value: (p) => {
        const r = radiusRange(p.ski);
        return r ? formatRange(r, "m") : "brak danych";
      },
    },
    { label: "Długości", value: (p) => formatRange(lengthRange(p.ski), "cm") },
    { label: "Profil", value: (p) => p.ski.rocker ?? "brak danych" },
    { label: "Konstrukcja", value: (p) => p.ski.construction ?? "brak danych" },
    {
      label: "Wiązanie",
      value: (p) => (p.ski.system_binding === true ? "w zestawie" : p.ski.system_binding === false ? "bez wiązania" : "brak danych"),
    },
  ];

  const available = products.filter((p) => !slugs.includes(p.ski.slug));

  return (
    <div>
      {selected.length < MAX && (
        <label className="flex max-w-md flex-col gap-1 text-sm text-muted-foreground">
          Dodaj produkt do porównania
          <select
            className="panel px-2 py-2 text-foreground"
            value=""
            onChange={(e) => e.target.value && setSlugs([...slugs, e.target.value])}
          >
            <option value="">Wybierz model…</option>
            {available.map((p) => (
              <option key={p.ski.slug} value={p.ski.slug}>
                {p.name} ({p.ski.season})
              </option>
            ))}
          </select>
        </label>
      )}

      {selected.length === 0 ? (
        <p className="mt-8 border border-dashed border-border p-8 text-center text-muted-foreground">
          Wybierz do {MAX} produktów z listy albo zaznacz „Porównaj” w{" "}
          <Link href="/narciarstwo/narty-zjazdowe" className="text-primary underline">
            katalogu
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto panel">
            <table className="w-full min-w-[640px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border align-top">
                  <th className="w-40 p-4" />
                  {selected.map((p, i) => (
                    <th key={p.ski.slug} className="p-4 text-left font-normal">
                      <span className="mb-2 block h-1 w-12" style={{ background: COLORS[i] }} />
                      <ProductImage ski={p.ski as Ski} sizes="200px" className="aspect-square" />
                      <Link href={`/produkt/${p.ski.slug}`} className="mt-2 block text-base font-semibold leading-tight hover:text-primary">
                        {p.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSlugs(slugs.filter((x) => x !== p.ski.slug))}
                        className="mt-1 text-xs text-muted-foreground underline hover:text-primary"
                      >
                        Usuń
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <th className="p-4 text-left text-xs font-semibold text-muted-foreground">{row.label}</th>
                    {selected.map((p) => (
                      <td key={p.ski.slug} className="p-4 align-top">
                        {row.value(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {shapes.length > 0 && (
            <section className="mt-6 panel p-5">
              <h2 className="mb-3 text-lg font-semibold">Kształt w tej samej skali</h2>
              <SkiSilhouette shapes={shapes} showDimensions={false} caption />
              <ul className="mt-3 flex flex-wrap gap-4 text-sm">
                {shapes.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="h-3 w-3" style={{ background: s.color }} />
                    {s.label}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
