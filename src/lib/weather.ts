import "server-only";
import { cacheLife } from "next/cache";
import type { Resort } from "./types";

// Prognozy z Open-Meteo (https://open-meteo.com), licencja CC BY 4.0.
// Darmowe API jest do użytku niekomercyjnego; produkcyjnie potrzebny jest plan płatny.

const FORECAST = "https://api.open-meteo.com/v1/forecast";
const ENSEMBLE = "https://ensemble-api.open-meteo.com/v1/ensemble";
const TZ = "Europe/Warsaw";

export interface HourPoint {
  time: string;
  temp: number;
  snowfall: number;
  rain: number;
  code: number;
  wind: number;
  gusts: number;
  freezing: number;
  snowDepth: number | null;
}

export interface DayPoint {
  date: string;
  code: number;
  tMax: number;
  tMin: number;
  snowfall: number;
  rain: number;
  windMax: number;
  gustsMax: number;
  sunshineH: number;
}

export interface LevelForecast {
  elevation: number;
  current: { time: string; temp: number; code: number; wind: number; gusts: number; snowDepth: number | null };
  hours: HourPoint[];
  days: DayPoint[];
  /** Suma śniegu z ostatnich 24 i 72 godzin (cm). */
  past24: number;
  past72: number;
}

export interface ResortForecast {
  fetchedAt: string;
  top: LevelForecast;
  bottom: LevelForecast;
}

export interface EnsembleDay {
  date: string;
  median: number;
  p10: number;
  p90: number;
  /** Udział scenariuszy z co najmniej 1 cm śniegu tego dnia. */
  chance: number;
}

const r1 = (x: number | null) => (x === null || x === undefined ? 0 : Math.round(x * 10) / 10);

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchLevel(lat: number, lng: number, elevation: number | undefined): Promise<LevelForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: TZ,
    forecast_days: "16",
    past_days: "3",
    current: "temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,snow_depth",
    hourly: "temperature_2m,snowfall,rain,weather_code,wind_speed_10m,wind_gusts_10m,freezing_level_height,snow_depth",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,rain_sum,wind_speed_10m_max,wind_gusts_10m_max,sunshine_duration",
  });
  if (elevation !== undefined) params.set("elevation", String(elevation));

  const res = await fetch(`${FORECAST}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const j: any = await res.json();
  const h = j.hourly;

  const nowIdx = Math.max(0, h.time.findIndex((t: string) => t >= j.current.time.slice(0, 13)));
  const sumBack = (n: number) =>
    r1(h.snowfall.slice(Math.max(0, nowIdx - n), nowIdx).reduce((s: number, x: number | null) => s + (x ?? 0), 0));

  const hours: HourPoint[] = h.time.map((t: string, i: number) => ({
    time: t,
    temp: r1(h.temperature_2m[i]),
    snowfall: r1(h.snowfall[i]),
    rain: r1(h.rain[i]),
    code: h.weather_code[i] ?? 0,
    wind: Math.round(h.wind_speed_10m[i] ?? 0),
    gusts: Math.round(h.wind_gusts_10m[i] ?? 0),
    freezing: Math.round(h.freezing_level_height[i] ?? 0),
    snowDepth: h.snow_depth[i] === null ? null : Math.round(h.snow_depth[i] * 100),
  }));

  const d = j.daily;
  const today = j.current.time.slice(0, 10);
  const days: DayPoint[] = d.time
    .map((t: string, i: number) => ({
      date: t,
      code: d.weather_code[i] ?? 0,
      tMax: r1(d.temperature_2m_max[i]),
      tMin: r1(d.temperature_2m_min[i]),
      snowfall: r1(d.snowfall_sum[i]),
      rain: r1(d.rain_sum[i]),
      windMax: Math.round(d.wind_speed_10m_max[i] ?? 0),
      gustsMax: Math.round(d.wind_gusts_10m_max[i] ?? 0),
      sunshineH: Math.round((d.sunshine_duration[i] ?? 0) / 360) / 10,
    }))
    .filter((x: DayPoint) => x.date >= today);

  return {
    elevation: Math.round(j.elevation),
    current: {
      time: j.current.time,
      temp: r1(j.current.temperature_2m),
      code: j.current.weather_code ?? 0,
      wind: Math.round(j.current.wind_speed_10m ?? 0),
      gusts: Math.round(j.current.wind_gusts_10m ?? 0),
      snowDepth: j.current.snow_depth === null ? null : Math.round(j.current.snow_depth * 100),
    },
    // od bieżącej godziny na 48 h do przodu
    hours: hours.slice(nowIdx, nowIdx + 48),
    days,
    past24: sumBack(24),
    past72: sumBack(72),
  };
}

// Funkcje z "use cache" przy błędzie rzucają wyjątek zamiast zwracać null,
// żeby nieudana odpowiedź nie trafiła do cache na godzinę. Wywołujący łapie błąd.

/** Prognoza dla góry i dołu ośrodka; odświeżana co godzinę. */
export async function getResortForecast(resort: Resort): Promise<ResortForecast | null> {
  "use cache";
  cacheLife("hours");
  if (resort.lat === undefined || resort.lng === undefined) return null;
  const [top, bottom] = await Promise.all([
    fetchLevel(resort.lat, resort.lng, resort.stats.max_elevation_m),
    fetchLevel(resort.lat, resort.lng, resort.stats.min_elevation_m),
  ]);
  return { fetchedAt: new Date().toISOString(), top, bottom };
}

function quantile(sorted: number[], q: number) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (pos - lo);
}

/**
 * Prognoza zespołowa ECMWF (51 scenariuszy): dla każdego dnia mediana, przedział 10–90%
 * i prawdopodobieństwo opadu śniegu. Pokazuje, na ile pewna jest prognoza.
 */
export async function getSnowEnsemble(resort: Resort): Promise<EnsembleDay[] | null> {
  "use cache";
  cacheLife("hours");
  if (resort.lat === undefined || resort.lng === undefined) return null;
  const params = new URLSearchParams({
    latitude: String(resort.lat),
    longitude: String(resort.lng),
    hourly: "snowfall",
    models: "ecmwf_ifs025",
    forecast_days: "15",
    timezone: TZ,
  });
  const elev = resort.stats.max_elevation_m;
  if (elev !== undefined) params.set("elevation", String(elev));
  {
    const res = await fetch(`${ENSEMBLE}?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo ensemble ${res.status}`);
    const j: any = await res.json();
    const members = Object.keys(j.hourly).filter((k) => k.startsWith("snowfall"));
    const byDay = new Map<string, number[]>();
    j.hourly.time.forEach((t: string, i: number) => {
      const day = t.slice(0, 10);
      const sums = byDay.get(day) ?? new Array(members.length).fill(0);
      members.forEach((m, k) => (sums[k] += j.hourly[m][i] ?? 0));
      byDay.set(day, sums);
    });
    return [...byDay].map(([date, sums]) => {
      const s = sums.slice().sort((a, b) => a - b);
      return {
        date,
        median: r1(quantile(s, 0.5)),
        p10: r1(quantile(s, 0.1)),
        p90: r1(quantile(s, 0.9)),
        chance: Math.round((sums.filter((x) => x >= 1).length / sums.length) * 100),
      };
    });
  }
}

export interface SnowOutlook {
  slug: string;
  temp: number;
  code: number;
  next7: number;
  next3: number;
  past72: number;
}

/** Jedno zapytanie dla wszystkich ośrodków: temperatura teraz i suma śniegu na 3 i 7 dni. */
export async function getSnowOutlook(resorts: Resort[]): Promise<SnowOutlook[] | null> {
  "use cache";
  cacheLife("hours");
  const list = resorts.filter((r) => r.lat !== undefined && r.lng !== undefined);
  const params = new URLSearchParams({
    latitude: list.map((r) => r.lat).join(","),
    longitude: list.map((r) => r.lng).join(","),
    elevation: list.map((r) => r.stats.max_elevation_m ?? "nan").join(","),
    current: "temperature_2m,weather_code",
    daily: "snowfall_sum",
    forecast_days: "7",
    past_days: "3",
    timezone: TZ,
  });
  {
    const res = await fetch(`${FORECAST}?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const j: any = await res.json();
    const arr: any[] = Array.isArray(j) ? j : [j];
    return arr.map((x, i) => {
      const snow: number[] = x.daily.snowfall_sum.map((v: number | null) => v ?? 0);
      const sum = (a: number[]) => r1(a.reduce((s, v) => s + v, 0));
      return {
        slug: list[i].slug,
        temp: r1(x.current.temperature_2m),
        code: x.current.weather_code ?? 0,
        past72: sum(snow.slice(0, 3)),
        next3: sum(snow.slice(3, 6)),
        next7: sum(snow.slice(3, 10)),
      };
    });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export { weatherLabel } from "./weather-codes";
