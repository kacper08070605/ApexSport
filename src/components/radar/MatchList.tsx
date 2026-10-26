import Image from "next/image";
import Link from "next/link";
import { bestOffer, formatPrice } from "@/lib/catalog";
import type { MatchRow } from "@/lib/radar/repo";
import { CONDITIONS, SOURCES } from "@/lib/radar/sources";
import { cn } from "@/lib/utils";
import { MatchActions } from "./parts";

const ago = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `${Math.max(1, min)} min temu`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} godz. temu`;
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
};

/** Lista znalezionych ogłoszeń z porównaniem do najniższej ceny nowych nart. */
export function MatchList({ items, showWatch = true, empty }: { items: MatchRow[]; showWatch?: boolean; empty: React.ReactNode }) {
  if (!items.length) return <div className="rounded-md border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{empty}</div>;
  return (
    <ul className="divide-y rounded-md border bg-card">
      {items.map((m) => {
        const fresh = m.ski_slug ? bestOffer(m.ski_slug)?.price : undefined;
        const saving = fresh ? Math.round((1 - m.price / fresh) * 100) : undefined;
        return (
          <li key={m.match_id} className={cn("grid grid-cols-[64px_1fr] gap-4 p-4 sm:grid-cols-[64px_1fr_auto]", (m.status === "dismissed" || m.removed_at) && "opacity-55")}>
            <div className="relative h-20 w-16 overflow-hidden rounded-sm bg-muted">
              {m.image && <Image src={m.image} alt="" fill sizes="64px" className="object-contain py-1" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <span className="size-2 rounded-full" style={{ background: SOURCES[m.source].color }} />
                  {SOURCES[m.source].label}
                </span>
                <span>· {ago(m.posted_at)}</span>
                {m.location && <span>· {m.location}</span>}
                {m.removed_at && <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground">sprzedane lub usunięte</span>}
                {!m.removed_at && m.status === "new" && <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-medium text-primary">nieprzejrzane</span>}
                {m.status === "saved" && <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-medium">zapisane</span>}
              </div>
              <p className="mt-1 font-medium leading-snug">{m.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {m.condition && CONDITIONS[m.condition]}
                {m.length_cm && ` · ${m.length_cm} cm`}
                {m.size != null && ` · rozmiar ${String(m.size).replace(".", ",")}`}
                {showWatch && (
                  <>
                    {" · "}
                    <Link href={`/panel/wyszukiwania/${m.watch_id}`} className="underline-offset-2 hover:underline">
                      {m.watch_name}
                    </Link>
                  </>
                )}
                {m.ski_slug && (
                  <>
                    {" · "}
                    <Link href={`/produkt/${m.ski_slug}`} className="underline-offset-2 hover:underline">
                      karta modelu
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="col-span-2 flex items-end justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
              <div className="sm:text-right">
                <p className="font-heading text-xl font-semibold tabular-nums">{formatPrice(m.price)}</p>
                {fresh && saving !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    nowe od {formatPrice(fresh)}{" "}
                    {saving > 0 && <span className="font-medium text-deal">(−{saving}%)</span>}
                  </p>
                )}
              </div>
              <MatchActions matchId={m.match_id} status={m.status} url={`/panel/ogloszenie/${m.id}`} removed={Boolean(m.removed_at)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
