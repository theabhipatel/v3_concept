"use client";

import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { abi } from "./abi-store";

interface Nudge {
  id: string;
  text: string;
  cta: string;
  prompt: string;
}

// ABI comments on what the visitor is looking at. Each nudge shows at most once per visit.
const NUDGES: Record<string, Nudge> = {
  "/": {
    id: "home",
    text: "I can walk you through Abhishek's best work in 30 seconds.",
    cta: "Show me",
    prompt: "Give me a 30-second tour of Abhishek's best work",
  },
  "/projects": {
    id: "projects",
    text: "Want me to compare his top 3 projects for you?",
    cta: "Compare them",
    prompt: "Compare Secure Vault, Pushable.ai and Aiyubot",
  },
  "/skills": {
    id: "skills",
    text: "Curious where he used any of these? Ask me about a skill.",
    cta: "His AI skills",
    prompt: "Where has Abhishek used his AI skills in real projects?",
  },
  "/about": {
    id: "about",
    text: "Want the 30-second version of his career?",
    cta: "Yes please",
    prompt: "Summarize Abhishek's career in 30 seconds and show his timeline",
  },
  "/contact": {
    id: "contact",
    text: "I can draft the message for you.",
    cta: "Draft it",
    prompt: "Help me draft a message to Abhishek about a project",
  },
};

const DELAY_MS = 20_000;
const SCROLL_RATIO = 0.4;

function seen(id: string) {
  try {
    return sessionStorage.getItem(`abi-nudge-${id}`) === "1";
  } catch {
    return true;
  }
}
function markSeen(id: string) {
  try {
    sessionStorage.setItem(`abi-nudge-${id}`, "1");
  } catch {}
}

export function Nudges() {
  const pathname = usePathname();
  const [shown, setShown] = useState<{ nudge: Nudge; path: string } | null>(null);
  const nudge = NUDGES[pathname];
  const active = shown?.path === pathname ? shown.nudge : null;
  const setActive = (n: Nudge | null) => setShown(n ? { nudge: n, path: pathname } : null);

  useEffect(() => {
    if (!nudge || seen(nudge.id)) return;
    const show = () => {
      if (abi.get().open || seen(nudge.id)) return cleanup();
      markSeen(nudge.id);
      setShown({ nudge, path: pathname });
      cleanup();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SCROLL_RATIO) show();
    };
    const timer = window.setTimeout(show, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, [nudge, pathname]);

  // Opening ABI any other way retires the nudge.
  useEffect(() => abi.subscribe(() => abi.get().open && setShown(null)), []);

  if (!active) return null;
  return (
    <div
      role="status"
      className="fixed bottom-24 right-5 z-50 w-[min(320px,calc(100vw-2.5rem))] animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-abi/30 bg-popover p-4 shadow-lg sm:bottom-28 sm:right-7"
    >
      <button type="button" onClick={() => setActive(null)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-subtle-foreground hover:text-foreground" aria-label="Dismiss">
        <X className="size-3.5" aria-hidden />
      </button>
      <p className="font-medium mb-1 flex items-center gap-1.5 text-xs text-abi-text">
        <Sparkles className="size-3.5" aria-hidden /> ABI
      </p>
      <p className="pr-4 text-sm">{active.text}</p>
      <button
        type="button"
        onClick={() => {
          setActive(null);
          abi.ask(active.prompt);
        }}
        className="mt-3 rounded-full bg-abi px-3.5 py-1.5 text-xs font-semibold text-abi-foreground"
      >
        {active.cta}
      </button>
    </div>
  );
}
