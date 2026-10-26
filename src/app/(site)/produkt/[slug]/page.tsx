import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Scale, Sparkles } from "lucide-react";
import { AlertForm } from "@/components/AlertForm";
import { Button } from "@/components/ui/button";
import { OffersTable } from "@/components/OffersTable";
import { PriceChart } from "@/components/PriceChart";
import { ProductImage } from "@/components/ProductImage";
import { SkiSilhouette } from "@/components/SkiSilhouette";
import { articlesForProduct } from "@/content/articles";
import {
  bestOffer,
  formatPercent,
  formatDay,
  formatPrice,
  getPrices,
  getShop,
  lowestEver,
  priceChange30d,
} from "@/lib/catalog";
import { CATEGORY_LABEL, formatNumber, LEVEL_LABEL } from "@/lib/labels";
import { formatDims, getSki, getSkis, referenceGeometry, seasonsOf, skiName, specLine } from "@/lib/skis";

export function generateStaticParams() {
  return getSkis().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produkt/[slug]">): Promise<Metadata> {
  const ski = getSki((await params).slug);
  if (!ski) return {};
  const best = bestOffer(ski.slug);
  return {
    title: `${skiName(ski)} ${ski.season}${best ? ` od ${formatPrice(best.price)}` : ""}`,
    description: `${skiName(ski)} (${ski.season}): ceny w sklepach, historia cen i pełna specyfikacja. ${specLine(ski)}.`,
  };
}

export default async function ProductPage({ params }: PageProps<"/produkt/[slug]">) {
  const ski = getSki((await params).slug);
  if (!ski) notFound();

  const prices = getPrices(ski.slug);
  const best = bestOffer(ski.slug);
  const bestShop = best ? getShop(best.shop) : undefined;
  const change = priceChange30d(ski.slug);
  const low = lowestEver(ski.slug);
  const seasons = seasonsOf(ski);
  const geo = referenceGeometry(ski);
  const articles = articlesForProduct(ski.slug);
  const hasWidths = ski.lengths.some((l) => l.tip_mm || l.waist_mm || l.tail_mm);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/narciarstwo/narty-zjazdowe" className="hover:text-foreground">
          Narty zjazdowe
        </Link>
        {" / "}
        <Link href={`/szukaj?q=${encodeURIComponent(ski.brand)}`} className="hover:text-foreground">
          {ski.brand}
        </Link>
        {" / "}
        {ski.family ?? ski.model}
      </nav>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <figure>
          <ProductImage ski={ski} sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/5] rounded-2xl border lg:sticky lg:top-24 lg:aspect-auto lg:min-h-[560px]" priority />
          {ski.image_note && <figcaption className="mt-1 text-xs text-muted-foreground">{ski.image_note}</figcaption>}
        </figure>

        <div>
          <p className="text-sm text-muted-foreground">{ski.brand}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{ski.model}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {CATEGORY_LABEL[ski.category]} · {ski.levels.map((l) => LEVEL_LABEL[l]).join(", ")}
            {ski.gender === "women" && " · model damski"} · {specLine(ski)}
          </p>

          {seasons.length > 1 && (
            <div className="mt-4">
              <p className="text-sm font-medium">Rocznik</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {seasons.map((s) => {
                  const p = bestOffer(s.slug)?.price;
                  const current = s.slug === ski.slug;
                  return (
                    <Link
                      key={s.slug}
                      href={`/produkt/${s.slug}`}
                      aria-current={current ? "page" : undefined}
                      className={`rounded-xl border px-3.5 py-2 text-sm transition-colors ${
                        current ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:border-foreground/30"
                      }`}
                    >
                      <span className="block font-medium">{s.season}</span>
                      {p && <span className="text-xs text-muted-foreground">od {formatPrice(p)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {ski.needs_review && (
            <p className="mt-4 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm">
              Specyfikacja tego rocznika nie jest jeszcze potwierdzona na stronie producenta.
            </p>
          )}

          <div className="panel mt-6 p-5">
            {best && bestShop ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Najniższa cena dziś</p>
                    <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatPrice(best.price)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      w sklepie <span className="font-medium text-foreground">{bestShop.name}</span>
                      {best.checked_at && <> · sprawdzone {formatDay(best.checked_at)}</>}
                    </p>
                  </div>
                  <Button asChild size="lg" className="h-12 rounded-md px-7 text-base">
                    <a href={`/go/${best.id}`} target="_blank" rel="nofollow sponsored noopener">
                      Idź do sklepu <ExternalLink />
                    </a>
                  </Button>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Względem śr. 30 dni</dt>
                    <dd className={`font-semibold ${change !== undefined && change <= -0.005 ? "text-deal" : ""}`}>
                      {change === undefined ? "brak danych" : Math.abs(change) < 0.005 ? "bez zmian" : formatPercent(change)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Najniższa w historii</dt>
                    <dd className="font-semibold">
                      {low ? `${formatPrice(low.min)}` : "brak danych"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sklepy z ofertą</dt>
                    <dd className="font-semibold">
                      {prices?.offers.filter((o) => o.availability !== "out_of_stock").length ?? 0}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p>Nie znaleźliśmy tego rocznika w polskich sklepach internetowych. Starsze roczniki szybko znikają z oferty.</p>
            )}
          </div>

          {best && (
            <div className="mt-4">
              <AlertForm slug={ski.slug} currentPrice={best.price} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="bg-card">
              <Link href={`/porownaj?narty=${ski.slug}`}>
                <Scale /> Porównaj z innym modelem
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dobor-nart">
                <Sparkles /> Jaka długość dla mnie?
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <OffersTable slug={ski.slug} />
        {prices && prices.offers.length > 0 && (
          <div className="panel self-start p-5">
            <PriceChart history={prices.history} />
          </div>
        )}
      </div>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          {ski.review_pl?.sections?.length ? (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold">Opis</h2>
              <p className="mt-2 max-w-prose text-lg">{ski.description_pl}</p>
              <div className="mt-4 space-y-4">
                {ski.review_pl.sections.map((sec) => (
                  <div key={sec.title}>
                    <h3 className="text-base font-semibold">{sec.title}</h3>
                    <p className="mt-1 max-w-prose leading-relaxed">{sec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <h2 className="text-2xl font-semibold">Specyfikacja</h2>
          {!ski.review_pl?.sections?.length && <p className="mt-2 max-w-prose">{ski.description_pl}</p>}
          <div className="mt-4 overflow-x-auto panel">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Długość</th>
                  {hasWidths && <th className="px-4 py-2">Dziób / talia / piętka</th>}
                  <th className="px-4 py-2">Promień</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {ski.lengths.map((l) => (
                  <tr key={l.length_cm} className="border-t border-border">
                    <td className="px-4 py-2 font-semibold">{l.length_cm} cm</td>
                    {hasWidths && (
                      <td className="px-4 py-2">
                        {l.tip_mm && l.waist_mm && l.tail_mm
                          ? `${formatDims({ tip_mm: l.tip_mm, waist_mm: l.waist_mm, tail_mm: l.tail_mm }, " / ")} mm`
                          : l.waist_mm
                            ? `talia ${formatNumber(l.waist_mm)} mm`
                            : "brak danych"}
                      </td>
                    )}
                    <td className="px-4 py-2">{l.radius_m ? `${formatNumber(l.radius_m)} m` : "brak danych"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!hasWidths && ski.geometry_mm && (
              <p className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
                Taliowanie według producenta, bez wskazanej długości: {formatDims(ski.geometry_mm, " / ")} mm
              </p>
            )}
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {ski.rocker && (
              <div className="flex justify-between border-b border-border py-1.5">
                <dt className="text-muted-foreground">Profil</dt>
                <dd className="text-right">{ski.rocker}</dd>
              </div>
            )}
            {ski.construction && (
              <div className="flex justify-between gap-4 border-b border-border py-1.5">
                <dt className="text-muted-foreground">Konstrukcja</dt>
                <dd className="text-right">{ski.construction}</dd>
              </div>
            )}
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Wiązanie</dt>
              <dd className="text-right">
                {ski.system_binding === true
                  ? `w zestawie${ski.binding ? `: ${ski.binding}` : ""}${ski.din ? `, DIN ${ski.din}` : ""}`
                  : ski.system_binding === false
                    ? "bez wiązania"
                    : "brak danych"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Rocznik</dt>
              <dd>{ski.season}</dd>
            </div>
          </dl>
        </div>
        <div>
          {geo && (
            <div className="panel p-4">
              <h3 className="text-base font-semibold">Kształt z wymiarów</h3>
              <SkiSilhouette shapes={[{ length_cm: geo.length_cm ?? 170, ...geo }]} />
            </div>
          )}
          {articles.length > 0 && (
            <div className="mt-4 panel p-4">
              <h3 className="text-base font-semibold">Piszemy o tym modelu</h3>
              <ul className="mt-2 space-y-2">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/artykuly/${a.slug}`} className="font-semibold hover:text-primary">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {best && bestShop && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] lg:hidden">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs text-muted-foreground">Najtaniej · {bestShop.name}</p>
            <p className="text-lg font-semibold">{formatPrice(best.price)}</p>
          </div>
          <a
            href={`/go/${best.id}`}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="bg-primary px-5 py-3 text-sm font-bold text-white"
          >
            Idź do sklepu
          </a>
        </div>
      )}

      <div className="mt-8 pb-20 text-xs text-muted-foreground lg:pb-0">
        <p>
          Źródło specyfikacji:{" "}
          <a href={ski.source_url} className="underline" rel="nofollow noopener" target="_blank">
            {new URL(ski.source_url).hostname}
          </a>
          {ski.image_source && <> · zdjęcie: {new URL(ski.image_source).hostname}</>}
        </p>
        {ski.note && (
          <details className="mt-1">
            <summary className="cursor-pointer">Uwagi redakcji do danych</summary>
            <p className="mt-1 max-w-prose">{ski.note}</p>
          </details>
        )}
      </div>
    </div>
  );
}
