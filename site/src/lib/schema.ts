/**
 * Dane strukturalne (JSON-LD). Base.astro zawsze dodaje WebSite; strony
 * przekazują swoje węzły przez prop `jsonLd`, np.:
 *   <Base jsonLd={[beautySalonSchema()]}>                       (strona główna)
 *   <Base jsonLd={[serviceSchema({ name, description, path })]}> (podstrony zabiegów)
 * Bez aggregateRating: opinie są w Booksy i Google, nie na tej stronie.
 */
import { site } from '../config/site';
import { priceRange } from './uslugi';
import { absoluteUrl } from './url';

// Adresy z domeną i podścieżką builda (SITE_URL, BASE_PATH), więc zgadzają się z canonical.
export const salonId = absoluteUrl('/#salon');
export const websiteId = absoluteUrl('/#website');

const abs = absoluteUrl;

const postalAddress = () => ({
  '@type': 'PostalAddress',
  streetAddress: site.address.street,
  postalCode: site.address.postalCode,
  addressLocality: site.address.city,
  addressRegion: site.address.region,
  addressCountry: site.address.country,
});

/** Pełny węzeł BeautySalon (strona główna). */
export function beautySalonSchema(): Record<string, unknown> {
  // Godziny zgrupowane po identycznych przedziałach (wt + czw razem).
  const groups = new Map<string, string[]>();
  for (const h of site.hours) {
    if (!h.opens || !h.closes) continue;
    const k = `${h.opens}-${h.closes}`;
    groups.set(k, [...(groups.get(k) ?? []), h.schemaDay]);
  }
  const openingHoursSpecification = [...groups.entries()].map(([k, days]) => {
    const [opens, closes] = k.split('-');
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes };
  });

  return {
    '@type': 'BeautySalon',
    '@id': salonId,
    name: site.name,
    url: abs('/'),
    logo: abs('/icon-512.png'),
    image: abs('/og.png'),
    telephone: site.phone.intl,
    email: site.email,
    address: postalAddress(),
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    hasMap: site.maps.placeUrl,
    openingHoursSpecification,
    // Liczby bez odstępu tysięcy (tekst dla wyszukiwarek), np. „20–3240 zł”.
    priceRange: (({ min, max }) => `${min}–${max} zł`)(priceRange()),
    currenciesAccepted: 'PLN',
    sameAs: [site.social.facebook, site.social.instagram, site.booksy.profileUrl],
  };
}

/** Krótki węzeł salonu do pola `provider` na podstronach. */
export function salonRef(): Record<string, unknown> {
  return {
    '@type': 'BeautySalon',
    '@id': salonId,
    name: site.name,
    url: abs('/'),
    telephone: site.phone.intl,
    address: postalAddress(),
  };
}

/** Węzeł Service dla podstrony zabiegu. `path` np. "/makijaz-permanentny/". */
export function serviceSchema(opts: { name: string; description: string; path: string; serviceType?: string }): Record<string, unknown> {
  return {
    '@type': 'Service',
    '@id': `${abs(opts.path)}#service`,
    name: opts.name,
    serviceType: opts.serviceType ?? opts.name,
    description: opts.description,
    url: abs(opts.path),
    areaServed: { '@type': 'City', name: site.address.city },
    provider: salonRef(),
  };
}
