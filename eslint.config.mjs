import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // komponenty shadcn/ui generowane przez CLI: zostawiamy w oryginalnej postaci
  {
    files: ["src/components/ui/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // skopiowany worker MapLibre (scripts/copy-maplibre-worker.mjs)
    "public/vendor/**",
  ]),
]);

export default eslintConfig;
