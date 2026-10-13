"use client";

import { ArrowUp, Briefcase, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { abi } from "@/components/abi/abi-store";

const SAMPLES = [
  "Which AI projects has Abhishek built?",
  "Compare Secure Vault and Pushable.ai",
  "Is he a fit for a Senior AI Engineer role?",
  "Show me real code he wrote",
  "What does he do at IBR Infotech?",
];
const CHIPS = ["Show me his AI projects", "Summarize his career", "What's his tech stack?"];

/** The hero is a command bar: sample questions type themselves until the visitor takes over. */
export function HeroCommand() {
  const [value, setValue] = useState("");
  const [typed, setTyped] = useState(SAMPLES[0]);
  const [focused, setFocused] = useState(false);
  const sampleRef = useRef(0);

  useEffect(() => {
    if (focused || value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let deleting = false;
    let text = SAMPLES[sampleRef.current];
    const tick = window.setInterval(() => {
      if (!deleting) {
        i++;
        if (i > text.length + 18) deleting = true; // pause at the end
      } else {
        i -= 2;
        if (i <= 0) {
          deleting = false;
          sampleRef.current = (sampleRef.current + 1) % SAMPLES.length;
          text = SAMPLES[sampleRef.current];
          i = 0;
        }
      }
      setTyped(text.slice(0, Math.max(0, Math.min(i, text.length))));
    }, 55);
    return () => window.clearInterval(tick);
  }, [focused, value]);

  const submit = (text: string) => {
    const q = text.trim() || SAMPLES[sampleRef.current];
    abi.ask(q);
    setValue("");
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="group relative rounded-[28px] bg-(image:--gradient-brand) p-px shadow-glow"
      >
        <div className="flex items-center gap-2 rounded-[27px] bg-card/90 p-2 pl-5 backdrop-blur-xl">
          <span className="font-mono text-sm text-brand-text" aria-hidden>&gt;</span>
          <label htmlFor="hero-ask" className="sr-only">Ask ABI anything about Abhishek</label>
          <div className="relative flex-1">
            <input
              id="hero-ask"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoComplete="off"
              maxLength={500}
              className="h-12 w-full bg-transparent text-base outline-none sm:text-lg"
            />
            {!value && (
              <span className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap text-base text-subtle-foreground sm:text-lg" aria-hidden>
                {focused ? "Ask ABI anything about Abhishek..." : typed}
                {!focused && <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-brand" />}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => abi.requestListen()}
            className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Talk to ABI"
          >
            <Mic className="size-5" aria-hidden />
          </button>
          <button
            type="submit"
            className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
            aria-label="Send question to ABI"
          >
            <ArrowUp className="size-5" aria-hidden />
          </button>
        </div>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS.map((c) => (
          <button key={c} type="button" onClick={() => submit(c)} className="rounded-full border bg-card/70 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur transition-colors hover:border-border-strong hover:text-foreground">
            {c}
          </button>
        ))}
        <button
          type="button"
          onClick={() => abi.requestJd()}
          className="inline-flex items-center gap-1.5 rounded-full border border-abi/40 bg-abi-soft px-3.5 py-1.5 text-sm font-medium text-abi-text"
        >
          <Briefcase className="size-4" aria-hidden /> Hiring? Paste a job description
        </button>
      </div>
    </div>
  );
}
