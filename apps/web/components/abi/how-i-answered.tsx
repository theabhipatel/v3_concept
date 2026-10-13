"use client";

import { ChevronDown, Cpu } from "lucide-react";
import Link from "next/link";
import type { AbiData } from "./runtime";

/** Transparency panel: retrieved sources, tools used, model and timing. */
export function HowIAnswered({
  retrieval,
  trace,
  cited,
}: {
  retrieval?: AbiData["retrieval"];
  trace?: AbiData["trace"];
  cited: Set<number>;
}) {
  if (!retrieval && !trace) return null;
  return (
    <details className="group rounded-xl border bg-muted/40 text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground">
        <Cpu className="size-3.5" aria-hidden />
        How I answered
        {trace && <span className="text-subtle-foreground">({(trace.ms / 1000).toFixed(1)}s)</span>}
        <ChevronDown className="ml-auto size-3.5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-3 border-t px-3 py-3">
        {trace && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-subtle-foreground">Search query</dt>
            <dd className="text-foreground">{trace.query}</dd>
            <dt className="text-subtle-foreground">Retrieval</dt>
            <dd>Hybrid: vector (pgvector) + keyword + title match, fused with RRF, reranked</dd>
            <dt className="text-subtle-foreground">Tools</dt>
            <dd>{trace.tools.length ? trace.tools.join(", ") : "none"}</dd>
            <dt className="text-subtle-foreground">Model</dt>
            <dd className="font-mono">{trace.model}</dd>
            {trace.guard !== undefined && (
              <>
                <dt className="text-subtle-foreground">Injection check</dt>
                <dd>score {trace.guard} (Llama Prompt Guard)</dd>
              </>
            )}
          </dl>
        )}
        {retrieval && (
          <div>
            <p className="mb-1.5 text-subtle-foreground">Retrieved sources</p>
            <ol className="space-y-1">
              {retrieval.sources.map((s) => (
                <li key={s.n} className="flex items-baseline gap-2">
                  <span className={cited.has(s.n) ? "font-mono text-abi-text" : "font-mono text-subtle-foreground"}>[{s.n}]</span>
                  <Link href={s.url} className="truncate hover:underline">{s.title}</Link>
                  <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 font-mono text-[10px] text-subtle-foreground">{s.kind}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </details>
  );
}
