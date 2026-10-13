"use client";

// A visible "agent cursor" that shows what ABI is clicking or scrolling to. Plain DOM, no React.
let el: HTMLDivElement | null = null;
let pos = { x: 0, y: 0 };
let hideTimer: number | undefined;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ensure() {
  if (el) return el;
  el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className =
    "pointer-events-none fixed left-0 top-0 z-[80] opacity-0 transition-opacity duration-300 will-change-transform";
  el.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" style="filter: drop-shadow(0 4px 12px var(--glow-abi))">
      <path d="M4 2.5 20 11l-7 1.8L9.5 20z" fill="var(--abi)" stroke="var(--abi-foreground)" stroke-width="1.4" stroke-linejoin="round"/>
    </svg>
    <span style="position:absolute;left:22px;top:20px;font:600 11px var(--font-code);padding:2px 8px;border-radius:999px;background:var(--abi);color:var(--abi-foreground);white-space:nowrap">ABI</span>`;
  pos = { x: window.innerWidth - 60, y: window.innerHeight - 60 };
  el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  document.body.appendChild(el);
  return el;
}

function show() {
  const c = ensure();
  window.clearTimeout(hideTimer);
  c.style.opacity = "1";
  hideTimer = window.setTimeout(() => (c.style.opacity = "0"), 2200);
  return c;
}

/** Glide the cursor to the centre of an element. Resolves when it arrives. */
export async function moveTo(target: Element) {
  const c = show();
  const r = target.getBoundingClientRect();
  const to = { x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40) };
  const duration = reduced() ? 0 : 650;
  const anim = c.animate(
    [{ transform: `translate(${pos.x}px, ${pos.y}px)` }, { transform: `translate(${to.x}px, ${to.y}px)` }],
    { duration, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
  );
  pos = to;
  await anim.finished.catch(() => undefined);
  c.style.transform = `translate(${to.x}px, ${to.y}px)`;
  anim.cancel();
}

/** Small click ripple at the cursor position. */
export function clickEffect() {
  const c = show();
  if (reduced()) return;
  c.animate([{ scale: 1 }, { scale: 0.82 }, { scale: 1 }], { duration: 220, easing: "ease-out" });
}
