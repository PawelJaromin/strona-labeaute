"""
Kontrola zbudowanej strony w dist/ (jeden język: polski).
Dla każdego pliku HTML:
- wewnętrzne href/src/srcset wskazują na istniejące pliki, a kotwice (#id) na istniejące id,
- <html lang="pl">, <title> (<= 70 znaków), meta description (50-165 znaków),
- canonical (poza 404) = adres strony pod site.url, og:image, og:title,
- dokładnie jeden <h1>, brak pustych nagłówków, brak przeskoków poziomów nagłówków (np. h2 -> h4),
- każdy <img> ma atrybut alt (pusty tylko z aria-hidden), każdy <iframe> ma title,
- target="_blank" zawsze z rel="noopener", brak powtórzonych id,
- brak "undefined", "NaN", "[object Object]" w HTML,
- rytm stron (brief, sekcja 2): każda podstrona zaczyna <main> ciemnym pasem PageIntro
  (class "page-intro"), strona główna hero; każda strona ma ciemny pas CTA ("cta-band")
  tuż przed końcem <main> i ciemną stopkę ("tone-dark").
Dodatkowo: sitemap zawiera wszystkie strony poza 404.
Dodatkowo: każda strona linkuje do wszystkich podstron (nawigacja + stopka), a bloki JSON-LD
są poprawnym JSON-em.
Podścieżka i tryb (kopia tymczasowa na GitHub Pages): skrypt czyta te same zmienne środowiskowe co build
(SITE_URL, BASE_PATH, STAGING; patrz build-env.mjs), więc ODPALAJ GO Z TYMI SAMYMI ZMIENNYMI co build.
Bez nich sprawdza wersję produkcyjną (adres domyślny z build-env.mjs, korzeń domeny). Przy podścieżce:
- każdy wewnętrzny href/src/srcset zaczynający się od "/" musi zaczynać się od podścieżki,
- canonical, og:image, JSON-LD i sitemap mają domenę + podścieżkę,
- kopia tymczasowa: <meta name="robots" content="noindex, nofollow"> na każdej stronie i robots.txt
  z "Disallow: /"; produkcja: brak noindex (poza 404), robots.txt z "Allow: /" i adresem sitemap,
- site.webmanifest ma start_url i ikony pod podścieżką.
Uruchomienie: python -I -X utf8 scripts/linkcheck.py [katalog_dist]  (po npm run build;
domyślnie dist/, argument przydaje się przy buildzie do innego katalogu: astro build --outDir)
"""
import json
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'dist'
BUILD_ENV = ROOT / 'build-env.mjs'


def read_config():
    """Adres, podścieżka i tryb: te same zmienne co przy buildzie, domyślnie z build-env.mjs."""
    m = re.search(r"DEFAULT_SITE_URL\s*=\s*'([^']+)'", BUILD_ENV.read_text(encoding='utf-8'))
    default_url = (m.group(1) if m else '').rstrip('/')
    site_url = (os.environ.get('SITE_URL') or '').strip().rstrip('/') or default_url
    raw_base = (os.environ.get('BASE_PATH') or '').strip()
    if re.match(r'^[A-Za-z]:[\\/]', raw_base):
        sys.exit(
            f'BASE_PATH "{raw_base}" to ścieżka Windows: Git Bash zamienia "/nazwa" na ścieżkę dysku. '
            'Ustaw MSYS_NO_PATHCONV=1 albo użyj PowerShell.'
        )
    base = '' if raw_base in ('', '/') else '/' + raw_base.strip('/')
    staging = os.environ.get('STAGING') == '1' or base != ''
    return default_url, site_url, base, staging


DEFAULT_SITE_URL, SITE_URL, BASE, STAGING = read_config()


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []  # (tag, attr, value)
        self.ids = []
        self.title = ''
        self.desc = None
        self.canon = None
        self.robots = None
        self.og = {}
        self.lang = None
        self.headings = []  # (level, text)
        self.imgs_no_alt = []
        self.iframes_no_title = 0
        self.blank_no_noopener = []
        self._in_title = False
        self._heading = None
        self._heading_text = ''

    def handle_starttag(self, tag, attrs):
        a = {k: (v if v is not None else '') for k, v in attrs}
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'html':
            self.lang = a.get('lang')
        if tag == 'title':
            self._in_title = True
        if tag == 'meta':
            if a.get('name') == 'description':
                self.desc = a.get('content', '')
            if a.get('name') == 'robots':
                self.robots = a.get('content', '')
            if a.get('property', '').startswith('og:'):
                self.og[a['property']] = a.get('content', '')
        if tag == 'link':
            rel = a.get('rel', '')
            if rel == 'canonical':
                self.canon = a.get('href', '')
            if a.get('href') and rel not in ('canonical', 'alternate', 'preconnect', 'dns-prefetch'):
                self.refs.append((tag, 'href', a['href']))
        if tag == 'a' and 'href' in a:
            self.refs.append((tag, 'href', a['href']))
            if a.get('target') == '_blank' and 'noopener' not in a.get('rel', '') and 'noreferrer' not in a.get('rel', ''):
                self.blank_no_noopener.append(a['href'])
        if tag in ('img', 'script', 'source', 'iframe') and a.get('src'):
            self.refs.append((tag, 'src', a['src']))
        if tag in ('img', 'source') and a.get('srcset'):
            for part in a['srcset'].split(','):
                url = part.strip().split(' ')[0]
                if url:
                    self.refs.append((tag, 'srcset', url))
        if tag == 'img':
            if 'alt' not in a:
                self.imgs_no_alt.append(a.get('src', '?'))
            elif a['alt'].strip() == '' and a.get('aria-hidden') != 'true' and a.get('role') != 'presentation':
                self.imgs_no_alt.append(a.get('src', '?') + ' (pusty alt bez aria-hidden)')
        if tag == 'iframe' and not a.get('title', '').strip():
            self.iframes_no_title += 1
        if re.fullmatch(r'h[1-6]', tag):
            self._heading = int(tag[1])
            self._heading_text = ''

    def handle_endtag(self, tag):
        if tag == 'title':
            self._in_title = False
        if self._heading is not None and tag == f'h{self._heading}':
            self.headings.append((self._heading, ' '.join(self._heading_text.split())))
            self._heading = None

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._heading is not None:
            self._heading_text += data


def url_path_of(page: Path) -> str:
    rel = page.relative_to(DIST).as_posix()
    if rel.endswith('index.html'):
        return '/' + rel[: -len('index.html')]
    return '/' + rel


def in_base(target: str) -> bool:
    """Czy adres zaczynający się od "/" leży pod podścieżką (przy korzeniu domeny zawsze tak)."""
    return not BASE or target == BASE or target.startswith(BASE + '/')


def resolve(page: Path, target: str) -> Path:
    if target.startswith('/'):
        fs = DIST / target[len(BASE):].lstrip('/')
    else:
        fs = (page.parent / target).resolve()
    if fs.is_dir() or target.endswith('/'):
        fs = fs / 'index.html'
    return fs


pages = sorted(DIST.rglob('*.html'))
if not pages:
    print('Brak plików HTML w dist/. Najpierw: npm run build')
    sys.exit(1)

parsed = {}
for page in pages:
    p = Page()
    p.feed(page.read_text(encoding='utf-8'))
    parsed[page.resolve()] = p

problems = []
checked = 0
for page in pages:
    p = parsed[page.resolve()]
    html = page.read_text(encoding='utf-8')
    rel = page.relative_to(DIST).as_posix()
    is404 = page.name == '404.html'
    path = url_path_of(page)

    if p.lang != 'pl':
        problems.append(f'{rel}: <html lang="{p.lang}">, oczekiwano "pl"')
    title = ' '.join(p.title.split())
    if not title:
        problems.append(f'{rel}: brak <title>')
    elif len(title) > 70:
        problems.append(f'{rel}: title ma {len(title)} znaków (> 70): {title}')
    if p.desc is None or not p.desc.strip():
        problems.append(f'{rel}: brak meta description')
    elif not 50 <= len(p.desc) <= 165:
        problems.append(f'{rel}: meta description ma {len(p.desc)} znaków (poza 50-165)')
    if not is404:
        expected = SITE_URL + BASE + path
        if not p.canon:
            problems.append(f'{rel}: brak canonical')
        elif p.canon != expected:
            problems.append(f'{rel}: canonical {p.canon} != {expected}')
    for prop in ('og:title', 'og:image', 'og:description'):
        if not p.og.get(prop):
            problems.append(f'{rel}: brak {prop}')

    # Indeksowanie: kopia tymczasowa zawsze noindex, nofollow; na produkcji tylko 404 jest noindex.
    robots = ' '.join((p.robots or '').lower().replace(',', ' ').split())
    if STAGING:
        if robots != 'noindex nofollow':
            problems.append(f'{rel}: kopia tymczasowa bez <meta name="robots" content="noindex, nofollow"> (jest: {p.robots!r})')
    elif is404:
        if 'noindex' not in robots:
            problems.append(f'{rel}: 404 bez noindex')
    elif 'noindex' in robots or 'nofollow' in robots:
        problems.append(f'{rel}: produkcja nie może mieć noindex/nofollow (jest: {p.robots!r})')

    # Adresy bezwzględne (canonical, og, JSON-LD) mają domenę builda i podścieżkę.
    if DEFAULT_SITE_URL and SITE_URL != DEFAULT_SITE_URL and DEFAULT_SITE_URL in html:
        problems.append(f'{rel}: w HTML został domyślny adres {DEFAULT_SITE_URL} (build z innym SITE_URL)')
    if BASE:
        for m_abs in re.finditer(re.escape(SITE_URL) + r'(?![A-Za-z0-9.-])([^"\\\s<>]*)', html):
            rest = m_abs.group(1)
            if not (rest == BASE or rest.startswith((BASE + '/', BASE + '#', BASE + '?'))):
                problems.append(f'{rel}: adres bezwzględny bez podścieżki {BASE}: {SITE_URL}{rest}')
    for prop in ('og:image', 'og:url'):
        val = p.og.get(prop)
        if val and not val.startswith(SITE_URL + BASE + '/'):
            problems.append(f'{rel}: {prop} poza {SITE_URL}{BASE}/: {val}')

    # Rytm stron: ciemny wstęp na początku <main>, ciemny pas CTA na końcu, ciemna stopka.
    main_m = re.search(r'<main\b[^>]*>(.*)</main>', html, re.S)
    main_html = main_m.group(1) if main_m else ''
    first = re.match(r'\s*(?:<!--.*?-->\s*)*<section\b([^>]*)>', main_html, re.S)
    first_cls = []
    if first:
        cm = re.search(r'class="([^"]*)"', first.group(1))
        first_cls = cm.group(1).split() if cm else []
    if rel == 'index.html':
        if 'hero' not in first_cls:
            problems.append(f'{rel}: <main> nie zaczyna się sekcją hero')
        if not any({'reviews', 'section--dark'} <= set(c.split()) for c in re.findall(r'<section\b[^>]*class="([^"]*)"', main_html)):
            problems.append(f'{rel}: brak ciemnego pasa opinii (Reviews tone="dark")')
    elif 'page-intro' not in first_cls:
        problems.append(f'{rel}: <main> nie zaczyna się ciemnym pasem PageIntro (pierwsza sekcja: {" ".join(first_cls) or "brak"})')
    last_open = main_html.rfind('<section')
    last_cls = re.search(r'class="([^"]*)"', main_html[last_open:]) if last_open >= 0 else None
    if not last_cls or 'cta-band' not in last_cls.group(1).split():
        problems.append(f'{rel}: ostatnia sekcja <main> to nie ciemny pas CTA (CtaBand)')
    if not re.search(r'<footer\b[^>]*class="[^"]*\btone-dark\b', html):
        problems.append(f'{rel}: stopka nie jest ciemna (brak klasy tone-dark)')

    h1 = [h for h in p.headings if h[0] == 1]
    if len(h1) != 1:
        problems.append(f'{rel}: liczba <h1> = {len(h1)}')
    prev = 0
    for level, text in p.headings:
        if not text:
            problems.append(f'{rel}: pusty nagłówek h{level}')
        if prev and level > prev + 1:
            problems.append(f'{rel}: przeskok nagłówków h{prev} -> h{level} („{text[:50]}”)')
        prev = level

    for src in p.imgs_no_alt:
        problems.append(f'{rel}: obraz bez alt: {src}')
    if p.iframes_no_title:
        problems.append(f'{rel}: {p.iframes_no_title} iframe bez title')
    for href in p.blank_no_noopener:
        problems.append(f'{rel}: target=_blank bez rel=noopener: {href}')
    dup = sorted({i for i in p.ids if p.ids.count(i) > 1})
    if dup:
        problems.append(f'{rel}: powtórzone id: {", ".join(dup)}')
    for bad in ('undefined', '[object Object]', '>NaN<', ' NaN '):
        if bad in html:
            problems.append(f'{rel}: w HTML jest "{bad.strip("<> ")}"')

    for tag, attr, ref in p.refs:
        checked += 1
        if ref.startswith(('http://', 'https://', '//', 'mailto:', 'tel:', 'data:', 'javascript:', 'about:')):
            continue
        if ref.startswith('/') and not in_base(ref.split('#')[0].split('?')[0]):
            problems.append(f'{rel}: <{tag} {attr}> bez podścieżki {BASE}: {ref}')
            continue
        target, _, frag = ref.partition('#')
        target = target.split('?')[0]
        fs = resolve(page, target) if target else page
        if not fs.exists():
            problems.append(f'{rel}: <{tag} {attr}> do nieistniejącego pliku: {ref}')
            continue
        if frag and fs.suffix == '.html':
            tp = parsed.get(fs.resolve())
            if tp is None:
                tp = Page()
                tp.feed(fs.read_text(encoding='utf-8'))
                parsed[fs.resolve()] = tp
            if frag not in tp.ids:
                problems.append(f'{rel}: kotwica #{frag} nie istnieje w {fs.relative_to(DIST).as_posix()}')

# Nawigacja: każda strona (także 404) linkuje do strony głównej i wszystkich podstron.
all_paths = sorted(url_path_of(pg) for pg in pages if pg.name != '404.html')
for page in pages:
    html = page.read_text(encoding='utf-8')
    linked = set()
    for _, _, ref in parsed[page.resolve()].refs:
        if ref.startswith('/') and not ref.startswith('//'):
            linked.add(ref.split('#')[0].split('?')[0])
    for target in all_paths:
        if BASE + target not in linked:
            problems.append(f'{page.relative_to(DIST).as_posix()}: brak linku do {BASE + target} (nawigacja/stopka)')
    # JSON-LD: poprawny JSON z @context oraz @graph (Base) lub @type (samodzielny węzeł, np. FAQPage)
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(block)
        except ValueError as e:
            problems.append(f'{page.relative_to(DIST).as_posix()}: niepoprawny JSON-LD ({e})')
            continue
        # Base.astro daje blok z @graph; Faq.astro samodzielny węzeł FAQPage z @type.
        if data.get('@context') != 'https://schema.org' or not (data.get('@graph') or data.get('@type')):
            problems.append(f'{page.relative_to(DIST).as_posix()}: JSON-LD bez @context i @graph/@type')

# Sitemap: wszystkie strony poza 404.
sm_files = sorted(DIST.glob('sitemap-*.xml'))
locs = set()
for f in sm_files:
    locs.update(re.findall(r'<loc>([^<]+)</loc>', f.read_text(encoding='utf-8')))
for page in pages:
    if page.name == '404.html':
        continue
    url = SITE_URL + BASE + url_path_of(page)
    if url not in locs:
        problems.append(f'sitemap: brak {url}')

# robots.txt: kopia tymczasowa blokuje wszystko, produkcja pozwala i wskazuje sitemap.
robots_file = DIST / 'robots.txt'
if not robots_file.exists():
    problems.append('robots.txt: brak pliku (powinien powstać z src/pages/robots.txt.ts)')
else:
    rlines = [ln.strip() for ln in robots_file.read_text(encoding='utf-8').splitlines() if ln.strip() and not ln.lstrip().startswith('#')]
    if STAGING:
        if 'Disallow: /' not in rlines:
            problems.append('robots.txt: kopia tymczasowa bez "Disallow: /"')
        if 'Allow: /' in rlines:
            problems.append('robots.txt: kopia tymczasowa nie może mieć "Allow: /"')
    else:
        if 'Allow: /' not in rlines:
            problems.append('robots.txt: produkcja bez "Allow: /"')
        if 'Disallow: /' in rlines:
            problems.append('robots.txt: produkcja nie może mieć "Disallow: /"')
        if f'Sitemap: {SITE_URL}{BASE}/sitemap-index.xml' not in rlines:
            problems.append(f'robots.txt: brak "Sitemap: {SITE_URL}{BASE}/sitemap-index.xml"')

# site.webmanifest: start_url i ikony pod podścieżką, pliki ikon istnieją.
manifest_file = DIST / 'site.webmanifest'
if not manifest_file.exists():
    problems.append('site.webmanifest: brak pliku (powinien powstać z src/pages/site.webmanifest.ts)')
else:
    try:
        manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    except ValueError as e:
        manifest = None
        problems.append(f'site.webmanifest: niepoprawny JSON ({e})')
    if manifest is not None:
        if manifest.get('start_url') != BASE + '/':
            problems.append(f'site.webmanifest: start_url {manifest.get("start_url")!r} != {BASE + "/"!r}')
        for icon in manifest.get('icons', []):
            src = icon.get('src', '')
            if not src.startswith(BASE + '/') or not (DIST / src[len(BASE):].lstrip('/')).exists():
                problems.append(f'site.webmanifest: ikona poza podścieżką albo nieistniejąca: {src}')

mode = 'kopia tymczasowa (noindex)' if STAGING else 'produkcja'
print(f'Sprawdzono {len(pages)} stron, {checked} odnośników i zasobów (site.url = {SITE_URL}, podścieżka = {BASE or "/"}, tryb: {mode}).')
if problems:
    print(f'PROBLEMY ({len(problems)}):')
    for pr in problems:
        print('  -', pr)
    sys.exit(1)
print('Brak problemów.')
