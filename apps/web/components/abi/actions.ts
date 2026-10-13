"use client";

// Client-side half of ABI's UI tools: the agent decides, the page performs, visibly.
import { scrollToElement } from "@/components/site/smooth-scroll";
import { clickEffect, moveTo } from "./agent-cursor";
import { abi } from "./abi-store";

export interface UiAction {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> & { ui?: string; error?: string };
}

interface Bridge {
  navigate: (path: string) => void;
  setTheme: (theme: string) => void;
}

let bridge: Bridge | null = null;
export function registerBridge(b: Bridge) {
  bridge = b;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Visible element match (hidden routes stay mounted, so ids can repeat). */
function find(selector: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (el.checkVisibility?.() ?? el.offsetParent !== null) return el;
  }
  return null;
}

async function waitFor(selector: string, timeout = 4000) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const el = find(selector);
    if (el) return el;
    await sleep(60);
  }
  return null;
}

async function goTo(path: string) {
  if (window.location.pathname === path) return;
  bridge?.navigate(path);
  const start = performance.now();
  while (window.location.pathname !== path && performance.now() - start < 4000) await sleep(50);
  await sleep(250);
}

async function click(selector: string) {
  const el = await waitFor(selector);
  if (!el) return;
  scrollToElement(el, -160);
  await sleep(350);
  await moveTo(el);
  clickEffect();
  el.click();
}

async function highlight(section: string) {
  const el = await waitFor(`[id="${CSS.escape(section)}"]`);
  if (!el) return;
  scrollToElement(el);
  await sleep(500);
  await moveTo(el);
  el.classList.remove("abi-highlight");
  void el.offsetWidth; // restart the animation
  el.classList.add("abi-highlight");
  window.setTimeout(() => el.classList.remove("abi-highlight"), 2600);
}

const PAGE_ACTIONS = new Set(["navigate", "filter-projects", "filter-skills"]);

export async function runAction(action: UiAction) {
  const o = action.output;
  if (!o?.ui || o.error) return;
  // On phones the panel covers the page, so step aside and let the visitor watch.
  if (PAGE_ACTIONS.has(o.ui) && window.innerWidth < 768) abi.close();

  switch (o.ui) {
    case "navigate": {
      await goTo(String(o.path));
      if (o.section) await highlight(String(o.section));
      break;
    }
    case "filter-projects": {
      await goTo("/projects");
      await click(`[data-abi-target="projects-category-${o.category}"]`);
      if (o.type && o.type !== "all") await click(`[data-abi-target="projects-type-${o.type}"]`);
      break;
    }
    case "filter-skills": {
      await goTo("/skills");
      await click(`[data-abi-target="skills-category-${String(o.category).toLowerCase()}"]`);
      break;
    }
    case "theme": {
      const toggle = find('[data-abi-target="theme-toggle"]');
      if (toggle) {
        await moveTo(toggle);
        clickEffect();
      }
      bridge?.setTheme(String(o.theme));
      break;
    }
  }
}

/** A short scripted demo where ABI drives the page (the "ghost cursor" tour). */
export async function runDemo() {
  await runAction({ tool: "demo", input: {}, output: { ui: "filter-projects", category: "AI", type: "all" } });
  await sleep(900);
  await click('[data-abi-target="project-card"]');
}
