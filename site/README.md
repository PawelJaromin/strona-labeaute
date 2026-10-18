# La Beauté Aldona Targiel — strona www salonu (Orzesze)

Statyczna strona salonu kosmetycznego zbudowana w [Astro 5](https://astro.build), tylko po polsku.
Fonty (Cormorant Garamond, Jost) są hostowane lokalnie; jedyny zasób zewnętrzny to okno
rezerwacji Booksy (`booksy.com/widget-2021` w `<iframe>`), wczytywane dopiero po kliknięciu „Umów”.
Strona nie ładuje skryptów Booksy (`widget/code.js` nie jest używany).
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
| Konfiguracja Apache (HTTPS, CSP z wyjątkiem dla Booksy, cache, 404); ignorowana przez GitHub Pages | `public/.htaccess` |
| Okno rezerwacji (wszystkie przyciski „Umów”) | `src/components/BookingModal.astro` |
| Domena, podścieżka i tryb tymczasowy (zmienne `SITE_URL`, `BASE_PATH`, `STAGING`) | `build-env.mjs` |
| Adresy z podścieżką: `withBase('/cennik/')`, `absoluteUrl('/og.png')` | `src/lib/url.ts` |
| `robots.txt` i `site.webmanifest` (generowane przy buildzie, zależą od domeny i trybu) | `src/pages/robots.txt.ts`, `src/pages/site.webmanifest.ts` |
| Publikacja kopii tymczasowej na GitHub Pages | `../.github/workflows/pages.yml` |

## Rytm stron

Każda strona: jasny nagłówek → ciemny pas (na podstronach `PageIntro`, na stronie głównej
jasne hero, a pod „Zabiegami” ciemny pas opinii) → sekcje na przemian biel / kość słoniowa →
ciemny pas CTA (`CtaBand`, dodaje go `Base.astro`) → ciemna stopka. `npm run check:links`
pilnuje tego automatycznie.

## Rezerwacje (Booksy)

Wszystkie przyciski rezerwacji otwierają to samo okno na stronie (`BookingModal`): `<dialog>` na
wysokość ekranu z `<iframe>` okna Booksy, które przewija się w środku, więc komunikaty Booksy
(np. „Brak wolnych terminów”) są zawsze widoczne. „Umów wizytę” (nagłówek, wstęp, pas CTA, kontakt)
pokazuje wszystkie usługi salonu (`site.booksy.widgetBase`), „Umów” przy pozycji cennika od razu
wybraną usługę (`&variantId=`). Bez JavaScriptu przyciski są zwykłymi linkami do Booksy w nowej karcie.

## Domena i tryby budowania

Ten sam kod buduje się w dwóch trybach, sterowanych zmiennymi środowiskowymi (czyta je `build-env.mjs`,
a z niego `astro.config.mjs`, `src/config/site.ts` i `src/lib/url.ts`):

| Zmienna | Znaczenie | Produkcja (OVH) | Kopia tymczasowa (GitHub Pages) |
|---|---|---|---|
| `SITE_URL` | sama domena, bez ścieżki | brak = `DEFAULT_SITE_URL` z `build-env.mjs` | `https://paweljaromin.github.io` |
| `BASE_PATH` | podścieżka serwisu | brak = `/` (korzeń domeny) | `/strona-labeaute` |
| `STAGING` | `1` = kopia tymczasowa (noindex) | brak | `1` (włącza się też sama, gdy `BASE_PATH` nie jest `/`) |

**Adres produkcyjny jest tymczasowy: `https://labeaute.example.pl`. Po ustaleniu domeny zmieniasz go w
JEDNYM miejscu: stała `DEFAULT_SITE_URL` w pliku `build-env.mjs`.** Stąd biorą adres: `canonical`, Open Graph,
JSON-LD, sitemap, `robots.txt` i `site.webmanifest`. Potem `npm run test` (sprawdza spójność adresów).
Zamiast edytować plik, można też ustawić `SITE_URL` przy samym buildzie (np. `SITE_URL=https://labeaute.pl npm run build`).

Wszystkie wewnętrzne adresy w kodzie przechodzą przez `src/lib/url.ts` (`withBase`, `absoluteUrl`) albo
`routes` z `src/config/site.ts`, więc na kopii pod `/strona-labeaute/` żaden link, obraz ani ikona nie
wskazuje na korzeń domeny. W nowym kodzie nie wpisuj na sztywno `href="/..."` ani `src="/..."`.

Tryb tymczasowy (`STAGING`) dodaje do każdej strony `<meta name="robots" content="noindex, nofollow">`,
a `robots.txt` ma wtedy `Disallow: /`. Produkcyjny `robots.txt` ma `Allow: /` i adres sitemap.

## Wdrożenie

### Kopia tymczasowa na GitHub Pages (do czasu uruchomienia domeny)

Adres: **https://paweljaromin.github.io/strona-labeaute/**

1. Jednorazowo w repozytorium na GitHub: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
2. Każdy push na gałąź `main` uruchamia `.github/workflows/pages.yml` (ręcznie: *Actions → Pages (staging) →
   Run workflow*). Workflow robi `npm ci`, build z `SITE_URL`, `BASE_PATH`, `STAGING=1`, potem
   `check:contrast` i `check:links -- dist` na zbudowanym `dist/` i publikuje `site/dist`.
3. Kopia jest **noindex**: wyszukiwarki nie powinny jej indeksować. Decyduje o tym `meta robots` na każdej stronie;
   `robots.txt` pod podścieżką `/strona-labeaute/` nie jest czytany przez roboty (czytają tylko ten z korzenia
   domeny `paweljaromin.github.io`), więc nie traktuj go jako zabezpieczenia.
4. Co jest inaczej niż na produkcji: `.htaccess` jest ignorowany (brak nagłówków CSP/HSTS, przekierowań i
   `ErrorDocument`; stronę 404 serwuje sam GitHub), a darmowe konto GitHub publikuje Pages tylko z repozytoriów
   publicznych, czyli kod i pliki repozytorium (także folder `dane/`) są wtedy widoczne dla wszystkich.
5. Po uruchomieniu domeny wyłącz kopię: usuń `.github/workflows/pages.yml` i w *Settings → Pages* wybierz
   *Unpublish site*, żeby stara wersja nie krążyła w sieci.

Ręczny build kopii na swoim komputerze (do sprawdzenia przed pushem):

```powershell
# PowerShell
$env:SITE_URL='https://paweljaromin.github.io'; $env:BASE_PATH='/strona-labeaute'; $env:STAGING='1'
npx astro build --outDir dist-pages
npm run check:links -- dist-pages
Remove-Item Env:SITE_URL, Env:BASE_PATH, Env:STAGING   # wróć do trybu produkcyjnego
```

W Git Bash dopisz `MSYS_NO_PATHCONV=1` przed zmiennymi (inaczej Git Bash zamienia `/strona-labeaute` na ścieżkę
`C:/Program Files/Git/...`; build zgłasza wtedy czytelny błąd), np.
`MSYS_NO_PATHCONV=1 SITE_URL=https://paweljaromin.github.io BASE_PATH=/strona-labeaute STAGING=1 npx astro build --outDir dist-pages`.
`check:links` musi dostać te same zmienne co build. Katalogi `dist-*/` są poza gitem.

### Produkcja na hostingu OVH (Apache, korzeń domeny)

1. Ustal domenę i wpisz ją w `build-env.mjs` (`DEFAULT_SITE_URL`), patrz wyżej.
2. Zbuduj bez zmiennych `BASE_PATH` i `STAGING` (sprawdź, że nie zostały w środowisku po buildzie kopii):
   `npm run test` (build + kontrast + linki, meta, robots, sitemap).
3. Wgraj **zawartość** katalogu `dist/` (razem z ukrytym plikiem `.htaccess`) do katalogu głównego domeny na
   hostingu (FTP/SFTP). Plik `.nojekyll` jest niepotrzebny na Apache, ale niczemu nie szkodzi.
4. `.htaccess` wymusza HTTPS i adres bez `www`, więc domena musi mieć aktywny certyfikat SSL. Nagłówków z
   `.htaccess` nie da się sprawdzić lokalnie, zweryfikuj je na hostingu (np. `curl -I https://domena/`).
5. Sprawdź `https://domena/robots.txt` (ma być `Allow: /` i `Sitemap: https://domena/sitemap-index.xml`) oraz
   brak `noindex` na stronach, i zgłoś `https://domena/sitemap-index.xml` w Google Search Console.
