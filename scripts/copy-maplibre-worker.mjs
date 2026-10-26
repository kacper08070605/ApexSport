// Kopiuje worker MapLibre do public/. Bundler nie potrafi go poprawnie wskazać,
// więc ładujemy go z własnego adresu przez setWorkerUrl (src/lib/maplibre.ts).
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
await mkdir(path.join(root, "public/vendor"), { recursive: true });
await copyFile(
  path.join(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"),
  path.join(root, "public/vendor/maplibre-gl-worker.mjs"),
);
