# Video editor portfolio

A fast, static portfolio site: Astro + Tailwind, self-hosted fonts, and an FFmpeg pipeline that turns raw edits into tiny preview loops.

- **Home** `/`: hero showreel, selected work, services, process, tools, contact
- **Archive** `/work`: every project, with category filters
- **Case studies** `/work/<slug>`: one page per project, generated automatically
- **404**: "Clip offline"

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
```

Requirements: Node 20+, and FFmpeg on your PATH (only needed for `npm run media`).

> **Windows note:** if `npm run dev` or `npm run build` crashes with *"An Application Control policy has blocked this file"*, run `npm run fix:win` once after `npm install`. It installs a WebAssembly fallback for one of Astro's native modules. Vercel doesn't need it.

---

## Fill in your details

Everything personal lives in two files:

| File | What goes in it |
|---|---|
| `src/data/site.mjs` | Name, brand name, role, **domain**, email, Calendly, Formspree ID, social links, analytics |
| `src/data/content.ts` | Stats, client logos, testimonials, about text, Raw-vs-Edited clips, services, process, tools |

### Placeholders never ship
Anything still marked `placeholder: true` in `content.ts`, and any empty value in `site.mjs` (email, Calendly, a social link…), is:

- **shown in dev** with an orange `PLACEHOLDER` tag, so you can see what's missing;
- **removed from the production build** completely, along with any nav link to it.

When the content is real, set `placeholder: false` (or delete the key).

---

## Add a new video

1. **Drop the source file** into `raw-videos/`. This folder is git-ignored and never uploaded.
2. **Add an entry** to `src/data/works.json` (order in the file = order on the site):

   ```json
   {
     "slug": "my-new-edit",
     "title": "How We Grew to 1M Subs",
     "client": "Channel Name",
     "category": "long-form",
     "aspect": "16:9",
     "source": "my new edit.mp4",
     "video": { "type": "youtube", "url": "https://youtu.be/XXXXXXXXXXX", "owner": "client" },
     "views": "1.2M views",
     "featured": true,
     "year": "2026",
     "caseStudy": {
       "goal": "What the client needed, in a sentence or two.",
       "did": ["Story restructure", "Sound design", "Animated captions"],
       "results": ["+38% average view duration", "1.2M views in 30 days"]
     }
   }
   ```

   | Field | Notes |
   |---|---|
   | `slug` | URL + media folder name: lowercase, dashes |
   | `category` | `long-form` · `talking-head` · `podcast` · `motion` · `short-form` |
   | `aspect` | `16:9` or `9:16` (sets the card and player shape) |
   | `video` | YouTube: `{ "type": "youtube", "url": "…" }`. Any YouTube link works: watch, youtu.be, Shorts, or a bare ID in `"id"`. `owner` is `client` or `own` (unlisted). Direct file (Bunny Stream, Vimeo file URL, MP4): `{ "type": "url", "src": "https://…" }` |
   | `views` | Optional. Shown on the card when filled |
   | `featured` | `true` = shown on the home page; everything appears in `/work` |
   | `caseStudy` | Optional. Empty blocks are hidden in production |
   | `previewStart` | Optional. Second where the 7s preview loop starts (default: 20% in) |
   | `reelMoments` | Optional. Moments used in the showreel, e.g. `[8, { "at": 31, "focusY": 0.1 }]`. `focusY` (0–1) picks which part of a vertical clip stays in a 16:9 crop (≈0.1 keeps a face in frame) |

3. **Generate the media:**

   ```bash
   npm run media            # only builds what's new or changed
   npm run media -- --reel  # rebuild the hero showreel too
   ```

   This creates, in `public/media/<slug>/`: a 7-second muted preview (MP4 + WebM, under 2MB each), poster images (AVIF + WebP, full + card size), and a blur placeholder. It also updates `src/data/media.json`. Don't edit that file by hand.

4. Check it with `npm run dev`, then commit `works.json`, `media.json` and the new `public/media/<slug>/` folder.

Other media commands: `npm run media -- --force` rebuilds everything; `npm run media -- --only <slug>` rebuilds one project.

---

## Other scripts

| Command | What it does |
|---|---|
| `npm run og` | Re-renders the social share image `public/og.jpg` (run after changing your name or the showreel) |
| `npm run icons` | Re-renders the favicon set from `public/favicon.svg` |
| `npm run grain` | Re-renders the film-grain tile `public/grain.png` |
| `npm run fonts:subset` | Re-subsets the fonts to Latin and weights 400–600 (needs Python + `pip install fonttools brotli`). Only needed for other characters or weights |

---

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. It detects Astro; keep the defaults (`npm run build`, output `dist`).
3. Set your real domain in `src/data/site.mjs` (`url`). It's used for canonical links, the sitemap and social previews. Then run `npm run og` and push.
4. Add the domain under **Project → Settings → Domains**.

`vercel.json` already sets long-term caching for fonts, media and built assets, plus basic security headers.

### Contact form
Create a free form at [formspree.io](https://formspree.io), copy the ID from its endpoint (`https://formspree.io/f/THIS_PART`) into `formspreeId` in `site.mjs`. Until then the form is hidden in production.

### Analytics (optional, privacy-friendly)
In `site.mjs → analytics`: set `plausibleDomain` to your domain for Plausible, **or** set `vercel: true` and enable Web Analytics in the Vercel dashboard.

---

## Performance notes

- **JavaScript:** about 6KB gzipped on first load. GSAP, ScrollTrigger and Lenis (~50KB) load only on desktop, after the page is idle, and never on touch devices or with reduced motion.
- **LCP:** the hero image is a preloaded AVIF poster. The showreel video starts after load (on phones, after the first touch or scroll, or 3.5s).
- **Previews:** card previews play on hover (desktop) or one at a time in view (touch, after the first scroll), never under reduced motion or Save-Data.
- **Reduced motion:** with `prefers-reduced-motion`, all motion is off, and the site works without JavaScript.
