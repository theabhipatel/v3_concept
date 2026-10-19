"use client";

import { Check, Database, FileText, Hammer, LayoutTemplate, Lightbulb, Rocket, Server, Sparkles, UserRound, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bannerStyle } from "@/components/projects/project-banner";
import { cn } from "@/lib/utils";

/**
 * The hero: one real project goes from idea to live product on every loop.
 * Brief (the request types itself) > Plan (the architecture lights up) > Build (code streams,
 * checks pass) > Ship (the product goes live). Paused off screen and in hidden tabs; the first
 * render, no-JS and reduced motion show a finished build, so the picture always makes sense.
 */

export interface Build {
  slug: string;
  title: string;
  brief: string;
  from: string;
  plan: { icon: "ui" | "api" | "db" | "ai" | "flow" | "ops"; label: string }[];
  code: string[];
  host: string;
  tags: string[];
}

const ICONS = { ui: LayoutTemplate, api: Server, db: Database, ai: Sparkles, flow: Workflow, ops: Rocket };

const STEPS = [
  { label: "Brief", detail: "An idea arrives" },
  { label: "Plan", detail: "Shape the system" },
  { label: "Build", detail: "Write and test it" },
  { label: "Ship", detail: "Live for real users" },
];

/** Milliseconds on each step. */
const DURATIONS = [3200, 2600, 3400, 3800];
const TICK = 50;
const TYPE_MS = 30;
const CHECKS = ["Types", "Tests", "Container"];

interface Clock {
  step: number;
  elapsed: number;
  build: number;
}

function useLoop(stage: React.RefObject<HTMLElement | null>, count: number): Clock {
  const [clock, setClock] = useState<Clock>({ step: 3, elapsed: DURATIONS[3], build: 0 });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [stage]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setClock((c) => {
        const elapsed = c.elapsed + TICK;
        if (elapsed < DURATIONS[c.step]) return { ...c, elapsed };
        const step = (c.step + 1) % STEPS.length;
        return { step, elapsed: 0, build: step === 0 ? (c.build + 1) % count : c.build };
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [running, count]);

  return clock;
}

function Rail({ clock }: { clock: Clock }) {
  return (
    <ol className="grid grid-cols-4 gap-3 sm:gap-4">
      {STEPS.map((s, i) => {
        const fill = clock.step > i ? 1 : clock.step === i ? clock.elapsed / DURATIONS[i] : 0;
        const on = clock.step === i;
        return (
          <li key={s.label} className="min-w-0">
            <div className="h-[3px] overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(fill, 1) * 100}%` }} />
            </div>
            <p className={cn("mt-2.5 text-sm font-semibold transition-colors", on ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
            <p className="hidden text-xs text-subtle-foreground sm:block">{s.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}

function Node({
  icon: Icon,
  title,
  meta,
  active,
  shown,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta: string;
  active: boolean;
  shown: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "loop-node relative flex min-h-[17rem] flex-col rounded-2xl border bg-card p-4 transition-[border-color,box-shadow] duration-500",
        active && "loop-node--active",
        // Phones show only the current step, so the hero stays short.
        !shown && "max-lg:hidden",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg transition-colors",
            active ? "bg-brand text-on-brand" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto truncate font-mono text-[10.5px] text-subtle-foreground">{meta}</span>
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

/** The line between two steps; fills once the work reaches it, with a spark travelling along. */
function Link_({ on, moving }: { on: boolean; moving: boolean }) {
  return (
    <div className="loop-link relative hidden h-px self-center lg:block" data-on={on || undefined} aria-hidden>
      <span className="absolute inset-0 bg-border" />
      <span className="loop-link__fill absolute inset-0" />
      {moving && <span className="loop-link__spark absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-brand" />}
    </div>
  );
}

export function BuildLoop({ builds }: { builds: Build[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const clock = useLoop(stageRef, builds.length);
  const { step, elapsed } = clock;
  const b = builds[clock.build];
  const tone = bannerStyle(b.slug).tone;

  // Brief: the request types itself, then a short reply.
  const typed = step === 0 ? Math.min(b.brief.length, Math.floor(elapsed / TYPE_MS)) : b.brief.length;
  const replied = step > 0 || elapsed > b.brief.length * TYPE_MS + 400;
  // Plan: blocks light up one by one.
  const planned = step === 1 ? Math.min(b.plan.length, Math.floor(elapsed / 520) + 1) : step > 1 ? b.plan.length : 0;
  // Build: code lines appear, then the checks pass.
  const codeChars = b.code.join("\n").length;
  const written = step === 2 ? Math.min(codeChars, Math.floor((elapsed / 2200) * codeChars)) : step > 2 ? codeChars : 0;
  const checks = step === 2 ? Math.max(0, Math.min(CHECKS.length, Math.floor((elapsed - 2200) / 300) + 1)) : step > 2 ? CHECKS.length : 0;
  const progress = step === 2 ? Math.min(1, elapsed / 3000) : step > 2 ? 1 : 0;
  // Ship: the address types in and the product appears.
  const hostTyped = step === 3 ? Math.min(b.host.length, Math.floor(elapsed / 45)) : 0;
  const live = step === 3 && hostTyped === b.host.length;

  // Each line starts where the previous one ended (+1 for the newline).
  const starts = b.code.map((_, i) => b.code.slice(0, i).reduce((n, l) => n + l.length + 1, 0));
  const lines = b.code.map((line, i) => line.slice(0, Math.max(0, written - starts[i])));

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={`How Abhishek builds: a brief comes in, he plans the system, builds and tests it, and ships it live. Now showing ${b.title}.`}
      className="mx-auto max-w-6xl rounded-3xl border bg-background/70 p-4 shadow-lg backdrop-blur-sm sm:p-6"
      style={{ "--tone": tone } as React.CSSProperties}
    >
      <Rail clock={clock} />
      <div className="mt-6 grid items-stretch lg:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)]">
        <Node icon={FileText} title="The brief" meta={b.from} active={step === 0} shown={step === 0}>
          <div className="flex items-start gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              {b.from === "Client" ? <UserRound className="size-3.5" /> : <Lightbulb className="size-3.5" />}
            </span>
            <p className="min-h-[5.5rem] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-[13px] leading-snug">
              {b.brief.slice(0, typed)}
              {step === 0 && typed < b.brief.length && <span className="loop-caret" />}
            </p>
          </div>
          <p
            className={cn(
              "ml-auto mt-3 w-fit rounded-2xl rounded-tr-sm bg-brand px-3 py-1.5 text-[13px] font-medium text-on-brand transition-all duration-500",
              replied ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            On it. Here is the plan.
          </p>
          <p className="mt-auto pt-3 text-xs text-subtle-foreground">Project {clock.build + 1} of {builds.length}</p>
        </Node>

        <Link_ on={step >= 1} moving={step === 1 && elapsed < 900} />

        <Node icon={Workflow} title="The plan" meta="architecture" active={step === 1} shown={step === 1}>
          <ul className="grid grid-cols-2 gap-2">
            {b.plan.map((p, i) => {
              const Icon = ICONS[p.icon];
              const on = i < planned;
              return (
                <li
                  key={p.label}
                  className={cn(
                    "flex min-h-16 flex-col justify-between rounded-xl border p-2.5 text-[12px] font-medium transition-all duration-500",
                    on ? "loop-block--on" : "opacity-45",
                  )}
                >
                  <Icon className={cn("size-4 transition-colors", on ? "text-brand-text" : "text-subtle-foreground")} />
                  <span className="mt-2 leading-tight">{p.label}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", planned === b.plan.length ? "bg-success" : "bg-brand")} />
            {planned === b.plan.length ? "Plan ready" : step === 1 ? "Planning..." : "Waiting for a brief"}
          </p>
        </Node>

        <Link_ on={step >= 2} moving={step === 2 && elapsed < 900} />

        <Node icon={Hammer} title="The build" meta="main" active={step === 2} shown={step === 2}>
          <pre className="min-h-[6.6rem] overflow-hidden rounded-xl border bg-background-deep p-2.5 font-mono text-[10.5px] leading-[1.6]">
            {lines.map((l, i) => (
              <span key={i} className={cn("block truncate", l.trimStart().startsWith("//") || l.trimStart().startsWith("#") ? "text-subtle-foreground" : "")}>
                {l || " "}
              </span>
            ))}
          </pre>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px]">
            {CHECKS.map((c, i) => (
              <li key={c} className={cn("flex items-center gap-1 transition-colors", i < checks ? "text-foreground" : "text-subtle-foreground")}>
                <span className={cn("grid size-3.5 place-items-center rounded-full transition-colors", i < checks ? "bg-success text-background" : "border")}>
                  {i < checks && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </Node>

        <Link_ on={step >= 3} moving={step === 3 && elapsed < 900} />

        <Node icon={Rocket} title="Shipped" meta={live ? "live" : step === 3 ? "deploying" : "up next"} active={step === 3} shown={step === 3}>
          <div className={cn("overflow-hidden rounded-xl border bg-background-deep transition-opacity duration-500", step < 3 && "opacity-40")}>
            <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
              <span className="size-1.5 rounded-full bg-border-strong" />
              <span className="size-1.5 rounded-full bg-border-strong" />
              <span className="ml-1 min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {step === 3 ? b.host.slice(0, hostTyped) : ""}
              </span>
            </div>
            <div className={cn("loop-ship relative h-[6.2rem] overflow-hidden p-3", live && "loop-ship--live")}>
              <span className="loop-ship__glow absolute inset-0" aria-hidden />
              <span className="relative block font-display text-xl font-bold leading-tight tracking-tight">{b.title}</span>
              <span className="relative mt-2 flex flex-wrap gap-1">
                {b.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full border bg-card/70 px-1.5 py-px text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </span>
            </div>
          </div>
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium">
            <span className={cn("size-1.5 rounded-full", live ? "bg-success" : step === 3 ? "bg-brand" : "bg-border-strong")} />
            {live ? "Live for real users" : step === 3 ? "Deploying..." : "Waiting for the build"}
          </p>
        </Node>
      </div>
    </div>
  );
}
