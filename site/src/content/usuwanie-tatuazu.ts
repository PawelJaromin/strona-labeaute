/**
 * Treści strony /usuwanie-tatuazu/ (BRIEF.md, sekcja 3 pkt 4).
 *
 * Zasady (brief, sekcja 1): tylko fakty z research.md i opisów usług w src/data/uslugi.json;
 * ceny, czasy i nazwy pozycji zawsze z danych (formatPrice / formatDuration / serviceName);
 * opisy ogólne i ostrożne, bez obietnic efektu; czego nie wiemy, oznaczamy
 * `[do uzupełnienia przez właścicielkę]` w komentarzu i podajemy neutralne zdanie w treści.
 */
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
  tatuaz: 1677704, // Laser nd-Yag Q-SWITCH: Usuwanie tatuażu (cena „od”)
  makijazLaser: 1677702, // Laser nd-Yag Q-SWITCH: Usuwanie makijażu permanentnego
  remover: 4099985, // „Makijaż permanentny”: Remover Usuwanie Makijażu Permanentnego
  henna: 5008084, // „Popularne”: Usuwanie makijażu permanentnego + henna pudrowa
  konsultacja: 5441747, // „Makijaż permanentny”: Konsultacja makijaż permanentny
} as const;

/* ---------------------------------------------------------------- pomocnicze */

const NBSP = ' ';

/** Spójniki jednoliterowe (a, i, o, u, w, z) nie zostają na końcu wiersza. */
const pl = (s: string) => s.replace(/(?<=^|[\s„(])([aiouwzAIOUWZ])\s+(?=\S)/g, `$1${NBSP}`);

const price = (id: number) => formatPrice(findService(id)?.price) || 'wg cennika';
const time = (id: number) => formatDuration(findService(id)?.duration_min) || 'wg cennika';
const label = (id: number) => {
  const s = findService(id);
  return s ? serviceName(s) : '';
};
/** „od 200 zł · 30 min” */
const priceTime = (id: number) => `${price(id)} · ${time(id)}`;

/* ---------------------------------------------------------------- meta */

export const meta = {
  title: 'Usuwanie tatuażu laserem w Orzeszu',
  // 50–165 znaków (check:links).
  description:
    'Laserowe usuwanie tatuażu i makijażu permanentnego urządzeniem Nd:YAG Q-Switch oraz remover w salonie La Beauté w Orzeszu. Cennik i rezerwacja online.',
  serviceName: 'Laserowe usuwanie tatuażu i makijażu permanentnego',
  serviceType: 'Usuwanie tatuażu i makijażu permanentnego',
};

/* ---------------------------------------------------------------- wstęp (ciemny pas) */

export const intro = {
  eyebrow: 'Zabiegi · Laser Nd:YAG Q-Switch',
  title: 'Usuwanie tatuażu i makijażu permanentnego',
  lead: pl(
    'Laserowe usuwanie tatuażu i makijażu permanentnego urządzeniem Nd:YAG Q-Switch oraz usuwanie makijażu permanentnego metodą remover. Zabiegi wykonuje Aldona.',
  ),
  // Na zdjęciu nie nazywamy osoby ani modelu urządzenia: opisujemy tylko to, co widać.
  imageAlt: 'W gabinecie La Beauté: kobieta z głowicą urządzenia laserowego w dłoni, obok urządzenie z ekranem dotykowym',
};

/* ---------------------------------------------------------------- dwa zastosowania */

export interface Fact {
  label: string;
  value: string;
}
export interface Use {
  title: string;
  text: string;
  facts: Fact[];
}

export const uses = {
  eyebrow: 'Zastosowania',
  title: 'Tatuaż i makijaż permanentny',
  lead: pl(
    'Laser Nd:YAG Q-Switch służy w salonie do usuwania zarówno tatuaży, jak i makijażu permanentnego. Makijaż permanentny można też usunąć metodą remover.',
  ),
  items: [
    {
      title: 'Tatuaż',
      text: pl('Usuwanie tatuażu laserem Nd:YAG Q-Switch. Cena w cenniku to cena „od”, więc końcowa kwota może być wyższa; ustal ją z salonem przed zabiegiem.'),
      facts: [{ label: label(ID.tatuaz), value: priceTime(ID.tatuaz) }],
    },
    {
      title: 'Makijaż permanentny',
      text: pl('Usuwanie makijażu permanentnego laserem Nd:YAG Q-Switch albo metodą remover. W cenniku jest też pozycja z henną pudrową.'),
      facts: [
        { label: label(ID.makijazLaser), value: priceTime(ID.makijazLaser) },
        { label: label(ID.remover), value: priceTime(ID.remover) },
        { label: label(ID.henna), value: priceTime(ID.henna) },
      ],
    },
  ] as Use[],
};

/* ---------------------------------------------------------------- metody i konsultacja */

export const methods = {
  eyebrow: 'Metody',
  title: 'Laser, remover i konsultacja',
  lead: pl('Jeśli nie wiesz, która metoda będzie właściwa w Twoim przypadku, zapytaj salon przed rezerwacją.'),
  // [do uzupełnienia przez właścicielkę]: opis metody remover i kryteria wyboru lasera albo removera;
  // czy przed usuwaniem tatuażu jest osobna konsultacja. Poniżej tylko to, co wynika z cennika.
  items: [
    {
      title: 'Laser Nd:YAG Q-Switch',
      text: pl(
        `Urządzenie, którym salon usuwa tatuaże i makijaż permanentny. W cenniku: „${label(ID.tatuaz)}” i „${label(ID.makijazLaser)}”.`,
      ),
    },
    {
      title: 'Remover',
      text: pl(
        `Metoda usuwania makijażu permanentnego, w cenniku jako „${label(ID.remover)}” (${time(ID.remover)}, ${price(ID.remover)}). Kiedy wybrać remover, a kiedy laser, ustal z salonem.`,
      ),
    },
    {
      title: 'Konsultacja',
      text: pl(
        `Przy makijażu permanentnym w cenniku jest pozycja „${label(ID.konsultacja)}” (${time(ID.konsultacja)}, ${price(ID.konsultacja)}). Przy tatuażu zadzwoń do salonu i opisz go przed rezerwacją:`,
      ),
      phone: true,
    },
  ] as Array<{ title: string; text: string; phone?: boolean }>,
};

/* ---------------------------------------------------------------- ile zabiegów */

export const howMany = {
  eyebrow: 'Ile zabiegów',
  title: 'Ile zabiegów będzie potrzebnych?',
  lead: pl('Nie da się tego podać z góry. O liczbie zabiegów decyduje ocena konkretnego tatuażu lub makijażu permanentnego.'),
  factorsLabel: 'Co ma znaczenie',
  factors: ['wielkość i miejsce tatuażu', 'użyte kolory', 'głębokość i ilość pigmentu', 'wiek tatuażu lub makijażu', 'reakcja skóry'].map(pl),
  // [do uzupełnienia przez właścicielkę]: czy konsultacja jest potrzebna przed pierwszym zabiegiem
  // i jak wygląda kolejność zabiegów. Treść nie przesądza i niczego nie obiecuje.
  paragraphs: [
    'Dlatego liczbę zabiegów i spodziewany efekt najlepiej ocenić na podstawie konkretnego tatuażu lub makijażu permanentnego, w rozmowie z osobą, która wykonuje zabieg.',
    'Nie da się z góry obiecać całkowitego usunięcia ani konkretnej liczby zabiegów. Czy konsultacja jest potrzebna przed pierwszym zabiegiem, ustal z salonem przy rezerwacji:',
  ].map(pl),
};

/* ---------------------------------------------------------------- cennik */

export const pricing = {
  eyebrow: 'Cennik',
  title: 'Ceny usuwania tatuażu i makijażu',
  lead: pl('Ceny i czasy zabiegów pochodzą z Booksy. Przycisk „Umów” otwiera rezerwację wybranej pozycji.'),
};

export interface PriceGroup {
  title: string;
  caption?: string;
  services: Service[];
}

/**
 * Grupy cennika: cała kategoria Booksy „Laser nd-Yag Q-SWITCH”, usuwanie makijażu permanentnego
 * spoza lasera (Remover z „Makijaż permanentny” oraz pozycja z henną pudrową z „Popularne”)
 * i konsultacja. Nowe pozycje w kategorii laserowej po `npm run sync` pojawiają się same.
 */
export const priceGroups: PriceGroup[] = [
  { title: 'Laser Nd:YAG Q-Switch', services: getServicesByCategory('Laser nd-Yag Q-SWITCH') },
  { title: 'Remover i usuwanie z henną pudrową', services: getServices([ID.remover, ID.henna]) },
  {
    title: 'Konsultacja',
    caption: 'Pozycja z kategorii „Makijaż permanentny”: dotyczy makijażu permanentnego.',
    services: getServices([ID.konsultacja]),
  },
].filter((g) => g.services.length > 0);

/* ---------------------------------------------------------------- pas CTA (tekst nadpisujący domyślny) */

export const cta = {
  title: 'Umów zabieg',
  text: 'Wybierz pozycję w Booksy albo zadzwoń do salonu i opisz tatuaż lub makijaż permanentny. Przyjmujemy wyłącznie po wcześniejszej rezerwacji.',
};
