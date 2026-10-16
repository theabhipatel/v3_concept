"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AskAbi } from "@/components/abi/ask-abi";
import type { Skill, SkillCategory } from "@/lib/content";
import { useQueryParam } from "@/lib/use-query-param";
import { cn } from "@/lib/utils";

const LEVELS = { Expert: 4, Advanced: 3, Intermediate: 2, Learning: 1 } as const;

function SkillIcon({ skill }: { skill: Skill }) {
  // Some brand icons are white-only; invert them in the light theme.
  const whiteOnly = /\/white$|\/dark\//.test(skill.icon);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={skill.icon}
      alt=""
      width={28}
      height={28}
      loading="lazy"
      decoding="async"
      className={cn("size-7 object-contain", whiteOnly && "invert dark:invert-0")}
    />
  );
}

export function SkillsExplorer({
  skills,
  categories,
}: {
  skills: Skill[];
  categories: { id: SkillCategory; label: string }[];
}) {
  const ids = useMemo(() => ["all", ...categories.map((c) => c.id.toLowerCase())], [categories]);
  const [category, setCategory] = useQueryParam<string>("category", "all", ids);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      categories
        .filter((c) => category === "all" || c.id.toLowerCase() === category)
        .map((c) => ({ ...c, skills: skills.filter((s) => s.category === c.id && (!q || s.name.toLowerCase().includes(q))) }))
        .filter((g) => g.skills.length),
    [categories, skills, category, q],
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ id: "all", label: "All" }, ...categories].map((c) => {
            const id = c.id.toLowerCase();
            return (
              <button
                key={id}
                type="button"
                aria-pressed={category === id}
                data-abi-target={`skills-category-${id}`}
                onClick={() => setCategory(id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
                  category === id ? "border-transparent bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <label className="flex h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm focus-within:ring-2 focus-within:ring-ring lg:w-64">
          <Search className="size-4 text-subtle-foreground" aria-hidden />
          <span className="sr-only">Search skills</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search skills" className="w-full bg-transparent outline-none placeholder:text-subtle-foreground" />
        </label>
      </div>

      {groups.map((g) => (
        <section key={g.id} id={g.id.toLowerCase()} aria-labelledby={`cat-${g.id}`} className="scroll-mt-28 space-y-4">
          <h2 id={`cat-${g.id}`} className="flex items-baseline gap-3 text-2xl font-semibold">
            {g.label}
            <span className="font-mono text-xs font-normal text-subtle-foreground">{g.skills.length}</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.skills.map((s) => (
              <li key={s.slug} className="group relative flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-border-strong">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted">
                  <SkillIcon skill={s} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.level} - {s.experience}
                  </p>
                  <div className="mt-2 flex gap-1" aria-label={`Proficiency: ${s.level}`} role="img">
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} className={cn("h-1 flex-1 rounded-full", n <= LEVELS[s.level] ? "bg-brand" : "bg-muted")} />
                    ))}
                  </div>
                </div>
                <AskAbi
                  prompt={`How has Abhishek used ${s.name} in real projects?`}
                  label="Ask"
                  className="absolute right-2 top-2 px-2 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!groups.length && <p className="text-muted-foreground">No skills match &quot;{query}&quot;. Try asking ABI instead.</p>}
    </div>
  );
}
