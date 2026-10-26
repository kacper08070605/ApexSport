import type { MetadataRoute } from "next";
import { getArticles } from "@/content/articles";
import { getResorts } from "@/lib/resorts";
import { SITE_URL } from "@/lib/site";
import { getSkis } from "@/lib/skis";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/narciarstwo/narty-zjazdowe", "/porownaj", "/artykuly", "/narciarstwo/osrodki", "/o-serwisie"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...getSkis().map((s) => ({ url: `${SITE_URL}/produkt/${s.slug}` })),
    ...getArticles().map((a) => ({ url: `${SITE_URL}/artykuly/${a.slug}` })),
    ...getResorts().map((r) => ({ url: `${SITE_URL}/narciarstwo/osrodki/${r.slug}` })),
  ];
}
