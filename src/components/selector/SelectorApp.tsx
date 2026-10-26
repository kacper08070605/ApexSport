"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  buildProfile,
  DEFAULT_INPUT,
  inputFromQuery,
  inputToQuery,
  recommend,
  type SelectorInput,
} from "@/lib/selector";
import type { Ski } from "@/lib/types";
import { ProfilePanel } from "./ProfilePanel";
import { SelectorResults, type PriceInfo } from "./SelectorResults";
import { Choice, NumberField, Slider, StepShell } from "./controls";

const STEPS = ["O Tobie", "Umiejętności", "Styl jazdy", "Gdzie jeździsz", "Zakup"] as const;

export function SelectorApp({ skis, prices }: { skis: Ski[]; prices: Record<string, PriceInfo> }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = useMemo(() => inputFromQuery(new URLSearchParams(params.toString())), [params]);

  const [input, setInput] = useState<SelectorInput>(fromUrl ?? DEFAULT_INPUT);
  const [step, setStep] = useState(0);
  const showResults = fromUrl !== null;

  const set = <K extends keyof SelectorInput>(k: K, v: SelectorInput[K]) => setInput((i) => ({ ...i, [k]: v }));
  const profile = useMemo(() => buildProfile(input), [input]);

  const result = useMemo(
    () => (showResults && fromUrl ? recommend(skis, fromUrl, (slug) => prices[slug]?.price) : null),
    [showResults, fromUrl, skis, prices],
  );

  const submit = () => {
    router.push(`${pathname}?${inputToQuery(input)}`, { scroll: false });
    setTimeout(() => document.getElementById("wyniki")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        <div className="panel">
          <div className="border-b px-5 pt-5 pb-4 sm:px-7">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Krok {step + 1} z {STEPS.length}: {STEPS[step]}
              </span>
              <span className="text-muted-foreground">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
            </div>
            <Progress value={((step + 1) / STEPS.length) * 100} className="mt-3 h-1.5" />
            <ol className="mt-4 hidden gap-2 sm:flex">
              {STEPS.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs transition-colors",
                      i === step ? "border-primary bg-primary/5 font-medium text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {i < step ? <Check className="size-3" /> : <span className="tabular-nums">{i + 1}</span>}
                    {label}
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-5 sm:p-7">
            {step === 0 && (
              <StepShell title="Zacznijmy od Ciebie" hint="Wzrost i waga decydują o długości i o tym, jak sztywna narta będzie dla Ciebie właściwa.">
                <div className="grid gap-5 sm:grid-cols-3">
                  <NumberField label="Wzrost" unit="cm" min={110} max={215} value={input.heightCm} onChange={(v) => set("heightCm", v)} />
                  <NumberField label="Waga" unit="kg" min={25} max={160} value={input.weightKg} onChange={(v) => set("weightKg", v)} />
                  <NumberField label="Wiek" unit="lat" min={8} max={90} value={input.age} onChange={(v) => set("age", v)} />
                </div>
                <Choice
                  label="Jakie modele pokazać?"
                  value={input.sex}
                  onChange={(v) => set("sex", v)}
                  options={[
                    { value: "male", title: "Unisex", text: "Modele bez podziału na płeć." },
                    { value: "female", title: "Także damskie", text: "Damskie mają lżejszą konstrukcję i wiązanie bliżej środka." },
                  ]}
                />
              </StepShell>
            )}

            {step === 1 && (
              <StepShell title="Jak jeździsz?" hint="Bądź szczery. Za trudna narta to najczęstszy błąd przy zakupie.">
                <Choice
                  label="Poziom"
                  value={input.level}
                  onChange={(v) => set("level", v)}
                  columns={1}
                  options={[
                    { value: "first", title: "Pierwszy sezon", text: "Uczę się, jeżdżę pługiem na łatwych trasach." },
                    { value: "beginner", title: "Początkujący", text: "Zjeżdżam niebieskie trasy, skręt jeszcze z ześlizgiem." },
                    { value: "intermediate", title: "Średniozaawansowany", text: "Czerwone trasy bez stresu, skręty równoległe." },
                    { value: "advanced", title: "Zaawansowany", text: "Każda trasa, skręt cięty na krawędzi, szybka jazda." },
                    { value: "expert", title: "Ekspert", text: "Jazda sportowa, kontrola w każdych warunkach, tyczki." },
                  ]}
                />
                <Choice
                  label="Ile dni w sezonie jeździsz?"
                  value={input.days}
                  onChange={(v) => set("days", v)}
                  options={[
                    { value: "few", title: "Do 5", text: "Jeden wyjazd w roku." },
                    { value: "some", title: "5–15", text: "Ferie i kilka weekendów." },
                    { value: "many", title: "Ponad 15", text: "Co weekend albo dłużej." },
                  ]}
                />
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="Twój styl jazdy" hint="Promień skrętu narty powinien pasować do tego, jak lubisz skręcać.">
                <Choice
                  label="Jaki skręt lubisz najbardziej?"
                  value={input.turn}
                  onChange={(v) => set("turn", v)}
                  options={[
                    { value: "short", title: "Krótki", text: "Szybkie zmiany kierunku, slalom, wąskie trasy." },
                    { value: "medium", title: "Średni", text: "Swobodna jazda po trasie." },
                    { value: "long", title: "Długi", text: "Szerokie łuki, prędkość, puste stoki." },
                    { value: "mixed", title: "Różnie", text: "Zależy od trasy i dnia." },
                  ]}
                />
                <Choice
                  label="Prędkość"
                  value={input.speed}
                  onChange={(v) => set("speed", v)}
                  options={[
                    { value: "calm", title: "Spokojnie", text: "Kontrola ważniejsza niż tempo." },
                    { value: "moderate", title: "Średnio", text: "Jak większość na stoku." },
                    { value: "fast", title: "Szybko", text: "Lubię, gdy narta gna." },
                  ]}
                />
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="Gdzie i po czym jeździsz" hint="Polskie stoki to zwykle twardy, ubity śnieg. W Alpach częściej trafia się miękki i świeży.">
                <Choice
                  label="Gdzie jeździsz najczęściej?"
                  value={input.where}
                  onChange={(v) => set("where", v)}
                  options={[
                    { value: "pl", title: "Polska", text: "Beskidy, Tatry, Sudety." },
                    { value: "alps", title: "Alpy", text: "Długie trasy, większe wysokości." },
                    { value: "both", title: "Tu i tu", text: "Ferie w Polsce, wyjazd w Alpy." },
                  ]}
                />
                <Choice
                  label="Typowy śnieg"
                  value={input.snow}
                  onChange={(v) => set("snow", v)}
                  options={[
                    { value: "hard", title: "Twardy, oblodzony", text: "Rano po ratrakach, sztuczny śnieg." },
                    { value: "mixed", title: "Różny", text: "Rano twardo, po południu muldy." },
                    { value: "soft", title: "Miękki, świeży", text: "Puch, rozjeżdżony śnieg." },
                  ]}
                />
                <Slider
                  label="Ile jeździsz poza przygotowaną trasą?"
                  value={input.offPiste}
                  onChange={(v) => set("offPiste", v)}
                  marks={["Tylko trasa", "Czasem obok", "Pół na pół", "Głównie poza"]}
                />
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title="Zakup" hint="Pokażemy najlepsze dopasowania w budżecie i najniższą cenę w sklepach.">
                <Slider
                  label={`Budżet: do ${input.budget.toLocaleString("pl-PL")} zł`}
                  value={input.budget}
                  min={1000}
                  max={6000}
                  step={100}
                  onChange={(v) => set("budget", v)}
                  marks={["1000 zł", "2500 zł", "4000 zł", "6000 zł"]}
                />
                <Choice
                  label="Wiązanie"
                  value={input.binding}
                  onChange={(v) => set("binding", v)}
                  options={[
                    { value: "with", title: "W zestawie", text: "Narty z wiązaniem, gotowe do jazdy." },
                    { value: "without", title: "Osobno", text: "Mam wiązania albo chcę wybrać sam." },
                    { value: "any", title: "Obojętne", text: "Pokaż wszystkie." },
                  ]}
                />
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 hover:border-foreground/25">
                  <Checkbox
                    checked={input.olderSeasons}
                    onCheckedChange={(v) => set("olderSeasons", v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-semibold">Uwzględnij zeszłoroczne modele</span>
                    <span className="block text-sm text-muted-foreground">Często ta sama konstrukcja, a cena niższa o kilkaset złotych.</span>
                  </span>
                </label>
              </StepShell>
            )}

            <div className="mt-8 flex items-center justify-between border-t pt-5">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} className={cn("h-11 px-4", step === 0 && "invisible")}>
                <ArrowLeft /> Wstecz
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} className="h-11 rounded-md px-6">
                  Dalej <ArrowRight />
                </Button>
              ) : (
                <Button onClick={submit} className="h-11 rounded-md px-6">
                  <Sparkles /> Pokaż dopasowane narty
                </Button>
              )}
            </div>
          </div>
        </div>

        <ProfilePanel profile={profile} input={input} />
      </div>

      {result && fromUrl && (
        <div id="wyniki" className="scroll-mt-4">
          <SelectorResults result={result} input={fromUrl} prices={prices} />
        </div>
      )}
    </div>
  );
}
