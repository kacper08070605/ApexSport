// Szczegóły ośrodków: lista tras i wyciągów z OpenSkiData + geometria do mapy z OpenStreetMap.
//
// Wejście: data/resorts.json (z osd_id), data/.cache/runs.csv i lifts.csv z
//   https://tiles.openskimap.org/csv/runs.csv i .../lifts.csv (pobieranie max raz na dobę).
// Wyjście: data/resort-details.json oraz public/maps/resorts/<slug>.json (GeoJSON do mapy).
//
// Użycie: node scripts/import-resort-details.mjs [--no-geometry]

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./lib/csv.mjs";

const root = path.resolve(import.meta.dirname, "..");
const OVERPASS = "https://overpass-api.de/api/interpreter";
const skipGeometry = process.argv.includes("--no-geometry");
const force = process.argv.includes("--force");

const { resorts } = JSON.parse(await readFile(path.join(root, "data/resorts.json"), "utf-8"));
const slugByOsd = new Map(resorts.filter((r) => r.osd_id).map((r) => [r.osd_id, r.slug]));

const num = (v) => (v === "" || v === undefined ? undefined : Number(v));
const yes = (v) => (v === "yes" ? true : v === "no" ? false : undefined);

/** "https://www.openstreetmap.org/way/123 https://..." → [{ type: "way", id: 123 }] */
function osmRefs(sources) {
  return [...sources.matchAll(/openstreetmap\.org\/(way|relation)\/(\d+)/g)].map((m) => ({ type: m[1], id: Number(m[2]) }));
}

function resortOf(row) {
  for (const id of row.ski_area_ids.split(/[;,\s]+/)) {
    const slug = slugByOsd.get(id);
    if (slug) return slug;
  }
}

async function loadCsv(name) {
  const text = await readFile(path.join(root, "data/.cache", name), "utf-8");
  const countries = ["Poland", "Czechia", "Slovakia", "Austria"];
  return parseCsv(text).filter((r) => countries.some((c) => r.countries.includes(c)));
}

const details = Object.fromEntries(resorts.map((r) => [r.slug, { runs: [], lifts: [] }]));

for (const r of await loadCsv("runs.csv")) {
  const slug = resortOf(r);
  if (!slug || !r.uses.includes("downhill")) continue;
  details[slug].runs.push({
    name: r.name || undefined,
    ref: r.ref || undefined,
    difficulty: r.difficulty || undefined,
    length_m: num(r.inclined_length_m),
    descent_m: num(r.descent_m),
    avg_pitch_pct: r["average_pitch_%"] ? Math.round(num(r["average_pitch_%"]) * 100) : undefined,
    max_pitch_pct: r["max_pitch_%"] ? Math.round(num(r["max_pitch_%"]) * 100) : undefined,
    top_m: num(r.max_elevation_m),
    bottom_m: num(r.min_elevation_m),
    lit: yes(r.lit),
    osm: osmRefs(r.sources),
  });
}

for (const l of await loadCsv("lifts.csv")) {
  const slug = resortOf(l);
  if (!slug || (l.status && l.status !== "operating")) continue;
  details[slug].lifts.push({
    name: l.name || undefined,
    ref: l.ref || undefined,
    type: l.lift_type || undefined,
    length_m: num(l.inclined_length_m),
    vertical_m: num(l.vertical_m),
    capacity_per_hour: num(l.capacity),
    seats: num(l.occupancy),
    duration_sec: num(l.duration_sec),
    detachable: yes(l.detachable),
    bubble: yes(l.bubble),
    heating: yes(l.heating),
    top_m: num(l.max_elevation_m),
    bottom_m: num(l.min_elevation_m),
    osm: osmRefs(l.sources),
  });
}

const DIFF_ORDER = { novice: 0, easy: 1, intermediate: 2, advanced: 3, expert: 4, freeride: 5 };
for (const d of Object.values(details)) {
  d.runs.sort(
    (a, b) => (DIFF_ORDER[a.difficulty] ?? 9) - (DIFF_ORDER[b.difficulty] ?? 9) || (b.length_m ?? 0) - (a.length_m ?? 0),
  );
  d.lifts.sort((a, b) => (b.length_m ?? 0) - (a.length_m ?? 0));
  d.km_by_difficulty = {};
  for (const r of d.runs.filter((x) => x.length_m)) {
    const k = r.difficulty ?? "unknown";
    d.km_by_difficulty[k] = Math.round(((d.km_by_difficulty[k] ?? 0) + (r.length_m ?? 0) / 1000) * 10) / 10;
  }
}

// --- geometria z Overpass ---
async function overpass(query) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ApexSport-demo/0.1" },
      body: "data=" + encodeURIComponent(query),
    });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
  }
  throw new Error("Overpass nie odpowiada");
}

function toLines(el) {
  if (el.type === "way") return el.geometry ? [el.geometry.map((p) => [p.lon, p.lat])] : [];
  return (el.members ?? []).filter((m) => m.geometry).map((m) => m.geometry.map((p) => [p.lon, p.lat]));
}

const round = (x) => Math.round(x * 1e5) / 1e5;

if (!skipGeometry) {
  await mkdir(path.join(root, "public/maps/resorts"), { recursive: true });
  for (const [slug, d] of Object.entries(details)) {
    const items = [
      ...d.runs.map((r, i) => ({ kind: "run", i, refs: r.osm })),
      ...d.lifts.map((l, i) => ({ kind: "lift", i, refs: l.osm })),
    ];
    const ways = [...new Set(items.flatMap((x) => x.refs.filter((r) => r.type === "way").map((r) => r.id)))];
    const rels = [...new Set(items.flatMap((x) => x.refs.filter((r) => r.type === "relation").map((r) => r.id)))];
    if (!ways.length && !rels.length) continue;

    // Geometria pobrana wcześniej: tylko odtwarzamy bbox (Overpass ma limity, nie pytamy bez potrzeby).
    const file = path.join(root, "public/maps/resorts", `${slug}.json`);
    if (existsSync(file) && !force) {
      const fc = JSON.parse(await readFile(file, "utf-8"));
      const pts = fc.features.flatMap((f) => (f.geometry.type === "LineString" ? f.geometry.coordinates : f.geometry.coordinates.flat()));
      if (pts.length) d.bbox = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
      continue;
    }

    const q = `[out:json][timeout:90];(${ways.length ? `way(id:${ways.join(",")});` : ""}${rels.length ? `rel(id:${rels.join(",")});` : ""});out geom;`;
    let json;
    try {
      json = await overpass(q);
    } catch (e) {
      console.warn(`${slug}: ${e.message}, pomijam geometrię (uruchom ponownie później)`);
      continue;
    }
    const byKey = new Map(json.elements.map((e) => [`${e.type}/${e.id}`, e]));

    const features = [];
    let minX = 180, minY = 90, maxX = -180, maxY = -90;
    for (const it of items) {
      const lines = it.refs.flatMap((r) => {
        const el = byKey.get(`${r.type}/${r.id}`);
        return el ? toLines(el) : [];
      });
      if (!lines.length) continue;
      const coords = lines.map((l) => l.map(([x, y]) => [round(x), round(y)]));
      for (const l of coords) for (const [x, y] of l) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
      const src = it.kind === "run" ? d.runs[it.i] : d.lifts[it.i];
      features.push({
        type: "Feature",
        id: `${it.kind}-${it.i}`,
        properties: {
          kind: it.kind,
          index: it.i,
          name: src.name ?? src.ref ?? null,
          difficulty: it.kind === "run" ? (src.difficulty ?? null) : null,
          lift_type: it.kind === "lift" ? (src.type ?? null) : null,
        },
        geometry: coords.length === 1 ? { type: "LineString", coordinates: coords[0] } : { type: "MultiLineString", coordinates: coords },
      });
    }
    d.bbox = features.length ? [minX, minY, maxX, maxY] : undefined;
    await writeFile(file, JSON.stringify({ type: "FeatureCollection", features }));
    console.log(`${slug}: ${d.runs.length} tras, ${d.lifts.length} wyciągów, ${features.length} obiektów na mapie`);
    await new Promise((r) => setTimeout(r, 1500)); // grzecznie wobec publicznego Overpass
  }
}

// osm służy tylko do pobrania geometrii; w danych strony zostawiamy pierwszy identyfikator
for (const d of Object.values(details)) {
  for (const x of [...d.runs, ...d.lifts]) x.osm = x.osm[0] ? `${x.osm[0].type}/${x.osm[0].id}` : undefined;
}

await writeFile(
  path.join(root, "data/resort-details.json"),
  JSON.stringify({ source: "OpenSkiData / OpenStreetMap (ODbL)", imported_at: new Date().toISOString().slice(0, 10), resorts: details }, null, 1) + "\n",
);
console.log("Zapisano data/resort-details.json");
