"use client";

import { useMemo } from "react";
import type { Project, ProjectCategory, ProjectType } from "@/lib/content";
import { useQueryParam } from "@/lib/use-query-param";
import { cn } from "@/lib/utils";

type Category = "all" | ProjectCategory;
type TypeFilter = "all" | ProjectType;

const CATEGORIES: Category[] = ["all", "AI", "Full Stack", "DevOps", "Frontend", "React Native"];
const TYPES: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All work" },
  { id: "client", label: "Client work" },
  { id: "personal", label: "Personal" },
];
const TYPE_IDS = TYPES.map((t) => t.id);

function Chip({ active, children, ...props }: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
        active ? "border-transparent bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Filters a server-rendered grid. All cards are in the HTML (good for SEO); filtering hides them.
 * Filters sync with ?category= and ?type= so ABI and shared links can open a filtered view.
 */
export function ProjectsExplorer({ projects, children }: { projects: Project[]; children: React.ReactNode[] }) {
  const [category, setCategory] = useQueryParam<Category>("category", "all", CATEGORIES);
  const [type, setType] = useQueryParam<TypeFilter>("type", "all", TYPE_IDS);

  const visible = useMemo(
    () =>
      projects.map(
        (p) => (category === "all" || p.categories.includes(category)) && (type === "all" || p.type === type),
      ),
    [projects, category, type],
  );
  const count = visible.filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)} data-abi-target={`projects-category-${c}`}>
              {c === "all" ? "All" : c}
            </Chip>
          ))}
        </div>
        <div className="flex gap-1 rounded-full border bg-card p-1" role="group" aria-label="Filter by type">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={type === t.id}
              data-abi-target={`projects-type-${t.id}`}
              onClick={() => setType(t.id)}
              className={cn(
                "min-h-9 rounded-full px-3.5 py-2 text-xs font-medium transition-colors",
                type === t.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <p className="font-mono text-xs text-subtle-foreground" aria-live="polite">
        {count} {count === 1 ? "project" : "projects"}
      </p>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child, i) => (
          <li key={projects[i].slug} hidden={!visible[i]} className="flex">
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
