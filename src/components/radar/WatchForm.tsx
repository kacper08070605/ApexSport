"use client";

import { Check, ChevronsUpDown, Lock, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveWatchAction, type FormState } from "@/app/panel/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Watch } from "@/lib/radar/match";
import {
  CATEGORIES,
  CATEGORY_IDS,
  CONDITIONS,
  CONDITION_IDS,
  GENDERS,
  GENDER_IDS,
  SOURCE_IDS,
  SOURCES,
  type Category,
} from "@/lib/radar/sources";
import { cn } from "@/lib/utils";

export interface FamilyOption {
  family: string;
  brand: string;
  newPrice?: number;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b py-6 first:pt-0 last:border-0 md:grid-cols-[220px_1fr]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function RangeInputs({
  name,
  unit,
  min,
  max,
  step,
}: {
  name: "price" | "len" | "size";
  unit: string;
  min?: number | null;
  max?: number | null;
  step?: number;
}) {
  const field = { price: ["min_price", "max_price"], len: ["len_min", "len_max"], size: ["size_min", "size_max"] }[name];
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-36">
        <Input name={field[0]} type="number" min={0} step={step} defaultValue={min ?? ""} placeholder="od" className="h-10 pr-9 tabular-nums" />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
      </div>
      <span className="text-muted-foreground">–</span>
      <div className="relative w-36">
        <Input name={field[1]} type="number" min={0} step={step} defaultValue={max ?? ""} placeholder="do" className="h-10 pr-9 tabular-nums" />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function WatchForm({ watch, families, canInstant }: { watch?: Watch; families: FamilyOption[]; canInstant: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveWatchAction, {});
  const [selected, setSelected] = useState<string[]>(watch?.families ?? []);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>(watch?.category ?? "skis");
  const boots = category === "boots";
  const toggle = (f: string) => setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));
  const byFamily = new Map(families.map((f) => [f.family, f]));

  return (
    <form action={action} className="rounded-md border bg-card p-6">
      {watch && <input type="hidden" name="id" value={watch.id} />}
      {!boots &&
        selected.map((f) => (
          <input key={f} type="hidden" name="families" value={f} />
        ))}

      <Section title="Kategoria">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_IDS.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2.5 text-sm has-[:checked]:border-foreground has-[:checked]:font-medium"
            >
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="accent-[var(--primary)]"
              />
              {CATEGORIES[c].label}
            </label>
          ))}
        </div>
      </Section>

      {boots && (
        <Section title="Dla kogo" hint="Bot przeszuka tylko tę kategorię butów narciarskich na Vinted.">
          <div className="flex flex-wrap gap-2">
            {GENDER_IDS.map((g) => (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2.5 text-sm has-[:checked]:border-foreground has-[:checked]:font-medium"
              >
                <input type="radio" name="gender" value={g} defaultChecked={(watch?.gender ?? "all") === g} className="accent-[var(--primary)]" />
                {GENDERS[g]}
              </label>
            ))}
          </div>
        </Section>
      )}

      <Section title="Nazwa (opcjonalnie)" hint="Twoja etykieta filtra, widoczna na liście wyszukiwań i w powiadomieniach. Puste pole: użyjemy wpisanych fraz.">
        <Input
          name="name"
          defaultValue={watch?.name ?? ""}
          placeholder={boots ? "np. Skiturowe Tecnica lub Scarpa, 42–43" : "np. Atomic Redster S9, 160–170 cm, do 2000 zł"}
          className="h-10 max-w-md"
        />
      </Section>

      <Section
        title="Czego szukasz"
        hint={
          boots
            ? "Marki albo modele butów. Bot szuka ich w kategorii butów narciarskich."
            : "Wybierz modele z katalogu (rozpoznajemy je w tytule ogłoszenia) albo wpisz słowa kluczowe."
        }
      >
        {!boots && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="h-10 w-full max-w-md justify-between font-normal">
              {selected.length ? `Wybrane modele: ${selected.length}` : "Wybierz modele z katalogu"}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] min-w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Szukaj modelu…" />
              <CommandList>
                <CommandEmpty>Brak takiego modelu w katalogu.</CommandEmpty>
                <CommandGroup>
                  {families.map((f) => (
                    <CommandItem key={f.family} value={f.family} onSelect={() => toggle(f.family)}>
                      <Check className={cn(selected.includes(f.family) ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1">{f.family}</span>
                      {f.newPrice && <span className="text-xs text-muted-foreground">nowe od {f.newPrice.toLocaleString("pl-PL")} zł</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        )}
        {!boots && selected.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.map((f) => (
              <Badge key={f} variant="secondary" className="h-7 gap-1 rounded-sm pr-1 pl-2.5 text-sm">
                {f}
                {byFamily.get(f)?.newPrice && (
                  <span className="text-xs font-normal text-muted-foreground">({byFamily.get(f)!.newPrice!.toLocaleString("pl-PL")} zł)</span>
                )}
                <button type="button" onClick={() => toggle(f)} className="rounded-sm p-0.5 hover:bg-foreground/10" aria-label={`Usuń ${f}`}>
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className={cn("grid max-w-md gap-1.5", !boots && "mt-4")}>
          <Label htmlFor="keywords">{boots ? "Marki lub modele" : "Słowa kluczowe (opcjonalnie)"}</Label>
          <Input
            id="keywords"
            name="keywords"
            defaultValue={watch?.keywords ?? ""}
            placeholder={boots ? "np. tecnica, scarpa, atomic hawx" : "np. völkl deacon, blizzard brahma"}
            required={boots}
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            Kilka fraz oddziel przecinkami: pokażemy ogłoszenia z dowolną z nich. Słowa w jednej frazie (np. „atomic hawx”) muszą
            wystąpić razem.
          </p>
        </div>
      </Section>

      <Section title="Cena" hint="Puste pole oznacza brak limitu.">
        <RangeInputs name="price" unit="zł" min={watch?.min_price} max={watch?.max_price} />
      </Section>

      {boots ? (
        <Section
          title="Rozmiar"
          hint="Rozmiar EU (np. 42–43) albo długość stopy w cm, czyli mondopoint (np. 26–27,5). Ogłoszenia bez rozmiaru też pokażemy."
        >
          <RangeInputs name="size" unit="" step={0.5} min={watch?.size_min} max={watch?.size_max} />
          <p className="mt-2 text-xs text-muted-foreground">Wartości do 33 traktujemy jako centymetry i przeliczamy na rozmiar EU z ogłoszenia.</p>
        </Section>
      ) : (
        <Section title="Długość" hint="Ogłoszenia bez podanej długości też pokażemy.">
          <RangeInputs name="len" unit="cm" min={watch?.len_min} max={watch?.len_max} />
        </Section>
      )}

      <Section title="Stan" hint="Nic nie zaznaczone: każdy stan.">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {CONDITION_IDS.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox name="conditions" value={c} defaultChecked={watch ? watch.conditions.includes(c) : c !== "worn"} />
              {CONDITIONS[c]}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Serwisy" hint={boots ? "Buty narciarskie bot pobiera na razie tylko z Vinted." : undefined}>
        <div className="grid max-w-xl gap-2 sm:grid-cols-3">
          {SOURCE_IDS.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2.5 text-sm has-[:checked]:border-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <Checkbox
                name="sources"
                value={s}
                disabled={!SOURCES[s].available || (boots && s !== "vinted")}
                defaultChecked={SOURCES[s].available && (watch ? watch.sources.includes(s) : true)}
              />
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: SOURCES[s].color }} />
              <span className="min-w-0">
                {SOURCES[s].label}
                {SOURCES[s].note && <span className="block text-xs text-muted-foreground">{SOURCES[s].note}</span>}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Powiadomienia" hint="E-mail na adres konta i wiadomość na Discordzie, jeśli go podłączysz.">
        <div className="grid max-w-xl gap-2">
          {(
            [
              ["instant", "Od razu", "Zaraz po znalezieniu pasującego ogłoszenia."],
              ["daily", "Raz dziennie", "Jedno podsumowanie wieczorem."],
              ["off", "Bez powiadomień", "Ogłoszenia tylko w panelu."],
            ] as const
          ).map(([value, title, text]) => {
            const locked = value === "instant" && !canInstant;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2.5 has-[:checked]:border-foreground",
                  locked && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="notify"
                  value={value}
                  disabled={locked}
                  defaultChecked={(watch?.notify ?? (canInstant ? "instant" : "daily")) === value}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {title} {locked && <Lock className="size-3.5" />}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {text}
                    {locked && (
                      <>
                        {" "}
                        <Link href="/panel/plan" className="text-primary underline">
                          Dostępne w Pro
                        </Link>
                      </>
                    )}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </Section>

      {state.error && <p className="mb-4 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="flex items-center justify-end gap-2 border-t pt-5">
        <Button asChild variant="ghost">
          <Link href={watch ? `/panel/wyszukiwania/${watch.id}` : "/panel/wyszukiwania"}>Anuluj</Link>
        </Button>
        <Button type="submit" disabled={pending} className="h-10 px-5">
          {pending ? "Zapisuję i szukam…" : watch ? "Zapisz zmiany" : "Zapisz i szukaj"}
        </Button>
      </div>
    </form>
  );
}
