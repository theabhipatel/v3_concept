"use client";

import { AudioLines, Briefcase, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { AbiBot, type AbiBotState } from "./abi-bot";
import { abi, useAbi } from "./abi-store";

const CAN = [
  "answer anything about Abhishek's work",
  "open pages and click for you",
  "compare projects side by side",
  "show real code from his repos",
  "match a job description, gaps included",
  "talk with you, hands-free",
];

const STATUS: Record<string, string> = {
  idle: "Ready when you are",
  listening: "Listening",
  hearing: "Hearing you",
  thinking: "Thinking",
  speaking: "Speaking",
};

/**
 * ABI's presence on the /abi page: the robot inside rings that react to what it is doing
 * (breathing when idle, rippling while it listens, spinning while it thinks, pulsing while it
 * speaks), a hands-free "Start talking" button and a rotating line of what it can do.
 */
export function AbiPresence() {
  const live = useAbi((s) => s.live);
  const listening = useAbi((s) => s.listening);
  const speaking = useAbi((s) => s.speaking);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => !document.hidden && setI((n) => (n + 1) % CAN.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  const mode =
    speaking || live === "speaking"
      ? "speaking"
      : live === "hearing"
        ? "hearing"
        : listening || live === "listening" || live === "starting"
          ? "listening"
          : live === "thinking"
            ? "thinking"
            : "idle";
  const bot: AbiBotState = mode === "speaking" ? "speaking" : mode === "idle" ? "active" : "listening";
  const on = live !== "off";

  return (
    <div className="flex flex-col items-center text-center">
      <div data-motion className="presence relative grid aspect-square w-full max-w-[22rem] place-items-center" data-mode={mode}>
        <span className="presence__ring presence__ring--1" aria-hidden />
        <span className="presence__ring presence__ring--2" aria-hidden />
        <span className="presence__ring presence__ring--3" aria-hidden />
        <span className="presence__orbit" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="presence__core grid place-items-center rounded-full">
          <AbiBot state={bot} size={84} />
        </span>
      </div>

      <p className="mt-2 inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm backdrop-blur" role="status" aria-live="polite">
        <span className="presence__dot size-2 rounded-full" data-mode={mode} aria-hidden />
        {STATUS[mode]}
      </p>

      <h1 id="abi-title" className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
        Talk to <span className="text-brand-text">ABI.</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Abhi&apos;s Brain Interface, the agent behind this website.</p>

      <p className="mt-5 h-6 overflow-hidden text-base text-muted-foreground" aria-live="off">
        I can{" "}
        <span key={i} className="presence__can inline-block font-semibold text-foreground">
          {CAN[i]}
        </span>
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => (on ? abi.stopLive() : abi.startLive())}
          className="send group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full px-6 text-sm font-semibold"
        >
          {on ? <Square className="relative size-4" aria-hidden /> : <AudioLines className="relative size-4" aria-hidden />}
          <span className="relative">{on ? "End conversation" : "Start talking"}</span>
        </button>
        <button
          type="button"
          onClick={() => abi.setJdMode(true)}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-abi/40 bg-abi-soft px-5 text-sm font-semibold text-abi-text transition-colors hover:border-abi"
        >
          <Briefcase className="size-4" aria-hidden /> Match a job
        </button>
      </div>
      <p className="mt-4 text-xs text-subtle-foreground">Hands-free voice, or hold Space to talk. Nothing is recorded.</p>
    </div>
  );
}
