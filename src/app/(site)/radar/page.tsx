import { ArrowRight, Bell, BellRing, Check, Filter, Repeat, Search, ShoppingBag, Tags } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { bestOffer, formatPrice } from "@/lib/catalog";
import { PLANS } from "@/lib/radar/plans";
import { SOURCES, type SourceId } from "@/lib/radar/sources";
import { getSki } from "@/lib/skis";

export const metadata: Metadata = {
  title: "Apex Radar: radar ogłoszeń z nartami i butami narciarskimi",
  description:
    "Ustaw filtry raz, a Apex Radar przegląda ogłoszenia z nartami i butami narciarskimi na OLX i Vinted. Gdy coś pasuje, dostajesz powiadomienie na e-mail i Discorda.",
};

interface Sample {
  title: string;
  detail: string;
  price: number;
  source: SourceId;
  ago: string;
  image?: string;
  /** cena nowej pary w sklepach do porównania */
  fresh?: number;
}

// Przykładowe powiadomienia do podglądu (modele z katalogu, ceny ogłoszeń przykładowe).
function samples(): Sample[] {
  const ski = (slug: string, len: number, price: number, source: SourceId, cond: string, ago: string): Sample | null => {
    const s = getSki(slug);
    if (!s) return null;
    return {
      title: `${s.brand} ${s.model.replace(/\s*\+.*$/, "")} ${len} cm`,
      detail: cond,
      price,
      source,
      ago,
      image: s.image ?? undefined,
      fresh: bestOffer(slug)?.price,
    };
  };
  return [
    ski("atomic-redster-s9-revoshock-s-2025-26", 165, 1850, "olx", "jak nowe, 1 sezon", "4 min temu"),
    { title: "Tecnica Mach1 MV 120", detail: "rozmiar 27.5 (EU 43), stan bardzo dobry", price: 690, source: "vinted", ago: "11 min temu" },
    ski("volkl-mantra-88-2026-27", 177, 1490, "vinted", "stan bardzo dobry", "26 min temu"),
  ].filter((s): s is Sample => s !== null);
}

const BENEFITS = [
  {
    icon: Repeat,
    title: "Jeden radar zamiast kilku kart",
    text: "Nie odświeżasz OLX i Vinted na zmianę. Jedno wyszukiwanie przegląda oba serwisy, a wyniki trafiają na jedną listę.",
  },
  {
    icon: BellRing,
    title: "Jesteś pierwszy przy okazji",
    text: "Nowe ogłoszenie, które pasuje, ląduje od razu na Twoim e-mailu i Discordzie: ze zdjęciem, ceną, stanem i linkiem do oferty.",
  },
  {
    icon: Filter,
    title: "Filtry jak w dobrym sklepie",
    text: "Model z katalogu albo kilka marek po przecinku, długość nart, rozmiar butów w EU lub mondopoint, budżet i stan.",
  },
  {
    icon: Tags,
    title: "Od razu wiesz, czy to okazja",
    text: "Przy nartach z katalogu widzisz, o ile taniej jest od najniższej ceny nowej pary w polskich sklepach.",
  },
];

const AUDIENCES = [
  {
    icon: Search,
    title: "Szukasz sprzętu dla siebie",
    points: [
      "Kupujesz konkretny model w swojej długości lub rozmiarze, a nie pierwszą lepszą parę",
      "Nie przepłacasz, bo dobre ogłoszenia widzisz, zanim znikną",
      "Nie tracisz wieczorów na przeglądanie tych samych wyników",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Handlujesz nartami i butami",
    points: [
      "Do 25 wyszukiwań naraz: każda marka, rozmiarówka i przedział cen osobno",
      "Wyłapujesz najlepszy towar, zanim zobaczy go konkurencja",
      "Powiadomienia na kanale Discorda, który możesz dzielić ze wspólnikiem",
    ],
  },
];

const STEPS = [
  {
    title: "Ustaw filtry",
    text: "Narty albo buty narciarskie, modele lub marki, długość lub rozmiar, cena i stan. Zapisujesz raz.",
  },
  {
    title: "Radar przegląda ogłoszenia",
    text: "W planie Pro co 15 minut sprawdzamy nowe ogłoszenia i rozpoznajemy model, rocznik, długość i rozmiar.",
  },
  {
    title: "Dostajesz powiadomienie",
    text: "E-mail i wiadomość na Discordzie z linkiem prosto do ogłoszenia. Wszystko widzisz też w panelu, z sortowaniem po cenie.",
  },
];

const FAQ = [
  {
    q: "Skąd pochodzą ogłoszenia?",
    a: "Vinted przeglądamy na bieżąco, z filtrami kategorii, ceny i stanu po stronie serwisu, i linkujemy do konkretnej oferty. Z OLX w tej wersji pokazujemy próbkę ogłoszeń, bo OLX blokuje automatyczne pobieranie; pełne dołączymy po uzyskaniu zgody serwisu. Allegro dołączymy przez oficjalne API.",
  },
  {
    q: "Czy radar obsługuje buty narciarskie?",
    a: "Tak. Wybierasz, czy buty są męskie, damskie czy dziecięce, wpisujesz marki lub modele (np. tecnica, scarpa) i zakres rozmiarów w EU albo w centymetrach (mondopoint). Radar odrzuca buty trekkingowe i wysokogórskie.",
  },
  {
    q: "Jak podłączyć Discorda?",
    a: "Na swoim serwerze Discorda tworzysz webhook kanału (Edytuj kanał → Integracje → Webhooki), kopiujesz adres i wklejasz go w Panel → Konto. Od razu wyślemy wiadomość testową.",
  },
  {
    q: "Czym różni się plan Free od Pro?",
    a: "Free to 2 wyszukiwania i jedno podsumowanie dziennie. Pro to 25 wyszukiwań, skanowanie co 15 minut i powiadomienie od razu po pojawieniu się ogłoszenia, co przy dobrych okazjach robi różnicę.",
  },
  {
    q: "Czy mogę zrezygnować w każdej chwili?",
    a: "Tak. Plan Pro działa do końca opłaconego okresu, potem konto wraca do planu Free, a wyszukiwania zostają.",
  },
];

export default function RadarPage() {
  return (
    <>
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-medium text-primary">Apex Radar · narty i buty narciarskie</p>
            <h1 className="mt-3 text-[2.15rem] leading-[1.05] font-bold sm:text-4xl md:text-5xl">
              Radar ogłoszeń, dzięki któremu żadna okazja Cię nie ominie
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Ustawiasz, czego szukasz: narty albo buty, model, rozmiar i budżet. Radar przegląda OLX i Vinted za Ciebie i daje
              znać na e-mail i Discorda, gdy tylko pojawi się pasujące ogłoszenie.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href="/radar/rejestracja">
                  Załóż konto za darmo <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5">
                <a href="#film">Zobacz, jak działa</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Masz konto?{" "}
              <Link href="/radar/logowanie" className="text-foreground underline underline-offset-2">
                Zaloguj się
              </Link>
            </p>
          </div>

          <div className="rounded-md border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <span className="flex size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Bell className="size-4" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">3 nowe ogłoszenia z Twoich wyszukiwań</p>
                <p className="text-xs text-muted-foreground">Apex Radar · przykład powiadomienia na e-mail i Discorda</p>
              </div>
            </div>
            <ul className="divide-y">
              {samples().map((s) => (
                <li key={s.title} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-3">
                  <span className="relative flex h-16 w-14 items-center justify-center rounded-sm bg-muted">
                    {s.image ? (
                      <Image src={s.image} alt="" fill sizes="56px" className="object-contain py-1" />
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground">buty</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {s.title}, {s.detail}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: SOURCES[s.source].color }} />
                      {SOURCES[s.source].label} · {s.ago}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-heading font-semibold tabular-nums">{formatPrice(s.price)}</span>
                    {s.fresh && <span className="text-xs font-medium text-deal">−{Math.round((1 - s.price / s.fresh) * 100)}% vs nowe</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-14">
        <section id="film" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-3">
            <h2 className="text-2xl font-semibold">Apex Radar w minutę</h2>
            <p className="text-sm text-muted-foreground">Od ustawienia filtrów do powiadomienia na Discordzie</p>
          </div>
          <video
            className="mt-6 aspect-video w-full rounded-md border bg-black"
            controls
            preload="metadata"
            playsInline
            poster="/video/apex-radar-poster.jpg"
          >
            <source src="/video/apex-radar.mp4" type="video/mp4" />
            <track kind="captions" src="/video/apex-radar.vtt" srcLang="pl" label="Polski" default />
          </video>
        </section>

        <section>
          <h2 className="border-b pb-3 text-2xl font-semibold">Co zyskujesz</h2>
          <div className="mt-6 grid gap-x-8 gap-y-10 md:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex gap-4">
                <b.icon className="mt-1 size-6 shrink-0 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                  <p className="mt-1.5 text-muted-foreground">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="border-b pb-3 text-2xl font-semibold">Dla kogo</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="rounded-md border p-6">
                <div className="flex items-center gap-3">
                  <a.icon className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold">{a.title}</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {a.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Check className="mt-1 size-4 shrink-0 text-deal" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="border-b pb-3 text-2xl font-semibold">Jak to działa</h2>
          <ol className="mt-6 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <p className="font-mono text-sm text-muted-foreground">0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="plany" className="scroll-mt-24">
          <h2 className="border-b pb-3 text-2xl font-semibold">Plany</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(["free", "pro"] as const).map((id) => {
              const p = PLANS[id];
              const pro = id === "pro";
              return (
                <div key={id} className={`rounded-md border p-6 ${pro ? "border-foreground" : ""}`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    {pro && <span className="rounded-sm bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Polecany</span>}
                  </div>
                  <p className="mt-3">
                    <span className="font-heading text-4xl font-bold tabular-nums">{p.priceMonthly} zł</span>
                    <span className="text-muted-foreground"> / miesiąc</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pro ? `albo ${p.priceYearly} zł za rok (oszczędzasz ${p.priceMonthly * 12 - p.priceYearly} zł)` : "bez opłat, bez karty"}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-deal" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={pro ? "default" : "outline"} className="mt-6 h-10 w-full">
                    <Link href={pro ? "/radar/rejestracja?plan=pro" : "/radar/rejestracja"}>
                      {pro ? "Zacznij z Pro" : "Załóż darmowe konto"}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <h2 className="text-2xl font-semibold">Pytania</h2>
          <Accordion type="single" collapsible className="border-t">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="flex flex-col items-start justify-between gap-6 rounded-md border p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Następna dobra para może pojawić się dziś</h2>
            <p className="mt-1.5 text-muted-foreground">Ustaw pierwsze wyszukiwanie w dwie minuty. Plan Free nie wymaga karty.</p>
          </div>
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/radar/rejestracja">
              Załóż konto za darmo <ArrowRight />
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}
