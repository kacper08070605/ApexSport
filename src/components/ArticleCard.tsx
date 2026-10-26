import Image from "next/image";
import Link from "next/link";
import { formatDate, type Article } from "@/content/articles";
import { cn } from "@/lib/utils";

export function ArticleCard({ article, large = false }: { article: Article; large?: boolean }) {
  return (
    <Link
      href={`/artykuly/${article.slug}`}
      className={cn("group panel lift grid min-w-0", large ? "sm:grid-cols-[2fr_3fr]" : "grid-cols-[104px_1fr]")}
    >
      <div className={cn("product-stage relative bg-muted", large ? "aspect-[4/3] sm:aspect-auto sm:min-h-60" : "min-h-28")}>
        <Image
          src={article.cover}
          alt=""
          fill
          sizes={large ? "30vw" : "104px"}
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className={cn("min-w-0", large ? "p-6" : "p-4")}>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-primary">{article.category}</span> · {formatDate(article.date)}
        </p>
        <h3 className={cn("mt-1.5 font-semibold leading-snug", large ? "text-2xl" : "text-base")}>{article.title}</h3>
        <p className={cn("mt-2 text-sm text-muted-foreground", !large && "line-clamp-2")}>{article.lead}</p>
      </div>
    </Link>
  );
}
