# Apex Sport

Serwis z cenami i specyfikacjami sprzętu sportowego. Pokazuje najniższą cenę w sklepach partnerskich,
kieruje do sklepu linkiem afiliacyjnym i wysyła alerty o obniżkach. Na start jedna kategoria: narty
zjazdowe (każdy rocznik osobno), a w strefie narciarskiej lista polskich ośrodków. Założenia
biznesowe: [PROJEKT.md](PROJEKT.md).

Oferty sklepów są prawdziwe: każda prowadzi na kartę produktu w polskim sklepie internetowym, a cena
pochodzi z tej strony (data sprawdzenia przy ofercie). Serwis nie ma jeszcze umów afiliacyjnych, więc
linki są zwykłymi linkami do sklepów. Zdjęcia nart pochodzą z materiałów producentów.
Historia cen sprzed 25.10.2026 jest symulowana na potrzeby projektu (punkty z `"sim": true`
w `data/offers.json`); od 25.10.2026 punkty pochodzą z `npm run prices:update`.

## Uruchomienie

```bash
npm install
npm run dev              # http://localhost:3000
```

Wymaga Node 22+ (wbudowany `node:sqlite`). Baza `data/apex.db` tworzy się sama przy pierwszym użyciu.

## Jak przetestować alert cenowy

`npm run prices:update` otwiera karty produktów ze wszystkich ofert (1,5 s przerwy, bot przedstawia się
jako ApexSport), czyta cenę i dostępność z danych schema.org na stronie, zapisuje punkt historii
najniższej ceny i sprawdza alerty. `npm run prices:update -- <slug-produktu>` sprawdza jeden model.
Strony, z których nie udało się odczytać ceny, skrypt wypisuje na końcu; ich oferty zostają z poprzednią
ceną i datą. Skrypt uruchamia się ręcznie. Docelowo ceny przychodziłyby z feedów sieci afiliacyjnych.

Test alertu bez czekania na prawdziwą obniżkę: załóż alert na stronie produktu, podnieś jego próg w bazie
(`UPDATE alerts SET target_price = 99999` w `data/apex.db`) i uruchom `npm run prices:update -- <slug>`.
Bez `RESEND_API_KEY` e-mail trafia tylko do bazy, a status widać na `/alerty`.

## Strefa narciarska

- `npm run resorts:import`: lista ośrodków i statystyki (OpenSkiData).
- `npm run resorts:details`: trasy i wyciągi z OpenSkiData oraz ich geometria z OpenStreetMap (Overpass) do `public/maps/resorts/`. Wymaga `data/.cache/runs.csv` i `lifts.csv` z tiles.openskimap.org. Skrypt można wznawiać, bo pomija pobrane mapy.
- `npm run resorts:climate`: średnie opady śniegu z 10 sezonów (Open-Meteo, ERA5).
- Pogoda na żywo (warunki, 48 h, 16 dni, prognoza zespołowa ECMWF) jest pobierana z Open-Meteo przy wejściu na stronę i trzymana w cache przez godzinę (`src/lib/weather.ts`). Darmowe API Open-Meteo jest tylko do użytku niekomercyjnego.
- Opisy ośrodków: `data/resort-info.json`. Pełne cenniki skipassów (kategorie wiekowe, okresy, karnety godzinowe, wielodniowe, sezonowe): `data/resort-pricelists.json`.

## Dobór nart

`/dobor-nart`: kreator w 5 krokach. Cechy każdej narty (chwyt, stabilność, zwrotność, łatwość, miękki śnieg) są wyliczane ze specyfikacji w `src/lib/ski-traits.ts`, dopasowanie i długość dla każdego modelu w `src/lib/selector.ts`. Wynik jest zapisany w adresie strony, więc można go udostępnić.

## Apex Radar (monitor ogłoszeń)

Strona `/radar`, konto `/radar/rejestracja`, panel `/panel`: wyszukiwania (modele z katalogu, słowa kluczowe, cena, długość, stan, serwisy), znalezione ogłoszenia (zapisz/odrzuć), historia powiadomień, plan i konto. Plan Free: 2 wyszukiwania i dzienne podsumowanie. Plan Pro (19 zł/mies.): 25 wyszukiwań i powiadomienie od razu. Płatność jest atrapą, przycisk włącza Pro bez obciążenia.

- Prawdziwe ogłoszenia: Vinted, z publicznej strony katalogu (`src/lib/radar/vinted.ts`, wyłączenie `RADAR_VINTED=false`). Najwyżej 8 fraz na skan, 1,5 s przerwy, bot przedstawia się jako ApexRadar. OLX blokuje automatyczne pobieranie (403) i wymaga zgody serwisu. Allegro ma oficjalne REST API: adapter `src/lib/radar/allegro.ts` działa po ustawieniu `ALLEGRO_CLIENT_ID`, `ALLEGRO_CLIENT_SECRET` i weryfikacji aplikacji przez Allegro. Generator przykładowych ogłoszeń (`src/lib/radar/demo-source.ts`) włącza `RADAR_DEMO=true`.
- OLX: jednorazowa próbka 40 publicznych ogłoszeń w `data/olx-snapshot.json` (`src/lib/radar/olx-snapshot.ts`, wyłączenie `RADAR_OLX_SNAPSHOT=false`). Bot nie łączy się z OLX.
- Discord: użytkownik wkleja adres webhooka kanału w Panel → Konto. Powiadomienia (od razu i dzienne) idą tam razem z e-mailem, jako karty ze zdjęciem, ceną i linkiem (`src/lib/radar/discord.ts`).
- E-maile: `RESEND_API_KEY` i `ALERT_FROM`. Bez klucza wiadomości trafiają tylko do zakładki Powiadomienia.
- Skan cykliczny: `npm run radar:scan` (podsumowania: `npm run radar:digest`) albo `POST /api/radar/scan` z nagłówkiem `Authorization: Bearer $CRON_SECRET` (`?digest=1` dla podsumowań).
- Linki w e-mailach budowane są z `NEXT_PUBLIC_SITE_URL`.

## Stack

- Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- UI: shadcn/ui na Radix (`src/components/ui/`, dodawanie: `npx shadcn@latest add <komponent>`), ikony Lucide, animacje Motion, karuzele Embla, wyszukiwarka cmdk (Ctrl+K). Motyw w `src/app/globals.css`, font Onest.
- SQLite przez `node:sqlite`: alerty, kliknięcia w oferty, wysłane powiadomienia
- MapLibre GL + kafelki OpenFreeMap (mapy ośrodków)

## Dane

| Plik | Zawartość |
|---|---|
| `data/skis.json` | Narty: model + rocznik, długości, taliowanie, promień, zdjęcie, źródło |
| `data/shops.json` | Sklepy partnerskie: sieć afiliacyjna, prowizja, długość cookie |
| `data/offers.json` | Oferty sklepów (adres karty produktu, cena, data sprawdzenia) i historia najniższej ceny |
| `data/resorts.curated.json` → `data/resorts.json` | Ośrodki; statystyki z OpenSkiData (`npm run resorts:import`) |
| `data/schema.sql` | Schemat bazy SQLite |
| `src/content/articles.ts` | Artykuły redakcyjne |

Zasady: specyfikacje tylko od producentów (lub z archiwum ich stron i testów z danego sezonu),
nigdy hurtowo z katalogów konkurencji. Brakujących liczb nie zgadujemy. `needs_review: true`
oznacza dane niepotwierdzone u producenta.

## Najważniejsze ścieżki

| URL | Co robi |
|---|---|
| `/produkt/[slug]` | Karta produktu: najniższa cena, oferty, historia cen, alert, specyfikacja, inne roczniki |
| `/szukaj?q=` | Wyszukiwarka grupująca roczniki jednej linii („atomic s9”, „hero 24/25”) |
| `/narciarstwo/narty-zjazdowe` | Katalog z filtrami i porównywaniem |
| `/go/[offerId]` | Przekierowanie do sklepu + zapis kliknięcia |
| `/api/alerts` | Zakładanie, odczyt i anulowanie alertów |
| `/statystyki` | Panel demo: kliknięcia według sklepu i szacowana prowizja |
