import type { Metadata } from "next";
import { getShops } from "@/lib/catalog";
import { RESORT_DATA_IMPORTED_AT } from "@/lib/resorts";

export const metadata: Metadata = {
  title: "Źródła danych",
  description: "Skąd pochodzą ceny, specyfikacje nart, dane o ośrodkach i prognozy pogody w Apex Sport.",
};

const SECTIONS = [
  {
    title: "Ceny",
    text: `Ceny odczytujemy z kart produktów w sklepach: ${getShops()
      .map((s) => s.name)
      .join(", ")}. Przy każdej ofercie podajemy datę sprawdzenia, a przycisk prowadzi prosto na kartę produktu w sklepie. Każdą zmianę najniższej ceny zapisujemy, więc z czasem przy produkcie rośnie historia cen. Wiążąca jest zawsze cena w sklepie.`,
  },
  {
    title: "Specyfikacje nart",
    text: "Parametry przepisujemy ze stron producentów, a dla starszych roczników z archiwalnych stron producentów i testów z danego sezonu. Przy każdym produkcie jest link do źródła. Każdy rocznik to osobna pozycja, bo producenci zmieniają taliowanie, rozmiarówkę i wiązania.",
  },
  {
    title: "Ośrodki narciarskie",
    text: `Położenie, trasy i wyciągi pochodzą z OpenSkiData i OpenStreetMap (import ${RESORT_DATA_IMPORTED_AT}), © OpenStreetMap contributors, Skimap.org, Who's On First, Mapterhorn, licencja ODbL. Cenniki skipassów i opisy przygotowujemy na podstawie stron ośrodków. Podkład mapy: OpenFreeMap.`,
  },
  {
    title: "Pogoda i śnieg",
    text: "Prognozy pochodzą z Open-Meteo (CC BY 4.0): modele ICON i ECMWF, w tym prognoza zespołowa ECMWF z 51 scenariuszami. Średnie opady z ostatnich 10 sezonów liczymy z reanalizy ERA5.",
  },
];

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Źródła danych</h1>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
