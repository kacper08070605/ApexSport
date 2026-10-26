import Link from "next/link";
import { bestOffer } from "@/lib/catalog";
import { getResorts } from "@/lib/resorts";
import { getSkis, skiName } from "@/lib/skis";
import { AlertsBadge } from "./AlertsBadge";
import { Logo } from "./Logo";
import { MainNav, MobileNav } from "./MainNav";
import { SearchCommand, type SearchItem } from "./SearchCommand";

export function SiteHeader() {
  const items: SearchItem[] = getSkis().map((s) => ({
    slug: s.slug,
    name: skiName(s),
    brand: s.brand,
    model: s.model,
    family: s.family ?? skiName(s),
    season: s.season,
    category: s.category,
    image: s.image ?? undefined,
    min: bestOffer(s.slug)?.price,
  }));
  const resorts = getResorts().map((r) => ({ slug: r.slug, name: r.name, town: r.town }));

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <MobileNav />
        <Link href="/" aria-label="Apex Sport, strona główna" className="shrink-0">
          <Logo />
        </Link>
        <MainNav />
        <div className="ml-auto min-w-0 flex-1 sm:max-w-sm">
          <SearchCommand items={items} resorts={resorts} />
        </div>
        <AlertsBadge />
      </div>
    </header>
  );
}
