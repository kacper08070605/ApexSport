import data from "../../data/skis.json";
import { formatNumber } from "./labels";
import type { Ski } from "./types";

const skis = (data as Ski[])
  .slice()
  .sort(
    (a, b) =>
      a.brand.localeCompare(b.brand) ||
      familyOf(a).localeCompare(familyOf(b)) ||
      b.season.localeCompare(a.season),
  );

export function getSkis(): Ski[] {
  return skis;
}

export function getSki(slug: string): Ski | undefined {
  return skis.find((s) => s.slug === slug);
}

export const skiName = (ski: Ski) => `${ski.brand} ${ski.model}`;

export function familyOf(ski: Ski): string {
  return ski.family ?? skiName(ski);
}

/** Wszystkie roczniki tej samej linii modelu, od najnowszego. */
export function seasonsOf(ski: Ski): Ski[] {
  const f = familyOf(ski);
  return skis.filter((s) => familyOf(s) === f).sort((a, b) => b.season.localeCompare(a.season));
}

export interface Geometry {
  tip_mm: number;
  waist_mm: number;
  tail_mm: number;
  /** Długość, dla której producent podał taliowanie (jeśli podał). */
  length_cm?: number;
  radius_m?: number;
}

/**
 * Taliowanie do pokazania na liście i sylwetce. Producenci często podają je tylko dla jednej
 * długości albo bez długości, wtedy bierzemy środkową z pełnych długości lub geometry_mm.
 */
export function referenceGeometry(ski: Ski): Geometry | undefined {
  const full = ski.lengths.filter((l) => l.tip_mm && l.waist_mm && l.tail_mm);
  const l = full[Math.floor(full.length / 2)];
  if (l) {
    return {
      tip_mm: l.tip_mm!,
      waist_mm: l.waist_mm!,
      tail_mm: l.tail_mm!,
      length_cm: l.length_cm,
      radius_m: l.radius_m,
    };
  }
  if (ski.geometry_mm) {
    const withRadius = ski.lengths.filter((x) => x.radius_m);
    return { ...ski.geometry_mm, radius_m: withRadius[Math.floor(withRadius.length / 2)]?.radius_m };
  }
  return undefined;
}

export function waistWidth(ski: Ski): number | undefined {
  return referenceGeometry(ski)?.waist_mm ?? ski.lengths.find((l) => l.waist_mm)?.waist_mm;
}

/** Zakres promieni skrętu po wszystkich długościach. */
export function radiusRange(ski: Ski): [number, number] | undefined {
  const rs = ski.lengths.map((l) => l.radius_m).filter((r): r is number => r !== undefined);
  return rs.length ? [Math.min(...rs), Math.max(...rs)] : undefined;
}

export function lengthRange(ski: Ski): [number, number] {
  const ls = ski.lengths.map((l) => l.length_cm);
  return [Math.min(...ls), Math.max(...ls)];
}

export const formatRange = ([a, b]: [number, number], unit: string) =>
  a === b ? `${formatNumber(a)} ${unit}` : `${formatNumber(a)}–${formatNumber(b)} ${unit}`;

/** „118/68/104” z polskim przecinkiem dziesiętnym. */
export const formatDims = (
  g: { tip_mm: number; waist_mm: number; tail_mm: number },
  sep = "/",
) => [g.tip_mm, g.waist_mm, g.tail_mm].map(formatNumber).join(sep);

/** Krótki opis parametrów do kart: „68 mm · 11,3–13,1 m · 155–170 cm”. */
export function specLine(ski: Ski): string {
  const parts: string[] = [];
  const w = waistWidth(ski);
  if (w) parts.push(`${formatNumber(w)} mm`);
  const r = radiusRange(ski);
  if (r) parts.push(formatRange(r, "m"));
  parts.push(formatRange(lengthRange(ski), "cm"));
  return parts.join(" · ");
}
