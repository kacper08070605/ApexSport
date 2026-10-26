// Wspólne funkcje skryptów cenowych (generowanie danych demo i dzienna aktualizacja).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "../..");
export const OFFERS_PATH = path.join(root, "data/offers.json");

export const readJson = async (rel) => JSON.parse(await readFile(path.join(root, rel), "utf-8"));
export const writeJson = (abs, data) => writeFile(abs, JSON.stringify(data, null, 1) + "\n");

/** Deterministyczny generator liczb losowych (mulberry32) zasiany tekstem. */
export function rng(seedText) {
  let h = 1779033703;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ceny sklepowe kończą się na 9 albo 99 zł. */
export const shopRound = (n) => (n > 1000 ? Math.round(n / 10) * 10 - 1 : Math.round(n) - 1);

export const isoDay = (d) => d.toISOString().slice(0, 10);

export const minPrice = (offers) =>
  Math.min(...offers.filter((o) => o.availability !== "out_of_stock").map((o) => o.price));
