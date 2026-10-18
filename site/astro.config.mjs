import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, BASE_PATH } from './build-env.mjs';

// Adres (`site`) i podścieżka (`base`) pochodzą ze zmiennych środowiskowych SITE_URL i BASE_PATH
// (domyślnie: adres produkcyjny z build-env.mjs i korzeń domeny). Szczegóły i zasady: build-env.mjs.
// Tymczasowa kopia na GitHub Pages: SITE_URL=https://paweljaromin.github.io BASE_PATH=/strona-labeaute.

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Style i skrypty jako osobne pliki, żeby hosting mógł ustawić CSP bez 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
    server: {
      // Dysk J: nie obsługuje natywnego fs.watch, więc serwer deweloperski odpytuje pliki.
      watch: { usePolling: true, interval: 800 },
      hmr: { overlay: false },
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
