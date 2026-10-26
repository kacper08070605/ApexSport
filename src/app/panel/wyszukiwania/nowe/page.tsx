import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { WatchForm } from "@/components/radar/WatchForm";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { familyOptions } from "@/lib/radar/families";
import { PLANS } from "@/lib/radar/plans";

export const metadata: Metadata = { title: "Nowe wyszukiwanie" };

async function NewWatch({ searchParams }: { searchParams: Promise<{ pierwsze?: string }> }) {
  const user = await requireUser();
  const plan = PLANS[user.plan];
  const count = (getDb().prepare("SELECT COUNT(*) AS n FROM watches WHERE user_id = ?").get(user.id) as { n: number }).n;
  const first = (await searchParams).pierwsze === "1";

  if (count >= plan.maxWatches) {
    return (
      <>
        <PageHeader title="Nowe wyszukiwanie" />
        <div className="rounded-md border bg-card p-6">
          <p className="font-medium">Wykorzystano limit planu {plan.name} ({plan.maxWatches} wyszukiwania).</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Usuń nieużywane wyszukiwanie albo{" "}
            <Link href="/panel/plan" className="text-primary underline">
              przejdź na Pro
            </Link>
            , żeby mieć do {PLANS.pro.maxWatches}.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={first ? "Konto gotowe. Ustaw pierwsze wyszukiwanie" : "Nowe wyszukiwanie"}
        description="Po zapisaniu bot przejrzy ogłoszenia z ostatnich 7 dni i pokaże, co pasuje."
      />
      <WatchForm families={familyOptions()} canInstant={plan.instant} />
    </>
  );
}

export default function NewWatchPage({ searchParams }: PageProps<"/panel/wyszukiwania/nowe">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <NewWatch searchParams={searchParams as Promise<{ pierwsze?: string }>} />
    </Suspense>
  );
}
