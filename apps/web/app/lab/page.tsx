import { Brain, Database, FileSearch, MessageSquareText, Mic, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { GuardDemo, JdDemo, RagInspector } from "@/components/lab/lab-demos";
import { OpenAbiButton } from "@/components/home/open-abi-button";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("lab");

// The AI Lab: ABI taken apart. The hero x-rays the path every question takes; below, three
// stations let visitors poke at the real pieces (the guard, retrieval, job matching).

const PIPELINE = [
  { icon: MessageSquareText, label: "Your question", note: "text or voice", href: "#guard" },
  { icon: ShieldCheck, label: "Guard", note: "blocks prompt injection", href: "#guard" },
  { icon: FileSearch, label: "Retrieve", note: "hybrid search", href: "#rag" },
  { icon: Waypoints, label: "Agent", note: "LangGraph, 20 tools", href: "#jd" },
  { icon: Sparkles, label: "Answer", note: "with sources", href: "#jd" },
];

const STACK = [
  { icon: Brain, name: "gpt-oss-120b on Groq", role: "Answers and tool calls" },
  { icon: Waypoints, name: "LangGraph", role: "The agent loop" },
  { icon: Database, name: "pgvector on Neon", role: "Hybrid search over my data" },
  { icon: Sparkles, name: "Gemini embeddings", role: "Meaning as numbers" },
  { icon: ShieldCheck, name: "Llama Prompt Guard 2", role: "Screens every message" },
  { icon: Mic, name: "Whisper + Orpheus", role: "Ears and voice" },
];

export default function LabPage() {
  return (
    <>
      <section aria-labelledby="lab-title" className="relative overflow-hidden pb-16 pt-28 sm:pt-36">
        <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
          <div className="max-w-3xl">
            <p data-intro className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-success" aria-hidden /> AI Lab, running on the same backend as ABI
            </p>
            <h1
              id="lab-title"
              data-intro
              style={{ "--d": 1 } as React.CSSProperties}
              className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-7xl"
            >
              Take ABI apart. <span className="text-brand-text">Poke at the pieces.</span>
            </h1>
            <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every question to ABI travels the same path. Watch it below, then try to break the guard, see what it reads, and
              match it against a real job.
            </p>
          </div>

          {/* The x-ray: a packet travels the pipeline while a scan line sweeps across it. */}
          <div data-intro="scale" data-motion style={{ "--d": 3 } as React.CSSProperties} className="xray relative mt-14 overflow-hidden rounded-3xl border bg-card/70 p-5 backdrop-blur sm:p-8">
            <span className="xray__scan pointer-events-none absolute inset-y-0 w-24" aria-hidden />
            <ol className="relative grid grid-cols-1 gap-3 sm:grid-cols-5 sm:gap-0">
              {PIPELINE.map((p, i) => (
                <li key={p.label} className="xray__node relative flex items-center gap-3 sm:flex-col sm:text-center" style={{ "--i": i } as React.CSSProperties}>
                  {i < PIPELINE.length - 1 && <span className="xray__wire absolute hidden sm:block" aria-hidden />}
                  <a href={p.href} className="xray__dot relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border bg-background">
                    <p.icon className="size-5" aria-hidden />
                  </a>
                  <span>
                    <span className="block font-semibold sm:mt-3">{p.label}</span>
                    <span className="block text-sm text-muted-foreground">{p.note}</span>
                  </span>
                </li>
              ))}
              <span className="xray__packet absolute hidden sm:block" aria-hidden />
            </ol>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 pb-24 sm:px-8 sm:space-y-28">
        <GuardDemo />
        <RagInspector />
        <JdDemo />
      </div>

      <section aria-labelledby="stack-title" className="border-t bg-background-deep py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p data-reveal className="text-sm font-semibold text-brand-text">
            Under the hood
          </p>
          <h2 id="stack-title" data-reveal style={{ "--d": 1 } as React.CSSProperties} className="mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Free-tier models, real engineering.
          </h2>
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map((s, i) => (
              <li key={s.name} data-reveal style={{ "--d": i % 3, "--tone": `var(--tone-${(i % 6) + 1})` } as React.CSSProperties} className="value group relative flex items-center gap-4 overflow-hidden rounded-3xl border bg-card p-5">
                <span className="value__icon grid size-12 shrink-0 place-items-center rounded-2xl">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-bold">{s.name}</span>
                  <span className="block text-sm text-muted-foreground">{s.role}</span>
                </span>
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-10">
            <OpenAbiButton prompt="How do you work under the hood? Walk me through one question.">Ask ABI how it works</OpenAbiButton>
          </div>
        </div>
      </section>
    </>
  );
}
