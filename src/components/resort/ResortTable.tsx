"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type Currency, formatMoney, toPln } from "@/lib/money";
import { COUNTRY_LABEL, COUNTRY_ORDER } from "@/lib/countries";
import type { Country, Resort } from "@/lib/types";
import type { SnowOutlook } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

export interface ResortRow {
  resort: Resort;
  skipass?: { amount: number; currency: Currency };
  outlook?: SnowOutlook;
}

type SortKey = "km" | "vertical" | "top" | "skipass" | "next7" | "past72" | "name";

const COLUMNS: { key: SortKey; label: string; weather?: boolean }[] = [
  { key: "km", label: "Trasy" },
  { key: "vertical", label: "Przewyższenie" },
  { key: "top", label: "Szczyt" },
  { key: "skipass", label: "Skipass" },
  { key: "past72", label: "Śnieg 72 h", weather: true },
  { key: "next7", label: "Prognoza 7 dni", weather: true },
];

const value = (r: ResortRow, k: SortKey): number | string => {
  switch (k) {
    case "km":
      return r.resort.stats.downhill_km ?? -1;
    case "vertical":
      return r.resort.stats.vertical_m ?? -1;
    case "top":
      return r.resort.stats.max_elevation_m ?? -1;
    case "skipass":
      return r.skipass ? toPln(r.skipass.amount, r.skipass.currency) : 99999;
    case "next7":
      return r.outlook?.next7 ?? -1;
    case "past72":
      return r.outlook?.past72 ?? -1;
    case "name":
      return r.resort.name;
  }
};

export function ResortTable({ rows, withWeather }: { rows: ResortRow[]; withWeather: boolean }) {
  const [sort, setSort] = useState<SortKey>(withWeather ? "next7" : "km");
  const [country, setCountry] = useState<Country | "">("");
  const [range, setRange] = useState("");
  const countries = useMemo(() => COUNTRY_ORDER.filter((c) => rows.some((r) => r.resort.country === c)), [rows]);
  const ranges = useMemo(
    () => [...new Set(rows.filter((r) => !country || r.resort.country === country).map((r) => r.resort.range))].sort(),
    [rows, country],
  );

  const sorted = useMemo(() => {
    const asc = sort === "skipass" || sort === "name";
    return rows
      .filter((r) => (!country || r.resort.country === country) && (!range || r.resort.range === range))
      .sort((a, b) => {
        const x = value(a, sort);
        const y = value(b, sort);
        if (typeof x === "string" || typeof y === "string") return String(x).localeCompare(String(y));
        return asc ? x - y : y - x;
      });
  }, [rows, sort, range, country]);

  const cols = COLUMNS.filter((c) => withWeather || !c.weather);

  return (
    <div>
      {countries.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1 border-b">
          {(["", ...countries] as const).map((c) => (
            <button
              key={c || "all"}
              onClick={() => {
                setCountry(c);
                setRange("");
              }}
              className={`-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${country === c ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {c ? COUNTRY_LABEL[c] : "Wszystkie kraje"}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {c ? rows.filter((r) => r.resort.country === c).length : rows.length}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <button
          onClick={() => setRange("")}
          className={`rounded-md border px-3.5 py-1.5 transition-colors ${!range ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30"}`}
        >
          Wszystkie
        </button>
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r === range ? "" : r)}
            className={`rounded-md border px-3.5 py-1.5 transition-colors ${range === r ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto panel">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">
                <button onClick={() => setSort("name")} className={sort === "name" ? "text-foreground" : ""}>
                  Ośrodek
                </button>
              </th>
              {withWeather && <th className="px-2 py-2">Teraz</th>}
              {cols.map((c) => (
                <th key={c.key} className="px-4 py-2 text-right">
                  <button onClick={() => setSort(c.key)} className={`${sort === c.key ? "text-foreground" : "hover:text-foreground"}`}>
                    {c.label}
                    {sort === c.key && (c.key === "skipass" ? " ↑" : " ↓")}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const { resort: r, outlook: o } = row;
              return (
                <tr key={r.slug} className="border-t border-border hover:bg-muted">
                  <td className="px-4 py-2.5">
                    <Link href={`/narciarstwo/osrodki/${r.slug}`} className="font-semibold hover:text-primary">
                      {r.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {r.town} · {r.range}
                      {r.country !== "PL" && ` · ${COUNTRY_LABEL[r.country]}`}
                    </span>
                  </td>
                  {withWeather && (
                    <td className="px-2 py-2.5">
                      {o && (
                        <span className="flex items-center gap-1">
                          <WeatherIcon code={o.code} className="h-6 w-6" />
                          {Math.round(o.temp)}°
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right">{r.stats.downhill_km !== undefined ? `~${r.stats.downhill_km} km` : "brak"}</td>
                  <td className="px-4 py-2.5 text-right">{r.stats.vertical_m !== undefined ? `${r.stats.vertical_m} m` : "brak"}</td>
                  <td className="px-4 py-2.5 text-right">{r.stats.max_elevation_m !== undefined ? `${r.stats.max_elevation_m} m` : "brak"}</td>
                  <td className="px-4 py-2.5 text-right">
                    {row.skipass ? (
                      <>
                        {formatMoney(row.skipass.amount, row.skipass.currency)}
                        {row.skipass.currency !== "PLN" && (
                          <span className="block text-xs text-muted-foreground">≈ {formatMoney(Math.round(toPln(row.skipass.amount, row.skipass.currency)))}</span>
                        )}
                      </>
                    ) : (
                      "brak"
                    )}
                  </td>
                  {withWeather && (
                    <>
                      <td className="px-4 py-2.5 text-right">{o ? `${o.past72.toLocaleString("pl-PL")} cm` : "brak"}</td>
                      <td className="px-4 py-2.5 text-right">
                        {o ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 bg-snow" style={{ width: Math.min(60, o.next7 * 2) }} />
                            <strong className={o.next7 >= 5 ? "text-snow" : ""}>{o.next7.toLocaleString("pl-PL")} cm</strong>
                          </span>
                        ) : (
                          "brak"
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
