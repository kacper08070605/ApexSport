import { ArrowRight, MapPin, MountainSnow, Radar, Ruler } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { CardCarousel } from "@/components/home/DealsCarousel";
import { HeroSearch } from "@/components/home/HeroSearch";
import { UseTabs } from "@/components/home/UseTabs";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { WeatherIcon } from "@/components/resort/WeatherIcon";
import { TopoPattern } from "@/components/TopoPattern";
import { Button } from "@/components/ui/button";
import { getArticles } from "@/content/articles";
import { biggestDrops, getProductSummaries, getShops, PRICES_UPDATED_AT, type ProductSummary } from "@/lib/catalog";
import { generalPhoto, heroPhoto, photoCredit, resortPhoto, type Photo } from "@/lib/photos";
import { getResorts } from "@/lib/resorts";
import { getSnowOutlook } from "@/lib/weather";

const POPULAR = ["Atomic Redster S9", "Rossignol Hero", "Völkl Mantra", "Fischer Curv", "narty 24/25"];

function PhotoOrTopo({ photo, className, sizes, priority }: { photo?: Photo; className: string; sizes: string; priority?: boolean }) {
  if (!photo)
    return (
      <div className={`relative overflow-hidden bg-secondary text-foreground/15 ${className}`}>
        <TopoPattern className="absolute inset-0 size-full" />
      </div>
    );
  return (
    <figure className={`relative overflow-hidden bg-muted ${className}`}>
      <Image src={photo.file} alt={photo.title} fill sizes={sizes} priority={priority} className="object-cover" />
      <figcaption className="absolute right-2 bottom-2 rounded-sm bg-black/45 px-1.5 py-0.5 text-[10px] text-white/85">{photoCredit(photo)}</figcaption>
    </figure>
  );
}

async function SnowList() {
  await connection();
  const resorts = getResorts();
  const outlook = await getSnowOutlook(resorts).catch(() => null);
  if (!outlook) return <p className="text-sm text-muted-foreground">Prognoza chwilowo niedostępna.</p>;
  const top = outlook
    .slice()
    .sort((a, b) => b.next7 - a.next7 || a.temp - b.temp)
    .slice(0, 6)
    .map((o) => ({ o, r: resorts.find((r) => r.slug === o.slug)! }));
  return (
    <ul className="divide-y border-y">
      {top.map(({ o, r }) => {
        const photo = resortPhoto(r.slug);
        return (
          <li key={r.slug}>
            <Link href={`/narciarstwo/osrodki/${r.slug}#prognoza`} className="group grid grid-cols-[56px_1fr_auto] items-center gap-4 py-3">
              <span className="relative block h-11 w-14 overflow-hidden rounded-sm bg-secondary">
                {photo ? <Image src={photo.file} alt="" fill sizes="56px" className="object-cover" /> : <WeatherIcon code={o.code} className="m-auto mt-1.5 size-8" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium group-hover:underline">{r.name}</span>
                <span className="text-sm text-muted-foreground">
                  {r.range} · {Math.round(o.temp)}° na szczycie
                </span>
              </span>
              <span className="text-right">
                <span className="block font-heading text-lg font-semibold text-snow tabular-nums">{o.next7.toLocaleString("pl-PL")} cm</span>
                <span className="text-xs text-muted-foreground">śniegu w 7 dni</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SectionHead({ title, subtitle, href, link }: { title: string; subtitle?: string; href?: string; link?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {link} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function grid(products: ProductSummary[]) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.ski.slug} product={p} />
      ))}
    </div>
  );
}

export default function Home() {
  const products = getProductSummaries();
  const drops = biggestDrops(8);
  const [mainArticle, ...articles] = getArticles();
  const updated = new Date(PRICES_UPDATED_AT).toLocaleDateString("pl-PL", { day: "numeric", month: "long" });

  const cheapest = (pred: (p: ProductSummary) => boolean) =>
    products
      .filter((p) => pred(p) && p.min !== undefined)
      .sort((a, b) => a.min! - b.min!)
      .slice(0, 4);

  const uses = [
    { id: "trasa", label: "Na trasę", hint: "Talia 70–80 mm, uniwersalne na polskie stoki", href: "/narciarstwo/narty-zjazdowe?przeznaczenie=on-piste", pred: (p: ProductSummary) => p.ski.category === "on-piste" },
    { id: "slalom", label: "Slalom", hint: "Krótki skręt, talia 66–70 mm", href: "/narciarstwo/narty-zjazdowe?przeznaczenie=slalom", pred: (p: ProductSummary) => p.ski.category === "slalom" },
    { id: "allm", label: "All-mountain", hint: "Trasa i miękki śnieg, 84–96 mm pod butem", href: "/narciarstwo/narty-zjazdowe?przeznaczenie=all-mountain", pred: (p: ProductSummary) => p.ski.category === "all-mountain" },
    { id: "beg", label: "Dla początkujących", hint: "Łatwe w prowadzeniu, wybaczają błędy", href: "/narciarstwo/narty-zjazdowe?poziom=beginner", pred: (p: ProductSummary) => p.ski.levels.includes("beginner") },
    { id: "women", label: "Damskie", hint: "Lżejsze, wiązanie bliżej środka narty", href: "/narciarstwo/narty-zjazdowe?plec=damskie", pred: (p: ProductSummary) => p.ski.gender === "women" },
  ];
  const tabs = uses.map(({ pred, ...t }) => ({ ...t, content: grid(cheapest(pred)) }));
  const hero = heroPhoto();
  const shortcuts = [
    { icon: MountainSnow, title: "Narty zjazdowe", text: `${products.length} modeli, ceny z ${getShops().length} sklepów`, href: "/narciarstwo/narty-zjazdowe" },
    { icon: Ruler, title: "Dobierz narty", text: "Długość i model do wzrostu i stylu jazdy", href: "/dobor-nart" },
    { icon: MapPin, title: "Ośrodki narciarskie", text: `${getResorts().length} stoków, cenniki i prognoza śniegu`, href: "/narciarstwo/osrodki" },
    { icon: Radar, title: "Radar ogłoszeń", text: "Używane narty i buty z OLX i Vinted", href: "/radar" },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[oklch(0.17_0.015_262)] text-white">
        {hero && (
          <Image
            src={hero.file}
            alt={hero.title}
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-[center_45%]"
          />
        )}
        {/* 60% granatu: biały tekst ma na jasnym śniegu kontrast min. 5:1 (WCAG AA) */}
        <div className="absolute inset-0 -z-10 bg-[oklch(0.17_0.015_262/0.6)]" />
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-28 md:pt-24 md:pb-36 lg:pt-28 lg:pb-40">
          <p className="text-sm font-medium">
            Narty zjazdowe · {products.length} modeli · ceny z {getShops().length} sklepów, sprawdzone {updated}
          </p>
          <h1 className="mt-3 max-w-3xl text-[2.4rem] leading-[1.02] font-bold sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            Znajdź swoje narty w najlepszej cenie
          </h1>
          <p className="mt-5 max-w-xl text-lg md:text-xl">
            Ceny z polskich sklepów w jednym miejscu, pełne specyfikacje producentów i alert, gdy cena spadnie.
          </p>
          <div className="mt-8 max-w-xl">
            <HeroSearch />
          </div>
          <p className="mt-4 text-sm">
            Często szukane:{" "}
            {POPULAR.map((q, i) => (
              <span key={q}>
                {i > 0 && <span className="mx-1.5">·</span>}
                <Link href={`/szukaj?q=${encodeURIComponent(q.replace("narty ", ""))}`} className="font-medium underline-offset-2 hover:underline">
                  {q}
                </Link>
              </span>
            ))}
          </p>
        </div>
        {hero && <p className="absolute top-2 right-3 text-[10px] text-white/60">{photoCredit(hero)}, odbicie lustrzane</p>}
      </section>

      <nav aria-label="Na skróty" className="relative z-10 mx-auto -mt-16 max-w-7xl px-4">
        <ul className="grid grid-cols-2 overflow-hidden rounded-md border bg-card lg:grid-cols-4">
          {shortcuts.map((s, i) => (
            <li key={s.href} className={`${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
              <Link href={s.href} className="group flex h-full gap-3.5 p-4 transition-colors hover:bg-muted md:p-5">
                <s.icon className="mt-0.5 size-6 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-heading font-semibold">
                    {s.title}
                    <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{s.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12">
        <Reveal>
          <section>
            <SectionHead title="Największe obniżki" subtitle="Najniższa cena względem ceny regularnej w sklepie" href="/narciarstwo/narty-zjazdowe" link="Cały katalog" />
            <CardCarousel>
              {drops.map((p) => (
                <ProductCard key={p.ski.slug} product={p} />
              ))}
            </CardCarousel>
          </section>
        </Reveal>

        <Reveal>
          <section className="grid overflow-hidden rounded-md border md:grid-cols-2">
            <PhotoOrTopo photo={generalPhoto(1)} className="min-h-64" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="flex flex-col justify-center p-8 md:p-10">
              <p className="text-sm font-medium text-primary">Dobór nart</p>
              <h2 className="mt-2 text-3xl font-semibold">Jaka długość i jaki model?</h2>
              <p className="mt-3 text-muted-foreground">
                Pięć pytań: wzrost, waga, poziom, styl jazdy i budżet. Dostajesz długość dla każdego modelu, dopasowanie w
                procentach i sklep z najniższą ceną.
              </p>
              <ol className="mt-5 space-y-2 text-sm">
                {["Wzrost, waga i poziom", "Styl jazdy i rodzaj śniegu", "Budżet i wiązanie"].map((s, i) => (
                  <li key={s} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <Button asChild size="lg" className="mt-6 h-11 w-fit px-5">
                <Link href="/dobor-nart">
                  Zacznij dobór <ArrowRight />
                </Link>
              </Button>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <SectionHead title="Według rodzaju jazdy" subtitle="Najtańsze modele w każdej grupie" />
            <UseTabs tabs={tabs} />
          </section>
        </Reveal>

        <Reveal>
          <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <SectionHead title="Gdzie jechać w ten weekend" subtitle="Prognoza śniegu dla szczytów, odświeżana co godzinę" href="/narciarstwo/osrodki" link="Wszystkie ośrodki" />
              <Suspense fallback={<div className="h-72 animate-pulse rounded-md bg-muted" />}>
                <SnowList />
              </Suspense>
            </div>
            <div>
              <SectionHead title="Poradniki" href="/artykuly" link="Wszystkie" />
              <div className="grid gap-4">
                <ArticleCard article={mainArticle} large />
                {articles.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
