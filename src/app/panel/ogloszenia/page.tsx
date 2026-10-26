import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MatchList } from "@/components/radar/MatchList";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { ScanButton } from "@/components/radar/parts";
import { SortSelect } from "@/components/radar/SortSelect";
import { requireUser } from "@/lib/auth";
import { listMatches } from "@/lib/radar/repo";
import { parseSort } from "@/lib/radar/sort";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Znalezione ogłoszenia" };

const TABS = [
  { id: "active", label: "Wszystkie" },
  { id: "new", label: "Nowe" },
  { id: "saved", label: "Zapisane" },
  { id: "dismissed", label: "Odrzucone" },
] as const;

type Status = (typeof TABS)[number]["id"];

async function Listings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const raw = sp.status;
  const status: Status = TABS.some((t) => t.id === raw)
    ? (raw as Status)
    : "active";
  const sort = parseSort(sp.sort);
  const items = await listMatches(user.id, { status, sort });

  return (
    <>
      <PageHeader
        title="Znalezione ogłoszenia"
        description="Ze wszystkich wyszukiwań."
        actions={<ScanButton />}
      />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={{
                pathname: "/panel/ogloszenia",
                query: {
                  ...(t.id !== "active" && { status: t.id }),
                  ...(sort !== "newest" && { sort }),
                },
              }}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                status === t.id
                  ? "border-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="pb-2">
          <SortSelect value={sort} />
        </div>
      </div>
      <MatchList
        items={items}
        empty={
          status === "saved"
            ? "Nie masz zapisanych ogłoszeń. Użyj ikony zakładki przy ogłoszeniu."
            : status === "dismissed"
              ? "Brak odrzuconych ogłoszeń."
              : "Jeszcze nic nie znaleźliśmy."
        }
      />
    </>
  );
}

export default function ListingsPage({
  searchParams,
}: PageProps<"/panel/ogloszenia">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Listings
        searchParams={
          searchParams as Promise<{ status?: string; sort?: string }>
        }
      />
    </Suspense>
  );
}
