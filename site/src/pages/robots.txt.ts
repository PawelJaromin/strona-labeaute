/**
 * robots.txt generowany przy budowaniu (zastępuje public/robots.txt).
 * Produkcja: indeksowanie dozwolone + adres mapy witryny. Kopia tymczasowa (site.staging,
 * np. GitHub Pages): Disallow: /.
 *
 * Uwaga: roboty czytają WYŁĄCZNIE robots.txt z korzenia domeny. Pod podścieżką projektu
 * (https://uzytkownik.github.io/strona-labeaute/robots.txt) ten plik niczego nie blokuje, a o
 * wykluczeniu kopii tymczasowej z indeksu decyduje <meta name="robots" content="noindex, nofollow">
 * w Base.astro. Plik jest tu dla porządku i na wypadek hostingu na własnej (pod)domenie.
 */
import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = () => {
  const lines = site.staging
    ? ['# Kopia tymczasowa (staging): nie indeksować.', 'User-agent: *', 'Disallow: /']
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${absoluteUrl('/sitemap-index.xml')}`];
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
