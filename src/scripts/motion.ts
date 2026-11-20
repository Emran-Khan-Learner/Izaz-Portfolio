/**
 * Scroll motion — lazy-loaded, desktop only.
 *
 * Loads GSAP + ScrollTrigger + Lenis ONLY when:
 *   - the viewer hasn't asked for reduced motion, and
 *   - it's a fine-pointer, ≥768px screen (touch devices keep native scroll),
 * and only after the page has loaded and gone idle, so none of it touches
 * LCP / TBT. Everything here is enhancement: the page is complete without it.
 */
type Win = Window & { __lenis?: { stop(): void; start(): void } };

const ok =
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches;

const idle = (cb: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 200);

async function boot() {
  const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('lenis'),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  // ── Smooth scroll (Lenis driven by GSAP's ticker) ────────────
  const lenis = new Lenis({ duration: 1.05, anchors: { offset: -72 }, autoRaf: false });
  (window as Win).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // ── Hero: subtle parallax on the reel as you scroll away ─────
  const hero = document.querySelector('.hero-reel');
  if (hero) {
    gsap.to(hero, {
      yPercent: 14,
      scale: 1.06,
      ease: 'none',
      scrollTrigger: { trigger: hero.parentElement, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  // ── Process: pinned timeline, playhead scrubs across the steps ─
  const section = document.querySelector<HTMLElement>('[data-process]');
  if (section) {
    const fill = section.querySelector<HTMLElement>('[data-process-fill]');
    const head = section.querySelector<HTMLElement>('[data-process-head]');
    const ruler = section.querySelector<HTMLElement>('[data-process-progress]');
    const steps = [...section.querySelectorAll<HTMLElement>('[data-step]')];
    if (fill && head && ruler && steps.length) {
      const setActive = (p: number) =>
        steps.forEach((s, i) => s.classList.toggle('is-active', p >= i / steps.length - 0.001));
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=130%',
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (st) => setActive(st.progress),
          },
        })
        .to(fill, { scaleX: 1, ease: 'none' }, 0)
        .to(head, { x: () => ruler.offsetWidth, ease: 'none' }, 0);
      setActive(0);
    }
  }

  // Layout can shift after fonts/posters settle
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

if (ok) {
  const go = () => idle(() => boot().catch(() => {}));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
}

export {};
