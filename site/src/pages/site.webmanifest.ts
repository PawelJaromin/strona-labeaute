/**
 * site.webmanifest generowany przy budowaniu (zastępuje public/site.webmanifest): ścieżki ikon
 * i start_url muszą uwzględniać podścieżkę (base), a w pliku statycznym byłyby na sztywno "/".
 */
import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { withBase } from '../lib/url';

export const GET: APIRoute = () => {
  const manifest = {
    name: site.name,
    short_name: site.shortName,
    description: 'Salon kosmetyczny w Orzeszu',
    lang: site.lang,
    icons: [
      { src: withBase('/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withBase('/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: withBase('/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'browser',
    start_url: withBase('/'),
    scope: withBase('/'),
  };
  return new Response(`${JSON.stringify(manifest, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
