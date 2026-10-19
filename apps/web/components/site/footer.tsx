import { ArrowUpRight, GitBranch, GitCommitHorizontal } from "lucide-react";
import Link from "next/link";
import { NamedIcon } from "@/components/icons";
import { bannerStyle } from "@/components/projects/project-banner";
import { contact, experience, getProject, profile, projects } from "@/lib/content";
import { AskAbiCard, BackToTop, CopyEmail } from "./footer-actions";
import { FooterTerminal, type Ship } from "./footer-terminal";

// The "Workshop" footer: a commit lane of everything shipped glides past, a build receipt
// carries the real contact facts, and the links are grouped as branches.

const YEAR = new Date().getFullYear();

/** A short, stable fake commit hash per project (for looks only). */
function hash(slug: string) {
  let h = 2166136261;
  for (const ch of slug) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

function Commit({ slug, title, type }: { slug: string; title: string; type: string }) {
  return (
    <Link
      href={`/projects/${slug}`}
      tabIndex={-1}
      className="commit group relative flex shrink-0 flex-col items-start pt-6"
      style={{ "--tone": bannerStyle(slug).tone } as React.CSSProperties}
    >
      <span className="commit__dot absolute left-4 top-0 -translate-y-1/2" />
      <span className="rounded-xl border bg-card px-3 py-2 transition-colors group-hover:border-(--tone)">
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-subtle-foreground">
          <GitCommitHorizontal className="size-3" /> {hash(slug)}
        </span>
        <span className="mt-0.5 block whitespace-nowrap text-sm font-medium">
          <span className="text-brand-text">ship:</span> {title}
        </span>
        <span className="block text-[11px] text-muted-foreground">{type === "client" ? "client product" : "own build"}</span>
      </span>
    </Link>
  );
}

// Outside /projects only his own builds are shown; client work stays on the projects page.
const hobby = projects.filter((p) => p.type === "personal");

/** Every hobby project as a commit on one long lane, gliding past. Decorative; hover pauses it. */
function CommitLane() {
  return (
    <div data-motion className="commit-lane relative overflow-hidden pb-2 pt-8" aria-hidden>
      <span className="commit-lane__line absolute inset-x-0 top-8" />
      <div className="commit-lane__track flex w-max gap-4 pr-4">
        {[...hobby, ...hobby].map((p, i) => (
          <Commit key={i} slug={p.slug} title={p.title} type={p.type} />
        ))}
      </div>
    </div>
  );
}

/** A small activity grid, like a contribution graph, that ripples slowly. Decorative. */
function Activity() {
  const cells = Array.from({ length: 7 * 16 }, (_, i) => ((i * 7919) % 11) / 10);
  return (
    <div data-motion className="activity grid grid-flow-col grid-rows-7 gap-[3px]" aria-hidden>
      {cells.map((v, i) => (
        <i key={i} style={{ "--v": v, "--i": (i % 16) + Math.floor(i / 7) } as React.CSSProperties} />
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 py-2.5">
      <dt className="text-xs font-medium text-subtle-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

function Receipt() {
  return (
    <div className="receipt relative rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <span className="text-sm font-semibold">Build receipt</span>
        <span className="font-mono text-[11px] text-subtle-foreground">No. TAP-{YEAR}</span>
      </div>
      <div className="receipt__cut relative mx-5 border-t border-dashed" />
      <dl className="divide-y px-5 py-1">
        <Row label="Built by">
          {profile.name} <span className="text-muted-foreground">({profile.brand})</span>
        </Row>
        <Row label="Based in">
          {profile.location.city}, {profile.location.country} <span className="text-muted-foreground">(IST)</span>
        </Row>
        <Row label="Open to">{contact.openTo.join(", ")}</Row>
        <Row label="Replies">{contact.responseTime}</Row>
        <Row label="Reach me">
          <CopyEmail email={profile.email} />
        </Row>
      </dl>
      <div className="flex items-end justify-between gap-4 border-t border-dashed px-5 py-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Online and building
        </span>
        <Activity />
      </div>
    </div>
  );
}

const BRANCHES: { name: string; title: string; links: { label: string; href: string }[] }[] = [
  {
    name: "main",
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Projects", href: "/projects" },
      { label: "Skills", href: "/skills" },
      { label: "About", href: "/about" },
    ],
  },
  {
    name: "work",
    title: "Go deeper",
    links: [
      { label: "AI Lab", href: "/lab" },
      { label: "Resume", href: "/resume" },
      { label: "Talk to ABI", href: "/abi" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

function BranchLink({ label, href }: { label: string; href: string }) {
  const external = href.startsWith("http");
  const className = "group/link inline-flex min-h-8 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground";
  const arrow = <ArrowUpRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100" aria-hidden />;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      {arrow}
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
      {arrow}
    </Link>
  );
}

/** What is happening right now: the current role and the newest thing shipped. */
function Now() {
  const current = experience.find((e) => e.current);
  const latest = getProject("secure-vault") ?? projects[0];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {current && (
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium text-subtle-foreground">Now</p>
          <p className="mt-1 text-sm font-semibold">{current.role}</p>
          <p className="text-sm text-muted-foreground">at {current.company}, since {current.period.split(" - ")[0]}</p>
        </div>
      )}
      <Link href={`/projects/${latest.slug}`} className="group rounded-2xl border bg-card p-4 transition-colors hover:border-brand/50">
        <p className="text-xs font-medium text-subtle-foreground">Latest ship</p>
        <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
          {latest.title}
          <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </p>
        <p className="line-clamp-1 text-sm text-muted-foreground">{latest.tags.slice(0, 3).join(", ")}</p>
      </Link>
    </div>
  );
}

/** Projects with a live address, for the terminal to ship. */
const ships: Ship[] = hobby
  .filter((p) => p.demo)
  .slice(0, 8)
  .map((p) => ({ title: p.title, slug: p.slug, host: p.demo.replace(/^https?:\/\//, "").replace(/\/.*$/, "") }));

export function Footer() {
  return (
    <footer className="relative border-t bg-background-deep">
      <CommitLane />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <div className="space-y-8">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
                <span className="relative grid size-8 place-items-center rounded-full bg-brand">
                  <span className="size-3 rounded-full bg-background/90" />
                </span>
                {profile.brand}
              </Link>
              <p className="text-balance font-display text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                Ideas in. <span className="text-brand-text">Working products out.</span>
              </p>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {profile.name}, {profile.title}. I build AI agents, the products around them and the cloud they run on.
              </p>
            </div>
            <Receipt />
          </div>

          <div className="flex flex-col gap-6">
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {BRANCHES.map((b) => (
                <div key={b.name} className="border-l pl-4">
                  <p className="flex items-center gap-1.5 font-mono text-xs text-brand-text">
                    <GitBranch className="size-3.5" aria-hidden /> {b.name}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">{b.title}</h3>
                  <ul className="mt-3 space-y-1">
                    {b.links.map((l) => (
                      <li key={l.href}>
                        <BranchLink {...l} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="border-l pl-4">
                <p className="flex items-center gap-1.5 font-mono text-xs text-brand-text">
                  <GitBranch className="size-3.5" aria-hidden /> connect
                </p>
                <h3 className="mt-1 text-sm font-semibold">Elsewhere</h3>
                <ul className="mt-3 space-y-1">
                  {profile.socials.map((s) => (
                    <li key={s.name}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-8 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <NamedIcon name={s.icon} className="size-3.5" />
                        {s.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
            <div className="flex flex-1 flex-col gap-3">
              <FooterTerminal ships={ships} />
              <Now />
              <AskAbiCard />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-relaxed text-subtle-foreground">
            (c) {YEAR} {profile.brand}. Built with Next.js, FastAPI and LangGraph.{" "}
            <span className="hidden sm:inline">Press Ctrl/Cmd + K to search, or hold Space to talk to ABI.</span>
            <span className="sm:hidden">Tap the robot to explore or talk to ABI.</span>
          </p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
