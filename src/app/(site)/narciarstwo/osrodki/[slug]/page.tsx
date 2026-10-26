import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TopoPattern } from "@/components/TopoPattern";
import { photoCredit, resortPhoto } from "@/lib/photos";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClimateCharts } from "@/components/resort/ClimateCharts";
import { ConditionsNow } from "@/components/resort/ConditionsNow";
import { HourlyStrip } from "@/components/resort/HourlyStrip";
import { PisteExplorer } from "@/components/resort/PisteExplorer";
import { SnowForecast } from "@/components/resort/SnowForecast";
import { WeatherIcon } from "@/components/resort/WeatherIcon";
import { ArrowRight, ExternalLink, Info, Navigation, Sparkles } from "lucide-react";
import { PriceList } from "@/components/resort/PriceList";
import { Button } from "@/components/ui/button";
import {
  CLIMATE_SEASONS,
  getPriceList,
  getPriceListNote,
  DIFFICULTY,
  distanceKm,
  getResortClimate,
  getResortDetails,
  getResortInfo,
} from "@/lib/resort-details";
import { getResort, getResorts, RESORT_DATA_IMPORTED_AT } from "@/lib/resorts";
import { COUNTRY_LABEL } from "@/lib/countries";
import { formatMoney, toPln } from "@/lib/money";
import type { Resort } from "@/lib/types";
import { getResortForecast, getSnowEnsemble, getSnowOutlook } from "@/lib/weather";

export function generateStaticParams() {
  return getResorts().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/narciarstwo/osrodki/[slug]">): Promise<Metadata> {
  const resort = getResort((await params).slug);
  if (!resort) return {};
  return {
    title: `${resort.name}: warunki, prognoza śniegu, mapa tras`,
    description: `${resort.name} (${resort.town}, ${resort.range}): pogoda na szczycie i na dole, prognoza opadów śniegu na 16 dni, mapa tras i wyciągów, ceny skipassów.`,
  };
}

const NAV = [
  ["warunki", "Warunki"],
  ["prognoza", "Prognoza śniegu"],
  ["trasy", "Trasy i wyciągi"],
  ["cennik", "Cennik"],
  ["opis", "Opis"],
  ["kiedy", "Kiedy jechać"],
  ["okolica", "W okolicy"],
] as const;

function SectionTitle({ id, children, aside }: { id: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div id={id} className="mb-4 flex scroll-mt-32 flex-wrap items-end justify-between gap-2">
      <h2 className="text-2xl font-semibold">{children}</h2>
      {aside && <div className="text-sm text-muted-foreground">{aside}</div>}
    </div>
  );
}

function WeatherFallback({ h = "h-48" }: { h?: string }) {
  return <div className={`${h} animate-pulse panel`} />;
}

async function Weather({ resort }: { resort: Resort }) {
  await connection();
  const forecast = await getResortForecast(resort).catch(() => null);
  if (!forecast) return <p className="panel p-4 text-muted-foreground">Prognoza chwilowo niedostępna.</p>;
  return (
    <div className="space-y-4">
      <ConditionsNow forecast={forecast} />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Najbliższe 48 godzin na szczycie</h3>
        <HourlyStrip hours={forecast.top.hours} />
      </div>
    </div>
  );
}

async function Forecast({ resort }: { resort: Resort }) {
  await connection();
  const [forecast, ensemble] = await Promise.all([
    getResortForecast(resort).catch(() => null),
    getSnowEnsemble(resort).catch(() => null),
  ]);
  if (!forecast) return <p className="panel p-4 text-muted-foreground">Prognoza chwilowo niedostępna.</p>;
  return <SnowForecast days={forecast.top.days} ensemble={ensemble} />;
}

async function Nearby({ resort }: { resort: Resort }) {
  await connection();
  const near = getResorts()
    .filter((r) => r.slug !== resort.slug)
    .map((r) => ({ r, km: distanceKm(resort, r) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 6);
  const outlook = await getSnowOutlook(near.map((n) => n.r)).catch(() => null);
  const bySlug = new Map((outlook ?? []).map((o) => [o.slug, o]));
  return (
    <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {near.map(({ r, km }) => {
        const o = bySlug.get(r.slug);
        return (
          <li key={r.slug} className="bg-card">
            <Link href={`/narciarstwo/osrodki/${r.slug}`} className="flex items-center gap-3 p-4 hover:bg-muted">
              {o && <WeatherIcon code={o.code} className="h-9 w-9 shrink-0" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(km)} km stąd · ~{r.stats.downhill_km ?? "?"} km tras
                </span>
              </span>
              {o && (
                <span className="text-right text-xs">
                  <span className="block font-semibold">{Math.round(o.temp)}°</span>
                  <span className="text-muted-foreground">7 dni: {o.next7.toLocaleString("pl-PL")} cm</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function ResortPage({ params }: PageProps<"/narciarstwo/osrodki/[slug]">) {
  const resort = getResort((await params).slug);
  if (!resort) notFound();

  const s = resort.stats;
  const details = getResortDetails(resort.slug);
  const info = getResortInfo(resort.slug);
  const climate = getResortClimate(resort.slug);
  const priceList = getPriceList(resort.slug);
  const photo = resortPhoto(resort.slug);
  const f = info?.facts ?? {};
  const website = f.website ?? resort.website;
  const kmTotal = details ? Object.values(details.km_by_difficulty).reduce((a, b) => a + b, 0) : 0;
  const directions =
    resort.lat !== undefined ? `https://www.google.com/maps/dir/?api=1&destination=${resort.lat},${resort.lng}` : undefined;

  const headline = [
    { label: "Trasy", value: s.downhill_km !== undefined ? `~${s.downhill_km} km` : "brak danych" },
    { label: "Wyciągi", value: s.lift_count ?? "brak" },
    { label: "Przewyższenie", value: s.vertical_m !== undefined ? `${s.vertical_m} m` : "brak" },
    {
      label: "Wysokość",
      value: s.min_elevation_m !== undefined ? `${s.min_elevation_m}–${s.max_elevation_m} m` : "brak",
    },
    {
      label: "Skipass dzienny",
      value: f.skipass_day_adult
        ? `${formatMoney(f.skipass_day_adult, f.skipass_currency)}${f.skipass_currency && f.skipass_currency !== "PLN" ? ` (≈ ${formatMoney(Math.round(toPln(f.skipass_day_adult, f.skipass_currency)))})` : ""}`
        : "brak cennika",
    },
  ];

  const facts: [string, string | undefined][] = [
    ["Adres", f.address],
    ["Godziny", f.opening_hours],
    ["Jazda wieczorna", f.night_skiing === undefined ? undefined : f.night_skiing ? (f.night_skiing_hours ?? "tak") : "nie"],
    ["Naśnieżanie", f.snowmaking],
    ["Najdłuższa trasa", f.longest_run],
    ["Snowpark", f.snowpark === undefined ? undefined : f.snowpark ? "tak" : "nie"],
    ["Szkoła narciarska", f.ski_school === undefined ? undefined : f.ski_school ? "tak" : "nie"],
    ["Wypożyczalnia", f.rental === undefined ? undefined : f.rental ? "tak" : "nie"],
    ["Parking", f.parking],
    ["Sezon", f.season],
  ];

  return (
    <div>
      {photo ? (
        <figure className="relative h-56 overflow-hidden bg-muted md:h-80">
          <Image src={photo.file} alt={photo.title} fill priority sizes="100vw" className="object-cover" />
          <figcaption className="absolute right-3 bottom-2 rounded-sm bg-black/45 px-1.5 py-0.5 text-[10px] text-white/85">
            {photoCredit(photo)}
          </figcaption>
        </figure>
      ) : (
        <div className="relative h-28 overflow-hidden bg-secondary text-foreground/15 md:h-36">
          <TopoPattern className="absolute inset-0 size-full" />
        </div>
      )}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-5">
          <nav className="text-sm text-muted-foreground">
            <Link href="/narciarstwo/osrodki" className="hover:text-foreground">
              Ośrodki narciarskie
            </Link>
            {" / "}
            {resort.range}
          </nav>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{resort.name}</h1>
              <p className="mt-1 text-muted-foreground">
                {resort.town} · {resort.country === "PL" ? `woj. ${resort.region}` : `${resort.region}, ${COUNTRY_LABEL[resort.country]}`} · {resort.range}
              </p>
            </div>
            <div className="flex gap-2">
              {directions && (
                <Button asChild variant="outline" className="h-10 rounded-md bg-card px-4">
                  <a href={directions} target="_blank" rel="noopener">
                    <Navigation /> Wyznacz dojazd
                  </a>
                </Button>
              )}
              {website && (
                <Button asChild className="h-10 rounded-md px-4">
                  <a href={website} target="_blank" rel="noopener">
                    Strona ośrodka <ExternalLink />
                  </a>
                </Button>
              )}
            </div>
          </div>
          {info?.summary && <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{info.summary}</p>}
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {headline.map((x) => (
              <div key={x.label} className="rounded-xl border bg-background px-4 py-3">
                <dt className="text-xs text-muted-foreground">{x.label}</dt>
                <dd className="mt-0.5 text-xl font-semibold tabular-nums">{x.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <nav className="sticky top-16 z-30 border-t bg-card/90">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-sm whitespace-nowrap [scrollbar-width:none]">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                {label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
        <section>
          <SectionTitle id="warunki">Warunki teraz</SectionTitle>
          <Suspense fallback={<WeatherFallback h="h-72" />}>
            <Weather resort={resort} />
          </Suspense>
        </section>

        <section>
          <SectionTitle id="prognoza" aside="16 dni, wysokość szczytu">
            Prognoza opadów śniegu
          </SectionTitle>
          <Suspense fallback={<WeatherFallback h="h-80" />}>
            <Forecast resort={resort} />
          </Suspense>
        </section>

        <section>
          <SectionTitle
            id="trasy"
            aside={details ? `${details.runs.length} tras · ${details.lifts.length} wyciągów w danych OpenStreetMap` : undefined}
          >
            Trasy i wyciągi
          </SectionTitle>
          {details && kmTotal > 0 && (
            <div className="mb-4">
              <div className="flex h-3 w-full overflow-hidden">
                {Object.entries(details.km_by_difficulty)
                  .sort(([a], [b]) => (DIFFICULTY[a]?.order ?? 9) - (DIFFICULTY[b]?.order ?? 9))
                  .map(([k, km]) => (
                    <span key={k} style={{ width: `${(km / kmTotal) * 100}%`, background: DIFFICULTY[k]?.color ?? DIFFICULTY.unknown.color }} className="border-r-2 border-background last:border-r-0" />
                  ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {Object.entries(details.km_by_difficulty)
                  .sort(([a], [b]) => (DIFFICULTY[a]?.order ?? 9) - (DIFFICULTY[b]?.order ?? 9))
                  .map(([k, km]) => (
                    <li key={k} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: DIFFICULTY[k]?.color ?? DIFFICULTY.unknown.color }} />
                      {DIFFICULTY[k]?.label ?? k}: <strong>{km.toLocaleString("pl-PL")} km</strong>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {details && resort.lat !== undefined && resort.lng !== undefined && (details.runs.length > 0 || details.lifts.length > 0) ? (
            <PisteExplorer
              slug={resort.slug}
              runs={details.runs}
              lifts={details.lifts}
              center={[resort.lng, resort.lat]}
              bbox={details.bbox}
            />
          ) : (
            <p className="panel p-4 text-muted-foreground">
              OpenStreetMap nie ma jeszcze tras tego ośrodka.{" "}
              {resort.openskimap_url && (
                <a href={resort.openskimap_url} className="underline" target="_blank" rel="noopener">
                  Zobacz na OpenSkiMap
                </a>
              )}
            </p>
          )}
        </section>

        <section>
          <SectionTitle id="cennik" aside={priceList ? `sezon ${priceList.season}` : undefined}>
            Cennik skipassów
          </SectionTitle>
          {priceList ? (
            <PriceList data={priceList} />
          ) : (
            <div className="panel flex items-start gap-3 p-5 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <div>
                <p>Ośrodek nie opublikował jeszcze pełnego cennika na ten sezon.</p>
                {getPriceListNote(resort.slug)?.map((n) => (
                  <p key={n} className="mt-1">
                    {n}
                  </p>
                ))}
                {f.skipass_day_adult && (
                  <p className="mt-2 text-foreground">
                    Ostatnia znana cena karnetu dziennego (normalny, sezon {f.skipass_season}): <strong>{formatMoney(f.skipass_day_adult, f.skipass_currency)}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <SectionTitle id="opis">O ośrodku</SectionTitle>
            {info?.sections?.length ? (
              <div className="space-y-6">
                {info.sections.map((sec) => (
                  <div key={sec.title}>
                    <h3 className="text-lg font-semibold">{sec.title}</h3>
                    <p className="mt-1 max-w-prose leading-relaxed">{sec.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Opis ośrodka w przygotowaniu.</p>
            )}
          </div>
          <aside className="space-y-4">
            <dl className="panel px-4">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[120px_1fr] gap-3 border-b py-3 text-sm last:border-0">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
            <Link href="/dobor-nart" className="panel lift flex items-center gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-medium">Narty przed wyjazdem</span>
                <span className="text-sm text-muted-foreground">Dobór i porównanie cen w sklepach</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          </aside>
        </section>

        {climate && (
          <section>
            <SectionTitle id="kiedy" aside={`na wysokości ok. ${climate.elevation_m ?? "?"} m`}>
              Kiedy jechać
            </SectionTitle>
            <ClimateCharts climate={climate} seasonsLabel={CLIMATE_SEASONS} />
            <p className="mt-2 text-xs text-muted-foreground">
              Opady naturalnego śniegu z reanalizy ERA5 (Open-Meteo) dla okolicy ośrodka. Nie uwzględniają naśnieżania,
              a model w siatce ~25 km wygładza różnice między sąsiednimi stokami.
            </p>
          </section>
        )}

        <section>
          <SectionTitle id="okolica">Inne ośrodki w okolicy</SectionTitle>
          <Suspense fallback={<WeatherFallback h="h-40" />}>
            <Nearby resort={resort} />
          </Suspense>
        </section>

        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          <p>
            Trasy, wyciągi i statystyki: OpenSkiData / © OpenStreetMap contributors (ODbL), import {RESORT_DATA_IMPORTED_AT}.
            Pogoda: Open-Meteo (CC BY 4.0), modele ICON, ECMWF i inne. Opis i ceny: strony ośrodków.
          </p>
          {info?.sources && info.sources.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer">Źródła opisu</summary>
              <ul className="mt-1 list-inside list-disc">
                {info.sources.map((u) => (
                  <li key={u}>
                    <a href={u} className="break-all underline" target="_blank" rel="noopener nofollow">
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </footer>
      </div>
    </div>
  );
}
