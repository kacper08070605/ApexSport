import { LEVELS } from "./labels";
import { radiusRange, referenceGeometry, waistWidth } from "./skis";
import type { Ski } from "./types";

/**
 * Cechy jezdne wyliczane ze specyfikacji producenta (skala 1–10). To model redakcyjny,
 * nie pomiar: im więcej tytanalu i węższa talia, tym lepszy chwyt na twardym; im szerzej
 * i więcej rockera, tym lepiej w miękkim śniegu i łatwiej w muldach.
 */
export interface SkiTraits {
  waist: number;
  radius: number;
  titanal: 0 | 1 | 2;
  rocker: "camber" | "tip" | "full";
  /** Chwyt krawędzi na twardym i oblodzonym śniegu. */
  grip: number;
  /** Stabilność przy dużej prędkości. */
  stability: number;
  /** Zwrotność w krótkim skręcie. */
  agility: number;
  /** Jak łatwo prowadzić nartę i jak wybacza błędy. */
  ease: number;
  /** Wyporność w miękkim śniegu i poza trasą. */
  float: number;
}

const clamp = (x: number) => Math.max(1, Math.min(10, Math.round(x * 10) / 10));

function titanalLayers(ski: Ski): 0 | 1 | 2 {
  const c = `${ski.construction ?? ""} ${ski.model}`.toLowerCase();
  if (/(2\s*x|dual|double|dwie|2 warstw|2 pełne|ti 0\.8\/0\.5|2 layers)/.test(c) && /(ti|tytan|titan)/.test(c)) return 2;
  if (/(titanal|tytanal|\bti\b|mono ti|power ti|ti powered|ti stabilizer|shaped ti|\bti\s)/.test(c)) return 1;
  return 0;
}

function rockerType(ski: Ski): SkiTraits["rocker"] {
  const r = (ski.rocker ?? "").toLowerCase();
  if (/(tail|rocker\/camber\/rocker|all mountain rocker|all trail|early rise tip & tail|tip & tail|rocker tył|rocker przód.*tył)/.test(r)) return "full";
  if (/(tip rocker|rocker|early rise)/.test(r)) return "tip";
  return "camber";
}

export function skiTraits(ski: Ski): SkiTraits {
  const waist = waistWidth(ski) ?? referenceGeometry(ski)?.waist_mm ?? 80;
  const rr = radiusRange(ski);
  const radius = rr ? (rr[0] + rr[1]) / 2 : ski.category === "slalom" ? 12.5 : ski.category === "giant-slalom" ? 17 : 15;
  const ti = titanalLayers(ski);
  const rocker = rockerType(ski);
  const lvl = Math.max(...ski.levels.map((l) => LEVELS.indexOf(l)));
  const minLvl = Math.min(...ski.levels.map((l) => LEVELS.indexOf(l)));
  const race = ski.category === "slalom" || ski.category === "giant-slalom";

  const grip = clamp(10 - (waist - 66) / 4.5 + ti * 1.2 - (rocker === "full" ? 1.5 : rocker === "tip" ? 0.5 : 0) + (race ? 0.8 : 0) - 1.5);
  const stability = clamp(3 + ti * 1.8 + (radius - 12) * 0.35 + lvl * 0.6 - (rocker === "full" ? 0.5 : 0));
  const agility = clamp(10.5 - (radius - 11) * 0.6 - (waist - 66) / 10 - ti * 0.3);
  const ease = clamp(9.5 - ti * 1.6 - minLvl * 1.2 + (rocker !== "camber" ? 0.8 : 0) - (race ? 1 : 0));
  const float = clamp(1 + (waist - 66) / 3.5 + (rocker === "full" ? 1.5 : rocker === "tip" ? 0.5 : 0));

  return { waist, radius, titanal: ti, rocker, grip, stability, agility, ease, float };
}

export const TRAIT_LABEL: Record<"grip" | "stability" | "agility" | "ease" | "float", string> = {
  grip: "Chwyt na twardym",
  stability: "Stabilność przy prędkości",
  agility: "Zwrotność",
  ease: "Łatwość prowadzenia",
  float: "Miękki śnieg i poza trasą",
};
