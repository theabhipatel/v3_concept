"use client";

import { ArrowUpRight, Calendar, Check, ExternalLink, GitFork, Loader2, Send, Star, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { sendContactMessage } from "@/app/contact/actions";
import { GithubIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { experience, getProject, skillCategories, skills, type Project } from "@/lib/content";
import { cn } from "@/lib/utils";
import { send } from "../runtime";

const shell = "rounded-2xl border bg-card p-4 shadow-sm";

function known(slugs: unknown): Project[] {
  return (Array.isArray(slugs) ? slugs : []).map((s) => getProject(String(s))).filter(Boolean) as Project[];
}

export function ProjectCards({ slugs }: { slugs: unknown }) {
  const list = known(slugs);
  if (!list.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {list.map((p) => (
        <Link
          key={p.slug}
          href={`/projects/${p.slug}`}
          className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors hover:border-border-strong"
        >
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            <Image src={p.image} alt="" fill sizes="220px" className="object-cover transition-transform duration-(--duration-slow) group-hover:scale-105" />
          </div>
          <div className="space-y-1 p-3">
            <p className="flex items-center justify-between gap-2 text-sm font-semibold">
              {p.title}
              <ArrowUpRight className="size-3.5 text-subtle-foreground" aria-hidden />
            </p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CompareTable({ slugs }: { slugs: unknown }) {
  const list = known(slugs);
  if (list.length < 2) return <ProjectCards slugs={slugs} />;
  const rows: [string, (p: Project) => React.ReactNode][] = [
    ["Type", (p) => (p.type === "client" ? "Client work" : "Personal")],
    ["Focus", (p) => p.categories.join(", ")],
    ["Stack", (p) => p.tags.join(", ")],
    ["Summary", (p) => p.description.split(". ")[0] + "."],
    ["Links", (p) => (
      <span className="flex flex-col gap-1">
        {p.demo && <a href={p.demo} target="_blank" rel="noopener noreferrer" className="text-brand-text underline">Live</a>}
        {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-brand-text underline">Code</a>}
        <Link href={`/projects/${p.slug}`} className="text-brand-text underline">Details</Link>
      </span>
    )],
  ];
  return (
    <div className={cn(shell, "overflow-x-auto p-0")}>
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            <th className="p-3 font-mono font-medium uppercase tracking-wider text-subtle-foreground">Compare</th>
            {list.map((p) => (
              <th key={p.slug} className="p-3 text-sm font-semibold">{p.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, render]) => (
            <tr key={label} className="border-b last:border-0 align-top">
              <th className="p-3 font-mono text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">{label}</th>
              {list.map((p) => (
                <td key={p.slug} className="p-3 text-muted-foreground">{render(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LEVEL = { Expert: 100, Advanced: 75, Intermediate: 50, Learning: 25 } as const;

export function SkillsChart({ category }: { category: unknown }) {
  const cat = String(category ?? "all");
  if (cat === "all") {
    return (
      <div className={cn(shell, "space-y-2.5")}>
        <p className="font-mono text-[11px] uppercase tracking-widest text-subtle-foreground">Skills by area</p>
        {skillCategories.map((c) => {
          const list = skills.filter((s) => s.category === c.id);
          const expert = list.filter((s) => s.level === "Expert").length;
          return (
            <div key={c.id} className="grid grid-cols-[92px_1fr_auto] items-center gap-3 text-xs">
              <span className="font-medium">{c.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-(image:--gradient-brand)" style={{ width: `${(list.length / 14) * 100}%` }} />
              </span>
              <span className="text-muted-foreground">{list.length} ({expert} expert)</span>
            </div>
          );
        })}
      </div>
    );
  }
  const list = skills.filter((s) => s.category.toLowerCase() === cat.toLowerCase());
  return (
    <div className={cn(shell, "space-y-2.5")}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-subtle-foreground">
        {skillCategories.find((c) => c.id.toLowerCase() === cat.toLowerCase())?.label ?? cat} skills
      </p>
      {list.map((s) => (
        <div key={s.slug} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate font-medium">{s.name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-(image:--gradient-brand)" style={{ width: `${LEVEL[s.level]}%` }} />
          </span>
          <span className="text-muted-foreground">{s.level}</span>
        </div>
      ))}
    </div>
  );
}

export function Timeline() {
  return (
    <ol className={cn(shell, "space-y-4")}>
      {experience.map((e) => (
        <li key={e.slug} className="relative border-l-2 border-border pl-4">
          <span className={cn("absolute -left-[7px] top-1 size-3 rounded-full border-2 border-card", e.current ? "bg-abi" : "bg-brand")} />
          <p className="font-mono text-[11px] uppercase tracking-wider text-subtle-foreground">{e.period}</p>
          <p className="text-sm font-semibold">{e.role} <span className="font-normal text-muted-foreground">at {e.company}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>
        </li>
      ))}
    </ol>
  );
}

interface GithubData {
  profile: string;
  publicRepos: number;
  followers: number;
  stars: number;
  topLanguages: string[];
  recent: { name: string; url: string; description: string; pushedAt: string }[];
}

export function GithubCard({ data }: { data: GithubData }) {
  return (
    <div className={cn(shell, "space-y-3")}>
      <a href={data.profile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold hover:underline">
        <GithubIcon className="size-4" /> github.com/theabhipatel
        <Badge tone="abi" className="ml-auto">live</Badge>
      </a>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Repos", data.publicRepos, GitFork],
          ["Stars", data.stars, Star],
          ["Followers", data.followers, Check],
        ].map(([label, value, Icon]) => {
          const I = Icon as typeof Star;
          return (
            <div key={label as string} className="rounded-xl bg-muted p-2">
              <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><I className="size-3" aria-hidden />{label as string}</dt>
              <dd className="font-display text-lg font-semibold">{value as number}</dd>
            </div>
          );
        })}
      </dl>
      <p className="text-xs text-muted-foreground">Top languages: {data.topLanguages.join(", ")}</p>
      <ul className="space-y-1.5">
        {data.recent.map((r) => (
          <li key={r.name} className="text-xs">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-text hover:underline">{r.name}</a>
            <span className="text-subtle-foreground"> - updated {r.pushedAt}</span>
            {r.description && <p className="line-clamp-1 text-muted-foreground">{r.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CodeCard({ data }: { data: { repo: string; path: string; url: string; code: string; truncated: boolean } }) {
  return (
    <figure className="overflow-hidden rounded-2xl border bg-background-deep shadow-sm">
      <figcaption className="flex items-center gap-2 border-b px-3 py-2 font-mono text-[11px] text-muted-foreground">
        <GithubIcon className="size-3.5" />
        <span className="truncate">{data.repo}/{data.path}</span>
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-brand-text hover:underline">
          Open <ExternalLink className="size-3" aria-hidden />
        </a>
      </figcaption>
      <pre className="max-h-80 overflow-auto p-3 font-mono text-[11.5px] leading-relaxed text-foreground">
        <code>{data.code}</code>
      </pre>
      {data.truncated && <p className="border-t px-3 py-1.5 text-[11px] text-subtle-foreground">First 60 lines shown.</p>}
    </figure>
  );
}

interface JdData {
  score?: number;
  summary?: string;
  strengths?: { point: string; evidence: string }[];
  projects?: string[];
  experience?: string[];
  gaps?: string[];
}

export function JdMatchCard({ data }: { data: JdData }) {
  const score = Math.max(0, Math.min(100, Number(data.score) || 0));
  const circumference = 2 * Math.PI * 26;
  return (
    <div className={cn(shell, "space-y-4")}>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--muted)" strokeWidth="7" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--abi)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
        </svg>
        <div>
          <p className="font-display text-2xl font-semibold">{score}% fit</p>
          <p className="text-xs text-muted-foreground">{data.summary}</p>
        </div>
      </div>
      {!!data.strengths?.length && (
        <ul className="space-y-2">
          {data.strengths.map((s) => (
            <li key={s.point} className="flex gap-2 text-xs">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
              <span><span className="font-medium text-foreground">{s.point}.</span> <span className="text-muted-foreground">{s.evidence}</span></span>
            </li>
          ))}
        </ul>
      )}
      {!!data.projects?.length && <ProjectCards slugs={data.projects} />}
      {!!data.gaps?.length && (
        <div className="rounded-xl bg-muted p-3 text-xs">
          <p className="mb-1 flex items-center gap-1 font-medium"><TriangleAlert className="size-3.5" aria-hidden /> Not shown in his public data</p>
          <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">{data.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      )}
      <Button size="sm" variant="abi" onClick={() => void send("Create a tailored resume for the job description I shared.")}>
        Generate a tailored resume
      </Button>
    </div>
  );
}

export interface ResumeData {
  headline?: string;
  summary?: string;
  skills?: string[];
  experience?: { slug: string; bullets: string[] }[];
  projects?: string[];
}

export function ResumeCard({ data }: { data: ResumeData }) {
  const open = () => {
    try {
      sessionStorage.setItem("abi-resume", JSON.stringify(data));
    } catch {}
    window.open("/resume", "_blank");
  };
  return (
    <div className={cn(shell, "space-y-3")}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-subtle-foreground">Tailored resume</p>
      <p className="font-display text-lg font-semibold">{data.headline}</p>
      <p className="text-xs text-muted-foreground">{data.summary}</p>
      <div className="flex flex-wrap gap-1.5">{data.skills?.slice(0, 10).map((s) => <Badge key={s}>{s}</Badge>)}</div>
      <Button size="sm" onClick={open}>Open and download PDF</Button>
    </div>
  );
}

export function BookCard({ data }: { data: { url: string; label: string } }) {
  const external = data.url.startsWith("http");
  return (
    <div className={cn(shell, "flex items-center gap-3")}>
      <Calendar className="size-5 text-abi-text" aria-hidden />
      <p className="flex-1 text-sm">Pick a time that works for you.</p>
      <Button asChild size="sm">
        {external ? <a href={data.url} target="_blank" rel="noopener noreferrer">{data.label}</a> : <Link href={data.url}>{data.label}</Link>}
      </Button>
    </div>
  );
}

export function ContactDraftCard({ data }: { data: { name: string; email: string; message: string } }) {
  const [state, action, pending] = useActionState(sendContactMessage, null);
  if (state?.ok) {
    return <div className={cn(shell, "flex items-center gap-2 text-sm text-success")}><Check className="size-4" aria-hidden />{state.message}</div>;
  }
  const field = "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <form action={action} className={cn(shell, "space-y-2")}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-subtle-foreground">Review before sending</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="name" defaultValue={data.name} placeholder="Your name" aria-label="Your name" className={field} required />
        <input name="email" type="email" defaultValue={data.email} placeholder="Your email" aria-label="Your email" className={field} required />
      </div>
      <input type="hidden" name="subject" value="Sent via ABI" />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <textarea name="message" defaultValue={data.message} rows={4} aria-label="Message" className={field} required />
      {state && !state.ok && <p className="text-xs text-destructive">{state.message}</p>}
      <Button size="sm" type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Send to Abhishek
      </Button>
    </form>
  );
}
