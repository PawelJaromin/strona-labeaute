# La Beauté Aldona Targiel – zebrane informacje (stan na 2026-10-16)

## Dane firmy
- Nazwa: La Beauté Aldona Targiel (na Booksy zapisana jako „La Beautè”, w logo „LA BEAUTÉ”)
- Forma: przedsiębiorca (jednoosobowa działalność), właścicielka Aldona Targiel
- Adres: Jagodowa 24, 43-180 Orzesze (dzielnica Zawada; w opisie salon pisze „Orzesze – Gardawice”)
- Współrzędne: 50.11789, 18.77495; plus code 4Q9F+5X Orzesze
- Telefon: 784 736 463 (Facebook, Google)
- E-mail: labeaute.at@gmail.com (Facebook)
- Facebook: https://www.facebook.com/labeaute.at (946 obserwujących, 25 opinii, 100% poleca)
- Instagram: https://www.instagram.com/labeaute_aldonatargiel/ (bio: „PMU ■ LAMINACJA ■ PAZNOKCIE ■ DEPILACJA LASEROWA ■ ORZESZE”); Facebook podaje też starszy adres instagram.com/labeaute_at
- Booksy: ID 102895, https://booksy.com/pl-pl/102895_la-beaute-aldona-targiel_salon-kosmetyczny_12634_orzesze
  - ocena 5,0 (4,98) ze 180 opinii; 178×5★, 1×4★, 1×2★
  - 46 zdjęć, 118 usług w 12 kategoriach, zakres cen 20–3240 zł
  - rezerwacja online wyłączona („wizyty tylko po wcześniejszej rezerwacji”, isOnlineService=false dla wszystkich usług) – przycisk „Umów” otwiera jednak okno rezerwacji Booksy
- Google Maps: ocena 4,7 z 29 opinii (27×5★, 2×1★), kategoria „Skin care clinic”, 36 zdjęć, oznaczenie „firma prowadzona przez kobietę”
  - BRAK godzin otwarcia w wizytówce Google (pole „Add hours” puste)
  - jako strona www podany jest Facebook – po uruchomieniu strony trzeba to podmienić
  - przycisk „Book online” prowadzi do Booksy (Reserve with Google)
- Własna strona www: brak. Domeny: labeaute.pl i labeaute-orzesze.pl nie mają rekordów DNS (sprawdzić dostępność u rejestratora); la-beaute.pl i labeaute.com.pl są zajęte przez inne firmy.

## Godziny otwarcia (Booksy)
| Dzień | Godziny |
|---|---|
| Poniedziałek | 07:00–18:00 |
| Wtorek | 08:30–20:00 |
| Środa | 09:00–17:00 |
| Czwartek | 08:30–20:00 |
| Piątek | 07:00–15:00 |
| Sobota, niedziela | zamknięte |

## Zespół (Booksy)
- Aldona (ID 177419) – makijaż permanentny, laser, brwi/rzęsy, henna, wosk, peeling, mezoterapia
- Żaneta (ID 451880) – paznokcie, pedicure
- Wiktoria (ID 598794) – paznokcie, pedicure
Zdjęcia personelu: `zdjecia/personel-*.jpg`

## Opis salonu (tekst z Booksy, do wykorzystania)
„La Beauté to miejsce stworzone z pasji do piękna i dbałości o każdy detal. Nasz salon znajduje się w Orzeszu – Gardawicach i od lat pomaga podkreślać naturalne piękno swoich klientek, oferując usługi na najwyższym poziomie. Specjalizujemy się w makijażu permanentnym, laserowym usuwaniu makijażu permanentnego i tatuaży, depilacji laserowej, stylizacji paznokci i pedicure, a także stylizacji brwi i rzęs. W La Beauté stawiamy na indywidualne podejście, bezpieczeństwo oraz naturalne efekty. Pracujemy na sprawdzonych produktach i nowoczesnym sprzęcie, a wszystkie narzędzia wielorazowego użytku poddajemy profesjonalnej sterylizacji. Materiały jednorazowe wykorzystujemy wyłącznie raz, dzięki czemu zapewniamy najwyższe standardy higieny. Tworzymy miejsce, w którym profesjonalizm łączy się z przyjazną atmosferą…”

Sprzęt wymieniany w nazwach usług: laser Nd:YAG Q-Switch (usuwanie tatuażu i makijażu permanentnego), Alma Baby Remove (epilacja laserowa), peeling węglowy, mezoterapia mikroigłowa.

## Kategorie usług (liczba pozycji, Booksy)
Popularne (5), PROMOCJA (7), Makijaż permanentny (10), Laser Nd-YAG Q-Switch (2), Lifting i laminacja (3), Epilacja laserowa Alma Baby Remove (47), Peeling węglowy (3), Pielęgnacja dłoni i paznokci (16), Henna (5), Depilacja woskiem (8), Pedicure (11), Mezoterapia mikroigłowa (1).
Pełna lista z cenami, czasami i opisami: `uslugi-booksy.json`.

## Identyfikacja wizualna (to, co już istnieje)
- Logo: złoty gradient, szeryfowe „LA BEAUTÉ” z ozdobnym „L”, nad napisem kontur lotosu, pod spodem odręczny podpis „Aldona Targiel”. Dostępne tylko jako JPEG 2143×2143 z Booksy (`zdjecia/logo-booksy.jpg`); wersja z wyciętym tłem: `zdjecia/logo-przezroczyste.png`, sam znak: `logo-znak.png`, sam napis: `logo-napis.png`. Do finalnej strony potrzebny plik wektorowy (SVG/PDF/AI) od właścicielki.
- Na starszych zdjęciach logo występuje w wersji miedzianej/różowego złota.
- Wnętrze: białe ściany ze sztukaterią, złote litery logo na ścianie, czarne welurowe fotele „muszle” na złotych nogach, biały marmur na podłodze, złote baterie i uchwyty. Czyli: biel + złoto + czerń + marmur.
- Zdjęcie właścicielki (cover z Booksy): `zdjecia/cover-aldona.jpg` (1166×655, dość małe – do hero przyda się większe).

## Booksy – co da się zintegrować
1. Oficjalne Booksy Public API (docs.booksy.com): tylko dla partnerów Booksy, płatne, klucze RSA wydawane po umowie; dokumentacja zwraca 401 bez dostępu. Dla pojedynczego salonu – niedostępne.
2. Oficjalny widget „Umów wizytę”: `<script src="https://booksy.com/widget/code.js?id=102895&country=pl&lang=pl"></script>` – tworzy przycisk, który otwiera okno rezerwacji Booksy na naszej stronie (tryb `mode=dialog`) albo osadza je w treści (`mode=inline`). Dodatkowo link bezpośredni: https://booksy.com/pl-pl/dl/show-business/102895 (przekierowuje na profil salonu).
3. Link do konkretnej usługi – DZIAŁA (sprawdzone 2026-10-16): okno rezerwacji w wersji „widget-2021” przyjmuje parametr `variantId` (ID wariantu usługi z `uslugi-booksy.json`, pole `variant_id`):
   `https://booksy.com/widget-2021/index.html?id=102895&lang=pl&country=pl&mode=dialog&theme=default&variantId=5126967`
   otwiera rezerwację od razu z wybraną usługą (test na „Makijaż permanentny brwi” przeszedł do wyboru terminu). Parametr `serviceId` nie działa, nowsza wersja „widget-2024” otwarta samodzielnie jest pusta, a `service_id` w adresie profilu nic nie zmienia. Uwaga: salon pozwala rezerwować tylko do 2 tygodni do przodu – gdy brak terminów, widget pokazuje komunikat „Brak wolnych terminów”.
4. Cennik „na żywo”: publiczna strona Booksy zawiera dane strukturalne JSON-LD ze wszystkimi 117 ofertami i cenami oraz pełny ładunek Nuxt z czasami trwania, opisami i kategoriami. Skrypt może pobierać je automatycznie (np. raz dziennie) i przebudowywać cennik na stronie. To nieoficjalne – jeśli Booksy zmieni układ strony, skrypt przestanie działać i strona powinna wtedy pokazywać ostatnią poprawną wersję cennika z datą aktualizacji.

## Do ustalenia z właścicielką
- logo w wektorze; zdjęcia w wysokiej rozdzielczości (wnętrze, zabiegi, zespół)
- domena (np. labeaute.pl) i hosting; adres e-mail na domenie
- czy ceny mają być na stronie (i czy z automatyczną synchronizacją), czy tylko linki do Booksy
- które usługi są „flagowe” (makijaż permanentny, depilacja laserowa?) i mają mieć własne podstrony
- opis zespołu, certyfikaty, polityka zadatków/odwołań, regulamin, RODO
- uzupełnienie godzin otwarcia i strony www w wizytówce Google

## Źródła
- Booksy: https://booksy.com/pl-pl/102895_la-beaute-aldona-targiel_salon-kosmetyczny_12634_orzesze
- Facebook: https://www.facebook.com/labeaute.at/
- Instagram: https://www.instagram.com/labeaute_aldonatargiel/
- Google Maps: https://www.google.com/maps/place/?q=place_id:ChIJQ5CkQJDLFkcRx7-H-PQnGxY
- Booksy widget: https://support.booksy.com/hc/en-us/articles/23480739244434
- Booksy API (profil zewnętrzny): https://github.com/api-evangelist/booksy
