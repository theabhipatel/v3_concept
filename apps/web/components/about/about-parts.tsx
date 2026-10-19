"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** "It's 3:42 PM in Indore": his local time, ticking once a minute. */
export function LocalTime({ city, timeZone }: { city: string; timeZone: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [timeZone]);
  return (
    <span className="tabular-nums">
      {now ? `It's ${now} in ${city}` : `Based in ${city}`}
    </span>
  );
}

export interface Chapter {
  id: string;
  title: string;
  text: string;
}

/**
 * The story in chapters: a sticky rail on the left fills as you read, and the chapter in the
 * middle of the screen lights up while the others rest dimmed.
 */
export function Chapters({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
      <nav aria-label="Chapters" className="hidden lg:block">
        <ol className="sticky top-32 space-y-1">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className={cn(
                  "chapter-link relative flex items-center gap-3 rounded-xl py-2 pl-4 text-sm transition-colors duration-500",
                  i === active ? "text-foreground" : "text-subtle-foreground hover:text-muted-foreground",
                )}
                data-on={i <= active || undefined}
              >
                <span className="font-display text-xs font-bold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="space-y-24 sm:space-y-32">
        {chapters.map((c, i) => (
          <section
            key={c.id}
            id={c.id}
            data-index={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-labelledby={`${c.id}-title`}
            className={cn("chapter scroll-mt-32 transition-opacity duration-700", i === active ? "opacity-100" : "opacity-35")}
          >
            <p className="text-sm font-semibold text-brand-text">Chapter {i + 1}</p>
            <h3 id={`${c.id}-title`} className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
              {c.title}
            </h3>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl sm:leading-relaxed">{c.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
