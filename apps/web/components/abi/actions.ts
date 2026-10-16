"use client";

// Client-side half of ABI's UI tools: the agent decides, the page performs, visibly.
import { getLenis, scrollToElement } from "@/components/site/smooth-scroll";
import { clickEffect, moveTo, moveToPoint } from "./agent-cursor";
import { abiLayout } from "./abi-layout";
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
  if (el) await clickElement(el);
}

/** Bring an element into view, glide the cursor to it, and click with the magic effect. */
async function clickElement(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.top < 80 || r.bottom > window.innerHeight - 40) {
    scrollToElement(el, -160);
    await sleep(700);
  }
  await moveTo(el);
  await clickEffect(el);
  el.click();
}

// ---------- Clicking by visible text ("click on the projects button") ----------

const STOP = new Set(["the", "a", "an", "on", "button", "link", "tab", "card", "page", "please", "option", "icon", "this", "that"]);
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const stem = (w: string) => (w.length > 3 ? w.replace(/ies$/, "y").replace(/s$/, "") : w);
const tokens = (s: string) =>
  norm(s)
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .map(stem);

const CLICKABLE = 'a[href], button, [role="button"], [role="tab"], [role="radio"], [role="link"], summary, [data-abi-target]';

/** The best visible clickable element whose text matches the label (ABI's own UI excluded). */
export function findByLabel(label: string): HTMLElement | null {
  const q = tokens(label);
  if (!q.length) return null;
  const qs = q.join(" ");
  let best: HTMLElement | null = null;
  let bestScore = 0;
  for (const el of document.querySelectorAll<HTMLElement>(CLICKABLE)) {
    if (el.closest('[inert], aside[data-mode], [aria-hidden="true"], [data-abi-target="orb"]')) continue;
    if (!(el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? el.offsetParent !== null)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const n = tokens(el.getAttribute("aria-label") || el.textContent || el.title || "");
    if (!n.length) continue;
    let score: number;
    if (n.join(" ") === qs) score = 1;
    else {
      const hit = q.filter((w) => n.includes(w)).length;
      if (!hit) continue;
      score = (hit / q.length) * 0.8 - Math.min(0.3, (n.length - hit) * 0.03);
    }
    if (r.bottom > 0 && r.top < window.innerHeight) score += 0.05; // prefer what is on screen
    if (score > bestScore) {
      best = el;
      bestScore = score;
    }
  }
  return bestScore >= 0.4 ? best : null;
}

/** Click by visible text. Returns false when nothing on the page matches. */
export async function clickLabel(label: string) {
  stepAside();
  const el = findByLabel(label);
  if (!el) return false;
  await clickElement(el);
  return true;
}

// ---------- Scrolling ("scroll a little", "one page", "to the top") ----------

export type ScrollAmount = "little" | "more" | "page" | "end";
const SHARE: Record<Exclude<ScrollAmount, "end">, number> = { little: 0.25, more: 0.5, page: 1 };

export async function scrollPage(direction: "up" | "down", amount: ScrollAmount) {
  stepAside();
  const h = window.innerHeight;
  const max = document.documentElement.scrollHeight - h;
  const target =
    amount === "end" ? (direction === "up" ? 0 : max) : window.scrollY + (direction === "up" ? -1 : 1) * SHARE[amount] * h;
  const top = Math.max(0, Math.min(max, target));
  const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--abi-dock")) || 0;
  void moveToPoint((window.innerWidth - pad) / 2, h / 2, direction === "up" ? "Scrolling up" : "Scrolling down");
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(top, { duration: amount === "end" ? 1.6 : amount === "page" ? 1.2 : 0.9 });
  else window.scrollTo({ top, behavior: "smooth" });
  await sleep(amount === "end" ? 1600 : 1100);
}

export async function themeTo(theme: "light" | "dark") {
  await runAction({ tool: "command", input: {}, output: { ui: "theme", theme } });
}

export async function navigateTo(path: string) {
  stepAside();
  await goTo(path);
}

/** When the panel covers the page (phones, full screen), step aside so the visitor can watch. */
function stepAside() {
  if (window.innerWidth < 768 || abiLayout.get().mode === "full") abi.close();
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

const PAGE_ACTIONS = new Set(["navigate", "filter-projects", "filter-skills", "scroll", "click"]);

export async function runAction(action: UiAction) {
  const o = action.output;
  if (!o?.ui || o.error) return;
  if (PAGE_ACTIONS.has(o.ui)) stepAside();

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
    case "scroll": {
      await scrollPage(o.direction === "up" ? "up" : "down", (o.amount as ScrollAmount) ?? "more");
      break;
    }
    case "click": {
      await clickLabel(String(o.label ?? ""));
      break;
    }
    case "theme": {
      const toggle = find('[data-abi-target="theme-toggle"]');
      if (toggle) {
        await moveTo(toggle);
        await clickEffect(toggle);
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
