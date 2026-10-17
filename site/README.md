# La Beauté Aldona Targiel — strona www salonu (Orzesze)

Statyczna strona salonu kosmetycznego zbudowana w [Astro 5](https://astro.build), tylko po polsku.
Fonty (Cormorant Garamond, Jost) są hostowane lokalnie; jedyne zasoby zewnętrzne to okno
rezerwacji Booksy, ładowane dopiero po wskazaniu lub kliknięciu przycisku „Umów”.
Wytyczne: `../BRIEF.md`, fakty o salonie: `../dane/research.md`.

## Uruchomienie

Wymagany Node.js 20+ (zainstalowany jest 24) i Python 3 (skrypty kontrolne).

```bash
npm install          # raz, po sklonowaniu
npm run dev          # serwer deweloperski: http://127.0.0.1:4341
npm run build        # buduje stronę do katalogu dist/
npm run preview      # podgląd zbudowanej wersji: http://127.0.0.1:4342
npm run test         # build + kontrast kolorów + linki/meta/rytm stron
npm run sync         # pobiera aktualny cennik z Booksy do src/data/uslugi.json
npm run icons        # favicony i ikony z lotosu (src/assets/logo/logo-znak.png)
npm run og           # obraz Open Graph public/og.png (logo na kości słoniowej)
```

`npm run sync` zapisuje plik tylko wtedy, gdy pobrał i rozpoznał co najmniej 50 usług;
w przeciwnym razie zostawia stary cennik i kończy się błędem. Opcje: `--dry-run` (tylko
pokaż zmiany), `--html plik.html` (parsuj zapisaną stronę). Po synchronizacji: `npm run test`.

## Gdzie co jest

| Co | Plik |
|---|---|
| Dane salonu (adres, telefon, godziny, zespół, oceny, Booksy, domena) | `src/config/site.ts` |
| Cennik z Booksy (usługi, ceny, czasy, variant_id) | `src/data/uslugi.json` |
| Funkcje cennika (kategorie, ceny „od”, czasy, linki rezerwacji) | `src/lib/uslugi.ts` |
| Dane strukturalne JSON-LD | `src/lib/schema.ts` |
| Kolory i fonty | `src/styles/tokens.css` |
| Style globalne (sekcje, ciemne pasy, przyciski, tekst) | `src/styles/global.css` |
| Szablon strony: head, SEO, nagłówek, pas CTA, stopka, okno rezerwacji | `src/layouts/Base.astro` |
| Strony | `src/pages/*.astro` |
| Komponenty | `src/components/*.astro` |
| Zdjęcia (tymczasowe, niska rozdzielczość) i logo | `src/assets/` |
| Konfiguracja Apache (HTTPS, CSP z wyjątkiem dla Booksy, cache, 404) | `public/.htaccess` |

## Rytm stron

Każda strona: jasny nagłówek → ciemny pas (na podstronach `PageIntro`, na stronie głównej
jasne hero, a pod „Zabiegami” ciemny pas opinii) → sekcje na przemian biel / kość słoniowa →
ciemny pas CTA (`CtaBand`, dodaje go `Base.astro`) → ciemna stopka. `npm run check:links`
pilnuje tego automatycznie.

## Domena

Adres produkcyjny jest tymczasowy (`https://labeaute.example.pl`). Po ustaleniu domeny zmień go
w trzech miejscach: `src/config/site.ts` (`site.url`), `astro.config.mjs` (`SITE`) i
`public/robots.txt` (`Sitemap:`), potem `npm run test`.

## Wdrożenie

Zawartość katalogu `dist/` (razem z ukrytym plikiem `.htaccess`) wgrywa się na zwykły hosting
z Apache (np. OVH) do katalogu głównego domeny.
