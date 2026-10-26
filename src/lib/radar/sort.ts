/** Sortowanie znalezionych ogłoszeń (nieaktualne zawsze na końcu). */
export const MATCH_SORTS = {
  newest: { label: "Najnowsze", sql: "l.posted_at DESC, m.created_at DESC" },
  price_asc: { label: "Najtańsze", sql: "l.price ASC, l.posted_at DESC" },
  price_desc: { label: "Najdroższe", sql: "l.price DESC, l.posted_at DESC" },
} as const;

export type MatchSort = keyof typeof MATCH_SORTS;

export const parseSort = (v: unknown): MatchSort => (typeof v === "string" && v in MATCH_SORTS ? (v as MatchSort) : "newest");
