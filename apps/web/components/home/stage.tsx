import { cn } from "@/lib/utils";
import { StageStatus } from "./stage-status";

/** One stage of the home pipeline: Prompt -> Retrieve -> Reason -> Act -> Deliver. */
export function Stage({
  id,
  index,
  name,
  title,
  lede,
  next,
  children,
  className,
}: {
  id: string;
  index: number;
  name: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  next?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} data-stage aria-labelledby={`${id}-title`} className={cn("relative scroll-mt-0 py-24 sm:py-32", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <header className="mb-12 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.2em]" data-reveal>
            <span className="text-brand-text">
              {String(index).padStart(2, "0")} / {name}
            </span>
            <StageStatus id={id} next={next} />
          </div>
          <h2 id={`${id}-title`} className="text-4xl font-semibold leading-[1.05] sm:text-6xl" data-reveal>
            {title}
          </h2>
          {lede && (
            <p className="text-lg text-muted-foreground" data-reveal>
              {lede}
            </p>
          )}
        </header>
        {children}
      </div>
    </section>
  );
}
