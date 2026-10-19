import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import type { Project } from "@/lib/content";
import { cn } from "@/lib/utils";

const PATTERNS = ["rings", "stripes", "dots", "arcs"] as const;

/** A stable tint and pattern per project, so each banner keeps its own look everywhere. */
export function bannerStyle(slug: string) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { tone: `var(--tone-${(h % 6) + 1})`, pattern: PATTERNS[(h >> 3) % PATTERNS.length] };
}

/** The first sentence of the description, for a one-line pitch. */
export function pitch(project: Project) {
  return project.description.split(/(?<=\.)\s/)[0];
}

/**
 * A designed name banner instead of a screenshot: the project's name set large on its own
 * tinted surface, with a pattern, a giant initial and the key facts. Hover lifts it and the
 * pattern drifts. `size="lg"` is the wide hero version.
 */
export function ProjectBanner({ project, size = "md", className }: { project: Project; size?: "md" | "lg"; className?: string }) {
  const { tone, pattern } = bannerStyle(project.slug);
  const lg = size === "lg";
  return (
    // Same name as the project page hero, so the banner grows into the page on navigation.
    <ViewTransition name={`banner-${project.slug}`} share="morph" enter="banner-in" exit="banner-out" update="banner-move" default="none">
      <Link
        href={`/projects/${project.slug}`}
        transitionTypes={["nav-forward"]}
        data-abi-target="project-card"
        className={cn("banner group", lg && "banner--lg", className)}
        style={{ "--tone": tone } as React.CSSProperties}
      >
        <span className={cn("banner__pattern", `banner__pattern--${pattern}`)} aria-hidden />
        <span className="banner__initial" aria-hidden>
          {project.title.replace(/^the/i, "").trim()[0]}
        </span>
        <span className="relative flex items-center gap-2 text-xs font-semibold">
          <span className="banner__tag">{project.type === "client" ? "Professional" : "Built for fun"}</span>
          <span className="truncate text-muted-foreground">{project.categories.join(" / ")}</span>
        </span>
        <span className="relative mt-auto block pt-10">
          <span className={cn("block font-display font-bold leading-[1.02] tracking-[-0.03em] text-balance", lg ? "text-4xl sm:text-5xl" : "text-3xl")}>
            {project.title}
          </span>
          <span className={cn("mt-3 block text-sm leading-relaxed text-muted-foreground", lg ? "max-w-xl sm:text-base" : "line-clamp-2")}>
            {pitch(project)}
          </span>
        </span>
        <span className="relative mt-5 flex items-end justify-between gap-3">
          <span className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, lg ? 5 : 3).map((t) => (
              <span key={t} className="banner__chip">
                {t}
              </span>
            ))}
          </span>
          <span className="banner__go" aria-hidden>
            <ArrowUpRight className="size-4" />
          </span>
        </span>
      </Link>
    </ViewTransition>
  );
}
