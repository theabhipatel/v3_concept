import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AskAbi } from "@/components/abi/ask-abi";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/content";
import { cn } from "@/lib/utils";

export function ProjectCard({ project, priority = false, className }: { project: Project; priority?: boolean; className?: string }) {
  return (
    <article
      data-abi-target="project-card"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-(--duration-base) ease-out-expo hover:-translate-y-1 hover:border-border-strong hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={project.image}
          alt={`${project.title} screenshot`}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent" aria-hidden />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {project.categories.includes("AI") && <Badge tone="abi" className="backdrop-blur">AI</Badge>}
          <Badge className="bg-card/80 backdrop-blur">{project.type === "client" ? "Client work" : "Personal"}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="flex items-start justify-between gap-3 text-lg font-semibold">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-subtle-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1" aria-label="Tech stack">
          {project.tags.slice(0, 5).map((t) => (
            <li key={t} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <AskAbi
        prompt={`Tell me about the ${project.title} project`}
        className="absolute right-3 top-3 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
      />
    </article>
  );
}
