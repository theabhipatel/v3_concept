import { CountUp } from "@/components/site/count-up";
import { SkillOrbit } from "@/components/skills/skill-orbit";
import { SkillsExplorer } from "@/components/skills/skills-explorer";
import { skillCategories, skills, type SkillLevel } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("skills");

const LEVELS: { level: SkillLevel; note: string }[] = [
  { level: "Expert", note: "Daily drivers, years deep" },
  { level: "Advanced", note: "Shipped to production" },
  { level: "Intermediate", note: "Used on real work" },
  { level: "Learning", note: "Exploring now" },
];

export default function SkillsPage() {
  const count = (l: SkillLevel) => skills.filter((s) => s.level === l).length;
  // The orbit: expert tools on the inner rings, a few advanced ones on the outside.
  const expert = skills.filter((s) => s.level === "Expert");
  const advanced = skills.filter((s) => s.level === "Advanced");
  const rings = [expert.slice(0, 6), expert.slice(6, 16), [...expert.slice(16), ...advanced.filter((s) => s.category === "AI")].slice(0, 14)];

  return (
    <>
      <section aria-labelledby="skills-title" className="relative overflow-hidden pb-16 pt-28 sm:pt-36">
        <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p data-intro className="text-sm font-semibold text-brand-text">
              Skills
            </p>
            <h1
              id="skills-title"
              data-intro
              style={{ "--d": 1 } as React.CSSProperties}
              className="mt-3 text-balance text-4xl font-bold leading-[1.04] tracking-[-0.03em] sm:text-6xl"
            >
              The toolkit behind <span className="text-brand-text">everything I ship.</span>
            </h1>
            <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {skills.length} tools across AI, full stack and DevOps. Hover any card and ask ABI where I used it.
            </p>
            <dl data-intro style={{ "--d": 3 } as React.CSSProperties} className="mt-10 grid max-w-lg grid-cols-2 gap-3">
              {LEVELS.map((l) => (
                <div key={l.level} className="rounded-2xl border bg-card/80 p-4 backdrop-blur">
                  <dd className="font-display text-3xl font-bold tracking-tight">
                    <CountUp value={count(l.level)} />
                  </dd>
                  <dt className="mt-0.5 text-sm font-semibold">{l.level}</dt>
                  <p className="text-xs text-muted-foreground">{l.note}</p>
                </div>
              ))}
            </dl>
          </div>
          <div data-intro="scale" style={{ "--d": 2 } as React.CSSProperties}>
            <SkillOrbit rings={rings} total={skills.length} />
          </div>
        </div>
      </section>
      <section aria-label="All skills" className="mx-auto max-w-6xl px-4 pb-28 sm:px-8">
        <SkillsExplorer skills={skills} categories={skillCategories} />
      </section>
    </>
  );
}
