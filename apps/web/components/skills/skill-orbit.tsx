import type { Skill } from "@/lib/content";
import { cn } from "@/lib/utils";
import { logoClass } from "./skill-meta";

/**
 * The hero picture: his tools orbiting a core in three rings, expert ones closest. Each ring
 * turns at its own pace while the icons stay upright. Pure CSS, paused off screen.
 */
export function SkillOrbit({ rings, total }: { rings: Skill[][]; total: number }) {
  const RADII = [19, 31, 43]; // percent of the box width
  const SPEED = [38, 56, 80]; // seconds per turn
  return (
    <div data-motion className="orbit relative mx-auto aspect-square w-full max-w-[34rem]" aria-hidden>
      <div className="orbit__core absolute left-1/2 top-1/2 grid size-[26%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-center">
        <span>
          <span className="block font-display text-[clamp(1.6rem,6cqw,2.6rem)] font-bold leading-none">{total}</span>
          <span className="mt-1 block text-[clamp(0.6rem,2cqw,0.8rem)] text-muted-foreground">tools in use</span>
        </span>
      </div>
      {rings.map((ring, r) => (
        <div
          key={r}
          className={cn("orbit__ring absolute inset-0", r % 2 === 1 && "orbit__ring--reverse")}
          style={{ "--r": RADII[r], "--dur": `${SPEED[r]}s` } as React.CSSProperties}
        >
          <span className="orbit__path absolute left-1/2 top-1/2 rounded-full border" />
          {ring.map((s, i) => (
            <span key={s.slug} className="orbit__item absolute left-1/2 top-1/2" style={{ "--a": `${(360 / ring.length) * i + r * 17}deg` } as React.CSSProperties}>
              <span className="orbit__icon grid place-items-center rounded-2xl border bg-card shadow-md" title={s.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.icon} alt="" loading="lazy" decoding="async" className={cn("size-[55%] object-contain", logoClass(s))} />
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
