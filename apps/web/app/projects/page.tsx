import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { PageHeader } from "@/components/site/page-header";
import { profile, projects } from "@/lib/content";
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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(list)} />
      <PageHeader
        label="Projects"
        title="Things I've shipped."
        description={`${projects.length} projects: agentic AI platforms, AI chatbots, full stack products, DevOps pipelines and mobile apps. Filter them, or ask ABI to compare any of them.`}
      />
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <ProjectsExplorer projects={projects}>
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} priority={i < 3} className="w-full" />
          ))}
        </ProjectsExplorer>
      </section>
    </>
  );
}
