import business from '../config/business.json';

/**
 * Shared utility helpers. Everything business-specific reads from
 * src/config/business.json — never hardcode client data in a component.
 */

/** Strip every non-digit character from a phone string. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Build a `tel:` href from a display-formatted phone number.
 * "(727) 555-1700" -> "tel:+17275551700"
 */
export function telHref(phone: string): string {
  return `tel:${toE164(phone)}`;
}

/**
 * Convert a display phone number to E.164, which is what schema.org expects.
 * Assumes US/+1 when no country code is present.
 */
export function toE164(phone: string, countryCode = '1'): string {
  const digits = digitsOnly(phone);
  if (digits.length === 11 && digits.startsWith(countryCode)) return `+${digits}`;
  return `+${countryCode}${digits}`;
}

/**
 * Full NAP address line: "123 Main Street, St. Petersburg, FL 33701".
 * Service-area businesses (no public street address) get their service-area
 * label instead — e.g. "Serving the Greater Tampa Bay Area".
 */
export function formatAddress(loc = business.location): string {
  if (!loc.street) {
    return (
      ('serviceAreaLabel' in loc && loc.serviceAreaLabel) || `${loc.city}, ${loc.state}`
    );
  }
  return `${loc.street}, ${loc.city}, ${loc.state}${loc.zip ? ` ${loc.zip}` : ''}`;
}

/** "St. Petersburg, FL" */
export function cityState(loc = business.location): string {
  return `${loc.city}, ${loc.state}`;
}

/**
 * Prose list of every service area: "St. Petersburg, Tampa, and Clearwater".
 * Page copy enumerates the areas, so deriving the list here keeps that copy in
 * step with `serviceAreas[]` — add a fourth city to the config and the meta
 * descriptions follow instead of quietly going stale.
 */
export function serviceAreaList(areas = business.serviceAreas): string {
  const names = areas.map((a) => a.name);
  if (names.length === 0) return cityState();
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/** Absolute URL for a site-relative path, using business.json domain as the base. */
export function absoluteUrl(path: string, base: string = business.domain): string {
  return new URL(path, base).href;
}

/** Kebab-case slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Long-form date: "June 15, 2025" */
export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** ISO date (YYYY-MM-DD) for <time datetime> and schema fields. */
export function isoDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Build a <title> that stays under 60 characters (spec A4).
 * Appends the brand suffix only when it fits; otherwise falls back to the
 * page-specific part alone, trimmed at a word boundary.
 */
export function pageTitle(primary: string, suffix: string = business.name): string {
  const full = `${primary} | ${suffix}`;
  if (full.length <= 60) return full;
  if (primary.length <= 60) return primary;
  const cut = primary.lastIndexOf(' ', 60);
  return primary.slice(0, cut > 40 ? cut : 60).replace(/[,;:\s-]+$/, '');
}

/**
 * Build a meta description in the 150–160 character window (spec A4).
 *
 * Client data swaps change string lengths, so page copy alone cannot guarantee
 * the window. Padding clauses are appended — whole, never mid-phrase — until
 * the description is long enough, then the result is trimmed to 160.
 */
export function metaDescription(text: string, extraPadding: string[] = []): string {
  // Graded longest-to-shortest so the greedy pass below can always find a
  // clause that fits the remaining headroom.
  const defaultPadding = [
    `Serving ${business.location.city}, ${business.location.state} and nearby communities.`,
    `Call ${business.phone} for a free quote.`,
    'Licensed, insured, and locally owned.',
    'Same-day appointments available.',
    'Licensed and insured.',
    'Free written quotes.',
    'Call us today.',
    'Free quotes.',
    'Call today.',
    'Call now.',
  ];

  let out = text.trim().replace(/\s+/g, ' ');

  for (const pad of [...extraPadding, ...defaultPadding]) {
    if (out.length >= 150) break;
    const candidate = `${out} ${pad}`;
    if (candidate.length <= 160) out = candidate;
  }

  if (out.length > 160) {
    const cut = out.lastIndexOf(' ', 160);
    out = (cut >= 150 ? out.slice(0, cut) : out.slice(0, 160)).replace(/[,;:\s-]+$/, '');
  }

  return out;
}

/** Truncate to a whole word at or under `max` characters. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max - 1))}…`;
}

/** A day is treated as closed when it opens and closes at 00:00. */
export function isClosed(entry: { opens: string; closes: string }): boolean {
  return entry.opens === '00:00' && entry.closes === '00:00';
}

/** "8:00 AM" from "08:00" */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const hour = Number(hStr);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${mStr} ${suffix}`;
}

/** "Mon – Fri: 8:00 AM – 6:00 PM" / "Sun: Closed" */
export function formatHours(entry: {
  dayOfWeek: string[];
  opens: string;
  closes: string;
}): string {
  const days = entry.dayOfWeek.map((d) => d.slice(0, 3));
  const label = days.length > 1 ? `${days[0]} – ${days[days.length - 1]}` : days[0];
  if (isClosed(entry)) return `${label}: Closed`;
  return `${label}: ${formatTime(entry.opens)} – ${formatTime(entry.closes)}`;
}

/** Non-empty social URLs, preserving the declaration order in business.json. */
export function activeSocials(
  socials: Record<string, string> = business.socials
): { platform: string; url: string }[] {
  return Object.entries(socials)
    .filter(([, url]) => Boolean(url && url.trim()))
    .map(([platform, url]) => ({ platform, url }));
}

/** Font Awesome brand icon class for a social platform key. */
export function socialIcon(platform: string): string {
  const map: Record<string, string> = {
    facebook: 'fa-brands fa-facebook-f',
    instagram: 'fa-brands fa-instagram',
    yelp: 'fa-brands fa-yelp',
    nextdoor: 'fa-brands fa-nextdoor',
    google: 'fa-brands fa-google',
    linkedin: 'fa-brands fa-linkedin-in',
    tiktok: 'fa-brands fa-tiktok',
    youtube: 'fa-brands fa-youtube',
  };
  return map[platform] ?? 'fa-solid fa-link';
}

/**
 * "Leave us a Google review" URL built from the GBP place id.
 * Falls back to the GBP profile URL when no place id is configured.
 */
export function reviewUrl(placeId: string = business.gbpPlaceId): string {
  if (!placeId) return business.gbpUrl;
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

/** Repeat a star glyph `rating` times, capped at 5. */
export function stars(rating: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, Math.round(rating))));
}
