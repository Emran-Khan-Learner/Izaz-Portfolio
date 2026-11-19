/**
 * Placeholder policy
 * ------------------
 * Any content flagged `placeholder: true` (stats, testimonials, client
 * logos, Raw-vs-Edited, etc.) and any empty contact/social value is
 * rendered ONLY in dev, wrapped in a visible PLACEHOLDER marker.
 * In `astro build` (production) it is dropped from the HTML entirely.
 */
export const SHOW_PLACEHOLDERS: boolean = import.meta.env.DEV;

export const filled = (v: unknown): boolean =>
  typeof v === 'string' ? v.trim().length > 0 : v != null && v !== false;

/** Keep real items always; keep placeholder items only in dev. */
export function visible<T extends { placeholder?: boolean }>(items: T[]): T[] {
  return items.filter((i) => !i.placeholder || SHOW_PLACEHOLDERS);
}

/** Should a value (url/email/etc.) render? Real → yes. Empty → dev only. */
export const showValue = (v: unknown): boolean => filled(v) || SHOW_PLACEHOLDERS;
