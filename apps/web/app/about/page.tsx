import { GraduationCap, MapPin } from "lucide-react";
import Image from "next/image";
import { AskAbi } from "@/components/abi/ask-abi";
import { NamedIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/page-header";
import { experience, profile } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata("about");

function SectionTitle({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 space-y-2">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-text">{label}</p>
      <h2 id={`${id}-title`} className="text-3xl font-semibold sm:text-4xl">{children}</h2>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHeader
        label="02 / Retrieve - about"
        title={<>Hi, I&apos;m {profile.name.split(" ")[0]}. I build AI that ships.</>}
        description={profile.bio}
      >
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden /> {profile.location.city}, {profile.location.region}, {profile.location.country}
        </p>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-28 px-4 pb-28 sm:px-8">
        <section id="story" aria-labelledby="story-title" className="grid gap-12 rounded-3xl lg:grid-cols-[320px_1fr]">
          <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl border bg-muted shadow-lg">
            <Image src={profile.avatar} alt={profile.name} fill sizes="320px" className="object-cover" priority />
          </div>
          <div>
            <SectionTitle id="story" label="Story">How I got here</SectionTitle>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              {profile.longBio.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.stats.slice(0, 4).map((s) => (
                <div key={s.key} className="rounded-2xl border bg-card p-4">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="font-display text-3xl font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="experience" aria-labelledby="experience-title" className="rounded-3xl">
          <SectionTitle id="experience" label="Experience">Where I&apos;ve worked</SectionTitle>
          <ol className="relative space-y-6 border-l border-border pl-6 sm:pl-10">
            {experience.map((e) => (
              <li key={e.slug} id={`experience-${e.slug}`} className="group relative scroll-mt-28 rounded-3xl">
                <span
                  className={cn(
                    "absolute -left-[31px] top-7 size-3.5 rounded-full border-2 border-background sm:-left-[47px]",
                    e.current ? "bg-abi shadow-glow-abi" : "bg-brand",
                  )}
                  aria-hidden
                />
                <article className="rounded-3xl border bg-card p-6 shadow-sm transition-colors hover:border-border-strong">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-subtle-foreground">
                        {e.period} {e.current && <span className="text-abi-text">- current</span>}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold">
                        {e.role} <span className="font-normal text-muted-foreground">at {e.company}</span>
                      </h3>
                    </div>
                    <AskAbi
                      prompt={`What did Abhishek do as ${e.role} at ${e.company}?`}
                      className="sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-3 text-muted-foreground">{e.description}</p>
                  <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
                    {e.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                    {e.technologies.map((t) => (
                      <li key={t} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{t}</li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-16 lg:grid-cols-2">
          <section id="education" aria-labelledby="education-title" className="rounded-3xl">
            <SectionTitle id="education" label="Education">Foundations</SectionTitle>
            {profile.education.map((ed) => (
              <div key={ed.degree} className="flex gap-4 rounded-3xl border bg-card p-6">
                <GraduationCap className="size-6 shrink-0 text-brand-text" aria-hidden />
                <div>
                  <p className="font-mono text-xs text-subtle-foreground">{ed.year}</p>
                  <p className="font-semibold">{ed.degree}</p>
                  <p className="text-sm text-muted-foreground">{ed.institution}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{ed.description}</p>
                </div>
              </div>
            ))}
          </section>
          <section id="values" aria-labelledby="values-title" className="rounded-3xl">
            <SectionTitle id="values" label="Values">How I work</SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-2">
              {profile.values.map((v) => (
                <li key={v.title} className="rounded-3xl border bg-card p-5">
                  <NamedIcon name={v.icon} className="mb-3 size-5 text-brand-text" />
                  <p className="font-semibold">{v.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section id="services" aria-labelledby="services-title" className="rounded-3xl">
          <SectionTitle id="services" label="Services">What I can do for you</SectionTitle>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {profile.services.map((s) => (
              <li key={s.title} className="flex flex-col rounded-3xl border bg-card p-6">
                <NamedIcon name={s.icon} className="mb-4 size-6 text-brand-2-text" />
                <p className="text-lg font-semibold">{s.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {s.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-2" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="interests-title">
          <SectionTitle id="interests" label="Off the clock">Beyond code</SectionTitle>
          <ul className="flex flex-wrap gap-3">
            {profile.interests.map((i) => (
              <li key={i.name} className="flex items-center gap-3 rounded-full border bg-card py-2 pl-3 pr-5">
                <NamedIcon name={i.icon} className="size-4 text-brand-text" />
                <span className="text-sm">
                  <span className="font-medium">{i.name}</span> <span className="text-muted-foreground">- {i.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
