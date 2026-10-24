/**
 * Kontrola kolorów:
 * 1) kontrasty WCAG par tekst/tło z src/styles/tokens.css (tekst ≥ 4,5:1),
 * 2) reguła z briefu: złoto jasne (--c-gold) nigdy jako kolor tekstu — skan src/**.{css,astro},
 * 3) stary kolor tekstu drugorzędnego #6B655C nie może wrócić (brief „Rytm stron”: #5A534C).
 * Uruchomienie: npm run check:contrast
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(path.join(root, 'src', 'styles', 'tokens.css'), 'utf8');
const vars = {};
for (const m of css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) vars[m[1]] = m[2].toLowerCase();

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [kolor, tło, próg, opis]
const pairs = [
  ['c-ink', 'c-bg', 4.5, 'tekst na bieli'],
  ['c-ink', 'c-bg-2', 4.5, 'tekst na kości słoniowej'],
  ['c-muted', 'c-bg', 4.5, 'tekst drugorzędny na bieli'],
  ['c-muted', 'c-bg-2', 4.5, 'tekst drugorzędny na kości słoniowej'],
  ['c-gold-ink', 'c-bg', 4.5, 'złoto do tekstu (eyebrow, etykiety) na bieli'],
  ['c-gold-ink', 'c-bg-2', 4.5, 'złoto do tekstu na kości słoniowej (stopka, cennik)'],
  ['c-btn-ink', 'c-btn', 4.5, 'tekst przycisku głównego'],
  ['c-ink', 'c-selection', 4.5, 'zaznaczony tekst'],
  ['c-focus', 'c-bg', 3.0, 'pierścień fokusu na bieli'],
  ['c-focus', 'c-bg-2', 3.0, 'pierścień fokusu na kości słoniowej'],
  ['c-btn', 'c-bg', 3.0, 'czarny przycisk jako element UI na bieli'],
  ['c-gold', 'c-bg', 2.5, 'złota linia / obrys przycisku drugorzędnego (dekoracja, tekst przycisku ma własny kolor)'],
  ['c-line', 'c-bg', 1.2, 'linie hairline (dekoracja)'],
  // Formularz kontaktowy (ContactForm.astro): komunikaty błędów i ramki pól jako elementy UI
  ['c-error', 'c-bg', 4.5, 'komunikat błędu formularza na bieli'],
  ['c-error', 'c-bg-2', 4.5, 'komunikat błędu formularza na kości słoniowej (tło komunikatu o błędzie wysyłki)'],
  ['c-gold-ink', 'c-bg', 3.0, 'ramka pola formularza (element UI, złoto do tekstu) na bieli'],
  // Ciemne pasy (PageIntro, CtaBand, Reviews tone="dark", stopka)
  ['c-dark-ink', 'c-dark', 4.5, 'tekst, h1 i lead na ciemnym pasie'],
  ['c-dark-gold', 'c-dark', 4.5, 'eyebrow i etykiety na ciemnym pasie'],
  ['c-dark-muted', 'c-dark', 4.5, 'tekst drugorzędny na ciemnym pasie'],
  ['c-dark', 'c-dark-ink', 4.5, 'tekst przycisku głównego na ciemnym pasie (przycisk w kości słoniowej)'],
  ['c-dark', 'c-dark-gold', 4.5, 'zaznaczony tekst na ciemnym pasie'],
  ['c-dark-focus', 'c-dark', 3.0, 'pierścień fokusu na ciemnym pasie'],
  ['c-gold', 'c-dark', 2.5, 'złote linie i obrys przycisku drugorzędnego na ciemnym (dekoracja)'],
];

let fail = 0;
console.log('Kontrast par z tokens.css:');
for (const [fg, bg, min, desc] of pairs) {
  if (!vars[fg] || !vars[bg]) {
    console.log(`  FAIL  brak tokenu ${!vars[fg] ? fg : bg}`);
    fail++;
    continue;
  }
  const r = ratio(hex(vars[fg]), hex(vars[bg]));
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${r.toFixed(2).padStart(5)} (min ${min})  ${desc}  [${vars[fg]} na ${vars[bg]}]`);
}

// Złoto jasne jako kolor tekstu jest zabronione (brief, sekcja 2).
const goldHex = vars['c-gold'];
const banned = [/(^|[;{\s])color:\s*var\(--c-gold\)/i];
if (goldHex) banned.push(new RegExp(`(^|[;{\\s])color:\\s*${goldHex}\\b`, 'i'));
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(css|astro)$/.test(f) ? [p] : [];
  });
let goldText = 0;
for (const file of walk(path.join(root, 'src'))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (banned.some((re) => re.test(line))) {
      goldText++;
      console.log(`  FAIL  złoto jasne jako kolor tekstu: ${path.relative(root, file)}:${i + 1}: ${line.trim()}`);
    }
  });
}
if (!goldText) console.log('  OK    złoto jasne (--c-gold) nie jest nigdzie użyte jako kolor tekstu');
fail += goldText;

// Brief „Rytm stron”: tekst drugorzędny #5A534C zamiast #6B655C.
let oldMuted = 0;
if (vars['c-muted'] !== '#5a534c') {
  oldMuted++;
  console.log(`  FAIL  --c-muted = ${vars['c-muted']}, a brief wymaga #5a534c`);
}
for (const file of walk(path.join(root, 'src'))) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (/#6b655c/i.test(line)) {
        oldMuted++;
        console.log(`  FAIL  stary kolor #6B655C: ${path.relative(root, file)}:${i + 1}`);
      }
    });
}
if (!oldMuted) console.log('  OK    tekst drugorzędny #5A534C, brak starego #6B655C');
fail += oldMuted;

if (fail) {
  console.log(`\n${fail} problem(ów) z kolorami.`);
  process.exit(1);
}
console.log('\nWszystkie pary spełniają progi.');
