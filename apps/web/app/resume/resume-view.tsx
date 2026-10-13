"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import type { ResumeData } from "@/components/abi/generative/cards";
import { Button } from "@/components/ui/button";
import { experience, getProject, profile, skills } from "@/lib/content";

const noopSubscribe = () => () => {};
function readResume() {
  try {
    return sessionStorage.getItem("abi-resume");
  } catch {
    return null;
  }
}

/** Printable resume tailored by ABI. "Download PDF" uses the browser's print to PDF (free). */
export function ResumeView() {
  const raw = useSyncExternalStore(noopSubscribe, readResume, () => null);
  const data = useMemo<ResumeData | null>(() => {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [raw]);

  const d: ResumeData = data ?? {
    headline: profile.title,
    summary: profile.bio,
    skills: skills.filter((s) => s.level === "Expert").map((s) => s.name),
    experience: experience.map((e) => ({ slug: e.slug, bullets: e.highlights })),
    projects: ["secure-vault", "pushable-ai", "aiyubot"],
  };
  const roles = (d.experience ?? [])
    .map((x) => ({ ...x, role: experience.find((e) => e.slug === x.slug) }))
    .filter((x) => x.role);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 print:p-0">
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Button onClick={() => window.print()}>
          <Printer aria-hidden /> Download PDF
        </Button>
        <p className="text-sm text-muted-foreground">
          {data ? "Tailored by ABI from Abhishek's real data." : "General resume. Ask ABI to tailor one for a job."}{" "}
          <Link href="/abi" className="underline">Open ABI</Link>
        </p>
      </div>
      <article className="space-y-6 rounded-3xl border bg-card p-8 text-sm shadow-sm print:border-0 print:shadow-none">
        <header className="border-b pb-5">
          <h1 className="text-3xl font-semibold">{profile.name}</h1>
          <p className="mt-1 text-base font-medium text-brand-text">{d.headline}</p>
          <p className="mt-2 text-muted-foreground">
            {profile.location.city}, {profile.location.country} - {profile.email} - {profile.site.replace("https://", "")}
          </p>
        </header>
        <section>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-subtle-foreground">Summary</h2>
          <p>{d.summary}</p>
        </section>
        <section>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-subtle-foreground">Skills</h2>
          <p>{d.skills?.join(" - ")}</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-subtle-foreground">Experience</h2>
          {roles.map(({ slug, bullets, role }) => (
            <div key={slug} className="break-inside-avoid">
              <p className="font-semibold">
                {role!.role}, {role!.company} <span className="font-normal text-muted-foreground">({role!.period})</span>
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>
        <section className="space-y-2">
          <h2 className="font-mono text-xs uppercase tracking-widest text-subtle-foreground">Selected projects</h2>
          {(d.projects ?? []).map((slug) => {
            const p = getProject(slug);
            return p ? (
              <p key={slug} className="break-inside-avoid">
                <span className="font-semibold">{p.title}</span> - {p.description.split(". ")[0]}. <span className="text-muted-foreground">({p.tags.slice(0, 5).join(", ")})</span>
              </p>
            ) : null;
          })}
        </section>
        <section>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-subtle-foreground">Education</h2>
          {profile.education.map((e) => (
            <p key={e.degree}>{e.degree}, {e.institution} ({e.year})</p>
          ))}
        </section>
      </article>
    </div>
  );
}
