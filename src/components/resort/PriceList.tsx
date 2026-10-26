"use client";

import { ExternalLink, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/money";
import type { PriceList as PriceListData } from "@/lib/resort-details";


const CURRENCY_LABEL = { PLN: "zł", EUR: "euro", CZK: "koronach czeskich" } as const;

/**
 * Pełny cennik skipassów: zakładki według rodzaju karnetu, kolumny według kategorii wiekowej.
 * Tabele z różnymi okresami cenowymi (np. sezon wysoki i niski) mają przełącznik okresu.
 */
export function PriceList({ data }: { data: PriceListData }) {
  // Grupujemy tabele po tytule; ten sam tytuł w kilku okresach daje przełącznik okresu.
  const groups = useMemo(() => {
    const map = new Map<string, PriceListData["tables"]>();
    for (const t of data.tables) map.set(t.title, [...(map.get(t.title) ?? []), t]);
    return [...map].map(([title, tables]) => ({ title, tables }));
  }, [data.tables]);

  const [period, setPeriod] = useState<Record<string, number>>({});

  return (
    <div className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">sezon {data.season}</Badge>
          Ceny w {CURRENCY_LABEL[data.currency ?? "PLN"]}{data.checked_at ? `, sprawdzone ${new Date(data.checked_at).toLocaleDateString("pl-PL")}` : ""}
        </div>
        {data.source_url && (
          <Button asChild variant="ghost" size="sm">
            <a href={data.source_url} target="_blank" rel="noopener nofollow">
              Cennik u źródła <ExternalLink />
            </a>
          </Button>
        )}
      </div>

      <Tabs defaultValue={groups[0]?.title} className="p-5">
        <TabsList className="h-auto flex-wrap justify-start">
          {groups.map((g) => (
            <TabsTrigger key={g.title} value={g.title}>
              {g.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((g) => {
          const idx = Math.min(period[g.title] ?? 0, g.tables.length - 1);
          const table = g.tables[idx];
          const cats = data.categories.filter((c) => table.rows.some((r) => r.prices[c.id] !== undefined));
          return (
            <TabsContent key={g.title} value={g.title} className="mt-4">
              {g.tables.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {g.tables.map((t, i) => (
                    <Button
                      key={t.period ?? i}
                      size="sm"
                      variant={i === idx ? "default" : "outline"}
                     
                      onClick={() => setPeriod((p) => ({ ...p, [g.title]: i }))}
                    >
                      {t.period ?? `Okres ${i + 1}`}
                    </Button>
                  ))}
                </div>
              )}
              {g.tables.length === 1 && table.period && <p className="mb-3 text-sm text-muted-foreground">{table.period}</p>}
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="min-w-40">Karnet</TableHead>
                      {cats.map((c) => (
                        <TableHead key={c.id} className="text-right">
                          <span className="block text-foreground">{c.label}</span>
                          {c.note && <span className="block text-[11px] font-normal">{c.note}</span>}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.rows.map((r) => (
                      <TableRow key={r.label}>
                        <TableCell className="font-medium whitespace-normal">{r.label}</TableCell>
                        {cats.map((c) => (
                          <TableCell key={c.id} className="text-right tabular-nums">
                            {r.prices[c.id] !== undefined ? formatMoney(r.prices[c.id]!, data.currency) : <span className="text-muted-foreground">–</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {data.notes && data.notes.length > 0 && (
        <ul className="space-y-1.5 border-t bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          {data.notes.map((n) => (
            <li key={n} className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
