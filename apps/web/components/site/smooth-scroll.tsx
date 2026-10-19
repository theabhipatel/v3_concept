"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

let lenis: Lenis | null = null;

/** The shared Lenis instance (null when reduced motion is on or before mount). */
export function getLenis() {
  return lenis;
}

/** Smoothly scroll to an element, through Lenis when it runs. */
export function scrollToElement(el: HTMLElement, offset = -96) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.1 });
  else {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.calm === "on";
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? "auto" : "smooth" });
  }
}

/** Let inner scroll areas (ABI chat, panels, dialogs) scroll themselves instead of the page. */
function isScrollable(node: HTMLElement) {
  if (node === document.documentElement || node === document.body) return false;
  const { overflowY } = getComputedStyle(node);
  return (overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight;
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.calm === "on") return;
    lenis = new Lenis({ autoRaf: true, lerp: 0.11, prevent: isScrollable });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
