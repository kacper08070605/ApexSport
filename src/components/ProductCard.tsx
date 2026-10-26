import Link from "next/link";
import { formatPrice, getPrices, shopDiscount, type ProductSummary } from "@/lib/catalog";
import { plural } from "@/lib/labels";
import { specLine } from "@/lib/skis";
import { ProductImage } from "./ProductImage";
import { Sparkline } from "./Sparkline";

export function ProductCard({
  product,
  action,
}: {
  product: ProductSummary;
  action?: React.ReactNode;
}) {
  const { ski, min, shops, change30d } = product;
  const change = change30d ?? shopDiscount(ski.slug);
  const drop = change !== undefined && change <= -0.03;
  const history = getPrices(ski.slug)?.history;

  return (
    <article className="group panel lift relative flex flex-col">
      <div className="relative">
        <ProductImage ski={ski} sizes="(min-width: 1024px) 22vw, 45vw" className="aspect-[3/4]" />
        <span className="absolute top-2.5 left-2.5 rounded-sm border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {ski.season}
        </span>
        {drop && (
          <span className="absolute top-2.5 right-2.5 rounded-sm bg-sale px-1.5 py-0.5 text-[11px] font-semibold text-white">
            −{Math.abs(Math.round(change! * 100))}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t p-3.5">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{ski.brand}</p>
        <h3 className="mt-0.5 text-[15px] leading-snug font-medium">
          <Link href={`/produkt/${ski.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-2">
            {ski.model}
          </Link>
        </h3>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{specLine(ski)}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {min !== undefined ? (
            <p className="leading-tight">
              <span className="block text-lg font-semibold tabular-nums">
                <span className="mr-1 text-xs font-normal text-muted-foreground">od</span>
                {formatPrice(min)}
              </span>
              <span className="text-xs text-muted-foreground">
                w {shops} {plural(shops, "sklepie", "sklepach", "sklepach")}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Brak ofert</p>
          )}
          {history && <Sparkline points={history} className="mb-1 h-6 w-16" />}
        </div>
        {action && <div className="relative z-10 mt-3 border-t pt-3">{action}</div>}
      </div>
    </article>
  );
}
