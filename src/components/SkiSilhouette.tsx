import { formatNumber } from "@/lib/labels";

export interface SilhouetteShape {
  label?: string;
  length_cm: number;
  tip_mm: number;
  waist_mm: number;
  tail_mm: number;
  color?: string;
}

const VIEW_W = 1000;
const PAD_X = 20;
// Szerokość w mm → piksele. Narta jest ~14× dłuższa niż szeroka, więc szerokość
// przeskalowujemy, żeby różnice w taliowaniu były widoczne.
const WIDTH_SCALE = 0.9;

/** Szerokość narty w punkcie t (0 = czubek dzioba, 1 = koniec piętki). */
function widthAt(t: number, s: SilhouetteShape): number {
  const smooth = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
  const TIP = 0.1;
  const WAIST = 0.52;
  const TAIL = 0.95;
  if (t < TIP) return s.tip_mm * Math.sqrt(t / TIP) * 0.85 + s.tip_mm * 0.15 * (t / TIP);
  if (t < WAIST) return s.tip_mm + (s.waist_mm - s.tip_mm) * smooth((t - TIP) / (WAIST - TIP));
  if (t < TAIL) return s.waist_mm + (s.tail_mm - s.waist_mm) * smooth((t - WAIST) / (TAIL - WAIST));
  return s.tail_mm * (1 - 0.25 * ((t - TAIL) / (1 - TAIL)) ** 2);
}

function outline(s: SilhouetteShape, maxLength: number, cy: number): string {
  const len = ((VIEW_W - 2 * PAD_X) * s.length_cm) / maxLength;
  const steps = 120;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = PAD_X + t * len;
    const half = (widthAt(t, s) * WIDTH_SCALE) / 2;
    top.push(`${x.toFixed(1)},${(cy - half).toFixed(1)}`);
    bottom.unshift(`${x.toFixed(1)},${(cy + half).toFixed(1)}`);
  }
  return `M${top.join(" L")} L${bottom.join(" L")} Z`;
}

/**
 * Sylwetka narty (widok z góry) wygenerowana z wymiarów producenta.
 * Kilka kształtów nakłada się na siebie w tej samej skali — do porównań.
 */
export function SkiSilhouette({
  shapes,
  showDimensions = true,
  caption = showDimensions,
}: {
  shapes: SilhouetteShape[];
  showDimensions?: boolean;
  caption?: boolean;
}) {
  if (shapes.length === 0) return null;
  const maxLength = Math.max(...shapes.map((s) => s.length_cm));
  const maxWidth = Math.max(...shapes.map((s) => Math.max(s.tip_mm, s.tail_mm)));
  const height = maxWidth * WIDTH_SCALE + (showDimensions ? 60 : 16);
  const cy = (maxWidth * WIDTH_SCALE) / 2 + 8;
  const single = shapes.length === 1 ? shapes[0] : undefined;
  const len = single ? ((VIEW_W - 2 * PAD_X) * single.length_cm) / maxLength : 0;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={shapes
          .map((s) => `${s.label ?? "Narta"}: ${s.tip_mm}/${s.waist_mm}/${s.tail_mm} mm`)
          .join("; ")}
      >
        {shapes.map((s, i) => (
          <path
            key={i}
            d={outline(s, maxLength, cy)}
            fill={s.color ?? "var(--primary)"}
            fillOpacity={shapes.length > 1 ? 0.18 : 0.85}
            stroke={s.color ?? "var(--primary)"}
            strokeWidth={2}
          />
        ))}
        {single && showDimensions && (
          <g fontSize="22" fill="var(--muted-foreground)" textAnchor="middle">
            {[
              { t: 0.1, v: single.tip_mm },
              { t: 0.52, v: single.waist_mm },
              { t: 0.95, v: single.tail_mm },
            ].map(({ t, v }) => (
              <text key={t} x={PAD_X + t * len} y={height - 14}>
                {formatNumber(v)} mm
              </text>
            ))}
          </g>
        )}
      </svg>
      {caption && (
        <figcaption className="mt-1 text-xs text-muted-foreground">
          Kształt wygenerowany z wymiarów producenta (dziób / talia / piętka). Szerokość
          powiększona względem długości, żeby było widać taliowanie.
        </figcaption>
      )}
    </figure>
  );
}
