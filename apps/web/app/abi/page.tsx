import { Cpu, Database, MousePointer2, Mic, ShieldCheck, Wand2 } from "lucide-react";
import { AbiBot } from "@/components/abi/abi-bot";
import { AbiWorkspace } from "@/components/abi/abi-workspace";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("abi");

const CAPABILITIES = [
  { icon: Database, title: "Grounded answers", text: "Hybrid RAG over Abhishek's real data and GitHub READMEs, with citations." },
  { icon: MousePointer2, title: "Operates the site", text: "Navigates, filters and highlights while you watch its cursor." },
  { icon: Wand2, title: "Generative UI", text: "Answers with project cards, comparisons, skill charts and timelines." },
  { icon: Cpu, title: "Agent tools", text: "Live GitHub stats, real code, job-description match, tailored resume." },
  { icon: Mic, title: "Voice", text: "Hold Space or the mic to talk. Speech is never stored." },
  { icon: ShieldCheck, title: "Guardrails", text: "Prompt-injection screening, rate limits and graceful fallbacks." },
];

export default function AbiPage() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl gap-8 px-4 pb-28 pt-24 sm:px-8 lg:grid-cols-[1fr_300px] lg:pt-28">
      <section aria-labelledby="abi-title" className="flex min-h-[70dvh] flex-col overflow-hidden rounded-3xl border bg-card shadow-lg lg:h-[calc(100dvh-10rem)]">
        <header className="flex items-center gap-3 border-b px-5 py-4">
          <AbiBot state="active" size={40} />
          <div>
            <h1 id="abi-title" className="text-lg font-semibold">ABI (Abhi&apos;s Brain Interface)</h1>
            <p className="text-xs text-muted-foreground">Abhishek&apos;s AI agent. Ask, paste a job description, or talk to it.</p>
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <AbiWorkspace />
        </div>
      </section>
      <aside className="space-y-4">
        <p className="font-medium text-xs text-brand-text">What ABI can do</p>
        <ul className="space-y-3">
          {CAPABILITIES.map((c) => (
            <li key={c.title} className="flex gap-3 rounded-2xl border bg-card p-4">
              <c.icon className="mt-0.5 size-5 shrink-0 text-abi-text" aria-hidden />
              <div>
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-subtle-foreground">
          Built with LangGraph, FastAPI, Postgres + pgvector, Groq and the Vercel AI SDK.
        </p>
      </aside>
    </div>
  );
}
