import { PageHeader } from "@/components/site/page-header";
import { SkillsExplorer } from "@/components/skills/skills-explorer";
import { skillCategories, skills } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("skills");

export default function SkillsPage() {
  const expert = skills.filter((s) => s.level === "Expert").length;
  return (
    <>
      <PageHeader
        label="03 / Reason - skills"
        title="The toolkit behind the answers."
        description={`${skills.length} technologies across AI, full stack and DevOps, ${expert} of them at expert level. Hover any skill and ask ABI where it was used.`}
      />
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <SkillsExplorer skills={skills} categories={skillCategories} />
      </section>
    </>
  );
}
