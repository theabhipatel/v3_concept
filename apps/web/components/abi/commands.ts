"use client";

// Instant page commands ("open the projects page", "scroll a little", "click on contact").
// Clear commands run right here in the browser: no AI call, no tokens, no waiting. Anything
// that is not clearly a command goes to the agent as a normal question.
import type { ScrollAmount } from "./actions";

export type Command =
  | { kind: "navigate"; path: string; label: string }
  | { kind: "scroll"; direction: "up" | "down"; amount: ScrollAmount }
  | { kind: "click"; label: string }
  | { kind: "back" }
  | { kind: "theme"; theme: "light" | "dark" };

const PAGES: [RegExp, string, string][] = [
  [/^(home|homepage|home page|main page|start|landing page)$/, "/", "Home"],
  [/^(skills?|tech stack|stack)$/, "/skills", "Skills"],
  [/^(projects?|work|portfolio)$/, "/projects", "Projects"],
  [/^(about|about me|about him|about abhishek|his story)$/, "/about", "About"],
  [/^(contact|contact me|contact him|contact form)$/, "/contact", "Contact"],
  [/^(ai lab|lab|the lab)$/, "/lab", "AI Lab"],
  [/^(resume|cv)$/, "/resume", "Resume"],
];

function tidy(text: string) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^((hey|hi|ok|okay|so|now|and|abi|please|can you|could you|would you|will you|just)\s+)+/, "")
    .replace(/\s+(please|for me|now|abi)$/, "")
    .trim();
}

function page(name: string) {
  const n = name.replace(/^(the|his|my)\s+/, "").replace(/\s+(page|section|tab|screen)$/, "").trim();
  for (const [re, path, label] of PAGES) if (re.test(n)) return { path, label };
  return null;
}

function scrollAmount(rest: string): ScrollAmount {
  if (/\b(top|bottom|end|start|beginning)\b/.test(rest)) return "end";
  if (/\b(one|a|1|full|whole|single)\s+(page|screen)\b|\bpage\b|\bscreen\b/.test(rest)) return "page";
  if (/\b(little|bit|slightly|tiny|touch)\b/.test(rest)) return "little";
  return "more";
}

export function parseCommand(input: string): Command | null {
  const t = tidy(input);
  if (!t || t.split(" ").length > 9) return null;

  // Top / bottom
  if (/^((go|scroll|jump|take me)\s+)?(back\s+)?(up\s+)?(to\s+)?(the\s+)?(top|beginning|start)(\s+of(\s+the)?\s+page)?$/.test(t))
    return { kind: "scroll", direction: "up", amount: "end" };
  if (/^((go|scroll|jump|take me)\s+)?(down\s+)?(to\s+)?(the\s+)?(bottom|end)(\s+of(\s+the)?\s+page)?$/.test(t))
    return { kind: "scroll", direction: "down", amount: "end" };

  // Scroll
  const scroll = t.match(/^(scroll|move|go)\s*(up|down)?\b(.*)$/);
  if (scroll && (scroll[1] === "scroll" || scroll[2])) {
    const rest = `${scroll[2] ?? ""} ${scroll[3]}`;
    return { kind: "scroll", direction: /\bup\b/.test(rest) ? "up" : "down", amount: scrollAmount(rest) };
  }
  if (/^(next page|page down)$/.test(t)) return { kind: "scroll", direction: "down", amount: "page" };
  if (/^(page up|previous screen)$/.test(t)) return { kind: "scroll", direction: "up", amount: "page" };

  // Back
  if (/^(go\s+)?back(\s+to the previous page)?$|^previous page$/.test(t)) return { kind: "back" };

  // Theme
  const theme = t.match(/^((switch|change|turn|set|go|make it)\s+(on\s+|to\s+|it\s+to\s+)?)?(the\s+)?(dark|light)(\s+(mode|theme))?(\s+on)?$/);
  if (theme) return { kind: "theme", theme: theme[5] as "light" | "dark" };

  // Open a page
  const open = t.match(/^(open|go to|goto|take me to|navigate to|visit|show|show me|bring up)\s+(.+)$/);
  if (open) {
    const p = page(open[2]);
    if (p) return { kind: "navigate", ...p };
    // "open Secure Vault" -> click it; "show me ..." stays a question for the agent.
    if (open[1] === "open") return { kind: "click", label: open[2].replace(/^the\s+/, "").replace(/\s+(button|link|tab|card)$/, "") };
    return null;
  }

  // Click
  const click = t.match(/^(click|press|tap|select|hit|choose)(\s+on)?(\s+the)?\s+(.+)$/);
  if (click) return { kind: "click", label: click[4].replace(/\s+(button|link|tab|card|option|icon)$/, "") };

  return null;
}
