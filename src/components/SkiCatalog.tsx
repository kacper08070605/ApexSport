"use client";

import { ArrowRight, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ProductSummary } from "@/lib/catalog";
import { CATEGORIES, CATEGORY_LABEL, LEVELS, LEVEL_LABEL, plural } from "@/lib/labels";
import { radiusRange, waistWidth } from "@/lib/skis";
import type { Level, SkiCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

const WAIST = [
  { id: "narrow", label: "do 70 mm", test: (w: number) => w <= 70 },
  { id: "piste", label: "71–80 mm", test: (w: number) => w > 70 && w <= 80 },
  { id: "allm", label: "81–89 mm", test: (w: number) => w > 80 && w < 90 },
  { id: "wide", label: "90 mm i więcej", test: (w: number) => w >= 90 },
];

const SORTS = {
  price: { label: "Najtańsze", fn: (a: ProductSummary, b: ProductSummary) => (a.min ?? 1e9) - (b.min ?? 1e9) },
  drop: { label: "Największy spadek ceny", fn: (a: ProductSummary, b: ProductSummary) => (a.change30d ?? 0) - (b.change30d ?? 0) },
  newest: { label: "Najnowszy rocznik", fn: (a: ProductSummary, b: ProductSummary) => b.ski.season.localeCompare(a.ski.season) },
  radius: {
    label: "Najkrótszy promień",
    fn: (a: ProductSummary, b: ProductSummary) => (radiusRange(a.ski)?.[0] ?? 99) - (radiusRange(b.ski)?.[0] ?? 99),
  },
};

const MAX_COMPARE = 3;

/** Grupa filtrów jednokrotnego wyboru: kliknięcie zaznaczonej opcji ją odznacza. */
function FilterGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string; count?: number }[];
  value: T | "";
  onChange: (v: T | "") => void;
}) {
  return (
    <div className="border-b py-4 last:border-0">
      <p className="mb-2.5 text-sm font-medium">{title}</p>
      <div className="flex flex-col gap-0.5">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(active ? "" : o.value)}
              disabled={!active && o.count === 0}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-40",
                active && "bg-secondary font-medium text-secondary-foreground",
              )}
            >
              <span className={cn("size-4 shrink-0 rounded-full border", active ? "border-[5px] border-primary" : "border-input")} />
              <span className="flex-1">{o.label}</span>
              {o.count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{o.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SkiCatalog({ products }: { products: ProductSummary[] }) {
  // filtry startowe z adresu, np. ?przeznaczenie=slalom&poziom=beginner&plec=damskie
  const params = useSearchParams();
  const initCat = params.get("przeznaczenie");
  const initLevel = params.get("poziom");
  const [brand, setBrand] = useState(params.get("marka") ?? "");
  const [category, setCategory] = useState<SkiCategory | "">(CATEGORIES.includes(initCat as SkiCategory) ? (initCat as SkiCategory) : "");
  const [level, setLevel] = useState<Level | "">(LEVELS.includes(initLevel as Level) ? (initLevel as Level) : "");
  const [womenOnly, setWomenOnly] = useState(params.get("plec") === "damskie");
  const [waist, setWaist] = useState(params.get("talia") ?? "");
  const [season, setSeason] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("price");
  const [compare, setCompare] = useState<string[]>([]);

  const brands = useMemo(() => [...new Set(products.map((p) => p.ski.brand))].sort(), [products]);
  const seasons = useMemo(() => [...new Set(products.map((p) => p.ski.season))].sort().reverse(), [products]);

  const filtered = useMemo(() => {
    const bucket = WAIST.find((b) => b.id === waist);
    return products
      .filter((p) => {
        const s = p.ski;
        if (brand && s.brand !== brand) return false;
        if (category && s.category !== category) return false;
        if (level && !s.levels.includes(level)) return false;
        if (season && s.season !== season) return false;
        if (womenOnly && s.gender !== "women") return false;
        if (bucket) {
          const w = waistWidth(s);
          if (w === undefined || !bucket.test(w)) return false;
        }
        return true;
      })
      .sort(SORTS[sort].fn);
  }, [products, brand, category, level, waist, season, sort, womenOnly]);

  const count = (pred: (p: ProductSummary) => boolean) => products.filter(pred).length;
  const toggle = (slug: string) =>
    setCompare((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : c.length < MAX_COMPARE ? [...c, slug] : c));

  const active: { label: string; clear: () => void }[] = [
    category && { label: CATEGORY_LABEL[category], clear: () => setCategory("") },
    waist && { label: WAIST.find((w) => w.id === waist)?.label ?? waist, clear: () => setWaist("") },
    level && { label: LEVEL_LABEL[level], clear: () => setLevel("") },
    brand && { label: brand, clear: () => setBrand("") },
    season && { label: season, clear: () => setSeason("") },
    womenOnly && { label: "Damskie", clear: () => setWomenOnly(false) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => active.forEach((a) => a.clear());

  const filters = (
    <div>
      <FilterGroup
        title="Przeznaczenie"
        value={category}
        onChange={setCategory}
        options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c], count: count((p) => p.ski.category === c) })).filter((o) => o.count)}
      />
      <FilterGroup
        title="Szerokość pod butem"
        value={waist}
        onChange={setWaist}
        options={WAIST.map((w) => ({
          value: w.id,
          label: w.label,
          count: count((p) => {
            const x = waistWidth(p.ski);
            return x !== undefined && w.test(x);
          }),
        }))}
      />
      <FilterGroup
        title="Poziom"
        value={level}
        onChange={setLevel}
        options={LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l], count: count((p) => p.ski.levels.includes(l)) }))}
      />
      <div className="border-b py-4">
        <label className="flex cursor-pointer items-center gap-2.5 px-2 text-sm">
          <Checkbox checked={womenOnly} onCheckedChange={(v) => setWomenOnly(v === true)} />
          <span className="flex-1">Tylko modele damskie</span>
          <span className="text-xs text-muted-foreground">{count((p) => p.ski.gender === "women")}</span>
        </label>
      </div>
      <FilterGroup title="Marka" value={brand} onChange={setBrand} options={brands.map((b) => ({ value: b, label: b, count: count((p) => p.ski.brand === b) }))} />
      <FilterGroup title="Rocznik" value={season} onChange={setSeason} options={seasons.map((s) => ({ value: s, label: s, count: count((p) => p.ski.season === s) }))} />
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">{filters}</div>
      </aside>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-9 rounded-md bg-card lg:hidden">
                  <SlidersHorizontal /> Filtry {active.length > 0 && <Badge className="ml-1 size-5 rounded-full p-0">{active.length}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtry</SheetTitle>
                </SheetHeader>
                <div className="px-4">{filters}</div>
              </SheetContent>
            </Sheet>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {plural(filtered.length, "produkt", "produkty", "produktów")}
            </p>
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as keyof typeof SORTS)}>
            <SelectTrigger className="h-9 w-56 rounded-md bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORTS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {active.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {active.map((a) => (
              <Badge key={a.label} variant="secondary" className="h-7 gap-1 rounded-md pr-1.5 pl-3 text-sm">
                {a.label}
                <button type="button" onClick={a.clear} aria-label={`Usuń filtr ${a.label}`} className="rounded-full p-0.5 hover:bg-foreground/10">
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
            <Button variant="link" size="sm" onClick={clearAll}>
              Wyczyść wszystko
            </Button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const selected = compare.includes(p.ski.slug);
            const disabled = !selected && compare.length >= MAX_COMPARE;
            return (
              <ProductCard
                key={p.ski.slug}
                product={p}
                action={
                  <label className={cn("flex cursor-pointer items-center gap-2 text-sm text-muted-foreground", disabled && "opacity-40")}>
                    <Checkbox checked={selected} disabled={disabled} onCheckedChange={() => toggle(p.ski.slug)} />
                    Porównaj
                  </label>
                }
              />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="panel mt-6 p-8 text-center">
            <p className="font-medium">Brak modeli dla tych filtrów</p>
            <Button variant="outline" className="mt-3" onClick={clearAll}>
              Wyczyść filtry
            </Button>
          </div>
        )}

        {compare.length > 0 && (
          <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-3 rounded-2xl border bg-card/95 p-3 pl-5">
            <span className="text-sm">
              Do porównania: <span className="font-medium">{compare.length}</span> z {MAX_COMPARE}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setCompare([])}>
                Wyczyść
              </Button>
              <Button asChild>
                <Link href={`/porownaj?narty=${compare.join(",")}`}>
                  Porównaj <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
