import { ArrowDown, ArrowRight, GraduationCap, MapPin } from "lucide-react";
import Link from "next/link";
import { AskAbi } from "@/components/abi/ask-abi";
import { CoreLoader } from "@/components/home/core-loader";
import { DemoButton } from "@/components/home/demo-button";
import { HeroCommand } from "@/components/home/hero-command";
import { OpenAbiButton } from "@/components/home/open-abi-button";
import { PipelineMotion } from "@/components/home/pipeline-motion";
import { ProgressRail } from "@/components/home/progress-rail";
import { Stage } from "@/components/home/stage";
import { StageStatus } from "@/components/home/stage-status";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { contact, experience, profile, projects, skillCategories, skills } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("home");

const LEVEL_ORDER = { Expert: 0, Advanced: 1, Intermediate: 2, Learning: 3 } as const;

function Chunk({ n, source, children, className = "" }: { n: number; source: string; children: React.ReactNode; className?: string }) {
  return (
    <article data-chunk className={`rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur ${className}`}>
      <p className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-subtle-foreground">
        <span>chunk {String(n).padStart(2, "0")} - {source}</span>
        <span className="text-abi-text">retrieved</span>
      </p>
      {children}
    </article>
  );
}

export default function Home() {
  const current = experience.find((e) => e.current)!;
  const featured = projects.filter((p) => p.featured).slice(0, 6);
  const stats = profile.stats.slice(0, 4);

  return (
    <>
      <CoreLoader />
      <ProgressRail />
      <PipelineMotion />

      {/* 01 PROMPT - the hero is a command bar in front of the neural core */}
      <section id="prompt" aria-labelledby="prompt-title" className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pb-16 pt-28 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,var(--background)_0%,transparent_65%)] opacity-70" aria-hidden />
        <div className="flex flex-col items-center gap-7">
          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.2em]">
            <span className="text-brand-text">01 / Prompt</span>
            <StageStatus id="prompt" next="Retrieve" />
          </div>
          <h1 id="prompt-title" className="max-w-4xl text-5xl font-semibold leading-[0.98] sm:text-7xl lg:text-8xl">
            {profile.name}
            <span className="mt-3 block bg-(image:--gradient-brand) bg-clip-text pb-2 text-3xl text-transparent sm:text-5xl lg:text-6xl">
              {profile.title}
            </span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Don&apos;t read a portfolio. Ask it. ABI, my AI agent, answers from real data and can drive this site for you.
          </p>
          <HeroCommand />
        </div>
        <a href="#retrieve" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col sm:flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-subtle-foreground hover:text-foreground">
          Scroll to open the core
          <ArrowDown className="size-4 animate-bounce motion-reduce:animate-none" aria-hidden />
        </a>
      </section>

      <div className="relative">
        {/* The pipeline spine: a data packet travels through the stages as you scroll. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 mx-auto hidden max-w-6xl lg:block" aria-hidden>
          <div data-spine className="absolute -right-2 bottom-40 top-40 w-px bg-gradient-to-b from-transparent via-border-strong to-transparent">
            <span data-packet className="absolute -left-[7px] top-0 size-[15px] rounded-full bg-abi shadow-glow-abi" />
          </div>
        </div>

        {/* 02 RETRIEVE - about */}
        <Stage
          id="retrieve"
          index={2}
          name="Retrieve"
          next="Reason"
          title="Context retrieved."
          lede="Before answering, ABI pulls the facts. This is what it knows about Abhishek."
        >
          <div className="grid gap-5 md:grid-cols-6">
            <Chunk n={1} source="profile" className="md:col-span-3">
              <p className="text-2xl font-semibold">{profile.name}</p>
              <p className="text-brand-text">{profile.title} at {profile.currentCompany}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden /> {profile.location.city}, {profile.location.region}, {profile.location.country}
              </p>
            </Chunk>
            <Chunk n={2} source="stats" className="md:col-span-3">
              <dl className="grid grid-cols-2 gap-4">
                {stats.map((s) => (
                  <div key={s.key}>
                    <dd className="font-display text-4xl font-semibold">{s.value}</dd>
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  </div>
                ))}
              </dl>
            </Chunk>
            <Chunk n={3} source="bio" className="md:col-span-4">
              <p className="text-lg leading-relaxed text-muted-foreground">{profile.bio}</p>
            </Chunk>
            <Chunk n={4} source="education" className="md:col-span-2">
              <GraduationCap className="mb-3 size-6 text-brand-text" aria-hidden />
              <p className="font-semibold">{profile.education[0].degree}</p>
              <p className="text-sm text-muted-foreground">{profile.education[0].institution}, {profile.education[0].year}</p>
            </Chunk>
            <Chunk n={5} source="experience" className="md:col-span-4">
              <p className="font-semibold">Now: {current.role}, {current.company}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {current.highlights.slice(0, 3).map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-abi" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </Chunk>
            <Chunk n={6} source="availability" className="md:col-span-2">
              <p className="font-semibold">Open to</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {contact.openTo.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </Chunk>
          </div>
          <div className="mt-10 flex flex-wrap gap-3" data-reveal>
            <Button asChild variant="outline">
              <Link href="/about">Read the full story <ArrowRight aria-hidden /></Link>
            </Button>
            <AskAbi prompt="Summarize Abhishek's career and show his timeline" label="Ask ABI for the 30-second version" className="px-4 py-2 text-sm" />
          </div>
        </Stage>

        {/* 03 REASON - skills */}
        <Stage
          id="reason"
          index={3}
          name="Reason"
          next="Act"
          title={<>Reasoning across {skills.length} skills.</>}
          lede="AI and LLM engineering on top of a solid full stack and DevOps foundation."
        >
          <div className="relative">
            <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path data-draw d="M16 16 C 40 30, 60 30, 84 16" fill="none" stroke="var(--brand)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" opacity="0.5" />
              <path data-draw d="M16 50 C 40 35, 60 65, 84 50" fill="none" stroke="var(--brand-2)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" opacity="0.5" />
              <path data-draw d="M16 84 C 40 70, 60 70, 84 84" fill="none" stroke="var(--brand)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" opacity="0.5" />
              <path data-draw d="M50 16 C 35 40, 65 60, 50 84" fill="none" stroke="var(--abi)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" opacity="0.5" />
            </svg>
            <ul className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skillCategories.map((c) => {
                const list = skills.filter((s) => s.category === c.id).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
                return (
                  <li key={c.id} data-reveal className={`group relative rounded-3xl border bg-card/90 p-5 shadow-sm backdrop-blur ${c.id === "AI" ? "border-abi/40 shadow-glow-abi" : ""}`}>
                    <div className="mb-3 flex items-baseline justify-between">
                      <Link href={`/skills?category=${c.id.toLowerCase()}`} className="text-lg font-semibold after:absolute after:inset-0">
                        {c.label}
                      </Link>
                      <span className="font-mono text-xs text-subtle-foreground">{list.length}</span>
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {list.slice(0, 6).map((s) => (
                        <li key={s.slug} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{s.name}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-10" data-reveal>
            <Button asChild variant="outline">
              <Link href="/skills">Explore all skills <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
        </Stage>

        {/* 04 ACT - projects */}
        <Stage
          id="act"
          index={4}
          name="Act"
          next="Deliver"
          title="Tools called. Things shipped."
          lede="Agentic AI platforms, AI assistants and full stack products, built and deployed end to end."
        >
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <li key={p.slug} data-reveal className="flex flex-col gap-2">
                <p className="font-mono text-[11px] text-subtle-foreground">
                  <span className="text-abi-text">tool_call</span> open_project(&quot;{p.slug}&quot;)
                </p>
                <ProjectCard project={p} className="flex-1" />
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-3" data-reveal>
            <DemoButton />
            <Button asChild variant="outline" size="lg">
              <Link href="/projects">All {projects.length} projects <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
        </Stage>

        {/* 05 DELIVER - the answer */}
        <Stage id="deliver" index={5} name="Deliver" title="The answer." className="pb-32">
          <div data-reveal className="relative overflow-hidden rounded-[2rem] border bg-card p-8 shadow-lg sm:p-14">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-abi/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-brand/20 blur-3xl" aria-hidden />
            <p className="relative font-mono text-xs uppercase tracking-[0.2em] text-abi-text">final_answer</p>
            <p className="relative mt-5 max-w-4xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
              {profile.name.split(" ")[0]} is a {profile.title} who ships AI products end to end: LangGraph agents, RAG,
              full stack apps and the cloud they run on.
            </p>
            <div className="relative mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/contact">Start a conversation <ArrowRight aria-hidden /></Link>
              </Button>
              <OpenAbiButton>Ask ABI a follow-up</OpenAbiButton>
              <Button asChild size="lg" variant="ghost">
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </Button>
            </div>
          </div>
        </Stage>
      </div>
    </>
  );
}
