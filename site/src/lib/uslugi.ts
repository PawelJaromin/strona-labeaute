/**
 * Usługi i ceny z Booksy (src/data/uslugi.json) oraz funkcje formatujące.
 *
 * Najczęstsze użycia:
 *   getCategory('Makijaż permanentny')        -> { name, label, slug, services[] }
 *   getCategories(['Henna', 'Pedicure'])      -> Category[] (kolejność jak w argumencie)
 *   groupByCategory()                         -> wszystkie kategorie w kolejności Booksy
 *   findService(1680751)                      -> usługa po id usługi (albo po variant_id)
 *   getServices([1680751, 1680768])           -> lista usług po id (brakujące pomija z ostrzeżeniem)
 *   formatPrice('150,00 zł+')                 -> 'od 150 zł'
 *   formatDuration(90)                        -> '1 h 30 min'
 *   bookingUrl(5126967)                       -> adres okna rezerwacji Booksy tej usługi
 */
import raw from '../data/uslugi.json';
import { site } from '../config/site';

export interface Variant {
  id: number;
  label: string;
  price: string;
  duration: number;
}

export interface Service {
  /** Nazwa kategorii dokładnie jak w Booksy (bywa ze spacjami na końcu). */
  category: string;
  id: number;
  variant_id: number;
  name: string;
  description: string;
  /** Tekst ceny z Booksy, np. "900,00 zł", "150,00 zł+", "1 350,00 zł", "Zmienna". */
  price: string;
  price_raw: number | null;
  duration_min: number | null;
  variants: Variant[];
  staffer_ids: number[];
  online: boolean;
  promotion: unknown;
}

export interface ServicesData {
  updatedAt: string;
  source: string;
  business: { id: number; name: string; description: string; reviewsCount?: number; [k: string]: unknown };
  services: Service[];
}

export interface Category {
  /** Nazwa z Booksy po przycięciu spacji (do wyszukiwania). */
  name: string;
  /** Nazwa do wyświetlenia na stronie. */
  label: string;
  /** Kotwica / identyfikator, np. "makijaz-permanentny". */
  slug: string;
  services: Service[];
}

const data = raw as unknown as ServicesData;

/** Wszystkie usługi w kolejności Booksy. */
export function loadServices(): Service[] {
  return data.services;
}

/** Surowe dane (updatedAt, source, business, services). */
export function loadData(): ServicesData {
  return data;
}

/** Data aktualizacji cennika (ISO z pliku danych). */
export const updatedAt: string = data.updatedAt;
/** Strona, z której pobrano dane. */
export const dataSource: string = data.source;

/** „16 października 2026” (strefa Europe/Warsaw). */
export function formatUpdatedAt(iso: string = data.updatedAt): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' }).format(d);
}

/** Przycięcie i ujednolicenie spacji w nazwie kategorii. */
export function normalizeCategory(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

const key = (s: string) => normalizeCategory(s).toLocaleLowerCase('pl-PL');

/** Nazwy kategorii do wyświetlenia (klucz: nazwa z Booksy małymi literami). */
const CATEGORY_LABELS: Record<string, string> = {
  popularne: 'Najczęściej wybierane',
  promocja: 'Promocje',
  'laser nd-yag q-switch': 'Laser Nd:YAG Q-Switch',
};

export function categoryLabel(name: string): string {
  return CATEGORY_LABELS[key(name)] ?? normalizeCategory(name);
}

const PL_MAP: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };

/** „Makijaż permanentny” -> „makijaz-permanentny”. */
export function slugify(s: string): string {
  return normalizeCategory(s)
    .toLocaleLowerCase('pl-PL')
    .replace(/[ąćęłńóśźż]/g, (c) => PL_MAP[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Wszystkie kategorie w kolejności Booksy. */
export function groupByCategory(services: Service[] = data.services): Category[] {
  const map = new Map<string, Category>();
  for (const s of services) {
    const k = key(s.category);
    let cat = map.get(k);
    if (!cat) {
      const name = normalizeCategory(s.category);
      cat = { name, label: categoryLabel(name), slug: slugify(name), services: [] };
      map.set(k, cat);
    }
    cat.services.push(s);
  }
  return [...map.values()];
}

/** Kategoria po nazwie z Booksy (bez względu na wielkość liter i spacje na końcu). */
export function getCategory(name: string): Category | undefined {
  const k = key(name);
  return groupByCategory().find((c) => key(c.name) === k);
}

/** Kilka kategorii w podanej kolejności; nieznane nazwy pomija z ostrzeżeniem w konsoli builda. */
export function getCategories(names: readonly string[]): Category[] {
  const out: Category[] = [];
  for (const n of names) {
    const c = getCategory(n);
    if (c) out.push(c);
    else console.warn(`[uslugi] Brak kategorii „${n}” w src/data/uslugi.json`);
  }
  return out;
}

/** Usługi jednej kategorii (pusta lista, gdy kategorii nie ma). */
export function getServicesByCategory(name: string): Service[] {
  return getCategory(name)?.services ?? [];
}

/** Usługa po id usługi albo po variant_id (pierwsze trafienie). */
export function findService(id: number): Service | undefined {
  return data.services.find((s) => s.id === id) ?? data.services.find((s) => s.variant_id === id || s.variants.some((v) => v.id === id));
}

/** Kilka usług po id w podanej kolejności; brakujące pomija z ostrzeżeniem w konsoli builda. */
export function getServices(ids: readonly number[]): Service[] {
  const out: Service[] = [];
  for (const id of ids) {
    const s = findService(id);
    if (s) out.push(s);
    else console.warn(`[uslugi] Brak usługi o id ${id} w src/data/uslugi.json`);
  }
  return out;
}

/* ---------------------------------------------------------------- nazwy */

/** Ręczne poprawki nazw (literówki, wielkie litery) po id usługi. Ceny i opisy zawsze z Booksy. */
const NAME_OVERRIDES: Record<number, string> = {
  1680758: 'Lash liner (zagęszczenie linii rzęs, góra)',
  1680792: 'Konsultacja z rysunkiem wstępnym',
};

/**
 * Nazwa usługi do wyświetlenia: poprawki z NAME_OVERRIDES, a poza tym tylko
 * kosmetyka zapisu z Booksy („LaserowaPakiet6Zabiegów-Klatka” -> „Laserowa Pakiet 6 Zabiegów – Klatka”).
 */
export function serviceName(s: Pick<Service, 'id' | 'name'>): string {
  if (NAME_OVERRIDES[s.id]) return NAME_OVERRIDES[s.id];
  return s.name
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/([a-ząćęłńóśźż])([A-ZĄĆĘŁŃÓŚŹŻ])/g, '$1 $2')
    .replace(/([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])/g, '$1 $2')
    .replace(/\s*-\s*(?=[A-ZĄĆĘŁŃÓŚŹŻ])/g, ' – ');
}

/** Opis usługi bez nadmiarowych spacji (akapity zachowane jako \n). */
export function serviceDescription(s: Pick<Service, 'description'>): string {
  return (s.description ?? '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ---------------------------------------------------------------- ceny */

export type PriceKind = 'fixed' | 'from' | 'variable' | 'unknown';

export interface PriceInfo {
  kind: PriceKind;
  /** Kwota w złotych (null dla „Zmienna”). */
  amount: number | null;
  /** Sama kwota z walutą, np. "1350 zł" (pusta dla „Zmienna”). */
  amountText: string;
  /** Pełny tekst do wyświetlenia: "900 zł", "od 150 zł", "cena ustalana indywidualnie". */
  text: string;
}

const NBSP = ' ';

/**
 * Rozbiór ceny z Booksy.
 * "Zmienna" -> cena ustalana indywidualnie; "150,00 zł+" -> od 150 zł; "1 350,00 zł" -> 1350 zł.
 */
export function priceInfo(price: string | null | undefined): PriceInfo {
  const src = (price ?? '').replace(/[\s  ]+/g, ' ').trim();
  if (!src) return { kind: 'unknown', amount: null, amountText: '', text: '' };
  if (/^zmienna$/i.test(src)) return { kind: 'variable', amount: null, amountText: '', text: 'cena ustalana indywidualnie' };
  const m = src.match(/^([\d ]+)(?:,(\d{1,2}))?\s*zł\s*(\+)?$/i);
  if (!m) return { kind: 'unknown', amount: null, amountText: src, text: src };
  const whole = parseInt(m[1].replace(/ /g, ''), 10);
  const fraction = m[2] && !/^0+$/.test(m[2]) ? m[2].padEnd(2, '0') : '';
  const amount = fraction ? whole + parseInt(fraction, 10) / 100 : whole;
  const amountText = `${whole}${fraction ? ',' + fraction : ''}${NBSP}zł`;
  const from = Boolean(m[3]);
  return { kind: from ? 'from' : 'fixed', amount, amountText, text: from ? `od${NBSP}${amountText}` : amountText };
}

/** Cena do wyświetlenia (patrz priceInfo). */
export function formatPrice(price: string | null | undefined): string {
  return priceInfo(price).text;
}

/** Czas trwania: 180 -> "3 h", 90 -> "1 h 30 min", 45 -> "45 min". */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}${NBSP}h ${m}${NBSP}min`;
  if (h) return `${h}${NBSP}h`;
  return `${m}${NBSP}min`;
}

/** Zakres cen z danych, np. { min: 20, max: 3240, text: "20–3240 zł" }. */
export function priceRange(services: Service[] = data.services): { min: number; max: number; text: string } {
  const vals = services.map((s) => priceInfo(s.price).amount).filter((v): v is number => typeof v === 'number');
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { min, max, text: `${min}–${max}${NBSP}zł` };
}

/* ---------------------------------------------------------------- rezerwacja */

/** Okno rezerwacji Booksy od razu z wybraną usługą (variant_id z danych). */
export function bookingUrl(variantId: number): string {
  return `${site.booksy.widgetBase}&variantId=${variantId}`;
}

/** Okno rezerwacji dla usługi (używa variant_id). */
export function serviceBookingUrl(s: Pick<Service, 'variant_id'>): string {
  return bookingUrl(s.variant_id);
}
