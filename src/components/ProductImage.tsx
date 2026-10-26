import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Ski } from "@/lib/types";

/**
 * Zdjęcie produktu na jasnej scenie. Zdjęcia nart są wcześniej ujednolicone
 * (scripts/normalize-ski-images.mjs): narty w pionie, bez tła, w tym samym kadrze.
 */
export function ProductImage({
  ski,
  sizes,
  className = "",
  priority = false,
}: {
  ski: Ski;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("product-stage relative overflow-hidden bg-muted", className)}>
      {ski.image ? (
        <Image src={ski.image} alt={`${ski.brand} ${ski.model} ${ski.season}`} fill sizes={sizes} priority={priority} className="object-contain py-4" />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">Brak zdjęcia</div>
      )}
    </div>
  );
}
