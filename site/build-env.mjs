/**
 * Jedno miejsce, które ustala, POD JAKIM ADRESEM i W JAKIM TRYBIE budowana jest strona.
 * Importują je astro.config.mjs (site, base), src/config/site.ts (site.url, site.staging)
 * i src/lib/url.ts (withBase, absoluteUrl). Skrypt scripts/linkcheck.py czyta z niego
 * domyślny adres (DEFAULT_SITE_URL), więc zmiana domeny w tym pliku wystarczy.
 *
 * Zmienne środowiskowe (ustawiane przy budowaniu, np. w GitHub Actions):
 *   SITE_URL   adres serwisu, SAMA domena bez ścieżki, np. https://labeaute.pl
 *              (domyślnie DEFAULT_SITE_URL)
 *   BASE_PATH  podścieżka, pod którą strona stoi, np. /strona-labeaute
 *              (domyślnie "/" = korzeń domeny)
 *   STAGING    "1" = kopia tymczasowa (noindex, robots.txt z Disallow). Staging jest też
 *              włączany automatycznie, gdy BASE_PATH nie jest "/".
 *
 * Produkcja (OVH) = brak zmiennych: korzeń domeny, indeksowanie włączone.
 */

/**
 * Adres produkcyjny. DOMENA DO USTALENIA z właścicielką (labeaute.pl i labeaute-orzesze.pl
 * były wolne w DNS 2026-10-16; trzeba sprawdzić u rejestratora). Gdy domena będzie znana,
 * wpisz ją tutaj (albo ustaw SITE_URL przy buildzie).
 */
export const DEFAULT_SITE_URL = 'https://labeaute.example.pl';

function normalizeSiteUrl(raw) {
  const value = (raw ?? '').trim();
  if (!value) return DEFAULT_SITE_URL;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`SITE_URL "${value}" nie jest poprawnym adresem (oczekiwano np. https://labeaute.pl).`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SITE_URL "${value}": dozwolone tylko http:// albo https://.`);
  }
  if (url.pathname.replace(/\/+$/, '') !== '' || url.search || url.hash) {
    throw new Error(
      `SITE_URL "${value}" zawiera ścieżkę. Podaj samą domenę (${url.origin}), a podścieżkę ustaw w BASE_PATH.`,
    );
  }
  return url.origin;
}

function normalizeBasePath(raw) {
  const value = (raw ?? '').trim();
  if (!value || value === '/') return '/';
  if (/^[A-Za-z]:[\\/]/.test(value)) {
    throw new Error(
      `BASE_PATH "${value}" to ścieżka Windows. Git Bash zamienia wartość "/nazwa" na ścieżkę dysku: ustaw MSYS_NO_PATHCONV=1 ` +
        '(np. MSYS_NO_PATHCONV=1 BASE_PATH=/strona-labeaute npm run build) albo użyj PowerShell / cmd.',
    );
  }
  const path ='/' + value.replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/');
  if (!/^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/.test(path) || path.split('/').includes('..')) {
    throw new Error(`BASE_PATH "${value}" jest niepoprawna (oczekiwano np. /strona-labeaute).`);
  }
  return path;
}

/** Adres serwisu bez końcowego ukośnika i bez ścieżki, np. "https://paweljaromin.github.io". */
export const SITE_URL = normalizeSiteUrl(process.env.SITE_URL);

/** Podścieżka: "/" albo "/nazwa" (z początkowym, bez końcowego ukośnika). Wartość dla `base` w Astro. */
export const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);

/** Kopia tymczasowa (nie do indeksowania): STAGING=1 albo podścieżka inna niż "/". */
export const STAGING = process.env.STAGING === '1' || BASE_PATH !== '/';
