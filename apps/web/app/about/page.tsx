import { ArrowRight, GraduationCap, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Chapters, LocalTime, type Chapter } from "@/components/about/about-parts";
import { AskAbi } from "@/components/abi/ask-abi";
import { OpenAbiButton } from "@/components/home/open-abi-button";
import { NamedIcon } from "@/components/icons";
import { CountUp } from "@/components/site/count-up";
import { Button } from "@/components/ui/button";
import { contact, experience, profile } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata("about");

// About introduces Abhishek as a person: a warm intro, his story in chapters, the journey from
// college to today, how he works, and what he loves away from the keyboard.

const ROLES = ["AI agents", "full stack products", "cloud pipelines", "things that ship"];
const CHAPTER_TITLES = ["Curious about how things work", "From products to platforms", "Learning in public", "Away from the keyboard"];

function Heading({ eyebrow, title, note, id }: { eyebrow: string; title: string; note?: string; id: string }) {
  return (
    <div className="max-w-3xl">
      <p data-reveal className="text-sm font-semibold text-brand-text">
        {eyebrow}
      </p>
      <h2 id={id} data-reveal style={{ "--d": 1 } as React.CSSProperties} className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {note && (
        <p data-reveal style={{ "--d": 2 } as React.CSSProperties} className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}

export default function AboutPage() {
  const first = profile.name.split(" ")[0];
  const current = experience.find((e) => e.current);
  const chapters: Chapter[] = profile.longBio.map((text, i) => ({ id: `chapter-${i + 1}`, title: CHAPTER_TITLES[i] ?? `Chapter ${i + 1}`, text }));

  // The journey, oldest first: college, then every role up to today.
  const journey = [
    ...profile.education.map((ed) => ({
      key: ed.degree,
      year: ed.year,
      title: ed.degree,
      place: ed.institution,
      body: ed.description,
      highlights: [] as string[],
      tech: [] as string[],
      now: false,
      school: true,
    })),
    ...[...experience].reverse().map((e) => ({
      key: e.slug,
      year: e.period,
      title: e.role,
      place: e.company,
      body: e.description,
      highlights: e.highlights,
      tech: e.technologies,
      now: e.current,
      school: false,
    })),
  ];

  return (
    <>
      {/* Intro */}
      <section aria-labelledby="about-title" className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
        <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p data-intro className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
              <MapPin className="size-3.5 text-brand-text" aria-hidden />
              <LocalTime city={profile.location.city} timeZone="Asia/Kolkata" />
            </p>
            <h1
              id="about-title"
              data-intro
              style={{ "--d": 1 } as React.CSSProperties}
              className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-7xl"
            >
              Hi, I&apos;m {first}.
            </h1>
            <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              <span className="text-muted-foreground">I build </span>
              <span className="rotator" aria-label={ROLES.join(", ")}>
                <span className="rotator__track" aria-hidden>
                  {[...ROLES, ROLES[0]].map((r, i) => (
                    <span key={i} className="rotator__word text-brand-text">
                      {r}.
                    </span>
                  ))}
                </span>
              </span>
            </p>
            <p data-intro style={{ "--d": 3 } as React.CSSProperties} className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
            <div data-intro style={{ "--d": 4 } as React.CSSProperties} className="mt-8 flex flex-wrap gap-3">
              <OpenAbiButton prompt={`Tell me about ${first} in 30 seconds`}>Ask ABI about me</OpenAbiButton>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">
                  Say hello <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          <div data-intro="scale" style={{ "--d": 3 } as React.CSSProperties} className="mx-auto w-full max-w-64 sm:max-w-sm">
            <div className="id-card relative overflow-hidden rounded-4xl border bg-card p-3 shadow-lg">
              <div className="relative aspect-4/5 overflow-hidden rounded-[1.5rem] bg-muted">
                <Image src={profile.avatar} alt={profile.name} fill sizes="(min-width: 1024px) 384px, 90vw" className="object-cover" priority />
                <span className="id-card__shine pointer-events-none absolute inset-0" aria-hidden />
              </div>
              <div className="flex items-end justify-between gap-3 px-2 pb-1 pt-4">
                <div>
                  <p className="font-display text-lg font-bold leading-tight">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.title}</p>
                </div>
                {current && (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                    <span className="size-1.5 rounded-full bg-success" /> {current.company}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section aria-label="In numbers" className="border-y bg-background-deep">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:grid-cols-5 sm:px-8">
          {profile.stats.map((s, i) => (
            <div key={s.key} data-reveal style={{ "--d": i } as React.CSSProperties} className="py-5 sm:py-10">
              <dd className="font-display text-4xl font-bold tracking-tight">
                <CountUp value={s.value} />
              </dd>
              <dt className="mt-1 text-sm text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Story */}
      <section aria-labelledby="story-title" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Heading id="story-title" eyebrow="My story" title="How I got here, in four short chapters." />
          <div className="mt-16">
            <Chapters chapters={chapters} />
          </div>
        </div>
      </section>

      {/* Journey */}
      <section aria-labelledby="journey-title" className="border-t bg-background-deep py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Heading
            id="journey-title"
            eyebrow="The journey"
            title={`From a science degree to ${current?.role ?? profile.title}.`}
            note="Every step, oldest first. Ask ABI about any of them."
          />
          <ol className="timeline relative mt-14 space-y-6 pl-8" data-reveal="line">
            {journey.map((j, i) => (
              <li key={j.key} data-reveal style={{ "--d": i % 2 } as React.CSSProperties} className="group relative">
                <span className={cn("timeline__dot top-8", j.now && "timeline__dot--now")} aria-hidden />
                <article className="rounded-3xl border bg-card p-6 transition-colors hover:border-border-strong sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        {j.school && <GraduationCap className="size-4 text-brand-text" aria-hidden />}
                        {j.year}
                        {j.now && <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">now</span>}
                      </p>
                      <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                        {j.title} <span className="font-normal text-muted-foreground">at {j.place}</span>
                      </h3>
                    </div>
                    {!j.school && (
                      <AskAbi
                        prompt={`What did ${first} do as ${j.title} at ${j.place}?`}
                        className="sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                      />
                    )}
                  </div>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{j.body}</p>
                  {j.highlights.length > 0 && (
                    <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                      {j.highlights.map((h) => (
                        <li key={h} className="flex gap-2.5">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  {j.tech.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies">
                      {j.tech.map((t) => (
                        <li key={t} className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How I work */}
      <section aria-labelledby="values-title" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Heading id="values-title" eyebrow="How I work" title="Four things I care about on every project." />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {profile.values.map((v, i) => (
              <li
                key={v.title}
                data-reveal
                style={{ "--d": i, "--tone": `var(--tone-${i + 1})` } as React.CSSProperties}
                className="value group relative overflow-hidden rounded-3xl border bg-card p-6"
              >
                <span className="value__icon grid size-12 place-items-center rounded-2xl">
                  <NamedIcon name={v.icon} className="size-5" />
                </span>
                <p className="mt-6 text-lg font-bold">{v.title}</p>
                <p className="mt-2 leading-relaxed text-muted-foreground">{v.description}</p>
              </li>
            ))}
          </ul>

          <div className="mt-20">
            <Heading id="services-title" eyebrow="What I can do for you" title="Where I help teams most." />
            <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border bg-border md:grid-cols-2">
              {profile.services.map((s, i) => (
                <li key={s.title} data-reveal style={{ "--d": i % 2 } as React.CSSProperties} className="bg-card p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <NamedIcon name={s.icon} className="size-5 text-brand-text" />
                    <p className="text-lg font-bold">{s.title}</p>
                  </div>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{s.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {s.features.map((f) => (
                      <li key={f} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                        {f}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Off the clock */}
      <section aria-labelledby="life-title" className="border-t bg-background-deep py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Heading id="life-title" eyebrow="Off the clock" title="When I'm not building." />
          <ul data-motion className="mt-12 flex flex-wrap justify-center gap-3 sm:gap-4">
            {profile.interests.map((it, i) => (
              <li
                key={it.name}
                data-reveal
                style={{ "--d": i, "--i": i, "--tone": `var(--tone-${(i % 6) + 1})` } as React.CSSProperties}
                className="interest flex items-center gap-3 rounded-2xl border bg-card py-3 pl-3 pr-5"
              >
                <span className="interest__icon grid size-10 place-items-center rounded-xl">
                  <NamedIcon name={it.icon} className="size-4" />
                </span>
                <span>
                  <span className="block font-semibold">{it.name}</span>
                  <span className="block text-sm text-muted-foreground">{it.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Call to action */}
      <section aria-labelledby="about-cta" className="px-4 py-24 sm:px-8 sm:py-32">
        <div data-reveal="scale" data-motion className="cta relative mx-auto max-w-6xl overflow-hidden rounded-4xl border bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="cta__rings pointer-events-none absolute inset-0" aria-hidden />
          <h2 id="about-cta" className="relative text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Now you know me. Let&apos;s talk.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            I reply {contact.responseTime.toLowerCase()}. Or ask ABI anything about my work first.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contact">
                Get in touch <ArrowRight aria-hidden />
              </Link>
            </Button>
            <OpenAbiButton>Talk to ABI</OpenAbiButton>
          </div>
        </div>
      </section>
    </>
  );
}
