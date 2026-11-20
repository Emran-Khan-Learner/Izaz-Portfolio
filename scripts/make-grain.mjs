// Pre-renders the film-grain tile (public/grain.png). Run: node scripts/make-grain.mjs
// A static PNG tile is far cheaper to composite than a live SVG feTurbulence filter.
import sharp from 'sharp';
const S = 128;
const LEVELS = [0, 70, 140, 210]; // few alpha levels → small palette PNG
const px = Buffer.alloc(S * S * 4);
let seed = 1337;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
for (let i = 0; i < S * S; i++) {
  px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 255; // white specks; CSS opacity sets strength
  px[i * 4 + 3] = LEVELS[Math.floor(rnd() * LEVELS.length)];
}
await sharp(px, { raw: { width: S, height: S, channels: 4 } })
  .png({ palette: true, colours: 4, compressionLevel: 9, effort: 10 })
  .toFile('public/grain.png');
console.log('public/grain.png written');
