/**
 * Treści strony /makijaz-permanentny/ (BRIEF.md, sekcja 3 pkt 2).
 *
 * Zasady (brief, sekcja 1):
 *  - tylko fakty z research.md i opisów usług w src/data/uslugi.json,
 *  - ceny, czasy i nazwy pozycji zawsze z danych (formatPrice / formatDuration / serviceName),
 *    nigdy wpisane ręcznie, bo `npm run sync` je odświeża,
 *  - opisy ogólne i ostrożne: bez obietnic medycznych, bez „bezbolesne”, „na zawsze”,
 *  - czego nie wiemy, oznaczamy `[do uzupełnienia przez właścicielkę]` w komentarzu i podajemy
 *    neutralne zdanie w treści.
 */
import { site } from '../config/site';
import {
  findService,
  formatDuration,
  formatPrice,
  getServices,
  getServicesByCategory,
  serviceName,
  type Service,
} from '../lib/uslugi';

/** Id usług z Booksy użyte na tej stronie. */
export const ID = {
  brwi: 1680751, // „Popularne”: Makijaż permanentny brwi
  usta: 1680768,
  lashLiner: 1680758,
  konsultacjaRysunek: 1680792,
  konsultacja: 5441747,
  dopigmentowanieUst: 5561544,
  dopigmentowanieNaZyczenie: 2522358,
  odswiezenieBrwi: 2620494,
  odswiezenieUst: 2620511,
  odswiezenieRzes: 2620577,
  remover: 4099985,
} as const;

/* ---------------------------------------------------------------- pomocnicze */

const NBSP = '\u00a0';
/** Zakres bez łamania wiersza po półpauzie (U+2060 = word joiner): „6–12”. */
const RANGE = '6–⁠12';

/** Spójniki jednoliterowe (a, i, o, u, w, z) nie zostają na końcu wiersza. */
const pl = (s: string) => s.replace(/(?<=^|[\s„(])([aiouwzAIOUWZ])\s+(?=\S)/g, `$1${NBSP}`);

const price = (id: number) => formatPrice(findService(id)?.price) || 'wg cennika';
const time = (id: number) => formatDuration(findService(id)?.duration_min) || 'wg cennika';
const label = (id: number) => {
  const s = findService(id);
  return s ? serviceName(s) : '';
};
const phone = site.phone.display;

/* ---------------------------------------------------------------- meta */

export const meta = {
  title: 'Makijaż permanentny w Orzeszu',
  // 50–165 znaków (check:links).
  description:
    'Makijaż permanentny brwi, ust i linii rzęs w salonie La Beauté w Orzeszu: konsultacja z rysunkiem wstępnym, dopigmentowanie, cennik i rezerwacja online.',
  serviceName: 'Makijaż permanentny',
  serviceType: 'Makijaż permanentny brwi, ust i linii rzęs',
};

/* ---------------------------------------------------------------- wstęp (ciemny pas) */

export const intro = {
  eyebrow: 'Zabiegi · Makijaż permanentny',
  lead: pl(
    `Pigmentacja brwi, ust i linii rzęs, którą wykonuje Aldona. Zabieg zaczyna się od konsultacji i rysunku wstępnego, a efekt dopracowuje dopigmentowanie po ${RANGE}${NBSP}tygodniach.`,
  ),
  imageAlt: 'Zbliżenie ust z makijażem permanentnym',
};

/* ---------------------------------------------------------------- dla kogo */

export const forWhom = {
  eyebrow: 'Dla kogo',
  title: 'Brwi, usta i linia rzęs',
  lead: pl(
    'Makijaż permanentny to pigmentacja skóry, która ma utrzymywać się dłużej niż zwykły makijaż. W La Beauté wykonuje ją Aldona; stawiamy na indywidualne podejście i naturalny efekt.',
  ),
  zones: [
    {
      title: 'Brwi',
      text: pl('Dla osób, które chcą wyraźniej zaznaczyć albo uzupełnić kształt brwi.'),
      meta: `Według cennika: ${price(ID.brwi)}, ${time(ID.brwi)}`,
    },
    {
      title: 'Usta',
      text: pl('Dla osób, które chcą podkreślić kontur lub kolor ust.'),
      meta: `Według cennika: ${price(ID.usta)}, ${time(ID.usta)}`,
    },
    {
      title: 'Linia rzęs',
      text: pl('Lash liner, czyli zagęszczenie linii rzęs na górnej powiece, dla osób, które chcą wyraźniej podkreślić oko.'),
      meta: `Według cennika: ${price(ID.lashLiner)}, ${time(ID.lashLiner)}`,
    },
    {
      title: 'Odświeżenie',
      text: pl('Dla osób, które wykonywały makijaż permanentny w La Beauté i chcą odświeżyć brwi, usta albo zagęszczenie rzęs.'),
      meta: `Według cennika: brwi ${price(ID.odswiezenieBrwi)}, usta ${price(ID.odswiezenieUst)}, rzęsy ${price(ID.odswiezenieRzes)}`,
    },
  ],
  // [do uzupełnienia przez właścicielkę]: lista przeciwwskazań do makijażu permanentnego.
  // Do czasu uzupełnienia strona odsyła do salonu i niczego nie przesądza.
  note: pl('O przeciwwskazania do zabiegu zapytaj salon przed rezerwacją, telefon:'),
  imageAlt: 'Zbliżenie oka z gęstymi, ciemnymi rzęsami',
};

/* ---------------------------------------------------------------- przebieg wizyty */

export const visit = {
  eyebrow: 'Przebieg wizyty',
  title: 'Od konsultacji do dopigmentowania',
  lead: pl('Makijaż permanentny to proces w czterech krokach; ostatni odbywa się kilka tygodni po pierwszej pigmentacji.'),
  steps: [
    {
      title: 'Konsultacja',
      text: pl('Rozmowa o tym, jaki efekt chcesz uzyskać i co będzie wyglądać naturalnie przy Twoich rysach. To dobry moment na pytania o zabieg.'),
    },
    {
      title: 'Rysunek wstępny',
      text: pl('Kształt jest najpierw rysowany wstępnie, żeby można go było ocenić i omówić zmiany, zanim zacznie się pigmentacja.'),
    },
    {
      title: 'Pigmentacja',
      text: pl(
        `Właściwy zabieg wykonuje Aldona. Czas według cennika: brwi ${time(ID.brwi)}, usta ${time(ID.usta)}, lash liner ${time(ID.lashLiner)}.`,
      ),
    },
    {
      title: 'Dopigmentowanie',
      text: pl(
        `Po ${RANGE}${NBSP}tygodniach efekt dopracowuje dopigmentowanie. Cennik przewiduje je dla osób, które miały zabieg w La Beauté w ciągu 3 miesięcy od pierwszej pigmentacji.`,
      ),
    },
  ],
  // [do uzupełnienia przez właścicielkę]: czy cena konsultacji wlicza się w cenę zabiegu
  // oraz czy konsultacja jest wymagana przed pierwszym zabiegiem. Treść nie przesądza.
  note: pl(
    `Konsultacje w cenniku: „${label(ID.konsultacja)}” (${time(ID.konsultacja)}, ${price(ID.konsultacja)}) oraz „${label(ID.konsultacjaRysunek)}” (${time(ID.konsultacjaRysunek)}, ${price(ID.konsultacjaRysunek)}). Czy cena konsultacji wlicza się w cenę zabiegu, ustal z salonem przy rezerwacji.`,
  ),
};

/* ---------------------------------------------------------------- po zabiegu */

export const aftercare = {
  eyebrow: 'Po zabiegu',
  title: 'Pielęgnacja po zabiegu',
  lead: pl('Kilka ogólnych zasad. Najważniejsze są zalecenia osoby wykonującej zabieg.'),
  // [do uzupełnienia przez właścicielkę]: konkretne zalecenia pielęgnacyjne salonu (preparaty, czas
  // gojenia, ograniczenia). Poniżej wyłącznie zasady ogólne, bez obietnic medycznych.
  items: [
    'Wygląd miejsca zabiegu i kolor pigmentu mogą zmieniać się podczas gojenia. Ostateczny efekt ocenia się po zagojeniu skóry i ewentualnym dopigmentowaniu.',
    'Nie drap i nie odrywaj skórek ani strupków, które mogą pojawić się w trakcie gojenia.',
    'W czasie gojenia chroń to miejsce przed słońcem, solarium i nadmiernym ciepłem (np. sauną) oraz nie używaj w tym miejscu drażniących kosmetyków ani zabiegów złuszczających.',
    'Do pielęgnacji używaj preparatów zalecanych przez osobę wykonującą zabieg.',
    `Umów dopigmentowanie po ${RANGE}${NBSP}tygodniach od pierwszej pigmentacji.`,
    'Jeśli zauważysz niepokojące objawy, skontaktuj się z salonem lub lekarzem.',
  ].map(pl),
  disclaimer: pl(
    'To ogólne wskazówki: nie zastępują zaleceń osoby wykonującej zabieg ani porady lekarza. Pytania o pielęgnację możesz zadać przy rezerwacji lub telefonicznie:',
  ),
};

/* ---------------------------------------------------------------- cennik */

export const pricing = {
  eyebrow: 'Cennik',
  title: 'Ceny makijażu permanentnego',
  lead: pl('Ceny i czasy zabiegów pochodzą z Booksy. Przycisk „Umów” otwiera rezerwację wybranej pozycji.'),
};

export interface PriceGroup {
  title: string;
  caption?: string;
  services: Service[];
}

/**
 * Grupy cennika: kategoria Booksy „Makijaż permanentny” (plus „Makijaż permanentny brwi”
 * z „Popularne”, brwi na początku), uporządkowana tematycznie. Pozycje, które pojawią się w tej
 * kategorii po `npm run sync`, trafiają do grupy „Pozostałe pozycje”, więc nic nie ginie.
 */
const grouped: Array<{ title: string; caption?: string; ids: number[] }> = [
  { title: 'Pigmentacja brwi, ust i rzęs', ids: [ID.brwi, ID.usta, ID.lashLiner] },
  { title: 'Konsultacje', ids: [ID.konsultacjaRysunek, ID.konsultacja] },
  {
    title: 'Dopigmentowanie i odświeżenie',
    caption: 'Pozycje dla osób, które wykonywały makijaż permanentny w La Beauté (warunki w opisach pozycji).',
    ids: [ID.dopigmentowanieUst, ID.dopigmentowanieNaZyczenie, ID.odswiezenieBrwi, ID.odswiezenieUst, ID.odswiezenieRzes],
  },
];
const removal = { title: 'Usuwanie makijażu permanentnego', ids: [ID.remover] };

const used = new Set<number>([...grouped.flatMap((g) => g.ids), ...removal.ids]);
const rest = getServicesByCategory('Makijaż permanentny').filter((s) => !used.has(s.id));

export const priceGroups: PriceGroup[] = [
  ...grouped.map((g) => ({ title: g.title, caption: g.caption, services: getServices(g.ids) })),
  ...(rest.length ? [{ title: 'Pozostałe pozycje', services: rest }] : []),
  { title: removal.title, services: getServices(removal.ids) },
].filter((g) => g.services.length > 0);

/* ---------------------------------------------------------------- FAQ (4–6 pytań) */

export const faq = {
  eyebrow: 'Pytania',
  title: 'Najczęstsze pytania',
  items: [
    {
      q: 'Ile trwa zabieg i ile kosztuje?',
      a: `Według cennika Booksy makijaż permanentny brwi to ${time(ID.brwi)} i ${price(ID.brwi)}, ust: ${time(ID.usta)} i ${price(ID.usta)}, a lash liner (zagęszczenie linii rzęs na górnej powiece): ${time(ID.lashLiner)} i ${price(ID.lashLiner)}.\n\nOpis pozycji „${label(ID.brwi)}” w cenniku zawiera informację o dopłacie za dopigmentowanie.`,
    },
    {
      q: 'Czy przed zabiegiem potrzebna jest konsultacja?',
      a: `W cenniku są dwie pozycje konsultacyjne: „${label(ID.konsultacja)}” (${time(ID.konsultacja)}, ${price(ID.konsultacja)}) i „${label(ID.konsultacjaRysunek)}” (${time(ID.konsultacjaRysunek)}, ${price(ID.konsultacjaRysunek)}). Podczas konsultacji z rysunkiem wstępnym ocenia się proponowany kształt, zanim zacznie się pigmentacja.\n\nCzy konsultacja jest wymagana przed pierwszym zabiegiem i czy jej cena wlicza się w cenę zabiegu, ustal z salonem przy rezerwacji: ${phone}.`,
    },
    {
      q: 'Czym jest dopigmentowanie i kiedy się je wykonuje?',
      a: `Dopigmentowanie to zabieg uzupełniający, który w ofercie salonu przewidziany jest po 6–12 tygodniach od pierwszej pigmentacji.\n\nW cenniku są pozycje „${label(ID.dopigmentowanieUst)}” (${price(ID.dopigmentowanieUst)}) oraz „${label(ID.dopigmentowanieNaZyczenie)}” (${price(ID.dopigmentowanieNaZyczenie)}). Według opisów w Booksy są dla osób, które miały makijaż permanentny wykonany w La Beauté w ciągu 3 miesięcy od pierwszej pigmentacji.`,
    },
    {
      q: 'Jak długo utrzymuje się efekt?',
      a: `Makijaż permanentny nie jest wieczny: z czasem pigment blaknie i wymaga odświeżenia. Jak długo utrzyma się efekt, zależy od skóry, wybranego pigmentu i pielęgnacji, dlatego nie podajemy jednej liczby.\n\nDla osób, które wykonywały makijaż permanentny w La Beauté, w cenniku są pozycje „${label(ID.odswiezenieBrwi)}”, „${label(ID.odswiezenieUst)}” i „${label(ID.odswiezenieRzes)}”.`,
    },
    {
      q: 'Czy zabieg jest bolesny?',
      a: 'Odczucia są indywidualne i zależą m.in. od wrażliwości skóry oraz od miejsca zabiegu, dlatego nie obiecujemy, że zabieg przebiega bez dyskomfortu. Jeśli się tego obawiasz, zapytaj o to przy rezerwacji lub na konsultacji.',
    },
    {
      q: 'Czy narzędzia są sterylne?',
      a: 'W La Beauté narzędzia wielorazowego użytku poddajemy profesjonalnej sterylizacji, a materiały jednorazowe wykorzystujemy wyłącznie raz.',
    },
  ].map((it) => ({ q: it.q, a: it.a.split('\n\n').map(pl).join('\n\n') })),
};

/* ---------------------------------------------------------------- pas CTA (tekst nadpisujący domyślny) */

export const cta = {
  title: 'Umów konsultację lub zabieg',
  text: 'Wybierz pozycję w Booksy albo zadzwoń do salonu. Przyjmujemy wyłącznie po wcześniejszej rezerwacji.',
};
