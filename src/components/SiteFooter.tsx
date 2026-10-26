import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Narty",
    links: [
      ["Narty zjazdowe", "/narciarstwo/narty-zjazdowe"],
      ["Dobór nart", "/dobor-nart"],
      ["Porównaj modele", "/porownaj"],
      ["Poradniki", "/artykuly"],
    ],
  },
  {
    title: "Ośrodki",
    links: [
      ["Wszystkie ośrodki", "/narciarstwo/osrodki"],
      ["Szczyrk Mountain Resort", "/narciarstwo/osrodki/szczyrk-mountain-resort"],
      ["Kotelnica Białczańska", "/narciarstwo/osrodki/kotelnica-bialczanska"],
      ["Kasprowy Wierch", "/narciarstwo/osrodki/kasprowy-wierch"],
    ],
  },
  {
    title: "Konto",
    links: [
      ["Apex Radar", "/radar"],
      ["Panel Radar", "/panel"],
      ["Alerty cenowe", "/alerty"],
      ["Źródła danych", "/o-serwisie"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-card text-sm">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-muted-foreground">
            Ceny, specyfikacje i historia cen sprzętu sportowego z polskich sklepów.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title} className="flex flex-col gap-2.5">
            <p className="font-medium">{c.title}</p>
            {c.links.map(([label, href]) => (
              <Link key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs leading-relaxed text-muted-foreground">
          Ceny odczytujemy ze stron sklepów; przy każdej ofercie jest data sprawdzenia, a wiążąca jest cena w sklepie. Dane o ośrodkach
          © OpenStreetMap contributors (ODbL), pogoda Open-Meteo (CC BY 4.0), zdjęcia produktów: materiały producentów.
        </p>
      </div>
    </footer>
  );
}
