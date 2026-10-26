import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getShop, getShops } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { getSki, skiName } from "@/lib/skis";

export const metadata: Metadata = {
  title: "Statystyki przejść do sklepów",
  robots: { index: false },
};

/** Zakładana konwersja klik → zakup, typowa dla e-commerce (PROJEKT.md, sekcja 5.2). */
const CONVERSION = 0.02;

const zl = (n: number) => `${Math.round(n).toLocaleString("pl-PL")} zł`;

async function Stats() {
  await connection();
  const db = getDb();

  const byShop = db
    .prepare("SELECT shop, COUNT(*) AS clicks, AVG(price) AS avg_price FROM clicks GROUP BY shop ORDER BY clicks DESC")
    .all() as { shop: string; clicks: number; avg_price: number }[];
  const byProduct = db
    .prepare("SELECT product_slug, COUNT(*) AS clicks FROM clicks GROUP BY product_slug ORDER BY clicks DESC LIMIT 10")
    .all() as { product_slug: string; clicks: number }[];
  const alerts = db
    .prepare("SELECT status, COUNT(*) AS n FROM alerts GROUP BY status")
    .all() as { status: string; n: number }[];

  const totalClicks = byShop.reduce((n, r) => n + r.clicks, 0);
  const expected = byShop.reduce((sum, r) => {
    const shop = getShop(r.shop);
    return sum + r.clicks * CONVERSION * r.avg_price * ((shop?.commission_pct ?? 0) / 100);
  }, 0);
  const alertCount = (s: string) => alerts.find((a) => a.status === s)?.n ?? 0;

  return (
    <>
      <dl className="grid gap-px border border-border bg-border sm:grid-cols-4">
        {[
          ["Przejścia do sklepów", totalClicks.toLocaleString("pl-PL")],
          ["Szacowana prowizja", zl(expected)],
          ["Aktywne alerty", String(alertCount("active"))],
          ["Wysłane powiadomienia", String(alertCount("triggered"))],
        ].map(([label, value]) => (
          <div key={label} className="bg-card p-4">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-3xl font-semibold tracking-tight md:text-4xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Prowizja szacowana przy konwersji {CONVERSION * 100}% i stawkach programów partnerskich z tabeli
        poniżej. Realne rozliczenie przychodzi z paneli sieci afiliacyjnych.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <table className="w-full panel text-sm">
          <caption className="pb-2 text-left text-lg font-semibold">Według sklepu</caption>
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Sklep</th>
              <th className="px-3 py-2">Sieć</th>
              <th className="px-3 py-2 text-right">Prowizja</th>
              <th className="px-3 py-2 text-right">Przejścia</th>
            </tr>
          </thead>
          <tbody>
            {getShops().map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{s.name}</td>
                <td className="px-3 py-2">{s.network ?? "brak umowy"}</td>
                <td className="px-3 py-2 text-right">{s.commission_pct != null ? `${s.commission_pct.toLocaleString("pl-PL")}%` : "–"}</td>
                <td className="px-3 py-2 text-right">{byShop.find((r) => r.shop === s.id)?.clicks ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="w-full panel text-sm">
          <caption className="pb-2 text-left text-lg font-semibold">Najczęściej klikane</caption>
          <tbody>
            {byProduct.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground">Jeszcze nikt nie przeszedł do sklepu.</td>
              </tr>
            )}
            {byProduct.map((r) => {
              const ski = getSki(r.product_slug);
              return (
                <tr key={r.product_slug} className="border-t border-border first:border-0">
                  <td className="px-3 py-2">{ski ? `${skiName(ski)} ${ski.season}` : r.product_slug}</td>
                  <td className="px-3 py-2 text-right font-semibold">{r.clicks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Statystyki</h1>
      <p className="mt-1 text-sm text-muted-foreground">Panel demo: przejścia do sklepów i alerty zapisane w lokalnej bazie.</p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-muted-foreground">Liczenie…</p>}>
          <Stats />
        </Suspense>
      </div>
    </div>
  );
}
