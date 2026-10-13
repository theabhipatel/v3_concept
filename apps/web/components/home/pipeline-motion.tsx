"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/site/smooth-scroll";

/**
 * Scroll-driven motion for the home pipeline (GSAP ScrollTrigger, loaded on the home page only).
 * - [data-reveal]: fades/slides in, staggered per stage.
 * - [data-chunk]: "retrieved" cards fly in from scattered positions into the grid.
 * - [data-draw]: SVG paths draw themselves (reasoning links).
 * - [data-packet]: a glowing data packet travels down the pipeline spine.
 * Content is visible without JS; reduced motion skips all of it.
 */
export function PipelineMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = getLenis();
      const onLenis = () => ScrollTrigger.update();
      lenis?.on("scroll", onLenis);

      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-stage]").forEach((stage) => {
          const items = stage.querySelectorAll("[data-reveal]");
          if (items.length)
            gsap.from(items, {
              y: 48,
              opacity: 0,
              duration: 0.9,
              ease: "expo.out",
              stagger: 0.08,
              scrollTrigger: { trigger: stage, start: "top 75%", once: true },
            });
        });

        const chunks = gsap.utils.toArray<HTMLElement>("[data-chunk]");
        chunks.forEach((el, i) => {
          gsap.from(el, {
            x: (i % 2 ? 1 : -1) * (120 + (i * 37) % 120),
            y: 80 + ((i * 53) % 90),
            rotate: (i % 2 ? 1 : -1) * 6,
            opacity: 0,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 95%", end: "top 60%", scrub: 0.8 },
          });
        });

        gsap.utils.toArray<SVGPathElement>("[data-draw]").forEach((path) => {
          const len = path.getTotalLength();
          gsap.fromTo(
            path,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: path.closest("[data-stage]"), start: "top 70%", end: "center 50%", scrub: true } },
          );
        });

        const packet = document.querySelector<HTMLElement>("[data-packet]");
        const spine = document.querySelector<HTMLElement>("[data-spine]");
        if (packet && spine) {
          gsap.fromTo(
            packet,
            { y: 0 },
            { y: () => spine.offsetHeight - 16, ease: "none", scrollTrigger: { trigger: spine, start: "top 55%", end: "bottom 55%", scrub: 0.6 } },
          );
        }
      });

      cleanup = () => {
        lenis?.off("scroll", onLenis);
        ctx.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
