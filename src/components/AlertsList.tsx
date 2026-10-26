"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getStoredAlertIds, removeStoredAlertId } from "@/lib/alerts-client";

interface AlertView {
  id: string;
  email: string;
  slug: string;
  name: string;
  season?: string;
  image?: string | null;
  target: number;
  priceAtSignup: number;
  current?: number;
  status: "active" | "triggered" | "cancelled";
  createdAt: string;
  triggeredAt: string | null;
  triggeredPrice: number | null;
  notification: { subject: string; body: string; created_at: string } | null;
}

const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
const date = (iso: string) => new Date(iso).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" });

async function fetchAlerts(): Promise<AlertView[]> {
  const ids = getStoredAlertIds();
  if (ids.length === 0) return [];
  const res = await fetch(`/api/alerts?ids=${ids.join(",")}`, { cache: "no-store" });
  const json = await res.json();
  return json.alerts.filter((a: AlertView) => a.status !== "cancelled");
}

export function AlertsList() {
  const [alerts, setAlerts] = useState<AlertView[] | null>(null);

  const load = useCallback(() => fetchAlerts().then(setAlerts), []);

  useEffect(() => {
    let cancelled = false;
    fetchAlerts().then((a) => !cancelled && setAlerts(a));
    return () => {
      cancelled = true;
    };
  }, []);

  if (alerts === null) return <p className="text-muted-foreground">Wczytywanie…</p>;

  if (alerts.length === 0) {
    return (
      <div className="panel p-6">
        <p>Nie masz jeszcze alertów w tej przeglądarce.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Otwórz kartę produktu i ustaw cenę, przy której chcesz dostać powiadomienie.
        </p>
        <Link href="/narciarstwo/narty-zjazdowe" className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground">
          Przejdź do katalogu
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((a) => {
        const remaining = a.current !== undefined ? a.current - a.target : undefined;
        return (
          <li key={a.id} className="grid gap-4 panel p-4 sm:grid-cols-[72px_1fr_auto]">
            <div className="relative hidden h-[72px] bg-muted sm:block">
              {a.image && <Image src={a.image} alt="" fill sizes="72px" className="object-contain p-1" />}
            </div>
            <div>
              <Link href={`/produkt/${a.slug}`} className="font-semibold hover:text-primary">
                {a.name} {a.season}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Próg {zl(a.target)} · cena przy zapisie {zl(a.priceAtSignup)} · {a.email}
              </p>
              {a.status === "active" && remaining !== undefined && (
                <p className="mt-1 text-sm">
                  Teraz najtaniej {zl(a.current!)}, brakuje {zl(Math.max(0, remaining))}.
                </p>
              )}
              {a.status === "triggered" && (
                <div className="mt-2 border-l-4 border-deal bg-deal-soft px-3 py-2 text-sm">
                  <p className="font-semibold">
                    Cena spadła do {zl(a.triggeredPrice!)} · {date(a.triggeredAt!)}
                  </p>
                  {a.notification && (
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                      Wysłany e-mail: „{a.notification.subject}”
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-start gap-2 sm:flex-col sm:items-end">
              <span
                className={`px-2 py-0.5 text-xs font-semibold ${
                  a.status === "active" ? "bg-muted" : "bg-deal text-white"
                }`}
              >
                {a.status === "active" ? "Czeka na obniżkę" : "Wysłano powiadomienie"}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/alerts?id=${a.id}`, { method: "DELETE" });
                  removeStoredAlertId(a.id);
                  load();
                }}
                className="text-xs text-muted-foreground underline hover:text-primary"
              >
                Usuń
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
