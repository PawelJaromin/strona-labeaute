/**
 * Adresy z uwzględnieniem podścieżki (`base`) i domeny, pod którą budowana jest strona
 * (zmienne SITE_URL i BASE_PATH, patrz build-env.mjs).
 *
 *   withBase('/cennik/')      → '/cennik/'  na produkcji, '/strona-labeaute/cennik/' na kopii tymczasowej
 *   absoluteUrl('/og.png')    → 'https://domena/og.png' (canonical, Open Graph, JSON-LD, sitemap)
 *
 * Każdy ABSOLUTNY adres wewnętrzny (href, src, canonical, og:image, JSON-LD) ma przechodzić przez
 * withBase / absoluteUrl albo pochodzić z `routes` (src/config/site.ts), które już go używa.
 * Obie funkcje są idempotentne: adres, który już zaczyna się od podścieżki, nie dostaje jej drugi raz.
 * Linki zewnętrzne (https:, mailto:, tel:, //host), kotwice (#id) i adresy względne zostają bez zmian.
 */
import { BASE_PATH, SITE_URL } from '../../build-env.mjs';

/** Podścieżka bez końcowego ukośnika: '' (korzeń domeny) albo '/strona-labeaute'. */
export const base = BASE_PATH === '/' ? '' : BASE_PATH;

const NOT_INTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** Dopisuje podścieżkę do adresu zaczynającego się od "/" (np. '/cennik/', '/#kontakt', '/og.png'). */
export function withBase(path: string): string {
  if (!base || !path.startsWith('/') || NOT_INTERNAL.test(path)) return path;
  const alreadyPrefixed =
    path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}#`) || path.startsWith(`${base}?`);
  return alreadyPrefixed ? path : `${base}${path}`;
}

/** Pełny adres (z domeną) dla ścieżki w obrębie serwisu, np. do canonical, og:image i JSON-LD. */
export function absoluteUrl(path: string): string {
  return new URL(withBase(path), SITE_URL).href;
}
