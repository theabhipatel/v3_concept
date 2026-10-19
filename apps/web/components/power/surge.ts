"use client";

// Power effects, drawn on one temporary full-screen canvas that removes itself when done:
// - "spark": a small charge around a button (sign in).
// - "surge": power mode switching on. Lightning forks out of the button to every edge of the
//   screen, a shockwave rolls across, fire spreads along the bottom of the app and embers rise.
// - "down": power mode switching off, a short fizzle.
// Nothing runs between effects. Reduced motion gets a soft glow instead.

type Mode = "spark" | "surge" | "down";
type Point = [number, number];

interface Bolt {
  from: Point;
  to: Point;
  born: number;
  life: number;
  width: number;
  pts: Point[];
  branches: Point[][];
  redrawAt: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  size: number;
  kind: 0 | 1 | 2; // 0 flame, 1 ember, 2 spark
}

interface Ring {
  x: number;
  y: number;
  born: number;
  life: number;
  max: number;
  width: number;
}

interface Emitter {
  x: number;
  y: number;
  start: number;
  end: number;
  mode: Mode;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let w = 0;
let h = 0;
let flashUntil = 0;
let flashStart = 0;
let frameUntil = 0;
let frameStart = 0;
const bolts: Bolt[] = [];
const particles: Particle[] = [];
const rings: Ring[] = [];
const emitters: Emitter[] = [];
let sprites: HTMLCanvasElement[] = [];

/** Soft round sprites (hot core, flame, ember), drawn once and reused for every particle. */
function makeSprites() {
  const stops: [string, string, string][] = [
    ["rgba(255,248,225,1)", "rgba(255,170,60,0.85)", "rgba(255,90,20,0)"],
    ["rgba(255,236,190,1)", "rgba(255,130,40,0.7)", "rgba(200,40,10,0)"],
    ["rgba(255,255,255,1)", "rgba(255,210,140,0.9)", "rgba(255,160,60,0)"],
  ];
  return stops.map(([a, b, c]) => {
    const s = document.createElement("canvas");
    s.width = s.height = 64;
    const g = s.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, a);
    grad.addColorStop(0.35, b);
    grad.addColorStop(1, c);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return s;
  });
}

/** A jagged lightning path between two points (midpoint displacement). */
function jag(from: Point, to: Point, rough = 0.22): Point[] {
  let pts: Point[] = [from, to];
  let offset = Math.hypot(to[0] - from[0], to[1] - from[1]) * rough;
  for (let gen = 0; gen < 6; gen++) {
    const next: Point[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const d = rand(-offset, offset);
      next.push([(ax + bx) / 2 + (-(by - ay) / len) * d, (ay + by) / 2 + ((bx - ax) / len) * d], pts[i]);
    }
    pts = next;
    offset /= 2;
  }
  return pts;
}

function shape(b: Bolt) {
  b.pts = jag(b.from, b.to);
  b.branches = [];
  const forks = b.width > 2 ? 3 : 1;
  for (let i = 0; i < forks; i++) {
    const at = Math.floor(rand(0.2, 0.75) * b.pts.length);
    const [sx, sy] = b.pts[at];
    const angle = Math.atan2(b.to[1] - sy, b.to[0] - sx) + rand(-0.9, 0.9);
    const len = Math.hypot(b.to[0] - sx, b.to[1] - sy) * rand(0.25, 0.45);
    b.branches.push(jag([sx, sy], [sx + Math.cos(angle) * len, sy + Math.sin(angle) * len], 0.3));
  }
}

function addBolt(from: Point, to: Point, born: number, life: number, width: number) {
  const b: Bolt = { from, to, born, life, width, pts: [], branches: [], redrawAt: 0 };
  shape(b);
  bolts.push(b);
}

function edgePoint(): Point {
  const side = Math.floor(rand(0, 4));
  const t = Math.random();
  return side === 0 ? [t * w, -10] : side === 1 ? [w + 10, t * h] : side === 2 ? [t * w, h + 10] : [-10, t * h];
}

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "power-canvas";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  if (!sprites.length) sprites = makeSprites();
  resize();
  window.addEventListener("resize", resize);
}

function resize() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function teardown() {
  cancelAnimationFrame(raf);
  raf = 0;
  window.removeEventListener("resize", resize);
  canvas?.remove();
  canvas = null;
  ctx = null;
}

function path(c: CanvasRenderingContext2D, pts: Point[]) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
}

function drawBolt(c: CanvasRenderingContext2D, b: Bolt, now: number) {
  const t = (now - b.born) / b.life;
  if (t < 0 || t > 1) return;
  if (now > b.redrawAt) {
    shape(b); // lightning flickers: a new path every few frames
    b.redrawAt = now + rand(40, 80);
  }
  // The strike grows out of the source fast, then flickers and fades.
  const grow = Math.min(1, t / 0.18);
  const alpha = (t < 0.18 ? 1 : 1 - (t - 0.18) / 0.82) * (Math.random() > 0.15 ? 1 : 0.35);
  const main = b.pts.slice(0, Math.max(2, Math.ceil(b.pts.length * grow)));
  const layers: [number, string][] = [
    [b.width * 6, `rgba(255,110,30,${0.16 * alpha})`],
    [b.width * 2.6, `rgba(255,170,80,${0.5 * alpha})`],
    [b.width, `rgba(255,252,240,${alpha})`],
  ];
  for (const [lw, color] of layers) {
    c.lineWidth = lw;
    c.strokeStyle = color;
    path(c, main);
    c.stroke();
    if (grow === 1)
      for (const br of b.branches) {
        c.lineWidth = lw * 0.55;
        path(c, br);
        c.stroke();
      }
  }
}

function emit(e: Emitter, now: number) {
  if (now < e.start || now > e.end) return;
  const p = (now - e.start) / (e.end - e.start);
  if (e.mode === "surge") {
    // Fire spreads from under the button along the bottom of the screen, both ways.
    const reach = p * Math.max(e.x, w - e.x) * 1.15;
    for (let i = 0; i < 7; i++) {
      const x = e.x + rand(-reach, reach);
      particles.push({ x, y: h + rand(0, 20), vx: rand(-0.4, 0.4), vy: rand(-5.5, -2.2), born: now, life: rand(700, 1300), size: rand(40, 110), kind: 0 });
    }
    // And licks up both sides once it reaches them.
    if (p > 0.45)
      for (const x of [rand(-10, 30), w - rand(-10, 30)]) {
        particles.push({ x, y: rand(h * 0.35, h), vx: x < w / 2 ? rand(0.2, 1) : rand(-1, -0.2), vy: rand(-4, -1.5), born: now, life: rand(500, 900), size: rand(30, 70), kind: 0 });
      }
    if (Math.random() < 0.6)
      particles.push({ x: rand(0, w), y: h - rand(0, 60), vx: rand(-1, 1), vy: rand(-7, -3), born: now, life: rand(1200, 2000), size: rand(4, 9), kind: 1 });
  }
}

function frame(now: number) {
  const c = ctx;
  if (!c) return;
  c.clearRect(0, 0, w, h);
  c.globalCompositeOperation = "lighter";

  if (now < flashUntil) {
    const a = 1 - (now - flashStart) / (flashUntil - flashStart);
    c.fillStyle = `rgba(255,140,50,${0.22 * a * a})`;
    c.fillRect(0, 0, w, h);
  }

  // The app's edges glow while the power flows in.
  if (now < frameUntil) {
    const t = (now - frameStart) / (frameUntil - frameStart);
    const a = Math.sin(Math.PI * Math.min(1, t)) * 0.9;
    for (const [lw, al] of [
      [28, 0.12],
      [10, 0.3],
      [3, 0.9],
    ] as const) {
      c.lineWidth = lw;
      c.strokeStyle = `rgba(255,${150 + lw * 2},70,${al * a})`;
      c.strokeRect(0, 0, w, h);
    }
  }

  for (const r of rings) {
    const t = (now - r.born) / r.life;
    if (t < 0 || t > 1) continue;
    const ease = 1 - (1 - t) ** 3;
    c.lineWidth = r.width * (1 - t) + 1;
    c.strokeStyle = `rgba(255,190,110,${0.85 * (1 - t)})`;
    c.beginPath();
    c.arc(r.x, r.y, r.max * ease, 0, Math.PI * 2);
    c.stroke();
  }

  for (const e of emitters) emit(e, now);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const t = (now - p.born) / p.life;
    if (t >= 1) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx;
    p.y += p.vy;
    if (p.kind === 0) {
      p.vx *= 0.97;
      p.vy *= 0.985;
    } else if (p.kind === 2) {
      p.vy += 0.18; // sparks fall
      p.vx *= 0.96;
    } else p.vx += rand(-0.15, 0.15);
    if (p.kind === 0) {
      // A tongue of flame: tall and narrow, flickering sideways, white-hot at birth, red as it cools.
      const size = p.size * (1 - t * 0.55);
      const fw = size * 0.62;
      const fh = size * 1.5;
      const sway = Math.sin(now / 90 + p.born) * size * 0.08;
      c.globalAlpha = (t < 0.12 ? t / 0.12 : 1 - t) * 0.8;
      c.drawImage(sprites[t < 0.3 ? 2 : t < 0.65 ? 0 : 1], p.x - fw / 2 + sway, p.y - fh * 0.7, fw, fh);
    } else {
      const size = p.size * (1 - t);
      c.globalAlpha = 1 - t;
      c.drawImage(sprites[p.kind], p.x - size / 2, p.y - size / 2, size, size);
    }
  }
  c.globalAlpha = 1;

  for (const b of bolts) drawBolt(c, b, now);
  for (let i = bolts.length - 1; i >= 0; i--) if (now > bolts[i].born + bolts[i].life) bolts.splice(i, 1);
  for (let i = rings.length - 1; i >= 0; i--) if (now > rings[i].born + rings[i].life) rings.splice(i, 1);
  for (let i = emitters.length - 1; i >= 0; i--) if (now > emitters[i].end) emitters.splice(i, 1);

  const busy = bolts.length || particles.length || rings.length || emitters.length || now < flashUntil || now < frameUntil;
  if (busy) raf = requestAnimationFrame(frame);
  else teardown();
}

function burst(x: number, y: number, now: number, count: number, speed: number, kind: 0 | 1 | 2, life: [number, number], size: [number, number]) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const v = rand(speed * 0.3, speed);
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 0 ? 1.5 : 0), born: now, life: rand(...life), size: rand(...size), kind });
  }
}

function shake() {
  const main = document.getElementById("main");
  if (!main) return;
  main.classList.remove("power-shake");
  void main.offsetWidth;
  main.classList.add("power-shake");
  window.setTimeout(() => main.classList.remove("power-shake"), 600);
}

/** Play a power effect from a point on screen (usually the center of the button pressed). */
export function surge(x: number, y: number, mode: Mode = "surge") {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const glow = document.createElement("div");
    glow.className = "power-glow";
    glow.style.setProperty("--x", `${x}px`);
    glow.style.setProperty("--y", `${y}px`);
    document.body.appendChild(glow);
    window.setTimeout(() => glow.remove(), 900);
    return;
  }
  ensureCanvas();
  const now = performance.now();

  if (mode === "spark") {
    rings.push({ x, y, born: now, life: 520, max: 120, width: 5 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rand(-0.4, 0.4);
      const r = rand(60, 150);
      addBolt([x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r], now + i * 45, rand(160, 240), 1.4);
    }
    burst(x, y, now, 38, 7, 2, [400, 800], [3, 7]);
    burst(x, y, now, 8, 2.5, 0, [300, 500], [26, 50]);
  } else if (mode === "down") {
    rings.push({ x, y, born: now, life: 600, max: 90, width: 3 });
    for (let i = 0; i < 3; i++) {
      const a = rand(0, Math.PI * 2);
      addBolt([x + Math.cos(a) * 80, y + Math.sin(a) * 80], [x, y], now + i * 90, 160, 1);
    }
    burst(x, y, now, 18, 3, 1, [500, 900], [3, 6]);
  } else {
    flashStart = now;
    flashUntil = now + 420;
    frameStart = now + 250;
    frameUntil = now + 2300;
    const far = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    rings.push({ x, y, born: now, life: 900, max: far, width: 14 }, { x, y, born: now + 140, life: 1100, max: far, width: 6 });
    // The main strike: forks from the button to every edge, in two thunderclaps.
    for (let i = 0; i < 14; i++) {
      const born = now + (i < 8 ? i * 35 : 520 + (i - 8) * 60);
      addBolt([x, y], edgePoint(), born, rand(240, 420), i < 8 ? 2.6 : 1.8);
    }
    // Then lightning crawls along the edges of the app.
    for (let i = 0; i < 6; i++) {
      const top = i % 2 === 0;
      const sx = rand(0, w);
      const y0 = top ? rand(4, 24) : h - rand(4, 24);
      addBolt([sx, y0], [sx + rand(-0.5, 0.5) * w, y0], now + 700 + i * 110, 260, 1.4);
    }
    burst(x, y, now, 70, 10, 0, [500, 1000], [30, 80]);
    burst(x, y, now, 60, 13, 2, [600, 1200], [3, 8]);
    emitters.push({ x, y, start: now + 200, end: now + 1700, mode: "surge" });
    shake();
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

/** The center of an element, for surge(). */
export function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}
