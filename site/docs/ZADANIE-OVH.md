# Zadanie: automatyczna publikacja strony La Beauté na hostingu OVH

(Tekst zadania od właściciela, dopasowany do tego repo. Pliki wzorcowe: `J:\strona-internetowa-spolki`
— repo `PawelJaromin/strona-internetowa-spolki`: `.github/workflows/deploy.yml`, `scripts/build.mjs`,
`deploy/targets.json`, `deploy/ovh/.htaccess`, `deploy/ovh/api/kontakt.php`; oraz `J:\strona\jaromind-site`:
`.github/workflows/deploy.yml`, `public/.htaccess`, `public/api/kontakt.php`. Repo tej strony:
`J:\strona labeaute`, projekt Astro w podfolderze `site/`, gałąź `main`, remote `PawelJaromin/strona-labeaute`.
Domena: NIEZNANA — zostaje placeholder `https://labeaute.example.pl` w `deploy/targets.json`, do uzupełnienia
przez właściciela w jednym miejscu.)

Doprowadź stronę do stanu, w którym każdy push na `main` buduje stronę w GitHub Actions, sprawdza ją i wgrywa
gotowe pliki przez SFTP do katalogu `www` hostingu OVH. Dokładnie tak działają strony jaromind.pl i stervecta.com
tego samego właściciela. Skopiuj z nich wymienione pliki i tylko dopasuj (domena, jeden język, brak i18n).

## Zasady pracy

- Pracuj w repozytorium. **Nie wykonuj poleceń git zmieniających stan** (commit robi orkiestrator). **Nie pushuj.**
  Nie włączaj GitHub Pages. Istniejący `.github/workflows/pages.yml` zostaje jako tryb ręczny
  (`workflow_dispatch` only, bez `push`), żeby na push działał wyłącznie pipeline OVH; opisz to w README.
- Transfer tylko przez **SFTP** (lftp). Zwykłe FTP i FTPS w OVH odpadają.
- Nie zgaduj danych hostingu, domeny ani firmy. Czego nie wiesz, zostaw jako jawny placeholder
  i wypisz na końcu listę rzeczy do uzupełnienia przez właściciela.
- Wszystko, co wgrywasz do `www`, jest publiczne. Do `dist/` nie może trafić nic poza stroną
  (żadnych plików źródłowych, `.git`, `node_modules`, kluczy, `docs/`).
- Po każdej zmianie w pipeline uruchom lokalnie `npm run test` (musi przejść), a przed oddaniem
  pracy wykonaj testy odbiorcze z końca tego dokumentu (te, które da się wykonać lokalnie).

## Stan docelowy

1. **Build statyczny** do `dist/` (Astro 5, `output: 'static'`, `trailingSlash: 'always'`,
   `build.format: 'directory'`). Adres produkcyjny jest w jednym miejscu: `deploy/targets.json`
   (cel `ovh`: `site`, `base`, `formEndpoint`); `astro.config.mjs` czyta stąd `site` i `base`,
   zmienne środowiskowe `SITE_URL` / `BASE_PATH` / `PUBLIC_FORM_ENDPOINT` mają pierwszeństwo
   (istniejący `site/build-env.mjs` ze `STAGING` i `withBase` ma dalej działać; staging Pages czyta env).
   Z `site` biorą się canonical, sitemap i robots.txt.
2. **Skrypt builda** `scripts/build.mjs` (`npm run build` = `node scripts/build.mjs ovh`,
   `npm run build:check` = to samo z `--check`): czyta `targets.json`, uruchamia `astro build`
   z właściwymi zmiennymi, kopiuje `deploy/ovh/` (plik `.htaccess` i katalog `api/`) do `dist/`,
   usuwa z `dist/_astro` obrazy, do których nic się nie odwołuje, a z `--check` uruchamia kontrole:
   kontrast kolorów i kontrolę linków (linki wewnętrzne z wielkością liter i `srcset`, canonical,
   dokładnie jeden `h1`, długości `<title>` do 60 i `description` do 160 znaków). Istniejące
   `public/.htaccess` przenieś do `deploy/ovh/.htaccess` (jedno źródło prawdy).
3. **Skrypty npm**: `dev`, `build`, `build:check`, `preview`, `check` (= `astro check`; dodaj
   `@astrojs/check` i `typescript` do devDependencies), `check:contrast`, `check:links`,
   `test` (= `check` + `build:check`), `sync` (zostaje).
4. **Workflow** `.github/workflows/deploy.yml` (treść jak w stervecta/jaromind, kroki w `site/`):
   na push do `main` oraz ręcznie z opcją „próba na sucho”; kroki: checkout, Node 24, `npm ci`,
   kontrola sekretów, `npm run check`, `npm run build:check`, instalacja lftp, test połączenia SFTP
   z czytelnym komunikatem błędu, `lftp mirror -R --delete` z `site/dist/` do `www/`.
   Sekrety: `OVH_SFTP_HOST`, `OVH_SFTP_USER`, `OVH_SFTP_PASSWORD`. `REMOTE_DIR: www`, `SFTP_PORT: "22"`.
   `working-directory: site` tam, gdzie trzeba; `cache-dependency-path: site/package-lock.json`.
5. **Apache na OVH** `deploy/ovh/.htaccess`: jeden adres kanoniczny `https://[DOMENA]` (http, `www`
   i każdy inny alias dostają 301 z zachowaniem ścieżki), `/index.html` -> `/`, katalog bez ukośnika ->
   z ukośnikiem, własna strona 404, nagłówki bezpieczeństwa (HSTS, CSP, X-Frame-Options,
   Referrer-Policy, Permissions-Policy), cache (rok dla zasobów z haszem, 10 minut dla HTML), kompresja.
   **Wszystkie przekierowania z pełnym adresem `https://[DOMENA]/...`**, bo przy względnych celach
   Apache OVH dokleja `:443` do nagłówka `Location`. Blok wyboru języka pomiń (strona jednojęzyczna).
   CSP: zachowaj to, czego strona potrzebuje (Booksy w ramce: `frame-src https://booksy.com`;
   formularz: `form-action 'self'`, `connect-src 'self'`); nic innego z zewnątrz.
   Ponieważ domena jest placeholderem, `.htaccess` ma pobierać domenę z `targets.json` przy buildzie
   (szablon z tokenem podmienianym przez `build.mjs`) ALBO zawierać placeholder z wyraźnym komentarzem —
   wybierz podmianę w `build.mjs`, żeby domena była naprawdę w jednym miejscu.
6. **Formularz kontaktowy** bez zewnętrznego dostawcy: `deploy/ovh/api/kontakt.php` (PHP `mail()`),
   POST `multipart/form-data`, odpowiedź JSON `{"ok":true}` / `{"ok":false,"error":"..."}`,
   sprawdzenie `Origin`/`Referer` z własnej domeny, pole-pułapka `_gotcha`, limit długości
   wiadomości, odstęp między wysyłkami z jednego IP, nagłówki `Content-Type: application/json`
   i `Cache-Control: no-store`. Adresy `$TO` i `$FROM` jako placeholder `UZUPELNIJ@...`; dopóki
   nie są uzupełnione, skrypt odpowiada `{"ok":false,"error":"config"}`, a strona pokazuje
   komunikat o niepowodzeniu wysyłki. `$FROM` musi być w domenie strony (SPF/DKIM OVH).
   Front: dodaj do sekcji „Kontakt” na stronie głównej prosty formularz (imię, e‑mail lub telefon,
   wiadomość, zgoda RODO, `_gotcha`) w stylu strony (K1/T1, kwadratowe pola, złote linie), wysyłany
   skryptem na `formEndpoint` z `targets.json` (`/api/kontakt.php`), a bez endpointu działający
   w trybie `mailto:`. Komunikaty po polsku, dostępność (etykiety, aria-live), bez zewnętrznych skryptów.
   Zaktualizuj politykę prywatności o formularz (dane, cel, podstawa, czas).
7. **README**: sekcja „Publikacja: GitHub → OVH (automatyczna)” z jednorazową konfiguracją
   (panel OVH, sekrety GitHub), opisem dry-run i publikacją awaryjną przez SFTP (FileZilla);
   osobno: jak zmienić domenę (jedno miejsce) i jak uruchomić ręcznie staging Pages.

## Jednorazowa konfiguracja (opisz w README, właściciel klika sam)

1. Panel OVH → hosting → **Multisite**: `[DOMENA]` (i `www.[DOMENA]`) z katalogiem głównym `www`,
   SSL Let's Encrypt włączony. Jeśli domena ma inny katalog, ten sam wpisać w `REMOTE_DIR`.
2. Panel OVH → hosting → **FTP-SSH**: SFTP włączone dla użytkownika; stąd adres serwera
   (np. `ftp.clusterNNN.hosting.ovh.net`), login i hasło. Hosting „Cloud Web” ma inny port SFTP.
3. GitHub → Settings → Secrets and variables → Actions → **Secrets**: `OVH_SFTP_HOST`,
   `OVH_SFTP_USER`, `OVH_SFTP_PASSWORD`.
4. Actions → „Publikacja na OVH” → Run workflow z „Próbą na sucho”, potem bez niej (albo push).
5. Google Search Console (zasób „Domena”, rekord TXT) i zgłoszenie `sitemap-index.xml`.

## Testy odbiorcze (po pierwszym wdrożeniu; lokalnie sprawdź to, co możliwe)

```bash
curl -sI http://[DOMENA]/ | grep -i "^HTTP\|^location"            # 301 -> https://[DOMENA]/
curl -sI https://www.[DOMENA]/ | grep -i "^HTTP\|^location"       # 301 -> https://[DOMENA]/ (bez :443)
curl -sI https://[DOMENA]/index.html | grep -i "^location"        # 301 -> https://[DOMENA]/
curl -sI https://[DOMENA]/nie-ma-takiej-strony/ | head -1         # HTTP/2 404 (własna strona 404)
curl -sI https://[DOMENA]/ | grep -i "strict-transport\|content-security\|x-frame"
curl -s https://[DOMENA]/robots.txt; curl -s https://[DOMENA]/sitemap-index.xml | head -5
curl -s -X POST https://[DOMENA]/api/kontakt.php -F name=test -F email=test@example.com -F message=test -H "Origin: https://[DOMENA]"
```

Oczekiwane: jedna domena bez `www`, brak `:443` w `Location`, 404 zwraca kod 404, nagłówki
bezpieczeństwa obecne, formularz odpowiada JSON (`config` do czasu uzupełnienia `$TO`/`$FROM`).

Lokalnie: `npm run test` zielone; `php -l deploy/ovh/api/kontakt.php` bez błędów; `dist/` zawiera
tylko stronę + `.htaccess` + `api/`; w `.htaccess` wszystkie cele przekierowań zaczynają się od `https://`;
YAML workflow parsuje się; `npm run preview` + curl: strony 200, `/nie-ma/` daje 404.html.

## Co ma być w odpowiedzi na końcu

1. Lista zmienionych plików i proponowana treść commita (po polsku).
2. Wynik `npm run test` lokalnie (musi być zielony).
3. Lista rzeczy do zrobienia przez właściciela: domena, Multisite + SSL w OVH, SFTP, trzy sekrety w GitHub,
   `$TO`/`$FROM` w `kontakt.php`, dane firmy do stopki i polityki, pierwsze uruchomienie workflow
   z „próbą na sucho”.
4. Polecenia `curl` z sekcji „Testy odbiorcze” z oczekiwanymi wynikami, do wykonania po pushu.
