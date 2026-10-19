"use client";

import type { LucideIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface Tab<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  count: number;
}

/**
 * A row of filter tabs on one rail, with a lit indicator that glides to the active tab.
 * `brand` is the bold primary switch; `soft` is the quieter category rail. On phones the rail
 * scrolls sideways and keeps the active tab in view.
 */
export function SlidingTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  target,
  variant = "soft",
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  target: string;
  variant?: "brand" | "soft";
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = rail.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (active) setBox({ x: active.offsetLeft, w: active.offsetWidth });
      // Fade the edge that has more tabs hidden behind it.
      el.toggleAttribute("data-more-right", el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      el.toggleAttribute("data-more-left", el.scrollLeft > 4);
    };
    measure();
    // Glide only after the first placement, so the page does not open with a slide.
    const id = requestAnimationFrame(() => setReady(true));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [value]);

  // Keep the active tab in view inside the rail (sideways only, never scrolls the page).
  useLayoutEffect(() => {
    const el = rail.current;
    const active = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !active || el.scrollWidth <= el.clientWidth) return;
    const left = active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;
    el.scrollTo({ left, behavior: ready ? "smooth" : "instant" });
  }, [value, ready]);

  const brand = variant === "brand";
  return (
    <div
      ref={rail}
      role="group"
      aria-label={label}
      className={cn(
        "tabs relative flex max-w-full gap-1 overflow-x-auto rounded-2xl border p-1.5 backdrop-blur [scrollbar-width:none]",
        brand ? "tabs--brand bg-card/80" : "bg-card/60",
      )}
    >
      {box && (
        <span
          aria-hidden
          className={cn("tabs__glow absolute inset-y-1.5 left-0 rounded-xl", ready && "tabs__glow--move")}
          style={{ width: box.w, transform: `translateX(${box.x}px)` }}
        />
      )}
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={on}
            data-abi-target={`${target}-${t.id}`}
            onClick={() => onChange(t.id)}
            className={cn(
              "tabs__tab group relative flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors duration-300",
              on ? (brand ? "text-on-brand" : "text-foreground") : "text-muted-foreground hover:text-foreground",
              t.count === 0 && !on && "opacity-45",
            )}
          >
            <t.icon
              className={cn(
                "size-4 transition-[color,transform] duration-300 group-hover:scale-110",
                on ? (brand ? "text-on-brand" : "text-brand-text") : "text-subtle-foreground",
              )}
              aria-hidden
            />
            <span className="whitespace-nowrap">{t.label}</span>
            <span
              className={cn(
                "grid min-w-6 place-items-center rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums transition-colors duration-300",
                on ? (brand ? "bg-black/15 text-on-brand" : "bg-brand/15 text-brand-text") : "bg-muted text-subtle-foreground",
              )}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
