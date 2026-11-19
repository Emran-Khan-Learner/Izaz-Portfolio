#!/usr/bin/env node
/**
 * Video pipeline — turns raw-videos/* into small web assets.
 *
 *   npm run media                 build anything missing / out of date
 *   npm run media -- --force      rebuild everything
 *   npm run media -- --only ad-03 rebuild one project (and skip the reel)
 *   npm run media -- --reel       rebuild only the showreel
 *
 * Per project (src/data/works.json → "source"):
 *   public/media/<slug>/preview.mp4   H.264, 720p, ~7s, muted, +faststart
 *   public/media/<slug>/preview.webm  VP9 version
 *   public/media/<slug>/poster.avif / poster.webp   (= first frame of the preview)
 * Showreel (best moments from every clip):
 *   public/media/reel/reel-16x9.{mp4,webm}  1280×720, ~18s
 *   public/media/reel/reel-9x16.{mp4,webm}  540×960 (mobile), ~18s
 *   public/media/reel/poster-16x9.{avif,webp}, poster-9x16.{avif,webp}
 * Manifest consumed by the site: src/data/media.json (dims, duration, LQIP…)
 *
 * Optional per-work fields in works.json:
 *   "previewStart": 12.5      seconds; default = 20% into the clip
 *   "reelMoments": [8, { "at": 31, "focusY": 0.1 }]
 *                             moments (seconds) used in the showreel; each may
 *                             carry its own crop focus
 *   "reelFocusY": 0.35        0–1, vertical crop focus when a 9:16 clip is
 *                             cropped into the 16:9 reel (default 0.4;
 *                             ~0.1 keeps a talking head's eyes in frame)
 *   "segment" in manifest.reel lists exactly which cuts were used.
 *
 * Requires ffmpeg + ffprobe on PATH. Images are encoded with sharp.
 */
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'raw-videos');
const OUT = join(ROOT, 'public', 'media');
const MANIFEST = join(ROOT, 'src', 'data', 'media.json');
const TMP = join(ROOT, 'node_modules', '.cache', 'media');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const REEL_ONLY = args.includes('--reel');

const PREVIEW_SECONDS = 7;
const FPS = 30;
const CUT = 1.5; // seconds per showreel cut
const MAX_MB = 2;

// ── helpers ──────────────────────────────────────────────────
function run(cmd, argv, { quiet = true } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => {
      err += d;
      if (!quiet) process.stderr.write(d);
    });
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}\n${err.slice(-2000)}`)),
    );
  });
}
const ffmpeg = (argv) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv]);

async function probe(file) {
  const json = JSON.parse(
    await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
      'stream=width,height:stream_side_data=rotation:format=duration', '-of', 'json', file]),
  );
  const s = json.streams[0];
  let { width, height } = s;
  const rot = Math.abs(s.side_data_list?.find((d) => 'rotation' in d)?.rotation ?? 0);
  if (rot === 90 || rot === 270) [width, height] = [height, width];
  return { width, height, duration: parseFloat(json.format.duration) };
}

const mb = async (f) => (await stat(f)).size / 1024 / 1024;
const fresh = async (src, outs) => {
  if (FORCE) return false;
  if (!outs.every(existsSync)) return false;
  const s = (await stat(src)).mtimeMs;
  for (const o of outs) if ((await stat(o)).mtimeMs < s) return false;
  return true;
};
const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** H.264 + VP9 encodes of the same filtergraph. Bitrate-capped so 7s ≈ <2MB. */
async function encodePair(inputArgs, vf, outBase, { seconds, maxrate = '2000k', filterComplex = false }) {
  const v = filterComplex ? ['-filter_complex', vf, '-map', '[v]'] : ['-vf', vf];
  await ffmpeg([...inputArgs, ...v, '-an', '-t', String(seconds),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-maxrate', maxrate, '-bufsize', '4000k',
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${outBase}.mp4`]);
  await ffmpeg([...inputArgs, ...v, '-an', '-t', String(seconds),
    // Constrained-quality VP9: CRF with -b:v acting as the ceiling.
    '-c:v', 'libvpx-vp9', '-crf', '42', '-b:v', maxrate,
    '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', '-pix_fmt', 'yuv420p', `${outBase}.webm`]);
}

/** First frame of a rendered file → AVIF + WebP poster (+ tiny LQIP). */
async function posterFrom(videoFile, outBase, width) {
  const png = join(TMP, `${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  await ffmpeg(['-i', videoFile, '-frames:v', '1', png]);
  const img = sharp(png).resize({ width, withoutEnlargement: true });
  await img.clone().avif({ quality: 52, effort: 6 }).toFile(`${outBase}.avif`);
  await img.clone().webp({ quality: 74 }).toFile(`${outBase}.webp`);
  const lqipBuf = await sharp(png).resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  await rm(png, { force: true });
  return `data:image/webp;base64,${lqipBuf.toString('base64')}`;
}

// ── per-project previews ─────────────────────────────────────
async function buildWork(w, prev) {
  const src = join(RAW, w.source);
  if (!existsSync(src)) {
    console.warn(`  ! ${w.slug}: source not found (${w.source}) — skipped`);
    return prev ?? null;
  }
  const meta = await probe(src);
  const vertical = meta.height > meta.width;
  const dir = join(OUT, w.slug);
  await mkdir(dir, { recursive: true });
  const base = join(dir, 'preview');
  const pBase = join(dir, 'poster');
  const outs = [`${base}.mp4`, `${base}.webm`, `${pBase}.avif`, `${pBase}.webp`];

  if (prev && (await fresh(src, outs))) {
    console.log(`  = ${w.slug} (up to date)`);
    return prev;
  }

  const start = w.previewStart ?? round(meta.duration * 0.2, 1);
  const seconds = Math.min(PREVIEW_SECONDS, meta.duration - start);
  // 720p on the short side, even dimensions
  const vf = (vertical ? 'scale=720:-2' : 'scale=-2:720') + `,fps=${FPS},setsar=1`;

  process.stdout.write(`  → ${w.slug}: preview ${start}s–${round(start + seconds, 1)}s … `);
  await encodePair(['-ss', String(start), '-i', src], vf, base, { seconds });
  const lqip = await posterFrom(`${base}.mp4`, pBase, vertical ? 720 : 1280);
  const out = await probe(`${base}.mp4`);
  const sizes = { mp4: round(await mb(`${base}.mp4`)), webm: round(await mb(`${base}.webm`)) };
  console.log(`mp4 ${sizes.mp4}MB · webm ${sizes.webm}MB`);
  if (sizes.mp4 > MAX_MB || sizes.webm > MAX_MB) console.warn(`    ! over ${MAX_MB}MB budget`);

  return {
    width: out.width,
    height: out.height,
    aspect: vertical ? '9:16' : '16:9',
    duration: round(meta.duration, 1),
    durationLabel: fmtDur(meta.duration),
    preview: { mp4: `/media/${w.slug}/preview.mp4`, webm: `/media/${w.slug}/preview.webm` },
    poster: { avif: `/media/${w.slug}/poster.avif`, webp: `/media/${w.slug}/poster.webp` },
    lqip,
    sizesMB: sizes,
  };
}

// ── showreel ─────────────────────────────────────────────────
async function buildReel(works) {
  const dir = join(OUT, 'reel');
  await mkdir(dir, { recursive: true });

  // Two moments per clip, interleaved: A1 B1 C1 … A2 B2 C2 …
  const clips = [];
  for (const w of works) {
    const src = join(RAW, w.source);
    if (!existsSync(src)) continue;
    const meta = await probe(src);
    // A moment is a number (seconds) or { at, focusY } for a per-cut crop focus.
    const moments = (w.reelMoments ?? [0.3, 0.62].map((p) => round(meta.duration * p, 1))).map((m) =>
      typeof m === 'number' ? { at: m, focusY: w.reelFocusY ?? 0.4 } : { focusY: w.reelFocusY ?? 0.4, ...m },
    );
    clips.push({ w, src, meta, moments });
  }
  const segs = [];
  const rounds = Math.max(...clips.map((c) => c.moments.length));
  for (let r = 0; r < rounds; r++) for (const c of clips) if (c.moments[r] != null) segs.push({ ...c, ...c.moments[r] });
  const seconds = round(segs.length * CUT, 2);

  const variants = [
    { name: '16x9', W: 1280, H: 720, maxrate: '2500k', posterW: 1280 },
    { name: '9x16', W: 540, H: 960, maxrate: '1400k', posterW: 540 },
  ];
  const manifest = { segments: segs.map((s) => ({ slug: s.w.slug, at: s.at })), duration: seconds };

  for (const v of variants) {
    const target = v.W / v.H;
    const inputs = segs.flatMap((s) => ['-ss', String(s.at), '-t', String(CUT), '-i', s.src]);
    const chains = segs.map((s, i) => {
      const srcRatio = s.meta.width / s.meta.height;
      // Cover-crop to target aspect. Vertical-into-wide crops a horizontal band at focusY.
      let crop;
      if (srcRatio < target) {
        const fy = s.focusY;
        crop = `crop=iw:iw/${target}:0:(ih-iw/${target})*${fy}`;
      } else {
        crop = `crop=ih*${target}:ih:(iw-ih*${target})/2:0`;
      }
      return `[${i}:v]${crop},scale=${v.W}:${v.H}:flags=lanczos,fps=${FPS},setsar=1,format=yuv420p,trim=duration=${CUT},setpts=PTS-STARTPTS[s${i}]`;
    });
    const graph = `${chains.join(';')};${segs.map((_, i) => `[s${i}]`).join('')}concat=n=${segs.length}:v=1:a=0[v]`;
    const outBase = join(dir, `reel-${v.name}`);
    process.stdout.write(`  → reel ${v.name} (${segs.length} cuts × ${CUT}s = ${seconds}s) … `);
    await encodePair(inputs, graph, outBase, { seconds, maxrate: v.maxrate, filterComplex: true });
    const lqip = await posterFrom(`${outBase}.mp4`, join(dir, `poster-${v.name}`), v.posterW);
    const sizes = { mp4: round(await mb(`${outBase}.mp4`)), webm: round(await mb(`${outBase}.webm`)) };
    console.log(`mp4 ${sizes.mp4}MB · webm ${sizes.webm}MB`);
    manifest[v.name] = {
      width: v.W,
      height: v.H,
      mp4: `/media/reel/reel-${v.name}.mp4`,
      webm: `/media/reel/reel-${v.name}.webm`,
      poster: { avif: `/media/reel/poster-${v.name}.avif`, webp: `/media/reel/poster-${v.name}.webp` },
      lqip,
      sizesMB: sizes,
    };
  }
  return manifest;
}

// ── main ─────────────────────────────────────────────────────
const { works } = JSON.parse(await readFile(join(ROOT, 'src', 'data', 'works.json'), 'utf8'));
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : { works: {}, reel: null };
await mkdir(TMP, { recursive: true });

console.log('Video pipeline');
if (!REEL_ONLY) {
  for (const w of works) {
    if (ONLY && w.slug !== ONLY) continue;
    if (!w.source) continue;
    manifest.works[w.slug] = await buildWork(w, manifest.works[w.slug]);
  }
}
if (!ONLY) {
  const reelOuts = ['16x9', '9x16'].flatMap((n) => [`reel-${n}.mp4`, `reel-${n}.webm`].map((f) => join(OUT, 'reel', f)));
  const anyNewer = FORCE || REEL_ONLY || !manifest.reel || !reelOuts.every(existsSync);
  if (anyNewer) manifest.reel = await buildReel(works.filter((w) => w.source));
  else console.log('  = reel (up to date — use --reel to rebuild)');
}
// drop manifest entries for works that no longer exist
for (const slug of Object.keys(manifest.works)) if (!works.some((w) => w.slug === slug)) delete manifest.works[slug];

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest → ${MANIFEST.replace(ROOT, '.')}`);
