import { ProjectBanner } from "@/components/projects/project-banner";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { CountUp } from "@/components/site/count-up";
import { profile, projectsInOrder as projects } from "@/lib/content";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("projects");

export default function ProjectsPage() {
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Projects by ${profile.name}`,
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${profile.site}/projects/${p.slug}`,
      name: p.title,
    })),
  };
  const client = projects.filter((p) => p.type === "client").length;
  const facts = [
    { value: projects.length, label: "projects" },
    { value: client, label: "professional" },
    { value: projects.length - client, label: "built for fun" },
    { value: projects.filter((p) => p.categories.includes("AI")).length, label: "with AI inside" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(list)} />
      <section aria-labelledby="projects-title" className="relative overflow-hidden pb-12 pt-32 sm:pt-40">
        <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
          <p data-intro className="text-sm font-semibold text-brand-text">
            Projects
          </p>
          <h1
            id="projects-title"
            data-intro
            style={{ "--d": 1 } as React.CSSProperties}
            className="mt-3 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl"
          >
            Everything I have built, <span className="text-brand-text">at work and for fun.</span>
          </h1>
          <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Agent platforms, AI chatbots, full stack products, pipelines and mobile apps. Open any banner for the full story, or ask
            ABI to compare them.
          </p>
          <dl data-intro style={{ "--d": 3 } as React.CSSProperties} className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {facts.map((f) => (
              <div key={f.label}>
                <dd className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  <CountUp value={f.value} />
                </dd>
                <dt className="text-sm text-muted-foreground">{f.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section aria-label="All projects" className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <ProjectsExplorer projects={projects}>
          {projects.map((p) => (
            <ProjectBanner key={p.slug} project={p} />
          ))}
        </ProjectsExplorer>
      </section>
    </>
  );
}
