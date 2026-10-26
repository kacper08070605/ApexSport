export type SourceId = "olx" | "allegro" | "vinted";

/** available: czy bot pobiera już prawdziwe ogłoszenia z tego serwisu. */
export const SOURCES: Record<SourceId, { label: string; color: string; available: boolean; note?: string; searchUrl: (q: string) => string }> = {
  olx: {
    label: "OLX",
    color: "#23e5db",
    available: true,
    note: "próbka ogłoszeń do pokazu",
    searchUrl: (q) => `https://www.olx.pl/sport-hobby/q-${encodeURIComponent(q.toLowerCase().replace(/\s+/g, "-"))}/`,
  },
  allegro: {
    label: "Allegro",
    color: "#ff5a00",
    available: false,
    note: "po podłączeniu API Allegro",
    searchUrl: (q) => `https://allegro.pl/listing?string=${encodeURIComponent(q)}`,
  },
  vinted: {
    label: "Vinted",
    color: "#09b1ba",
    available: true,
    searchUrl: (q) => `https://www.vinted.pl/catalog?search_text=${encodeURIComponent(q)}`,
  },
};

export const SOURCE_IDS = Object.keys(SOURCES) as SourceId[];

export type Category = "skis" | "boots";

/** query: słowa dodawane do zapytania w serwisie, żeby trafić we właściwą kategorię. */
export const CATEGORIES: Record<Category, { label: string; query: string }> = {
  skis: { label: "Narty zjazdowe", query: "narty" },
  boots: { label: "Buty narciarskie", query: "buty narciarskie" },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as Category[];

/** Dla kogo są buty: wybiera kategorię w serwisie (np. Vinted: Mężczyźni → Obuwie → Obuwie sportowe → Buty narciarskie). */
export type Gender = "all" | "men" | "women" | "kids";

export const GENDERS: Record<Gender, string> = { men: "Męskie", women: "Damskie", kids: "Dziecięce", all: "Wszystkie" };

export const GENDER_IDS = Object.keys(GENDERS) as Gender[];

export type Condition = "new" | "like_new" | "used" | "worn";

export const CONDITIONS: Record<Condition, string> = {
  new: "Nowe",
  like_new: "Jak nowe",
  used: "Używane",
  worn: "Mocno używane",
};

export const CONDITION_IDS = Object.keys(CONDITIONS) as Condition[];
