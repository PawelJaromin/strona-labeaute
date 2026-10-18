/**
 * Treści i dane strony /depilacja-laserowa/ (BRIEF.md, sekcja 3 pkt 3).
 *
 * Układ strony jest w src/pages/depilacja-laserowa.astro, a tu są: teksty, FAQ, kroki oraz
 * cennik pogrupowany wg partii ciała z cenami pojedynczego zabiegu i pakietu 6 zabiegów obok siebie.
 *
 * Skąd co:
 *  - ceny, czasy i variant_id: wyłącznie z src/data/uslugi.json (kategorie „Epilacja laserowa Alma Baby Remove”
 *    i „PROMOCJA”; aktualizuje je `npm run sync`, nigdy ręcznie),
 *  - „1 Zabieg – X” i „Pakiet 6 Zabiegów – X” są parowane po nazwie (patrz parseName), różnica cen
 *    pakietu względem sześciu pojedynczych zabiegów jest liczona tylko wtedy, gdy istnieją obie ceny,
 *  - fakty o salonie: research.md i src/config/site.ts (Aldona wykonuje zabiegi laserowe, wizyty
 *    tylko po rezerwacji, rezerwacje online do 2 tygodni do przodu).
 *
 * [do uzupełnienia przez właścicielkę] (nie ma tego w research.md ani w opisach z Booksy, dlatego
 * w treści są tylko ogólne, ostrożne zdania, bez liczb i obietnic):
 *  - zalecenia przed zabiegiem (golenie, opalanie, kosmetyki) i po zabiegu (słońce, pielęgnacja, sauna),
 *  - przeciwwskazania medyczne (w treści tylko „poinformuj salon o stanie zdrowia”),
 *  - odstęp między zabiegami w pakiecie, ważność pakietu, zasady przełożenia terminu,
 *  - dokładny przebieg wizyty (konsultacja przed pierwszym zabiegiem, test skóry itp.),
 *  - parametry lasera Alma Baby Remove (typ, długość fali) - celowo nie opisujemy technologii,
 *  - czy ceny z kategorii „PROMOCJA” (zestawy łączone) są czasowe i do kiedy obowiązują: na stronie nie nazywamy
 *    ich promocją i nie podajemy terminu. Siedem z ośmiu pozycji zestawów jest w Booksy w kategorii „PROMOCJA”,
 *    pakiet „Nogi + Bikini” w kategorii „Epilacja laserowa Alma Baby Remove”,
 *  - różnice czasu między pojedynczym zabiegiem a pakietem tej samej partii (np. Bikini + Nogi: 1 h 15 min vs 30 min)
 *    są w danych Booksy; pokazujemy je tak, jak są, do potwierdzenia przez właścicielkę.
 */
import { site } from '../config/site';
import { getServicesByCategory, serviceName, priceInfo, formatDuration, formatAmount, type Service } from '../lib/uslugi';

const NBSP = String.fromCharCode(160); // twarda spacja (U+00A0) w cenach i czasach
const zl = (n: number) => `${formatAmount(n)}${NBSP}zł`;

export type OfferKind = 'single' | 'pack';

export interface Saving {
  /** Różnica w zł: 6 × cena pojedynczego zabiegu − cena pakietu. */
  amount: number;
  /** Ta różnica w procentach ceny sześciu pojedynczych zabiegów (zaokrąglona). */
  percent: number;
}

export interface Pair {
  key: string;
  /** Nazwa partii do wyświetlenia („Wąsik”, „Pachy + Bikini”). */
  label: string;
  single?: Service;
  pack?: Service;
  /** Tylko gdy są obie ceny stałe i pakiet jest tańszy. */
  saving?: Saving;
}

export interface PriceGroup {
  id: string;
  title: string;
  caption?: string;
  pairs: Pair[];
  /** Liczba pozycji do rezerwacji w grupie (pojedyncze zabiegi + pakiety). */
  count: number;
}

/* ------------------------------------------------------------------ parowanie po nazwie */

/**
 * Klucz partii: małe litery, części „A + B” posortowane, więc „Bikini + Nogi” i „Nogi + Bikini”
 * (tak są nazwane zestaw pojedynczy i pakiet w Booksy) dają ten sam klucz.
 */
export function zoneKey(label: string): string {
  return label
    .split('+')
    .map((p) => p.replace(/[–—-]/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pl-PL'))
    .filter(Boolean)
    .sort()
    .join('+');
}

/** „Depilacja Laserowa 1 Zabieg – Wąsik” -> { single, „Wąsik” }; „… Pakiet 6 Zabiegów – Wąsik” -> { pack, „Wąsik” }. */
function parseName(s: Service): { kind: OfferKind; text: string } {
  const full = serviceName(s);
  const kind: OfferKind = /pakiet/i.test(full) ? 'pack' : 'single';
  const text = full
    .replace(/depilacja\s+laserowa/gi, ' ')
    .replace(/pakiet\s*6\s*zabieg\S*/gi, ' ')
    .replace(/(^|\s)1\s*zabieg\S*/gi, ' ')
    .replace(/[–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { kind, text };
}

/** Grupy wg partii ciała (kolejność jak na stronie). Nazwy w `zones` to etykiety w cenniku. */
interface GroupDef {
  id: string;
  title: string;
  caption?: string;
  zones: string[];
}
const GROUPS: GroupDef[] = [
  { id: 'twarz-i-szyja', title: 'Twarz i szyja', zones: ['Wąsik', 'Broda', 'Cała twarz', 'Szyja', 'Kark', 'Uszy'] },
  { id: 'rece-i-pachy', title: 'Ręce i pachy', zones: ['Pachy', 'Dłonie', 'Przedramiona', 'Ramiona', 'Całe ręce'] },
  { id: 'tulow', title: 'Tułów i pośladki', zones: ['Linia brzucha', 'Brzuch', 'Klatka piersiowa', 'Tułów', 'Plecy', 'Pośladki'] },
  { id: 'nogi-i-stopy', title: 'Nogi i stopy', zones: ['Uda', 'Łydki + kolana', 'Całe nogi', 'Stopy'] },
  { id: 'bikini', title: 'Bikini', zones: ['Bikini płytkie', 'Bikini głębokie'] },
  {
    id: 'zestawy-laczone',
    title: 'Zestawy łączone',
    caption: 'Dwie partie ciała w jednej wizycie, jako pojedynczy zabieg albo pakiet sześciu zabiegów.',
    zones: ['Wąsik + Broda', 'Wąsik + Pachy', 'Pachy + Bikini', 'Bikini + Nogi'],
  },
];

const source: Service[] = [...getServicesByCategory('Epilacja laserowa Alma Baby Remove'), ...getServicesByCategory('PROMOCJA')];
if (source.length === 0) {
  throw new Error('depilacja-laserowa: brak usług w kategoriach „Epilacja laserowa Alma Baby Remove” i „PROMOCJA” (src/data/uslugi.json).');
}

// Sparuj pojedynczy zabieg z pakietem. Powtórzony klucz i rodzaj daje osobny wiersz (nic nie ginie).
const byKey = new Map<string, Pair[]>();
const allPairs: Pair[] = [];
for (const s of source) {
  const { kind, text } = parseName(s);
  const key = zoneKey(text);
  const list = byKey.get(key) ?? [];
  let pair = list.find((p) => !p[kind]);
  if (!pair) {
    pair = { key, label: text };
    list.push(pair);
    byKey.set(key, list);
    allPairs.push(pair);
  }
  pair[kind] = s;
}

// Oszczędność pakietu: tylko gdy obie ceny są stałymi kwotami i pakiet jest tańszy niż 6 × pojedynczy zabieg.
for (const p of allPairs) {
  const one = p.single ? priceInfo(p.single.price) : null;
  const six = p.pack ? priceInfo(p.pack.price) : null;
  if (one?.kind === 'fixed' && six?.kind === 'fixed' && one.amount != null && six.amount != null) {
    const amount = Math.round((6 * one.amount - six.amount) * 100) / 100;
    if (amount > 0) p.saving = { amount, percent: Math.round((amount / (6 * one.amount)) * 100) };
  }
}

const used = new Set<Pair>();
export const priceGroups: PriceGroup[] = [];
for (const def of GROUPS) {
  const pairs: Pair[] = [];
  for (const zone of def.zones) {
    const found = byKey.get(zoneKey(zone));
    if (!found) {
      console.warn(`[depilacja-laserowa] Brak pozycji dla partii „${zone}” w src/data/uslugi.json`);
      continue;
    }
    for (const p of found) {
      p.label = zone;
      used.add(p);
      pairs.push(p);
    }
  }
  if (pairs.length) priceGroups.push({ id: def.id, title: def.title, caption: def.caption, pairs, count: 0 });
}
// Nowe pozycje, które pojawią się po `npm run sync`, trafiają na koniec, żeby nic nie zniknęło z cennika.
const leftovers = allPairs.filter((p) => !used.has(p));
if (leftovers.length) {
  console.warn(`[depilacja-laserowa] Pozycje spoza grup (dodane na końcu): ${leftovers.map((p) => p.label).join(', ')}`);
  priceGroups.push({ id: 'pozostale-partie', title: 'Pozostałe partie', pairs: leftovers, count: 0 });
}
for (const g of priceGroups) g.count = g.pairs.reduce((n, p) => n + (p.single ? 1 : 0) + (p.pack ? 1 : 0), 0);

/* ------------------------------------------------------------------ liczby z danych */

const singles = allPairs.flatMap((p) => (p.single ? [p.single] : []));
const packs = allPairs.flatMap((p) => (p.pack ? [p.pack] : []));
const amounts = (list: Service[]) => list.map((s) => priceInfo(s.price).amount).filter((v): v is number => typeof v === 'number');
const minOf = (v: number[]) => (v.length ? Math.min(...v) : null);
const maxOf = (v: number[]) => (v.length ? Math.max(...v) : null);
const durations = singles.map((s) => s.duration_min).filter((v): v is number => typeof v === 'number' && v > 0);

const savings = allPairs.flatMap((p) => (p.saving ? [p.saving.percent] : []));
const pairedCount = allPairs.filter((p) => p.single && p.pack).length;
/** Każda para ma tańszy pakiet (wtedy wolno napisać, że pakiet jest tańszy). */
const packsCheaper = pairedCount > 0 && savings.length === pairedCount;
/** Jeden wspólny procent oszczędności (np. 10), gdy wszystkie pary mają ten sam. */
const savingPercent = packsCheaper && new Set(savings).size === 1 ? savings[0] : null;

const minSingle = minOf(amounts(singles));
const minPack = minOf(amounts(packs));
const durMin = durations.length ? formatDuration(Math.min(...durations)) : '';
const durMax = durations.length ? formatDuration(Math.max(...durations)) : '';

export const stats = {
  items: source.length,
  minSingle,
  minPack,
  maxPack: maxOf(amounts(packs)),
  durMin,
  durMax,
  packsCheaper,
  savingPercent,
};

/** Dla Service JSON-LD: widełki cen z danych (tylko stałe kwoty i „od”). */
const allAmounts = amounts(source);
export const aggregateOffer = {
  '@type': 'AggregateOffer',
  priceCurrency: 'PLN',
  lowPrice: minOf(allAmounts) ?? undefined,
  highPrice: maxOf(allAmounts) ?? undefined,
  offerCount: source.length,
};

/* ------------------------------------------------------------------ SEO i wstęp */

// Bez nazwy urządzenia: z dopiskiem „ · La Beauté Orzesze” tytuł miał 65 znaków (Google ucina ok. 60).
// „Alma Baby Remove” jest w description, eyebrow i treści strony.
export const title = 'Depilacja laserowa w Orzeszu';
export const description = `Depilacja laserowa Alma Baby Remove w La Beauté w Orzeszu: twarz, ręce, tułów, nogi, bikini.${
  minSingle != null ? ` Zabieg od ${zl(minSingle)}` : ' Zabieg'
} lub pakiet 6 zabiegów, cennik i rezerwacja online.`;

export const intro = {
  eyebrow: 'Zabiegi · Depilacja laserowa',
  lead: 'Depilacja laserowa urządzeniem Alma Baby Remove w salonie w Orzeszu. Partie ciała możesz wybrać jako pojedynczy zabieg albo w pakiecie sześciu zabiegów.',
  imageAlt: 'Gabinet zabiegowy La Beauté: białe szafki z marmurowym blatem, złota bateria, umywalka nablatowa i urządzenia kosmetyczne na blacie',
};

/* ------------------------------------------------------------------ sekcja „O zabiegu” */

export const about = {
  eyebrow: 'O zabiegu',
  title: 'Alma Baby Remove w La Beauté',
  paragraphs: [
    'Depilację laserową wykonujemy urządzeniem Alma Baby Remove. W cenniku znajdziesz twarz i szyję, ręce i pachy, tułów, nogi i stopy oraz bikini, a także zestawy łączące kilka partii w jednej wizycie.',
    `Partię ciała można zarezerwować jako pojedynczy zabieg albo jako pakiet sześciu zabiegów. Cena pakietu obejmuje sześć zabiegów tej samej partii${
      packsCheaper
        ? savingPercent != null
          ? `, a w porównaniu z sześcioma pojedynczymi zabiegami jest niższa o ${savingPercent}%`
          : ', a w porównaniu z sześcioma pojedynczymi zabiegami jest niższa'
        : ''
    }.`,
    'Zabiegi laserowe wykonuje Aldona, właścicielka salonu. Przyjmujemy wyłącznie po wcześniejszej rezerwacji.',
    'Efekt i liczba potrzebnych zabiegów zależą od indywidualnych cech skóry i owłosienia, dlatego nie obiecujemy z góry konkretnego rezultatu.',
  ],
  facts: [
    { label: 'Urządzenie', value: 'Alma Baby Remove', note: undefined as string | undefined },
    ...(minSingle != null ? [{ label: 'Pojedynczy zabieg', value: `od ${zl(minSingle)}`, note: 'zależnie od partii ciała' as string | undefined }] : []),
    ...(minPack != null
      ? [
          {
            label: 'Pakiet 6 zabiegów',
            value: `od ${zl(minPack)}`,
            note: (savingPercent != null ? `o ${savingPercent}% taniej niż sześć pojedynczych zabiegów` : undefined) as string | undefined,
          },
        ]
      : []),
    ...(durMin && durMax ? [{ label: 'Czas zabiegu', value: `${durMin} – ${durMax}`, note: 'zależnie od partii ciała' as string | undefined }] : []),
  ],
};

/* ------------------------------------------------------------------ cennik */

export const pricing = {
  eyebrow: 'Cennik',
  title: 'Ceny depilacji laserowej',
  lead: `Przy każdej partii ciała podajemy cenę pojedynczego zabiegu i pakietu sześciu zabiegów${
    packsCheaper ? '; przy pakiecie widać, o ile jest tańszy od sześciu pojedynczych zabiegów' : ''
  }. Przycisk „Umów” otwiera rezerwację wybranej pozycji w Booksy.`,
  navLabel: 'Partie ciała w cenniku',
  kinds: { single: '1 zabieg', pack: 'Pakiet 6 zabiegów' } as Record<OfferKind, string>,
};

/* ------------------------------------------------------------------ przygotowanie / przebieg / po zabiegu */

// [do uzupełnienia przez właścicielkę] Poniższe zalecenia są ogólne; salon powinien potwierdzić lub poprawić.
export const prep = {
  eyebrow: 'Przed zabiegiem',
  title: 'Jak przygotować się do zabiegu',
  lead: 'To ogólne wskazówki. Jeśli salon zaleci coś innego, kieruj się jego zaleceniami; w razie wątpliwości zapytaj przy rezerwacji.',
  items: [
    {
      t: 'Skóra i włosy',
      d: 'Zwykle zaleca się, aby skóra w miejscu zabiegu była czysta i ogolona. Przed zabiegiem nie wyrywaj włosów woskiem, pęsetą ani depilatorem.',
    },
    {
      t: 'Słońce i podrażnienia',
      d: 'Unikaj intensywnego opalania w miejscu zabiegu (słońce, solarium). Jeśli skóra jest świeżo opalona lub podrażniona, uprzedź o tym salon przy rezerwacji.',
    },
    {
      t: 'Kosmetyki',
      d: 'W dniu zabiegu nie nakładaj na tę okolicę kremów, olejków ani innych kosmetyków.',
    },
    {
      t: 'Zdrowie',
      d: 'Przed pierwszym zabiegiem poinformuj salon o chorobach skóry, przyjmowanych lekach, ciąży i niedawnych zabiegach w tym miejscu. W razie wątpliwości skonsultuj się z lekarzem.',
    },
    {
      t: 'Pakiet i terminy',
      d: 'Odstępy między kolejnymi zabiegami z pakietu ustal z salonem.',
    },
  ],
};

export const course = {
  eyebrow: 'Przebieg wizyty',
  title: 'Jak wygląda wizyta',
  lead: 'Ogólny przebieg wizyty. Szczegóły mogą się różnić w zależności od partii ciała i indywidualnych potrzeb.',
  steps: [
    {
      title: 'Rezerwacja',
      text: 'Wybierz partię ciała i rodzaj: pojedynczy zabieg albo pakiet. Zarezerwuj termin w Booksy albo zadzwoń do salonu.',
    },
    {
      title: 'Początek wizyty',
      text: 'Przekaż salonowi istotne informacje o skórze i zdrowiu (wskazówki w sekcji powyżej) i zadaj pytania, jeśli masz wątpliwości.',
    },
    {
      title: 'Zabieg',
      text: `Zabieg wykonuje Aldona urządzeniem Alma Baby Remove.${
        durMin && durMax ? ` Czas zależy od partii: od ${durMin} do ${durMax}.` : ''
      }`,
    },
    {
      title: 'Po zabiegu',
      text: 'Pielęgnuj skórę łagodnie (wskazówki poniżej), a przy pakiecie ustal z salonem termin kolejnego zabiegu.',
    },
  ],
};

// [do uzupełnienia przez właścicielkę] Zalecenia ogólne; salon powinien potwierdzić lub poprawić.
export const after = {
  eyebrow: 'Po zabiegu',
  title: 'Pielęgnacja po zabiegu',
  lead: 'To ogólne wskazówki. Zalecenia salonu mają pierwszeństwo.',
  items: [
    {
      t: 'Słońce',
      d: 'Chroń skórę w miejscu zabiegu przed słońcem i solarium, a wychodząc na słońce, używaj kremu z filtrem.',
    },
    {
      t: 'Łagodna pielęgnacja',
      d: 'Przez pewien czas po zabiegu unikaj peelingów, tarcia i podrażniających kosmetyków w tym miejscu.',
    },
    {
      t: 'Ciepło',
      d: 'Jeśli skóra jest podrażniona, odłóż saunę i bardzo gorące kąpiele.',
    },
    {
      t: 'Niepokojące objawy',
      d: 'Jeśli skóra reaguje silnie lub objawy nie ustępują, skontaktuj się z salonem, a w razie potrzeby z lekarzem.',
    },
  ],
};

/* ------------------------------------------------------------------ FAQ (4–6 pytań, ostrożnie) */

const comboGroup = priceGroups.find((g) => g.id === 'zestawy-laczone');
const comboNames = comboGroup ? comboGroup.pairs.map((p) => p.label.toLocaleLowerCase('pl-PL')) : [];
const comboList = comboNames.length > 1 ? `${comboNames.slice(0, -1).join(', ')} i ${comboNames[comboNames.length - 1]}` : comboNames.join('');
const combosAllBoth = comboGroup ? comboGroup.pairs.every((p) => p.single && p.pack) : false;

export const faq = {
  eyebrow: 'Pytania',
  title: 'Najczęstsze pytania',
  items: [
    {
      q: 'Ile kosztuje depilacja laserowa?',
      a: `Cena zależy od partii ciała. Według cennika Booksy ${
        minSingle != null ? `pojedynczy zabieg kosztuje od ${zl(minSingle)}` : 'ceny pojedynczych zabiegów są podane w cenniku'
      }${minPack != null ? `, a pakiet sześciu zabiegów od ${zl(minPack)}` : ''}. Ceny wszystkich partii i zestawów są w cenniku na tej stronie, razem z czasem zabiegu.`,
    },
    {
      q: 'Pojedynczy zabieg czy pakiet sześciu zabiegów?',
      a: `${
        packsCheaper ? 'Pakiet sześciu zabiegów kosztuje mniej niż sześć pojedynczych zabiegów tej samej partii; przy każdej pozycji w cenniku widać, o ile. ' : ''
      }Pojedynczy zabieg pozwala najpierw sprawdzić, jak wygląda wizyta.\n\nEfekt i liczba potrzebnych zabiegów zależą od indywidualnych cech skóry i owłosienia, więc nie da się ich z góry obiecać. W razie wątpliwości zadzwoń do salonu przed zakupem pakietu.`,
    },
    {
      q: 'Ile trwa zabieg?',
      a:
        durMin && durMax
          ? `Czas zależy od partii ciała. Według Booksy pojedynczy zabieg trwa od ${durMin} do ${durMax}. Czas jest podany przy każdej pozycji w cenniku.`
          : 'Czas zależy od partii ciała i jest podany przy każdej pozycji w cenniku.',
    },
    {
      q: 'Czy zabieg boli?',
      a: 'Odczucia są indywidualne, więc nie da się ich jednoznacznie przewidzieć. Jeśli obawiasz się dyskomfortu, powiedz o tym przy rezerwacji lub przed rozpoczęciem zabiegu.',
    },
    ...(comboList
      ? [
          {
            q: 'Czy mogę połączyć kilka partii w jednej wizycie?',
            a: `W cenniku są zestawy łączone: ${comboList}.${
              combosAllBoth ? ' Każdy z nich jest dostępny jako pojedynczy zabieg i jako pakiet sześciu zabiegów.' : ''
            } Inne połączenia warto ustalić z salonem przed rezerwacją.`,
          },
        ]
      : []),
    {
      q: 'Jak umówić wizytę?',
      a: `Przyjmujemy wyłącznie po wcześniejszej rezerwacji. Przycisk „Umów” przy każdej pozycji cennika otwiera rezerwację w Booksy z wybraną usługą. Rezerwacje online są możliwe do ${site.booksy.bookingWindowWeeks} tygodni do przodu; w innym terminie zadzwoń: ${site.phone.display}.`,
    },
  ],
};

export const cta = {
  title: 'Umów depilację laserową',
};
