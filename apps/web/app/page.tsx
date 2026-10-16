import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AskBox, JdButton } from "@/components/home/ask-box";
import { DemoButton } from "@/components/home/demo-button";
import { OpenAbiButton } from "@/components/home/open-abi-button";
import { RolePicker, RoleSections, type RoleSection } from "@/components/home/role-page";
import type { Role } from "@/components/home/roles";
import { GithubIcon, NamedIcon } from "@/components/icons";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { contact, experience, getProject, profile, projects, skillCategories, skills, type Project } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata("home");

// Ask-first home: one question box, then a page ABI arranges for who the visitor is.
// Every role's sections are pre-built here, so switching roles never calls the AI.

const LEVEL_ORDER = { Expert: 0, Advanced: 1, Intermediate: 2, Learning: 3 } as const;

const pick = (slugs: string[]) => slugs.map((s) => getProject(s)).filter((p): p is Project => !!p);

function Block({ id, title, note, children }: { id: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4 border-t py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="max-w-3xl">
          <h2 id={`${id}-title`} className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 flex items-start gap-2.5 text-lg leading-relaxed text-muted-foreground">
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-abi" aria-hidden />
            <span>{note}</span>
          </p>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function FeatureProject({ project, flip = false }: { project: Project; flip?: boolean }) {
  return (
    <article className="group relative grid overflow-hidden rounded-3xl border bg-card shadow-sm transition-colors hover:border-border-strong md:grid-cols-2">
      <div className={cn("relative aspect-[16/10] bg-muted md:aspect-auto md:min-h-72", flip && "md:order-2")}>
        <Image src={project.image} alt={`${project.title} screenshot`} fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col gap-3 p-6 sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">
          {project.type === "client" ? "Client work" : "Personal project"} - {project.categories.join(", ")}
        </p>
        <h3 className="text-2xl font-bold tracking-tight">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <p className="leading-relaxed text-muted-foreground">{project.description}</p>
        <p className="mt-auto pt-2 text-sm text-subtle-foreground">{project.tags.join(" - ")}</p>
      </div>
    </article>
  );
}

function ProjectRow({ project, code = false }: { project: Project; code?: boolean }) {
  return (
    <li className="group relative flex items-start gap-4 py-5">
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
          {project.categories.includes("AI") && (
            <span className="rounded-full bg-abi-soft px-2 py-0.5 text-xs font-medium text-abi-text">AI</span>
          )}
        </h3>
        <p className="mt-1 line-clamp-2 text-muted-foreground">{project.description}</p>
      </div>
      {code && project.github ? (
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-border-strong"
        >
          <GithubIcon className="size-4" /> Code
        </a>
      ) : (
        <ArrowUpRight className="mt-1.5 size-5 shrink-0 text-subtle-foreground transition-colors group-hover:text-foreground" aria-hidden />
      )}
    </li>
  );
}

export default function Home() {
  const current = experience.find((e) => e.current)!;
  const years = profile.stats.find((s) => s.key === "yearsExperience")!.value;
  const github = profile.socials.find((s) => s.icon === "github");

  const sections: Record<string, RoleSection> = {
    fit: {
      id: "fit",
      title: "The fit",
      node: (
        <Block id="fit" title="The fit at a glance" note="The facts recruiters usually ask me first.">
          <dl className="grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Role", profile.title],
              ["Right now", `${current.role} at ${current.company}`],
              ["Experience", `${years} years, ${new Set(experience.map((e) => e.company)).size} companies`],
              ["Location", `${profile.location.city}, ${profile.location.country} (IST)`],
              ["Open to", contact.openTo.join(", ")],
              ["Replies", contact.responseTime],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-6">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/resume">View resume</Link>
            </Button>
            <JdButton />
          </div>
        </Block>
      ),
    },
    projects: {
      id: "projects",
      title: "What he shipped",
      node: (
        <Block
          id="projects"
          title="What he has shipped"
          note={`${projects.length} projects, from zero-knowledge encryption to agentic AI platforms. These are the ones he would show you first.`}
        >
          <div className="space-y-5">
            {pick(["secure-vault", "pushable-ai"]).map((p, i) => (
              <FeatureProject key={p.slug} project={p} flip={i % 2 === 1} />
            ))}
          </div>
          <ul className="mt-6 divide-y border-y">
            {pick(["aiyubot", "setu-chat-app", "whatsapp-flowbuilder", "omarentals-ai-repairs-assistant"]).map((p) => (
              <ProjectRow key={p.slug} project={p} />
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="lg">
              <Link href="/projects">
                All {projects.length} projects <ArrowRight aria-hidden />
              </Link>
            </Button>
            <DemoButton />
          </div>
        </Block>
      ),
    },
    services: {
      id: "services",
      title: "What he can build",
      node: (
        <Block id="services" title="What he can build for you" note="Three kinds of work, each with real products behind it.">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "AI agents and chatbots",
                body: "Assistants that know your data and can take actions: RAG, tool calling, LangGraph workflows and voice.",
                examples: pick(["pushable-ai", "uchat-ai-bot", "omarentals-ai-repairs-assistant"]),
              },
              {
                title: "Full stack products",
                body: "SaaS platforms, dashboards and React Native mobile apps, from database to UI.",
                examples: pick(["aiyubot", "smart-exams", "iadm"]),
              },
              {
                title: "DevOps and cloud",
                body: "Docker, Kubernetes and CI/CD pipelines that keep your product fast and online.",
                examples: pick(["pushable-ai", "secure-vault"]),
              },
            ].map((s) => (
              <div key={s.title} className="flex flex-col rounded-3xl border bg-card p-6">
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
                <p className="mt-auto pt-5 text-sm text-muted-foreground">
                  Built:{" "}
                  {s.examples.map((p, i) => (
                    <span key={p.slug}>
                      <Link href={`/projects/${p.slug}`} className="font-medium text-brand-text hover:underline">
                        {p.title}
                      </Link>
                      {i < s.examples.length - 1 && ", "}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </Block>
      ),
    },
    client: {
      id: "client",
      title: "Client products",
      node: (
        <Block id="client" title="Products he built for clients" note="Real businesses, in production. Open any one to see the details.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pick(["pushable-ai", "aiyubot", "omarentals-ai-repairs-assistant", "uchat-ai-bot", "smart-exams", "xceshealth"]).map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
          <div className="mt-6">
            <Button asChild variant="outline" size="lg">
              <Link href="/projects?type=client">
                All client work <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </Block>
      ),
    },
    faq: {
      id: "faq",
      title: "Common questions",
      node: (
        <Block id="faq" title="Before you reach out" note="Answers to what founders ask most. Anything else, just ask me.">
          <div className="divide-y border-y">
            {contact.faqs.map((f) => (
              <details key={f.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.question}
                  <span className="text-2xl font-normal text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{f.answer}</p>
              </details>
            ))}
          </div>
        </Block>
      ),
    },
    ai: {
      id: "ai",
      title: "How this AI works",
      node: (
        <Block id="ai" title="How I work, under the hood" note="He built me. This is what happens every time you ask me something.">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Understand", "I rewrite your question so it stands on its own, even as a follow-up."],
              ["Search", "Hybrid search over his real data in Postgres: pgvector embeddings plus full-text, merged by rank fusion."],
              ["Act", "A LangGraph agent with 14 tools. I can filter projects, compare them, show code or match a job description."],
              ["Answer", "I stream the answer with sources. Open “How I answered” to see every step."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-3xl border bg-card p-6">
                <p className="grid size-9 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">{i + 1}</p>
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <OpenAbiButton prompt="Compare Secure Vault and Pushable.ai">Try it: compare two projects</OpenAbiButton>
            <Button asChild variant="outline" size="lg">
              <Link href="/lab">Look inside the AI Lab</Link>
            </Button>
          </div>
        </Block>
      ),
    },
    personal: {
      id: "personal",
      title: "Open source",
      node: (
        <Block id="personal" title="What he builds for fun" note="His own projects, with the source code open.">
          <ul className="divide-y border-y">
            {projects
              .filter((p) => p.type === "personal" && p.github)
              .slice(0, 6)
              .map((p) => (
                <ProjectRow key={p.slug} project={p} code />
              ))}
          </ul>
          {github && (
            <div className="mt-6">
              <Button asChild variant="outline" size="lg">
                <a href={github.url} target="_blank" rel="noopener noreferrer">
                  <GithubIcon className="size-4" /> {github.username} on GitHub
                </a>
              </Button>
            </div>
          )}
        </Block>
      ),
    },
    experience: {
      id: "experience",
      title: "Experience",
      node: (
        <Block
          id="experience"
          title="Where he has worked"
          note={`From intern in 2022 to ${current.role} today, across ${new Set(experience.map((e) => e.company)).size} companies.`}
        >
          <ol className="divide-y border-y">
            {experience.map((e) => (
              <li key={e.slug} className="grid gap-1 py-5 sm:grid-cols-[170px_1fr] sm:gap-6">
                <p className="text-sm text-muted-foreground">{e.period}</p>
                <div>
                  <h3 className="font-semibold">
                    {e.role} <span className="font-normal text-muted-foreground">at {e.company}</span>
                    {e.current && <span className="ml-2 rounded-full bg-abi-soft px-2 py-0.5 text-xs font-medium text-abi-text">now</span>}
                  </h3>
                  <p className="mt-1 text-muted-foreground">{e.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6">
            <Link href="/about" className="font-medium text-brand-text hover:underline">
              The full story, education and values <ArrowRight className="inline size-4" aria-hidden />
            </Link>
          </p>
        </Block>
      ),
    },
    stack: {
      id: "stack",
      title: "Stack",
      node: (
        <Block
          id="stack"
          title="What he works with"
          note={`${skills.length} technologies. Darker names are the ones he uses at an expert or advanced level.`}
        >
          <dl className="divide-y border-y">
            {skillCategories.map((c) => {
              const list = skills.filter((s) => s.category === c.id).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
              return (
                <div key={c.id} className="grid gap-2 py-4 sm:grid-cols-[140px_1fr]">
                  <dt className="font-semibold">
                    <Link href={`/skills?category=${c.id.toLowerCase()}`} className="hover:underline">
                      {c.label}
                    </Link>
                  </dt>
                  <dd className="leading-relaxed">
                    {list.map((s, i) => (
                      <span key={s.slug} className={LEVEL_ORDER[s.level] <= 1 ? "text-foreground" : "text-subtle-foreground"}>
                        {s.name}
                        {i < list.length - 1 && <span className="text-subtle-foreground">, </span>}
                      </span>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Block>
      ),
    },
    contact: {
      id: "contact",
      title: "Contact",
      node: (
        <Block
          id="contact"
          title="Let's talk"
          note={`He is open to ${contact.openTo.join(", ").toLowerCase()} and usually replies ${contact.responseTime.toLowerCase()}. I can also draft the message for you.`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <a href={`mailto:${profile.email}`} className="group rounded-3xl border bg-card p-6 transition-colors hover:border-border-strong">
              <Mail className="size-5 text-brand-text" aria-hidden />
              <p className="mt-4 font-semibold">Email</p>
              <p className="break-all text-muted-foreground group-hover:text-foreground">{profile.email}</p>
            </a>
            <Link href="/contact" className="group rounded-3xl border bg-card p-6 transition-colors hover:border-border-strong">
              <ArrowUpRight className="size-5 text-brand-text" aria-hidden />
              <p className="mt-4 font-semibold">Contact form</p>
              <p className="text-muted-foreground group-hover:text-foreground">Works even when I&apos;m offline.</p>
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {profile.socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <NamedIcon name={s.icon} className="size-4" />
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </Block>
      ),
    },
  };

  const orders: Record<Role, string[]> = {
    everyone: ["projects", "ai", "experience", "stack", "contact"],
    recruiter: ["fit", "experience", "projects", "stack", "contact"],
    founder: ["services", "client", "faq", "contact"],
    developer: ["ai", "personal", "stack", "contact"],
  };

  const intros: Record<Role, string> = {
    everyone: "The short version: what he has shipped, how I work, where he has worked and what he works with. Ask me anything along the way.",
    recruiter: "The fit at a glance first, then his experience, proof of work and stack. Paste a job description and I will match it against his profile.",
    founder: `What he can build for you, products he has already shipped for clients, and how to start. He usually replies ${contact.responseTime.toLowerCase()}.`,
    developer: "How I work under the hood, the projects he builds for fun with open source code, and his full stack.",
  };

  return (
    <>
      <section aria-labelledby="hero-title" className="pb-20 pt-32 sm:pb-24 sm:pt-40">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-8">
          <p className="inline-flex items-center gap-2.5 rounded-full border bg-card py-1.5 pl-1.5 pr-4 text-sm text-muted-foreground">
            <span className="grid size-6 place-items-center rounded-full bg-primary" aria-hidden>
              <span className="size-2 rounded-full bg-abi" />
            </span>
            <span>
              Hi, I&apos;m <strong className="font-semibold text-foreground">ABI</strong>, Abhishek&apos;s AI agent
            </span>
          </p>
          <h1 id="hero-title" className="mt-8 text-balance text-[2.6rem] font-bold leading-[1.06] tracking-[-0.025em] sm:text-6xl md:text-7xl">
            Ask me anything about <span className="text-brand-text">Abhishek Patel</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            He is a {profile.title} in {profile.location.city} who builds AI agents, the products around them and the cloud they
            run on.
          </p>
          <div className="mx-auto mt-10 max-w-3xl text-left">
            <AskBox />
          </div>
          <div className="mt-14">
            <p className="font-medium text-muted-foreground">Or tell me who you are, and I&apos;ll arrange this page for you.</p>
            <div className="mt-4">
              <RolePicker />
            </div>
          </div>
        </div>
      </section>

      <RoleSections sections={sections} orders={orders} intros={intros} />
    </>
  );
}
