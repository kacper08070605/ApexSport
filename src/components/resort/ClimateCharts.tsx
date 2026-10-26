import { MONTH_LABEL, type ResortClimate } from "@/lib/resort-details";

/** Średnie miesięczne opady śniegu (słupki) i dni ze śniegiem; obok sumy sezonów. */
export function ClimateCharts({ climate, seasonsLabel }: { climate: ResortClimate; seasonsLabel: string }) {
  const maxMonth = Math.max(...climate.months.map((m) => m.snowfall_cm), 10);
  const best = climate.months.reduce((a, b) => (b.snowfall_cm > a.snowfall_cm ? b : a));
  const maxSeason = Math.max(...climate.seasons.map((s) => s.snowfall_cm), 10);
  const avgSeason = Math.round(climate.seasons.reduce((s, x) => s + x.snowfall_cm, 0) / climate.seasons.length);
  const H = 160;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure className="panel p-4">
        <figcaption className="mb-1 font-semibold">Średni opad śniegu w miesiącu</figcaption>
        <p className="mb-4 text-xs text-muted-foreground">
          Najwięcej śniegu zwykle w miesiącu: {MONTH_LABEL[best.month]} ({best.snowfall_cm} cm). Sezony {seasonsLabel}.
        </p>
        <div className="flex items-end gap-2" style={{ height: H + 40 }}>
          {climate.months.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center justify-end" title={`${m.snow_days} dni z opadem ≥1 cm, śr. temp. ${m.temp_c}°C`}>
              <span className="mb-1 text-xs font-semibold">{m.snowfall_cm} cm</span>
              <span
                className="w-full max-w-12 rounded-t-[4px] bg-snow"
                style={{ height: Math.max(2, (m.snowfall_cm / maxMonth) * H) }}
              />
              <span className="mt-1 text-xs font-semibold">{MONTH_LABEL[m.month]}</span>
            </div>
          ))}
        </div>
        <table className="mt-4 w-full text-xs">
          <tbody>
            <tr className="border-t border-border">
              <th className="py-1.5 text-left font-normal text-muted-foreground">Dni ze śniegiem</th>
              {climate.months.map((m) => (
                <td key={m.month} className="py-1.5 text-center">
                  {m.snow_days.toLocaleString("pl-PL")}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <th className="py-1.5 text-left font-normal text-muted-foreground">Śr. temperatura</th>
              {climate.months.map((m) => (
                <td key={m.month} className="py-1.5 text-center">
                  {m.temp_c.toLocaleString("pl-PL")}°
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </figure>

      <figure className="panel p-4">
        <figcaption className="mb-1 font-semibold">Suma opadów śniegu w sezonie (lis–kwi)</figcaption>
        <p className="mb-4 text-xs text-muted-foreground">Średnio {avgSeason} cm na sezon. Linia przerywana: średnia.</p>
        <div className="relative flex items-end gap-1.5" style={{ height: H + 40 }}>
          <span
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-foreground/40"
            style={{ bottom: 20 + (avgSeason / maxSeason) * H }}
          />
          {climate.seasons.map((s) => (
            <div key={s.season} className="flex flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[10px] font-semibold">{s.snowfall_cm}</span>
              <span
                className={`w-full rounded-t-[4px] ${s.snowfall_cm >= avgSeason ? "bg-snow" : "bg-snow/40"}`}
                style={{ height: Math.max(2, (s.snowfall_cm / maxSeason) * H) }}
              />
              <span className="mt-1 h-4 text-[10px] text-muted-foreground">{s.season.slice(2)}</span>
            </div>
          ))}
        </div>
      </figure>
    </div>
  );
}
