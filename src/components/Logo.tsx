/** Znak Apex Sport: szczyt z linią śladu narty. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="5" fill="var(--primary)" />
        <path d="M6.5 23 15 9.5l3.8 6 2.4-3.2L26 23Z" fill="#fff" />
        <path d="M5.5 26.5 26.5 21" stroke="var(--primary-foreground)" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-heading text-[20px] leading-none font-bold tracking-tight">
        apex<span className="font-normal text-muted-foreground">sport</span>
      </span>
    </span>
  );
}
