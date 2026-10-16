"use client";

// Instant page commands ("open the projects page", "scroll a little", "click on contact").
// Clear commands run right here in the browser: no AI call, no tokens, no waiting. Anything
// that is not clearly a command goes to the agent as a normal question.
import type { ControlAction, ScrollAmount } from "./actions";

export type Command =
  | { kind: "navigate"; path: string; label: string }
  | { kind: "scroll"; direction: "up" | "down"; amount: ScrollAmount }
  | { kind: "click"; label: string }
  | { kind: "back" }
  | { kind: "theme"; theme: "light" | "dark" }
  | { kind: "tour" }
  | { kind: "stop" }
  | { kind: "type"; field: string; text: string }
  | { kind: "search"; text: string }
  | { kind: "control"; action: ControlAction; value?: string };

// Short fixed phrases for ABI's panel and the browser.
const CONTROLS: [RegExp, ControlAction][] = [
  [/^(go |make it |switch to |open (it )?(in )?)?(full ?screen|maximi[sz]e)( mode)?$/, "panel_full"],
  [/^(exit full ?screen|dock( it)?( to the (side|right))?|sidebar( mode)?|minimi[sz]e)$/, "panel_dock"],
  [/^(float( it)?|floating( window| mode)?|pop( it)? out)$/, "panel_float"],
  [/^(make (it|the (panel|chat|sidebar|window)) )?(wider|bigger|larger)$/, "panel_wider"],
  [/^(make (it|the (panel|chat|sidebar|window)) )?(narrower|smaller|thinner)$/, "panel_narrower"],
  [/^(close|hide)( the)?( (chat|panel|abi|sidebar|window|assistant))?$/, "panel_close"],
  [/^(open|show)( the)? (menu|navigation|nav)$/, "open_menu"],
  [/^(close|hide)( the)? (menu|navigation|nav)$/, "close_menu"],
  [/^(go )?forward$/, "forward"],
  [/^(zoom in|make (the )?(text|page) (bigger|larger))$/, "zoom_in"],
  [/^(zoom out|make (the )?(text|page) smaller)$/, "zoom_out"],
  [/^(reset (the )?zoom|zoom reset|normal (size|zoom)|actual size)$/, "zoom_reset"],
  [/^(read|read (this|it|that|the page|this page|this section|out|aloud|it out|it aloud)( (out|aloud))?)$/, "read_aloud"],
  [/^copy (his |the |your )?(email|e-mail|email address|mail)$/, "copy_email"],
  [/^copy (the |this )?(link|url|page link|page url|address)$/, "copy_link"],
  [/^(stop listening|end (the )?(conversation|live( mode)?|call|chat)|goodbye|bye( bye)?)$/, "end_live"],
];

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
  if (!t) return null;

  // Stop a tour, a scroll or speech
  if (/^(stop|pause|wait|hold on|quiet|be quiet|stop (it|there|scrolling|the tour|reading|talking)|that's enough|enough)$/.test(t))
    return { kind: "stop" };

  for (const [re, action] of CONTROLS) if (re.test(t)) return { kind: "control", action };

  // Type into a field: "type hello world in the message box"
  const type = t.match(/^(type|write|enter|put)\s+(.+?)\s+(in|into|inside)\s+(the\s+)?(.+?)(\s+(field|box|input|area))?$/);
  if (type) {
    // Keep the visitor's own capitals and punctuation for the typed text.
    const raw = input.trim().match(/\b(?:type|write|enter|put)\s+(.+?)\s+(?:in|into|inside)\s+(?:the\s+)?\S/i);
    return { kind: "type", field: type[5], text: (raw?.[1] ?? type[2]).replace(/^["']|["']$/g, "") };
  }

  // Search the site
  const search = t.match(/^search( the site)?( for)?\s+(.+)$/);
  if (search) return { kind: "search", text: search[3] };

  // Tour the whole page, top to bottom
  const words = t.split(" ").length;
  if (
    words <= 16 &&
    (/\b(whole|entire|full|complete)\s+((current|this)\s+)?page\b/.test(t) ||
      /\btop to (the )?bottom\b/.test(t) ||
      /^(tour|give me a tour|walk me through|scroll through|go through|auto ?scroll)\b.*\b(page|this|it|here)$/.test(t) ||
      /^(auto ?scroll|keep scrolling|page tour|tour)$/.test(t))
  )
    return { kind: "tour" };

  if (words > 9) return null;

  // Top / bottom
  if (/^((go|scroll|jump|take me)\s+)?(back\s+)?(up\s+)?(to\s+)?(the\s+)?(top|beginning|start)(\s+of(\s+the)?\s+page)?$/.test(t))
    return { kind: "scroll", direction: "up", amount: "end" };
  if (/^((go|scroll|jump|take me)\s+)?(down\s+)?(to\s+)?(the\s+)?(bottom|end)(\s+of(\s+the)?\s+page)?$/.test(t))
    return { kind: "scroll", direction: "down", amount: "end" };

  // Jump to a section: "go to the experience section", "scroll to FAQ"
  const section = t.match(/^(scroll|jump|go|take me|skip)\s+(down\s+|up\s+)?to\s+(the\s+)?(.+?)(\s+(section|part|area))?$/);
  if (section && !page(section[4]) && !/^(top|bottom|end|start|beginning)$/.test(section[4]))
    return { kind: "control", action: "section", value: section[4] };

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
