"use client";

import { LayoutGrid, Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState, ViewTransition } from "react";
import { AskAbi } from "@/components/abi/ask-abi";
import { SlidingTabs } from "@/components/projects/sliding-tabs";
import type { Skill, SkillCategory } from "@/lib/content";
import { useQueryParam } from "@/lib/use-query-param";
import { cn } from "@/lib/utils";
import { CATEGORY_META, LEVEL_ORDER, logoClass, toneOf } from "./skill-meta";

/**
 * One skill: its logo inside a softly glowing ring that draws itself as the card scrolls in,
 * the name, years and level. On a mouse, the card tilts toward the pointer under a soft spotlight.
 */
function SkillCard({ skill }: { skill: Skill }) {
  return (
    <ViewTransition name={`skill-${skill.slug}`} enter="banner-in" exit="banner-out" update="banner-move" default="none">
      <li className="skill group relative" style={{ "--tone": toneOf(skill.category) } as React.CSSProperties}>
        <div className="skill__card relative flex h-full flex-col items-center overflow-hidden rounded-3xl border bg-card px-4 pb-5 pt-6 text-center">
          <span className="skill__spot pointer-events-none absolute inset-0" aria-hidden />
          <span className="skill__ring relative grid size-20 place-items-center">
            <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="40" cy="40" r="36" pathLength={100} className="skill__track" />
              <circle cx="40" cy="40" r="36" pathLength={100} className="skill__arc" />
            </svg>
            <span className="skill__logo grid size-13 place-items-center rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={skill.icon}
                alt=""
                width={30}
                height={30}
                loading="lazy"
                decoding="async"
                className={cn("size-7.5 object-contain", logoClass(skill))}
              />
            </span>
          </span>
          <p className="mt-4 text-[15px] font-bold leading-tight">{skill.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{skill.experience}</p>
          <p className={cn("skill__level mt-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", skill.level === "Expert" && "skill__level--top")}>
            {skill.level}
          </p>
          <AskAbi
            prompt={`How has Abhishek used ${skill.name} in real projects?`}
            label="Ask"
            className="absolute right-2.5 top-2.5 px-2 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
          />
        </div>
      </li>
    </ViewTransition>
  );
}

/** Tilt and spotlight follow the pointer (mouse only), written to CSS variables in one frame. */
function usePointerTilt() {
  const frame = useRef(0);
  return (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const card = (e.target as HTMLElement).closest<HTMLElement>(".skill");
    if (!card) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
      card.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    });
  };
}

export function SkillsExplorer({ skills, categories }: { skills: Skill[]; categories: { id: SkillCategory; label: string }[] }) {
  const ids = useMemo(() => ["all", ...categories.map((c) => c.id.toLowerCase())], [categories]);
  const [category, setCategory] = useQueryParam<string>("category", "all", ids);
  const [query, setQuery] = useState("");
  const filter = useDeferredValue(`${category}|${query.trim().toLowerCase()}`);
  const tilt = usePointerTilt();

  const groups = useMemo(() => {
    const [c, q] = filter.split("|");
    return categories
      .filter((cat) => c === "all" || cat.id.toLowerCase() === c)
      .map((cat) => ({
        ...cat,
        skills: skills
          .filter((s) => s.category === cat.id && (!q || s.name.toLowerCase().includes(q)))
          .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]),
      }))
      .filter((g) => g.skills.length);
  }, [categories, skills, filter]);

  const q = query.trim().toLowerCase();
  const tabs = [
    { id: "all", label: "All", icon: LayoutGrid, count: skills.filter((s) => !q || s.name.toLowerCase().includes(q)).length },
    ...categories.map((c) => ({
      id: c.id.toLowerCase(),
      label: c.label,
      icon: CATEGORY_META[c.id].icon,
      count: skills.filter((s) => s.category === c.id && (!q || s.name.toLowerCase().includes(q))).length,
    })),
  ];

  return (
    <div className="space-y-12">
      <div className="sticky top-3 z-30 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SlidingTabs tabs={tabs} value={category} onChange={setCategory} label="Filter by category" target="skills-category" />
        </div>
        <label className="flex h-[3.4rem] items-center gap-2 rounded-2xl border bg-card/80 px-4 text-sm backdrop-blur focus-within:border-ring lg:w-64">
          <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
          <span className="sr-only">Search skills</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${skills.length} tools...`}
            className="w-full min-w-0 bg-transparent outline-none placeholder:text-subtle-foreground"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="grid size-7 place-items-center rounded-lg hover:bg-muted" aria-label="Clear search">
              <X className="size-3.5" />
            </button>
          )}
        </label>
      </div>

      {groups.map((g) => {
        const Icon = CATEGORY_META[g.id].icon;
        return (
          <ViewTransition key={g.id} name={`skill-group-${g.id}`} enter="banner-in" exit="banner-out" update="banner-move" default="none">
            <section id={g.id.toLowerCase()} aria-labelledby={`cat-${g.id}`} className="scroll-mt-28" style={{ "--tone": toneOf(g.id) } as React.CSSProperties}>
              <div className="flex items-center gap-3">
                <span className="skill-group__icon grid size-10 place-items-center rounded-xl">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 id={`cat-${g.id}`} className="text-2xl font-bold tracking-tight">
                  {g.label}
                </h2>
                <span className="text-sm text-subtle-foreground">{g.skills.length}</span>
                <span className="skill-group__line ml-2 h-px flex-1" aria-hidden />
              </div>
              <ul onPointerMove={tilt} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {g.skills.map((s) => (
                  <SkillCard key={s.slug} skill={s} />
                ))}
              </ul>
            </section>
          </ViewTransition>
        );
      })}
      {!groups.length && <p className="py-16 text-center text-muted-foreground">No skills match &quot;{query}&quot;. Try asking ABI instead.</p>}
    </div>
  );
}
