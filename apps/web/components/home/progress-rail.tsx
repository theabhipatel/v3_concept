"use client";

import { useEffect, useState } from "react";
import { scrollToElement } from "@/components/site/smooth-scroll";
import { cn } from "@/lib/utils";

export const STAGES = [
  { id: "prompt", label: "Prompt" },
  { id: "retrieve", label: "Retrieve" },
  { id: "reason", label: "Reason" },
  { id: "act", label: "Act" },
  { id: "deliver", label: "Deliver" },
];

/** Thin rail showing the current pipeline stage on the home page. */
export function ProgressRail() {
  const [active, setActive] = useState("prompt");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    STAGES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const index = STAGES.findIndex((s) => s.id === active);

  return (
    <nav aria-label="Pipeline stages" className="fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
      <ol className="relative space-y-5">
        <span className="absolute left-[5px] top-1 h-[calc(100%-8px)] w-px bg-border" aria-hidden />
        <span
          className="absolute left-[5px] top-1 w-px bg-(image:--gradient-brand) transition-[height] duration-(--duration-slow) ease-out-expo"
          style={{ height: `calc(${(index / (STAGES.length - 1)) * 100}% - 8px)` }}
          aria-hidden
        />
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(s.id);
                if (el) scrollToElement(el, 0);
              }}
              aria-current={active === s.id ? "step" : undefined}
              className="group relative flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest"
            >
              <span
                className={cn(
                  "size-[11px] rounded-full border-2 transition-colors duration-(--duration-base)",
                  i <= index ? "border-brand bg-brand" : "border-border-strong bg-background",
                  active === s.id && "shadow-glow",
                )}
              />
              <span className={cn("transition-colors", active === s.id ? "text-foreground" : "text-subtle-foreground group-hover:text-muted-foreground")}>
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
