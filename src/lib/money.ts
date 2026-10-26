import fx from "../../data/fx.json";

export type Currency = "PLN" | "EUR" | "CZK";

export const FX_DATE = fx.date;
export const FX_SOURCE = fx.source;

/** Kwota w walucie cennika: „185 zł”, „72,50 €”, „1 290 Kč”. */
export function formatMoney(n: number, currency: Currency = "PLN"): string {
  const s = n.toLocaleString("pl-PL", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  return currency === "EUR" ? `${s} €` : currency === "CZK" ? `${s} Kč` : `${s} zł`;
}

/** Przeliczenie na złotówki po średnim kursie NBP (orientacyjnie, do porównań). */
export const toPln = (n: number, currency: Currency = "PLN") => n * (fx.rates[currency] ?? 1);
