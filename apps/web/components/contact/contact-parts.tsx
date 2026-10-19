"use client";

import { Inbox, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface Slot {
  day: string;
  time: string;
  available: boolean;
}

/** "9:00 AM - 6:00 PM IST" > [9, 18]; closed days > null. */
function hours(slot: Slot): [number, number] | null {
  const m = slot.time.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
  if (!slot.available || !m) return null;
  const h = (hh: string, mm: string, ap: string) => (Number(hh) % 12) + (ap.toUpperCase() === "PM" ? 12 : 0) + Number(mm) / 60;
  return [h(m[1], m[2], m[3]), h(m[4], m[5], m[6])];
}

/** One entry per weekday, from rows like "Monday - Friday". */
function week(slots: Slot[]) {
  return DAYS.map((day) => {
    const slot = slots.find((s) => {
      const [a, b] = s.day.split(/\s*-\s*/);
      const i = DAYS.indexOf(day);
      return b ? i >= DAYS.indexOf(a) && i <= DAYS.indexOf(b) : a === day;
    });
    return slot ? hours(slot) : null;
  });
}

/** The current weekday (0 = Monday) and hour in India. */
function nowInIndia() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { day: DAYS.indexOf(get("weekday")), hour: (Number(get("hour")) % 24) + Number(get("minute")) / 60 };
}

function useIndiaNow() {
  const [now, setNow] = useState<{ day: number; hour: number } | null>(null);
  useEffect(() => {
    const tick = () => setNow(nowInIndia());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** "Available now" with a live dot, or when he is back. */
export function AvailabilityBadge({ slots }: { slots: Slot[] }) {
  const now = useIndiaNow();
  const days = week(slots);
  const today = now ? days[now.day] : null;
  const open = !!(now && today && now.hour >= today[0] && now.hour < today[1]);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm backdrop-blur">
      <span className="relative flex size-2">
        {open && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />}
        <span className={cn("relative inline-flex size-2 rounded-full", open ? "bg-success" : "bg-brand")} />
      </span>
      {now ? (open ? "Available now, usually replies fast" : "Away right now, will reply soon") : "Replies within a day"}
    </span>
  );
}

/** The week as bars across the day (IST), with a marker at the current time. */
export function WeekChart({ slots }: { slots: Slot[] }) {
  const now = useIndiaNow();
  const days = week(slots);
  const pct = (h: number) => `${(h / 24) * 100}%`;
  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">When I&apos;m around</p>
        <p className="text-xs text-subtle-foreground">India time (IST)</p>
      </div>
      <ul className="mt-5 space-y-2.5">
        {days.map((h, i) => (
          <li key={DAYS[i]} className="grid grid-cols-[2.5rem_1fr] items-center gap-3 text-xs">
            <span className={cn("font-medium", now?.day === i ? "text-foreground" : "text-muted-foreground")}>{SHORT[i]}</span>
            <span className="relative h-2.5 rounded-full bg-muted">
              {h && (
                <span
                  className="week-bar absolute inset-y-0 rounded-full"
                  style={{ left: pct(h[0]), width: pct(h[1] - h[0]), "--i": i } as React.CSSProperties}
                />
              )}
              {now?.day === i && (
                <span className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground" style={{ left: pct(now.hour) }} title="Now" />
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-[2.5rem_1fr] gap-3 text-[10px] text-subtle-foreground">
        <span />
        <span className="flex justify-between">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </span>
      </div>
    </div>
  );
}

/**
 * A paper plane flies along a dashed route into the inbox, which bounces and counts one more
 * message. SVG motion, paused while off screen.
 */
export function PlaneScene() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.pauseAnimations();
      return;
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()));
    io.observe(svg);
    return () => io.disconnect();
  }, []);

  const route = "M30 190 C 110 190, 90 70, 190 90 S 300 170, 340 70";
  return (
    <div data-motion className="plane relative mx-auto w-full max-w-lg" aria-hidden>
      <svg ref={ref} viewBox="0 0 400 240" className="w-full overflow-visible">
        <path d={route} className="plane__route" fill="none" />
        <g>
          <foreignObject x="-14" y="-14" width="28" height="28">
            <div className="plane__icon grid size-7 place-items-center">
              <Send className="size-5" />
            </div>
          </foreignObject>
          <animateMotion dur="4s" repeatCount="indefinite" rotate="auto" path={route} keyPoints="0;1;1" keyTimes="0;0.75;1" calcMode="spline" keySplines="0.45 0 0.25 1; 0 0 1 1" />
          <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.08;0.7;0.76;1" dur="4s" repeatCount="indefinite" />
        </g>
      </svg>
      <div className="plane__inbox absolute right-[9%] top-[18%] grid size-14 place-items-center rounded-2xl border bg-card shadow-lg">
        <Inbox className="size-6 text-brand-text" />
        <span className="plane__count absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-brand text-[11px] font-bold text-on-brand">
          +1
        </span>
      </div>
      <div className="plane__from absolute bottom-[4%] left-0 rounded-2xl border bg-card px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold">You</p>
        <p className="text-muted-foreground">Hi Abhishek, ...</p>
      </div>
    </div>
  );
}
