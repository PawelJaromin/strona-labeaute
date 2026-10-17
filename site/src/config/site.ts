/**
 * Centralna konfiguracja strony: wszystkie fakty o salonie w jednym miejscu.
 * Źródło: J:\strona\labeaute\dane\research.md (stan na 2026-10-16).
 * Nie dopisuj tu niczego, czego nie ma w research.md ani w danych z Booksy.
 */

import uslugiData from '../data/uslugi.json';

const BOOKSY_ID = 102895;
const GOOGLE_PLACE_ID = 'ChIJQ5CkQJDLFkcRx7-H-PQnGxY';
const LAT = 50.11789;
const LNG = 18.77495;

/** Blok `business` z ostatniej synchronizacji Booksy (opinie). */
const booksyBusiness = (uslugiData as { business?: { reviewsCount?: number; reviewsRank?: number } }).business ?? {};
/** 4.9779… → „4,98”. */
function ratingText(rank: number | undefined, fallback: string): string {
  return typeof rank === 'number' && rank > 0 ? rank.toFixed(2).replace('.', ',') : fallback;
}

export const site = {
  /**
   * Adres produkcyjny (bez końcowego ukośnika).
   * DOMENA DO USTALENIA z właścicielką (labeaute.pl i labeaute-orzesze.pl były wolne
   * w DNS 2026-10-16; trzeba sprawdzić u rejestratora). Ten sam adres jest
   * w astro.config.mjs (stała SITE). Zmieniaj oba naraz.
   */
  url: 'https://labeaute.example.pl',

  /** Pełna nazwa (w logo „LA BEAUTÉ”, na Booksy zapisana jako „La Beautè”). */
  name: 'La Beauté Aldona Targiel',
  shortName: 'La Beauté',
  owner: 'Aldona Targiel',
  /** Opis rodzaju działalności do eyebrow / meta. */
  kind: 'Salon kosmetyczny',
  lang: 'pl',
  ogLocale: 'pl_PL',

  address: {
    street: 'Jagodowa 24',
    postalCode: '43-180',
    city: 'Orzesze',
    /** Dzielnica wg Booksy; w opisie salon pisze „Orzesze – Gardawice”. */
    district: 'Zawada',
    region: 'śląskie',
    country: 'PL',
    countryName: 'Polska',
  },
  geo: { lat: LAT, lng: LNG },
  plusCode: '4Q9F+5X Orzesze',

  phone: {
    display: '784 736 463',
    intl: '+48 784 736 463',
    href: 'tel:+48784736463',
  },
  email: 'labeaute.at@gmail.com',

  social: {
    facebook: 'https://www.facebook.com/labeaute.at',
    instagram: 'https://www.instagram.com/labeaute_aldonatargiel/',
    instagramHandle: '@labeaute_aldonatargiel',
  },

  booksy: {
    id: BOOKSY_ID,
    /** Publiczny profil salonu na Booksy. */
    profileUrl: `https://booksy.com/pl-pl/${BOOKSY_ID}_la-beaute-aldona-targiel_salon-kosmetyczny_12634_orzesze`,
    /** Krótki link do profilu (przekierowuje na profil). Fallback przycisku „Umów wizytę”. */
    linkUrl: `https://booksy.com/pl-pl/dl/show-business/${BOOKSY_ID}`,
    /** Oficjalny skrypt widgetu (tryb dialog). */
    widgetScript: `https://booksy.com/widget/code.js?id=${BOOKSY_ID}&country=pl&lang=pl`,
    /** Okno rezerwacji konkretnej usługi: dopisz &variantId=<variant_id> (patrz lib/uslugi.ts bookingUrl). */
    widgetBase: `https://booksy.com/widget-2021/index.html?id=${BOOKSY_ID}&lang=pl&country=pl&mode=dialog&theme=default`,
    /** Salon przyjmuje rezerwacje online najwyżej 2 tygodnie do przodu. */
    bookingWindowWeeks: 2,
  },

  maps: {
    /** Wizytówka salonu w Mapach Google. */
    placeUrl: `https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}`,
    /** Wyznaczanie trasy do salonu. */
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${LAT}%2C${LNG}&destination_place_id=${GOOGLE_PLACE_ID}`,
  },

  /** Godziny otwarcia wg Booksy (Google nie ma godzin w wizytówce). */
  hours: [
    { day: 'Poniedziałek', short: 'Pn', schemaDay: 'Monday', opens: '07:00', closes: '18:00' },
    { day: 'Wtorek', short: 'Wt', schemaDay: 'Tuesday', opens: '08:30', closes: '20:00' },
    { day: 'Środa', short: 'Śr', schemaDay: 'Wednesday', opens: '09:00', closes: '17:00' },
    { day: 'Czwartek', short: 'Cz', schemaDay: 'Thursday', opens: '08:30', closes: '20:00' },
    { day: 'Piątek', short: 'Pt', schemaDay: 'Friday', opens: '07:00', closes: '15:00' },
    { day: 'Sobota', short: 'Sb', schemaDay: 'Saturday', opens: null, closes: null },
    { day: 'Niedziela', short: 'Nd', schemaDay: 'Sunday', opens: null, closes: null },
  ] as ReadonlyArray<{ day: string; short: string; schemaDay: string; opens: string | null; closes: string | null }>,

  /** Wizyty tylko po wcześniejszej rezerwacji (Booksy). */
  appointmentOnly: true,

  /** Oceny ze źródeł zewnętrznych (stan na 2026-10-16). Na stronie zawsze z linkiem do źródła. */
  reviews: {
    /**
     * Booksy: liczba opinii i średnia z ostatniej synchronizacji cennika (`npm run sync` zapisuje
     * business.reviewsCount i business.reviewsRank w src/data/uslugi.json), więc strona nadąża za
     * Booksy bez ręcznych poprawek. 2026-10-16 (research.md): 180 opinii; 2026-10-17 (sync): 181,
     * średnia 4,978. Wyświetlana ocena „5,0” to zaokrąglenie Booksy.
     */
    booksy: { rating: '5,0', ratingExact: ratingText(booksyBusiness.reviewsRank, '4,98'), count: booksyBusiness.reviewsCount ?? 181, url: `https://booksy.com/pl-pl/${BOOKSY_ID}_la-beaute-aldona-targiel_salon-kosmetyczny_12634_orzesze` },
    google: { rating: '4,7', count: 29, url: `https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}` },
    facebook: { recommendPercent: 100, count: 25, url: 'https://www.facebook.com/labeaute.at' },
  },

  /** Zespół wg Booksy. Zdjęcia: src/assets/photos/personel-<key>.jpg. */
  team: [
    {
      key: 'aldona',
      name: 'Aldona',
      fullName: 'Aldona Targiel',
      role: 'Właścicielka',
      specialties: 'Makijaż permanentny, zabiegi laserowe, brwi i rzęsy, henna, depilacja woskiem, peeling węglowy, mezoterapia',
      booksyId: 177419,
    },
    { key: 'zaneta', name: 'Żaneta', fullName: 'Żaneta', role: 'Stylistka paznokci', specialties: 'Stylizacja paznokci, pedicure', booksyId: 451880 },
    { key: 'wiktoria', name: 'Wiktoria', fullName: 'Wiktoria', role: 'Stylistka paznokci', specialties: 'Stylizacja paznokci, pedicure', booksyId: 598794 },
  ],

  /** Kolor motywu przeglądarki (pasek na telefonie). */
  themeColor: '#FFFFFF',
} as const;

/** Adres w jednej linii, np. do stopki i meta. */
export const addressLine = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;

/** Godziny jako tekst „07:00–18:00” albo „zamknięte”. */
export function hoursText(h: { opens: string | null; closes: string | null }): string {
  return h.opens && h.closes ? `${h.opens}–${h.closes}` : 'zamknięte';
}

/** Główne podstrony (adresy z końcowym ukośnikiem). Używane w nawigacji, stopce i linkach. */
export const routes = {
  home: '/',
  makijaz: '/makijaz-permanentny/',
  depilacja: '/depilacja-laserowa/',
  tatuaz: '/usuwanie-tatuazu/',
  cennik: '/cennik/',
  polityka: '/polityka-prywatnosci/',
  zabiegi: '/#zabiegi',
  oNas: '/#o-nas',
  opinie: '/#opinie',
  kontakt: '/#kontakt',
} as const;
