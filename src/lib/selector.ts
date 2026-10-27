import { LEVELS } from "./labels";
import { skiTraits, type SkiTraits } from "./ski-traits";
import type { Ski } from "./types";

export type SkierLevel = "first" | "beginner" | "intermediate" | "advanced" | "expert";
export type Turn = "short" | "medium" | "long" | "mixed";
export type Speed = "calm" | "moderate" | "fast";
export type Snow = "hard" | "mixed" | "soft";
export type Where = "pl" | "alps" | "both";
export type BindingPref = "with" | "without" | "any";
export type Sex = "male" | "female";

export interface SelectorInput {
  heightCm: number;
  weightKg: number;
  sex: Sex;
  age: number;
  level: SkierLevel;
  days: "few" | "some" | "many";
  turn: Turn;
  speed: Speed;
  /** Udział jazdy w miękkim śniegu / poza trasą, 0–100. */
  offPiste: number;
  snow: Snow;
  where: Where;
  budget: number;
  binding: BindingPref;
  olderSeasons: boolean;
}

export const DEFAULT_INPUT: SelectorInput = {
  heightCm: 178,
  weightKg: 78,
  sex: "male",
  age: 35,
  level: "intermediate",
  days: "some",
  turn: "medium",
  speed: "moderate",
  offPiste: 10,
  snow: "mixed",
  where: "pl",
  budget: 4000,
  binding: "any",
  olderSeasons: true,
};

type TraitKey = "grip" | "stability" | "agility" | "ease" | "float";

export interface Profile {
  needs: Record<TraitKey, number>;
  waist: [number, number];
  radius: [number, number];
  baseLength: number;
  lengthSteps: { label: string; cm: number }[];
  slalomMax: number;
}

export interface Recommendation {
  ski: Ski;
  traits: SkiTraits;
  match: number;
  length: number;
  altLength?: number;
  lengthNote: string;
  pros: string[];
  cons: string[];
}

const SKIER_TO_SKI_LEVEL: Record<SkierLevel, number> = { first: 0, beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

/** Czego narciarz potrzebuje od narty: wartości docelowe cech i zakresy geometrii. */
export function buildProfile(input: SelectorInput): Profile {
  const lvl = SKIER_TO_SKI_LEVEL[input.level];
  const heavy = input.weightKg - (input.heightCm - 100);

  const grip =
    { hard: 8.5, mixed: 6.8, soft: 4.5 }[input.snow] + (input.where === "pl" ? 0.7 : 0) + (input.speed === "fast" ? 0.8 : 0) - input.offPiste / 40;
  const stability = { calm: 3, moderate: 5.5, fast: 8 }[input.speed] + lvl * 0.5 + (heavy > 10 ? 0.8 : 0);
  const agility = { short: 9, medium: 6.5, long: 3.5, mixed: 6.5 }[input.turn];
  const ease =
    { first: 9.5, beginner: 8.5, intermediate: 6.5, advanced: 4.2, expert: 2.5 }[input.level] +
    (input.days === "few" ? 0.8 : input.days === "many" ? -0.5 : 0) +
    (input.age >= 60 ? 0.8 : 0);
  const float = 1.5 + input.offPiste / 12 + (input.where === "alps" ? 0.8 : 0) + (input.snow === "soft" ? 1.5 : 0);

  const waistMid = 70 + input.offPiste * 0.28 + (input.where === "alps" ? 3 : 0) + (input.snow === "soft" ? 4 : input.snow === "hard" ? -2 : 0) - (input.turn === "short" ? 2 : 0);
  const radius: Record<Turn, [number, number]> = { short: [10.5, 13.5], medium: [13, 16.5], long: [16, 21], mixed: [12.5, 17] };

  // długość bazowa: wzrost minus odjęcie za poziom (tabele producentów i sklepów: od −20 cm dla
  // zaczynających do ~wzrostu dla ekspertów), potem korekty
  const steps: { label: string; cm: number }[] = [];
  const levelOffset = { first: -20, beginner: -16, intermediate: -12, advanced: -7, expert: -3 }[input.level];
  steps.push({ label: `wzrost ${input.heightCm} cm, poziom`, cm: input.heightCm + levelOffset });
  // waga: odchylenie od BMI 23 dla danego wzrostu; ±5 kg bez korekty, potem łagodnie, najwyżej ±4 cm
  const dev = input.weightKg - 23 * (input.heightCm / 100) ** 2;
  const over = Math.abs(dev) - 5;
  const w = over > 0 ? Math.sign(dev) * Math.min(4, Math.round(over * 0.3)) : 0;
  if (w !== 0) steps.push({ label: dev > 0 ? "waga powyżej typowej dla wzrostu" : "waga poniżej typowej dla wzrostu", cm: w });
  if (input.speed === "fast") steps.push({ label: "szybka jazda", cm: 3 });
  if (input.speed === "calm") steps.push({ label: "spokojna jazda", cm: -2 });
  if (input.turn === "short") steps.push({ label: "krótki skręt", cm: -3 });
  if (input.turn === "long") steps.push({ label: "długi skręt", cm: 3 });
  if (input.offPiste >= 50) steps.push({ label: "dużo jazdy poza trasą", cm: 3 });
  if (input.age >= 60) steps.push({ label: "wiek 60+", cm: -2 });
  // korekty się sumują, ale narta zjazdowa nie powinna wyjść krótsza niż wzrost −25 ani dłuższa niż wzrost +5
  const baseLength = Math.max(input.heightCm - 25, Math.min(input.heightCm + 5, steps.reduce((s, x) => s + x.cm, 0)));

  return {
    needs: {
      grip: clamp(grip),
      stability: clamp(stability),
      agility: clamp(agility),
      ease: clamp(ease),
      float: clamp(float),
    },
    waist: [Math.round(waistMid - 4), Math.round(waistMid + 4)],
    radius: radius[input.turn],
    baseLength: Math.round(baseLength),
    lengthSteps: steps,
    // slalomki: typowo 165–170 cm u mężczyzn i 150–165 cm u kobiet (Atomic Redster S)
    slalomMax: input.sex === "female" ? 163 : 170,
  };
}

const clamp = (x: number) => Math.max(1, Math.min(10, Math.round(x * 10) / 10));

/** Długość konkretnego modelu: bazowa + korekta za typ narty i profil (rocker „skraca” nartę). */
function lengthFor(ski: Ski, traits: SkiTraits, profile: Profile): { length: number; alt?: number; note: string } {
  let target = profile.baseLength;
  const notes: string[] = [];
  if (ski.category === "slalom") {
    target = Math.min(target - 6, profile.slalomMax);
    notes.push(target === profile.slalomMax ? `slalomka, najwyżej ${profile.slalomMax} cm` : "slalomka −6 cm");
  }
  if (ski.category === "giant-slalom") {
    target += 5;
    notes.push("gigant +5 cm");
  }
  // rocker skraca krawędź w kontakcie ze śniegiem; przy nartach trasowych z lekkim rockerem na dziobie
  // producenci nie zalecają dłuższej narty, więc korekta tylko dla szerszych nart i pełnego rockera
  if (traits.rocker === "full") {
    target += 3;
    notes.push("rocker z przodu i z tyłu +3 cm");
  } else if (traits.rocker === "tip" && traits.waist >= 90) {
    target += 2;
    notes.push("szeroka narta z rockerem na dziobie +2 cm");
  }
  const lengths = ski.lengths.map((l) => l.length_cm).sort((a, b) => a - b);
  const sorted = lengths.slice().sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
  const length = sorted[0];
  const alt = sorted.find((l) => l !== length && Math.abs(l - target) <= 6);
  const note = `cel ${Math.round(target)} cm${notes.length ? ` (${notes.join(", ")})` : ""}`;
  return { length, alt, note };
}

export interface SelectorResult {
  profile: Profile;
  recommendations: Recommendation[];
  overBudget: Recommendation[];
}

const TRAIT_PRO: Record<TraitKey, string> = {
  grip: "pewnie trzyma krawędź na twardym, ubitym śniegu",
  stability: "spokojna przy dużej prędkości",
  agility: "szybko i chętnie wchodzi w krótki skręt",
  ease: "łatwa w prowadzeniu, wybacza błędy",
  float: "dobrze radzi sobie w miękkim śniegu i poza trasą",
};

const TRAIT_CON: Record<TraitKey, string> = {
  grip: "na lodzie trzyma słabiej, niż potrzebujesz",
  stability: "przy wysokiej prędkości może być nerwowa",
  agility: "w krótkim skręcie będzie ociężała",
  ease: "wymaga techniki i siły, zmęczy przy słabszej formie",
  float: "w głębokim lub rozjeżdżonym śniegu będzie się zapadać",
};

export function recommend(
  skis: Ski[],
  input: SelectorInput,
  priceOf: (slug: string) => number | undefined,
  limit = 8,
): SelectorResult {
  const profile = buildProfile(input);
  const userLvl = SKIER_TO_SKI_LEVEL[input.level];

  // najnowszy rocznik w każdej linii
  const newest = new Map<string, string>();
  for (const s of skis) {
    const f = s.family ?? `${s.brand} ${s.model}`;
    if (!newest.has(f) || s.season > newest.get(f)!) newest.set(f, s.season);
  }

  const scored: Recommendation[] = [];
  for (const ski of skis) {
    const family = ski.family ?? `${ski.brand} ${ski.model}`;
    if (!input.olderSeasons && ski.season !== newest.get(family)) continue;
    if (input.sex === "male" && ski.gender === "women") continue;

    const levels = ski.levels.map((l) => LEVELS.indexOf(l));
    const gap = Math.min(...levels.map((l) => Math.abs(l - userLvl)));
    const tooHard = Math.min(...levels) - userLvl;
    if (tooHard >= 2) continue; // narta wyraźnie za trudna: odrzucamy bez dyskusji

    const traits = skiTraits(ski);
    let penalty = 0;
    if (gap === 1) penalty += tooHard === 1 ? 14 : 6;
    if (gap >= 2) penalty += 22;

    const weights: Record<TraitKey, number> = { grip: 2.2, stability: 2, agility: 1.8, ease: 3.2, float: 1.8 };
    const pros: string[] = [];
    const cons: string[] = [];
    for (const k of Object.keys(weights) as TraitKey[]) {
      const need = profile.needs[k];
      const have = traits[k];
      if (have < need) penalty += weights[k] * (need - have) * (k === "ease" ? 1.4 : 1);
      if (k !== "ease" && have > need + 3) penalty += 0.8 * (have - need - 3);
      if (have >= need && need >= 6)
        pros.push(k === "agility" && input.turn !== "short" ? "zwrotna, łatwo zmienia kierunek i promień skrętu" : TRAIT_PRO[k]);
      if (need - have >= 2) cons.push(TRAIT_CON[k]);
    }

    const [wMin, wMax] = profile.waist;
    if (traits.waist < wMin) penalty += (wMin - traits.waist) * 0.6;
    if (traits.waist > wMax) penalty += (traits.waist - wMax) * 0.6;
    const [rMin, rMax] = profile.radius;
    if (traits.radius < rMin) penalty += (rMin - traits.radius) * 1.5;
    if (traits.radius > rMax) penalty += (traits.radius - rMax) * 1.5;
    if (traits.radius >= rMin && traits.radius <= rMax) pros.push(`promień ${traits.radius.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m pasuje do Twojego skrętu`);

    if (input.sex === "female" && ski.gender === "women") {
      penalty -= 4;
      pros.push("model damski: lżejszy, z wiązaniem przesuniętym do przodu");
    }
    if (input.binding === "with" && ski.system_binding === false) penalty += 6;
    if (input.binding === "without" && ski.system_binding === true) penalty += 6;

    const { length, alt, note } = lengthFor(ski, traits, profile);
    const lenTarget = Number(note.match(/cel (\d+)/)?.[1] ?? length);
    if (Math.abs(length - lenTarget) > 6) {
      penalty += Math.abs(length - lenTarget) - 6;
      cons.push(`najbliższa dostępna długość ${length} cm odbiega od optymalnej (${lenTarget} cm)`);
    }

    scored.push({
      ski,
      traits,
      match: Math.max(1, Math.min(99, Math.round(100 - penalty * 1.6))),
      length,
      altLength: alt,
      lengthNote: note,
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 2),
    });
  }

  scored.sort((a, b) => b.match - a.match);

  // jedna pozycja na linię modelu: najlepiej dopasowany rocznik
  const seen = new Set<string>();
  const unique = scored.filter((r) => {
    const f = r.ski.family ?? r.ski.model;
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });

  const within = unique.filter((r) => (priceOf(r.ski.slug) ?? Infinity) <= input.budget);
  const over = unique.filter((r) => (priceOf(r.ski.slug) ?? Infinity) > input.budget);
  return { profile, recommendations: within.slice(0, limit), overBudget: over.slice(0, 3) };
}

/** Zapis profilu w adresie strony, żeby wynikiem dało się podzielić. */
export function inputToQuery(i: SelectorInput): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(i)) p.set(k, String(v));
  return p.toString();
}

export function inputFromQuery(q: URLSearchParams): SelectorInput | null {
  if (!q.get("heightCm")) return null;
  const n = (k: keyof SelectorInput) => Number(q.get(k) ?? DEFAULT_INPUT[k]);
  const s = <T extends string>(k: keyof SelectorInput, allowed: readonly T[]) => {
    const v = q.get(k) as T | null;
    return v && allowed.includes(v) ? v : (DEFAULT_INPUT[k] as T);
  };
  return {
    heightCm: Math.min(215, Math.max(110, n("heightCm"))),
    weightKg: Math.min(160, Math.max(25, n("weightKg"))),
    sex: s("sex", ["male", "female"] as const),
    age: Math.min(90, Math.max(8, n("age"))),
    level: s("level", ["first", "beginner", "intermediate", "advanced", "expert"] as const),
    days: s("days", ["few", "some", "many"] as const),
    turn: s("turn", ["short", "medium", "long", "mixed"] as const),
    speed: s("speed", ["calm", "moderate", "fast"] as const),
    offPiste: Math.min(100, Math.max(0, n("offPiste"))),
    snow: s("snow", ["hard", "mixed", "soft"] as const),
    where: s("where", ["pl", "alps", "both"] as const),
    budget: Math.max(500, n("budget")),
    binding: s("binding", ["with", "without", "any"] as const),
    olderSeasons: q.get("olderSeasons") !== "false",
  };
}
