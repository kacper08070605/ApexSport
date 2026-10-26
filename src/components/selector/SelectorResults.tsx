"use client";

import { Check, ExternalLink, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Recommendation, SelectorInput, SelectorResult } from "@/lib/selector";
import { TRAIT_LABEL } from "@/lib/ski-traits";
import { CATEGORY_LABEL } from "@/lib/labels";

export interface PriceInfo {
  price: number;
  shop: string;
  offerId: string;
  shops: number;
}

const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;

function MatchRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0" title={`Dopasowanie ${value}%`}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={value >= 80 ? "var(--deal)" : value >= 60 ? "var(--primary)" : "var(--muted-foreground)"}
          strokeWidth="6"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xl font-semibold">{value}%</span>
      </span>
    </div>
  );
}

function TraitBars({ rec, needs }: { rec: Recommendation; needs: Record<string, number> }) {
  return (
    <ul className="space-y-1.5">
      {(Object.keys(TRAIT_LABEL) as (keyof typeof TRAIT_LABEL)[]).map((k) => {
        const have = rec.traits[k];
        const need = needs[k];
        const short = need - have >= 2;
        return (
          <li key={k} className="grid grid-cols-[130px_1fr] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{TRAIT_LABEL[k]}</span>
            <span className="relative h-2 rounded-full bg-muted">
              <span className={`absolute inset-y-0 left-0 rounded-full ${short ? "bg-warn" : "bg-primary/70"}`} style={{ width: `${have * 10}%` }} />
              <span className="absolute -top-1 -bottom-1 w-0.5 rounded bg-foreground" style={{ left: `calc(${need * 10}% - 1px)` }} title="Twoje wymaganie" />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function RecCard({ rec, rank, needs, price }: { rec: Recommendation; rank: number; needs: Record<string, number>; price?: PriceInfo }) {
  const { ski } = rec;
  return (
    <article className="panel grid gap-0 md:grid-cols-[180px_minmax(0,1fr)_250px]">
      <Link href={`/produkt/${ski.slug}`} className="product-stage relative block aspect-[4/3] bg-muted md:aspect-auto md:min-h-56">
        <Badge variant="outline" className="absolute top-3 left-3 z-10 bg-card">
          #{rank}
        </Badge>
        {ski.image && (
          <Image
            src={ski.image}
            alt={`${ski.brand} ${ski.model}`}
            fill
            sizes="180px"
            className={`object-contain p-3 ${ski.image_orientation === "horizontal" ? "rotate-90 scale-125" : ""}`}
          />
        )}
      </Link>
      <div className="min-w-0 p-5">
        <div className="flex items-start gap-4">
          <MatchRing value={rec.match} />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {ski.brand} · {ski.season} · {CATEGORY_LABEL[ski.category]}
            </p>
            <h3 className="mt-0.5 text-xl font-semibold leading-snug">
              <Link href={`/produkt/${ski.slug}`} className="hover:text-primary">
                {ski.model}
              </Link>
            </h3>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            {rec.pros.length > 0 && (
              <ul className="space-y-1 text-sm">
                {rec.pros.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-deal" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
            {rec.cons.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {rec.cons.map((c) => (
                  <li key={c} className="flex gap-2">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <TraitBars rec={rec} needs={needs} />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Pasek: narta. Kreska: Twoje wymaganie.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col border-t bg-muted/30 p-5 md:border-t-0 md:border-l">
        <p className="text-xs text-muted-foreground">Twoja długość</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{rec.length} cm</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {rec.altLength ? `alternatywnie ${rec.altLength} cm · ` : ""}
          {rec.lengthNote}
        </p>
        {price ? (
          <div className="mt-auto pt-4">
            <p className="text-xs text-muted-foreground">Najniższa cena · {price.shop}</p>
            <p className="text-2xl font-semibold tabular-nums">{zl(price.price)}</p>
            <div className="mt-3 grid gap-2">
              <Button asChild className="h-10 rounded-md">
                <a href={`/go/${price.offerId}`} target="_blank" rel="nofollow sponsored noopener">
                  Idź do sklepu <ExternalLink />
                </a>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-md bg-card">
                <Link href={`/produkt/${ski.slug}`}>Oferty w {price.shops} sklepach</Link>
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-auto pt-4 text-sm text-muted-foreground">Brak ofert w sklepach</p>
        )}
      </div>
    </article>
  );
}

export function SelectorResults({
  result,
  input,
  prices,
}: {
  result: SelectorResult;
  input: SelectorInput;
  prices: Record<string, PriceInfo>;
}) {
  const { recommendations, overBudget, profile } = result;
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <h2 className="text-3xl font-semibold">Narty dla Ciebie</h2>
        <p className="text-sm text-muted-foreground">
          {recommendations.length} modeli w budżecie do {zl(input.budget)} · posortowane według dopasowania
        </p>
      </div>

      {recommendations.length === 0 ? (
        <p className="mt-6 panel p-6">
          W tym budżecie nie mamy pasującego modelu. Podnieś budżet albo zaznacz zeszłoroczne modele w kroku „Zakup”.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {recommendations.map((r, i) => (
            <RecCard key={r.ski.slug} rec={r} rank={i + 1} needs={profile.needs} price={prices[r.ski.slug]} />
          ))}
        </div>
      )}

      {overBudget.length > 0 && (
        <div className="mt-10">
          <h3 className="border-b border-border pb-2 text-lg font-semibold text-muted-foreground">
            Pasują, ale są powyżej budżetu
          </h3>
          <div className="mt-4 space-y-4 opacity-90">
            {overBudget.map((r, i) => (
              <RecCard key={r.ski.slug} rec={r} rank={recommendations.length + i + 1} needs={profile.needs} price={prices[r.ski.slug]} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 max-w-3xl text-xs text-muted-foreground">
        Dopasowanie liczymy z parametrów producenta: szerokości talii, promienia, warstw tytanalu, profilu (camber, rocker) i
        poziomu, dla którego producent przeznacza nartę. To podpowiedź oparta na danych, a nie test na śniegu. Przed zakupem
        sprawdź długość w sklepie albo wypożycz model na próbę.
      </p>
    </section>
  );
}
