// Klimatologia ośrodków: średnie opady śniegu i temperatury z 10 ostatnich sezonów.
// Źródło: Open-Meteo Historical Weather API (reanaliza ERA5), CC BY 4.0.
// Wyjście: data/resort-climate.json
//
// Użycie: node scripts/import-climate.mjs

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const FIRST_SEASON = 2016; // sezon 2016/17
const LAST_SEASON = 2025; // sezon 2025/26
const MONTHS = [11, 12, 1, 2, 3, 4];

const { resorts } = JSON.parse(await readFile(path.join(root, "data/resorts.json"), "utf-8"));
const OUT_PATH = path.join(root, "data/resort-climate.json");
// Wyniki z poprzedniego uruchomienia zostają; dociągamy tylko brakujące ośrodki.
const out = existsSync(OUT_PATH) ? JSON.parse(await readFile(OUT_PATH, "utf-8")).resorts : {};
const force = process.argv.includes("--force");

for (const r of resorts) {
  if (r.lat === undefined || (out[r.slug] && !force)) continue;
  const s = r.stats;
  const elevation =
    s.min_elevation_m !== undefined && s.max_elevation_m !== undefined
      ? Math.round((s.min_elevation_m + s.max_elevation_m) / 2)
      : undefined;

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.search = new URLSearchParams({
    latitude: r.lat,
    longitude: r.lng,
    start_date: `${FIRST_SEASON}-11-01`,
    end_date: `${LAST_SEASON + 1}-04-30`,
    daily: "snowfall_sum,temperature_2m_mean",
    timezone: "Europe/Warsaw",
    ...(elevation ? { elevation: String(elevation) } : {}),
  }).toString();

  let res = await fetch(url);
  // limit minutowy darmowego API: odczekaj i spróbuj ponownie
  for (let attempt = 0; res.status === 429 && attempt < 3; attempt++) {
    console.log(`${r.slug}: limit API, czekam minutę…`);
    await new Promise((resolve) => setTimeout(resolve, 65_000));
    res = await fetch(url);
  }
  if (!res.ok) {
    console.warn(`${r.slug}: ${res.status} ${await res.text()}`);
    continue;
  }
  const { daily } = await res.json();

  const months = Object.fromEntries(MONTHS.map((m) => [m, { snow: 0, snowDays: 0, temp: 0, days: 0 }]));
  const seasons = {};
  daily.time.forEach((day, i) => {
    const [y, m] = day.split("-").map(Number);
    if (!MONTHS.includes(m)) return;
    const snow = daily.snowfall_sum[i] ?? 0;
    const temp = daily.temperature_2m_mean[i];
    const season = m >= 11 ? y : y - 1;
    months[m].snow += snow;
    months[m].snowDays += snow >= 1 ? 1 : 0;
    if (temp !== null) {
      months[m].temp += temp;
      months[m].days++;
    }
    seasons[season] = (seasons[season] ?? 0) + snow;
  });

  const n = LAST_SEASON - FIRST_SEASON + 1;
  out[r.slug] = {
    elevation_m: elevation,
    months: MONTHS.map((m) => ({
      month: m,
      snowfall_cm: Math.round(months[m].snow / n),
      snow_days: Math.round((months[m].snowDays / n) * 10) / 10,
      temp_c: Math.round((months[m].temp / Math.max(1, months[m].days)) * 10) / 10,
    })),
    seasons: Object.entries(seasons).map(([y, cm]) => ({ season: `${y}/${String(Number(y) + 1).slice(2)}`, snowfall_cm: Math.round(cm) })),
  };
  console.log(`${r.slug}: ${out[r.slug].seasons.map((x) => x.snowfall_cm).join(", ")} cm`);
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

await writeFile(
  OUT_PATH,
  JSON.stringify(
    { source: "Open-Meteo Historical Weather API (ERA5), CC BY 4.0", seasons: `${FIRST_SEASON}/${FIRST_SEASON + 1}–${LAST_SEASON}/${LAST_SEASON + 1}`, resorts: out },
    null,
    1,
  ) + "\n",
);
console.log("Zapisano data/resort-climate.json");
