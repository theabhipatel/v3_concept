import { toneOf } from "@/components/skills/skill-meta";
import type { Skill } from "@/lib/content";

function Row({ items, reverse = false }: { items: Skill[]; reverse?: boolean }) {
  return (
    <div className="marquee relative flex overflow-hidden">
      {/* The list twice, so the loop is seamless; the copy is hidden from screen readers. */}
      {[0, 1].map((copy) => (
        <ul key={copy} className={reverse ? "marquee__track marquee__track--reverse" : "marquee__track"} aria-hidden={copy === 1 || undefined}>
          {items.map((s) => (
            <li
              key={s.slug}
              className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium"
              style={{ "--tone": toneOf(s.category) } as React.CSSProperties}
            >
              <span className="size-2 rounded-full bg-(--tone)" aria-hidden />
              {s.name}
              <span className="text-xs font-normal text-subtle-foreground">{s.category}</span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/** Two rows of the tools he uses most, gliding in opposite directions. Hover pauses them. */
export function StackMarquee({ skills }: { skills: Skill[] }) {
  const half = Math.ceil(skills.length / 2);
  return (
    <div data-motion role="group" aria-label="Tools he works with" className="marquee-mask space-y-3">
      <Row items={skills.slice(0, half)} />
      <Row items={skills.slice(half)} reverse />
    </div>
  );
}
