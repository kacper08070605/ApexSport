import type { PricePoint } from "@/lib/types";

/** Mini wykres najniższej ceny (ostatnie dni), bez osi: tylko kierunek zmian. */
export function Sparkline({
  points,
  days = 30,
  className = "h-6 w-16",
}: {
  points: PricePoint[];
  days?: number;
  className?: string;
}) {
  const p = points.slice(-days).map((x) => x.min);
  if (p.length < 2) return null;
  const lo = Math.min(...p);
  const hi = Math.max(...p);
  const W = 64;
  const H = 24;
  const y = (v: number) => (hi === lo ? H / 2 : 2 + (1 - (v - lo) / (hi - lo)) * (H - 4));
  // linia schodkowa: cena trzyma się do następnej zmiany
  let d = `M0,${y(p[0]).toFixed(1)}`;
  p.forEach((v, i) => {
    if (i === 0) return;
    const x = ((i / (p.length - 1)) * W).toFixed(1);
    d += ` H${x} V${y(v).toFixed(1)}`;
  });
  const down = p.at(-1)! < p[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="none">
      <path d={d} fill="none" stroke={down ? "var(--deal)" : "var(--muted-foreground)"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
