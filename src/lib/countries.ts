import type { Country } from "./types";

export const COUNTRY_LABEL: Record<Country, string> = { PL: "Polska", CZ: "Czechy", SK: "Słowacja", AT: "Austria" };

/** „w Polsce”, „w Czechach”… do tytułów i opisów. */
export const COUNTRY_IN: Record<Country, string> = { PL: "w Polsce", CZ: "w Czechach", SK: "na Słowacji", AT: "w Austrii" };

export const COUNTRY_ORDER: Country[] = ["PL", "CZ", "SK", "AT"];
