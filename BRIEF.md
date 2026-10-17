# Brief: strona www La Beauté Aldona Targiel (wersja wstępna)

Ten plik jest instrukcją dla agentów budujących stronę. Czytaj go w całości. Fakty o salonie są w `J:\strona labeaute\dane\research.md`, pełna lista usług w `J:\strona labeaute\dane\uslugi-booksy.json`, zdjęcia w `J:\strona labeaute\dane\zdjecia\` (wersje do www w `zdjecia\web\`, logo z wyciętym tłem `logo-przezroczyste.png`, sam lotos `logo-znak.png`, sam napis `logo-napis.png`). Wybrane przez właściciela opcje z `J:\strona labeaute\propozycje\index.html`: **K1, T1, U3, H2, C1**.

## 1. Cel i zasady

- Profesjonalna, statyczna strona salonu kosmetycznego, tylko po polsku, gotowa do wgrania na zwykły hosting (Apache/OVH, jak `J:\strona\jaromind-site`).
- Projekt: `J:\strona labeaute\site` (Astro 5, Node 24 jest zainstalowany; `npm install` w tym folderze).
- Wzorzec techniczny: `J:\strona\jaromind-site` (przeczytaj jego `README.md`, `astro.config.mjs`, `package.json`, `src/layouts/Base.astro`, `src/styles/tokens.css`, `scripts/`). Skopiuj sprawdzone rozwiązania: `trailingSlash: 'always'`, `build.format: 'directory'`, `inlineStylesheets: 'never'`, `vite.server.watch.usePolling` (dysk J: nie obsługuje fs.watch), sitemap, `.htaccess` w `public/`, skrypty `check-contrast.mjs` i `linkcheck.py` (zaadaptuj do jednego języka), `make-icons.mjs` (zmień na ikonę z lotosu).
- **Nie wymyślaj faktów.** Rok założenia, certyfikaty, liczby zabiegów, nazwiska poza Aldona/Żaneta/Wiktoria, polityka zadatków, przeciwwskazania medyczne: jeśli nie ma tego w `research.md` ani w opisach usług z Booksy, nie pisz tego albo oznacz wyraźnie `[do uzupełnienia przez właścicielkę]` w komentarzu w kodzie i jako neutralne zdanie w treści. Opisy zabiegów pisz ogólnie i ostrożnie (bez obietnic medycznych, bez „bezbolesne”, „trwałe na zawsze”).
- Wygląd ma być **jak salon**: biel, złoto jako cienka linia i akcent, czerń w tekście i przyciskach. Zero „szablonu AI”: żadnych siatek kart z ikonkami, gradientowych plam, pastylkowych przycisków (pill), jednakowych cieni, zaokrąglonych rogów, stockowych ilustracji SVG. Zamiast tego: dużo światła, cienkie linie (hairline) w złocie, szeryfowe nagłówki, kwadratowe narożniki, prawdziwe zdjęcia, wiersze cennika jak w dobrej karcie menu.

## 2. System wizualny (K1 + T1)

Kolory (zapisz jako zmienne CSS w `src/styles/tokens.css`):

| Rola | Hex | Uwagi |
|---|---|---|
| tło | `#FFFFFF` | |
| tło sekcji / pasków | `#F6F2EA` | kość słoniowa |
| tekst | `#161616` | |
| tekst drugorzędny | `#6B655C` | 5,8:1 na bieli |
| złoto jasne | `#B8923F` | TYLKO linie, ramki, ozdobniki, logo; nigdy jako kolor tekstu |
| złoto do tekstu | `#8A6A2A` | 5,0:1 na bieli; eyebrow, drobne etykiety, linki w stopce |
| czerń przycisków | `#141414` | tekst na nim `#F6F2EA` |
| linie | `#E6DFD2` | |

Typografia (fonty lokalnie przez `@fontsource/cormorant-garamond` i `@fontsource/jost`, bez Google Fonts w przeglądarce):
- Nagłówki: Cormorant Garamond 500 (600 dla cen), `letter-spacing: -0.01em`, duże rozmiary (`clamp`).
- Tekst, nawigacja, cennik: Jost 300/400/500. Etykiety „eyebrow”: Jost 400, 11–12 px, `letter-spacing: .14em`, wielkie litery, kolor `#8A6A2A`.
- Przyciski: prostokątne, bez zaokrągleń, Jost 500, wielkie litery z rozstrzeleniem; główny czarny, drugorzędny obrys 1 px w złocie z tekstem `#8A6A2A`.
- Kontrast: każda para tekst/tło ≥ 4,5:1 (skrypt `check:contrast` ma to sprawdzać).

**Rytm stron (obowiązkowy, uwaga właściciela z innego projektu: „za mało kontrastów, wygląda jak niedokończone”).** Żadna strona nie może być w całości jasna. Każda strona, także podstrona: jasny nagłówek, pod nim **ciemny pas wstępu** (tło `#141414`, cienka złota linia `#B8923F`, eyebrow w `#D9BF86`, h1 i lead w `#F6F2EA`), dalej sekcje naprzemiennie biel / kość słoniowa `#F6F2EA`, a przed stopką **ciemny pas CTA** („Umów wizytę” + telefon) na `#141414`. Na stronie głównej hero H2 zostaje jasne (biel + zdjęcie), ale zaraz pod nim lub po sekcji „Zabiegi” ma być ciemny pas (np. opinie 5,0 / 180 albo pas CTA), a stopka jest ciemna. H1 podstron maks. ok. 3,3 rem; tekst drugorzędny ciemniejszy: używaj `#5A534C` (zamiast `#6B655C`) wszędzie poza bardzo dużymi rozmiarami. Przed oddaniem każdej strony zrób zrzut ekranu pierwszego ekranu (375 i 1440 px) i oceń: czy pierwszy ekran ma wyraźny kontrast ciemne/jasne i zdjęcie lub mocny element, a nie tylko wielki nagłówek na jasnym tle.

Logo: w nagłówku napis z `logo-napis.png` (wysokość ok. 28 px na desktopie, 22 px na telefonie), w stopce pełne `logo-przezroczyste.png`. Favicona i ikony: lotos `logo-znak.png` (wygeneruj PNG 16/32/180/192/512 i `favicon.ico`; `sharp` jest w zależnościach jaromind-site). Logo nie przerabiamy.

## 3. Struktura (U3)

Nawigacja (maks. 5 pozycji + przycisk): **Zabiegi · Cennik · O nas · Kontakt · [Umów wizytę]**. Na telefonie: menu rozwijane bez JS-owych frameworków (prosty `<details>` lub przycisk z `aria-expanded` i małym skryptem).

Strony (adresy z końcowym ukośnikiem):
1. `/` strona główna: hero H2 → „Zabiegi” (3 duże wiersze z linkami do podstron: makijaż permanentny, depilacja laserowa, usuwanie tatuażu i makijażu permanentnego) → „Pozostałe zabiegi” (paznokcie i pedicure, brwi i rzęsy, twarz: krótkie opisy + 2–3 popularne pozycje z ceną i „Umów”) → „O nas” (opis salonu z Booksy skrócony, zespół: Aldona, Żaneta, Wiktoria ze zdjęciami `personel-*.jpg`, standardy higieny z opisu) → „Opinie” (ocena 5,0 ze 180 opinii na Booksy i 4,7 z 29 w Google, 2–3 cytaty z research.md, link do Booksy) → „Kontakt” (adres, telefon `tel:`, e‑mail, godziny w tabeli, mapa jako link do Google Maps lub osadzony iframe bez ciasteczek, Facebook, Instagram, Booksy).
2. `/makijaz-permanentny/`: pełna podstrona: wstęp, dla kogo, przebieg wizyty (konsultacja → rysunek → pigmentacja → dopigmentowanie 6–12 tyg.), pielęgnacja po zabiegu (ogólnie), cennik tej kategorii (z JSON: kategorie „Makijaż permanentny” + pozycja „Makijaż permanentny brwi” z „Popularne”), zdjęcia `inspiracja-2.jpg` (usta), FAQ 4–6 pytań ostrożnie sformułowanych, CTA.
3. `/depilacja-laserowa/`: wstęp (Alma Baby Remove, pakiety 6 zabiegów), jak przygotować się do zabiegu (ogólnie), cennik całej kategorii „Epilacja laserowa Alma Baby Remove” + „PROMOCJA” pogrupowany (twarz / ręce / tułów / nogi / bikini), FAQ, CTA.
4. `/usuwanie-tatuazu/`: krótsza podstrona: laser Nd:YAG Q‑Switch, usuwanie tatuażu (od 200 zł) i makijażu permanentnego, remover, konsultacja; cennik kategorii „Laser nd-Yag Q-SWITCH” + pozycje usuwania z „Makijaż permanentny”.
5. `/cennik/`: wszystkie kategorie z JSON w kolejności Booksy (bez „Popularne” jako osobnej sekcji, chyba że jako „Najczęściej wybierane” na górze), filtr/kotwice po kategoriach, przy każdej pozycji czas, cena, przycisk „Umów”; na dole data aktualizacji z pliku danych.
6. `/polityka-prywatnosci/`: prosty tekst (strona statyczna bez cookies własnych; Booksy i mapa jako usługi zewnętrzne).
7. `404.html`.

Sekcja hero (H2): lewa kolumna tekst (eyebrow „Salon kosmetyczny · Orzesze”, nagłówek „Piękno w każdym detalu”, 1–2 zdania o ofercie, przyciski „Umów wizytę” i „Zobacz cennik”, pod spodem pasek: 5,0 · 180 opinii Booksy, 4,7 Google, adres), prawa kolumna zdjęcie wnętrza `salon-1.jpg` (na telefonie zdjęcie nad tekstem). Wszystkie zdjęcia z `dane\zdjecia\web` są tymczasowe (niska rozdzielczość) i mają `alt`.

## 4. Cennik i Booksy (C1)

- Źródło danych: `src/data/uslugi.json` w projekcie. Na start skopiuj `dane\uslugi-booksy.json` i dodaj pole `updatedAt` (ISO) oraz `source`.
- Skrypt `scripts/sync-booksy.py` (Python 3 stdlib, uruchamiany `python -I`): pobiera `https://booksy.com/pl-pl/102895_la-beaute-aldona-targiel_salon-kosmetyczny_12634_orzesze` z nagłówkiem User-Agent przeglądarki, parsuje (a) blok `<script type="application/ld+json">` typu BeautySalon (makesOffer: nazwa, cena; openingHoursSpecification; aggregateRating) oraz (b) `<script type="application/json" id="__NUXT_DATA__">` w formacie devalue (tablica, wartości to indeksy; obiekty `{"k": idx}`; listy `[idx,...]`; specjalne `["Reactive", idx]`, `["ShallowReactive", idx]`, `["Ref", idx]` → rozwiń idx; `["Set"|"Map"|"Date"|..., ...]` → lista; indeksy ujemne → null). Po rozwinięciu root `data["business:102895"]` ma `serviceCategories[]` → `services[]` (`id`, `name`, `description`, `stafferId`, `variants[0]` z `id` = variant_id, `price`, `servicePrice` (tekst „900,00 zł”), `duration` w minutach), `staff[]`, `openHours[]`, `reviewsCount`, `reviewsRank`. Skrypt zapisuje `src/data/uslugi.json` tylko, gdy parsowanie się powiodło i lista ma ≥ 50 pozycji; w przeciwnym razie zostawia stary plik i kończy kodem 1 z czytelnym komunikatem. Dodaj `npm run sync`.
- Przycisk „Umów wizytę” w nagłówku i w CTA: oficjalny widget Booksy. Osadź `<script src="https://booksy.com/widget/code.js?id=102895&country=pl&lang=pl"></script>` w miejscu przycisku (tryb `dialog`); ponieważ to zewnętrzny skrypt, w `.htaccess` CSP musi dopuszczać `https://booksy.com` (script, frame, style, connect, img). Jeśli skrypt nie załaduje się, przycisk ma być zwykłym linkiem do `https://booksy.com/pl-pl/dl/show-business/102895` (progressive enhancement: najpierw link, skrypt podmienia).
- Przycisk „Umów” przy pozycji cennika: link `https://booksy.com/widget-2021/index.html?id=102895&lang=pl&country=pl&mode=dialog&theme=default&variantId=<variant_id>` otwierany w prostym okienku modalnym z `<iframe>` (własny komponent `BookingModal.astro`: `<dialog>` + iframe, przycisk zamknięcia, zamykanie Esc, blokada przewijania tła, fokus), a bez JS zwykły link w nowej karcie (`target="_blank" rel="noopener"`). Pozycje z ceną „Zmienna” pokazują „cena ustalana indywidualnie”. Dopiski „+” po cenie (np. „150,00 zł+”) pokazuj jako „od 150 zł”.
- Booksy pozwala rezerwować do 2 tygodni do przodu; w cenniku i przy przycisku daj krótką informację „Rezerwacje online do 2 tygodni do przodu; w innym terminie zadzwoń: 784 736 463”.

## 5. SEO i techniczne

- `<title>` i `description` dla każdej strony (po polsku, z „Orzesze”), canonical, Open Graph (obraz OG 1200×630 wygenerowany skryptem jak w jaromind, z logo na kości słoniowej), `robots.txt`, `sitemap`, `site.webmanifest`.
- JSON-LD `BeautySalon` na stronie głównej: nazwa, adres (Jagodowa 24, 43-180 Orzesze), geo 50.11789/18.77495, telefon +48 784 736 463, e‑mail, `openingHoursSpecification` z research.md, `sameAs` (Facebook, Instagram, Booksy), `priceRange` „30–3240 zł”. Na podstronach usług `Service` z `provider`. Bez fałszywych `aggregateRating` (opinie są u Booksy/Google, nie na stronie; możesz podać `aggregateRating` tylko jeśli linkujesz źródło i wartości są z research.md).
- Adres produkcyjny: na razie `https://labeaute.example.pl` w jednym miejscu (`src/config/site.ts` + `astro.config.mjs`) z komentarzem, że domena jest do ustalenia.
- `npm run test` = `build` + `check:contrast` + `check:links` i ma przechodzić. `npm run dev` na porcie 4341, `npm run preview` na 4342 (`--host 127.0.0.1`).
- Dostępność: jeden `h1` na stronę, kolejność nagłówków, `alt`, fokus widoczny, menu obsługiwane klawiaturą, `lang="pl"`, kontrast.
- Wydajność: zdjęcia przez `astro:assets` (`<Image>`), rozmiary i `loading="lazy"` poza hero; CSS bez frameworków; żadnych zewnętrznych zasobów poza Booksy (widget) i ewentualną mapą.

## 6. Kontrola jakości (obowiązkowa przed oddaniem)

Każdy agent, który zmienia kod, przed zakończeniem uruchamia `npm run build` (bez błędów) i opisuje, co sprawdził. Agent kontroli końcowej uruchamia `npm run test`, `npm run preview` w tle i w przeglądarce wbudowanej sprawdza KAŻDĄ stronę przy 375, 768, 1024 i 1440 px: brak poziomego przewijania (`scrollWidth <= innerWidth`), brak nachodzących elementów (nagłówek sticky vs. kotwice, przyciski vs. tekst), czytelność, menu mobilne, modal rezerwacji (otwiera się, zamyka Esc), konsola bez błędów, wszystkie obrazy załadowane, wszystkie linki wewnętrzne 200. Zrzuty ekranu zapisuje opisem w raporcie (co, gdzie, wynik). Dodatkowo Lighthouse (`npx lighthouse@12 http://127.0.0.1:4342/ --preset=desktop --output=json --quiet --chrome-flags="--headless=new"`): cel ≥ 90 w każdej kategorii; jeśli niżej, raport ma wskazać przyczyny.
