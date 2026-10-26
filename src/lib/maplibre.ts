/** Ładuje MapLibre i wskazuje worker skopiowany do public/ (scripts/copy-maplibre-worker.mjs). */
export async function loadMaplibre() {
  const ml = await import("maplibre-gl");
  ml.setWorkerUrl(new URL("/vendor/maplibre-gl-worker.mjs", window.location.origin).href);
  return ml;
}

/** Nazwy na podkładzie po polsku (OpenMapTiles ma pole name:pl), z angielską/lokalną jako zapasową. */
export function localizeLabels(map: import("maplibre-gl").Map) {
  for (const layer of map.getStyle().layers) {
    if (layer.type !== "symbol" || !layer.layout?.["text-field"] || layer.source === "ski") continue;
    map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:pl"], ["get", "name"]]);
  }
}
