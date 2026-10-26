@AGENTS.md

# Projekt: Apex Sport

- Założenia biznesowe: PROJEKT.md. Opis techniczny i dane: README.md.
- Rdzeń serwisu: najniższa cena → przejście do sklepu (afiliacja) + alerty cenowe. Katalog,
  porównania, artykuły i wyszukiwarka służą temu, żeby użytkownik doszedł do oferty.
- Komunikacja i treści strony po polsku. Teksty rzeczowe, bez sloganów marketingowych.
- Nie piszemy na stronie, jak serwis zarabia (prowizje, „jak działamy”).
- UI budujemy z komponentów shadcn/ui (`src/components/ui`) i tokenów motywu z `globals.css`;
  nagłówki zwykłą wielkością liter, bez wersalików i ciężkich, kontrastowych bloków.
- Styl: płaski jak w sklepach sportowych (evo, Ceneo): zaokrąglenia ~4 px, bez gradientów, rozmyć,
  cieni i „pigułek”, bez kafelków ze statystykami. Fonty: Archivo (nagłówki), Source Sans 3 (tekst),
  IBM Plex Mono (wymiary). Kobalt tylko dla akcji i linków, czerwień dla obniżek, błękit dla śniegu.
- Zdjęcia nart przechodzą przez `npm run images:normalize` (pion, bez tła, ten sam kadr).
- Dane nart tylko ze stron producentów (lub archiwum ich stron / testów z danego sezonu), nigdy
  hurtowo z katalogów konkurencji. Liczb nie zgadujemy, brakujące pole pomijamy.
- Oferty w `data/offers.json` są prawdziwe (karta produktu w sklepie + cena z dnia sprawdzenia).
  Nie dopisujemy ofert ani cen z głowy; każda musi mieć działający link do karty produktu.
  Wyjątek: historia cen sprzed 25.10.2026 jest symulowana (`"sim": true`), decyzja właściciela projektu.
- Next.js 16 z Cache Components: przed użyciem API sprawdź `node_modules/next/dist/docs/`.
