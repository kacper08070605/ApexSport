import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // ceny czytane z pliku w trakcie działania (src/lib/live-prices.ts); cache importów i stara baza SQLite nie trafiają na serwer
  outputFileTracingIncludes: { "/**": ["./data/offers.json"] },
  outputFileTracingExcludes: { "/**": ["./data/.cache/**", "./data/apex.db*"] },
  partialPrefetching: true,
  images: {
    // zdjęcia z ogłoszeń Vinted i OLX
    remotePatterns: [
      { protocol: "https", hostname: "**.vinted.net" },
      { protocol: "https", hostname: "ireland.apollo.olxcdn.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
