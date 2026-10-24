/**
 * Jedno miejsce, które ustala, POD JAKIM ADRESEM i W JAKIM TRYBIE budowana jest strona.
 * Importują je astro.config.mjs (site, base), src/config/site.ts (site.url, site.staging, site.formEndpoint),
 * src/lib/url.ts (withBase, absoluteUrl) i scripts/build.mjs (wpisuje domenę do .htaccess i przekazuje
 * te same wartości kontroli linków). Skrypt scripts/linkcheck.py czyta domyślny adres z tego samego
 * źródła co ten plik: deploy/targets.json.
 *
 * Domyślne wartości (produkcja) pochodzą z deploy/targets.json, cel "ovh" (zmienna PUBLIC_TARGET,
 * domyślnie "ovh"). Zmienne środowiskowe MAJĄ PIERWSZEŃSTWO nad targets.json:
 *   SITE_URL              adres serwisu, SAMA domena bez ścieżki, np. https://labeaute.pl
 *                         (domyślnie "site" z targets.json)
 *   BASE_PATH             podścieżka, pod którą strona stoi, np. /strona-labeaute
 *                         (domyślnie "base" z targets.json, czyli "/" = korzeń domeny)
 *   PUBLIC_FORM_ENDPOINT  ścieżka skryptu formularza kontaktowego NA TEJ SAMEJ DOMENIE, np. /api/kontakt.php;
 *                         pusty = formularz otwiera program pocztowy (mailto:). Pełny adres https://... jest
 *                         odrzucany: CSP z .htaccess (connect-src i form-action 'self') zablokowałoby go w przeglądarce,
 *                         a kontakt.php i tak przyjmuje tylko żądania z własnej domeny. Domyślnie "formEndpoint"
 *                         z targets.json; w kopii tymczasowej (STAGING) domyślnie pusty, bo GitHub Pages nie uruchamia PHP.
 *   STAGING               "1" = kopia tymczasowa (noindex, robots.txt z Disallow). Staging jest też
 *                         włączany automatycznie, gdy BASE_PATH nie jest "/".
 *
 * Produkcja (OVH) = brak zmiennych: korzeń domeny z targets.json, indeksowanie włączone.
 *
 * Adres produkcyjny zmieniasz TYLKO w deploy/targets.json (pole "site").
 */
import targets from './deploy/targets.json' with { type: 'json' };

const TARGET = (process.env.PUBLIC_TARGET ?? '').trim() || 'ovh';
const cfg = targets[TARGET];
if (TARGET.startsWith('_') || !cfg || typeof cfg !== 'object') {
  const known = Object.keys(targets).filter((k) => !k.startsWith('_')).join(', ');
  throw new Error(`Nieznany cel publikacji "${TARGET}" w deploy/targets.json. Dostępne: ${known}.`);
}

function parseSiteUrl(raw, source) {
  const value = (raw ?? '').trim();
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${source} "${value}" nie jest poprawnym adresem (oczekiwano np. https://labeaute.pl).`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${source} "${value}": dozwolone tylko http:// albo https://.`);
  }
  if (url.pathname.replace(/\/+$/, '') !== '' || url.search || url.hash) {
    throw new Error(
      `${source} "${value}" zawiera ścieżkę. Podaj samą domenę (${url.origin}), a podścieżkę ustaw w BASE_PATH (w targets.json: "base").`,
    );
  }
  return url.origin;
}

function parseBasePath(raw, source) {
  const value = (raw ?? '').trim();
  if (!value || value === '/') return '/';
  if (/^[A-Za-z]:[\\/]/.test(value)) {
    throw new Error(
      `${source} "${value}" to ścieżka Windows. Git Bash zamienia wartość "/nazwa" na ścieżkę dysku: ustaw MSYS_NO_PATHCONV=1 ` +
        '(np. MSYS_NO_PATHCONV=1 BASE_PATH=/strona-labeaute npm run build) albo użyj PowerShell / cmd.',
    );
  }
  const path = '/' + value.replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/');
  if (!/^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/.test(path) || path.split('/').includes('..')) {
    throw new Error(`${source} "${value}" jest niepoprawna (oczekiwano np. /strona-labeaute).`);
  }
  return path;
}

function parseEndpoint(raw, source) {
  const value = (raw ?? '').trim();
  // Tylko ścieżka od "/" na tej samej domenie (bez "//host" i bez "\host", które przeglądarka traktuje jak obcy adres).
  if (value && !/^\/(?![/\\])[A-Za-z0-9._~\-/%?=&]*$/.test(value)) {
    throw new Error(
      `${source} "${value}" jest niepoprawny (oczekiwano ścieżki od "/" na tej samej domenie, np. /api/kontakt.php, albo pustej wartości). ` +
        "Pełny adres https://... nie jest obsługiwany: CSP z .htaccess (connect-src i form-action 'self') zablokowałoby wysyłkę.",
    );
  }
  return value;
}

/** Adres produkcyjny z deploy/targets.json (cel "ovh"). Domyślna wartość SITE_URL. */
export const DEFAULT_SITE_URL = parseSiteUrl(cfg.site, `deploy/targets.json (${TARGET}.site)`);

/** Podścieżka z deploy/targets.json. Domyślna wartość BASE_PATH. */
export const DEFAULT_BASE_PATH = parseBasePath(cfg.base, `deploy/targets.json (${TARGET}.base)`);

/** Adres serwisu bez końcowego ukośnika i bez ścieżki, np. "https://labeaute.pl". */
export const SITE_URL = (process.env.SITE_URL ?? '').trim() ? parseSiteUrl(process.env.SITE_URL, 'SITE_URL') : DEFAULT_SITE_URL;

/** Podścieżka: "/" albo "/nazwa" (z początkowym, bez końcowego ukośnika). Wartość dla `base` w Astro. */
export const BASE_PATH = (process.env.BASE_PATH ?? '').trim() ? parseBasePath(process.env.BASE_PATH, 'BASE_PATH') : DEFAULT_BASE_PATH;

/** Kopia tymczasowa (nie do indeksowania): STAGING=1 albo podścieżka inna niż "/". */
export const STAGING = process.env.STAGING === '1' || BASE_PATH !== '/';

/**
 * Endpoint formularza kontaktowego: PUBLIC_FORM_ENDPOINT (także pusty), a gdy jej brak, "formEndpoint"
 * z targets.json. Kopia tymczasowa bez jawnej zmiennej: pusty (nie ma tam PHP), czyli tryb mailto:.
 */
export const FORM_ENDPOINT =
  process.env.PUBLIC_FORM_ENDPOINT !== undefined
    ? parseEndpoint(process.env.PUBLIC_FORM_ENDPOINT, 'PUBLIC_FORM_ENDPOINT')
    : STAGING
      ? ''
      : parseEndpoint(cfg.formEndpoint, `deploy/targets.json (${TARGET}.formEndpoint)`);
