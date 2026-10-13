import { experience, profile, projects, seo, skillCategories, skills } from "@/lib/content";

// llms.txt: a plain-text map of the site for AI crawlers, built from content/.
export function GET() {
  const pages = Object.values(seo.pages)
    .map((p) => `- [${p.title}](${profile.site}${p.path === "/" ? "" : p.path}): ${p.description}`)
    .join("\n");
  const work = experience.map((e) => `- ${e.role} at ${e.company} (${e.period}): ${e.description}`).join("\n");
  const projectList = projects
    .map((p) => `- [${p.title}](${profile.site}/projects/${p.slug}): ${p.description}`)
    .join("\n");
  const skillList = skillCategories
    .map((c) => `- ${c.label}: ${skills.filter((s) => s.category === c.id).map((s) => s.name).join(", ")}`)
    .join("\n");

  const body = `# ${profile.name} (${profile.brand})

> ${profile.title} based in ${profile.location.city}, ${profile.location.country}. ${profile.bio}

Contact: ${profile.email}. The site's AI agent ABI (Abhi's Brain Interface) answers questions at ${profile.site}/abi.

## Pages
${pages}

## Experience
${work}

## Projects
${projectList}

## Skills
${skillList}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
