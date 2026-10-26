// Ujednolica zdjęcia nart: narty zawsze w pionie, bez tła, w tym samym kadrze.
//
// Dla każdego zdjęcia z data/skis.json:
//  1. wykrywa tło (przezroczystość albo kolor z narożników),
//  2. usuwa tło połączone z krawędzią obrazu (flood fill), więc białe elementy nart zostają,
//  3. liczy główną oś nart (PCA pikseli pierwszego planu) i obraca je do pionu,
//  4. przycina puste marginesy i centruje na płótnie 600x1600 z przezroczystym tłem.
// Wynik: public/images/skis-v/<slug>.webp, ścieżki w data/skis.json są aktualizowane.
//
// Użycie: node scripts/normalize-ski-images.mjs

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(root, "public/images/skis-v");
const CANVAS = { w: 600, h: 1600 };
const BOX = { w: 540, h: 1500 };
const TOLERANCE = 26;

// Wyjątki dla zdjęć, których nie da się poprawnie przetworzyć automatycznie.
const OVERRIDES = {
  // tło z gradientem (jasny środek, ciemniejsze brzegi): usuwamy każdy jasny, szary piksel połączony z brzegiem
  "rossignol-super-arcade-84-2026-27": { rotate: 0, greyBackground: true },
  // rendery 3D Elana: para w perspektywie, kąt dobrany ręcznie
  "elan-ace-sc5-shift-x-2026-27": { rotate: 66, alphaCut: 235 },
  "elan-ace-slx-fusion-x-2026-27": { rotate: 66, alphaCut: 235 },
  "rossignol-hero-elite-st-ti-2026-27": { greyBackground: true },
};

const skisPath = path.join(root, "data/skis.json");
const skis = JSON.parse(await readFile(skisPath, "utf-8"));
await mkdir(OUT_DIR, { recursive: true });

/** Surowe piksele RGBA po wstępnym zmniejszeniu (dłuższy bok max 1800 px). */
async function load(file) {
  const { data, info } = await sharp(file)
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Kolor tła z narożników; null, gdy tło jest przezroczyste. */
function backgroundOf({ data, w, h }) {
  const pts = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
  ];
  const px = pts.map(([x, y]) => data.subarray((y * w + x) * 4, (y * w + x) * 4 + 4));
  if (px.filter((p) => p[3] < 40).length >= 3) return null;
  const avg = [0, 1, 2].map((c) => Math.round(px.reduce((s, p) => s + p[c], 0) / px.length));
  return avg;
}

/** Zeruje przezroczystość pikseli tła połączonych z krawędzią (BFS). */
function removeBackground(img, bg, tolerance = TOLERANCE, greyBackground = false) {
  const { data, w, h } = img;
  const greyish = (i) => {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) < 14 && r + g + b > 3 * 120;
  };
  const close = (i) =>
    data[i * 4 + 3] < 40 ||
    (greyBackground && greyish(i)) ||
    (bg && Math.abs(data[i * 4] - bg[0]) + Math.abs(data[i * 4 + 1] - bg[1]) + Math.abs(data[i * 4 + 2] - bg[2]) < tolerance * 3);
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const push = (i) => {
    if (!seen[i] && close(i)) {
      seen[i] = 1;
      queue[tail++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    data[i * 4 + 3] = 0;
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
}

/** Kąt głównej osi pierwszego planu w stopniach (0 = poziomo, 90 = pionowo), z PCA. */
function principalAngle({ data, w, h }) {
  let n = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2)
      if (data[(y * w + x) * 4 + 3] > 128) {
        n++;
        sx += x;
        sy += y;
      }
  const mx = sx / n;
  const my = sy / n;
  let cxx = 0;
  let cyy = 0;
  let cxy = 0;
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2)
      if (data[(y * w + x) * 4 + 3] > 128) {
        const dx = x - mx;
        const dy = y - my;
        cxx += dx * dx;
        cyy += dy * dy;
        cxy += dx * dy;
      }
  const theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy); // kąt osi z największą wariancją
  let deg = (theta * 180) / Math.PI;
  if (deg < 0) deg += 180;
  return deg;
}

/**
 * Doprecyzowanie kąta: szukamy obrotu, przy którym prostokąt otaczający narty jest najwęższy.
 * Para nart ustawiona ukośnie obok siebie ma inną oś główną niż pojedyncza narta,
 * a minimalna szerokość wyrównuje same narty do pionu.
 */
function refineRotation({ data, w, h }, start) {
  const pts = [];
  for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) if (data[(y * w + x) * 4 + 3] > 235) pts.push([x, y]); // bez półprzezroczystych cieni
  const widthAt = (deg) => {
    const r = (deg * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    let min = Infinity;
    let max = -Infinity;
    for (const [x, y] of pts) {
      const xr = x * c - y * s; // współrzędna x po obrocie zgodnym z ruchem wskazówek zegara
      if (xr < min) min = xr;
      if (xr > max) max = xr;
    }
    return max - min;
  };
  let best = start;
  let bestW = widthAt(start);
  for (let d = start - 25; d <= start + 25; d += 1) {
    const wd = widthAt(d);
    if (wd < bestW - 0.5) {
      bestW = wd;
      best = d;
    }
  }
  return best;
}

const done = new Map();
for (const ski of skis) {
  if (!ski.image) continue;
  const src = ski.image.startsWith("/images/skis-v/") ? ski.image_original : ski.image;
  if (!src) continue;
  const outName = `${path.basename(src, path.extname(src))}.webp`;
  const outPath = path.join(OUT_DIR, outName);

  if (!done.has(src)) {
    const img = await load(path.join(root, "public", src));
    const bg = backgroundOf(img);
    const key = path.basename(src, path.extname(src));
    const override = OVERRIDES[key] ?? {};
    removeBackground(img, bg, override.tolerance, override.greyBackground);
    // półprzezroczyste cienie renderów 3D
    if (override.alphaCut) for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < override.alphaCut) img.data[i] = 0;

    let rot = 90 - principalAngle(img); // obrót zgodnie z ruchem wskazówek zegara do pionu
    if (rot > 80) rot -= 180; // narty poziome obracamy w lewo: dziób (zwykle po prawej) trafia na górę
    if (Math.abs(rot) >= 4) rot = refineRotation(img, rot);
    if (override.rotate !== undefined) rot = override.rotate;
    if (Math.abs(rot) < 2) rot = 0;

    let pipeline = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } });
    if (rot !== 0) pipeline = pipeline.rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    const trimmed = await pipeline.png().toBuffer();
    const fitted = await sharp(trimmed)
      .trim({ threshold: 1 })
      .resize({ width: BOX.w, height: BOX.h, fit: "inside" })
      .toBuffer();
    await sharp({ create: { width: CANVAS.w, height: CANVAS.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: fitted, gravity: "center" }])
      .webp({ quality: 86, alphaQuality: 90 })
      .toFile(outPath);
    done.set(src, { rot: Math.round(rot), bg: bg ? "kolor" : "przezroczyste" });
    console.log(`${outName}: obrót ${Math.round(rot)}°, tło ${bg ? bg.join(",") : "przezroczyste"}`);
  }

  ski.image_original = src;
  ski.image = `/images/skis-v/${outName}`;
  delete ski.image_orientation;
}

await writeFile(skisPath, JSON.stringify(skis, null, 2) + "\n");
console.log(`Gotowe: ${done.size} zdjęć w public/images/skis-v`);
