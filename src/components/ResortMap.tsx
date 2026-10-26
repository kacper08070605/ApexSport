"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { loadMaplibre, localizeLabels } from "@/lib/maplibre";
import { useEffect, useRef } from "react";

export interface MapPoint {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  subtitle?: string;
}

// Darmowe kafelki OpenFreeMap (bez klucza API), dane mapy © OpenStreetMap.
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export function ResortMap({
  points,
  zoom,
  className = "h-[420px]",
}: {
  points: MapPoint[];
  zoom?: number;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || points.length === 0) return;
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    loadMaplibre().then((maplibregl) => {
      if (cancelled || !container.current) return;
      const m = new maplibregl.Map({
        container: container.current,
        style: STYLE_URL,
        center: [points[0].lng, points[0].lat],
        zoom: zoom ?? 6,
        cooperativeGestures: true,
      });
      map = m;
      m.on("load", () => localizeLabels(m));
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }));

      for (const p of points) {
        const popup = new maplibregl.Popup({ offset: 16 }).setDOMContent(popupContent(p));
        new maplibregl.Marker({ color: "#ff4d17" }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(m);
      }

      if (points.length > 1 && zoom === undefined) {
        const bounds = new maplibregl.LngLatBounds();
        points.forEach((p) => bounds.extend([p.lng, p.lat]));
        m.fitBounds(bounds, { padding: 40, duration: 0 });
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, zoom]);

  return (
    <div
      ref={container}
      className={`w-full overflow-hidden border border-border bg-muted ${className}`}
    />
  );
}

function popupContent(p: MapPoint) {
  const el = document.createElement("div");
  const link = document.createElement("a");
  link.href = `/narciarstwo/osrodki/${p.slug}`;
  link.textContent = p.name;
  link.style.fontWeight = "600";
  link.style.color = "#ff4d17";
  el.appendChild(link);
  if (p.subtitle) {
    const sub = document.createElement("div");
    sub.textContent = p.subtitle;
    sub.style.color = "#5b6b80";
    el.appendChild(sub);
  }
  return el;
}
