"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One observer for the whole site, re-scanned on every page:
 * - `data-reveal` elements fade and rise in once, when they scroll into view
 *   (`data-reveal="scale"` grows in instead; `--d` staggers siblings).
 * - `data-motion` elements get `data-inview` while on screen. CSS pauses every animation inside
 *   them otherwise, so looping illustrations never run off screen or in a hidden tab.
 * Without JavaScript or with reduced motion, everything is simply shown (see site.css).
 */
export function MotionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.dataset.shown = "";
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
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])").forEach((el) => reveal.observe(el));
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
