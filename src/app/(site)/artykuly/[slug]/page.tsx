import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { formatDate, getArticle, getArticles } from "@/content/articles";
import { summarize } from "@/lib/catalog";
import { getSki } from "@/lib/skis";

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/artykuly/[slug]">): Promise<Metadata> {
  const article = getArticle((await params).slug);
  return article ? { title: article.title, description: article.lead } : {};
}

export default async function ArticlePage({ params }: PageProps<"/artykuly/[slug]">) {
  const article = getArticle((await params).slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/artykuly" className="hover:underline">
          Artykuły
        </Link>{" "}
        · {article.category} · {formatDate(article.date)} · {article.readMinutes} min czytania
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{article.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.lead}</p>

      <div className="mt-8 space-y-5 text-[17px] leading-relaxed">
        {article.body.map((block, i) => {
          switch (block.type) {
            case "h2":
              return (
                <h2 key={i} className="pt-4 text-xl font-semibold">
                  {block.text}
                </h2>
              );
            case "p":
              return <p key={i}>{block.text}</p>;
            case "products":
              return (
                <div key={i} className="grid grid-cols-2 gap-4 py-2">
                  {block.slugs.map((slug) => {
                    const ski = getSki(slug);
                    return ski ? <ProductCard key={slug} product={summarize(ski)} /> : null;
                  })}
                </div>
              );
            case "compare":
              return (
                <p key={i}>
                  <Link
                    href={`/porownaj?narty=${block.slugs.join(",")}`}
                    className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {block.label}
                  </Link>
                </p>
              );
          }
        })}
      </div>
    </article>
  );
}
