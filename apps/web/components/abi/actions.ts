"use client";

// Client-side half of ABI's UI tools: the agent decides, the page performs, visibly.
import { getLenis, scrollToElement } from "@/components/site/smooth-scroll";
import { clickEffect, moveTo, moveToPoint } from "./agent-cursor";
import { profile } from "@/lib/content";
import { abiLayout, clampWidth } from "./abi-layout";
import { abi } from "./abi-store";
import { speak, stopSpeaking } from "./voice";

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
async function clickElement(el: HTMLElement): Promise<ClickResult> {
  await bringIntoView(el);
  await moveTo(el);
  await clickEffect(el);
  // Links to other sites open in a new tab, which browsers block unless a person clicked.
  if (el instanceof HTMLAnchorElement && /^https?:/.test(el.href) && (el.target === "_blank" || el.origin !== location.origin)) {
    const tab = window.open(el.href, "_blank");
    if (tab) {
      tab.opener = null;
      return "ok";
    }
    return { external: el.href };
  }
  el.click();
  return "ok";
}

async function bringIntoView(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.top < 80 || r.bottom > window.innerHeight - 40) {
    scrollToElement(el, -160);
    await sleep(700);
  }
}

export type ClickResult = "ok" | "missing" | { external: string };

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
export async function clickLabel(label: string): Promise<ClickResult> {
  stepAside();
  const el = findByLabel(label);
  if (!el) return "missing";
  return clickElement(el);
}

// ---------- Typing ("type hello in the message box", "fill the contact form") ----------

const FIELDS =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([tabindex="-1"]), textarea, [contenteditable="true"]';

function fieldName(el: HTMLElement) {
  const label = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent : "";
  return [el.getAttribute("aria-label"), label, el.getAttribute("placeholder"), el.getAttribute("name"), el.closest("label")?.textContent]
    .filter(Boolean)
    .join(" ");
}

/** The best visible text field for a label like "message", "email" or "search". */
export function findField(label: string): HTMLInputElement | HTMLTextAreaElement | null {
  const q = tokens(label);
  const fields = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(FIELDS)].filter(
    (el) =>
      !el.closest('[inert], aside[data-mode], [aria-hidden="true"]') &&
      (el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? el.offsetParent !== null),
  );
  if (!fields.length) return null;
  let best: HTMLInputElement | HTMLTextAreaElement | null = null;
  let bestScore = 0;
  for (const el of fields) {
    const n = tokens(fieldName(el));
    const hit = q.filter((w) => n.includes(w)).length;
    const score = q.length ? hit / q.length : 0;
    if (score > bestScore) {
      best = el;
      bestScore = score;
    }
  }
  return best ?? (fields.length === 1 ? fields[0] : null);
}

/** Type into a field visibly, letter by letter, so the page's own handlers see real input. */
export async function typeInto(label: string, text: string) {
  stepAside();
  const el = findField(label);
  if (!el) return false;
  await bringIntoView(el);
  await moveTo(el, "Typing");
  await clickEffect(el);
  el.focus({ preventScroll: true });
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
  const value = text.slice(0, 2000);
  const step = Math.max(1, Math.ceil(value.length / 90));
  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 24;
  for (let i = step; i < value.length + step; i += step) {
    setter?.call(el, value.slice(0, i));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    if (delay) await sleep(delay);
  }
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

/** Open the contact page and fill the form. The visitor reviews it and presses Send. */
export async function fillContactForm(o: { name?: string; email?: string; subject?: string; message?: string }) {
  await navigateTo("/contact");
  await waitFor("#message");
  for (const key of ["name", "email", "subject", "message"] as const) {
    if (o[key]) await typeInto(key, String(o[key]));
  }
}

/** Open the search palette and type a query into it. */
export async function searchFor(query: string) {
  stepAside();
  const trigger = findByLabel("search");
  if (trigger) {
    await moveTo(trigger);
    await clickEffect(trigger);
    trigger.click();
  } else {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true }));
  }
  await sleep(350);
  return typeInto("search", query);
}

// ---------- Everything else: sections, ABI's panel, browser controls ----------

export type ControlAction =
  | "section"
  | "panel_full"
  | "panel_dock"
  | "panel_float"
  | "panel_wider"
  | "panel_narrower"
  | "panel_close"
  | "open_menu"
  | "close_menu"
  | "forward"
  | "back"
  | "zoom_in"
  | "zoom_out"
  | "zoom_reset"
  | "read_aloud"
  | "copy_email"
  | "copy_link"
  | "share"
  | "qr"
  | "close_qr"
  | "print"
  | "reduce_motion"
  | "restore_motion"
  | "find_next"
  | "clear_chat"
  | "stop"
  | "end_live";

let zoom = 1;
function setZoom(next: number) {
  zoom = Math.round(Math.min(1.5, Math.max(0.8, next)) * 100) / 100;
  document.documentElement.style.setProperty("zoom", String(zoom));
  return `Zoom is now ${Math.round(zoom * 100)}%.`;
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    return `Copied ${what}: ${text}`;
  } catch {
    return `Here is ${what}: ${text}`;
  }
}

/** The heading or section that best matches a name ("experience", "FAQ"). */
function bestHeading(name: string) {
  const q = tokens(name);
  let best: HTMLElement | null = null;
  let bestScore = 0;
  for (const el of document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main [id]")) {
    if (!(el.checkVisibility?.() ?? true)) continue;
    const n = tokens(`${el.textContent ?? ""} ${el.id}`);
    const hit = q.filter((w) => n.includes(w)).length;
    const score = q.length ? hit / q.length - n.length * 0.01 : 0;
    if (hit && score > bestScore) {
      best = el;
      bestScore = score;
    }
  }
  return best;
}

/** Scroll to the heading that best matches a section name ("experience", "FAQ"). */
async function scrollToSection(name: string) {
  const best = bestHeading(name);
  if (!best) return false;
  scrollToElement(best);
  await sleep(800);
  await moveTo(best);
  return true;
}

// ---------- Find on the page ("find Docker on this page", "next") ----------
// Matches are painted with the CSS Custom Highlight API, so the page's own markup is untouched.

let matches: Range[] = [];
let current = 0;
let lastQuery = "";
let unpaint: number | undefined;

function paintMatches() {
  window.clearTimeout(unpaint);
  if (typeof Highlight === "undefined" || !("highlights" in CSS)) {
    const sel = window.getSelection();
    sel?.removeAllRanges();
    if (matches[current]) sel?.addRange(matches[current]);
    return;
  }
  CSS.highlights.set("abi-find", new Highlight(...matches));
  CSS.highlights.set("abi-find-current", new Highlight(matches[current]));
  unpaint = window.setTimeout(clearMatches, 20_000);
}

function clearMatches() {
  if (typeof Highlight !== "undefined" && "highlights" in CSS) {
    CSS.highlights.delete("abi-find");
    CSS.highlights.delete("abi-find-current");
  }
}

async function showMatch(i: number) {
  current = i;
  paintMatches();
  const host = matches[i].startContainer.parentElement;
  if (host) await bringIntoView(host);
  const r = matches[i].getBoundingClientRect();
  await moveToPoint(r.left + r.width / 2, r.top + r.height / 2, `${i + 1} of ${matches.length}`);
}

/** Find text on the current page: highlight every match and go to the first. */
export async function findOnPage(text: string): Promise<string> {
  stepAside();
  const q = text.trim().toLowerCase();
  if (!q) return "What should I look for?";
  matches = [];
  const root = document.getElementById("main") ?? document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const el = n.parentElement;
      if (!el || el.closest('script, style, [aria-hidden="true"], [inert]')) return NodeFilter.FILTER_REJECT;
      return (el.checkVisibility?.() ?? true) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = walker.nextNode(); n && matches.length < 200; n = walker.nextNode()) {
    const lower = (n.textContent ?? "").toLowerCase();
    for (let i = lower.indexOf(q); i >= 0; i = lower.indexOf(q, i + q.length)) {
      const r = new Range();
      r.setStart(n, i);
      r.setEnd(n, i + q.length);
      matches.push(r);
    }
  }
  lastQuery = text.trim();
  if (!matches.length) {
    clearMatches();
    return `I couldn't find "${lastQuery}" on this page.`;
  }
  await showMatch(0);
  return matches.length === 1 ? `Found "${lastQuery}" once on this page.` : `Found "${lastQuery}" ${matches.length} times. Say "next" for the next one.`;
}

/** The next match of the last search (searches again if the page changed). */
export async function findNext(): Promise<string> {
  if (!lastQuery) return "Tell me what to find first, like \"find Docker\".";
  if (!matches.length || !matches[0].startContainer.isConnected) return findOnPage(lastQuery);
  const next = (current + 1) % matches.length;
  await showMatch(next);
  return `Match ${next + 1} of ${matches.length}.`;
}

// ---------- Spotlight ("show me where the download button is") ----------

/** Point at an element and dim everything else for a moment, without clicking it. */
export async function spotlight(label: string): Promise<boolean> {
  stepAside();
  const el = findByLabel(label) ?? bestHeading(label);
  if (!el) return false;
  await bringIntoView(el);
  await moveTo(el, "Here");
  document.querySelector(".abi-spotlight")?.remove();
  const r = el.getBoundingClientRect();
  const pad = 10;
  const spot = document.createElement("div");
  spot.className = "abi-spotlight";
  spot.setAttribute("aria-hidden", "true");
  spot.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
  document.body.appendChild(spot);
  const remove = () => {
    spot.classList.add("abi-spotlight--out");
    window.setTimeout(() => spot.remove(), 400);
    window.removeEventListener("scroll", remove);
    window.removeEventListener("pointerdown", remove);
  };
  window.addEventListener("scroll", remove, { passive: true, once: true });
  window.addEventListener("pointerdown", remove, { once: true });
  window.setTimeout(remove, 3600);
  return true;
}

// ---------- Profiles, sharing, printing, calm mode, voice ----------

export type Network = "github" | "linkedin" | "x" | "leetcode" | "whatsapp";

/** Open one of Abhishek's profiles in a new tab (or hand over the link if the browser blocks it). */
export function openProfile(network: Network): string {
  const url =
    network === "whatsapp" ? `https://wa.me/${profile.phone.href.replace(/\D/g, "")}` : profile.socials.find((s) => s.icon === network)?.url;
  if (!url) return "I don't have that profile.";
  const name = network === "whatsapp" ? "WhatsApp" : profile.socials.find((s) => s.icon === network)!.name;
  const tab = window.open(url, "_blank", "noopener");
  if (!tab) window.dispatchEvent(new CustomEvent("abi:external-link", { detail: url }));
  return tab ? `Opening his ${name}.` : `Your browser wants you to open his ${name} yourself.`;
}

async function share(): Promise<string> {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url });
      return "Opened the share sheet.";
    } catch {
      // Not allowed without a tap, or cancelled: copy the link instead.
    }
  }
  return copy(url, "the page link");
}

let closeQr: (() => void) | null = null;

/** A QR code of this page, to open it on a phone (the live site when running locally). Tap, Escape or "close it" closes it. */
async function showQr(): Promise<string> {
  const local = /^(localhost|127\.|192\.168\.|10\.)/.test(window.location.hostname);
  const url = (local ? profile.site : window.location.origin) + window.location.pathname + window.location.search;
  const { toString } = await import("qrcode");
  const svg = await toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b0706", light: "#ffffff" } });
  closeQr?.();
  const box = document.createElement("div");
  box.className = "abi-qr";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "QR code for this page");
  box.innerHTML = `<div class="abi-qr__card"><div class="abi-qr__code">${svg}</div><p class="abi-qr__title">Scan to open on your phone</p><p class="abi-qr__url"></p></div>`;
  box.querySelector(".abi-qr__url")!.textContent = url.replace("https://", "");
  document.body.appendChild(box);
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeQr?.();
  closeQr = () => {
    closeQr = null;
    box.classList.add("abi-qr--out");
    window.setTimeout(() => box.remove(), 300);
    window.removeEventListener("keydown", onKey);
  };
  box.addEventListener("click", () => closeQr?.());
  window.addEventListener("keydown", onKey);
  return "Here is a QR code for this page. Scan it with your phone camera.";
}

function hideQr(): string {
  if (!closeQr) return "There is no QR code open.";
  closeQr();
  return "Closed the QR code.";
}

const CALM_KEY = "abi-calm";

/** Calm mode: animations and transitions stop (on top of the device's reduced-motion setting). */
export function setCalm(on: boolean) {
  if (on) document.documentElement.dataset.calm = "on";
  else delete document.documentElement.dataset.calm;
  try {
    if (on) localStorage.setItem(CALM_KEY, "on");
    else localStorage.removeItem(CALM_KEY);
  } catch {}
  return on ? "Animations are calmed down. Say \"restore animations\" to bring them back." : "Animations are back on.";
}

export type Speed = "slower" | "normal" | "faster";

/** Mute, unmute or change the speed of ABI's voice. */
export function voiceSettings({ muted, speed }: { muted?: boolean | null; speed?: Speed | null }): string {
  const rate = abi.get().voiceRate;
  const nextRate = speed === "slower" ? rate - 0.15 : speed === "faster" ? rate + 0.15 : speed === "normal" ? 1 : rate;
  abi.setVoicePrefs({ muted: muted ?? undefined, rate: nextRate });
  if (muted) stopSpeaking();
  const now = abi.get();
  if (muted === true) return "Muted. I'll answer in text only.";
  if (muted === false && !speed) return "Voice is back on.";
  return `Voice speed is now ${Math.round(now.voiceRate * 100)}%.`;
}

/** Visible text of the current screen, top to bottom, for reading aloud. */
function visibleText() {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main p, main li, main dt, main dd")) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 60 || r.top > window.innerHeight || !(el.checkVisibility?.() ?? true)) continue;
    if (el.querySelector("p, li")) continue; // read leaf blocks only
    const t = (el.innerText || "").replace(/\s+/g, " ").trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(/[.!?:]$/.test(t) ? t : `${t}.`);
    }
  }
  return out.join(" ").slice(0, 1500);
}

/** The main text of the whole page (headings, paragraphs, list items), for "summarize this page". */
export function pageText(max = 5000) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main p, main li, main dt, main dd, main figcaption")) {
    if (!(el.checkVisibility?.() ?? true) || el.closest('[aria-hidden="true"]')) continue;
    if (el.querySelector("p, li")) continue;
    const t = (el.innerText || "").replace(/\s+/g, " ").trim();
    if (t.length < 2 || seen.has(t)) continue;
    seen.add(t);
    out.push(/^H\d$/.test(el.tagName) ? `\n## ${t}` : t);
  }
  return out.join("\n").slice(0, max);
}

/** Perform a control action and return a short reply for the chat. */
export async function control(action: ControlAction, value = ""): Promise<string> {
  const layout = abiLayout.get();
  switch (action) {
    case "section":
      stepAside();
      return (await scrollToSection(value)) ? `Here is the ${value} section.` : `I couldn't find a "${value}" section on this page.`;
    case "panel_full":
      abi.open();
      abiLayout.set({ mode: "full" });
      return "Full screen.";
    case "panel_dock":
      abi.open();
      abiLayout.set({ mode: "dock" });
      return "Docked to the side.";
    case "panel_float":
      abi.open();
      abiLayout.set({ mode: "float" });
      return "Floating window. Drag it by the top bar.";
    case "panel_wider":
    case "panel_narrower":
      abi.open();
      abiLayout.set({ mode: "dock", width: clampWidth(layout.width + (action === "panel_wider" ? 160 : -160)) });
      return action === "panel_wider" ? "Made the panel wider." : "Made the panel narrower.";
    case "panel_close":
      if (closeQr) return hideQr(); // "close it" while the QR code is up means the QR code
      abi.close();
      return "Closed the panel. Click the robot to bring me back.";
    case "open_menu":
    case "close_menu": {
      const orb = document.querySelector<HTMLButtonElement>(".abi-orb");
      const open = orb?.getAttribute("aria-expanded") === "true";
      if (orb && open !== (action === "open_menu")) orb.click();
      return action === "open_menu" ? "Here is the menu." : "Closed the menu.";
    }
    case "forward":
      window.history.forward();
      return "Going forward.";
    case "back":
      window.history.back();
      return "Going back.";
    case "zoom_in":
      return setZoom(zoom + 0.1);
    case "zoom_out":
      return setZoom(zoom - 0.1);
    case "zoom_reset":
      return setZoom(1);
    case "read_aloud": {
      const text = visibleText();
      if (!text) return "There is nothing to read on this part of the page.";
      speak(text);
      return "Reading this part of the page.";
    }
    case "copy_email":
      return copy(profile.email, "his email");
    case "copy_link":
      return copy(window.location.href, "the page link");
    case "share":
      return share();
    case "qr":
      return showQr();
    case "close_qr":
      return hideQr();
    case "print":
      stepAside();
      window.setTimeout(() => window.print(), 300);
      return "Opening print. Pick \"Save as PDF\" to keep a copy.";
    case "reduce_motion":
      return setCalm(true);
    case "restore_motion":
      return setCalm(false);
    case "find_next":
      return findNext();
    case "clear_chat":
      window.dispatchEvent(new Event("abi:clear-chat"));
      return "Started a fresh chat.";
    case "stop":
      stopTour();
      stopSpeaking();
      return "Stopped.";
    case "end_live":
      abi.stopLive();
      return "Ended the live conversation.";
  }
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

// ---------- Page tour ("show me this whole page, top to bottom") ----------

let stopCurrentTour: (() => void) | null = null;

/** Stop a running tour (the visitor scrolled, clicked, pressed a key or said "stop"). */
export function stopTour() {
  stopCurrentTour?.();
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Smooth scroll to `top` over `seconds`; resolves when done (or a little after, if interrupted). */
function smoothTo(top: number, seconds: number) {
  const lenis = getLenis();
  const fallback = sleep(seconds * 1000 + 300);
  if (!lenis) {
    window.scrollTo({ top, behavior: "smooth" });
    return fallback;
  }
  return Promise.race([
    new Promise<void>((resolve) => lenis.scrollTo(top, { duration: seconds, easing: easeInOut, onComplete: () => resolve() })),
    fallback,
  ]);
}

/**
 * Walk the visitor through the whole current page: back to the top, then glide down section by
 * section at a reading pace, pausing on each heading with ABI's cursor. Any scroll, click or
 * key press by the visitor ends it.
 */
export async function tourPage() {
  stepAside();
  stopTour();
  let stopped = false;
  const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const onUser = (e: Event) => {
    if (e instanceof KeyboardEvent && ["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
    if ((e.target as Element | null)?.closest?.("aside[data-mode]")) return; // typing to ABI is fine
    stop();
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    const lenis = getLenis();
    lenis?.scrollTo(window.scrollY, { immediate: true });
    events.forEach((t) => window.removeEventListener(t, onUser, { capture: true }));
    stopCurrentTour = null;
  };
  stopCurrentTour = stop;
  events.forEach((t) => window.addEventListener(t, onUser, { capture: true, passive: true }));

  const h = window.innerHeight;
  const max = document.documentElement.scrollHeight - h;
  const headings = [...document.querySelectorAll<HTMLElement>("main h1, main h2")].filter((el) => el.checkVisibility?.() ?? true);
  const stops: { top: number; el: HTMLElement | null }[] = [];
  for (const el of headings) {
    const top = Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - 110));
    if (!stops.length || top - stops[stops.length - 1].top >= 160) stops.push({ top, el });
  }
  if (!stops.length || max - stops[stops.length - 1].top >= 160) stops.push({ top: max, el: null });

  if (window.scrollY > 10) await smoothTo(0, 1);
  for (const [i, s] of stops.entries()) {
    if (stopped) break;
    const dist = Math.abs(s.top - window.scrollY);
    if (dist > 4) await smoothTo(s.top, Math.min(7, Math.max(0.9, dist / 300)));
    if (stopped) break;
    if (s.el) void moveTo(s.el, `${i + 1} of ${stops.length}`);
    await sleep(s.el ? 1300 : 600);
  }
  if (!stopped) stop();
}

export async function themeTo(theme: "light" | "dark" | "system") {
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

const PAGE_ACTIONS = new Set(["navigate", "filter-projects", "filter-skills", "scroll", "click", "tour", "type", "fill-contact", "find", "highlight"]);

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
      const r = await clickLabel(String(o.label ?? ""));
      if (typeof r === "object") window.dispatchEvent(new CustomEvent("abi:external-link", { detail: r.external }));
      break;
    }
    case "tour": {
      await tourPage();
      break;
    }
    case "type": {
      if (o.field === "search") await searchFor(String(o.text ?? ""));
      else await typeInto(String(o.field ?? ""), String(o.text ?? ""));
      break;
    }
    case "fill-contact": {
      await fillContactForm(o as Record<string, string>);
      break;
    }
    case "control": {
      await control(o.action as ControlAction, String(o.value ?? ""));
      break;
    }
    case "find": {
      await findOnPage(String(o.text ?? ""));
      break;
    }
    case "highlight": {
      await spotlight(String(o.label ?? ""));
      break;
    }
    case "voice": {
      voiceSettings({ muted: o.muted as boolean | null, speed: o.speed as Speed | null });
      break;
    }
    case "open-profile": {
      openProfile(o.network as Network);
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
