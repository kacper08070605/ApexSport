"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MATCH_SORTS, type MatchSort } from "@/lib/radar/sort";

/** Sortowanie listy ogłoszeń; wybór trafia do adresu (?sort=), więc zostaje po odświeżeniu. */
export function SortSelect({ value }: { value: MatchSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const change = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "newest") next.delete("sort");
    else next.set("sort", v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return (
    <Select value={value} onValueChange={change}>
      <SelectTrigger className="h-9 w-48 rounded-md bg-card" aria-label="Sortowanie">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(MATCH_SORTS) as MatchSort[]).map((k) => (
          <SelectItem key={k} value={k}>
            {MATCH_SORTS[k].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
