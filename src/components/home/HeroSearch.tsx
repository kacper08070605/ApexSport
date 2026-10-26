"use client";

import { Search } from "lucide-react";

/** Duże pole wyszukiwania w pierwszym ekranie; otwiera paletę wyszukiwania z nagłówka. */
export function HeroSearch() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("apex:open-search"))}
      className="flex h-14 w-full max-w-xl items-center gap-3 rounded-md border border-input bg-card px-4 text-left text-base text-muted-foreground transition-colors hover:border-foreground/40"
    >
      <Search className="size-5 shrink-0 text-foreground" />
      <span className="flex-1 truncate">Model, marka albo rocznik, np. Atomic S9 24/25</span>
      <span className="hidden rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground sm:inline">Szukaj</span>
    </button>
  );
}
