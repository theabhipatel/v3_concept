import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { AbiFlow } from "@/components/home/abi-flow";
import { AskBox } from "@/components/home/ask-box";
import { BuildLoop, type Build } from "@/components/home/build-loop";
import { CraftGrid, type Craft } from "@/components/home/craft";
import { DemoButton } from "@/components/home/demo-button";
import { OpenAbiButton } from "@/components/home/open-abi-button";
import { StackMarquee } from "@/components/home/stack-marquee";
import { ProjectBanner } from "@/components/projects/project-banner";
import { Button } from "@/components/ui/button";
import { contact, experience, getProject, profile, projects, skills, type Project } from "@/lib/content";
import { CountUp } from "@/components/site/count-up";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("home");

// The home page shows the work happening instead of listing it: a live build loop in the hero,
// a small animated scene per kind of work, designed project banners and a story of the years.

// Home shows only the projects he built for himself; client work lives on /projects.
const pick = (slugs: string[]) => slugs.map((s) => getProject(s)).filter((p): p is Project => !!p && p.type === "personal");
const links = (slugs: string[]) => pick(slugs).map((p) => ({ title: p.title, href: `/projects/${p.slug}` }));
/** "Freelance projects" > "freelance projects", but "AI consulting" stays as it is. */
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function buildsFor(): Build[] {
  const steps: Omit<Build, "title" | "host" | "tags">[] = [
    {
      slug: "secure-vault",
      from: "Own idea",
      brief: "A team vault for docs and .env secrets that even the server can never read.",
      plan: [
        { icon: "ui", label: "React client" },
        { icon: "ai", label: "In-browser crypto" },
        { icon: "api", label: "FastAPI" },
        { icon: "db", label: "Audit log" },
      ],
      code: ["# sealed in the browser", "key = argon2id(password, salt)", "box = aes_gcm(key).seal(doc)", "await vault.put(box)"],
    },
    {
      slug: "whatsapp-flowbuilder",
      from: "Own idea",
      brief: "Draw a WhatsApp bot as a flow of boxes, connect an account, and it just runs.",
      plan: [
        { icon: "flow", label: "Flow canvas" },
        { icon: "api", label: "Node + Express" },
        { icon: "ai", label: "WhatsApp API" },
        { icon: "db", label: "MongoDB" },
      ],
      code: ["// one step of the bot", "const node = flow.next(msg);", "await wa.send(to, node.reply);", "await session.save(node);"],
    },
    {
      slug: "setu-chat-app",
      from: "Own idea",
      brief: "A chat app with private and group rooms, where every message shows up instantly.",
      plan: [
        { icon: "ui", label: "Next.js UI" },
        { icon: "flow", label: "Realtime rooms" },
        { icon: "api", label: "Express API" },
        { icon: "db", label: "MongoDB" },
      ],
      code: ["supabase.channel(room)", '  .on("INSERT", render)', "  .subscribe();", "await send(room, text);"],
    },
    {
      slug: "blinkit-clone",
      from: "Own idea",
      brief: "A quick commerce app, from the cart all the way to a real PhonePe payment.",
      plan: [
        { icon: "ui", label: "React storefront" },
        { icon: "api", label: "Node + Express" },
        { icon: "ops", label: "PhonePe payments" },
        { icon: "db", label: "MongoDB" },
      ],
      code: ["// checkout", "const pay = await phonepe({", "  amount: cart.total,", "});", "res.json({ url: pay.url });"],
    },
  ];
  return steps.flatMap((s) => {
    const p = pick([s.slug])[0];
    if (!p) return [];
    return [{ ...s, title: p.title, host: p.demo ? host(p.demo) : host(p.github), tags: p.tags }];
  });
}

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

export default function Home() {
  const current = experience.find((e) => e.current)!;
  const stat = (key: string) => profile.stats.find((s) => s.key === key)!;
  const companies = new Set(experience.map((e) => e.company)).size;
  const hobby = projects.filter((p) => p.type === "personal").length;
  const toolbox = skills.filter((s) => s.level === "Expert" || s.level === "Advanced");

  const crafts: Craft[] = [
    {
      scene: "agent",
      title: "AI agents that do the work",
      body: "Assistants that know your data and take real actions: RAG, tool calling, LangGraph workflows and voice.",
      examples: [{ title: "ABI, the agent on this site", href: "/abi" }, ...links(["theabhipatel-v2"])],
    },
    {
      scene: "product",
      title: "Products people use daily",
      body: "SaaS platforms, dashboards and React Native apps, from the database to the last pixel.",
      examples: links(["setu-chat-app", "blinkit-clone", "developers-blog"]),
    },
    {
      scene: "ship",
      title: "Cloud that stays up",
      body: "Docker, Kubernetes and CI/CD pipelines, so every change ships safely and the product stays fast.",
      examples: links(["secure-vault", "theabhipatel-v2"]),
    },
  ];

  const [lead, second, ...rest] = pick(["secure-vault", "whatsapp-flowbuilder", "setu-chat-app", "blinkit-clone", "developers-blog", "react-dashboard"]);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="hero relative overflow-hidden pb-16 pt-24 sm:pb-24 sm:pt-36">
        <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8">
          <p data-intro className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            {profile.name}, {profile.title} in {profile.location.city}
          </p>
          <h1
            id="hero-title"
            data-intro
            style={{ "--d": 1 } as React.CSSProperties}
            className="mt-6 text-balance text-[2.6rem] font-bold leading-[1.04] tracking-[-0.03em] sm:mt-8 sm:text-6xl md:text-7xl"
          >
            I turn ideas into <span className="text-brand-text">AI products</span> that ship.
          </h1>
          <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Agents, the products around them and the cloud they run on. Watch one get built below, or ask ABI, my AI agent, anything.
          </p>
          <div data-intro style={{ "--d": 3 } as React.CSSProperties} className="mx-auto mt-8 max-w-3xl text-left sm:mt-10">
            <AskBox />
          </div>
        </div>
        <div data-intro="scale" style={{ "--d": 4 } as React.CSSProperties} className="relative mt-14 px-4 sm:mt-20 sm:px-8">
          <BuildLoop builds={buildsFor()} />
        </div>
      </section>

      {/* Toolbox */}
      <section aria-label="Toolbox" className="border-y bg-background-deep py-10">
        <StackMarquee skills={toolbox} />
      </section>

      {/* What I do */}
      <section aria-labelledby="craft-title" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Heading id="craft-title" eyebrow="What I do" title="Three kinds of work. Real products behind each." />
          <div className="mt-12">
            <CraftGrid items={crafts} />
          </div>
        </div>
      </section>

      {/* Work */}
      <section aria-labelledby="work-title" className="border-t py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading
              id="work-title"
              eyebrow="Built for fun"
              title="From zero-knowledge vaults to WhatsApp bot builders."
              note={`${hobby} projects I built on my own time, just to build them. Professional work lives on the projects page.`}
            />
            <Button asChild variant="outline" size="lg" data-reveal>
              <Link href="/projects">
                All {projects.length} projects <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {[lead, second].map((p, i) => (
              <div key={p.slug} data-reveal style={{ "--d": i } as React.CSSProperties}>
                <ProjectBanner project={p} size="lg" className="h-full" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((p, i) => (
              <div key={p.slug} data-reveal style={{ "--d": i } as React.CSSProperties}>
                <ProjectBanner project={p} className="h-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track record */}
      <section aria-labelledby="years-title" className="border-t bg-background-deep py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Heading
              id="years-title"
              eyebrow="The road so far"
              title={`From intern to ${current.role}.`}
              note={`${stat("yearsExperience").value} years of shipping across ${companies} companies. Today I build AI products at ${current.company}.`}
            />
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border bg-border">
              {[stat("yearsExperience"), stat("projectsCompleted"), stat("technologies"), stat("companies")].map((s, i) => (
                <div key={s.key} data-reveal style={{ "--d": i } as React.CSSProperties} className="bg-card p-6">
                  <dd className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                    <CountUp value={s.value} />
                  </dd>
                  <dt className="mt-1 text-sm text-muted-foreground">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <ol className="timeline relative space-y-8 pl-8" data-reveal="line">
            {experience.map((e, i) => (
              <li key={e.slug} data-reveal style={{ "--d": i + 1 } as React.CSSProperties} className="relative">
                <span className={e.current ? "timeline__dot timeline__dot--now" : "timeline__dot"} aria-hidden />
                <p className="text-sm text-muted-foreground">{e.period}</p>
                <h3 className="mt-1 text-lg font-semibold">
                  {e.role} <span className="font-normal text-muted-foreground">at {e.company}</span>
                </h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{e.description}</p>
              </li>
            ))}
            <li data-reveal style={{ "--d": experience.length + 1 } as React.CSSProperties}>
              <Link href="/about" className="inline-flex items-center gap-1.5 font-medium text-brand-text hover:underline">
                The whole story <ArrowRight className="size-4" aria-hidden />
              </Link>
            </li>
          </ol>
        </div>
      </section>

      {/* ABI */}
      <section aria-labelledby="abi-title" className="border-t py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Heading
            id="abi-title"
            eyebrow="This website thinks"
            title="Meet ABI, the agent I built into it."
            note="ABI reads my real work, answers with sources, and can drive this site for you: open pages, scroll, click and fill forms, by text or voice."
          />
          <div className="mt-12">
            <AbiFlow />
          </div>
          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            <OpenAbiButton prompt="Compare Secure Vault and WhatsApp Flowbuilder">Ask ABI to compare two projects</OpenAbiButton>
            <DemoButton />
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section aria-labelledby="cta-title" className="px-4 pb-24 sm:px-8 sm:pb-32">
        <div data-reveal="scale" data-motion className="cta relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="cta__rings pointer-events-none absolute inset-0" aria-hidden />
          <h2 id="cta-title" className="relative text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Have something to build?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            I am open to {contact.openTo.map(lowerFirst).join(", ")}, and I reply {lowerFirst(contact.responseTime)}.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contact">
                Start a project <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`mailto:${profile.email}`}>
                <Mail aria-hidden /> {profile.email}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
