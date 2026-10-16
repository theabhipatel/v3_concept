"use client";

// A visible "agent cursor" that shows what ABI is clicking or scrolling. Plain DOM + Web
// Animations, no React. It glides along a soft arc from wherever it last was, leaves a faint
// sparkle trail, and clicks with a small burst of light.
let el: HTMLDivElement | null = null;
let badge: HTMLSpanElement | null = null;
let pos = { x: 0, y: 0 };
let hideTimer: number | undefined;

const ORANGE = "oklch(0.72 0.19 48)";
const AMBER = "oklch(0.86 0.16 78)";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ensure() {
  if (el) return el;
  el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className = "pointer-events-none fixed left-0 top-0 z-[80] opacity-0 transition-opacity duration-300 will-change-transform";
  el.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" style="filter: drop-shadow(0 0 6px ${ORANGE}) drop-shadow(0 3px 6px rgb(0 0 0 / .45))">
      <defs><linearGradient id="abi-cursor-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${AMBER}"/><stop offset="1" stop-color="${ORANGE}"/></linearGradient></defs>
      <path d="M4 2.5 20 11l-7 1.8L9.5 20z" fill="url(#abi-cursor-fill)" stroke="oklch(0.2 0.03 50)" stroke-width="1.3" stroke-linejoin="round"/>
    </svg>
    <span data-badge style="position:absolute;left:24px;top:22px;font:600 11px var(--font-body);padding:3px 9px;border-radius:999px;background:oklch(0.16 0.01 50);color:${AMBER};border:1px solid ${ORANGE};white-space:nowrap;box-shadow:0 4px 14px rgb(0 0 0 / .35)">ABI</span>`;
  badge = el.querySelector("[data-badge]");
  pos = { x: window.innerWidth - 80, y: window.innerHeight - 80 };
  el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  document.body.appendChild(el);
  return el;
}

function show(label = "ABI") {
  const c = ensure();
  if (badge) badge.textContent = label;
  window.clearTimeout(hideTimer);
  c.style.opacity = "1";
  hideTimer = window.setTimeout(() => (c.style.opacity = "0"), 2600);
  return c;
}

/** A tiny glowing dot that fades where the cursor has been. */
function spark(x: number, y: number, size: number, life: number, dx = 0, dy = 0) {
  const s = document.createElement("span");
  s.setAttribute("aria-hidden", "true");
  s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:999px;pointer-events:none;z-index:79;background:${Math.random() > 0.5 ? AMBER : ORANGE};box-shadow:0 0 ${size * 2}px ${ORANGE}`;
  document.body.appendChild(s);
  s.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
    ],
    { duration: life, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
  ).finished.then(() => s.remove(), () => s.remove());
}

/** Glide the cursor to a point along a soft arc, leaving a sparkle trail. */
export async function moveToPoint(x: number, y: number, label = "ABI") {
  const c = show(label);
  const from = { ...pos };
  const to = { x, y };
  pos = to;
  if (reduced()) {
    c.style.transform = `translate(${to.x}px, ${to.y}px)`;
    return;
  }
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const duration = Math.min(1000, Math.max(450, dist * 0.9));
  // Bend the path a little (perpendicular offset at the midpoint) so it feels hand-moved.
  const bend = Math.min(90, dist * 0.18);
  const nx = -(to.y - from.y) / (dist || 1);
  const ny = (to.x - from.x) / (dist || 1);
  const mid = { x: (from.x + to.x) / 2 + nx * bend, y: (from.y + to.y) / 2 + ny * bend };

  const anim = c.animate(
    [
      { transform: `translate(${from.x}px, ${from.y}px)` },
      { transform: `translate(${mid.x}px, ${mid.y}px)`, offset: 0.5 },
      { transform: `translate(${to.x}px, ${to.y}px)` },
    ],
    { duration, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" },
  );
  const trail = window.setInterval(() => {
    const m = new DOMMatrixReadOnly(getComputedStyle(c).transform);
    spark(m.m41 + 4, m.m42 + 4, 4 + Math.random() * 3, 650);
  }, 45);
  await anim.finished.catch(() => undefined);
  window.clearInterval(trail);
  c.style.transform = `translate(${to.x}px, ${to.y}px)`;
  anim.cancel();
}

/** Glide the cursor to an element (its centre, or near the left of very wide elements). */
export async function moveTo(target: Element, label = "ABI") {
  const r = target.getBoundingClientRect();
  await moveToPoint(r.left + Math.min(r.width / 2, 120), r.top + Math.min(r.height / 2, 40), label);
}

/** The click: cursor press, a ring of light, a burst of sparks and a glow on the target. */
export async function clickEffect(target?: Element | null) {
  const c = show();
  if (reduced()) return;
  const x = pos.x + 4;
  const y = pos.y + 4;
  c.animate([{ scale: 1 }, { scale: 0.78 }, { scale: 1 }], { duration: 260, easing: "ease-out" });

  for (const [delay, size] of [
    [0, 90],
    [110, 140],
  ]) {
    const ring = document.createElement("span");
    ring.setAttribute("aria-hidden", "true");
    ring.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:999px;pointer-events:none;z-index:79;border:2px solid ${AMBER};box-shadow:0 0 18px ${ORANGE}, inset 0 0 12px ${ORANGE}`;
    document.body.appendChild(ring);
    ring.animate(
      [
        { transform: "scale(0.1)", opacity: 1 },
        { transform: "scale(1)", opacity: 0 },
      ],
      { duration: 650, delay, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
    ).finished.then(() => ring.remove(), () => ring.remove());
  }

  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 34 + Math.random() * 42;
    spark(x, y, 3 + Math.random() * 4, 700 + Math.random() * 300, Math.cos(angle) * dist, Math.sin(angle) * dist);
  }

  if (target instanceof HTMLElement) {
    target.animate(
      [
        { boxShadow: `0 0 0 0 ${ORANGE}`, filter: "brightness(1)" },
        { boxShadow: `0 0 0 4px ${AMBER}, 0 0 28px 6px ${ORANGE}`, filter: "brightness(1.25)", offset: 0.35 },
        { boxShadow: `0 0 0 0 transparent`, filter: "brightness(1)" },
      ],
      { duration: 900, easing: "ease-out" },
    );
  }
  await sleep(180);
}
