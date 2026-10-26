"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap } from "maplibre-gl";
import { loadMaplibre, localizeLabels } from "@/lib/maplibre";
import { useEffect, useRef, useState } from "react";
import { DIFFICULTY, LIFT_TYPE, type LiftInfo, type RunInfo } from "@/lib/resort-details";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

type Selected = { kind: "run" | "lift"; index: number } | null;

const m = (x?: number) => (x === undefined ? "brak" : `${x.toLocaleString("pl-PL")} m`);

export function PisteExplorer({
  slug,
  runs,
  lifts,
  center,
  bbox,
}: {
  slug: string;
  runs: RunInfo[];
  lifts: LiftInfo[];
  center: [number, number];
  bbox?: [number, number, number, number];
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [selected, setSelected] = useState<Selected>(null);
  const [tab, setTab] = useState<"runs" | "lifts">("runs");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    let cancelled = false;
    let map: MlMap | undefined;

    loadMaplibre().then((ml) => {
      if (cancelled || !container.current) return;
      map = new ml.Map({
        container: container.current,
        style: STYLE_URL,
        center,
        zoom: 13,
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(new ml.NavigationControl({ showCompass: false }));
      map.addControl(new ml.FullscreenControl());
      if (bbox) map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40, duration: 0 });

      map.on("load", () => {
        const mp = map!;
        localizeLabels(mp);
        mp.addSource("ski", { type: "geojson", data: `/maps/resorts/${slug}.json`, promoteId: undefined });
        const diffColor = [
          "match",
          ["get", "difficulty"],
          ...Object.entries(DIFFICULTY).flatMap(([k, v]) => [k, v.color]),
          DIFFICULTY.unknown.color,
        ] as unknown as string;

        mp.addLayer({
          id: "runs-casing",
          type: "line",
          source: "ski",
          filter: ["==", ["get", "kind"], "run"],
          paint: { "line-color": "#ffffff", "line-width": 6, "line-opacity": 0.9 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        mp.addLayer({
          id: "runs",
          type: "line",
          source: "ski",
          filter: ["==", ["get", "kind"], "run"],
          paint: { "line-color": diffColor, "line-width": 3.5 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        mp.addLayer({
          id: "lifts",
          type: "line",
          source: "ski",
          filter: ["==", ["get", "kind"], "lift"],
          paint: { "line-color": "#14161a", "line-width": 2, "line-dasharray": [2, 1] },
        });
        mp.addLayer({
          id: "highlight",
          type: "line",
          source: "ski",
          filter: ["==", ["get", "index"], -1],
          paint: { "line-color": "#ff4d17", "line-width": 8, "line-opacity": 0.85 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        mp.addLayer({
          id: "labels",
          type: "symbol",
          source: "ski",
          filter: ["has", "name"],
          layout: {
            "symbol-placement": "line",
            "text-field": ["get", "name"],
            "text-size": 11,
            "text-font": ["Noto Sans Regular"],
          },
          paint: { "text-color": "#14161a", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
        });

        for (const layer of ["runs", "lifts"]) {
          mp.on("click", layer, (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const kind = f.properties.kind as "run" | "lift";
            setSelected({ kind, index: Number(f.properties.index) });
            setTab(kind === "run" ? "runs" : "lifts");
          });
          mp.on("mouseenter", layer, () => (mp.getCanvas().style.cursor = "pointer"));
          mp.on("mouseleave", layer, () => (mp.getCanvas().style.cursor = ""));
        }
        setLoaded(true);
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [slug, center, bbox]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    map.setFilter(
      "highlight",
      selected
        ? ["all", ["==", ["get", "kind"], selected.kind], ["==", ["get", "index"], selected.index]]
        : ["==", ["get", "index"], -1],
    );
  }, [selected, loaded]);

  const select = (kind: "run" | "lift", index: number) =>
    setSelected((s) => (s?.kind === kind && s.index === index ? null : { kind, index }));

  // Pozycje bez długości to zwykle obszary (poligony) dublujące linię trasy; nie pokazujemy ich na liście.
  const runRows = runs.map((r, i) => ({ r, i })).filter(({ r }) => r.length_m);
  const liftRows = lifts.map((l, i) => ({ l, i }));

  const legend = Object.entries(DIFFICULTY).filter(([k]) => runs.some((r) => (r.difficulty ?? "unknown") === k));

  return (
    <div data-section="piste-map" className="grid gap-0 panel lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="relative">
        <div ref={container} className="h-[440px] w-full bg-muted lg:h-[560px]" />
        <ul className="pointer-events-none absolute bottom-8 left-2 flex flex-wrap gap-x-3 gap-y-1 bg-card/90 px-2 py-1.5 text-xs shadow">
          {legend.map(([k, v]) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="h-1 w-4" style={{ background: v.color }} />
              {v.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-foreground" />
            Wyciąg
          </li>
        </ul>
      </div>

      <div className="flex min-h-0 flex-col border-t border-border lg:max-h-[560px] lg:border-t-0 lg:border-l">
        <div className="flex border-b border-border text-sm" role="tablist">
          {(
            [
              ["runs", `Trasy (${runRows.length})`],
              ["lifts", `Wyciągi (${liftRows.length})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`flex-1 px-4 py-3 font-semibold ${tab === k ? "border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto text-sm">
          {tab === "runs" &&
            runRows.map(({ r, i }) => {
              const d = DIFFICULTY[r.difficulty ?? "unknown"] ?? DIFFICULTY.unknown;
              const active = selected?.kind === "run" && selected.index === i;
              return (
                <li key={i}>
                  <button
                    onClick={() => select("run", i)}
                    className={`grid w-full grid-cols-[10px_1fr_auto] items-center gap-3 border-b border-border px-4 py-2.5 text-left ${active ? "bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.name ?? (r.ref ? `Trasa ${r.ref}` : "Trasa bez nazwy")}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.label}
                        {r.avg_pitch_pct !== undefined && ` · śr. nachylenie ${r.avg_pitch_pct}%`}
                        {r.max_pitch_pct !== undefined && `, max ${r.max_pitch_pct}%`}
                        {r.lit && " · oświetlona"}
                      </span>
                    </span>
                    <span className="text-right text-xs">
                      <span className="block font-semibold">{m(r.length_m)}</span>
                      {r.descent_m !== undefined && <span className="text-muted-foreground">↓ {r.descent_m} m</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          {tab === "lifts" &&
            liftRows.map(({ l, i }) => {
              const active = selected?.kind === "lift" && selected.index === i;
              return (
                <li key={i}>
                  <button
                    onClick={() => select("lift", i)}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-4 py-2.5 text-left ${active ? "bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{l.name ?? (l.ref ? `Wyciąg ${l.ref}` : "Wyciąg bez nazwy")}</span>
                      <span className="text-xs text-muted-foreground">
                        {LIFT_TYPE[l.type ?? ""] ?? l.type ?? "wyciąg"}
                        {l.seats && ` · ${l.seats}-osobowa`}
                        {l.detachable && " · wyprzęgana"}
                        {l.bubble && " · osłony"}
                        {l.heating && " · podgrzewane siedzenia"}
                        {l.capacity_per_hour && ` · ${l.capacity_per_hour.toLocaleString("pl-PL")} os./h`}
                      </span>
                    </span>
                    <span className="text-right text-xs">
                      <span className="block font-semibold">{m(l.length_m)}</span>
                      {l.vertical_m !== undefined && <span className="text-muted-foreground">↑ {l.vertical_m} m</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          {tab === "runs" && runRows.length === 0 && <li className="p-4 text-muted-foreground">Brak tras w danych OpenStreetMap.</li>}
          {tab === "lifts" && lifts.length === 0 && <li className="p-4 text-muted-foreground">Brak wyciągów w danych OpenStreetMap.</li>}
        </ul>
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Kliknij trasę lub wyciąg, żeby zaznaczyć go na mapie. Dane: OpenStreetMap / OpenSkiData.
        </p>
      </div>
    </div>
  );
}
