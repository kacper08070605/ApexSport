"use client";

import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { normalize, searchSkis } from "@/lib/search";
import type { SkiCategory } from "@/lib/types";

export interface SearchItem {
  slug: string;
  name: string;
  brand: string;
  model: string;
  family: string;
  season: string;
  category: SkiCategory;
  image?: string;
  min?: number;
}

export interface ResortItem {
  slug: string;
  name: string;
  town: string;
}

const PAGES = [
  { label: "Dobór nart", href: "/dobor-nart" },
  { label: "Katalog nart zjazdowych", href: "/narciarstwo/narty-zjazdowe" },
  { label: "Porównaj modele", href: "/porownaj" },
  { label: "Ośrodki i warunki śniegowe", href: "/narciarstwo/osrodki" },
];

/** Wyszukiwarka w stylu palety poleceń (Ctrl+K): narty, ośrodki i skróty. */
export function SearchCommand({ items, resorts }: { items: SearchItem[]; resorts: ResortItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/input|textarea/i.test((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    // inne przyciski wyszukiwania (np. na stronie głównej) otwierają tę samą paletę
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("apex:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("apex:open-search", onOpen);
    };
  }, []);

  const skis = useMemo(() => (query.trim().length >= 2 ? searchSkis(items, query).slice(0, 7).map((h) => h.ski) : items.slice(0, 5)), [items, query]);
  const places = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return resorts.filter((r) => normalize(`${r.name} ${r.town}`).includes(q)).slice(0, 4);
  }, [resorts, query]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center gap-3 rounded-md border bg-muted/50 px-3.5 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/25"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate"><span className="sm:hidden">Szukaj</span><span className="hidden sm:inline">Szukaj nart, marek i ośrodków</span></span>
        <kbd className="hidden rounded-md border bg-card px-1.5 py-0.5 font-sans text-[11px] sm:inline">Ctrl K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Szukaj" description="Szukaj nart, marek i ośrodków" className="sm:max-w-xl">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="np. atomic s9, hero 24/25, szczyrk"
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim() && !document.querySelector("[cmdk-item][data-selected=true]")) {
                go(`/szukaj?q=${encodeURIComponent(query.trim())}`);
              }
            }}
          />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>Nic nie znaleźliśmy. Spróbuj nazwy marki albo modelu.</CommandEmpty>
            {skis.length > 0 && (
              <CommandGroup heading={query.trim().length >= 2 ? "Narty" : "Popularne"}>
                {skis.map((s) => (
                  <CommandItem key={s.slug} value={s.slug} onSelect={() => go(`/produkt/${s.slug}`)} className="gap-3 py-2">
                    <span className="product-stage relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {s.image && <Image src={s.image} alt="" fill sizes="40px" className="object-contain p-0.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">Sezon {s.season}</span>
                    </span>
                    {s.min && <span className="text-sm font-semibold">od {s.min.toLocaleString("pl-PL")} zł</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {places.length > 0 && (
              <CommandGroup heading="Ośrodki">
                {places.map((r) => (
                  <CommandItem key={r.slug} value={`resort-${r.slug}`} onSelect={() => go(`/narciarstwo/osrodki/${r.slug}`)}>
                    <MapPin />
                    <span className="flex-1">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.town}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {query.trim().length >= 2 && (
              <CommandGroup>
                <CommandItem value="all-results" onSelect={() => go(`/szukaj?q=${encodeURIComponent(query.trim())}`)}>
                  <Search />
                  Wszystkie wyniki dla „{query.trim()}”
                  <CommandShortcut>Enter</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup heading="Przejdź do">
              {PAGES.map((p) => (
                <CommandItem key={p.href} value={`page-${p.href}`} onSelect={() => go(p.href)}>
                  {p.href === "/dobor-nart" ? <Sparkles /> : <ArrowRight />}
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
