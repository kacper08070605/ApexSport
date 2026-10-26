// Importuje statystyki ośrodków z OpenSkiData (https://openskidata.org, licencja ODbL)
// dla listy ośrodków z data/resorts.curated.json i zapisuje wynik do data/resorts.json.
//
// Użycie:
//   node scripts/import-resorts.mjs              # pobiera aktualny CSV (max raz na dobę!)
//   node scripts/import-resorts.mjs plik.csv     # używa lokalnej kopii CSV

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./lib/csv.mjs";

const CSV_URL = "https://tiles.openskimap.org/csv/ski_areas.csv";
const root = path.resolve(import.meta.dirname, "..");

const num = (v) => (v === "" || v === undefined ? undefined : Number(v));

async function loadCsv() {
  const localPath = process.argv[2];
  if (localPath) return readFile(localPath, "utf-8");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Pobieranie CSV nie powiodło się: ${res.status}`);
  return res.text();
}

const curated = JSON.parse(
  await readFile(path.join(root, "data/resorts.curated.json"), "utf-8"),
);
// kraj ośrodka (pole "country" w curated) → nazwa kraju w CSV OpenSkiData
const COUNTRY_NAMES = { PL: "Poland", CZ: "Czechia", SK: "Slovakia", AT: "Austria" };
const wanted = new Set(curated.map((c) => COUNTRY_NAMES[c.country ?? "PL"]));
const areas = parseCsv(await loadCsv()).filter((a) => a.countries.split(";").some((x) => wanted.has(x)));

const resorts = [];
const missing = [];
for (const c of curated) {
  const names = [c.match.name, ...(c.match.names ?? [])].filter(Boolean);
  const candidates = areas.filter(
    (a) =>
      a.countries.split(";").includes(COUNTRY_NAMES[c.country ?? "PL"]) &&
      (c.match.source ? a.sources.includes(c.match.source) : c.match.id ? a.id === c.match.id : names.includes(a.name)),
  );
  // Przy kilku trafieniach bierzemy obszar z największą liczbą tras.
  candidates.sort(
    (a, b) => (num(b.downhill_distance_km) ?? 0) - (num(a.downhill_distance_km) ?? 0),
  );
  const a = candidates[0];
  if (!a) missing.push(c.slug);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { match, ...rest } = c;
  resorts.push({
    ...rest,
    website: c.website ?? a?.websites.split(" ")[0] ?? undefined,
    lat: num(a?.lat),
    lng: num(a?.lng),
    stats: {
      downhill_km: num(a?.downhill_distance_km),
      vertical_m: num(a?.vertical_m),
      min_elevation_m: num(a?.min_elevation_m),
      max_elevation_m: num(a?.max_elevation_m),
      lift_count: num(a?.lift_count),
      surface_lift_count: num(a?.surface_lifts_count),
    },
    osd_id: a?.id || undefined,
    openskimap_url: a?.openskimap || undefined,
    wikidata_id: a?.wikidata_id || undefined,
  });
}

const out = {
  source: "OpenSkiData (openskidata.org), dane © OpenStreetMap contributors, Skimap.org, Who's On First, Mapterhorn — ODbL",
  imported_at: new Date().toISOString().slice(0, 10),
  resorts,
};
await writeFile(path.join(root, "data/resorts.json"), JSON.stringify(out, null, 2) + "\n");

console.log(`Zapisano ${resorts.length} ośrodków do data/resorts.json`);
if (missing.length) console.warn(`Nie znaleziono w OpenSkiData: ${missing.join(", ")}`);
