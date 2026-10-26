// Artykuły redakcyjne. Treść jako bloki, żeby w tekst dało się wstawiać karty produktów z cenami.

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "products"; slugs: string[] }
  | { type: "compare"; slugs: string[]; label: string };

export interface Article {
  slug: string;
  title: string;
  lead: string;
  date: string;
  category: string;
  readMinutes: number;
  cover: string;
  products: string[];
  body: Block[];
}

const ARTICLES: Article[] = [
  {
    slug: "atomic-redster-s9-czy-rossignol-hero-st-ti",
    title: "Atomic Redster S9 czy Rossignol Hero ST Ti?",
    lead: "Dwie sportowe slalomki z tą samą talią 68 mm. Różnią się dziobem, profilem i tym, co dostajesz w pudełku.",
    date: "2026-10-20",
    category: "Porównanie",
    readMinutes: 4,
    cover: "/images/skis/atomic-redster-s9-revoshock-s-2025-26.png",
    products: ["atomic-redster-s9-revoshock-s-2025-26", "rossignol-hero-elite-st-ti-2026-27", "atomic-redster-s9-2024-25"],
    body: [
      {
        type: "p",
        text: "Obie narty powstały z myślą o tym samym narciarzu: jeździ szybko po twardej trasie, lubi krótki skręt i nie potrzebuje, żeby narta wybaczała mu błędy. Na papierze są do siebie bardzo podobne, więc o wyborze decydują szczegóły.",
      },
      { type: "h2", text: "Wymiary" },
      {
        type: "p",
        text: "Redster S9 w długości 165 cm ma 118/68/104 mm i promień 12,5 m. Atomic zmienia szerokość dzioba i piętki razem z długością, więc 155 cm ma 115 mm z przodu, a 170 cm już 119,5 mm. Hero ST Ti ma we wszystkich długościach 123/68/103 mm, a promień rośnie od 11 m (157 cm) do 14 m (172 cm).",
      },
      {
        type: "p",
        text: "Szerszy o 5 mm dziób Rossignola mocniej wciąga nartę w skręt na początku łuku. S9 wchodzi w skręt spokojniej i bardziej równo prowadzi go do końca. Różnica jest wyczuwalna głównie przy krótkich, ciasnych skrętach na stromym stoku.",
      },
      { type: "h2", text: "Konstrukcja i profil" },
      {
        type: "p",
        text: "Atomic stosuje drewniany rdzeń z jesionu i topoli, tytanal, karbon i tłumik Revoshock S, a profil to pełny camber (Active Camber 0/100/0). Rossignol ma rdzeń bukowy, jedną pełną warstwę tytanalu i lekki rocker na dziobie. Ten rocker ułatwia początek skrętu przy mniejszej prędkości, ale na lodzie pełny camber Atomica trzyma krawędź pewniej.",
      },
      { type: "h2", text: "Wiązanie zmienia porównanie cen" },
      {
        type: "p",
        text: "S9 2025/26 sprzedawany jest z wiązaniem I 12 GW. Hero ST Ti 2026/27 to same narty z interfejsem Konect, wiązanie kupuje się osobno. Porównując ceny w tabeli ofert, dolicz do Rossignola koszt wiązania, zwykle kilkaset złotych.",
      },
      { type: "products", slugs: ["atomic-redster-s9-revoshock-s-2025-26", "rossignol-hero-elite-st-ti-2026-27"] },
      { type: "h2", text: "A może zeszłoroczny S9?" },
      {
        type: "p",
        text: "Redster S9 z rocznika 2024/25 ma tę samą geometrię i promienie co 2025/26. Różni się głównie wiązaniem: X 12 GW zamiast I 12 GW. Jeśli sklep wyprzedaje końcówkę serii, to najprostszy sposób, żeby kupić tę samą nartę taniej.",
      },
      { type: "products", slugs: ["atomic-redster-s9-2024-25"] },
      {
        type: "compare",
        slugs: ["atomic-redster-s9-revoshock-s-2025-26", "rossignol-hero-elite-st-ti-2026-27", "atomic-redster-s9-2024-25"],
        label: "Porównaj wszystkie trzy w tabeli",
      },
    ],
  },
  {
    slug: "szerokosc-pod-butem-68-76-94-mm",
    title: "68, 76 czy 94 mm pod butem: co zmienia szerokość narty",
    lead: "Szerokość talii to pierwszy parametr, po którym warto filtrować katalog. Pokazujemy na konkretnych modelach, co się zmienia co kilka milimetrów.",
    date: "2026-10-14",
    category: "Poradnik",
    readMinutes: 3,
    cover: "/images/skis/nordica-enforcer-94-2026-27.png",
    products: [
      "atomic-redster-s9-revoshock-s-2025-26",
      "fischer-the-curv-gt-76-2026-27",
      "nordica-enforcer-94-2026-27",
      "salomon-stance-pro-90-2026-27",
    ],
    body: [
      {
        type: "p",
        text: "Wąska narta szybciej przechodzi z krawędzi na krawędź i łatwiej ją docisnąć na twardym śniegu. Szeroka lepiej niesie w miękkim śniegu i w muldach, ale na ubitej trasie wymaga więcej siły, żeby postawić ją na krawędzi.",
      },
      { type: "h2", text: "Do 70 mm: slalomki" },
      {
        type: "p",
        text: "Atomic Redster S9, Rossignol Hero ST Ti i Elan Ace SLX mają 68 mm, Stöckli Laser SL nawet 66 mm. To narty na przygotowaną trasę i krótki skręt. Poza trasą zapadają się w śniegu.",
      },
      { type: "h2", text: "72–80 mm: trasa w każdych warunkach" },
      {
        type: "p",
        text: "W tym przedziale jest większość nart na trasę: Head Supershape e-Magnum (72 mm), Fischer The Curv GT 76, Völkl Peregrine 80. Dobrze trzymają na twardym, a po południu, gdy trasa jest rozjeżdżona, nie męczą tak jak slalomka. Dla kogoś, kto jeździ głównie w Polsce, to najbezpieczniejszy wybór.",
      },
      { type: "products", slugs: ["fischer-the-curv-gt-76-2026-27", "volkl-peregrine-80-2026-27"] },
      { type: "h2", text: "88–94 mm: all-mountain" },
      {
        type: "p",
        text: "Salomon Stance Pro 90, Blizzard Black Pearl 88 i Nordica Enforcer 94 mają rocker na dziobie i piętce. Unoszą się w świeżym śniegu i łatwiej skręcają w muldach. Na wąskich, oblodzonych trasach w Beskidach będą wolniej przechodzić z krawędzi na krawędź. Mają sens, jeśli jeździsz w Alpach albo szukasz jednej pary na trasę i poza nią.",
      },
      { type: "products", slugs: ["salomon-stance-pro-90-2026-27", "nordica-enforcer-94-2026-27"] },
    ],
  },
  {
    slug: "kiedy-kupic-narty-zeszloroczny-model",
    title: "Zeszłoroczny model: kiedy starszy rocznik ma sens",
    lead: "Producenci odświeżają kolekcje co roku, ale konstrukcja często zostaje ta sama. Sprawdzamy, co faktycznie zmieniło się w kilku popularnych liniach.",
    date: "2026-10-08",
    category: "Zakupy",
    readMinutes: 3,
    cover: "/images/skis/rossignol-hero-elite-st-ti-2024-25.jpg",
    products: [
      "atomic-redster-s9-2024-25",
      "rossignol-hero-elite-st-ti-2024-25",
      "elan-ace-slx-2024-25",
      "atomic-redster-g9-2024-25",
    ],
    body: [
      {
        type: "p",
        text: "Nowa kolekcja trafia do sklepów jesienią, a poprzedni rocznik zostaje na półkach do wyprzedania. W naszym katalogu każdy rocznik jest osobną pozycją, z własną specyfikacją i historią cen. Wpisz w wyszukiwarkę na przykład „atomic s9”, a zobaczysz wszystkie roczniki obok siebie.",
      },
      { type: "h2", text: "Ta sama narta, inna grafika" },
      {
        type: "p",
        text: "Rossignol Hero ST Ti 2024/25 (wtedy pod nazwą Hero Elite ST Ti Konect) ma taliowanie 123/68/104 mm i te same promienie co 2026/27. Nowszy rocznik dostał przeprojektowany dziób Power Tip i piętkę węższą o 1 mm. W obu przypadkach wiązanie kupuje się osobno, więc różnica w cenie to czysta oszczędność na samych nartach.",
      },
      {
        type: "p",
        text: "Podobnie Atomic Redster S9: geometria 2024/25 i 2025/26 jest identyczna, zmieniło się wiązanie.",
      },
      { type: "products", slugs: ["rossignol-hero-elite-st-ti-2024-25", "atomic-redster-s9-2024-25"] },
      { type: "h2", text: "Gdzie zmiany są realne" },
      {
        type: "p",
        text: "Elan Ace SLX w roczniku 2026/27 dostał szerszy dziób (123 zamiast 121 mm) i krótszą najmniejszą długość, od 145 cm. Atomic Redster G9 2024/25 występował w długościach 172–182 cm z talią 68 mm, a nowszy ma 166–181 cm i 67 mm. Przed zakupem starszego rocznika porównaj długości w tabeli: rozmiarówka potrafi się przesunąć.",
      },
      { type: "products", slugs: ["elan-ace-slx-2024-25", "atomic-redster-g9-2024-25"] },
      {
        type: "p",
        text: "Jeśli nie zależy Ci na najnowszym modelu, ustaw alert cenowy na starszy rocznik. Sprawdzamy ceny we wszystkich sklepach codziennie i napiszemy, gdy któryś zejdzie do Twojej kwoty.",
      },
    ],
  },
];

export function getArticles(): Article[] {
  return ARTICLES.slice().sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function articlesForProduct(productSlug: string): Article[] {
  return getArticles().filter((a) => a.products.includes(productSlug));
}

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
