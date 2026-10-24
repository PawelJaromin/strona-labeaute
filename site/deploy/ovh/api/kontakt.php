<?php
/**
 * Obsługa formularza kontaktowego La Beauté na hostingu OVH (PHP, funkcja mail(), bez zewnętrznego dostawcy).
 * Przyjmuje POST multipart/form-data z pól: name, email, phone, message, consent, _gotcha (pułapka na boty).
 * Wymagane: name, message, consent oraz co najmniej jedno z pól email / phone.
 * Odpowiada JSON: {"ok":true} lub {"ok":false,"error":"..."}; kody błędów:
 *   config (adresy niewypełnione), method, origin, rate, required, consent, contact, email, phone, mail.
 *
 * UZUPEŁNIĆ przed pierwszą publikacją (właściciel):
 *   $TO    skrzynka, na którą mają przychodzić wiadomości z formularza,
 *   $FROM  adres nadawcy W DOMENIE STRONY (np. formularz@twoja-domena.pl), żeby przeszedł SPF/DKIM OVH;
 *          adres musi istnieć jako skrzynka/alias w poczcie OVH tej domeny.
 * Dopóki w którymś z adresów jest słowo UZUPELNIJ, skrypt nic nie wysyła i odpowiada {"ok":false,"error":"config"},
 * a strona pokazuje komunikat o niepowodzeniu z numerem telefonu i adresem e-mail salonu.
 *
 * Ten plik leży w deploy/ovh/api/ i jest kopiowany do dist/api/ przez scripts/build.mjs. Jest publiczny
 * (każdy może go pobrać z serwera), więc nie wpisuj tu żadnych haseł ani kluczy: wystarczą dwa adresy e-mail.
 */

declare(strict_types=1);

$TO   = 'UZUPELNIJ@domena-salonu.pl';
$FROM = 'UZUPELNIJ@domena-salonu.pl';   // nadawca z własnej domeny strony (SPF/DKIM OVH)
$MAX_MESSAGE = 4000;                    // maksymalna długość wiadomości (znaków)
$RATE_SECONDS = 20;                     // minimalny odstęp między wysyłkami z jednego IP

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

// Skrócenie tekstu do $max znaków (mb_substr, gdy jest rozszerzenie mbstring; inaczej substr).
function cut(string $v, int $max): string
{
    return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'method', 405);
}
if (strpos($TO, 'UZUPELNIJ') !== false || strpos($FROM, 'UZUPELNIJ') !== false) {
    respond(false, 'config', 500);
}

// Tylko z własnej strony (ochrona przed cudzymi formularzami): host z Origin albo Referer musi być hostem tej strony.
$origin  = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');
$host    = strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
$hostOf  = static function (string $url): string {
    return strtolower((string) parse_url($url, PHP_URL_HOST));
};
if ($origin !== '' && $hostOf($origin) !== $host) {
    respond(false, 'origin', 403);
}
if ($origin === '' && $referer !== '' && $hostOf($referer) !== $host) {
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

// Pole tekstowe w jednym wierszu (bez CR/LF, przycięte do $max znaków).
$clean = static function (string $key, int $max): string {
    $v = (isset($_POST[$key]) && is_string($_POST[$key])) ? $_POST[$key] : '';
    $v = trim(str_replace(["\r", "\n"], ' ', $v));
    return cut($v, $max);
};

$name    = $clean('name', 120);
$email   = $clean('email', 160);
$phone   = $clean('phone', 40);
$consent = $clean('consent', 10);
$message = (isset($_POST['message']) && is_string($_POST['message'])) ? trim($_POST['message']) : '';
$message = cut($message, $MAX_MESSAGE);

if ($name === '' || $message === '') {
    respond(false, 'required', 400);
}
if ($consent === '') {
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
    'Data:            ' . date('Y-m-d H:i:s'),
    'IP:              ' . $ip,
    '',
    'Treść:',
    $message,
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
