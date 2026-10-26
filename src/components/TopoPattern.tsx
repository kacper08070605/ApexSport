/**
 * Motyw graficzny marki: warstwice jak na mapie górskiej.
 * Generowane deterministycznie (bez plików graficznych): kilka „wzniesień”,
 * wokół każdego zamknięte, lekko pofalowane izolinie.
 */
const PEAKS = [
  { cx: 0.78, cy: 0.35, r: 0.42, seed: 1.3 },
  { cx: 0.2, cy: 0.85, r: 0.3, seed: 4.1 },
  { cx: 0.5, cy: 1.05, r: 0.26, seed: 2.7 },
];

function contour(cx: number, cy: number, radius: number, seed: number, w: number, h: number) {
  const steps = 96;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wobble =
      1 + 0.09 * Math.sin(3 * a + seed) + 0.05 * Math.sin(5 * a + seed * 2.1) + 0.03 * Math.sin(9 * a + seed * 0.7);
    const x = (cx + Math.cos(a) * radius * wobble * 1.35) * w;
    const y = (cy + Math.sin(a) * radius * wobble * 0.8) * h;
    d += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + "Z";
}

export function TopoPattern({ className = "", lines = 9 }: { className?: string; lines?: number }) {
  const W = 1200;
  const H = 600;
  const paths: string[] = [];
  for (const p of PEAKS) {
    for (let k = 1; k <= lines; k++) paths.push(contour(p.cx, p.cy, (p.r * k) / lines, p.seed + k * 0.35, W, H));
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
