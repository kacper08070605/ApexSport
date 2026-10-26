import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MatchList } from "@/components/radar/MatchList";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { DeleteWatchButton, ScanButton, WatchSwitch } from "@/components/radar/parts";
import { SortSelect } from "@/components/radar/SortSelect";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/catalog";
import { describeWatch, formatSizeRange, keywordPhrases } from "@/lib/radar/match";
import { getWatch, listMatches } from "@/lib/radar/repo";
import { parseSort } from "@/lib/radar/sort";
import { CATEGORIES, CONDITIONS, GENDERS, SOURCES } from "@/lib/radar/sources";
import { vintedSearchUrl } from "@/lib/radar/vinted";

const NOTIFY = { instant: "od razu po znalezieniu", daily: "raz dziennie (podsumowanie)", off: "wyłączone, tylko panel" };

async function WatchDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sort?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const sort = parseSort((await searchParams).sort);
  const watch = getWatch(user.id, id);
  if (!watch) notFound();
  const items = listMatches(user.id, { watchId: id, status: "active", sort });
  const prices = items.filter((i) => !i.removed_at).map((i) => i.price);

  const criteria: [string, string][] = [
    ["Kategoria", CATEGORIES[watch.category].label],
    ...(watch.category === "boots" ? ([["Dla kogo", GENDERS[watch.gender]]] as [string, string][]) : []),
    ...(watch.category === "skis" ? ([["Modele", watch.families.join(", ") || "dowolne"]] as [string, string][]) : []),
    ["Słowa kluczowe", watch.keywords || "brak"],
    [
      "Cena",
      watch.min_price != null || watch.max_price != null ? `${watch.min_price ?? 0}–${watch.max_price ?? "∞"} zł` : "bez limitu",
    ],
    watch.category === "boots"
      ? ["Rozmiar", watch.size_min != null || watch.size_max != null ? formatSizeRange(watch) : "dowolny"]
      : ["Długość", watch.len_min != null || watch.len_max != null ? `${watch.len_min ?? "?"}–${watch.len_max ?? "?"} cm` : "dowolna"],
    ["Stan", watch.conditions.map((c) => CONDITIONS[c]).join(", ") || "każdy"],
    ["Serwisy", watch.sources.map((s) => SOURCES[s].label).join(", ")],
    ["Powiadomienia", NOTIFY[watch.notify]],
  ];

  return (
    <>
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/panel/wyszukiwania" className="hover:text-foreground">
          Wyszukiwania
        </Link>{" "}
        / {watch.name}
      </nav>
      <PageHeader
        title={watch.name}
        description={describeWatch(watch)}
        actions={
          <>
            <label className="flex h-9 items-center gap-2 rounded-sm border bg-card px-3 text-sm">
              <WatchSwitch id={watch.id} active={watch.active} />
              {watch.active ? "Aktywne" : "Wstrzymane"}
            </label>
            <Button asChild variant="outline" className="h-9 bg-card">
              <Link href={`/panel/wyszukiwania/${watch.id}/edycja`}>
                <Pencil /> Edytuj
              </Link>
            </Button>
            <DeleteWatchButton id={watch.id} name={watch.name} />
            <ScanButton />
          </>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">
              Znalezione ogłoszenia <span className="font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <SortSelect value={sort} />
          </div>
          <MatchList
            items={items}
            showWatch={false}
            empty="Na razie nic nie pasuje. Bot sprawdza nowe ogłoszenia automatycznie, możesz też kliknąć „Skanuj teraz”."
          />
        </section>
        <aside className="space-y-4">
          {prices.length > 0 && (
            <div className="rounded-md border bg-card p-4">
              <p className="text-sm text-muted-foreground">Ceny znalezionych ogłoszeń</p>
              <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
                {formatPrice(Math.min(...prices))} – {formatPrice(Math.max(...prices))}
              </p>
              <p className="text-xs text-muted-foreground">mediana {formatPrice(prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)])}</p>
            </div>
          )}
          <dl className="divide-y rounded-md border bg-card px-4 text-sm">
            {criteria.map(([k, v]) => (
              <div key={k} className="py-2.5">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {watch.sources.includes("vinted") && (
            <div className="rounded-md border bg-card p-4 text-sm">
              <p className="text-xs text-muted-foreground">Te same filtry na Vinted</p>
              <ul className="mt-1.5 space-y-1">
                {[...watch.families, ...keywordPhrases(watch.keywords)].map((phrase) => (
                  <li key={phrase}>
                    <a
                      href={vintedSearchUrl({
                        phrase,
                        category: watch.category,
                        gender: watch.gender,
                        minPrice: watch.min_price,
                        maxPrice: watch.max_price,
                        conditions: watch.conditions,
                      })}
                      target="_blank"
                      rel="noopener nofollow"
                      className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                    >
                      {phrase} <ExternalLink className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export default function WatchPage({ params, searchParams }: PageProps<"/panel/wyszukiwania/[id]">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <WatchDetail params={params} searchParams={searchParams as Promise<{ sort?: string }>} />
    </Suspense>
  );
}
