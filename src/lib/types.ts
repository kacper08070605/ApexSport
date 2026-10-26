export type Level = "beginner" | "intermediate" | "advanced" | "expert";

export type SkiCategory =
  | "slalom"
  | "giant-slalom"
  | "on-piste"
  | "all-mountain"
  | "freeride";

export type Gender = "unisex" | "women";

/** Parametry konkretnej długości narty — długość to część „SKU” (model + rocznik + długość). */
export interface SkiLength {
  length_cm: number;
  tip_mm?: number;
  waist_mm?: number;
  tail_mm?: number;
  radius_m?: number;
  weight_g?: number;
}

export interface Ski {
  slug: string;
  brand: string;
  model: string;
  /** Linia modelu wspólna dla wszystkich roczników, np. "Atomic Redster S9". */
  family?: string;
  season: string;
  image?: string | null;
  /** Domyślnie pionowe zdjęcie pary nart; poziome obracamy w kartach. */
  image_orientation?: "horizontal";
  /** Np. gdy pokazujemy zdjęcie innego rocznika tego samego modelu. */
  image_note?: string;
  image_source?: string;
  category: SkiCategory;
  levels: Level[];
  gender: Gender;
  system_binding?: boolean;
  rocker?: string;
  construction?: string;
  lengths: SkiLength[];
  description_pl: string;
  /** Rozbudowany opis redakcyjny w sekcjach (Charakter, Dla kogo, Na co uważać…). */
  review_pl?: { sections: { title: string; text: string }[] };
  /** Wiązanie w zestawie i jego zakres DIN. */
  binding?: string;
  din?: string;
  /** Czego dotyczy weight_g w długościach (sztuka/para, z wiązaniem czy bez). */
  weight_note?: string;
  /** Taliowanie podane przez producenta bez przypisania do konkretnej długości. */
  geometry_mm?: { tip_mm: number; waist_mm: number; tail_mm: number };
  source_url: string;
  note?: string;
  /** Dane niepotwierdzone bezpośrednio na stronie producenta. */
  needs_review?: boolean;
}

export interface ResortStats {
  downhill_km?: number;
  vertical_m?: number;
  min_elevation_m?: number;
  max_elevation_m?: number;
  lift_count?: number;
  surface_lift_count?: number;
}

export interface Skipass {
  season: string;
  day_adult_pln: number;
  source_url: string;
  checked_at: string;
}

export type Country = "PL" | "CZ" | "SK" | "AT";

export interface Resort {
  slug: string;
  name: string;
  country: Country;
  town: string;
  region: string;
  range: string;
  website?: string;
  lat?: number;
  lng?: number;
  stats: ResortStats;
  skipass?: Skipass;
  openskimap_url?: string;
  wikidata_id?: string;
}

export interface Shop {
  id: string;
  name: string;
  url: string;
  network?: string;
  commission_pct?: number;
  cookie_days?: number;
  delivery?: string;
}

export type Availability = "in_stock" | "low_stock" | "out_of_stock";

export interface Offer {
  id: string;
  shop: string;
  price: number;
  list_price: number;
  availability: Availability;
  lengths: number[];
  url: string;
  /** Kiedy ostatnio odczytaliśmy cenę ze strony sklepu (ISO). */
  checked_at?: string;
}

export interface PricePoint {
  d: string;
  min: number;
}

export interface ProductPrices {
  offers: Offer[];
  history: PricePoint[];
  min: number | null;
}
