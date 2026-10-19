"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One observer for the whole site, re-scanned on every page:
 * - `data-reveal` elements fade and rise in once, when they scroll into view
 *   (`data-reveal="scale"` grows in instead; `--d` staggers siblings).
 * - `data-motion` elements get `data-inview` while on screen. CSS pauses every animation inside
 *   them otherwise, so looping illustrations never run off screen or in a hidden tab.
 * - `data-count` numbers count up from zero the first time they are seen.
 * Without JavaScript or with reduced motion, everything is simply shown (see site.css).
 */
export function MotionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.dataset.shown = "";
          if (el.dataset.count !== undefined && !reduced) countUp(el);
          reveal.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const motion = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.target as HTMLElement).toggleAttribute("data-inview", e.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown]), [data-count]:not([data-shown])").forEach((el) => reveal.observe(el));
      document.querySelectorAll<HTMLElement>("[data-motion]").forEach((el) => motion.observe(el));
    };
    // After hydration has settled (attributes added earlier would not match the server HTML),
    // and again a moment later for sections that stream in.
    const first = requestAnimationFrame(() => requestAnimationFrame(scan));
    const late = window.setTimeout(scan, 600);

    return () => {
      cancelAnimationFrame(first);
      window.clearTimeout(late);
      reveal.disconnect();
      motion.disconnect();
    };
  }, [pathname]);

  return null;
}

/** "20+" counts 0, 1, 2 ... 20 and keeps its suffix. */
function countUp(el: HTMLElement) {
  const match = (el.dataset.count || el.textContent || "").match(/^(\D*)(\d+)(.*)$/);
  if (!match) return;
  const [, before, digits, after] = match;
  const target = Number(digits);
  const start = performance.now();
  const duration = 1200;
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${before}${Math.round(target * eased)}${after}`;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
