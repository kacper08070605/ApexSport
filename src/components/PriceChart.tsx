"use client";

import { useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PricePoint } from "@/lib/types";

const W = 520;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 62 };
const RANGES = [
  { label: "30 dni", days: 30 },
  { label: "90 dni", days: 90 },
  { label: "Całość", days: Infinity },
];

const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
const day = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("pl-PL", { day: "numeric", month: "short", timeZone: "UTC" });

/** Historia najniższej ceny: jedna seria, krzyżyk i dymek po najechaniu. */
export function PriceChart({ history }: { history: PricePoint[] }) {
  const [range, setRange] = useState(90);
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(
    () => (Number.isFinite(range) ? history.slice(-range) : history),
    [history, range],
  );

  if (history.length < 2)
    return (
      <div>
        <h2 className="text-lg font-semibold">Historia najniższej ceny</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {history[0]
            ? `Ceny zbieramy od ${day(history[0].d)}: dziś najniżej ${zl(history[0].min)}. Wykres pojawi się po kolejnych sprawdzeniach cen.`
            : "Brak danych o cenach."}
        </p>
      </div>
    );

  const prices = points.map((p) => p.min);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  // „ładny” krok podziałki: 50, 100, 200, 250 lub 500 zł
  const step = [50, 100, 200, 250, 500, 1000].find((s) => (hi - lo) / s <= 4) ?? 1000;
  const yMin = Math.floor(lo / step) * step - (lo % step === 0 ? step : 0);
  const yMax = Math.ceil(hi / step) * step + (hi % step === 0 ? step : 0);

  const x = (i: number) => PAD.left + (i / Math.max(1, points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

  // linia schodkowa: cena obowiązuje do następnej zmiany (jak w Keepa / camelcamelcamel)
  const line = points
    .map((p, i) => (i ? `H${x(i).toFixed(1)}V${y(p.min).toFixed(1)}` : `M${x(0).toFixed(1)},${y(p.min).toFixed(1)}`))
    .join("");
  const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
  const vsAvg = (points.at(-1)!.min - avg) / avg;
  const ticks = Array.from({ length: Math.round((yMax - yMin) / step) + 1 }, (_, k) => yMin + k * step);
  const lowIdx = prices.indexOf(lo);
  const h = hover !== null ? points[hover] : undefined;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Historia najniższej ceny</h2>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={String(range)}
          onValueChange={(v) => v && setRange(Number(v))}
          aria-label="Zakres"
        >
          {RANGES.map((r) => (
            <ToggleGroupItem key={r.label} value={String(r.days)} className="px-2.5 text-xs">
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          role="img"
          aria-label={`Najniższa cena od ${day(points[0].d)}: od ${zl(lo)} do ${zl(hi)}`}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W;
            const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (points.length - 1));
            setHover(Math.max(0, Math.min(points.length - 1, i)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--muted-foreground)">
                {zl(Math.round(t))}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 8} fontSize="12" fill="var(--muted-foreground)">
            {day(points[0].d)}
          </text>
          <text x={W - PAD.right} y={H - 8} fontSize="12" fill="var(--muted-foreground)" textAnchor="end">
            {day(points.at(-1)!.d)}
          </text>

          <line x1={PAD.left} x2={W - PAD.right} y1={y(avg)} y2={y(avg)} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1} />
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />

          {/* najniższa cena w zakresie */}
          <circle cx={x(lowIdx)} cy={y(lo)} r={4} fill="var(--deal)" stroke="var(--card)" strokeWidth={2} />
          <circle
            cx={x(points.length - 1)}
            cy={y(points.at(-1)!.min)}
            r={4}
            fill="var(--primary)"
            stroke="var(--card)"
            strokeWidth={2}
          />

          {h && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(h.min)} r={5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
            </g>
          )}
        </svg>
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 panel px-2 py-1 text-xs shadow-md"
            style={{ left: `${(x(hover) / W) * 100}%` }}
          >
            <span className="text-muted-foreground">{day(h.d)}</span> <strong>{zl(h.min)}</strong>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm">
        {Math.abs(vsAvg) < 0.01 ? (
          "Dzisiejsza cena jest na poziomie średniej z tego okresu."
        ) : vsAvg < 0 ? (
          <>
            Dziś <strong className="text-deal">{Math.round(Math.abs(vsAvg) * 100)}% poniżej</strong> średniej z tego okresu ({zl(Math.round(avg))}).
          </>
        ) : (
          <>
            Dziś <strong>{Math.round(vsAvg * 100)}% powyżej</strong> średniej z tego okresu ({zl(Math.round(avg))}). Rozważ alert cenowy.
          </>
        )}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-deal" />
          Najniżej w tym okresie: {zl(lo)} ({day(points[lowIdx].d)})
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
          Dziś: {zl(points.at(-1)!.min)}
        </span>
      </p>
    </div>
  );
}
