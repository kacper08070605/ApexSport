import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { WatchSwitch } from "@/components/radar/parts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { describeWatch } from "@/lib/radar/match";
import { PLANS } from "@/lib/radar/plans";
import { listWatches } from "@/lib/radar/repo";
import { SOURCES } from "@/lib/radar/sources";

export const metadata: Metadata = { title: "Wyszukiwania" };

const NOTIFY = { instant: "od razu", daily: "raz dziennie", off: "wyłączone" };

async function Watches() {
  const user = await requireUser();
  const watches = await listWatches(user.id);
  const plan = PLANS[user.plan];
  const full = watches.length >= plan.maxWatches;

  return (
    <>
      <PageHeader
        title="Wyszukiwania"
        description={`${watches.length} z ${plan.maxWatches} w planie ${plan.name}`}
        actions={
          full ? (
            <Button asChild variant="outline" className="h-9 bg-card">
              <Link href="/panel/plan">Limit planu, przejdź na Pro</Link>
            </Button>
          ) : (
            <Button asChild className="h-9">
              <Link href="/panel/wyszukiwania/nowe">
                <Plus /> Nowe wyszukiwanie
              </Link>
            </Button>
          )
        }
      />
      {watches.length === 0 ? (
        <div className="rounded-md border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Brak wyszukiwań.{" "}
          <Link href="/panel/wyszukiwania/nowe" className="text-primary underline">
            Utwórz pierwsze
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Wyszukiwanie</TableHead>
                <TableHead>Serwisy</TableHead>
                <TableHead>Powiadomienia</TableHead>
                <TableHead className="text-right">Ogłoszenia</TableHead>
                <TableHead className="text-right">Najtaniej</TableHead>
                <TableHead className="w-16 text-right">Aktywne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watches.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="max-w-72">
                    <Link href={`/panel/wyszukiwania/${w.id}`} className="font-medium hover:underline">
                      {w.name}
                    </Link>
                    <span className="block truncate text-xs text-muted-foreground">{describeWatch(w)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex gap-1">
                      {w.sources.map((s) => (
                        <span key={s} title={SOURCES[s].label} className="rounded-sm border px-1.5 py-0.5 text-xs">
                          {SOURCES[s].label}
                        </span>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{NOTIFY[w.notify]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {w.total}
                    {w.fresh > 0 && <span className="ml-1.5 text-xs font-medium text-primary">+{w.fresh} nowe</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{w.best ? `${w.best.toLocaleString("pl-PL")} zł` : "–"}</TableCell>
                  <TableCell className="text-right">
                    <WatchSwitch id={w.id} active={w.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

export default function WatchesPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Watches />
    </Suspense>
  );
}
