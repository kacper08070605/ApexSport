import type { Gender, Level, SkiCategory } from "./types";

export const LEVELS: Level[] = ["beginner", "intermediate", "advanced", "expert"];

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "Początkujący",
  intermediate: "Średniozaawansowany",
  advanced: "Zaawansowany",
  expert: "Ekspert",
};

export const CATEGORIES: SkiCategory[] = [
  "slalom",
  "giant-slalom",
  "on-piste",
  "all-mountain",
  "freeride",
];

export const CATEGORY_LABEL: Record<SkiCategory, string> = {
  slalom: "Slalom (krótki skręt)",
  "giant-slalom": "Gigant (długi skręt)",
  "on-piste": "Trasa / rekreacja",
  "all-mountain": "All-mountain",
  freeride: "Freeride",
};

export const GENDER_LABEL: Record<Gender, string> = {
  unisex: "Unisex",
  women: "Damskie",
};

export const formatNumber = (n: number) => n.toLocaleString("pl-PL");

/** Polska odmiana liczebnika: 1 model, 2 modele, 5 modeli. */
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
}
