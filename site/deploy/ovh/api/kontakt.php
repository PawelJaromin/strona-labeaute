<?php
/**
 * Obsługa formularza kontaktowego La Beauté na hostingu OVH (PHP, funkcja mail(), bez zewnętrznego dostawcy).
 * Przyjmuje POST multipart/form-data z pól: name, email, phone, message, consent, _gotcha (pułapka na boty).
 * Wymagane: name, message, consent (wartość "tak", jaką wysyła formularz) oraz co najmniej jedno z pól email / phone.
 * Odpowiada JSON: {"ok":true} lub {"ok":false,"error":"..."}; kody błędów:
 *   config (adresy niewypełnione), method, origin, rate, required, toolong, consent, contact, email, phone, mail.
 * Żądanie musi mieć nagłówek Origin albo Referer z domeny tej strony (przeglądarka wysyła Origin przy każdym POST);
 * za długie pola (wiadomość ponad 4000 znaków itd.) są odrzucane kodem toolong, a nie po cichu skracane.
 *
 * UZUPEŁNIĆ przed pierwszą publikacją (właściciel):
 *   $TO    skrzynka, na którą mają przychodzić wiadomości z formularza,
 *   $FROM  adres nadawcy W DOMENIE STRONY (np. formularz@twoja-domena.pl), żeby przeszedł SPF/DKIM OVH;
 *          adres musi istnieć jako skrzynka/alias w poczcie OVH tej domeny.
 * Dopóki w którymś z adresów jest słowo UZUPELNIJ, skrypt nic nie wysyła i odpowiada {"ok":false,"error":"config"},
 * a strona pokazuje komunikat o niepowodzeniu z numerem telefonu i adresem e-mail salonu.
 *
 * UWAGA (polityka prywatności): punkty 5, 6 i 8 polityki (src/pages/polityka-prywatnosci.astro) zakładają, że $TO
 * to skrzynka Gmail salonu z src/config/site.ts (site.email). Jeśli ustawisz tu inny adres, popraw tekst polityki;
 * scripts/build.mjs wypisze w takim wypadku ostrzeżenie.
 *
 * Ten plik leży w deploy/ovh/api/ i jest kopiowany do dist/api/ przez scripts/build.mjs. Jest publiczny
 * (każdy może go pobrać z serwera), więc nie wpisuj tu żadnych haseł ani kluczy: wystarczą dwa adresy e-mail.
 */

declare(strict_types=1);

$TO   = 'UZUPELNIJ@domena-salonu.pl';
$FROM = 'UZUPELNIJ@domena-salonu.pl';   // nadawca z własnej domeny strony (SPF/DKIM OVH)
$MAX_MESSAGE = 4000;                    // maksymalna długość wiadomości (znaków; tyle samo ma maxlength pola w formularzu)
$RATE_SECONDS = 20;                     // minimalny odstęp między wysyłkami z jednego IP

date_default_timezone_set('Europe/Warsaw'); // data w treści maila w czasie polskim (serwer domyślnie ma UTC)
ini_set('display_errors', '0');         // ostrzeżenia PHP nie mogą psuć odpowiedzi JSON
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(bool $ok, string $error = '', int $status = 200): void
{
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

// Długość tekstu w znakach (mb_strlen, gdy jest rozszerzenie mbstring; inaczej liczenie znaków UTF-8 wyrażeniem
// regularnym, a dla niepoprawnego UTF-8 strlen, czyli bajty).
function len(string $v): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($v, 'UTF-8');
    }
    $n = preg_match_all('/./su', $v);
    return $n === false ? strlen($v) : $n;
}

// Skrócenie tekstu do $max znaków (mb_substr, gdy jest rozszerzenie mbstring; inaczej wyrażenie regularne UTF-8).
// Służy tylko do tematu maila; pola formularza za długie są odrzucane, nie skracane.
function cut(string $v, int $max): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($v, 0, $max, 'UTF-8');
    }
    return preg_match('/^.{0,' . $max . '}/su', $v, $m) === 1 ? $m[0] : substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'method', 405);
}
if (strpos($TO, 'UZUPELNIJ') !== false || strpos($FROM, 'UZUPELNIJ') !== false) {
    respond(false, 'config', 500);
}

// Tylko z własnej strony (ochrona przed cudzymi formularzami): host z Origin albo, gdy go brak, z Referer musi być
// hostem tej strony. Żądanie bez żadnego z tych nagłówków jest odrzucane (przeglądarki zawsze wysyłają Origin przy POST).
$origin  = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');
$host    = strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
$hostOf  = static function (string $url): string {
    return strtolower((string) parse_url($url, PHP_URL_HOST));
};
$source = $origin !== '' ? $origin : $referer;
if ($source === '' || $host === '' || $hostOf($source) !== $host) {
    respond(false, 'origin', 403);
}

// Pułapka na boty: ukryte pole musi być puste.
if (!empty($_POST['_gotcha'])) {
    respond(true); // cicho udajemy sukces
}

// Prosty limit częstotliwości na IP (plik w katalogu tymczasowym; nazwa to skrót adresu IP).
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$rateFile = sys_get_temp_dir() . '/labeaute-form-' . md5($ip);
if (is_file($rateFile) && (time() - (int) filemtime($rateFile)) < $RATE_SECONDS) {
    respond(false, 'rate', 429);
}

// Pole tekstowe w jednym wierszu (bez CR/LF). Zbyt długie pole nie jest skracane, tylko zgłaszane (toolong).
$tooLong = false;
$clean = static function (string $key, int $max) use (&$tooLong): string {
    $v = (isset($_POST[$key]) && is_string($_POST[$key])) ? $_POST[$key] : '';
    $v = trim(str_replace(["\r", "\n"], ' ', $v));
    if (len($v) > $max) {
        $tooLong = true;
    }
    return $v;
};

$name    = $clean('name', 120);
$email   = $clean('email', 160);
$phone   = $clean('phone', 40);
$consent = strtolower($clean('consent', 10));
$message = (isset($_POST['message']) && is_string($_POST['message'])) ? trim($_POST['message']) : '';
// Przeglądarka wysyła nowe wiersze z <textarea> jako CRLF, a maxlength liczy je jako jeden znak: liczymy tak samo.
$message = str_replace(["\r\n", "\r"], "\n", $message);

if ($tooLong || len($message) > $MAX_MESSAGE) {
    respond(false, 'toolong', 400);
}
if ($name === '' || $message === '') {
    respond(false, 'required', 400);
}
// Zgoda RODO: formularz wysyła "tak"; wartości w rodzaju "0", "nie", "false" nie są zgodą.
if (!in_array($consent, ['tak', 'on', '1', 'true', 'yes'], true)) {
    respond(false, 'consent', 400);
}
if ($email === '' && $phone === '') {
    respond(false, 'contact', 400);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'email', 400);
}
if ($phone !== '' && (!preg_match('/^[0-9 +().\/-]{5,40}$/', $phone) || strlen((string) preg_replace('/\D+/', '', $phone)) < 7)) {
    respond(false, 'phone', 400);
}

$subject = '[La Beaute] Wiadomość ze strony: ' . cut($name, 60);
$subjectEncoded = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n")
    : '=?UTF-8?B?' . base64_encode($subject) . '?=';

$lines = [
    'Nowa wiadomość z formularza na stronie (' . $host . ')',
    '',
    'Imię i nazwisko: ' . $name,
    'E-mail:          ' . ($email !== '' ? $email : '(nie podano)'),
    'Telefon:         ' . ($phone !== '' ? $phone : '(nie podano)'),
    'Zgoda RODO:      tak (pole zaznaczone w formularzu)',
    'Data:            ' . date('Y-m-d H:i:s T'),
    'IP:              ' . $ip,
    '',
    'Treść:',
    str_replace("\n", "\r\n", $message),
];
$body = implode("\r\n", $lines);

$headers = [
    'From: Strona La Beaute <' . $FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: labeaute-site',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email; // adres sprawdzony przez FILTER_VALIDATE_EMAIL (bez CR/LF)
}

@touch($rateFile);
$sent = @mail($TO, $subjectEncoded, $body, implode("\r\n", $headers), '-f' . $FROM);
if (!$sent) {
    @unlink($rateFile); // nieudana wysyłka nie blokuje kolejnej próby
    respond(false, 'mail', 500);
}
respond(true);
