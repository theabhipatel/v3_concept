"use client";

import { Briefcase, Mail, MapPin, Printer, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { abi } from "@/components/abi/abi-store";
import type { ResumeData } from "@/components/abi/generative/cards";
import { experience, getProject, profile, skills } from "@/lib/content";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
function readResume() {
  try {
    return sessionStorage.getItem("abi-resume");
  } catch {
    return null;
  }
}

/** A heading on the sheet: small caps label with a hairline running to the edge. */
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-paper-muted">
      {children}
      <span className="h-px flex-1 bg-paper-line" aria-hidden />
    </h2>
  );
}

/**
 * The resume: a paper sheet that prints itself out of a slot when the page opens, with a rubber
 * stamp saying whether ABI tailored it. A desk on the side downloads it as PDF (the browser's
 * print, free) or asks ABI to tailor it for a job. Only the sheet is printed.
 */
export function ResumeView() {
  const raw = useSyncExternalStore(noopSubscribe, readResume, () => null);
  const [jd, setJd] = useState("");
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
  const roles = (d.experience ?? []).map((x) => ({ ...x, role: experience.find((e) => e.slug === x.slug) })).filter((x) => x.role);
  const stat = (key: string) => profile.stats.find((s) => s.key === key)?.value;
  const github = profile.socials.find((s) => s.icon === "github");
  const linkedin = profile.socials.find((s) => s.icon === "linkedin");

  return (
    <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-24 pt-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem] print:block print:max-w-none print:p-0">
      <div className="min-w-0">
        {/* The printer slot the sheet comes out of */}
        <div className="printer relative z-10 mx-auto h-4 w-[calc(100%+1.5rem)] -translate-x-3 rounded-full print:hidden" aria-hidden>
          <span className="printer__light absolute right-5 top-1/2 size-1.5 -translate-y-1/2 rounded-full" />
        </div>
        <div className="paper-clip -mt-2 overflow-hidden px-1 pb-6 print:m-0 print:overflow-visible print:p-0">
          <article className="paper relative space-y-7 rounded-b-2xl bg-paper p-7 text-[13.5px] leading-relaxed text-paper-ink sm:p-10 print:rounded-none print:p-0 print:shadow-none">
            <span className={cn("stamp absolute right-6 top-8 rounded-lg px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest sm:right-10 print:hidden", data ? "stamp--abi" : "stamp--real")} aria-hidden>
              {data ? "Tailored by ABI" : "Real data only"}
            </span>

            <header className="paper__part border-b border-paper-line pb-6" style={{ "--i": 0 } as React.CSSProperties}>
              <h1 className="text-4xl font-extrabold tracking-[-0.03em]">{profile.name}</h1>
              <p className="mt-1 text-base font-semibold text-paper-brand">{d.headline}</p>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-paper-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden /> {profile.location.city}, {profile.location.country}
                </span>
                <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                  <Mail className="size-3.5" aria-hidden /> {profile.email}
                </a>
                <span>{profile.site.replace("https://", "")}</span>
                {github && <span>{github.url.replace("https://", "")}</span>}
                {linkedin && <span>{linkedin.url.replace("https://www.", "")}</span>}
              </p>
            </header>

            <section className="paper__part" style={{ "--i": 1 } as React.CSSProperties}>
              <Heading>Summary</Heading>
              <p className="mt-3">{d.summary}</p>
            </section>

            <section className="paper__part" style={{ "--i": 2 } as React.CSSProperties}>
              <Heading>Skills</Heading>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {d.skills?.map((s, i) => (
                  <li key={s} className="paper__skill rounded-md border border-paper-line px-2 py-0.5 text-[12px] font-medium" style={{ "--i": i } as React.CSSProperties}>
                    {s}
                  </li>
                ))}
              </ul>
            </section>

            <section className="paper__part space-y-5" style={{ "--i": 3 } as React.CSSProperties}>
              <Heading>Experience</Heading>
              {roles.map(({ slug, bullets, role }) => (
                <div key={slug} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="font-bold">
                      {role!.role}, <span className="font-semibold">{role!.company}</span>
                    </p>
                    <p className="text-[12px] text-paper-muted">{role!.period}</p>
                  </div>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 marker:text-paper-brand">
                    {bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section className="paper__part space-y-3" style={{ "--i": 4 } as React.CSSProperties}>
              <Heading>Selected projects</Heading>
              {(d.projects ?? []).map((slug) => {
                const p = getProject(slug);
                return p ? (
                  <p key={slug} className="break-inside-avoid">
                    <span className="font-bold">{p.title}</span>: {p.description.split(". ")[0]}.{" "}
                    <span className="text-paper-muted">({p.tags.slice(0, 5).join(", ")})</span>
                  </p>
                ) : null;
              })}
            </section>

            <section className="paper__part" style={{ "--i": 5 } as React.CSSProperties}>
              <Heading>Education</Heading>
              {profile.education.map((e) => (
                <p key={e.degree} className="mt-3">
                  <span className="font-bold">{e.degree}</span>, {e.institution} <span className="text-paper-muted">({e.year})</span>
                </p>
              ))}
            </section>
          </article>
        </div>
      </div>

      {/* The desk: download, status, tailor */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start print:hidden">
        <div data-intro className="rounded-3xl border bg-card p-5">
          <p className="text-sm font-semibold text-brand-text">Resume</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {data ? "Tailored by ABI for the role you shared, from my real data only." : "My general resume. ABI can tailor it to any role in seconds."}
          </p>
          <button type="button" onClick={() => window.print()} className="send group relative mt-5 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold">
            <Printer className="relative size-4" aria-hidden />
            <span className="relative">Download PDF</span>
          </button>
          <p className="mt-2 text-center text-xs text-subtle-foreground">Uses your browser&apos;s Save as PDF.</p>
        </div>

        <dl data-intro style={{ "--d": 1 } as React.CSSProperties} className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border bg-border">
          {[
            [stat("yearsExperience"), "years building"],
            [stat("projectsCompleted"), "projects shipped"],
            [stat("companies"), "companies"],
            [stat("technologies"), "tools"],
          ].map(([v, l]) => (
            <div key={l} className="bg-card p-4">
              <dd className="font-display text-2xl font-bold">{v}</dd>
              <dt className="text-xs text-muted-foreground">{l}</dt>
            </div>
          ))}
        </dl>

        <form
          data-intro
          style={{ "--d": 2 } as React.CSSProperties}
          onSubmit={(e) => {
            e.preventDefault();
            abi.ask(`Create a tailored resume for Abhishek for this job description:\n\n${jd.trim()}`);
          }}
          className="rounded-3xl border border-abi/30 bg-abi-soft/60 p-5"
        >
          <p className="flex items-center gap-2 font-semibold text-abi-text">
            <Briefcase className="size-4" aria-hidden /> Tailor it for a job
          </p>
          <label htmlFor="resume-jd" className="sr-only">
            Job description
          </label>
          <textarea
            id="resume-jd"
            rows={4}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description..."
            maxLength={5800}
            className="lab-input mt-3 text-sm"
          />
          <button
            type="submit"
            disabled={jd.trim().length < 40}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-abi/40 bg-card px-4 text-sm font-semibold text-abi-text transition-colors hover:border-abi disabled:opacity-50"
          >
            <Sparkles className="size-4" aria-hidden /> Tailor with ABI
          </button>
        </form>
        <p className="px-2 text-xs text-subtle-foreground">
          Rather talk? <Link href="/abi" className="underline">Open ABI</Link> or <Link href="/contact" className="underline">get in touch</Link>.
        </p>
      </aside>
    </div>
  );
}
