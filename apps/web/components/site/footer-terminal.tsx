"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A small terminal in the footer that ships one real project per loop: commit, deploy, live.
 * Commands type themselves, output appears after a beat. Paused off screen and in hidden tabs;
 * reduced motion shows one finished run.
 */

export interface Ship {
  title: string;
  slug: string;
  host: string;
}

const TYPE_MS = 32;
const OUT_MS = 380;
const HOLD_MS = 2600;
const TICK = 40;

type Line = { kind: "cmd" | "ok"; text: string };

function script(s: Ship): Line[] {
  return [
    { kind: "cmd", text: `git commit -m "ship: ${s.title}"` },
    { kind: "cmd", text: "deploy --prod" },
    { kind: "ok", text: `tests passed, live at ${s.host}` },
  ];
}

/** When each line starts, and when the whole run ends. */
function timeline(lines: Line[]) {
  let t = 0;
  const starts = lines.map((l) => {
    const start = t;
    t += l.kind === "cmd" ? l.text.length * TYPE_MS + 300 : OUT_MS;
    return start;
  });
  return { starts, end: t + HOLD_MS };
}

export function FooterTerminal({ ships }: { ships: Ship[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ i: 0, t: Number.MAX_SAFE_INTEGER });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setState(({ i, t }) => {
        const ship = ships[i];
        const { end } = timeline(script(ship));
        if (t === Number.MAX_SAFE_INTEGER || t + TICK >= end)
          return { i: (i + 1) % ships.length, t: 0 };
        return { i, t: t + TICK };
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [running, ships]);

  const ship = ships[state.i];
  const lines = script(ship);
  const { starts } = timeline(lines);
  const typing = lines.findIndex(
    (l, k) =>
      l.kind === "cmd" &&
      state.t >= starts[k] &&
      state.t < starts[k] + l.text.length * TYPE_MS,
  );

  return (
    <div
      ref={ref}
      className="flex min-h-[9.5rem] flex-1 flex-col overflow-hidden rounded-2xl border bg-card"
      aria-hidden
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="ml-2 font-mono text-[11px] text-subtle-foreground">
          ~/workshop
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-subtle-foreground">
          <span className="size-1.5 rounded-full bg-success" /> shipping
        </span>
      </div>
      {/* Absolutely placed: the terminal takes the space its column has left and never adds height. */}
      <div className="relative flex-1">
        <div className="absolute inset-0 space-y-1 overflow-hidden px-4 py-3 font-mono text-[12px] leading-relaxed">
          {lines.map((l, k) => {
            // Every line keeps its slot (hidden until its turn), so the box never changes height.
            const text =
              l.kind === "cmd"
                ? l.text.slice(
                    0,
                    Math.max(0, Math.floor((state.t - starts[k]) / TYPE_MS)),
                  )
                : l.text;
            return (
              <p
                key={k}
                className={cn("truncate", state.t < starts[k] && "invisible")}
              >
                {l.kind === "cmd" && (
                  <span className="text-brand-text">$ </span>
                )}
                {l.kind === "ok" && <span className="text-success">ok </span>}
                <span
                  className={
                    l.kind === "cmd"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {text}
                </span>
                {k === typing && <span className="loop-caret" />}
              </p>
            );
          })}
          <p className={cn(state.t < starts[starts.length - 1] && "invisible")}>
            <span className="text-brand-text">$ </span>
            <span className="loop-caret" />
          </p>
        </div>
      </div>
    </div>
  );
}
