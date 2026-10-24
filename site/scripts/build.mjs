/**
 * Build pod wybrany cel publikacji: `node scripts/build.mjs ovh [--check]`
 * (npm run build = bez kontroli, npm run build:check = z flagą --check).
 *
 * - bierze adres, podścieżkę i endpoint formularza z build-env.mjs, czyli z deploy/targets.json (cel "ovh"),
 *   a zmienne SITE_URL / BASE_PATH / PUBLIC_FORM_ENDPOINT / STAGING z otoczenia mają pierwszeństwo,
 * - uruchamia `astro build` z tymi ustawieniami (dist/),
 * - dla celu ovh (produkcja) kopiuje deploy/ovh (.htaccess i api/kontakt.php) do dist/ i wpisuje domenę
 *   z targets.json w miejsce tokenów szablonu .htaccess (kopia tymczasowa STAGING dostaje tylko stronę),
 * - usuwa z dist/_astro obrazy, do których nic się nie odwołuje (nie idą na serwer),
 * - sprawdza, że do dist/ nie trafiło nic poza stroną (źródła, .git, node_modules, klucze, docs/ itp.),
 * - z flagą --check uruchamia kontrolę kontrastu (check-contrast.mjs) i kontrolę linków i meta
 *   (linkcheck.py) z tymi samymi zmiennymi co build.
 *
 * Windows: przed budową zatrzymaj `astro preview` (trzyma pliki w dist/, build kończy się błędem EPERM).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--')) || 'ovh';
const check = args.includes('--check');

const fail = (msg) => {
  console.error(`\n[build] BŁĄD: ${msg}`);
  process.exit(1);
};

// build-env.mjs czyta cel z PUBLIC_TARGET (wartości domyślne z deploy/targets.json) i zgłasza błędy konfiguracji.
process.env.PUBLIC_TARGET = target;
let cfg;
try {
  cfg = await import('../build-env.mjs');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
const { SITE_URL, BASE_PATH, STAGING, FORM_ENDPOINT, DEFAULT_SITE_URL } = cfg;

const baseNoSlash = BASE_PATH === '/' ? '' : BASE_PATH;
const env = {
  ...process.env,
  SITE_URL,
  BASE_PATH,
  PUBLIC_FORM_ENDPOINT: FORM_ENDPOINT,
  PUBLIC_TARGET: target,
  STAGING: STAGING ? '1' : '',
};
console.log(
  `\n[build] cel: ${target}  adres: ${SITE_URL}${baseNoSlash}/  tryb: ${STAGING ? 'kopia tymczasowa (noindex)' : 'produkcja'}` +
    `  formularz: ${FORM_ENDPOINT || '(brak endpointu: mailto)'}\n`,
);

const host = new URL(SITE_URL).hostname;
if (/(^|\.)example\.(pl|com|org|net)$/i.test(host) || host === 'localhost') {
  const msg =
    `Adres strony to PLACEHOLDER (${SITE_URL}). Przed publikacją na OVH wpisz prawdziwą domenę w deploy/targets.json (pole "site"). ` +
    'Z tym adresem canonical, sitemap, robots.txt i przekierowania w .htaccess prowadzą na nieistniejącą domenę.';
  console.warn(`\n[build] UWAGA: ${msg}\n`);
  if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Domena jest placeholderem::${msg}`);
}

const astro = path.join(root, 'node_modules', 'astro', 'astro.js');
const run = (cmd, cmdArgs) => {
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', env, cwd: root });
  if (r.error) fail(`nie udało się uruchomić ${cmd}: ${r.error.message}`);
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run(process.execPath, [astro, 'build']);

const dist = path.join(root, 'dist');
if (!existsSync(path.join(dist, 'index.html'))) fail('po astro build nie ma dist/index.html.');

/* ---------------------------------------------------------------- deploy/ovh -> dist/ */
if (target === 'ovh' && !STAGING) {
  const overlay = path.join(root, 'deploy', 'ovh');
  const template = path.join(overlay, '.htaccess');
  if (!existsSync(template)) fail('brak szablonu deploy/ovh/.htaccess.');

  cpSync(overlay, dist, { recursive: true });

  // Domena z targets.json do przekierowań: __DOMENA__ (host) i __DOMENA_RE__ (host do wyrażeń regularnych).
  const domainRe = host.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  // Wstęp szablonu (komentarz do pierwszej pustej linii) opisuje tokeny; w dist/ zastępuje go krótka informacja.
  const source = readFileSync(template, 'utf8').replace(/\r\n/g, '\n');
  const cut = source.indexOf('\n\n');
  const body = cut < 0 ? source : source.slice(cut + 2);
  const header =
    '# La Beauté Aldona Targiel — konfiguracja Apache na hostingu OVH.\n' +
    `# Plik wygenerowany przez scripts/build.mjs z deploy/ovh/.htaccess; domena (${host}) pochodzi z deploy/targets.json.\n` +
    '# Nie edytuj go na serwerze: następna publikacja z GitHub Actions go nadpisze.\n\n';
  const htaccess = (header + body).replaceAll('__DOMENA_RE__', domainRe).replaceAll('__DOMENA__', host);
  const leftover = htaccess.match(/__DOMENA[A-Z_]*__/g);
  if (leftover) fail(`w .htaccess został niepodmieniony token: ${[...new Set(leftover)].join(', ')}.`);

  // Wszystkie przekierowania mają mieć pełny adres https://<domena>/..., bo przy celach względnych Apache
  // na OVH dokleja :443 do nagłówka Location.
  const badRules = htaccess
    .split(/\r?\n/)
    .filter((line) => /^\s*RewriteRule\s/.test(line))
    .filter((line) => {
      const substitution = line.trim().split(/\s+/)[2] ?? '';
      return !(substitution === '-' || substitution.startsWith(`https://${host}/`));
    });
  if (badRules.length) fail(`przekierowanie bez pełnego adresu https://${host}/...:\n  ${badRules.join('\n  ')}`);
  const redirects = htaccess.split(/\r?\n/).filter((line) => /^\s*Redirect(Match)?\s/i.test(line));
  if (redirects.length) fail(`dyrektywy Redirect w .htaccess (użyj RewriteRule z pełnym adresem):\n  ${redirects.join('\n  ')}`);

  writeFileSync(path.join(dist, '.htaccess'), htaccess, 'utf8');
  console.log(`[build] skopiowano deploy/ovh (.htaccess z domeną ${host}, api/kontakt.php) do dist/`);

  // Znacznik GitHub Pages niepotrzebny na Apache.
  rmSync(path.join(dist, '.nojekyll'), { force: true });
} else if (target === 'ovh') {
  console.log('[build] kopia tymczasowa (STAGING): deploy/ovh (.htaccess, api/) nie jest kopiowane do dist/.');
}

/* ---------------------------------------------------------------- nieużywane pliki w dist/_astro */
/* Obrazy i pliki w dist/_astro, do których nie odwołuje się żaden plik HTML, CSS ani JS, nie idą na serwer.
   Astro kopiuje tam każdy importowany obraz, także nieużywany (np. oryginał PNG logo, gdy na stronie są tylko
   jego warianty WebP). Pliki .css i .js zostają zawsze. */
const astroDir = path.join(dist, '_astro');
if (existsSync(astroDir)) {
  const texts = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(html?|css|m?js|xml|json|webmanifest|txt|php)$/i.test(e.name)) texts.push(readFileSync(p, 'utf8'));
    }
  };
  walk(dist);
  const all = texts.join('\n');
  const removed = [];
  for (const f of readdirSync(astroDir)) {
    if (/\.(css|m?js)$/i.test(f)) continue;
    if (!all.includes(f)) {
      rmSync(path.join(astroDir, f));
      removed.push(f);
    }
  }
  if (removed.length) console.log(`[build] usunięto z dist/_astro nieużywane pliki: ${removed.join(', ')}`);
}

/* ---------------------------------------------------------------- w dist/ tylko strona */
/* Wszystko z dist/ jest wgrywane do www/ i jest publiczne. Kontrola nazw plików i katalogów, które nigdy
   nie mogą się tam znaleźć (źródła, repozytorium, zależności, dokumentacja, klucze, mapy źródeł). */
const forbiddenDirs = new Set(['.git', '.github', '.astro', 'node_modules', 'docs', 'src', 'scripts', 'deploy', 'dane', 'propozycje']);
const forbiddenFile =
  /^(package(-lock)?\.json|tsconfig\.json|astro\.config\.mjs|build-env\.(mjs|d\.mts)|\.gitignore|\.gitattributes|\.env(\..*)?|thumbs\.db|\.ds_store)$|\.(md|map|py|pem|key|log|ts|tsx|astro|bak|orig)$/i;
const problems = [];
const entries = [];
const audit = (dir, rel = '') => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (forbiddenDirs.has(e.name.toLowerCase())) problems.push(`${relPath}/ (katalog nie może trafić na serwer)`);
      else audit(path.join(dir, e.name), relPath);
    } else {
      entries.push(relPath);
      if (forbiddenFile.test(e.name)) problems.push(`${relPath} (plik nie może trafić na serwer)`);
      if (/\.php$/i.test(e.name) && !relPath.startsWith('api/')) problems.push(`${relPath} (PHP tylko w api/)`);
    }
  }
};
audit(dist);
if (problems.length) fail(`w dist/ są pliki spoza strony:\n  ${problems.join('\n  ')}`);
const top = readdirSync(dist, { withFileTypes: true })
  .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
  .sort();
console.log(`[build] dist/: ${entries.length} plików; w korzeniu: ${top.join(', ')}`);

/* ---------------------------------------------------------------- kontrole (--check) */
if (check) {
  run(process.execPath, [path.join(root, 'scripts', 'check-contrast.mjs')]);
  run(process.platform === 'win32' ? 'python' : 'python3', ['-I', '-X', 'utf8', path.join(root, 'scripts', 'linkcheck.py')]);
}

console.log(`\n[build] gotowe: dist/ dla celu "${target}"${check ? ' (kontrole przeszły)' : ''}.`);
if (DEFAULT_SITE_URL !== SITE_URL) console.log(`[build] uwaga: SITE_URL z otoczenia (${SITE_URL}) różni się od adresu z deploy/targets.json (${DEFAULT_SITE_URL}).`);
