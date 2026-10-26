# Serwis narciarski — baza sprzętu, ośrodków i inteligentna porównywarka cen

> Dokument projektowy. Opisuje TYLKO stronę www (faza 1 szerszego pomysłu). Aplikacja mobilna
> (tracker GPS + integracja z zegarkami + inteligentna obsługa sprzętu) jest świadomym
> nie-celem tego dokumentu — zostanie opisana osobno, w innym dokumencie, gdy przyjdzie na to czas.

## 1. Intencja i dlaczego

Właściciel projektu jest narciarzem, interesuje się sprzętem i jazdą, i chce zbudować (z pomocą
Claude Code) serwis internetowy wokół narciarstwa, który realnie zarabia — nie jako hobby
poboczne, tylko jako biznes z przemyślanym modelem przychodu.

Punkt wyjścia: analiza konkurencji (skionline.pl, snow-online.com) pokazała, że istniejące
polskie portale narciarskie, mimo dużej ilości treści, zarabiają bardzo mało (skionline.pl:
~24 tys. zł przychodu w 2024 wg danych właściciela projektu). Diagnoza, dlaczego tak jest, i co
zrobić inaczej, jest fundamentem tego projektu.

### 1.1 Dlaczego istniejąca konkurencja słabo zarabia (research)

- **Sezonowość** — ruch skoncentrowany w 3-4 miesiącach, reklamodawcy nie płacą za coś co
  działa pół roku, a CPM-y w Polsce są i tak niskie.
- **Ruch niskiej intencji zakupowej** — sprawdzanie warunków śniegowych to ruch informacyjny,
  nie transakcyjny. Słabo konwertuje na cokolwiek płatnego.
- **Niskie prowizje pass-through** — 3-5% od pakietu wycieczkowego czy polisy ubezpieczeniowej
  to grosze, a duzi gracze (OTA) i tak przejmują większość ruchu transakcyjnego.
- **Brak przychodu powtarzalnego** — wszystko oparte o jednorazowe kliknięcia/wyświetlenia,
  zero subskrypcji, zero stałych kontraktów B2B.
- skionline.pl ma katalog i rankingi sprzętu (WorldSkiTest), ale **żadnej porównywarki cen ani
  mechanizmu dokańczającego transakcję**. snow-online.com (europejski odpowiednik tego samego
  schematu) ma ten sam problem — treści + reklama, zero warstwy transakcyjnej.
- Kontrprzykład z USA: OnTheSnow żyje z reklam/sponsoringu (ten sam słaby model co polskie
  portale). **OpenSnow sprzedaje realną subskrypcję (50-100$/rok)**, bo zbudowało własny, lepszy
  model prognozy pogody (PEAKS) — coś, czego nie ma nigdzie indziej za darmo. Wniosek: własny,
  unikalny produkt/dane = realna subskrypcja; agregacja cudzych danych = grosze z reklam.

### 1.2 Zasada przewodnia projektu

**Budować wokół treści i narzędzi o wysokiej intencji zakupowej (sprzęt), a nie wokół czystej
treści informacyjnej (warunki na stoku).** Ktoś szukający "jakie narty kupić" jest o krok od
wydania pieniędzy — ten sam ruch, mniejszy wolumen niż "pogoda na stoku dziś", ale wielokrotnie
lepiej się monetyzuje. Dodatkowo: treść sprzętowa działa **również poza sezonem** (ludzie kupują
sprzęt sierpień-listopad, przed sezonem), więc łagodzi problem sezonowości, którego konkurencja
w ogóle nie adresuje.

Druga zasada: **warstwa, której nie ma ani skionline (treść bez porównywarki), ani generyczne
porównywarki typu Ceneo/Skąpiec (cena bez wiedzy czy produkt pasuje)** to połączenie:
„te narty pasują do Ciebie (na bazie wzrostu/wagi/stylu jazdy) + oto gdzie są najtaniej teraz”.
To jest realna nisza do zagospodarowania — nie próbujemy wygrać z Ceneo w czystym porównywaniu
cen (przegramy przez ich autorytet domeny), tylko łączymy ekspertyzę doboru sprzętu z
transakcją w jednym miejscu.

## 2. Cele, nie-cele, anty-cele

### Cele
- Zbudować serwis, który **realnie zarabia** w pierwszym roku działania, nie tylko generuje ruch.
- Zbudować **własną, unikalną warstwę danych/wartości** (personalizowany dobór sprzętu + alerty
  cenowe + wizytówki lokalnych biznesów), a nie kolejny agregator treści.
- Monetyzacja **zdywersyfikowana docelowo** (nie koniecznie od dnia 1): afiliacja transakcyjna
  + CPC w Fazie 1, B2B (wizytówki) i newsletter dołączane w Fazie 3, gdy jest już ruch
  uzasadniający ich wartość (patrz sekcja 7) — nie poleganie finalnie na jednym, słabym
  strumieniu (jak czysta reklama display u konkurencji).
- Ograniczyć ryzyko sezonowości treścią sprzętową, która działa też poza sezonem.

### Nie-cele (świadomie poza zakresem TEGO dokumentu)
- Aplikacja mobilna (tracker GPS, integracja z Apple Watch/Garmin, inteligentna obsługa
  sprzętu ze skanowaniem zdjęć) — osobny projekt, osobny dokument, później.
- Analiza/predykcja tłoku na stokach (kamery, computer vision) — odrzucone jako zbyt trudne na
  start (brak danych historycznych, ciężkie do zbudowania bez istniejącej bazy userów) i zbyt
  wąskie jako rdzeń produktu. Może wrócić w przyszłości jako dodatek, nie jako fundament.
- Pełne pokrycie całego świata ośrodków/sprzętu od dnia pierwszego (patrz zakres MVP niżej).

### Anty-cele (co by oznaczało porażkę, nawet gdyby technicznie działało)
- Serwis, który **wygląda jak kolejny skionline** — dużo treści, zero mechanizmu zarabiania
  poza bannerami.
- Rozpoczęcie od strony technicznie efektownej (np. rozpoznawanie sprzętu ze zdjęcia, live
  tłok z kamer), która odwleka uruchomienie realnej monetyzacji o miesiące.
- Poleganie wyłącznie na jednym strumieniu przychodu (np. tylko reklama display) — to
  dokładnie błąd konkurencji, który ten projekt ma naprawić.

## 3. Zakres MVP (Faza 1)

Żeby nie rozpraszać się na starcie, pierwsza wersja ma **celowo wąski zakres**:

- **Geografia:** tylko polskie ośrodki narciarskie (nie Alpy — to świadoma decyzja, łatwiej
  ruszyć i dogadać się z lokalnymi sklepami/ośrodkami; ekspansja na Alpy to decyzja na
  później, po walidacji modelu).
- **Liczba ośrodków:** ~20-30 największych/najpopularniejszych polskich ośrodków na start.
- **Kategoria sprzętu:** tylko narty zjazdowe (nie całe wyposażenie: buty, kije, odzież —
  to rozszerzenie na później).
- **Liczba modeli sprzętu:** ~100-200 najpopularniejszych, aktualnych modeli na start.

## 4. Produkt — funkcje

### 4.1 Rdzeń
1. **Baza sprzętu** — katalog modeli nart z pełną specyfikacją (długość, promień skrętu,
   szerokość talii, poziom zaawansowania, przeznaczenie terenowe).
2. **Baza ośrodków** — lokalizacja, wysokość, liczba wyciągów/tras, mapa, ceny skipassów.
3. **Personalizowany dobór sprzętu** — kalkulator/quiz: wzrost, waga, poziom, styl jazdy →
   konkretne rekomendowane modele (to jest nasza przewaga nad Ceneo, które tego nie robi).
4. **Porównywarka cen** — dla rekomendowanych/wybranych modeli pokazuje aktualne ceny z
   kilku sklepów naraz (dane z sieci afiliacyjnych, patrz sekcja 5). **Decyzja (builder
   check):** w MVP pokazujemy wyłącznie sklepy partnerskie, z których mamy feed afiliacyjny —
   nie wszystkie sklepy na rynku. To świadomy kompromis: każde kliknięcie jest monetyzowane i
   legalne (brak scrapowania cen konkurencji), kosztem tego, że "najtaniej" oznacza "najtaniej
   wśród partnerów", nie wśród całego rynku. Rozszerzenie na szersze pokrycie cen to decyzja na
   później, gdy lista partnerów urośnie.
5. **Alerty cenowe** — użytkownik ustawia próg ceny dla obserwowanego produktu, dostaje
   powiadomienie (e-mail / web push) gdy cena spadnie poniżej progu. Wymaga przechowywania
   historii cen z każdej aktualizacji feedu. To najprawdopodobniej najlepiej konwertujący
   mechanizm na całej stronie — użytkownik czekający na konkretną cenę i tak kupi w momencie
   powiadomienia. **Decyzja (builder check):** jednostką porównania/alertu jest **model +
   rocznik + długość** (traktowane jako osobne pozycje katalogowe, zbliżone do SKU) — model z
   poprzedniego sezonu to osobna pozycja, nie ta sama co model bieżący (zwykle inna, niższa
   cena, co jest zresztą atutem dla łowców okazji). Łączenie ofert z feedów z katalogiem
   odbywa się po EAN tam, gdzie dostępny, inaczej po dopasowaniu nazwa+rocznik+długość.
6. **Treści SEO** — poradniki zakupowe ("jakie narty wybrać", testy, porównania modeli) pod
   ruch o wysokiej intencji zakupowej, działające też poza sezonem.

### 4.2 Warstwa B2B (drugi silnik przychodu, wdrażany w Fazie 3)
7. **Płatne/wyróżnione wizytówki lokalnych biznesów** — szkółki narciarskie, wypożyczalnie,
   serwisy sprzętu przy konkretnych ośrodkach. Stały miesięczny abonament, przychód
   niezależny od wahań ruchu reklamowego. **Decyzja (builder check):** na start obsługa w pełni
   ręczna — właściciel sam pozyskuje klienta, wystawia fakturę, wpisuje treść wizytówki.
   Samoobsługowy panel z płatnościami cyklicznymi (Stripe/Przelewy24) ma sens dopiero przy
   kilkunastu+ klientach, nie w MVP tej funkcji. Uruchamiana dopiero, gdy strona ma już ruch
   dający realną wartość wizytówce (stąd Faza 3, nie Faza 1 — patrz sekcja 7).

### 4.3 Dodatkowe (po walidacji rdzenia, nie na dzień 1)
8. Newsletter ze sponsorowanymi treściami i snow-reportami.
9. Bezpośrednie umowy na skipassy z wybranymi ośrodkami (wyższa prowizja niż przez OTA).
10. Rozszerzenie kategorii sprzętu (buty, kije, odzież, deski snowboardowe).
11. Ekspansja geograficzna na Alpy.

## 5. Model monetyzacji

### 5.1 Strumienie przychodu (zdywersyfikowane od startu)

| Strumień | Mechanizm | Charakter |
|---|---|---|
| Afiliacja CPA (prowizja od sprzedaży) | Linki do sklepów przez sieci afiliacyjne | Zmienny, zależny od konwersji |
| Afiliacja/porównywarka CPC | Płatność za kliknięcie, przez programy CPC w sieciach afiliacyjnych | Stabilniejszy, niższa stawka jednostkowa |
| B2B — wizytówki lokalnych biznesów | Stały abonament miesięczny | Przewidywalny, nie zależy od ruchu |
| Newsletter sponsorowany | Treść płatna w mailingu | Dodatkowy, wymaga zbudowanej bazy |

### 5.2 Realne liczby z afiliacji (research sieci afiliacyjnych)

Przykładowe aktywne programy partnerskie w sieciach (do zweryfikowania po rejestracji, stawki
się zmieniają):

- **Skisport.pl** (Awin) — prowizja do 6,25%, cookie 30 dni
- **Sport-Shop.pl** (Webgains) — 7% od wartości netto zamówienia, cookie 30 dni
- **Sportroom.pl** (TradeTracker) — cookie 100 dni
- **S'portofino** (Admitad) — odzież narciarska sezonowo, **program wprost dopuszcza
  porównywarki cen jako źródło ruchu** (dobry sygnał zgodności modelu biznesowego)

Przykładowe wyliczenie — narty za 3500 zł:
- Przy 7% od netto (≈2845 zł): **~199 zł prowizji**
- Przy 6,25% od brutto: **~219 zł prowizji**
- Typowy zakres w branży sportowej: 3-8%, czyli **100-280 zł z jednej sprzedanej pary nart**

Ważne zastrzeżenia:
- Prowizja płatna jest **za dokończoną sprzedaż, nie za kliknięcie** — typowa konwersja
  klik→zakup w e-commerce to pojedyncze procent (1-5%).
- Okno atrybucji (cookie) zwykle 30 dni — zakup poza tym oknem bez ponownego kliknięcia nie
  jest wynagradzany.
- Żeby zarobić np. 5000 zł/mies. przy średniej prowizji ~200 zł, potrzeba **~25 dokończonych
  zakupów miesięcznie**, co przy konwersji ~2% oznacza **~1250 kliknięć w linki afiliacyjne
  miesięcznie** — wymaga realnego, trafionego ruchu.
- Warto uzupełnić model CPC — płatny za samo kliknięcie, niezależnie od zakupu — dla
  stabilniejszego, bardziej przewidywalnego minimum przychodu. **Decyzja (builder check):**
  realizujemy to wyłącznie przez programy CPC dostępne w sieciach afiliacyjnych (jeśli sklep
  taki oferuje), **nie** przez budowanie własnego systemu rozliczeń z bezpośrednimi umowami ze
  sklepami jak robi to Ceneo. Własny system CPC (panel dla sklepu, wykrywanie fałszywych
  kliknięć, fakturowanie, pozyskiwanie sklepów) to osobny produkt B2B porównywalny skalą z
  całym MVP — świadomie poza zakresem tego dokumentu.

### 5.3 Jak zacząć z linkami afiliacyjnymi

1. **Wymagana działająca strona** zanim sieci zaakceptują zgłoszenie.
2. Rejestracja jako wydawca w: **Awin, Webgains, TradeTracker, Admitad** + sprawdzić polskie
   sieci lokalne **MyLead, WebEpartners** (mogą mieć mniejsze, czysto polskie sklepy
   niedostępne w sieciach międzynarodowych).
3. Aplikacja do konkretnych programów partnerskich sklepów sportowych/narciarskich w każdej
   sieci (akceptacja zwykle szybka, czasem automatyczna).
4. Pobranie linków/feedów produktowych z paneli sieci i podpięcie do strony.

Formalności biznesowe (forma działalności, rozliczenia) — poza zakresem tego dokumentu,
ustalane osobno przez właściciela projektu.

**Ważne:** żadna pojedyncza sieć nie ma monopolu na sklepy narciarskie — są rozproszone
(widzieliśmy nawet, że sklep przeniósł się z Awin na Webgains w trakcie). Trzeba zarejestrować
się w kilku sieciach naraz, nie obstawiać jednej.

## 6. Dane o ośrodkach i sprzęcie — poza zakresem tego dokumentu

Skąd konkretnie będą pochodzić dane o ośrodkach narciarskich (geografia, trasy, ceny
skipassów, warunki) i o sprzęcie (specyfikacje modeli nart) — to świadomie **nie jest
rozstrzygane w tym pliku**. Właściciel projektu ustali to osobno, w oddzielnej rozmowie.

Ten dokument zakłada tylko, że przed startem Fazy 1 (sekcja 7) obie bazy danych (ośrodki,
sprzęt) są w jakiś sposób zasilone w zakresie opisanym w sekcji 3 (Zakres MVP) — mechanizm
pozyskania tych danych jest wejściem zewnętrznym do tego planu, nie jego częścią.

## 7. Plan realizacji krok po kroku

### Faza 0 — fundament
- Rejestracja domeny
- Wybór i konfiguracja stacku technicznego (patrz sekcja 8)

### Faza 1 — wąski MVP
- Zasilenie bazy ośrodków (20-30 ośrodków) i bazy sprzętu (100-200 modeli) danymi — źródła i
  sposób pozyskania ustalane osobno (patrz sekcja 6)
- Rejestracja w sieciach afiliacyjnych (Awin, Webgains, TradeTracker, Admitad, MyLead,
  WebEpartners), podłączenie pierwszych dostępnych programów i ich feedów cenowych
- Podstawowa strona: katalog ośrodków, katalog sprzętu, proste porównanie cen

### Faza 2 — funkcje wyróżniające
- Personalizowany kalkulator doboru sprzętu (wzrost/waga/styl jazdy → rekomendacja)
- Pełna porównywarka cen na bazie wszystkich podłączonych feedów
- Alerty cenowe (historia cen + powiadomienia e-mail/web push)

### Faza 3 — skalowanie przychodu
- Treści SEO (poradniki zakupowe, testy, porównania)
- Płatne wizytówki lokalnych biznesów (szkółki, wypożyczalnie, serwisy)
- Newsletter sponsorowany
- Rozszerzenie pokrycia danych (więcej marek/sklepów/ośrodków), ewentualnie kolejnych sieci
  afiliacyjnych

## 8. Stack techniczny — propozycja domyślna

To jest **propozycja, nie decyzja narzucona** — do zmiany przez buildera/właściciela projektu,
jeśli ma inne preferencje. Kryteria doboru: szybkość startu dla jednej osoby, dobre wsparcie
SEO (istotne dla treści i ruchu organicznego), łatwość rozbudowy o scrapery/cron joby.

- **Frontend/backend:** Next.js (React + TypeScript) — server-side rendering dobre pod SEO,
  jeden kod na front i proste API routes na backend.
- **Baza danych:** PostgreSQL + Prisma (ORM) — dobrze radzi sobie z relacyjnymi danymi
  (sprzęt, ośrodki, ceny, historia cen).
- **Styl:** Tailwind CSS — szybkie budowanie UI.
- **Hosting:** Vercel (dla aplikacji Next.js) + zarządzana baza danych (np. Supabase/Neon) —
  darmowe/tanie tiery startowe, łatwe wdrażanie.
- **Scrapery/zadania cykliczne:** osobny skrypt/worker (np. uruchamiany przez cron) do
  scrapowania producentów i odświeżania feedów cenowych — niekoniecznie część głównej
  aplikacji webowej.
- **Powiadomienia:** e-mail (np. Resend/SendGrid) na start; web push jako rozszerzenie.

## 9. Ryzyka i niepewności

- **Dostępność i warunki programów partnerskich** — stawki i dostępność sklepów w sieciach
  afiliacyjnych zmieniają się (widzieliśmy przykład przenosin między sieciami); realny obraz
  będzie znany dopiero po rejestracji.
- **Konwersja afiliacyjna jest niepewna do czasu realnego ruchu** — wyliczenia w sekcji 5.2 są
  szacunkowe, oparte o typowe branżowe wskaźniki, nie o zmierzone dane własne.
- **Strategia pozyskania danych (ośrodki, sprzęt) jest otwarta** (patrz sekcja 6) — jej
  ostateczny kształt może wpłynąć na tempo realizacji Fazy 1.

## 10. Co zostaje do decyzji buildera

- Skąd dokładnie pochodzą dane o ośrodkach i sprzęcie — świadomie poza zakresem tego dokumentu
  (sekcja 6), ustalane osobno.
- Dokładna lista 20-30 ośrodków i 100-200 modeli sprzętu na start.
- Dokładny wybór technologii, jeśli inny niż propozycja w sekcji 8.
- Kolejność integracji sieci afiliacyjnych (które najpierw).
- Szczegółowy design/UX strony (poza ogólnym zakresem funkcji opisanym w sekcji 4).
- Dokładny harmonogram/tempo realizacji faz (dokument nie zakłada konkretnych dat).
