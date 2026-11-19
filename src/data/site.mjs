// ─────────────────────────────────────────────────────────────
//  SITE CONFIG — the only place for name, contact and socials.
//  Anything marked TODO is a placeholder. Empty strings ("") are
//  treated as "not provided": the link/button is hidden in
//  production and shown with a PLACEHOLDER badge in dev.
// ─────────────────────────────────────────────────────────────

export const site = {
  // TODO: confirm exact spelling (brief says "Khandoker", folder says "Khondokar")
  name: 'Khandoker Mazeduzzaman',
  shortName: 'Mazed', // TODO: brand name shown in the header (e.g. "Izaz")
  role: 'Video Editor & Motion Designer',
  // TODO: final production domain (used for canonical URLs, sitemap, OG tags)
  url: 'https://example.com',
  description:
    'Video editor and motion designer for long-form YouTube, talking-head and podcast content. Smooth pacing, storytelling, subtitles, sound design and motion graphics.',
  locale: 'en_US',

  email: '', // TODO
  calendly: '', // TODO: e.g. https://calendly.com/your-handle/intro
  formspreeId: '', // TODO: e.g. "xyzabcd" from https://formspree.io/f/xyzabcd

  socials: [
    { label: 'YouTube', url: '' }, // TODO
    { label: 'LinkedIn', url: '' }, // TODO
    { label: 'Instagram', url: '' }, // TODO
    { label: 'Upwork', url: '' }, // TODO (or Fiverr)
  ],

  // Privacy-friendly analytics. Set ONE of these to enable.
  analytics: {
    plausibleDomain: '', // e.g. "yourdomain.com"
    vercel: false, // true → loads /_vercel/insights/script.js on Vercel
  },
};
