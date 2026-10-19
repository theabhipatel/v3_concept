"use client";

import { ArrowUp, ArrowUpRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { abi } from "@/components/abi/abi-store";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <a href={`mailto:${email}`} className="truncate font-medium underline-offset-4 hover:underline">
        {email}
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } catch {
            // Clipboard blocked: the address stays selectable.
          }
        }}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={copied ? "Email copied" : "Copy email address"}
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  );
}

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex min-h-9 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowUp className="size-4" aria-hidden /> Back to top
    </button>
  );
}

/** The big "ask me" card: opens ABI right here instead of going to another page. */
export function AskAbiCard() {
  return (
    <button
      type="button"
      onClick={() => abi.open()}
      className="group flex w-full items-center gap-4 rounded-2xl border bg-card p-5 text-left transition-colors hover:border-brand/50"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-on-brand">
        <span className="footer-abi-eyes" aria-hidden>
          <i />
          <i />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Still curious? Ask ABI.</span>
        <span className="block text-sm text-muted-foreground">My AI agent knows every project, skill and year. Text or voice.</span>
      </span>
      <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}
