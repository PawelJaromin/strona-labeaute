import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Adres produkcyjny: DOMENA DO USTALENIA z właścicielką (np. labeaute.pl).
// Ten sam adres jest w src/config/site.ts (site.url). Zmieniaj oba naraz.
const SITE = 'https://labeaute.example.pl';

export default defineConfig({
  site: SITE,
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
