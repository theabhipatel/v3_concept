import { Brain, MessageSquareText, MousePointerClick, Search } from "lucide-react";

const STEPS = [
  { icon: Brain, title: "Understand", body: "Your question is rewritten so it stands on its own, even as a follow-up." },
  { icon: Search, title: "Search", body: "Hybrid search over my real data: pgvector embeddings plus full text, fused by rank." },
  { icon: MousePointerClick, title: "Act", body: "A LangGraph agent with 20 tools opens pages, scrolls, clicks, compares and matches jobs." },
  { icon: MessageSquareText, title: "Answer", body: "The answer streams in with sources. \"How I answered\" shows every step." },
];

/** What happens on every question, lit up step by step in a loop (CSS, paused off screen). */
export function AbiFlow() {
  return (
    <ol data-motion className="abi-flow grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s, i) => (
        <li
          key={s.title}
          data-reveal
          style={{ "--d": i, "--i": i } as React.CSSProperties}
          className="abi-flow__step relative rounded-3xl border bg-card p-6"
        >
          <span className="abi-flow__icon grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <s.icon className="size-5" aria-hidden />
          </span>
          <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
          <p className="mt-1.5 leading-relaxed text-muted-foreground">{s.body}</p>
          <span className="abi-flow__bar absolute inset-x-6 bottom-0 h-[3px] rounded-full" aria-hidden />
        </li>
      ))}
    </ol>
  );
}
