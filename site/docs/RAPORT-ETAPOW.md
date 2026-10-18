# Raport etapów budowy (dla agentów i deweloperów)

Projekt został przeniesiony z `J:\strona\labeaute` do `J:\strona labeaute` (folder ze spacją). Wszystkie ścieżki w tym pliku odnoszą się do nowej lokalizacji; stare ścieżki w cytowanych raportach czytaj jako nowe.

## Fundament (Opus) – podsumowanie

I took over the foundation stage of J:\strona labeaute\site and finished it. `npm run test` passes: build, then check:contrast with 20 colour pairs plus 2 rules, then check:links with 7 pages and 713 references, no problems.

WHAT EXISTED: the previous agent left a working Astro 5 project. It had tokens and global CSS, the Base layout (SEO, OG, JSON-LD, icons), and these components: Header (sticky; mobile menu in `<details>`), Footer (ivory), Hero, ServiceFeature, PriceList/PriceRow, BookingModal, BookingNote, Button, SectionHead, Team, Reviews, Hours, Contact. It also had src/config/site.ts, src/data/uslugi.json (the Booksy copy plus updatedAt and source), lib/uslugi.ts and lib/schema.ts, the full home page, privacy policy and 404, and stubs for makijaz-permanentny, depilacja-laserowa, usuwanie-tatuazu and cennik. Public files were in place: favicons and icons from the lotus, og.png, .htaccess with CSP, robots.txt and site.webmanifest. So were the scripts check-contrast.mjs, linkcheck.py, make-icons.mjs and make-og.mjs. The build passed.

GAPS I FOUND:
- The "Rytm stron" rule was not implemented anywhere: no dark bands, light footer, secondary text still #6B655C.
- scripts/sync-booksy.py and `npm run sync` did not exist.
- No README.
- Header logo was 32/25 px; the brief says 28/22.
- On the home page, photo salon-5 (a manicure station with UV lamp and nail dust collector) was used for "Depilacja laserowa", with a wrong alt text describing a treatment bed.
- When the official Booksy widget opened, focus went into its iframe, so Esc never closed it.
- The header "Umów wizytę" button had a double gap between the words.

WHAT I CHANGED:
1. Rhythm of pages:
   - Tokens: `--c-muted` is now #5a534c. New dark tokens: `--c-dark` #141414, `--c-dark-ink` #f6f2ea, `--c-dark-gold` #d9bf86, `--c-dark-muted` #bfb6a8, `--c-dark-line` #3a3631, `--c-dark-focus` #d9bf86.
   - global.css has a dark context, `.section--dark` (background and colours) and `.tone-dark` (colours only). Inside it, headings, lead, eyebrow, muted text, booking note, links, focus ring, hairlines and buttons switch automatically. On dark, the primary button is ivory with black text and the secondary has a gold outline with #D9BF86 text.
   - New PageIntro.astro (dark intro band) and CtaBand.astro (dark CTA band). Base.astro now renders CtaBand automatically as the last element of `<main>` on every page.
   - The footer is dark. The full logo sits on an ivory plaque in a double gold frame, because the logo's dark, semi-transparent gradient (the "U", the signature) disappears on #141414. The logo file itself is unchanged.
   - Home order is now: hero (white) → Zabiegi (ivory) → Opinie as a dark band (`Reviews tone="dark"`) → Pozostałe (white) → O nas (ivory) → Kontakt (white) → CTA (dark) → footer (dark).
   - All stubs plus 404 and the privacy policy now start with PageIntro. Service pages have a photo in the intro: inspiracja-2, salon-4 and salon-3. 404 got a white "Może szukasz" links section.
   - `<main>` no longer stretches; the footer takes up extra height. Before this, short pages showed a white gap between the CTA band and the footer.
2. New Faq.astro (`<details>` rows plus FAQPage JSON-LD) and Steps.astro (numbered steps) so the subpage agents only need to write content.
3. scripts/sync-booksy.py (Python stdlib) and `npm run sync`:
   - Parses the ld+json BeautySalon block and the `__NUXT_DATA__` devalue data.
   - Writes the file only if parsing succeeded and there are at least 50 services; otherwise it exits with code 1 and leaves the old file.
   - Options: `--html`, `--out`, `--dry-run`.
   - Tested on the saved Booksy page: it reproduces the services array of src/data/uslugi.json exactly (118 services, 12 categories).
   - A live `--dry-run` worked: 118 services, no price changes, reviewsCount 181.
   - An empty page gave exit 1 with a readable message.
4. check-contrast.mjs now checks the 7 dark pairs and fails if #6B655C reappears or `--c-muted` is not #5a534c.
5. linkcheck.py now enforces the rhythm:
   - index starts with `.hero` and has a dark reviews band;
   - every other page starts `<main>` with `.page-intro`;
   - the last section of `<main>` on every page is `.cta-band`;
   - the footer has `.tone-dark`.
6. .htaccess CSP: added `'unsafe-hashes' 'sha256-EEOFJIUW3xhw7GYcNfS/aPD53TxdL1x/aV40NdMn8Ak='` to style-src, for the `style="border: 0"` that Booksy's code.js writes on its iframe. In the browser the top page loaded resources only from 127.0.0.1 and booksy.com (code.js, widget.css, widget iframe), so the existing booksy.com allowance is correct.
7. Other fixes:
   - Header logo is 28 px on desktop, 22 px on phone.
   - Header button label is wrapped in one span, so the double gap is gone.
   - The Booksy widget dialog now gets focus itself (tabindex -1) instead of its iframe, so Esc closes it.
   - Home photos swapped: depilacja feature uses salon-4, O nas uses salon-5, with a correct alt text.
   - Review scores use lining numerals ("100%" was rendering like "IOO%").
   - New README.md.

BROWSER QA: preview on port 4342 (PID 28864, npx wrapper PID 11932, both stopped at the end, port free; the server was restarted twice after rebuilds). Viewport was reset to desktop.
- Overflow: all 7 pages at 375, 768, 1024 and 1440 px have scrollWidth ≤ innerWidth and exactly one h1.
- Console: no errors on any page. The only error is the expected 404 status of an unknown URL.
- Anchors: /#kontakt and #cennik-zabiegu land below the 64 px header (section top 88 px).
- Mobile menu: opens, scroll is locked, Esc closes it and returns focus to the toggle, a link click closes it.
- BookingModal from a "Umów" price row on home at 375 px: opens full screen with the service title, the Booksy widget-2021 loads with the selected variant, focus is on the close button, background scroll is locked. Esc closes it, unlocks scroll, returns focus to the row button and resets the iframe to about:blank.
- Booksy "Umów wizytę" (official widget): opens a centred 770×660 dialog; Esc closes it and returns focus.
- Screenshots: subpage first screen at 1440 and 375 has white header, dark band with gold eyebrow, h1, gold rule, lead, ivory and gold-outline buttons, and a framed photo; strong contrast. Home first screen is the white hero with the salon photo (black chairs), as the brief allows. Full-page 1440 shots of home, usuwanie-tatuazu and 404 confirm the alternation.

## Fundament – API komponentów

BUILDING A PAGE (src/pages/<slug>.astro; keep all page text in that file; facts only from research.md and Booksy descriptions):
```
import Base from '../layouts/Base.astro';
import PageIntro from '../components/PageIntro.astro';
<Base title="X w Orzeszu" description="120-160 znaków z Orzesze" jsonLd={[serviceSchema({ name, description, path: routes.makijaz })]} cta={{ title?, text?, eyebrow?, buttonLabel?, id? } | false}>
  <PageIntro … />                                         MUST be first (contains the only h1; check:links enforces it)
  <section class="section" aria-labelledby="x-title"><div class="container">…</div></section>            white
  <section class="section section--ivory" …>…</section>   ivory; alternate white / ivory
  <section class="section section--dark" …>…</section>    optional dark band, colours switch automatically
</Base>   → Base appends CtaBand (dark) as the last element of <main>, then the dark footer and the BookingModal.
```
- Base props: `title` (layout adds " · La Beauté Orzesze"; title ≤ 70 chars total), `description` (50–165 chars), `brandInTitle=true`, `jsonLd: Record<string,unknown>[]`, `noindex`, `ogImage='/og.png'`, `cta` (texts object or false; default CtaBand texts).
- Containers: `.container` (1200 px), `.container--narrow` (760 px).
- Section classes: `.section`, `.section--tight`, `.section--ivory`, `.section--dark`, `.section--rule`.
- Utility classes: `.eyebrow`, `.eyebrow--center`, `.lead`, `.muted`, `.small`, `.prose` (long text with gold dash bullets), `.hairlist`, `.btn-row`, `.link-arrow`, `.rule-gold`, `.visually-hidden`, `.nowrap`. `.tone-dark` gives colours only, without the dark background.
- Images: `import photo from '../assets/photos/<name>.jpg'` (salon-1, 3, 4, 5, 6; inspiracja-1…5; personel-*; cover-aldona). Note: salon-5 is a manicure station, salon-4 a treatment room with marble top, salon-3 is Aldona holding a laser handpiece, inspiracja-2 is lips. Use `<Image>` from astro:assets with widths, sizes and loading="lazy" outside the first screen. No inline styles (CSP); use classes.

PageIntro.astro (dark intro band: #141414, gold hairline at the bottom and a 56 px gold rule under the h1, eyebrow #D9BF86, h1 clamp up to 3.3rem, lead #F6F2EA). Props:
- `eyebrow?: string`
- `title?: string` (or `<Fragment slot="title">… <em>…</em></Fragment>`)
- `lead?: string`
- `image?: ImageMetadata`
- `imageAlt?: string` (required with image; throws otherwise)
- `imagePosition?: 'center'|'top'|'bottom'|'left'|'right'`
- `imageEager?: boolean = true`
- `primary?: { label: string; href?: string; booksy?: boolean }`
- `secondary?: Action` (same shape as primary)
- `note?: boolean` (BookingNote under the buttons)
- `compact?: boolean` (lower band, no image)
- `id?: string = 'page-title'` (the h1 id)
- Default slot: extra content under the lead.
- Layout: with an image it is 7fr/5fr on desktop with a 4:5 photo in a gold inset frame; below 900 px the photo goes under the text at 3:2.

CtaBand.astro (dark CTA band; rendered by Base, so normally do not insert it yourself). Props:
- `eyebrow='Rezerwacja'`
- `title='Umów wizytę'`
- `text='Zarezerwuj termin online przez Booksy albo zadzwoń do salonu. Przyjmujemy wyłącznie po wcześniejszej rezerwacji.'`
- `buttonLabel='Umów wizytę online'`
- `id='rezerwacja'` (renders `<section id>` and an h2 with id `${id}-title`)
- Content: Booksy button, then "lub zadzwoń" with a big serif tel: link, then BookingNote.
- Standalone use mid-page needs a different id.

Other components:
- **Hero** (home only): `eyebrow`, `title` or slot title, `lead`, `image`, `imageAlt`, `imagePosition`, `primary`/`secondary` Action, `meta: {value?, label, href?}[]`, `note`.
- **SectionHead**: `eyebrow`, `title` or slot title, `lead`, `as='h2'|'h1'|'h3'`, `id`, `align='left'|'center'`, `class`. Give the section `aria-labelledby` = id.
- **ServiceFeature**: `index`, `eyebrow`, `title`, `text` (or slot), `image`, `imageAlt`, `imagePosition`, `href`, `linkLabel='Poznaj zabieg'`, `highlights: {label, value}[]`, `reverse`, `as='h3'`, `id`.
- **Faq**: `items: {q, a}[]` (paragraphs in `a` separated by blank lines), `openFirst=false`, `schema=true` (adds FAQPage JSON-LD; use at most one Faq per page), `class`. It renders only the list; put SectionHead before it.
- **Steps**: `steps: {title, text}[]`, `cols: 2|3|4 = 4`, `as='h3'|'h4'`, `class`. Ordered list with italic serif numbers 01, 02…; dark-aware.
- **Team**: `only?: string[]` (keys aldona, zaneta, wiktoria), `as='h3'|'h4'`.
- **Reviews**: `id='opinie'`, `tone='ivory'|'white'|'dark'`, `eyebrow`, `title`, `lead`, `quotes: {text, author, source?: 'Booksy'|'Google'|'Facebook', href?}[]`. Full section; its values come from site.reviews.
- **Contact**: `id='kontakt'`, `tone='white'|'ivory'`, `eyebrow`, `title`, `lead`.
- **Hours**: `caption`, `showCaption`, `class`.
- **BookingNote**: `as='p'|'span'|'div'`, `class`. Renders "Rezerwacje online do 2 tygodni do przodu; w innym terminie zadzwoń: 784 736 463."
- **Button**: `href`, `variant='primary'|'secondary'`, `size='md'|'sm'`, `booksy`, `booking` (service name), `external`, `class`, `id`, `ariaLabel`.

PRICE LISTS (PriceList.astro). Props:
- `categories?: readonly string[]`: Booksy category names, case and trailing spaces ignored; one group per category; group id = slugify(name), e.g. #makijaz-permanentny, #epilacja-laserowa-alma-baby-remove, #laser-nd-yag-q-switch; heading = categoryLabel (Popularne→"Najczęściej wybierane", PROMOCJA→"Promocje", "Laser nd-Yag Q-SWITCH"→"Laser Nd:YAG Q-Switch").
- `items?: readonly Service[]`: one group; takes priority over categories.
- `title?` (heading of the items group, or override for a single category)
- `as='h3'|'h2'|'h4'`
- `caption?`
- `labels?: Record<serviceId, string>` (custom display names)
- `showDescriptions=true`
- `exclude?: number[]` (service ids)
- `footer=true` (shows "Ceny i czasy … stan na <updatedAt>" plus BookingNote)
- `count=true`
- `id?`, `class?`
- Examples:
  - `<PriceList categories={['PROMOCJA','Epilacja laserowa Alma Baby Remove']} />`
  - `<PriceList items={getServices([1680751, 3790924])} title="Najczęściej wybierane" />`
  - by category with extras: `items={[...getServices([1680751]), ...getServicesByCategory('Makijaż permanentny')]}`
  - grouping a large category (e.g. depilacja twarz/ręce/tułów/nogi/bikini): filter `getServicesByCategory('Epilacja laserowa Alma Baby Remove')` by `serviceName(s)` and render several `<PriceList items={…} title="Twarz" footer={false} />`, with `footer` only on the last.
- Single row: `<ul class="pl__rows"><PriceRow service={findService(id)!} label? showDescription? noBooking? /></ul>`.
- PriceRow shows name (descriptions longer than 180 chars or multi-line are folded into "Opis zabiegu" details), duration, price ("od 150 zł" for "+", "cena ustalana indywidualnie" for "Zmienna") and a "Umów" sm button.

src/lib/uslugi.ts helpers:
- Data access: `loadServices()`, `loadData()`, `updatedAt`, `dataSource`, `formatUpdatedAt(iso?)` → "16 października 2026".
- Categories: `normalizeCategory`, `categoryLabel(name)`, `slugify(s)`, `groupByCategory(services?)` → `Category{name,label,slug,services}[]` in Booksy order, `getCategory(name)`, `getCategories(names)` (warns on unknown), `getServicesByCategory(name)`.
- Services: `findService(id)` (service id or variant_id), `getServices(ids)` (warns on missing ids at build), `serviceName(s)` (NAME_OVERRIDES plus spacing fixes, e.g. "LaserowaPakiet6Zabiegów" → "Laserowa Pakiet 6 Zabiegów"), `serviceDescription(s)`.
- Prices: `priceInfo(price)` → `{kind:'fixed'|'from'|'variable'|'unknown', amount, amountText:'1350 zł', text}`, `formatPrice(price)` ("900,00 zł"→"900 zł", "150,00 zł+"→"od 150 zł", "Zmienna"→"cena ustalana indywidualnie"; uses NBSP), `priceRange()` → `{min,max,text:"20–3240 zł"}`.
- Duration: `formatDuration(min)` (180→"3 h", 90→"1 h 30 min", 45→"45 min").
- Booking: `bookingUrl(variantId)`, `serviceBookingUrl(service)`.
- Types: `Service`, `Category`, `PriceInfo`.

src/lib/schema.ts: `beautySalonSchema()` (home), `serviceSchema({name, description, path, serviceType?})` (subpages), `salonRef()`.

src/config/site.ts: `site` (name, address, geo, phone{display,intl,href}, email, social, booksy{id, profileUrl, linkUrl, widgetScript, widgetBase, bookingWindowWeeks:2}, maps, hours, team, reviews), `addressLine`, `hoursText()`, and `routes` (home, makijaz, depilacja, tatuaz, cennik, polityka, zabiegi:'/#zabiegi', oNas, opinie, kontakt).

BOOKING:
- `<Button booksy>Umów wizytę</Button>`: general booking. href is booksy linkUrl with target _blank (works without JS). With JS it opens the same BookingModal as the price rows, loaded with `site.booksy.widgetBase` (all services, no variantId) and the title bar „Rezerwacja online · La Beauté”. (Changed 2026-10-18: the official booksy.com/widget/code.js is no longer used; see „Poprawki po przeglądzie” below.)
- `<Button href={bookingUrl(s.variant_id)} booking="Service name" size="sm">Umów</Button>`: per-service booking; PriceRow does this. It opens BookingModal (`<dialog>` + iframe of widget-2021 with that variantId, title bar with the service name, "Otwórz w nowej karcie", 2-week note). Close via button, Esc, backdrop click or Booksy's postMessage close. It locks html scroll (`html.is-locked`), focuses the close button and returns focus to the trigger. Without JS it is a new-tab link.
- One delegated document click handler covers `a[data-booksy]` and `a[data-booking]`; with JS both get `aria-haspopup="dialog"`. BookingModal is mounted once by Base. The dialog is viewport-sized (min(860px, 100vw−32px) × min(960px, 100dvh−32px); full screen below 600 px width or 500 px height) and the Booksy iframe scrolls inside it.

CONTENT LOCATION: page text lives in that page's .astro file. Salon facts go in src/config/site.ts. Prices come only from src/data/uslugi.json (updated by `npm run sync`, never by hand). Photos are in src/assets/photos. Mark unknown facts with `[do uzupełnienia przez właścicielkę]` in code comments only. After changes run `npm run test`, which must pass, including the rhythm checks.

## Fundament – otwarte sprawy

- Review quotes: research.md contains no review texts, so the home Opinie band shows only the ratings (Booksy 5,0/180, Google 4,7/29, Facebook 100%/25) with links. The brief's 2–3 quotes need real, verbatim reviews from the owner.
- Live Booksy now shows reviewsCount 181 (sync --dry-run on 2026-10-17); site.ts reviews.booksy.count is still 180 from research.md. Decide whether to update it.
- JSON-LD priceRange is computed from the data: '20–3240 zł'. research.md agrees; the brief says '30–3240 zł'. I kept the data value.
- Esc limitation: once the user clicks inside a Booksy iframe (BookingModal or the official widget), key presses go to the cross-origin iframe, so Esc no longer closes the window. Closing still works via our X button, Booksy's own X (postMessage close) or a backdrop/overlay click.
- Footer logo sits on an ivory plaque with a gold double frame because the supplied PNG has dark, semi-transparent gradient parts that vanish on #141414. The logo itself is unchanged; the owner should confirm this. A vector logo is still needed.
- No photo shows laser hair removal: the depilacja page and home feature use salon-4 (treatment room). All photos are temporary low-resolution web versions.
- The cennik stub's PageIntro has no image and its category nav is a plain white section. The cennik agent should finish the layout and filter (brief section 3 point 5).
- Service subpages are still stubs (PageIntro plus price list). The content agents should add white/ivory sections between them using SectionHead, Steps and Faq, then run npm run test (check:links enforces PageIntro first and CtaBand last).
- CSP 'unsafe-hashes' for the Booksy iframe's style attribute works in Chromium; browsers without support just log a harmless CSP warning. The .htaccess headers cannot be tested locally (astro preview sends no headers); verify on the real hosting.
- Domain is still the placeholder https://labeaute.example.pl in site.ts, astro.config.mjs and public/robots.txt.
- Lighthouse was not run; that is for the final QA agent. Built-in-browser checks covered all 7 pages at 375/768/1024/1440 for overflow and h1, console on all pages, menu, anchors and both booking flows. Visual screenshots cover home and makijaz (375/1440), usuwanie-tatuazu, 404, cennik (1440) and the privacy policy. Headless-Chrome 375 px shots are unreliable because of Chrome's minimum window width, so mobile visuals came from the built-in browser's mobile preset.
- Cosmetic: on 375 px the makijaż lead breaks after the en dash in '6–12 tygodniach'. Content agents can rewrite it or keep the range together.
- npm run sync, when it next writes the file, will add business.reviewsRank, openHours and aggregateRating (extra fields, not used by the site). Run npm run test after every sync, because the build warns if a service id referenced on a page has disappeared from Booksy.

## Podstrony – raport agenta 1

Both pages were already written by the interrupted agent. I reviewed them against BRIEF.md, research.md and uslugi.json and kept almost everything. `npx astro build --outDir dist-pmu` passes with zero errors and zero warnings (7 pages). I ran a copy of scripts/linkcheck.py, pointed at dist-pmu, from my scratchpad: 7 pages, 747 references, no problems. That includes the rhythm rules: PageIntro first, `.cta-band` last, dark footer, one h1, title and description lengths. `npm run test` was not run, because it builds into `dist`.

PAGES
- /makijaz-permanentny/ is PageIntro (dark, lips photo inspiracja-2, h1 "Makijaż permanentny" with italic, buttons "Umów wizytę" and "Cennik zabiegu"), then:
  - white: "Dla kogo" (zones Brwi, Usta, Linia rzęs, Odświeżenie with price and time from the data, plus inspiracja-3 in a gold frame)
  - ivory: "Przebieg wizyty" with Steps (Konsultacja, Rysunek wstępny, Pigmentacja, Dopigmentowanie 6–12 tyg.)
  - white: "Pielęgnacja po zabiegu" (six general points and a disclaimer)
  - ivory: price list in 4 groups (Pigmentacja brwi, ust i rzęs with brwi first from "Popularne"; Konsultacje; Dopigmentowanie i odświeżenie; Usuwanie makijażu permanentnego with the Remover). Any new item in category "Makijaż permanentny" after `npm run sync` lands in an automatic "Pozostałe pozycje" group.
  - white: FAQ with 6 questions (details/summary plus FAQPage JSON-LD)
  - dark CtaBand with its own text, added by Base.
- /usuwanie-tatuazu/ is PageIntro (dark, salon-3 photo, h1 "Usuwanie tatuażu i makijażu permanentnego"), then:
  - white: two uses, Tatuaż (od 200 zł, 30 min) and Makijaż permanentny (laser, remover, henna), each with a fact table
  - ivory: Laser / Remover / Konsultacja rows
  - white: "Ile zabiegów będzie potrzebnych?" (depends; factors listed; no promise of full removal or a number of treatments; the salon decides after assessing the case)
  - ivory: price list in 3 groups (category "Laser nd-Yag Q-SWITCH"; Remover plus "Usuwanie makijażu permanentnego + henna pudrowa"; Konsultacja)
  - dark CtaBand
- Each page has a unique title and description with "Orzesze" (150–152 characters), one h1, Service JSON-LD (provider from `salonRef()` in site config), and a "Umów" button per price row (BookingModal link with variantId).
- Texts are in src/content/*.ts. Prices, times and item names always come from uslugi.json through formatPrice, formatDuration and serviceName. Unknown facts are marked `[do uzupełnienia przez właścicielkę]` in code comments and phrased neutrally in the copy. The marked items are: the contraindications list, whether the consultation is required or its price counts toward the treatment, salon-specific aftercare, how remover works and how it is chosen over laser, and whether a tattoo consultation is needed first.

MY CHANGES AFTER THE REVIEW
1. usuwanie-tatuazu.astro: PageIntro `imagePosition` changed from "left" to "center". "left" cropped off the touchscreen and hand and left half of the "LA BEAUTÉ" watermark at the edge; "center" shows the face, the whole device screen and the hand.
2. usuwanie-tatuazu.ts: reworded the first paragraph under "Ile zabiegów", so it no longer says the consultation decides while the next sentence says the salon must be asked whether a consultation is needed.
3. makijaz-permanentny.ts: the first price group is now "Pigmentacja brwi, ust i rzęs" instead of "Brwi, usta i linia rzęs", which duplicated the "Dla kogo" h2.

QA
- All checks below were on the built pages served locally from dist-pmu. I used headless Chrome and a temporary static server on port 4391, not astro preview and not the browser pane. I killed the server; no listener remains on 4391.
- Full-page 1440 px screenshots of both pages checked: first screen with dark band and photo, white/ivory alternation, price lists, FAQ, dark CTA, dark footer.
- Overflow was measured with iframes at 375, 768, 1024 and 1440 px, for both pages. `scrollWidth` equals the viewport width everywhere, there is exactly one h1, and all images load.
- Not checked at 375/768 by screenshot, only by the numeric overflow measurement.

Pliki: J:\strona\labeaute\site\src\pages\makijaz-permanentny.astro, J:\strona\labeaute\site\src\pages\usuwanie-tatuazu.astro, J:\strona\labeaute\site\src\content\makijaz-permanentny.ts, J:\strona\labeaute\site\src\content\usuwanie-tatuazu.ts, J:\strona\labeaute\site\dist-pmu (build output)

Otwarte sprawy:
- inspiracja-3.jpg (used in 'Dla kogo' on /makijaz-permanentny/) is a close-up of an eye with thick, full lashes that looks like lash extensions or lamination, not necessarily permanent-makeup lash liner. The alt text is neutral ('Zbliżenie oka z gęstymi, ciemnymi rzęsami'), but the owner should confirm it fits next to the PMU text or swap it for a real PMU photo.
- On /usuwanie-tatuazu/ the intro photo salon-3 shows a small 'TÉ' fragment of the 'LA BEAUTÉ' watermark at the left edge, even with the 'center' crop. PageIntro only allows center/left/right/top/bottom, so I could not tune it further. A cleaner photo would fix it, and the owner may want to confirm the device in the photo is the Nd:YAG Q-Switch (the alt does not name it).
- Shared Header, not my file: the sub-menu (`.hdr__msub` inside `.hdr__panel` of `details.hdr__menu`) lists Makijaż permanentny, Depilacja laserowa and Usuwanie tatuażu. At 375 and 768 px these items measure about 4 px beyond the viewport right edge while the menu is closed. It causes no horizontal scroll (scrollWidth equals the viewport), but the header owner should look at it.
- Copy needing owner confirmation (marked in code comments): aftercare recommendations for PMU, contraindications, whether the consultation is required or its price counts toward the treatment, how remover works and when to pick it over laser, and whether a tattoo consultation is needed before the first treatment. The pages point to the phone number for these.
- The Booksy description of 'Makijaż permanentny brwi' is shown verbatim. It says 200 zł is added for dopigmentowanie and the whole treatment costs 1100 zł when a gift voucher is bought. The wording is the owner's, so she may want to rewrite it in Booksy.
- The word joiner U+2060 inside '6–12' (3 occurrences on /makijaz-permanentny/, to stop the line breaking after the en dash) is invisible and fine in Jost and Cormorant, but it is an invisible character in the source, so I am mentioning it.
- My QA server briefly served stale content because two python http.server processes were listening on 4391 at the same time (Windows allows the shared port). I killed both and confirmed the port is free. Other agents should check the listener count before trusting screenshots from a static server.

## Podstrony – raport agenta 2

Both tasks are finished and verified. The interrupted agent had already written scripts/sync-booksy.py, src/pages/cennik.astro and the package.json "sync" entry. I kept them, checked them against the brief and the components API, ran everything for real, and made one small fix.

TASK A, sync script (scripts/sync-booksy.py, stdlib only, `python -I -X utf8`, package.json "sync": "python -I -X utf8 scripts/sync-booksy.py"; -X utf8 is for Polish output on the Windows console):
- Method: fetches the Booksy page with a Chrome User-Agent. Parses the ld+json BeautySalon block (used as a cross-check, with a warning if offers are missing) and the __NUXT_DATA__ devalue payload. The devalue handling covers Reactive/ShallowReactive/Ref/ShallowRef wrappers, Set/Map/Date as lists, and negative indices as null. It resolves data["business:102895"] -> serviceCategories -> services -> variants and writes the same schema as before plus updatedAt and source, via a temp file and an atomic replace.
- Live run: `npm run sync` against Booksy gave "OK: 118 usług w 12 kategoriach, opinie: 181" and "Brak zmian w usługach, cenach i czasach". The regenerated src/data/uslugi.json (updatedAt 2026-10-17T14:17:32+02:00) has 118 services in 12 categories and is identical to J:\strona\labeaute\dane\uslugi-booksy.json. That covers ids, variant_ids, order, prices, durations and descriptions. The business block gains reviewsRank, openHours and aggregateRating.
- Failure paths, each tested with --html and --out in the scratchpad: no __NUXT_DATA__, invalid JSON, incomplete services, a valid payload with only 3 services ("Za mało usług: 3 (minimum 50)") and an unreadable file. Each printed a clear Polish message and exited with code 1, and no output file was written. A valid 60-service fixture was accepted. --dry-run writes nothing and the real data file was unchanged afterwards. The summary lists added, removed and changed prices, durations, names and variant ids.

TASK B, /cennik/ (src/pages/cennik.astro):
- Structure: PageIntro with a photo (inspiracja-1), then a white section with a category anchor navigation and all 12 Booksy categories in Booksy order. "Popularne" appears first as "Najczęściej wybierane" and "PROMOCJA" as "Promocje". An ivory "Jak czytać cennik" section follows, then Base appends the dark CtaBand and the dark footer.
- Navigation: sticky bar under the header on phones and tablets (horizontal scroll, no scrollbar); sticky side list with counts from 1100 px up. A small script marks the current category with aria-current; anchors work without JS.
- Content: every row (118 in total) has duration, formatted price and the "Umów" button. Depilacja laserowa is split into Twarz i szyja (12), Ręce i pachy (10), Tułów (12), Nogi (9) and Bikini (4), 47 in all, with nothing left in "Pozostałe". The 2-week booking note appears in the intro and in the info section. The line "Ceny zgodne z Booksy, aktualizacja: 17 października 2026." comes from updatedAt.
- SEO: title "Cennik zabiegów w Orzeszu · La Beauté Orzesze" (45 chars), description 158 chars, canonical https://labeaute.example.pl/cennik/, one h1, no duplicate ids, JSON-LD OfferCatalog (12 categories, 118 offers, "from" prices as priceSpecification minPrice, no price for "Zmienna").
- Fix made in this run: the JSON-LD offer names now use the same display labels as the visible text (the mezotherapy item reads "Mezoterapia mikroigłowa: blizny", not "Blizny").

Verification:
- Build: `npx astro build --outDir dist-cennik` passes with zero errors and zero warnings, 7 pages. The first attempt failed with a transient file-open error in node_modules (parallel builds on the J: drive); a retry passed. I did not run the full `npm run test`, because it builds into dist/, which other agents use.
- check:contrast passes.
- check:links was run through a patched copy in the scratchpad, since the shipped script is hard-wired to dist/. It covered dist-cennik: 7 pages, 747 references, "Brak problemów". That includes the rhythm rules (PageIntro first, CtaBand last).
- Browser QA used headless Chrome via DevTools Protocol on a static server, not the shared browser pane. The first run was on port 4391, which a sibling agent also bound, so I repeated it on 4397 after confirming the served HTML was byte-identical to dist-cennik/cennik/index.html. At 375, 768, 1024 and 1440 px scrollWidth equals innerWidth and there is one h1. For five categories (including the 47-item laser one) the anchor click puts the h2 below the header and the category bar. The active-category highlight is correct. The console has no errors or warnings. Images load (the footer logo is lazy and loads on scroll). The "Umów" button on a price row opens BookingModal for the right service (variantId 5126973 for "Makijaż permanentny ust"), locks scroll, and closes via its button.
- Screenshots viewed: first screen at 1440 and 375 (white header, dark band with gold eyebrow, h1, gold rule, lead, ivory and gold-outline buttons, framed photo), the price list at 1440, 1024, 768 and 375 (makijaż permanentny and the laser groups), and the info section, CTA band and footer. The dark/ivory/dark rhythm holds.
- Cleanup: both Chrome instances and both static servers of mine are stopped and PIDs recorded (26656 and 28532 on the first run, 17248 and 19644 on the second); ports 4397 and 9334 are free. A sibling agent still has its own http.server on 4391 (PIDs 6776 and 29620); I left it alone. It had killed my first server (26656) in order to reuse the port.

Pliki: J:\strona\labeaute\site\src\pages\cennik.astro, J:\strona\labeaute\site\src\data\uslugi.json, J:\strona\labeaute\site\scripts\sync-booksy.py, J:\strona\labeaute\site\package.json

Otwarte sprawy:
- Review count mismatch: live Booksy now reports 181 reviews (confirmed by the live sync); src/config/site.ts reviews.booksy.count is still 180 from research.md. Someone should decide whether to update it. site.ts is not one of my files.
- Prices in PriceRow.astro (shared component) render in Cormorant's default old-style figures (for example 950 and 1620 look like the digits sit at different heights). It reads like a menu card and is legible, but if the owner prefers it, add font-variant-numeric: lining-nums to .pr__price. The foundation agent already did this for review scores.
- package.json sync uses `python -I -X utf8` (not plain `python -I` as in the task text) so Polish messages print correctly on the Windows console; this is intentional.
- After each `npm run sync` that writes the file, run `npm run test`: the build warns '[uslugi] Brak usługi o id ...' if a service id referenced by name on another page has disappeared from Booksy. The next write also bumps updatedAt, so the date on /cennik/ and in all PriceList footers changes.
- The sync's closing line says 'Teraz: npm run test' even when --out points elsewhere. This is cosmetic.
- Sibling agents picked the same preview port (4391) and Windows lets two python http.server processes bind it at once, so a QA run can silently hit the wrong build. Suggest a distinct port per agent, or verify served bytes against the dist folder as I did.
- scripts/linkcheck.py is hard-wired to dist/ with no argument for another output folder. Parallel agents using --outDir dist-<tag> have to run a patched copy; an optional DIST argument (or env var) would be a small improvement for the shared script, which is not mine to edit.
- In the closed header mobile menu (details#mobile-menu, hdr__msub), list items measure about 19 px beyond the viewport at 375 and 768 px. They are hidden and do not cause page overflow (scrollWidth equals innerWidth), so there is no visible problem, but it is worth knowing if anyone adds an overflow check by element.
- Unchanged from the foundation report: domain is still the placeholder labeaute.example.pl; the JSON-LD priceRange is computed as 20–3240 zł while the brief says 30–3240 zł; Lighthouse was not run (final QA agent); the .htaccess CSP can only be tested on real hosting.

## Podstrony – raport agenta 3

The /depilacja-laserowa/ page is complete and passes every check I could run on my own build. I found both files already fully written by the interrupted agent, kept them, and made targeted fixes. `npx astro build --outDir dist-laser` built with zero errors and zero warnings (7 pages). I ran the repo's linkcheck (a copy pointed at dist-laser) and check-contrast: 7 pages, 747 references, no problems, all contrast pairs OK, and the rhythm rules enforced by linkcheck pass for this page (PageIntro first, CtaBand last, dark footer, title and description lengths). I did not run the full `npm run test`, because it builds into `dist` and could collide with the other agents' builds.

STRUCTURE (src/pages/depilacja-laserowa.astro; all copy and data logic in src/content/depilacja-laserowa.ts)
- Dark PageIntro with the h1 "Depilacja laserowa", the salon-4 photo, a "Umów wizytę" Booksy button, a "Cennik zabiegu" anchor and BookingNote.
- White: "O zabiegu" with a facts column (device, single from 150 zł, pack from 810 zł, session time 20 min – 1 h 30 min).
- Ivory: price list.
- White: "Jak przygotować się do zabiegu".
- Ivory: "Jak wygląda wizyta" (Steps, 4 columns).
- White: "Pielęgnacja po zabiegu".
- Ivory: FAQ with 6 questions and FAQPage JSON-LD.
- Dark CtaBand ("Umów depilację laserową"), added by Base, then the dark footer.
- Single h1. The title is "Depilacja laserowa Alma Baby Remove w Orzeszu · La Beauté Orzesze" (65 characters). The description is 160 characters and contains "Orzesze". The canonical URL is correct. The Service JSON-LD has provider, areaServed and an AggregateOffer (150–3240 PLN, 54 offers).

PRICE LIST
- All 47 "Epilacja laserowa Alma Baby Remove" items and 7 "PROMOCJA" items are regrouped by zone and paired by name into 27 rows, each with "1 zabieg" and "Pakiet 6 zabiegów" side by side. The pairing is derived from the data and nothing was left unpaired.
- Groups: Twarz i szyja (12 items), Ręce i pachy (10), Tułów i pośladki (12), Nogi i stopy (8), Bikini (4), Zestawy łączone (8: Wąsik + Broda, Wąsik + Pachy, Pachy + Bikini, Bikini + Nogi). Chip navigation links to each group, and there is a link to the full /cennik/.
- The rendered HTML contains exactly 54 booking links, one per variant_id: none missing, none extra, none duplicated.
- The saving "taniej o X zł" is shown only when both prices are fixed amounts and the pack is cheaper. In the current data every pair comes out 10 percent cheaper, so the page also says "o 10% taniej". Both the 10% and the wording are computed from the data, so they would change or disappear after a sync.

CHANGES I MADE ON RESUME
1. The intro photo alt no longer says "laser na blacie". I looked at the photo: it shows two cosmetic devices on a marble counter, and nothing proves one is the Alma.
2. The Zestawy łączone caption no longer says "oznaczona jako promocja". That claim was false for the Nogi + Bikini pack, which sits in the main category, and the data does not say whether the prices are time-limited.
3. The visit steps now speak to the client instead of asserting unconfirmed salon procedures. "Przed zabiegiem" became "Początek wizyty", which also removed a clash with the section above, and "Po zabiegu" now tells the client to ask the salon for the next date.
4. Prices and the fact figures use lining numerals, because Cormorant's old-style figures made "150" read as "ı50".
5. The header comment in the content file now lists everything still marked [do uzupełnienia przez właścicielkę].

FACTS AND WORDING
- Only confirmed facts are stated: Alma Baby Remove, Aldona performs the laser treatments (all 54 services are assigned to her in Booksy), visits by reservation only, and booking up to 2 weeks ahead.
- Preparation and after-care are generic and cautious, introduced by a visible sentence saying the salon's own instructions take precedence.
- There are no medical promises and no "bezbolesne". The "Czy zabieg boli?" answer says sensations are individual.

BROWSER QA (no shared browser pane; my own static server on port 4350 and headless Chrome driven over its debugging protocol, both stopped by PID, ports confirmed closed)
- At 375, 768, 1024 and 1440 px: scrollWidth equals innerWidth, one h1, 27 rows, 54 "Umów" buttons, all images loaded, no clipped text in price cells, no page errors.
- Screenshots viewed: first screen at 375 and 1440 (dark band with gold eyebrow and rule, ivory and gold-outline buttons, framed photo; strong contrast), the about section and the price list at 1440, 768, 1024 and 375, and the lower sections at 1440. The 3-column price rows hold up at 1024, the 2-column rows at 768, and the stacked rows at 375.
- I did not test opening the booking modal, since the shared Button and BookingModal are not my files and were verified by the foundation agent. I did not run Lighthouse.

Pliki: J:\strona\labeaute\site\src\pages\depilacja-laserowa.astro, J:\strona\labeaute\site\src\content\depilacja-laserowa.ts

Otwarte sprawy:
- Content to confirm with the owner: preparation, after-care and visit-course wording is generic. It is marked [do uzupełnienia przez właścicielkę] in the header comment of src/content/depilacja-laserowa.ts and framed on the page with a note that the salon's own instructions take precedence. The owner should also confirm the interval between package sessions and package validity, whether the PROMOCJA prices are time-limited, and whether a consultation or skin test precedes the first treatment.
- Booksy data inconsistency shown as-is: the session time differs between single and pack for some pairs (Bikini + Nogi 1 h 15 min vs 30 min; Pachy + Bikini 45 vs 30 min; Dłonie 30 vs 20 min; Bikini głębokie 45 vs 30 min). The owner should check these in Booksy, then run `npm run sync`.
- Photo: there is no photo of laser hair removal; the page uses salon-4 (treatment room) with a deliberately neutral alt text. Replace it when the owner supplies a suitable photo.
- Shared PriceRow (not my file) still shows prices in Cormorant's old-style figures, so the other price lists differ from this page, where I applied lining-nums and tabular-nums locally. Consider font-variant-numeric: lining-nums on the shared price class so all lists match.
- Shared layout (Base): the build output preloads the four latin-ext woff2 fonts, and headless Chrome warns that they are 'preloaded but not used within a few seconds' (4 warnings, not errors). The layout owner could drop the latin-ext preloads or check whether they are needed.
- Shared Header (not mine): the closed mobile menu's .hdr__msub submenu links have layout boxes up to 19 px past the viewport at 375 and 768 px. They are invisible and do not cause horizontal scroll (scrollWidth equals the viewport), so this is cosmetic and only matters if a checker counts element bounding boxes.
- Mobile length: on 375 px the price list is about 8,200 px tall (27 rows, two offers each, stacked). That is readable but long. A compact mobile row would need a change to the layout or the shared pattern; I left it, since a denser layout risks cramping at 320 px.
- Process note: my first headless Chrome was killed externally during QA, probably by another agent cleaning up chrome.exe. I relaunched it on its own port and profile and stopped it by PID. The scratchpad shots folder is shared with other agents, so I used my own shots-depil subfolder. Anyone running a blanket taskkill on chrome.exe affects other agents' sessions.

## Poprawki po przeglądzie (2026-10-18)

Agent poprawek (Opus). `npm run test` przechodzi (build, kontrast, 7 stron i ok. 760 odnośników bez problemów). Szczegóły testu w przeglądarce są w raporcie dla orkiestratora.

ZMIANY
- Rezerwacja (zgłoszenie właściciela): przyciski „Umów wizytę” (nagłówek, hero, wstęp podstron, pas CTA, kontakt) otwierają teraz własny BookingModal z oknem `widget-2021` bez variantId (wszystkie usługi), tytuł „Rezerwacja online · La Beauté”. Oficjalny skrypt `booksy.com/widget/code.js` nie jest już ładowany: jego okno rozciągało iframe do 8–10 tys. px, więc komunikat Booksy „Brak wolnych terminów” był daleko pod ekranem. Usunięte: ładowanie skryptu, prefetch przy wskazaniu, `#booksy-host`, `site.booksy.widgetScript`, style `.booksy-widget-*`, w CSP `script-src/style-src/img-src/connect-src/form-action https://booksy.com` i hash `'unsafe-hashes'` (zostaje `frame-src https://booksy.com`). Bez JS przyciski są linkami do profilu w nowej karcie. Okno ma wysokość ekranu minus 2×16 px (do 960 px), a na niskich ekranach (≤ 500 px, telefon w poziomie) pełny ekran z niższym paskiem.
- `prefers-reduced-motion`: `animation: none; transition: none` zamiast czasów 0,01 ms (przesunięcie hero na telefonie, CLS 0,55).
- Hero na telefonie i tablecie: nowy prop `imagePositionMobile` (strona główna: `top`), logo na ścianie nie jest już ucięte.
- Opisy z Booksy (`serviceDescription`): „Beautè” → „Beauté”, literówki, usunięte zdania z obietnicami („całkowicie bezpieczny”, „wspomaga leczenie trądziku”, „nie powoduje podrażnień”, „efekty widoczne po pierwszym razie”, „skuteczne pozbycie się pękających pięt”). Reguły są w `DESCRIPTION_FIXES` w `src/lib/uslugi.ts`.
- Nazwy usług (`serviceName`): wielkie litery jak w zdaniu, półpauzy, spacje wokół „+”; nowe NAME_OVERRIDES dla Removera i dopigmentowania ust.
- Ceny z odstępem tysięcy jak w Booksy („1 350 zł”, twarda spacja; `formatAmount`). JSON-LD `priceRange` bez odstępu.
- /makijaz-permanentny/ i /usuwanie-tatuazu/: informacja o 2 tygodniach i telefonie pod przyciskami we wstępie (`note`). Z sekcji „Dla kogo” usunięte zdjęcie inspiracja-3 (rzęsy jak po przedłużaniu); układ jak w „Po zabiegu”.
- Strona główna: „linia rzęs” zamiast „kreska rzęs”, nazwa lash linera z cennika; po dwa linki do właściwych kategorii cennika w „Pozostałych zabiegach”.
- /cennik/: ukryty dopisek z nazwą kategorii w linkach „Poznaj zabieg”; zapas pod ostatnią kategorią (komputer), żeby przyklejony spis nie znikał; obserwator kategorii startuje po pierwszym wyrenderowaniu.
- Tytuł /depilacja-laserowa/: „Depilacja laserowa w Orzeszu · La Beauté Orzesze” (48 znaków zamiast 65).
- Zakres „6–12” bez niewidocznego U+2060: nowy komponent `Text.astro` (zakresy liczb w `span.nowrap`), użyty w PageIntro (lead), Steps i liście pielęgnacji.
- Fonty: pełne pliki wag z @fontsource (z unicode-range), preload tylko latin 500 (szeryf) i latin 300 (Jost).
- Polityka prywatności: punkt 4 opisuje okno Booksy w iframe (bez skryptów Booksy na stronie) oraz narzędzia Booksy w oknie (cookies, Google Tag Manager, baner zgód). Dane rejestrowe idą z `site.legal` w `src/config/site.ts`.
- Nagłówek: menu na telefonie ma nazwę „Menu główne”. `scripts/sync-booksy.py`: polskie komunikaty działają też przy zwykłym `python -I`.

OTWARTE SPRAWY (dla właścicielki)
- Polityka prywatności: brak pełnej nazwy firmy z CEIDG, NIP i nazwy dostawcy hostingu. Wpisz je w `site.legal` (`src/config/site.ts`); do tego czasu `npm run build` wypisuje ostrzeżenie `[polityka-prywatnosci]`, a strona podaje tylko imię, nazwisko, adres i kontakt.
- Opisy usług w Booksy (peeling węglowy, pedicure calluspeeling, pisownia „La Beautè”) warto poprawić u źródła; strona do tego czasu je filtruje.
- Zdjęcie makijażu permanentnego (brwi lub linii rzęs) do sekcji „Dla kogo” na /makijaz-permanentny/.
- Kalendarz Aldony w Booksy: 2026-10-18 każda jej usługa pokazywała „Brak wolnych terminów” (rezerwacje tylko 2 tygodnie do przodu). Warto sprawdzić, czy to zamierzone.


## Poprawki wydajności: CLS i /cennik/ (2026-10-18)

Agent wydajności. `npm run test` przechodzi (build, kontrast, 7 stron i 759 odnośników). Pomiary: Lighthouse 12, tryb mobilny domyślny, `astro preview` na 127.0.0.1, Windows z sesją RDP.

PRZYCZYNA CLS 0,55 NA TELEFONIE (strona główna)
- Na tym komputerze (sesja RDP wyłącza animacje systemu) Chrome i Lighthouse działają z `prefers-reduced-motion: reduce`. Dawna reguła dla tego trybu dawała `transition-duration: 0.01ms` przy domyślnym `transition-property: all`, więc każda zmiana stylu po zastosowaniu zapytań mediów (hero na telefonie: `order: -1`, `aspect-ratio: 4/3`) była „przejściem”, a pierwsza klatka pokazywała stare wartości (zdjęcie pod tekstem). Potem `.hero__copy` i `.hero__media` przeskakiwały: przesunięcie 0,5505.
- Odtworzone na kopii `dist` ze starą regułą: CLS 0,55 w 2 z 3 uruchomień Lighthouse (0,551 i 0,55) i w 5 z 6 własnych ładowań przy 412 px. Obecna reguła (`animation: none; transition: none !important` w `global.css`) daje CLS 0 w każdym uruchomieniu. To jest naprawa przyczyny; tej reguły nie wolno wracać do czasów 0,01 ms.
- Bez ograniczonego ruchu przejścia dotyczą tylko koloru, `transform` i szerokości kreski przy najechaniu, nie układu, więc zwykłych użytkowników to nie dotyczyło.
- Sprawdzone i wykluczone: zamiana fontów (zapas → Jost/Cormorant, także przy sztucznym opóźnieniu plików fontów 1,2–1,5 s: przesunięcie ≤ 0,002 na tabletach i komputerze, 0 na telefonie), zdjęcie hero (ma `width`/`height` i `aspect-ratio`), `html.is-locked` i menu (ustawiane dopiero po kliknięciu), animacje wejścia (brak), niezgodność preloadów (zgodne `crossorigin`, brak podwójnych pobrań).

ZMIANY
- `src/components/Hero.astro`: `.hero__inner { width: 100% }`. Szerokość kolumny tekstu zależała od najdłuższego wiersza treści (pasek ocen), więc zamiana kroju zapasowego na Jost zmieniała ją na tabletach (555 → 607 px), a z nią zawijanie wierszy. Wynik końcowy bez zmian (ta sama wysokość tekstu), tylko stabilny od pierwszej klatki. Do tego `widths` zdjęcia hero: dodany wariant 800 px (49 KB zamiast 63 KB dla ekranów ok. 720–800 px fizycznych, np. emulacja Lighthouse 412 px × 1,75 wybierała 960 px, bo 721 > 720).
- `src/pages/cennik.astro` (skrypt i CSS): przyczyna długiego zadania skryptu `/cennik/` to (1) zapis zmiennej CSS `--cn-tail` na `.cn__main` w ResizeObserverze (odziedziczona zmienna przeliczała style wszystkich pozycji cennika, także na telefonie, gdzie ta wartość nie jest nigdzie używana), (2) uruchamianie obserwatora w `requestAnimationFrame` (to samo zadanie obejmuje wtedy pierwsze liczenie układu całej strony, które Lighthouse przypisuje skryptowi) i (3) synchroniczny odczyt `offsetHeight` (wymuszony układ ok. 27 ms). Teraz: jeden ResizeObserver podaje wysokości nagłówka, paska kategorii i ostatniej kategorii (bez odczytu układu), z nich liczony jest margines IntersectionObservera (odświeża się też przy zmianie rozmiaru, wcześniej tylko przy przejściu przez 1100 px), a zapas pod ostatnią kategorią to `padding-bottom` ustawiany bezpośrednio na `.cn__main` wyłącznie na komputerze (≥ 1100 px). Zachowanie bez zmian: na 1440 px padding 377 px, wysokość dokumentu 15 026 px, kolejność `aria-current` jak wcześniej, po zwężeniu do 800 px padding znika, po powrocie wraca.

POMIARY (Lighthouse mobile, domyślny preset)
| Strona | Przed | Po |
|---|---|---|
| / (3 uruchomienia) | wynik 100 / 100 / 91, CLS 0 / 0 / 0, TBT 0 | wynik 92 / 92 / 92, CLS 0 / 0 / 0, TBT 0 |
| / ze starą regułą ruchu (kopia dist, tylko dla dowodu) | CLS 0,551 / 0,55 / 0 | nie dotyczy |
| /cennik/ | wynik 92, TBT 195 ms, długie zadanie skryptu 245 ms (symulacja ×4; w śladzie bez dławienia: 130 ms klatki z rAF + 28 ms wymuszonego układu) | wynik 95 i 100, TBT 0 i 39 ms, zadanie skryptu 0 i 72 ms (symulacja; w śladzie bez dławienia ok. 13 ms) |
- Własna macierz ładowań (7 stron × 5 szerokości × 2 tryby ruchu = 70 ładowań, oraz 18 ładowań z throttlingiem 4G i 4× CPU): najgorszy CLS 0,0014 (/cennik/ przy 1024 px, zamiana kroju w linkach spisu), na telefonie i w ładowaniach z throttlingiem nie więcej niż 0,0005.
- Wynik / zależy od środowiska pomiarowego: w ok. połowie uruchomień pierwsza klatka jest prezentowana dopiero po ok. 1,2 s mimo zakończonego ładowania (DCL ok. 0,2 s). Ten sam skok występuje na lekkich stronach (/404.html, /polityka-prywatnosci/: 4 z 10 uruchomień), więc to nie wina treści. W takim uruchomieniu wynik / to 91–93, w pozostałych 97–100. Cel ≥ 90 jest spełniony w każdym z 17 uruchomień po zmianach (minimum 91), ale zapas w „wolnym” przebiegu to 1–3 punkty.

NIEZMIENIONE, DO DECYZJI
- Render-blocking CSS (3 pliki na /, 4 na /cennik/) zostaje: `inlineStylesheets: 'never'` jest potrzebne dla CSP bez `unsafe-inline`.
- Pierwsze liczenie układu na / to ok. 80–120 ms (nieprzeliczone fonty, 14 000 px wysokości na telefonie). `content-visibility: auto` na sekcjach pod pierwszym ekranem skróciłoby je, ale zmienia wysokości przy kotwicach (#kontakt) i przewijaniu, więc nie zostało włączone bez przeglądu na prawdziwych urządzeniach.
- Metryki zapasowych krojów (`size-adjust`) nie są potrzebne: zamiana fontów daje przesunięcie ≤ 0,002.
- Windows: przed `npm run build` zatrzymaj `astro preview`, bo trzyma pliki w `dist` i budowa kończy się błędem EPERM przy kopiowaniu obrazów. `astro check` nie jest zainstalowany (pyta o instalację i wisi).
