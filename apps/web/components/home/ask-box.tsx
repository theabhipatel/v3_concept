"use client";

import { ArrowUp, Briefcase, Mic } from "lucide-react";
import { useState } from "react";
import { abi } from "@/components/abi/abi-store";
import { useQueryParam } from "@/lib/use-query-param";
import { ROLE_IDS, ROLE_PARAM, SUGGESTIONS, type Role } from "./roles";

/** The heart of the home page: ask ABI anything, talk, or paste a job description. */
export function AskBox() {
  const [value, setValue] = useState("");
  const [role] = useQueryParam<Role>(ROLE_PARAM, "everyone", ROLE_IDS);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          abi.ask(value.trim());
          setValue("");
        }}
        className="flex items-center gap-2 rounded-2xl border border-border-strong bg-card p-2 pl-5 shadow-lg transition-colors focus-within:border-ring"
      >
        <label htmlFor="ask-abi" className="sr-only">
          Ask ABI about Abhishek
        </label>
        <input
          id="ask-abi"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask anything about him..."
          autoComplete="off"
          maxLength={500}
          className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle-foreground sm:text-lg"
        />
        <button
          type="button"
          onClick={() => abi.requestListen()}
          className="grid size-12 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Talk to ABI"
          title="Talk to ABI (or hold Space)"
        >
          <Mic className="size-5" aria-hidden />
        </button>
        <button
          type="submit"
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          aria-label="Send question to ABI"
        >
          <ArrowUp className="size-5" aria-hidden />
        </button>
      </form>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS[role].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => abi.ask(s)}
            className="rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            {s}
          </button>
        ))}
        {(role === "everyone" || role === "recruiter") && (
          <button
            type="button"
            onClick={() => abi.requestJd()}
            className="inline-flex items-center gap-1.5 rounded-full border border-abi/50 bg-abi-soft px-3.5 py-1.5 text-sm font-medium text-abi-text transition-colors hover:border-abi"
          >
            <Briefcase className="size-4" aria-hidden /> Hiring? Paste a job description
          </button>
        )}
      </div>
    </div>
  );
}

/** Opens ABI in "paste a job description" mode. */
export function JdButton() {
  return (
    <button
      type="button"
      onClick={() => abi.requestJd()}
      className="inline-flex h-12 items-center gap-2 rounded-xl border border-abi/50 bg-abi-soft px-6 text-sm font-semibold text-abi-text transition-colors hover:border-abi"
    >
      <Briefcase className="size-4" aria-hidden /> Match a job description
    </button>
  );
}
