#!/usr/bin/env node
/**
 * Builds the Open Graph / Twitter card image: public/og.jpg (1200×630).
 *   npm run og
 * Re-run after changing the name/role in src/data/site.mjs or the showreel.
 * Background = showreel poster, graded dark; type set in the site's fonts.
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/data/site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200, H = 630, PAD = 72;
const SANS = join(ROOT, 'node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf');
const SANS_SEMI = join(ROOT, 'node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf');
const MONO = join(ROOT, 'node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.ttf');
const SERIF = join(ROOT, 'scripts/assets/InstrumentSerif-Italic.ttf');
const FG = '#EDEDED', MUTED = '#9A9AA0', EMBER = '#FF5A1F';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Render one run of text in one font → { input, width, height } */
async function text(str, fontfile, family, size, color, letterSpacing = 0) {
  const ls = letterSpacing ? ` letter_spacing="${Math.round(letterSpacing * 1024)}"` : '';
  const buf = await sharp({
    text: {
      text: `<span foreground="${color}"${ls}>${esc(str)}</span>`,
      font: `${family} ${size}`,
      fontfile,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer();
  const { width, height } = await sharp(buf).metadata();
  return { input: buf, width, height };
}

// Background: showreel poster, cover-cropped, then graded.
const media = JSON.parse(await readFile(join(ROOT, 'src/data/media.json'), 'utf8'));
const poster = join(ROOT, 'public', media.reel['16x9'].poster.webp);
const bg = await sharp(poster).resize(W, H, { fit: 'cover', position: 'attention' }).blur(7).modulate({ saturation: 0.8, brightness: 0.9 }).toBuffer();
const grade = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#0A0A0B" stop-opacity=".96"/><stop offset=".55" stop-color="#0A0A0B" stop-opacity=".78"/><stop offset="1" stop-color="#0A0A0B" stop-opacity=".35"/></linearGradient>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#0A0A0B" stop-opacity="0"/><stop offset="1" stop-color="#0A0A0B" stop-opacity=".9"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#l)"/><rect width="100%" height="100%" fill="url(#b)"/>
  <!-- timeline ruler + playhead -->
  <rect x="${PAD}" y="${H - 64}" width="${W - PAD * 2}" height="1" fill="#2C2C31"/>
  <rect x="${PAD}" y="${H - 64}" width="${(W - PAD * 2) * 0.62}" height="2" fill="${EMBER}"/>
  <rect x="${PAD + (W - PAD * 2) * 0.62}" y="${H - 76}" width="2" height="24" fill="${EMBER}"/>
  <!-- REC badge -->
  <rect x="${PAD}" y="${PAD - 4}" width="74" height="30" rx="4" fill="none" stroke="#3A3A40"/>
  <circle cx="${PAD + 16}" cy="${PAD + 11}" r="4.5" fill="${EMBER}"/>
</svg>`);

const layers = [{ input: grade, left: 0, top: 0 }];
const place = (t, left, top) => (layers.push({ input: t.input, left: Math.round(left), top: Math.round(top) }), t);

place(await text('REC', MONO, 'Geist Mono Medium', 15, FG, 1.5), PAD + 28, PAD + 2);
place(await text(site.role.toUpperCase(), MONO, 'Geist Mono Medium', 15, MUTED, 1.8), PAD + 94, PAD + 2);

// Headline: "I edit videos people / actually finish watching."
const SIZE = 74;
const l1 = await text('I edit videos people', SANS, 'Geist Medium', SIZE, FG, -2);
place(l1, PAD - 4, 196);
const a = await text('actually', SERIF, 'Instrument Serif Italic', SIZE + 8, EMBER);
place(a, PAD - 2, 196 + SIZE + 6);
place(await text('finish watching.', SANS, 'Geist Medium', SIZE, FG, -2), PAD - 2 + a.width + 20, 196 + SIZE + 14);

// Footer: name + domain
place(await text(site.name, SANS_SEMI, 'Geist SemiBold', 28, FG, -0.3), PAD, H - 128);
const host = new URL(site.url).host;
const d = await text(host.toUpperCase(), MONO, 'Geist Mono Medium', 14, MUTED, 1.6);
place(d, W - PAD - d.width, H - 120);

await sharp(bg).composite(layers).jpeg({ quality: 84, mozjpeg: true }).toFile(join(ROOT, 'public/og.jpg'));
console.log('public/og.jpg written');
