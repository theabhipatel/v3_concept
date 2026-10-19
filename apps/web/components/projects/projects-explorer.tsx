"use client";

import { Bot, Briefcase, Layers, LayoutGrid, Monitor, Server, Smartphone, Sparkles } from "lucide-react";
import { useDeferredValue, useMemo } from "react";
import type { Project, ProjectCategory, ProjectType } from "@/lib/content";
import { useQueryParam } from "@/lib/use-query-param";
import { SlidingTabs, type Tab } from "./sliding-tabs";

type Category = "all" | ProjectCategory;
type TypeFilter = "all" | ProjectType;

const CATEGORIES: { id: Category; label: string; icon: Tab<Category>["icon"] }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "AI", label: "AI", icon: Bot },
  { id: "Full Stack", label: "Full Stack", icon: Layers },
  { id: "DevOps", label: "DevOps", icon: Server },
  { id: "Frontend", label: "Frontend", icon: Monitor },
  { id: "React Native", label: "Mobile", icon: Smartphone },
];
const TYPES: { id: TypeFilter; label: string; icon: Tab<TypeFilter>["icon"] }[] = [
  { id: "all", label: "All work", icon: LayoutGrid },
  { id: "personal", label: "Built for fun", icon: Sparkles },
  { id: "client", label: "Professional work", icon: Briefcase },
];
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
const TYPE_IDS = TYPES.map((t) => t.id);

const matches = (p: Project, c: string, t: string) => (c === "all" || p.categories.includes(c as ProjectCategory)) && (t === "all" || p.type === t);

/**
 * Filters a server-rendered grid of banners. Every banner is in the HTML (good for SEO).
 * The filtered list renders from a deferred value, so React runs it as a transition and the
 * banners' view transitions animate it: leaving ones fade out, staying ones glide into place.
 * Filters sync with ?category= and ?type= so ABI and shared links can open a filtered view.
 */
export function ProjectsExplorer({ projects, children }: { projects: Project[]; children: React.ReactNode[] }) {
  const [category, setCategory] = useQueryParam<Category>("category", "all", CATEGORY_IDS);
  const [type, setType] = useQueryParam<TypeFilter>("type", "all", TYPE_IDS);
  const filter = useDeferredValue(`${category}|${type}`);

  const visible = useMemo(() => {
    const [c, t] = filter.split("|");
    return projects.map((p) => matches(p, c, t));
  }, [projects, filter]);
  const count = visible.filter(Boolean).length;

  const typeTabs = TYPES.map((t) => ({ ...t, count: projects.filter((p) => matches(p, category, t.id)).length }));
  const categoryTabs = CATEGORIES.map((c) => ({ ...c, count: projects.filter((p) => matches(p, c.id, type)).length }));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SlidingTabs tabs={typeTabs} value={type} onChange={setType} label="Filter by type" target="projects-type" variant="brand" />
          <p className="text-sm text-subtle-foreground" aria-live="polite">
            Showing {count} {count === 1 ? "project" : "projects"}
          </p>
        </div>
        <SlidingTabs tabs={categoryTabs} value={category} onChange={setCategory} label="Filter by category" target="projects-category" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child, i) =>
          visible[i] ? (
            <li key={projects[i].slug} className="flex *:w-full">
              {child}
            </li>
          ) : null,
        )}
      </ul>
      {count === 0 && <p className="py-16 text-center text-muted-foreground">Nothing here yet. Try another filter, or ask ABI.</p>}
    </div>
  );
}
