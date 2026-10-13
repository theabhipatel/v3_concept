import { cn } from "@/lib/utils";

/** Page intro: a mono "stage" label (the site is an AI pipeline), title and lede on a faint grid. */
export function PageHeader({
  label,
  title,
  description,
  children,
  className,
}: {
  label: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden pb-12 pt-32 sm:pt-40", className)}>
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[min(900px,100vw)] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl space-y-5 px-4 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-text">{label}</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl">{title}</h1>
        {description && <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{description}</p>}
        {children}
      </div>
    </section>
  );
}
