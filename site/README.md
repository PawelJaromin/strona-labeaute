# La Beauté Aldona Targiel — strona www salonu (Orzesze)

Statyczna strona salonu kosmetycznego zbudowana w [Astro 5](https://astro.build), tylko po polsku.
Fonty (Cormorant Garamond, Jost) są hostowane lokalnie; jedyny zasób zewnętrzny to okno
rezerwacji Booksy (`booksy.com/widget-2021` w `<iframe>`), wczytywane dopiero po kliknięciu „Umów”.
Strona nie ładuje skryptów Booksy (`widget/code.js` nie jest używany).
Wytyczne: `../BRIEF.md`, fakty o salonie: `../dane/research.md`.

Każdy push na gałąź `main` buduje stronę w GitHub Actions i wgrywa ją przez SFTP na hosting OVH
(sekcja „Publikacja: GitHub → OVH (automatyczna)”).

## Uruchomienie

Wymagany Node.js 22+ (zainstalowany jest 24) i Python 3 (skrypty kontrolne).

```bash
npm install          # raz, po sklonowaniu
npm run dev          # serwer deweloperski: http://127.0.0.1:4341
npm run build        # buduje stronę do katalogu dist/ (scripts/build.mjs ovh)
npm run build:check  # to samo + kontrola kontrastu kolorów i linków/meta/rytmu stron
npm run preview      # podgląd zbudowanej wersji: http://127.0.0.1:4342
npm run check        # astro check: typy w plikach .astro i .ts
npm run check:contrast   # same pary kolorów z tokens.css
npm run check:links      # sam skrypt linkcheck.py na gotowym dist/
npm run test         # check + build:check (to samo robi workflow przed publikacją)
npm run sync         # pobiera aktualny cennik z Booksy do src/data/uslugi.json
npm run icons        # favicony i ikony z lotosu (src/assets/logo/logo-znak.png)
npm run og           # obraz Open Graph public/og.png (logo na kości słoniowej)
```

`npm run sync` zapisuje plik tylko wtedy, gdy pobrał i rozpoznał co najmniej 50 usług;
w przeciwnym razie zostawia stary cennik i kończy się błędem. Opcje: `--dry-run` (tylko
pokaż zmiany), `--html plik.html` (parsuj zapisaną stronę). Po synchronizacji: `npm run test`.

Windows: przed `npm run build` zatrzymaj `npm run preview` (podgląd trzyma pliki w `dist/` i build kończy się
błędem EPERM).

Porty `dev` (4341) i `preview` (4342) są wpisane w `package.json`. Nie dopisuj własnego `--port` po `--`
(`npm run preview -- --port 4348`): Astro dostaje wtedy dwie flagi `--port` i po cichu przechodzi na port 4321.
Żeby podejrzeć stronę na innym porcie, uruchom bezpośrednio:
`node node_modules/astro/astro.js preview --port 4348 --host 127.0.0.1` (tak samo `dev`).

## Gdzie co jest

| Co | Plik |
|---|---|
| Dane salonu (adres, telefon, godziny, zespół, oceny, Booksy) | `src/config/site.ts` |
| **Adres (domena) strony produkcyjnej** (jedyne miejsce), podścieżka, endpoint formularza | `deploy/targets.json` |
| Czytanie adresu i trybu budowania (zmienne `SITE_URL`, `BASE_PATH`, `PUBLIC_FORM_ENDPOINT`, `STAGING` mają pierwszeństwo) | `build-env.mjs` |
| Build produkcyjny (`astro build`, kopiowanie `deploy/ovh/`, domena do `.htaccess`, kontrole) | `scripts/build.mjs` |
| Konfiguracja Apache na OVH (szablon z tokenem domeny: HTTPS, jeden adres bez `www`, CSP z wyjątkiem dla Booksy, cache, 404) | `deploy/ovh/.htaccess` |
| Skrypt formularza kontaktowego (PHP `mail()`) | `deploy/ovh/api/kontakt.php` |
| Formularz kontaktowy (front) | `src/components/ContactForm.astro` (osadzony w `Contact.astro`) |
| Publikacja na OVH (na każdy push do `main`) | `../.github/workflows/deploy.yml` |
| Kopia tymczasowa na GitHub Pages (tylko ręcznie) | `../.github/workflows/pages.yml` |
| Cennik z Booksy (usługi, ceny, czasy, variant_id) | `src/data/uslugi.json` |
| Funkcje cennika (kategorie, ceny „od”, czasy, linki rezerwacji) | `src/lib/uslugi.ts` |
| Dane strukturalne JSON-LD | `src/lib/schema.ts` |
| Kolory i fonty | `src/styles/tokens.css` |
| Style globalne (sekcje, ciemne pasy, przyciski, tekst) | `src/styles/global.css` |
| Szablon strony: head, SEO, nagłówek, pas CTA, stopka, okno rezerwacji | `src/layouts/Base.astro` |
| Strony | `src/pages/*.astro` |
| Komponenty | `src/components/*.astro` |
| Zdjęcia (tymczasowe, niska rozdzielczość) i logo | `src/assets/` |
| Okno rezerwacji (wszystkie przyciski „Umów”) | `src/components/BookingModal.astro` |
| Adresy z podścieżką: `withBase('/cennik/')`, `absoluteUrl('/og.png')` | `src/lib/url.ts` |
| `robots.txt` i `site.webmanifest` (generowane przy buildzie, zależą od domeny i trybu) | `src/pages/robots.txt.ts`, `src/pages/site.webmanifest.ts` |
| Kontrole po buildzie | `scripts/check-contrast.mjs`, `scripts/linkcheck.py` |

Co trafia na serwer: wyłącznie zawartość `dist/` (strona, `.htaccess`, `api/kontakt.php`). Źródła, `docs/`,
`node_modules`, `.git` i klucze nie opuszczają repozytorium; `scripts/build.mjs` przerywa build, jeśli
w `dist/` znajdzie coś, co nie jest stroną.

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

## Formularz kontaktowy

Sekcja „Kontakt” na stronie głównej ma pod danymi kontaktowymi formularz (`ContactForm.astro`): imię,
e-mail i/lub telefon (wystarczy jedno), wiadomość, zgoda RODO (z linkiem do polityki prywatności) i ukryte
pole-pułapka na boty. Bez zewnętrznego dostawcy i bez zewnętrznych skryptów.

- **Produkcja (OVH):** mały skrypt wysyła pola (`fetch`, `multipart/form-data`) na adres z `formEndpoint`
  w `deploy/targets.json` (`/api/kontakt.php`; **tylko ścieżka na tej samej domenie**: pełny adres `https://...`
  `build-env.mjs` odrzuca, bo CSP z `.htaccess` (`connect-src` i `form-action 'self'`) zablokowałoby wysyłkę
  w przeglądarce, a `kontakt.php` i tak przyjmuje tylko żądania z własnej domeny). `kontakt.php` wymaga nagłówka
  `Origin` albo `Referer` z własnej domeny (żądanie bez obu jest odrzucane kodem `origin`), sprawdza pułapkę
  `_gotcha`, wymagane pola, zgodę (`consent=tak`; `0`, `nie` i puste nie są zgodą), długości pól (wiadomość do 4000
  znaków; za długie pole jest odrzucane kodem `toolong`, nie skracane) i odstęp 20 s między wysyłkami z jednego IP,
  po czym wysyła e-mail funkcją `mail()` (data w treści w czasie `Europe/Warsaw`) i odpowiada JSON-em:
  `{"ok":true}` albo `{"ok":false,"error":"..."}`.
- **Bez endpointu** (kopia tymczasowa na GitHub Pages, albo `PUBLIC_FORM_ENDPOINT=` puste): formularz otwiera
  program pocztowy z gotową wiadomością (`mailto:` na adres z `src/config/site.ts`).
- **Niepowodzenie wysyłki** (także dopóki w `kontakt.php` są placeholdery): strona pokazuje komunikat
  „Nie udało się wysłać wiadomości…” z numerem telefonu i adresem e-mail salonu. Sukces jest pokazywany
  tylko po odpowiedzi `{"ok":true}`.
- **Do uzupełnienia przez właściciela:** w `deploy/ovh/api/kontakt.php` zmienne `$TO` (skrzynka, na którą
  mają przychodzić wiadomości) i `$FROM` (nadawca w domenie strony, np. `formularz@twoja-domena.pl`, żeby
  przeszedł SPF/DKIM OVH; adres musi istnieć jako skrzynka lub alias w poczcie OVH tej domeny). Dopóki zawierają
  `UZUPELNIJ`, skrypt odpowiada `{"ok":false,"error":"config"}` i niczego nie wysyła. Plik jest publiczny:
  wpisuj tylko adresy e-mail, nigdy haseł.
- **`$TO` a polityka prywatności:** punkty 5, 6 i 8 polityki zakładają, że wiadomości z formularza trafiają na
  skrzynkę Gmail salonu (`email` w `src/config/site.ts`, teraz `labeaute.at@gmail.com`). Jeśli wpiszesz w `$TO`
  inny adres (np. skrzynkę w poczcie OVH), popraw te punkty w `src/pages/polityka-prywatnosci.astro`. Gdy `$TO` jest
  inny niż `email` z `site.ts`, `npm run build` wypisuje ostrzeżenie (w Actions także adnotację).
- **Polityka prywatności** (punkt „Formularz kontaktowy”) opisuje dane, cel, podstawę i czas przechowywania.
  Przy zmianie pól lub celu formularza zaktualizuj ją.
- Test ręczny po publikacji: ostatnie polecenie `curl` w sekcji „Testy po pierwszej publikacji”.

## Domena i tryby budowania

Ten sam kod buduje się w dwóch trybach, sterowanych `deploy/targets.json` i zmiennymi środowiskowymi
(czyta je `build-env.mjs`, a z niego `astro.config.mjs`, `src/config/site.ts`, `src/lib/url.ts`
i `scripts/build.mjs`; `scripts/linkcheck.py` czyta ten sam `targets.json`). **Zmienne środowiskowe mają
pierwszeństwo nad `targets.json`.**

| Zmienna | Znaczenie | Produkcja (OVH) | Kopia tymczasowa (GitHub Pages) |
|---|---|---|---|
| `SITE_URL` | sama domena, bez ścieżki | brak = `ovh.site` z `deploy/targets.json` | `https://paweljaromin.github.io` |
| `BASE_PATH` | podścieżka serwisu | brak = `ovh.base` (`/`, korzeń domeny) | `/strona-labeaute` |
| `PUBLIC_FORM_ENDPOINT` | ścieżka skryptu formularza na tej samej domenie (nie pełny adres); pusty = `mailto:` | brak = `ovh.formEndpoint` (`/api/kontakt.php`) | puste (nie ma PHP) |
| `STAGING` | `1` = kopia tymczasowa (noindex) | brak | `1` (włącza się też sama, gdy `BASE_PATH` nie jest `/`) |

Stąd biorą adres: `canonical`, Open Graph, JSON-LD, sitemap, `robots.txt`, `site.webmanifest` i przekierowania
w `.htaccess` (podstawia je `scripts/build.mjs`). Po zmianie adresu `npm run test` sprawdza spójność.

Wszystkie wewnętrzne adresy w kodzie przechodzą przez `src/lib/url.ts` (`withBase`, `absoluteUrl`) albo
`routes` z `src/config/site.ts`, więc na kopii pod `/strona-labeaute/` żaden link, obraz ani ikona nie
wskazuje na korzeń domeny. W nowym kodzie nie wpisuj na sztywno `href="/..."` ani `src="/..."`.

Tryb tymczasowy (`STAGING`) dodaje do każdej strony `<meta name="robots" content="noindex, nofollow">`,
a `robots.txt` ma wtedy `Disallow: /`. Produkcyjny `robots.txt` ma `Allow: /` i adres sitemap. Kopia tymczasowa
nie dostaje `.htaccess` ani `api/` (GitHub Pages ich nie używa).

### Jak zmienić domenę (jedno miejsce)

1. Otwórz `deploy/targets.json` i w polu `ovh.site` wpisz domenę salonu: sama domena, bez `www` i bez ścieżki,
   z `https://`, np. `https://labeaute.pl`. **To jedyne miejsce w repozytorium z adresem produkcyjnym.**
   Obecnie wpisana jest domena produkcyjna `https://labeaute-at.pl`. Gdyby wrócił placeholder `labeaute.example.pl`, build wypisze ostrzeżenie,
   a w GitHub Actions (poza próbą na sucho) się zatrzymuje.
2. `npm run test` (adresy w canonical, sitemap, `robots.txt` i `.htaccess` mają nową domenę).
3. Wypchnij zmianę na `main`: workflow opublikuje stronę. Domena musi być już dodana w OVH (krok 2
   „Jednorazowej konfiguracji”), inaczej odwiedzający zostaną przekierowani na niedziałający adres.

**Zabezpieczenie przed placeholderem:** w GitHub Actions produkcyjny build z domeną `labeaute.example.pl` (albo
inną `example.*` / `localhost`) kończy się błędem w kroku „Build z kontrolami” i nic nie jest wgrywane na OVH.
Bez tego push na `main` po dodaniu sekretów, ale przed wpisaniem domeny, wgrałby `.htaccess`, który przekierowuje
każde żądanie na nieistniejący adres. Wyjątek: „próba na sucho” (nic nie zmienia na serwerze) przechodzi
z samym ostrzeżeniem. Lokalnie `npm run test` z placeholderem też przechodzi (tylko ostrzeżenie), żeby dało się
pracować przed ustaleniem domeny.

## Publikacja: GitHub → OVH (automatyczna)

Każdy push na `main` uruchamia `.github/workflows/deploy.yml` („Publikacja na OVH”): Node 24, `npm ci`,
kontrola sekretów, `npm run check` (astro check), `npm run build:check` (build z `deploy/ovh/`, kontrast,
linki, canonical, jeden `h1`, długości `title` do 60 i `description` do 160 znaków), test połączenia SFTP
z czytelnym komunikatem błędu i `lftp mirror -R --delete` z `site/dist/` do katalogu `www/` na hostingu.
Na serwerze zostaje dokładnie to, co jest w buildzie. Transfer tylko przez **SFTP** (zwykłe FTP i FTPS w OVH odpadają).

> **Uwaga: `--delete` usuwa z `www/` wszystko, czego nie ma w `site/dist/`.** Dotyczy to także plików i podfolderów
> spoza tej strony. Jeśli na tym samym hostingu OVH działają inne domeny (Multisite) w podfolderach `www/`
> (np. `www/inna-domena/`), wgranie do `www/` skasuje je. Wtedy dla tej strony wskaż w Multisite jej własny
> katalog (np. `www/labeaute`) i wpisz go w `REMOTE_DIR` w `deploy.yml`. Pierwsze uruchomienie zawsze zrób
> z „próbą na sucho” i przejrzyj w logu linie o usuwaniu plików (`Removing old file` albo `rm`), zanim uruchomisz publikację naprawdę.

### Jednorazowa konfiguracja (robi właściciel)

1. **Domena w repozytorium:** wpisz ją w `deploy/targets.json` (patrz wyżej) i wypchnij.
2. **Panel OVH → hosting → Multisite:** dodaj domenę i `www.` tej domeny z katalogiem głównym `www`,
   włącz SSL (Let's Encrypt). Jeśli domena ma inny katalog, wpisz ten sam w `REMOTE_DIR` w `deploy.yml`.
   Katalog ma należeć tylko do tej strony: workflow czyści go z wszystkiego, czego nie ma w buildzie (patrz uwaga
   o `--delete` wyżej).
   Reguły `.htaccess` przekierowują `http`, `www` i każdy inny alias na `https://[DOMENA]`, więc `www` musi
   wskazywać na ten sam hosting.
3. **Panel OVH → hosting → FTP-SSH:** SFTP włączone dla użytkownika; stąd adres serwera
   (np. `ftp.clusterNNN.hosting.ovh.net`), login i hasło. Hosting „Cloud Web” ma inny port SFTP: zmień `SFTP_PORT`.
4. **GitHub → Settings → Secrets and variables → Actions → Secrets:** `OVH_SFTP_HOST`, `OVH_SFTP_USER`,
   `OVH_SFTP_PASSWORD`. Bez nich workflow zatrzyma się na kroku „Sprawdź sekrety OVH” (nic nie zostanie wgrane).
5. **Formularz:** wpisz `$TO` i `$FROM` w `deploy/ovh/api/kontakt.php` (patrz „Formularz kontaktowy”) i wypchnij.
6. **Pierwsze uruchomienie:** Actions → „Publikacja na OVH” → Run workflow z zaznaczoną „Próbą na sucho”
   (pokazuje, co zostałoby wgrane, niczego nie zmienia na serwerze), potem bez niej (albo zwykły push na `main`).
7. **Google Search Console:** zasób typu „Domena” (rekord TXT w DNS), zgłoszenie `https://[DOMENA]/sitemap-index.xml`.
8. Uzupełnij w `src/config/site.ts` (`legal`) pełną nazwę firmy z CEIDG, NIP i dostawcę hostingu
   (polityka prywatności, stopka); do tego czasu build wypisuje ostrzeżenie `[polityka-prywatnosci]`.

### Próba na sucho

Actions → „Publikacja na OVH” → **Run workflow** → zaznacz „Próba na sucho”. Workflow wykonuje wszystkie kroki
(sprawdzenie sekretów, `check`, `build:check`, test SFTP), a `lftp mirror` dostaje `--dry-run`: w logu widać,
które pliki zostałyby wgrane lub usunięte, a serwer pozostaje bez zmian. Jedynie próba na sucho przechodzi także
z domeną-placeholderem (workflow ustawia wtedy `ALLOW_PLACEHOLDER_DOMAIN=1`); zwykła publikacja z placeholderem
zatrzymuje się na kroku „Build z kontrolami”.

### Publikacja awaryjna przez SFTP (FileZilla)

Gdy GitHub Actions jest niedostępny:

1. Na swoim komputerze: `npm ci`, potem `npm run test` (musi przejść). Wynik jest w `dist/`.
2. FileZilla → Plik → Menedżer witryn → nowa witryna: protokół **SFTP — SSH File Transfer Protocol**, serwer, login
   i hasło z panelu OVH (Hosting → FTP-SSH), port 22.
3. Włącz widok ukrytych plików (Serwer → Wymuś wyświetlanie ukrytych plików), bo `dist/.htaccess` jest ukryty.
4. Wgraj **zawartość** `dist/` (razem z `.htaccess` i `api/`) do katalogu `www/`, nadpisując pliki. Pliki, których
   nie ma w `dist/`, a są na serwerze, usuń ręcznie (workflow robi to sam przez `--delete`).
5. Zweryfikuj stronę poleceniami z sekcji „Testy po pierwszej publikacji”.

### Testy po pierwszej publikacji

Po pierwszym wdrożeniu (w miejsce `[DOMENA]` wstaw domenę z `deploy/targets.json`):

```bash
curl -sI http://[DOMENA]/ | grep -i "^HTTP\|^location"            # 301 -> https://[DOMENA]/
curl -sI https://www.[DOMENA]/ | grep -i "^HTTP\|^location"       # 301 -> https://[DOMENA]/ (bez :443)
curl -sI https://[DOMENA]/index.html | grep -i "^location"        # 301 -> https://[DOMENA]/
curl -sI https://[DOMENA]/cennik | grep -i "^HTTP\|^location"     # 301 -> https://[DOMENA]/cennik/
curl -sI https://[DOMENA]/nie-ma-takiej-strony/ | head -1         # HTTP/2 404 (własna strona 404)
curl -sI https://[DOMENA]/ | grep -i "strict-transport\|content-security\|x-frame"
curl -s https://[DOMENA]/robots.txt; curl -s https://[DOMENA]/sitemap-index.xml | head -5
curl -s -X POST https://[DOMENA]/api/kontakt.php -F name=test -F email=test@example.com -F message=test -F consent=tak -H "Origin: https://[DOMENA]"
curl -s -X POST https://[DOMENA]/api/kontakt.php -F name=test -F email=test@example.com -F message=test -F consent=tak   # bez Origin: {"ok":false,"error":"origin"}
```

Oczekiwane: jedna domena bez `www`, brak `:443` w `Location`, `404` zwraca kod 404, nagłówki bezpieczeństwa
obecne (w CSP jest `frame-src https://booksy.com`), formularz odpowiada JSON-em (`{"ok":false,"error":"config"}`
do czasu uzupełnienia `$TO`/`$FROM`, potem `{"ok":true}` i mail na `$TO`; żądanie bez `Origin` dostaje `origin`, a po
uzupełnieniu adresów odstęp 20 s między dwiema wysyłkami z jednego IP daje `rate`). Nagłówków z `.htaccess` nie da się
sprawdzić lokalnie (`astro preview` ich nie wysyła), dlatego robi się to na hostingu.

## Kopia tymczasowa na GitHub Pages (ręcznie)

Adres: **https://paweljaromin.github.io/strona-labeaute/**. Workflow `.github/workflows/pages.yml` („Pages (staging)”)
uruchamia się **wyłącznie ręcznie** (`workflow_dispatch`), NIE przy pushu: na push do `main` działa tylko publikacja
na OVH.

1. Jednorazowo w repozytorium na GitHub: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
2. *Actions → Pages (staging) → Run workflow*. Workflow robi `npm ci`, build z `SITE_URL`, `BASE_PATH`, `STAGING=1`
   i `PUBLIC_FORM_ENDPOINT` pustym (zmienne środowiskowe wygrywają z `targets.json`), potem `check:contrast`
   i `check:links -- dist` na zbudowanym `dist/` i publikuje `site/dist`.
3. Kopia jest **noindex**: wyszukiwarki nie powinny jej indeksować. Decyduje o tym `meta robots` na każdej stronie;
   `robots.txt` pod podścieżką `/strona-labeaute/` nie jest czytany przez roboty (czytają tylko ten z korzenia
   domeny `paweljaromin.github.io`), więc nie traktuj go jako zabezpieczenia.
4. Co jest inaczej niż na produkcji: nie ma `.htaccess` (brak nagłówków CSP/HSTS, przekierowań i `ErrorDocument`;
   stronę 404 serwuje sam GitHub), nie ma `api/kontakt.php` (formularz otwiera program pocztowy), a darmowe konto
   GitHub publikuje Pages tylko z repozytoriów publicznych, czyli kod i pliki repozytorium (także folder `dane/`)
   są wtedy widoczne dla wszystkich.
5. Po uruchomieniu domeny wyłącz kopię: usuń `.github/workflows/pages.yml` i w *Settings → Pages* wybierz
   *Unpublish site*, żeby stara wersja nie krążyła w sieci.

Ręczny build kopii na swoim komputerze (do sprawdzenia przed uruchomieniem workflow):

```powershell
# PowerShell
$env:SITE_URL='https://paweljaromin.github.io'; $env:BASE_PATH='/strona-labeaute'; $env:STAGING='1'
npm run build:check
Remove-Item Env:SITE_URL, Env:BASE_PATH, Env:STAGING   # wróć do trybu produkcyjnego
```

W Git Bash dopisz `MSYS_NO_PATHCONV=1` przed zmiennymi (inaczej Git Bash zamienia `/strona-labeaute` na ścieżkę
`C:/Program Files/Git/...`; build zgłasza wtedy czytelny błąd), np.
`MSYS_NO_PATHCONV=1 SITE_URL=https://paweljaromin.github.io BASE_PATH=/strona-labeaute STAGING=1 npm run build:check`.
`build.mjs` przekazuje te same zmienne do kontroli linków. Po takim buildzie `dist/` jest kopią tymczasową: przed
publikacją na OVH zbuduj ją od nowa bez tych zmiennych (workflow `deploy.yml` robi to na czystym środowisku).
