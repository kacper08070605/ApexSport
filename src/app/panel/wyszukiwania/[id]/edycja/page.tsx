import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { WatchForm } from "@/components/radar/WatchForm";
import { requireUser } from "@/lib/auth";
import { familyOptions } from "@/lib/radar/families";
import { PLANS } from "@/lib/radar/plans";
import { getWatch } from "@/lib/radar/repo";

async function EditWatch({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const watch = getWatch(user.id, (await params).id);
  if (!watch) notFound();
  return (
    <>
      <PageHeader title={`Edycja: ${watch.name}`} description="Po zapisaniu przeszukamy ogłoszenia jeszcze raz według nowych kryteriów." />
      <WatchForm watch={watch} families={familyOptions()} canInstant={PLANS[user.plan].instant} />
    </>
  );
}

export default function EditWatchPage({ params }: PageProps<"/panel/wyszukiwania/[id]/edycja">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <EditWatch params={params} />
    </Suspense>
  );
}
