import data from "../../data/photos.json";

export interface Photo {
  file: string;
  kind: "resort" | "general" | "hero";
  slug?: string;
  title: string;
  author: string;
  license: string;
  license_url?: string;
  source_url: string;
  width?: number;
  height?: number;
  note?: string;
}

const photos = data as Photo[];

export const resortPhoto = (slug: string): Photo | undefined => photos.find((p) => p.kind === "resort" && p.slug === slug);

/** Zdjęcia ogólne w stałej kolejności; `i` wybiera kolejne, z zawijaniem. */
export function generalPhoto(i: number): Photo | undefined {
  const list = photos.filter((p) => p.kind === "general");
  return list.length ? list[i % list.length] : undefined;
}

export const heroPhoto = (): Photo | undefined => photos.find((p) => p.kind === "hero");

export const photoCredit = (p: Photo) => `Fot. ${p.author}, ${p.license}`;
