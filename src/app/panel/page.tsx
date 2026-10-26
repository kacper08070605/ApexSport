import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { MatchList } from "@/components/radar/MatchList";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { DigestButton, ScanButton } from "@/components/radar/parts";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { describeWatch } from "@/lib/radar/match";
import { PLANS } from "@/lib/radar/plans";
import { dashboardStats, listMatches, listWatches } from "@/lib/radar/repo";

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "jeszcze nie";

async function Overview() {
  const user = await requireUser();
  const stats = dashboardStats(user.id);
  const watches = listWatches(user.id);
  const latest = listMatches(user.id, { status: "active", limit: 6 });
  const plan = PLANS[user.plan];

  if (watches.length === 0) {
    return (
      <>
        <PageHeader title={`Cześć${user.name ? `, ${user.name}` : ""}`} description="Zacznij od pierwszego wyszukiwania." />
        <div className="rounded-md border bg-card p-8">
          <h2 className="text-lg font-semibold">Nie masz jeszcze wyszukiwań</h2>
          <p className="mt-1 max-w-lg text-muted-foreground">
            Wybierz model, długość i cenę. Bot przejrzy ogłoszenia z ostatnich 7 dni i od razu pokaże, co pasuje.
          </p>
          <Button asChild className="mt-5 h-10">
            <Link href="/panel/wyszukiwania/nowe">
              <Plus /> Utwórz wyszukiwanie
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const tiles = [
    { label: "Aktywne wyszukiwania", value: `${stats.activeWatches} / ${plan.maxWatches}`, href: "/panel/wyszukiwania" },
    { label: "Nowe ogłoszenia (24 h)", value: stats.matches24h, href: "/panel/ogloszenia" },
    { label: "Nieprzejrzane", value: stats.unseen, href: "/panel/ogloszenia?status=new" },
    { label: "Zapisane", value: stats.saved, href: "/panel/ogloszenia?status=saved" },
  ];

  return (
    <>
      <PageHeader
        title="Przegląd"
        description={`Ostatnie skanowanie: ${fmtTime(stats.lastScan)} · plan ${plan.name}, skanowanie ${plan.scanEvery}`}
        actions={
          <>
            {user.plan === "free" && <DigestButton />}
            <ScanButton />
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="bg-card p-4 transition-colors hover:bg-muted/50">
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums">{t.value}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">Najnowsze ogłoszenia</h2>
            <Link href="/panel/ogloszenia" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Wszystkie <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <MatchList items={latest} empty="Jeszcze nic nie znaleźliśmy. Kliknij „Skanuj teraz” albo poszerz kryteria wyszukiwania." />
        </section>
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">Wyszukiwania</h2>
            <Link href="/panel/wyszukiwania/nowe" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Plus className="size-3.5" /> Nowe
            </Link>
          </div>
          <ul className="divide-y rounded-md border bg-card">
            {watches.map((w) => (
              <li key={w.id}>
                <Link href={`/panel/wyszukiwania/${w.id}`} className="block p-4 hover:bg-muted/50">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{w.name}</span>
                    {w.fresh > 0 && <span className="rounded-sm bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">{w.fresh}</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{describeWatch(w)}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {w.active ? `${w.total} ogłoszeń${w.best ? `, najtaniej ${w.best.toLocaleString("pl-PL")} zł` : ""}` : "wstrzymane"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function PanelHome() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Overview />
    </Suspense>
  );
}
