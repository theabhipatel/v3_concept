"use client";

import { Fragment, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Text that "streams in" word by word like an AI answer, once, when it scrolls into view.
 * The full text is always in the HTML (SEO, no-JS); reduced motion shows it instantly.
 */
export function StreamedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: play now
    el.dataset.state = "idle";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.state = "play";
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(" ");
  return (
    <span ref={ref} className={cn("stream", className)}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="stream-w" style={{ "--i": i } as React.CSSProperties}>
            {word}
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </span>
  );
}
