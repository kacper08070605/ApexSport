import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resortPhoto } from "@/lib/photos";
import { connection } from "next/server";
import { Suspense } from "react";
import { ResortMap } from "@/components/ResortMap";
import { ResortTable, type ResortRow } from "@/components/resort/ResortTable";
import { WeatherIcon } from "@/components/resort/WeatherIcon";
import { COUNTRY_LABEL } from "@/lib/countries";
import { getResortInfo } from "@/lib/resort-details";
import { getResorts } from "@/lib/resorts";
import { getSnowOutlook } from "@/lib/weather";

export const metadata: Metadata = {
  title: "Ośrodki narciarskie w Polsce, Czechach, na Słowacji i w Austrii",
  description:
    "Ośrodki narciarskie w Polsce i za granicą: gdzie spadnie najwięcej śniegu w 7 dni, temperatura teraz, trasy, wyciągi, przewyższenie i ceny skipassów.",
};

function baseRows(): ResortRow[] {
  return getResorts().map((resort) => {
    const f = getResortInfo(resort.slug)?.facts;
    return { resort, skipass: f?.skipass_day_adult ? { amount: f.skipass_day_adult, currency: f.skipass_currency ?? "PLN" } : undefined };
  });
}

async function LiveSection() {
  await connection();
  const rows = baseRows();
  const outlook = await getSnowOutlook(rows.map((r) => r.resort)).catch(() => null);
  if (!outlook) return <ResortTable rows={rows} withWeather={false} />;

  const bySlug = new Map(outlook.map((o) => [o.slug, o]));
  const withOutlook = rows.map((r) => ({ ...r, outlook: bySlug.get(r.resort.slug) }));
  const top = withOutlook
    .filter((r) => r.outlook && r.outlook.next7 >= 0.5)
    .sort((a, b) => b.outlook!.next7 - a.outlook!.next7)
    .slice(0, 4);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Gdzie spadnie najwięcej śniegu</h2>
        {top.length === 0 && (
          <p className="mt-4 panel p-4 text-muted-foreground">
            W najbliższych 7 dniach prognozy nie pokazują opadów śniegu w żadnym z ośrodków.
          </p>
        )}
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {top.map(({ resort, outlook: o }, i) => (
            <li key={resort.slug}>
              <Link href={`/narciarstwo/osrodki/${resort.slug}#prognoza`} className="panel lift flex h-full flex-col">
                <span className="relative block h-32 bg-secondary">
                  {resortPhoto(resort.slug) && <Image src={resortPhoto(resort.slug)!.file} alt="" fill sizes="25vw" className="object-cover" />}
                </span>
                <span className="flex flex-1 flex-col p-5">
                <span className="flex items-start justify-between">
                  <span className="flex size-7 items-center justify-center rounded-full bg-snow-soft text-sm font-semibold text-snow">{i + 1}</span>
                  <WeatherIcon code={o!.code} className="h-10 w-10" />
                </span>
                <span className="mt-2 font-semibold">{resort.name}</span>
                <span className="text-xs text-muted-foreground">{resort.range}</span>
                <span className="mt-auto pt-3">
                  <span className="text-2xl font-semibold text-snow">{o!.next7.toLocaleString("pl-PL")} cm</span>
                  <span className="block text-xs text-muted-foreground">
                    śniegu w 7 dni · teraz {Math.round(o!.temp)}° na szczycie
                  </span>
                </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <h2 className="mb-4 text-2xl font-semibold">Wszystkie ośrodki</h2>
      <ResortTable rows={withOutlook} withWeather />
    </>
  );
}

export default function ResortsPage() {
  const resorts = getResorts();
  const points = resorts
    .filter((r) => r.lat !== undefined && r.lng !== undefined)
    .map((r) => ({ slug: r.slug, name: r.name, lat: r.lat!, lng: r.lng!, subtitle: `${r.town} · ${r.range}${r.country !== "PL" ? ` · ${COUNTRY_LABEL[r.country]}` : ""}` }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-xs font-semibold text-primary">Strefa narciarska</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Ośrodki narciarskie</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">
        Polska, Czechy, Słowacja i Austria: prognoza śniegu dla szczytu każdego ośrodka, odświeżana co godzinę, plus mapy tras,
        wyciągi i ceny skipassów. Ceny zagraniczne podajemy w walucie ośrodka i orientacyjnie w złotówkach.
      </p>

      <div className="mt-6">
        <ResortMap points={points} />
      </div>

      <div className="mt-8">
        <Suspense fallback={<ResortTable rows={baseRows()} withWeather={false} />}>
          <LiveSection />
        </Suspense>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Pogoda: Open-Meteo (CC BY 4.0). Statystyki tras: OpenSkiData / © OpenStreetMap contributors (ODbL).
      </p>
    </div>
  );
}
