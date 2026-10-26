import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticles } from "@/content/articles";

export const metadata: Metadata = {
  title: "Artykuły o sprzęcie",
  description: "Porównania modeli, poradniki i analizy cen sprzętu narciarskiego.",
};

export default function ArticlesPage() {
  const [first, ...rest] = getArticles();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Artykuły</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ArticleCard article={first} large />
        <div className="grid gap-6">
          {rest.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
