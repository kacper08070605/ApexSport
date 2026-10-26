import climateData from "../../data/resort-climate.json";
import detailsData from "../../data/resort-details.json";
import infoData from "../../data/resort-info.json";
import pricelistsData from "../../data/resort-pricelists.json";
import type { Resort } from "./types";
import type { Currency } from "./money";

export interface RunInfo {
  name?: string;
  ref?: string;
  difficulty?: string;
  length_m?: number;
  descent_m?: number;
  avg_pitch_pct?: number;
  max_pitch_pct?: number;
  top_m?: number;
  bottom_m?: number;
  lit?: boolean;
  osm?: string;
}

export interface LiftInfo {
  name?: string;
  ref?: string;
  type?: string;
  length_m?: number;
  vertical_m?: number;
  capacity_per_hour?: number;
  seats?: number;
  duration_sec?: number;
  detachable?: boolean;
  bubble?: boolean;
  heating?: boolean;
  top_m?: number;
  bottom_m?: number;
  osm?: string;
}

export interface ResortDetails {
  runs: RunInfo[];
  lifts: LiftInfo[];
  km_by_difficulty: Record<string, number>;
  bbox?: [number, number, number, number];
}

export interface ResortInfo {
  slug: string;
  summary?: string;
  sections?: { title: string; text: string }[];
  facts?: {
    address?: string;
    night_skiing?: boolean;
    night_skiing_hours?: string;
    opening_hours?: string;
    snowmaking?: string;
    snowpark?: boolean;
    ski_school?: boolean;
    rental?: boolean;
    parking?: string;
    longest_run?: string;
    season?: string;
    website?: string;
    /** karnet 1-dniowy dla dorosłego, w walucie skipass_currency */
    skipass_day_adult?: number;
    skipass_currency?: Currency;
    skipass_season?: string;
    skipass_source_url?: string;
    skipass_note?: string;
  };
  sources?: string[];
}

export interface ResortClimate {
  elevation_m?: number;
  months: { month: number; snowfall_cm: number; snow_days: number; temp_c: number }[];
  seasons: { season: string; snowfall_cm: number }[];
}

const details = detailsData.resorts as unknown as Record<string, ResortDetails>;
const climate = climateData.resorts as unknown as Record<string, ResortClimate>;
const info = Object.fromEntries((infoData as ResortInfo[]).map((i) => [i.slug, i]));

export const DETAILS_IMPORTED_AT = detailsData.imported_at;
export const CLIMATE_SEASONS = climateData.seasons;

export const getResortDetails = (slug: string): ResortDetails | undefined => details[slug];
export const getResortClimate = (slug: string): ResortClimate | undefined => climate[slug];
export const getResortInfo = (slug: string): ResortInfo | undefined => info[slug];

/** Kolejność i nazwy trudności tras (konwencja europejska). */
export const DIFFICULTY: Record<string, { label: string; color: string; order: number }> = {
  novice: { label: "Bardzo łatwa", color: "#2f9e44", order: 0 },
  easy: { label: "Łatwa", color: "#1c7ed6", order: 1 },
  intermediate: { label: "Średnia", color: "#e03131", order: 2 },
  advanced: { label: "Trudna", color: "#111111", order: 3 },
  expert: { label: "Bardzo trudna", color: "#111111", order: 4 },
  freeride: { label: "Freeride", color: "#f08c00", order: 5 },
  unknown: { label: "Bez oznaczenia", color: "#868e96", order: 6 },
};

export const LIFT_TYPE: Record<string, string> = {
  gondola: "Gondola",
  cable_car: "Kolej linowa",
  chair_lift: "Kolej krzesełkowa",
  mixed_lift: "Kolej mieszana",
  drag_lift: "Wyciąg orczykowy",
  "t-bar": "Orczyk (T-bar)",
  "j-bar": "Wyciąg (J-bar)",
  platter: "Wyciąg talerzykowy",
  rope_tow: "Wyciąg linowy",
  magic_carpet: "Taśma",
  funicular: "Kolej szynowa",
};

/** Odległość w km (wzór haversine). */
export function distanceKm(a: Resort, b: Resort): number {
  if (a.lat === undefined || b.lat === undefined || a.lng === undefined || b.lng === undefined) return Infinity;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const MONTH_LABEL: Record<number, string> = {
  11: "Lis",
  12: "Gru",
  1: "Sty",
  2: "Lut",
  3: "Mar",
  4: "Kwi",
};

export interface PriceList {
  season: string;
  source_url?: string;
  checked_at?: string;
  currency?: Currency;
  categories: { id: string; label: string; note?: string }[];
  tables: { title: string; period?: string; rows: { label: string; prices: Record<string, number | undefined> }[] }[];
  notes?: string[];
  unavailable?: boolean;
}

const priceLists = pricelistsData as unknown as Record<string, PriceList>;

export const getPriceList = (slug: string): PriceList | undefined => {
  const p = priceLists[slug];
  return p && !p.unavailable && p.tables?.length ? p : undefined;
};

export const getPriceListNote = (slug: string): string[] | undefined => priceLists[slug]?.notes;
