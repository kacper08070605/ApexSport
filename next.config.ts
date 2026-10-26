import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
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
