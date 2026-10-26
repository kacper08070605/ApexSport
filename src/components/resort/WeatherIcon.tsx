import { weatherLabel } from "@/lib/weather-codes";

/** Prosta ikona pogody (SVG, dziedziczy kolor tekstu tam, gdzie to ma sens). */
export function WeatherIcon({ code, className = "h-7 w-7" }: { code: number; className?: string }) {
  const { label, icon } = weatherLabel(code);
  const sun = <circle cx="12" cy="12" r="4.5" fill="#f5b301" />;
  const rays = (
    <g stroke="#f5b301" strokeWidth="1.8" strokeLinecap="round">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="12" y1="3" x2="12" y2="5.2" transform={`rotate(${a} 12 12)`} />
      ))}
    </g>
  );
  const cloud = (x = 0, y = 0, fill = "#c6ccd4") => (
    <path
      transform={`translate(${x} ${y})`}
      d="M7 18h10.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.3A3.9 3.9 0 0 0 7 18Z"
      fill={fill}
    />
  );
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      {icon === "sun" && (
        <>
          {rays}
          {sun}
        </>
      )}
      {icon === "partly" && (
        <>
          <g transform="translate(-3 -3)">
            {rays}
            {sun}
          </g>
          {cloud(1, 1)}
        </>
      )}
      {icon === "cloud" && cloud(0, -1, "#aab2bd")}
      {icon === "fog" && (
        <g stroke="#aab2bd" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="6" y1="13" x2="18" y2="13" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </g>
      )}
      {icon === "rain" && (
        <>
          {cloud(0, -3, "#9aa3ae")}
          <g stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round">
            <line x1="9" y1="18" x2="8" y2="21" />
            <line x1="13" y1="18" x2="12" y2="21" />
            <line x1="17" y1="18" x2="16" y2="21" />
          </g>
        </>
      )}
      {icon === "snow" && (
        <>
          {cloud(0, -3, "#9aa3ae")}
          <g fill="#4dabf7">
            <circle cx="8.5" cy="19" r="1.3" />
            <circle cx="12.5" cy="21" r="1.3" />
            <circle cx="16.5" cy="19" r="1.3" />
          </g>
        </>
      )}
      {icon === "storm" && (
        <>
          {cloud(0, -3, "#7d8794")}
          <path d="M12 15l-2 4h2.5l-1.5 4 4-5.5h-2.5l1.5-2.5Z" fill="#f5b301" />
        </>
      )}
    </svg>
  );
}
