import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AskAbi } from "@/components/abi/ask-abi";
import { GithubIcon } from "@/components/icons";
import { ProjectCard } from "@/components/projects/project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProject, profile, projects, seo } from "@/lib/content";
import { jsonLd } from "@/lib/seo";

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

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const related = projects
    .filter((o) => o.slug !== p.slug)
    .map((o) => ({ o, score: o.tags.filter((t) => p.tags.includes(t)).length + o.categories.filter((c) => p.categories.includes(c)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ o }) => o);

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
      <article className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-8 sm:pt-36">
        <Link href="/projects" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> All projects
        </Link>
        <header className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div className="space-y-5">
            <p className="font-medium text-xs text-brand-text">
              {p.type === "client" ? "Client work" : "Personal project"}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">{p.title}</h1>
            <div className="flex flex-wrap gap-2">
              {p.categories.map((c) => (
                <Badge key={c} tone={c === "AI" ? "abi" : "brand"}>{c}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {p.demo && (
              <Button asChild>
                <a href={p.demo} target="_blank" rel="noopener noreferrer">
                  Live demo <ExternalLink aria-hidden />
                </a>
              </Button>
            )}
            {p.github && (
              <Button asChild variant="outline">
                <a href={p.github} target="_blank" rel="noopener noreferrer">
                  <GithubIcon /> Source code
                </a>
              </Button>
            )}
          </div>
        </header>

        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl border bg-muted shadow-lg">
          <Image src={p.image} alt={`${p.title} screenshot`} fill priority sizes="(min-width: 1152px) 1088px, 100vw" className="object-cover" />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <section id="overview" aria-labelledby="overview-title" className="space-y-4">
            <h2 id="overview-title" className="text-2xl font-semibold">Overview</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">{p.description}</p>
          </section>
          <aside className="space-y-8">
            <section aria-labelledby="stack-title" className="space-y-3">
              <h2 id="stack-title" className="font-medium text-xs text-subtle-foreground">Tech stack</h2>
              <ul className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li key={t} className="rounded-full border bg-card px-3 py-1 text-sm">{t}</li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="ask-title" className="space-y-3 rounded-3xl border border-abi/30 bg-abi-soft/60 p-5">
              <h2 id="ask-title" className="font-medium text-xs text-abi-text">Ask ABI about this</h2>
              <ul className="space-y-2">
                {questions.map((q) => (
                  <li key={q}>
                    <AskAbi prompt={q} label={q} className="w-full justify-start rounded-2xl px-3 py-2 text-left text-sm" />
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <section aria-labelledby="related-title" className="mt-20 space-y-6">
          <h2 id="related-title" className="text-2xl font-semibold">Related work</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug} className="flex">
                <ProjectCard project={r} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
