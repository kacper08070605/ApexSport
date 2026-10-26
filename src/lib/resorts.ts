import data from "../../data/resorts.json";
import type { Resort } from "./types";

const resorts = (data.resorts as Resort[])
  .slice()
  .sort((a, b) => (b.stats.downhill_km ?? 0) - (a.stats.downhill_km ?? 0));

export const RESORT_DATA_SOURCE = data.source;
export const RESORT_DATA_IMPORTED_AT = data.imported_at;

export function getResorts(): Resort[] {
  return resorts;
}

export function getResort(slug: string): Resort | undefined {
  return resorts.find((r) => r.slug === slug);
}
