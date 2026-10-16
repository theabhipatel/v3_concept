import { cn } from "@/lib/utils";

/** Page intro: a short context line, a clear title and a lede. Calm and readable. */
export function PageHeader({
  label,
  title,
  description,
  children,
  className,
}: {
  label?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pb-12 pt-32 sm:pt-40", className)}>
      <div className="mx-auto max-w-6xl space-y-4 px-4 sm:px-8">
        {label && <p className="text-sm font-semibold text-brand-text">{label}</p>}
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>}
        {children}
      </div>
    </section>
  );
}
