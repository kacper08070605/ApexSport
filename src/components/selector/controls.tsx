"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider as UiSlider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function StepShell({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-1 text-muted-foreground">{hint}</p>
      <div className="mt-6 space-y-7">{children}</div>
    </div>
  );
}

export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: { value: T; title: string; text: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}) {
  const name = useId();
  const cols = columns ?? Math.min(options.length, 4);
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium">{label}</legend>
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 1 ? "100%" : cols >= 4 ? "150px" : "170px"}, 1fr))` }}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative cursor-pointer rounded-xl border bg-card p-4 transition-all hover:border-foreground/25",
                active && "border-primary bg-primary/[0.04] ring-1 ring-primary",
              )}
            >
              <input type="radio" name={name} className="sr-only" checked={active} onChange={() => onChange(o.value)} />
              <span className="flex items-start justify-between gap-2">
                <span className="font-medium">{o.title}</span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {active && <Check className="size-3" />}
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{o.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function NumberField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const bump = (d: number) => onChange(Math.min(max, Math.max(min, value + d)));
  return (
    <div>
      <Label htmlFor={id} className="mb-2.5">
        {label}
      </Label>
      <div className="flex h-14 items-center rounded-xl border bg-card px-1.5 focus-within:ring-2 focus-within:ring-ring/40">
        <Button type="button" variant="ghost" size="icon" onClick={() => bump(-1)} aria-label={`${label} mniej`}>
          <Minus />
        </Button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={() => onChange(Math.min(max, Math.max(min, value)))}
          className="w-full min-w-0 bg-transparent text-center text-xl font-semibold tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="pr-1 text-sm text-muted-foreground">{unit}</span>
        <Button type="button" variant="ghost" size="icon" onClick={() => bump(1)} aria-label={`${label} więcej`}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  marks,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  marks: string[];
}) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium">{label}</p>
      <UiSlider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} />
      <div className="mt-2.5 flex justify-between text-xs text-muted-foreground">
        {marks.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
