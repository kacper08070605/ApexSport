import type { ResortForecast } from "@/lib/weather";
import { weatherLabel } from "@/lib/weather-codes";
import { WeatherIcon } from "./WeatherIcon";

const t = (x: number) => `${x > 0 ? "+" : ""}${x.toLocaleString("pl-PL")}°`;
const time = (iso: string) => new Date(iso).toLocaleString("pl-PL", { weekday: "long", hour: "2-digit", minute: "2-digit" });

function Level({ title, f }: { title: string; f: ResortForecast["top"] }) {
  return (
    <div className="flex items-center gap-4 p-4">
      <WeatherIcon code={f.current.code} className="h-12 w-12 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-muted-foreground">
          {title} · {f.elevation} m
        </p>
        <p className="text-4xl font-semibold leading-none">{t(f.current.temp)}</p>
        <p className="text-sm text-muted-foreground">
          {weatherLabel(f.current.code).label} · wiatr {f.current.wind} km/h
          {f.current.gusts > f.current.wind + 10 && `, porywy ${f.current.gusts}`}
        </p>
      </div>
    </div>
  );
}

export function ConditionsNow({ forecast }: { forecast: ResortForecast }) {
  const { top, bottom } = forecast;
  const freezing = top.hours[0]?.freezing;
  const depth = top.current.snowDepth ?? bottom.current.snowDepth;
  const next24 = Math.round(top.hours.slice(0, 24).reduce((s, h) => s + h.snowfall, 0) * 10) / 10;

  const tiles = [
    { label: "Świeży śnieg 24 h", value: `${top.past24.toLocaleString("pl-PL")} cm`, hint: `72 h: ${top.past72.toLocaleString("pl-PL")} cm` },
    { label: "Prognoza 24 h", value: `${next24.toLocaleString("pl-PL")} cm`, hint: "śnieg na szczycie" },
    {
      label: "Granica zera",
      value: freezing ? `${freezing.toLocaleString("pl-PL")} m` : "brak",
      hint: freezing && freezing < bottom.elevation ? "cały stok poniżej zera" : freezing && freezing < top.elevation ? "zero w połowie stoku" : "powyżej szczytu",
    },
    {
      label: "Pokrywa (model)",
      value: depth !== null ? `${depth} cm` : "brak",
      hint: "naturalny śnieg, bez sztucznego",
    },
  ];

  return (
    <div className="panel">
      <div className="grid divide-border sm:grid-cols-2 sm:divide-x">
        <Level title="Szczyt" f={top} />
        <Level title="Dół" f={bottom} />
      </div>
      <dl className="grid grid-cols-2 border-t border-border md:grid-cols-4">
        {tiles.map((x) => (
          <div key={x.label} className="border-border p-4 [&:not(:last-child)]:border-r max-md:[&:nth-child(2)]:border-r-0 max-md:[&:nth-child(-n+2)]:border-b">
            <dt className="text-xs text-muted-foreground">{x.label}</dt>
            <dd className="text-2xl font-semibold">{x.value}</dd>
            <dd className="text-xs text-muted-foreground">{x.hint}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Prognoza modelowa dla wysokości szczytu i dolnej stacji, stan na {time(top.current.time)}. Źródło: Open-Meteo.
      </p>
    </div>
  );
}
