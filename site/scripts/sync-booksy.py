"""
Synchronizacja cennika z publicznej strony salonu w Booksy -> src/data/uslugi.json.

Uruchomienie:  npm run sync            (= python -I -X utf8 scripts/sync-booksy.py)
Opcje:
  --html PLIK    parsuj zapisaną stronę Booksy zamiast pobierać ją z sieci (test, praca offline)
  --out PLIK     zapisz wynik w innym pliku (domyślnie src/data/uslugi.json)
  --dry-run      tylko pobierz, sprawdź i pokaż zmiany; nic nie zapisuj

Co robi (BRIEF.md, sekcja 4):
  1. pobiera stronę salonu z nagłówkiem User-Agent przeglądarki,
  2. czyta blok <script type="application/ld+json"> typu BeautySalon (makesOffer, godziny, oceny)
     do kontroli krzyżowej,
  3. czyta <script type="application/json" id="__NUXT_DATA__"> (format devalue: płaska tablica,
     wartości to indeksy; ["Reactive"|"ShallowReactive"|"Ref"|"ShallowRef", i] -> rozwinięcie i;
     ["Set"|"Map"|"Date"|..., ...] -> lista; indeksy ujemne -> null),
  4. z data["business:102895"] składa listę usług w kolejności kategorii Booksy, w tym samym
     formacie co dotychczasowy plik (category, id, variant_id, name, description, price, price_raw,
     duration_min, variants[], staffer_ids, online, promotion) + updatedAt i source,
  5. zapisuje plik TYLKO, gdy parsowanie się powiodło i usług jest co najmniej 50. W przeciwnym
     razie zostawia stary plik i kończy kodem 1 z czytelnym komunikatem.

Nieoficjalne: jeśli Booksy zmieni budowę strony, skrypt przestanie działać, a strona dalej
pokazuje ostatni poprawny cennik z datą aktualizacji (pole updatedAt).
Po synchronizacji uruchom `npm run test`: build ostrzeże ([uslugi] Brak usługi o id …), jeśli
któraś usługa wskazana na stronach po id zniknęła z Booksy.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(os.path.abspath(__file__)).parent.parent
DEFAULT_OUT = ROOT / 'src' / 'data' / 'uslugi.json'
BUSINESS_ID = 102895
URL = 'https://booksy.com/pl-pl/102895_la-beaute-aldona-targiel_salon-kosmetyczny_12634_orzesze'
MIN_SERVICES = 50
USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
)

sys.setrecursionlimit(20000)


class SyncError(Exception):
    """Błąd, po którym stary plik zostaje bez zmian."""


# ------------------------------------------------------------------ pobieranie i <script>


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'pl-PL,pl;q=0.9',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            charset = resp.headers.get_content_charset() or 'utf-8'
            return resp.read().decode(charset, errors='replace')
    except urllib.error.HTTPError as e:
        raise SyncError(f'Booksy odpowiedział kodem HTTP {e.code} dla {url}') from e
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise SyncError(f'Nie udało się pobrać {url}: {e}') from e


class ScriptCollector(HTMLParser):
    """Zbiera treść <script type="application/ld+json"> i <script id="__NUXT_DATA__">."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.ld = []
        self.nuxt = None
        self._kind = None
        self._buf = []

    def handle_starttag(self, tag, attrs):
        if tag != 'script':
            return
        a = {k: (v or '') for k, v in attrs}
        if a.get('type') == 'application/ld+json':
            self._kind = 'ld'
        elif a.get('id') == '__NUXT_DATA__':
            self._kind = 'nuxt'
        else:
            self._kind = None
        self._buf = []

    def handle_data(self, data):
        if self._kind:
            self._buf.append(data)

    def handle_endtag(self, tag):
        if tag != 'script' or not self._kind:
            return
        text = ''.join(self._buf)
        if self._kind == 'ld':
            self.ld.append(text)
        elif self._kind == 'nuxt':
            self.nuxt = text
        self._kind = None
        self._buf = []


# ------------------------------------------------------------------ devalue (Nuxt payload)

WRAPPERS = {'Reactive', 'ShallowReactive', 'Ref', 'ShallowRef'}


def unflatten(arr):
    """Rozwija płaską tablicę devalue do zwykłych obiektów Pythona."""
    if not isinstance(arr, list) or not arr:
        raise SyncError('__NUXT_DATA__ nie jest niepustą tablicą (zmienił się format Booksy?)')
    cache = {}

    def hyd(i):
        if not isinstance(i, int) or isinstance(i, bool):
            return i
        if i < 0:
            return None
        if i in cache:
            return cache[i]
        if i >= len(arr):
            return None
        v = arr[i]
        if isinstance(v, list):
            if v and isinstance(v[0], str):
                tag = v[0]
                if tag in WRAPPERS and len(v) > 1:
                    out = hyd(v[1])
                    cache[i] = out
                    return out
                if tag in ('EmptyRef', 'EmptyShallowRef'):
                    cache[i] = None
                    return None
                if tag == 'Date':
                    cache[i] = v[1] if len(v) > 1 else None
                    return cache[i]
                if tag == 'null':
                    out = {}
                    cache[i] = out
                    for k in range(1, len(v) - 1, 2):
                        out[v[k]] = hyd(v[k + 1])
                    return out
                # Set, Map, RegExp, BigInt, ... -> lista rozwiniętych wartości
                out = []
                cache[i] = out
                out.extend(hyd(x) for x in v[1:])
                return out
            out = []
            cache[i] = out
            out.extend(hyd(x) for x in v)
            return out
        if isinstance(v, dict):
            out = {}
            cache[i] = out
            for k, x in v.items():
                out[k] = hyd(x)
            return out
        cache[i] = v
        return v

    return hyd(0)


# ------------------------------------------------------------------ składanie danych


def find_ld_salon(ld_blocks):
    """Węzeł BeautySalon z bloków JSON-LD (albo None)."""
    for text in ld_blocks:
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, list):
                stack.extend(node)
            elif isinstance(node, dict):
                t = node.get('@type')
                types = t if isinstance(t, list) else [t]
                if 'BeautySalon' in types:
                    return node
                stack.extend(node.get('@graph', []) if isinstance(node.get('@graph'), list) else [])
    return None


def as_int(v):
    return v if isinstance(v, int) and not isinstance(v, bool) else None


def build(html: str, source_url: str):
    col = ScriptCollector()
    col.feed(html)
    if not col.nuxt:
        raise SyncError('Brak bloku <script id="__NUXT_DATA__"> na stronie Booksy (zmienił się format strony?)')
    try:
        raw = json.loads(col.nuxt)
    except json.JSONDecodeError as e:
        raise SyncError(f'__NUXT_DATA__ nie jest poprawnym JSON-em: {e}') from e
    root = unflatten(raw)
    data = root.get('data') if isinstance(root, dict) else None
    biz = data.get(f'business:{BUSINESS_ID}') if isinstance(data, dict) else None
    if not isinstance(biz, dict):
        raise SyncError(f'W danych Nuxt nie ma klucza data["business:{BUSINESS_ID}"]')
    cats = biz.get('serviceCategories')
    if not isinstance(cats, list) or not cats:
        raise SyncError('Brak listy serviceCategories w danych salonu')

    services = []
    problems = []
    for cat in cats:
        if not isinstance(cat, dict):
            continue
        cname = cat.get('name') or ''
        for s in cat.get('services') or []:
            if not isinstance(s, dict):
                continue
            variants = [v for v in (s.get('variants') or []) if isinstance(v, dict)]
            v0 = variants[0] if variants else {}
            entry = {
                'category': cname,
                'id': as_int(s.get('id')),
                'variant_id': as_int(v0.get('id')),
                'name': (s.get('name') or '').strip(),
                'description': s.get('description'),
                'price': s.get('servicePrice') or v0.get('servicePrice') or '',
                'price_raw': v0.get('price') if isinstance(v0.get('price'), (int, float)) else None,
                'duration_min': as_int(v0.get('duration')),
                'variants': [
                    {
                        'id': as_int(v.get('id')),
                        'label': v.get('label') or '',
                        'price': v.get('servicePrice') or '',
                        'duration': as_int(v.get('duration')),
                    }
                    for v in variants
                ],
                'staffer_ids': list(s.get('stafferId') or v0.get('stafferId') or []),
                'online': bool(s.get('isOnlineService')),
                'promotion': v0.get('promotion'),
            }
            if not entry['id'] or not entry['variant_id'] or not entry['name'] or not entry['price']:
                problems.append(f"niekompletna usługa w kategorii „{cname.strip()}”: {entry['name'] or entry['id']}")
            services.append(entry)

    if problems:
        raise SyncError('Niekompletne dane usług:\n  - ' + '\n  - '.join(problems[:10]))
    if len(services) < MIN_SERVICES:
        raise SyncError(f'Za mało usług: {len(services)} (minimum {MIN_SERVICES}); plik zostaje bez zmian')

    location = biz.get('location') if isinstance(biz.get('location'), dict) else {}
    business = {
        'id': biz.get('id'),
        'name': biz.get('name'),
        'description': biz.get('description') or '',
        'website': biz.get('website'),
        'location': {
            'address': location.get('address'),
            'city': location.get('city'),
            'coordinate': location.get('coordinate'),
        },
        'staff': [
            {k: p.get(k) for k in ('id', 'name', 'type', 'description', 'photoUrl', 'staffUserExists', 'bookmarked')}
            for p in (biz.get('staff') or [])
            if isinstance(p, dict)
        ],
        'reviewsCount': biz.get('reviewsCount'),
        'reviewsRank': biz.get('reviewsRank'),
        'openHours': biz.get('openHours'),
        'amenities': biz.get('amenities') or [],
    }

    # Kontrola krzyżowa z JSON-LD (tylko ostrzeżenia).
    warnings = []
    salon = find_ld_salon(col.ld)
    if salon is None:
        warnings.append('brak węzła JSON-LD BeautySalon (kontrola krzyżowa pominięta)')
    else:
        offers = salon.get('makesOffer') or []
        names_ld = {
            (o.get('itemOffered') or {}).get('name', '').strip()
            for o in offers
            if isinstance(o, dict)
        }
        names_nuxt = {s['name'] for s in services}
        missing = sorted(n for n in names_ld - names_nuxt if n)
        if missing:
            warnings.append(f'{len(missing)} ofert z JSON-LD nie ma w danych Nuxt, np.: {", ".join(missing[:3])}')
        rating = salon.get('aggregateRating') or {}
        if rating:
            business['aggregateRating'] = {
                'ratingValue': rating.get('ratingValue'),
                'reviewCount': rating.get('reviewCount') or rating.get('ratingCount'),
            }

    out = {
        'updatedAt': datetime.now().astimezone().isoformat(timespec='seconds'),
        'source': source_url,
        'business': business,
        'services': services,
    }
    return out, warnings


# ------------------------------------------------------------------ porównanie i zapis


def summarize_changes(old, new):
    lines = []
    old_s = {s['id']: s for s in (old or {}).get('services', [])}
    new_s = {s['id']: s for s in new['services']}
    added = [new_s[i] for i in new_s if i not in old_s]
    removed = [old_s[i] for i in old_s if i not in new_s]
    for s in added:
        lines.append(f"  + nowa: {s['name']} ({s['price']}) [id {s['id']}]")
    for s in removed:
        lines.append(f"  - usunięta: {s['name']} [id {s['id']}]")
    for i, s in new_s.items():
        o = old_s.get(i)
        if not o:
            continue
        for field in ('price', 'duration_min', 'name', 'variant_id'):
            if o.get(field) != s.get(field):
                lines.append(f"  * {s['name']}: {field} {o.get(field)!r} -> {s.get(field)!r}")
    return lines


def main():
    ap = argparse.ArgumentParser(description='Synchronizacja cennika z Booksy do src/data/uslugi.json')
    ap.add_argument('--html', help='zapisana strona Booksy (zamiast pobierania)')
    ap.add_argument('--out', help='plik wynikowy (domyślnie src/data/uslugi.json)')
    ap.add_argument('--dry-run', action='store_true', help='nic nie zapisuj, pokaż tylko zmiany')
    args = ap.parse_args()
    out_path = Path(args.out).resolve() if args.out else DEFAULT_OUT

    try:
        if args.html:
            try:
                html = Path(args.html).read_text(encoding='utf-8', errors='replace')
            except OSError as e:
                raise SyncError(f'Nie można odczytać pliku {args.html}: {e}') from e
            print(f'Czytam zapisaną stronę: {args.html}')
        else:
            print(f'Pobieram {URL}')
            html = fetch(URL)
        new, warnings = build(html, URL)
    except SyncError as e:
        print(f'BŁĄD: {e}')
        print(f'Plik {out_path} zostaje bez zmian.')
        return 1
    except (KeyError, TypeError, ValueError, AttributeError, IndexError, RecursionError) as e:
        # Nieoczekiwany kształt danych Booksy: też kończymy czytelnie i nie ruszamy starego pliku.
        print(f'BŁĄD: nieoczekiwany format danych Booksy ({type(e).__name__}: {e})')
        print(f'Plik {out_path} zostaje bez zmian.')
        return 1

    cats = []
    for s in new['services']:
        if s['category'] not in cats:
            cats.append(s['category'])
    print(f"OK: {len(new['services'])} usług w {len(cats)} kategoriach, opinie: {new['business'].get('reviewsCount')}")
    for w in warnings:
        print(f'  uwaga: {w}')

    old = None
    compare_path = out_path if out_path.exists() else DEFAULT_OUT
    if compare_path.exists():
        try:
            old = json.loads(compare_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError):
            old = None
    changes = summarize_changes(old, new)
    if changes:
        print(f'Zmiany względem {compare_path.name} ({len(changes)}):')
        print('\n'.join(changes[:80]))
        if len(changes) > 80:
            print(f'  … i {len(changes) - 80} więcej')
    else:
        print('Brak zmian w usługach, cenach i czasach.')

    if args.dry_run:
        print('--dry-run: nic nie zapisano.')
        return 0

    tmp = out_path.with_suffix(out_path.suffix + '.tmp')
    tmp.write_text(json.dumps(new, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    os.replace(tmp, out_path)
    hint = ' Teraz: npm run test' if out_path == DEFAULT_OUT else ''
    print(f'Zapisano {out_path} (updatedAt {new["updatedAt"]}).{hint}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
