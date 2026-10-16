"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { abi } from "./abi-store";

/** "Ask ABI about this" - a small trigger shown on hover/focus of projects, skills and jobs. */
export function AskAbi({
  prompt,
  label = "Ask ABI",
  className,
}: {
  prompt: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        abi.ask(prompt);
      }}
      className={cn(
        "relative z-10 inline-flex items-center gap-1.5 rounded-full border border-abi/40 bg-abi-soft px-3 py-1 text-xs font-medium text-abi-text transition-[opacity,transform,box-shadow] duration-(--duration-base) ease-out-expo focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      aria-label={`${label}: ${prompt}`}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}
