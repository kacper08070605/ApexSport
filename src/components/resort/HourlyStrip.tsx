import type { HourPoint } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

/** Najbliższe 48 godzin co 3 godziny: ikona, temperatura, śnieg, wiatr. */
export function HourlyStrip({ hours }: { hours: HourPoint[] }) {
  const step = hours.filter((_, i) => i % 3 === 0);
  return (
    <div className="overflow-x-auto panel">
      <ol className="flex min-w-max">
        {step.map((h, i) => {
          const d = new Date(h.time);
          const newDay = i === 0 || d.getHours() < 3;
          const snow = hours.slice(i * 3, i * 3 + 3).reduce((s, x) => s + x.snowfall, 0);
          return (
            <li key={h.time} className={`w-[76px] px-2 py-3 text-center ${newDay && i > 0 ? "border-l border-foreground/25" : "border-l border-border first:border-l-0"}`}>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {newDay ? d.toLocaleDateString("pl-PL", { weekday: "short" }) : " "}
              </p>
              <p className="text-sm font-semibold">{String(d.getHours()).padStart(2, "0")}:00</p>
              <WeatherIcon code={h.code} className="mx-auto my-1 h-8 w-8" />
              <p className="font-semibold">{Math.round(h.temp)}°</p>
              <p className={`text-xs ${snow >= 0.5 ? "font-semibold text-snow" : "text-muted-foreground"}`}>
                {snow >= 0.1 ? `${(Math.round(snow * 10) / 10).toLocaleString("pl-PL")} cm` : "0 cm"}
              </p>
              <p className="text-[11px] text-muted-foreground">{h.wind} km/h</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
