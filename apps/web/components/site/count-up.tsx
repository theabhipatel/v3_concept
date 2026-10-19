"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "20+" counts 0, 1, 2 ... 20 the first time it scrolls into view, keeping its suffix.
 * The real value is rendered on the server and stays put with reduced motion.
 */
export function CountUp({ value }: { value: string | number }) {
  const text = String(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const el = ref.current;
    const match = text.match(/^(\D*)(\d+)(.*)$/);
    if (!el || !match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, before, digits, after] = match;
    const target = Number(digits);
    let frame = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1200);
        setShown(`${before}${Math.round(target * (1 - Math.pow(1 - t, 3)))}${after}`);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}
