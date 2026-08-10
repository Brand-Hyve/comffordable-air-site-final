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

/** Full NAP address line: "123 Main Street, St. Petersburg, FL 33701" */
export function formatAddress(loc = business.location): string {
  return `${loc.street}, ${loc.city}, ${loc.state} ${loc.zip}`;
}

/** "St. Petersburg, FL" */
export function cityState(loc = business.location): string {
  return `${loc.city}, ${loc.state}`;
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

/** "Leave us a Google review" URL built from the GBP place id. */
export function reviewUrl(placeId: string = business.gbpPlaceId): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

/** Repeat a star glyph `rating` times, capped at 5. */
export function stars(rating: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, Math.round(rating))));
}
