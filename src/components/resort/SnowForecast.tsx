"use client";

import { useState } from "react";
import type { DayPoint, EnsembleDay } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

const cm = (x: number) => `${(Math.round(x * 10) / 10).toLocaleString("pl-PL")} cm`;
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return { wd: d.toLocaleDateString("pl-PL", { weekday: "short" }), dm: d.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" }) };
};

/**
 * Prognoza dzienna na 16 dni. Słupek = mediana scenariuszy ECMWF (albo prognoza
 * deterministyczna, gdy brak zespołu), wąs = przedział 10–90%, pod spodem szansa na śnieg.
 */
export function SnowForecast({ days, ensemble }: { days: DayPoint[]; ensemble: EnsembleDay[] | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const ens = new Map((ensemble ?? []).map((e) => [e.date, e]));
  const rows = days.map((d) => ({ d, e: ens.get(d.date) }));
  const max = Math.max(5, ...rows.map(({ d, e }) => Math.max(d.snowfall, e?.p90 ?? 0)));
  const H = 140;
  const total7 = rows.slice(0, 7).reduce((s, r) => s + (r.e?.median ?? r.d.snowfall), 0);
  const total16 = rows.reduce((s, r) => s + (r.e?.median ?? r.d.snowfall), 0);
  const snowyDays = rows.filter((r) => (r.e?.chance ?? (r.d.snowfall >= 1 ? 100 : 0)) >= 50).length;

  return (
    <div className="panel">
      <dl className="grid grid-cols-3 border-b border-border">
        {[
          ["Śnieg w 7 dni", cm(total7)],
          ["Śnieg w 16 dni", cm(total16)],
          ["Dni z szansą ≥50%", String(snowyDays)],
        ].map(([l, v]) => (
          <div key={l} className="border-r border-border p-4 last:border-r-0">
            <dt className="text-xs text-muted-foreground">{l}</dt>
            <dd className="text-3xl font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto">
        <div className="grid min-w-[880px]" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
          {rows.map(({ d, e }, i) => {
            const { wd, dm } = dayLabel(d.date);
            const value = e?.median ?? d.snowfall;
            const weekend = [0, 6].includes(new Date(`${d.date}T12:00:00`).getDay());
            return (
              <div
                key={d.date}
                className={`relative border-r border-border px-1 pt-3 text-center last:border-r-0 ${weekend ? "bg-muted/60" : ""} ${hover === i ? "bg-primary/5" : ""}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                <p className="text-[11px] font-semibold">{wd}</p>
                <p className="text-[11px] text-muted-foreground">{dm}</p>
                <WeatherIcon code={d.code} className="mx-auto my-1 h-7 w-7" />
                <p className="text-sm font-semibold">{Math.round(d.tMax)}°</p>
                <p className="text-xs text-muted-foreground">{Math.round(d.tMin)}°</p>

                <div className="relative mx-auto mt-2 w-full" style={{ height: H }}>
                  {/* przedział 10–90% */}
                  {e && e.p90 > 0 && (
                    <span
                      className="absolute left-1/2 w-px -translate-x-1/2 bg-foreground/50"
                      style={{ bottom: (e.p10 / max) * H, height: Math.max(1, ((e.p90 - e.p10) / max) * H) }}
                    />
                  )}
                  {e && e.p90 > 0 && (
                    <span className="absolute left-1/2 h-px w-3 -translate-x-1/2 bg-foreground/50" style={{ bottom: (e.p90 / max) * H }} />
                  )}
                  <span
                    className="absolute bottom-0 left-1/2 w-[55%] -translate-x-1/2 rounded-t-[4px] bg-snow"
                    style={{ height: value > 0 ? Math.max(2, (value / max) * H) : 0 }}
                  />
                </div>
                <p className="mt-1 text-xs font-semibold">{value >= 0.1 ? cm(value) : "–"}</p>
                <p className={`mb-2 text-[11px] ${e && e.chance >= 50 ? "font-semibold text-snow" : "text-muted-foreground"}`}>
                  {e ? `${e.chance}%` : ""}
                </p>

                {hover === i && (
                  <div className="pointer-events-none absolute left-1/2 top-2 z-10 w-44 -translate-x-1/2 panel p-2 text-left text-xs shadow-lg">
                    <p className="font-semibold">
                      {wd} {dm}
                    </p>
                    <p>Śnieg (mediana): {cm(value)}</p>
                    {e && (
                      <>
                        <p className="text-muted-foreground">
                          Zakres 10–90%: {cm(e.p10)}–{cm(e.p90)}
                        </p>
                        <p className="text-muted-foreground">Szansa na ≥1 cm: {e.chance}%</p>
                      </>
                    )}
                    <p className="text-muted-foreground">Deszcz: {d.rain.toLocaleString("pl-PL")} mm</p>
                    <p className="text-muted-foreground">
                      Wiatr do {d.windMax} km/h, porywy {d.gustsMax}
                    </p>
                    <p className="text-muted-foreground">Słońce: {d.sunshineH.toLocaleString("pl-PL")} h</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Słupek: mediana z 51 scenariuszy modelu ECMWF dla wysokości szczytu. Kreska: zakres, w którym mieści się 80%
        scenariuszy. Procent: ile scenariuszy daje co najmniej 1 cm śniegu. Im dalej, tym większa niepewność.
      </p>
    </div>
  );
}
