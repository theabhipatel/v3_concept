import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { AskAbi } from "@/components/abi/ask-abi";
import { GithubIcon } from "@/components/icons";
import { bannerStyle, pitch, ProjectBanner } from "@/components/projects/project-banner";
import { Button } from "@/components/ui/button";
import { getProject, getProjectDetails, profile, projects, projectsInOrder, seo } from "@/lib/content";
import { jsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

// Every project page is prerendered at build time (generateStaticParams), so a navigation loads
// a finished static page. Reading params can therefore block without a loading placeholder.
export const ensureStatic = "navigation";
export const instant = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const title = `${p.title} - ${p.categories.join(", ")} project by ${profile.name}`;
  const description = p.description.length > 160 ? `${p.description.slice(0, 157)}...` : p.description;
  return {
    title: { absolute: `${title} | ${seo.siteName}` },
    description,
    keywords: [p.title, ...p.tags, profile.name, profile.brand],
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { type: "article", url: `${profile.site}/projects/${p.slug}`, title, description, siteName: seo.siteName },
    twitter: { card: "summary_large_image", title, description },
  };
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p data-reveal className="text-sm font-semibold text-brand-text">
        {eyebrow}
      </p>
      <h2 data-reveal style={{ "--d": 1 } as React.CSSProperties} className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const d = getProjectDetails(p.slug);
  const { tone, pattern } = bannerStyle(p.slug);
  const index = projectsInOrder.findIndex((o) => o.slug === p.slug);
  const next = projectsInOrder[(index + 1) % projectsInOrder.length];
  const related = projects
    .filter((o) => o.slug !== p.slug && o.slug !== next.slug)
    .map((o) => ({ o, score: o.tags.filter((t) => p.tags.includes(t)).length + o.categories.filter((c) => p.categories.includes(c)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ o }) => o);

  const facts = [
    { label: "Type", value: p.type === "client" ? "Professional work" : "Built for fun" },
    ...(d.year ? [{ label: "Year", value: d.year }] : []),
    { label: "Area", value: p.categories.join(", ") },
    { label: "Stack", value: `${p.tags.length} tools` },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": p.github ? "SoftwareSourceCode" : "CreativeWork",
    name: p.title,
    description: p.description,
    url: `${profile.site}/projects/${p.slug}`,
    image: `${profile.site}${p.image}`,
    keywords: p.tags.join(", "),
    author: { "@type": "Person", name: profile.name, url: profile.site },
    ...(p.github && { codeRepository: p.github }),
    ...(p.demo && { sameAs: p.demo }),
  };

  const questions = [
    `What problem does ${p.title} solve and how was it built?`,
    `What was Abhishek's role in ${p.title}?`,
    ...(p.github ? [`Show me real code from ${p.title}`] : []),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <article className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-8 sm:pt-32">
        <Link
          href="/projects"
          transitionTypes={["nav-back"]}
          className="mb-6 inline-flex min-h-9 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> All projects
        </Link>

        {/* The banner from the grid grows into this hero (same view transition name). */}
        <ViewTransition name={`banner-${p.slug}`} share="morph" default="none">
          <header className="banner banner--hero" style={{ "--tone": tone } as React.CSSProperties}>
            <span className={cn("banner__pattern", `banner__pattern--${pattern}`)} aria-hidden />
            <span className="banner__initial" aria-hidden>
              {p.title.replace(/^the/i, "").trim()[0]}
            </span>
            <p className="relative flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="banner__tag">{p.type === "client" ? "Professional" : "Built for fun"}</span>
              <span className="text-muted-foreground">{p.categories.join(" / ")}</span>
            </p>
            <div className="relative mt-auto pt-16">
              <h1 className="max-w-4xl text-balance font-display text-5xl font-bold leading-[0.98] tracking-[-0.035em] sm:text-7xl">{p.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{d.problem ?? pitch(p)}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {p.demo && (
                  <Button asChild size="lg">
                    <a href={p.demo} target="_blank" rel="noopener noreferrer">
                      Open live site <ExternalLink aria-hidden />
                    </a>
                  </Button>
                )}
                {p.github && (
                  <Button asChild variant="outline" size="lg">
                    <a href={p.github} target="_blank" rel="noopener noreferrer">
                      <GithubIcon /> Source code
                    </a>
                  </Button>
                )}
                <AskAbi prompt={`Tell me about the ${p.title} project`} label="Ask ABI about it" className="min-h-11 rounded-full px-5 text-sm" />
              </div>
            </div>
          </header>
        </ViewTransition>

        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border bg-border lg:grid-cols-4">
          {facts.map((f, i) => (
            <div key={f.label} data-intro style={{ "--d": i + 2 } as React.CSSProperties} className="bg-card px-6 py-5">
              <dt className="text-xs font-medium text-subtle-foreground">{f.label}</dt>
              <dd className="mt-1 font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>

        {/* The story */}
        <section aria-labelledby="story" className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionTitle eyebrow="The story" title={d.problem ? "Why it exists" : "What it is"} />
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p data-reveal id="story">
              {d.summary ?? p.description}
            </p>
            {d.summary && (
              <p data-reveal style={{ "--d": 1 } as React.CSSProperties} className="text-base">
                {p.description}
              </p>
            )}
          </div>
        </section>

        {d.features && (
          <section aria-labelledby="features-title" className="mt-24">
            <SectionTitle eyebrow="What it does" title="The features that matter" />
            <ul id="features-title" className="mt-10 grid gap-3 sm:grid-cols-2">
              {d.features.map((f, i) => (
                <li
                  key={f}
                  data-reveal
                  style={{ "--d": i % 2, "--tone": tone } as React.CSSProperties}
                  className="feature flex items-start gap-3 rounded-2xl border bg-card p-5"
                >
                  <span className="feature__check grid size-7 shrink-0 place-items-center rounded-full">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.howItWorks && (
          <section aria-labelledby="how-title" className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionTitle eyebrow="Under the hood" title="How it works" />
            </div>
            <ol id="how-title" className="timeline relative space-y-8 pl-8" data-reveal="line">
              {d.howItWorks.map((h, i) => (
                <li key={h} data-reveal style={{ "--d": i + 1 } as React.CSSProperties} className="relative">
                  <span className="timeline__dot" aria-hidden />
                  <p className="text-xs font-semibold text-subtle-foreground">Step {i + 1}</p>
                  <p className="mt-1 text-lg leading-relaxed">{h}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* A look at it */}
        <section aria-labelledby="look-title" className="mt-24">
          <SectionTitle eyebrow="A look at it" title={p.demo ? "As it runs today" : "A screen from the app"} />
          <figure data-reveal="scale" className="mt-10 overflow-hidden rounded-3xl border bg-card shadow-lg">
            <div className="flex items-center gap-1.5 border-b px-4 py-3">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="ml-3 min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
                {p.demo ? p.demo.replace(/^https?:\/\//, "") : p.title}
              </span>
            </div>
            <div className="relative aspect-video bg-muted">
              <Image src={p.image} alt={`${p.title} screenshot`} fill sizes="(min-width: 1152px) 1088px, 100vw" className="object-cover object-top" />
            </div>
          </figure>
        </section>

        {/* Stack and ABI */}
        <section aria-labelledby="stack-title" className="mt-24 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div data-reveal className="rounded-3xl border bg-card p-6 sm:p-8">
            <h2 id="stack-title" className="text-xl font-bold">
              Built with
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <li key={t} className="rounded-full border bg-background px-3.5 py-1.5 text-sm">
                  {t}
                </li>
              ))}
            </ul>
            {d.stackNotes && <p className="mt-5 leading-relaxed text-muted-foreground">{d.stackNotes}</p>}
          </div>
          <div data-reveal style={{ "--d": 1 } as React.CSSProperties} className="rounded-3xl border border-abi/30 bg-abi-soft/60 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-abi-text">Ask ABI about it</h2>
            <ul className="mt-5 space-y-2">
              {questions.map((q) => (
                <li key={q}>
                  <AskAbi prompt={q} label={q} className="w-full justify-start rounded-2xl px-3 py-2 text-left text-sm" />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Up next */}
        <section aria-labelledby="next-title" className="mt-24">
          <SectionTitle eyebrow="Up next" title="Keep exploring" />
          <div data-reveal className="mt-10">
            <ProjectBanner project={next} size="lg" />
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <li key={r.slug} data-reveal style={{ "--d": i } as React.CSSProperties} className="flex *:w-full">
                <ProjectBanner project={r} />
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
