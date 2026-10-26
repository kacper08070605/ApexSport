"use client";

import { Ruler } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import type { Profile, SelectorInput } from "@/lib/selector";
import { TRAIT_LABEL } from "@/lib/ski-traits";

const fmt = (x: number) => x.toLocaleString("pl-PL", { maximumFractionDigits: 1 });

/** Na żywo pokazuje, czego szukamy: długość, szerokość, promień i wymagania wobec narty. */
export function ProfilePanel({ profile, input }: { profile: Profile; input: SelectorInput }) {
  const len = profile.baseLength;
  return (
    <aside className="panel self-start lg:sticky lg:top-20">
      <div className="border-b bg-gradient-to-br from-primary/10 to-transparent p-5">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ruler className="size-4" /> Twoja długość nart na trasę
        </p>
        <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">
          {len - 3}–{len + 3} <span className="text-xl font-normal text-muted-foreground">cm</span>
        </p>
      </div>

      <dl className="grid grid-cols-2 divide-x border-b">
        <div className="p-4">
          <dt className="text-xs text-muted-foreground">Szerokość pod butem</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {profile.waist[0]}–{profile.waist[1]} mm
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-xs text-muted-foreground">Promień skrętu</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {fmt(profile.radius[0])}–{fmt(profile.radius[1])} m
          </dd>
        </div>
      </dl>

      <div className="p-5">
        <p className="mb-3 text-sm font-medium">Czego potrzebujesz od narty</p>
        <ul className="space-y-3">
          {(Object.keys(TRAIT_LABEL) as (keyof typeof TRAIT_LABEL)[]).map((k) => (
            <li key={k}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">{TRAIT_LABEL[k]}</span>
                <span className="font-medium tabular-nums">{fmt(profile.needs[k])}</span>
              </div>
              <Progress value={profile.needs[k] * 10} className="h-1.5" />
            </li>
          ))}
        </ul>

        <Accordion type="single" collapsible className="mt-4 border-t">
          <AccordionItem value="len" className="border-b-0">
            <AccordionTrigger className="text-sm">Jak liczymy długość</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {profile.lengthSteps.map((s, i) => (
                  <li key={s.label} className="flex justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {i === 0 ? `${s.cm} cm` : `${s.cm > 0 ? "+" : "−"}${Math.abs(s.cm)} cm`}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between border-t pt-1.5 font-medium text-foreground">
                  <span>razem</span>
                  <span className="tabular-nums">{len} cm</span>
                </li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Dla konkretnego modelu korygujemy jeszcze o typ narty: slalomki krócej, giganty i narty z rockerem dłużej.
                {input.level === "first" && " Na pierwszy sezon lepiej wziąć krócej niż dłużej."}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}
