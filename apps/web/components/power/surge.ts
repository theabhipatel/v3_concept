"use client";

// Power effects, drawn on one temporary full-screen canvas that removes itself when done:
// - "spark": a small charge around a button (sign in).
// - "surge": power mode switching on. Lightning forks out of the button to every edge of the
//   screen, then the power wires the app up like a motherboard: copper traces route out of the
//   button to chips and pads, and two buses carry it into a GPU and a CPU that draw themselves
//   and boot (cores waking in a wave, memory filling, clocks climbing). Then it all fades away.
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
}

interface Ring {
  x: number;
  y: number;
  born: number;
  life: number;
  max: number;
  width: number;
}

/** A copper trace: a 90/45 degree route, revealed from the button outwards. */
interface Trace {
  pts: Point[];
  seg: number[];
  L: number;
  end: "chip" | "pad" | null;
  delay: number;
  speed: number;
}

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  delay: number;
  busy: number;
  ph: number;
}

interface Processor {
  kind: "gpu" | "cpu";
  x: number;
  y: number;
  w: number;
  h: number;
  at: number; // when the outline starts drawing
  cores: Cell[];
  memory: Cell[];
  label: string;
  stats: [label: string, to: number, format: (v: number) => string][];
  statsBelow: boolean;
}

/** The surge's hardware: built once per surge, drawn every frame until it fades. */
interface Rig {
  start: number;
  traces: Trace[];
  buses: Trace[];
  chips: Processor[];
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - (1 - clamp(t)) ** 3;
const TAU = Math.PI * 2;
const RIG_FADE_START = 3300;
const RIG_END = 4200;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let w = 0;
let h = 0;
let flashUntil = 0;
let flashStart = 0;
let frameUntil = 0;
let frameStart = 0;
let mono = "ui-monospace, monospace";
let rig: Rig | null = null;
const bolts: Bolt[] = [];
const particles: Particle[] = [];
const rings: Ring[] = [];
let spark: HTMLCanvasElement | null = null;

/** A soft white-hot sprite for sparks and current, drawn once and reused. */
function makeSpark() {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const g = s.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,248,1)");
  grad.addColorStop(0.3, "rgba(255,200,130,0.85)");
  grad.addColorStop(1, "rgba(255,120,40,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return s;
}

function glow(c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  const before = c.globalAlpha; // keeps any fade already applied
  c.globalAlpha = before * clamp(alpha);
  c.drawImage(spark!, x - size / 2, y - size / 2, size, size);
  c.globalAlpha = before;
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
  spark ??= makeSpark();
  const code = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
  if (code) mono = `${code}, ui-monospace, monospace`;
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
  rig = null;
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

/** A line of current: wide orange glow, warm middle, white-hot core. */
function glowStroke(c: CanvasRenderingContext2D, pts: Point[], alpha: number, width: number) {
  const layers: [number, string][] = [
    [width * 6, `rgba(255,110,30,${0.14 * alpha})`],
    [width * 2.4, `rgba(255,170,80,${0.5 * alpha})`],
    [width, `rgba(255,250,238,${alpha})`],
  ];
  for (const [lw, color] of layers) {
    c.lineWidth = lw;
    c.strokeStyle = color;
    path(c, pts);
    c.stroke();
  }
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
  glowStroke(c, b.pts.slice(0, Math.max(2, Math.ceil(b.pts.length * grow))), alpha, b.width);
  if (grow === 1) for (const br of b.branches) glowStroke(c, br, alpha * 0.8, b.width * 0.55);
}

// ---------- The rig: traces, GPU and CPU ----------

function measure(pts: Point[]) {
  const seg: number[] = [];
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    L += l;
  }
  return { seg, L };
}

/** The first `d` pixels of a polyline. */
function cut(pts: Point[], seg: number[], d: number): Point[] {
  const out: Point[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (d >= seg[i]) {
      out.push(pts[i + 1]);
      d -= seg[i];
      continue;
    }
    const k = d / seg[i];
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
    break;
  }
  return out;
}

const DIRS: Point[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

function inside(p: Point, boxes: Processor[], pad = 18) {
  return boxes.some((b) => p[0] > b.x - pad && p[0] < b.x + b.w + pad && p[1] > b.y - pad - 40 && p[1] < b.y + b.h + pad + 40);
}

function processor(kind: "gpu" | "cpu", cx: number, cy: number, at: number, width?: number): Processor {
  const gpu = kind === "gpu";
  const pw = width ?? (gpu ? clamp(w * 0.34, 230, 440) : clamp(w * 0.17, 120, 190));
  const ph = gpu ? pw * 0.6 : pw;
  const x = clamp(cx - pw / 2, 16, w - pw - 16);
  const y = clamp(cy - ph / 2, 70, h - ph - 70);
  const cores: Cell[] = [];
  const memory: Cell[] = [];
  if (gpu) {
    // Thousands of small cores in the middle, four memory stacks on the sides.
    const ax = x + pw * 0.17;
    const ay = y + ph * 0.12;
    const aw = pw * 0.66;
    const ah = ph * 0.76;
    const cols = 18;
    const rows = 10;
    const gap = 2;
    const cw = (aw - gap * (cols - 1)) / cols;
    const ch = (ah - gap * (rows - 1)) / rows;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const px = ax + i * (cw + gap);
        const py = ay + j * (ch + gap);
        const d = Math.hypot(px - x, py - (y + ph / 2)) / pw;
        cores.push({ x: px, y: py, w: cw, h: ch, delay: at + 280 + d * 900 + rand(0, 60), busy: Math.random(), ph: rand(0, TAU) });
      }
    const mw = pw * 0.1;
    const mh = ph * 0.36;
    for (const [mx, my] of [
      [x + pw * 0.035, y + ph * 0.1],
      [x + pw * 0.035, y + ph * 0.54],
      [x + pw * 0.865, y + ph * 0.1],
      [x + pw * 0.865, y + ph * 0.54],
    ])
      memory.push({ x: mx, y: my, w: mw, h: mh, delay: at + 500 + memory.length * 120, busy: 0, ph: 0 });
  } else {
    // A CPU: a die with 16 big cores lighting in order, and a shared cache filling below them.
    const dx = x + pw * 0.16;
    const dy = y + pw * 0.14;
    const dw = pw * 0.68;
    const gap = 3;
    const cw = (dw - gap * 3) / 4;
    const chh = (pw * 0.5 - gap * 3) / 4;
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++)
        cores.push({ x: dx + i * (cw + gap), y: dy + j * (chh + gap), w: cw, h: chh, delay: at + 300 + (i + j) * 110 + rand(0, 40), busy: Math.random(), ph: rand(0, TAU) });
    memory.push({ x: dx, y: dy + pw * 0.53, w: dw, h: pw * 0.13, delay: at + 600, busy: 0, ph: 0 });
  }
  return {
    kind,
    x,
    y,
    w: pw,
    h: ph,
    at,
    cores,
    memory,
    label: gpu ? "GPU  /  OPENAI" : "CPU",
    stats: gpu
      ? (
          [
            ["CLOCK", 2.84, (v) => `${v.toFixed(2)} GHz`],
            ["TFLOPS", 312, (v) => `${Math.round(v)}`],
            ["MEMORY", 80, (v) => `${Math.round(v)} GB`],
          ] satisfies Processor["stats"]
        ).slice(0, width ? 2 : 3) // phones: two readouts fit
      : [
          ["CORES", 16, (v) => `${Math.round(v)}`],
          ["BOOST", 5.6, (v) => `${v.toFixed(1)} GHz`],
        ],
    statsBelow: y + ph + 60 < h,
  };
}

/** A bus of three parallel lines from the button to the nearest side of a chip, 90/45 routed. */
function busTo(o: Point, r: number, p: Processor, now: number): Trace[] {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const sideways = Math.abs(cx - o[0]) > Math.abs(cy - o[1]);
  const target: Point = sideways ? [cx > o[0] ? p.x : p.x + p.w, cy] : [cx, cy > o[1] ? p.y : p.y + p.h];
  const dx = target[0] - o[0];
  const dy = target[1] - o[1];
  return [-7, 0, 7].map((off) => {
    const start: Point = sideways ? [o[0] + Math.sign(dx) * r, o[1] + off] : [o[0] + off, o[1] + Math.sign(dy) * r];
    const end: Point = sideways ? [target[0], target[1] + off] : [target[0] + off, target[1]];
    // Straight along the long axis, then a 45 degree run into the chip.
    const elbow: Point = sideways
      ? [end[0] - Math.sign(dx) * Math.min(Math.abs(end[1] - start[1]), Math.abs(dx) * 0.6), start[1]]
      : [start[0], end[1] - Math.sign(dy) * Math.min(Math.abs(end[0] - start[0]), Math.abs(dy) * 0.6)];
    const knee: Point = sideways
      ? [elbow[0] + Math.sign(dx) * Math.abs(end[1] - start[1]), end[1]]
      : [end[0], elbow[1] + Math.sign(dy) * Math.abs(end[0] - start[0])];
    const pts: Point[] = [start, elbow, knee, end];
    return { pts, ...measure(pts), end: null, delay: now + 380, speed: w * 1.1 };
  });
}

function buildRig(o: Point, r: number, now: number): Rig {
  // The GPU and CPU sit on the open side of the screen, away from the button.
  // Phones: side by side in one row, on the half of the screen the button is not on.
  const narrow = w < 720;
  const right = o[0] < w / 2;
  let chips: Processor[];
  if (narrow) {
    const gw = clamp(w * 0.56, 180, 300);
    const cw = clamp(w * 0.3, 96, 140);
    const row = o[1] < h / 2 ? h * 0.66 : h * 0.3;
    chips = [processor("gpu", 16 + gw / 2, row, now + 750, gw), processor("cpu", w - 16 - cw / 2, row, now + 820, cw)];
  } else {
    chips = [
      processor("gpu", right ? w * 0.68 : w * 0.32, h * 0.34, now + 750),
      processor("cpu", right ? w * 0.56 : w * 0.44, h * 0.76, now + 820),
    ];
  }
  const buses = chips.flatMap((p) => busTo(o, r, p, now));

  const traces: Trace[] = [];
  const g = Math.max(12, w / 60);
  const count = narrow ? 14 : 22;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * TAU + rand(0, 0.25);
    let p: Point = [o[0] + Math.cos(ang) * r, o[1] + Math.sin(ang) * r];
    const pts: Point[] = [p];
    const segs = 3 + Math.floor(rand(0, 4));
    for (let k = 0; k < segs; k++) {
      const a = ang + rand(-0.65, 0.65);
      const d = DIRS[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
      const len = (2 + Math.floor(rand(0, 8))) * g * (d[0] && d[1] ? 0.72 : 1);
      const n: Point = [clamp(p[0] + d[0] * len, 8, w - 8), clamp(p[1] + d[1] * len, 8, h - 8)];
      if (Math.hypot(n[0] - p[0], n[1] - p[1]) < 4 || inside(n, chips)) break;
      pts.push(n);
      p = n;
    }
    if (pts.length < 2) continue;
    traces.push({ pts, ...measure(pts), end: Math.random() < 0.35 ? "chip" : "pad", delay: now + rand(380, 650), speed: w * rand(0.75, 1.15) });
  }
  return { start: now, traces, buses, chips };
}

function drawTrace(c: CanvasRenderingContext2D, tr: Trace, now: number, width: number) {
  const lt = (now - tr.delay) / 1000;
  if (lt < 0) return;
  const shown = Math.min(tr.L, lt * tr.speed);
  const doneAt = tr.L / tr.speed;
  const settled = lt > doneAt ? clamp(1 - (lt - doneAt) * 0.9, 0.38, 1) : 1;
  glowStroke(c, cut(tr.pts, tr.seg, shown), settled, width);
  if (shown < tr.L) {
    const head = cut(tr.pts, tr.seg, shown).pop()!;
    glow(c, head[0], head[1], 26, 1);
    return;
  }
  const end = tr.pts[tr.pts.length - 1];
  const lit = clamp((lt - doneAt) / 0.25);
  if (tr.end) {
    c.lineWidth = 1.4;
    c.strokeStyle = `rgba(255,180,100,${0.4 + 0.6 * lit})`;
    if (tr.end === "chip") {
      c.fillStyle = `rgba(255,140,50,${0.1 + 0.2 * lit})`;
      c.fillRect(end[0] - 13, end[1] - 8, 26, 16);
      c.strokeRect(end[0] - 13, end[1] - 8, 26, 16);
      c.beginPath();
      for (let p = -1; p <= 1; p++) {
        c.moveTo(end[0] + p * 7, end[1] - 8);
        c.lineTo(end[0] + p * 7, end[1] - 12);
        c.moveTo(end[0] + p * 7, end[1] + 8);
        c.lineTo(end[0] + p * 7, end[1] + 12);
      }
      c.stroke();
    } else {
      c.beginPath();
      c.arc(end[0], end[1], 4.5, 0, TAU);
      c.stroke();
    }
    if (lit < 1) glow(c, end[0], end[1], 50 * (1 - lit) + 12, 1 - lit);
  }
  // Current keeps running along the copper.
  for (let k = 0; k < 2; k++) {
    const pos = ((lt - doneAt) * tr.speed * 0.45 + (k * tr.L) / 2) % tr.L;
    const p = cut(tr.pts, tr.seg, pos).pop()!;
    glow(c, p[0], p[1], 16, 0.9);
  }
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + rw, y, x + rw, y + rh, r);
  c.arcTo(x + rw, y + rh, x, y + rh, r);
  c.arcTo(x, y + rh, x, y, r);
  c.arcTo(x, y, x + rw, y, r);
  c.closePath();
}

function drawProcessor(c: CanvasRenderingContext2D, p: Processor, now: number) {
  const outline = ease((now - p.at) / 350);
  if (outline <= 0) return;
  const gpu = p.kind === "gpu";

  // The package draws itself, edge by edge.
  roundRect(c, p.x, p.y, p.w, p.h, gpu ? 14 : 10);
  const per = 2 * (p.w + p.h);
  c.setLineDash([per * outline, per]);
  c.lineWidth = 1.6;
  c.strokeStyle = "rgba(255,170,90,0.9)";
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = `rgba(255,120,40,${0.05 * outline})`;
  c.fill();

  // Pins (CPU, all four sides) or power stages (GPU, along the top) light up first.
  c.fillStyle = `rgba(255,170,80,${0.55 * outline})`;
  if (gpu) {
    for (let i = 0; i < 10; i++) {
      const lit = now - (p.at + 100 + i * 30);
      if (lit < 0) continue;
      const vx = p.x + p.w * 0.1 + (i * p.w * 0.8) / 9;
      c.fillRect(vx - 5, p.y - 16, 10, 10);
      if (lit < 300) glow(c, vx, p.y - 11, 30, 1 - lit / 300);
    }
  } else {
    const n = 9;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const t = 0.12 + (i * 0.76) / (n - 1);
      c.rect(p.x + p.w * t - 1.5, p.y - 6 * outline, 3, 5 * outline);
      c.rect(p.x + p.w * t - 1.5, p.y + p.h + 1, 3, 5 * outline);
      c.rect(p.x - 6 * outline, p.y + p.h * t - 1.5, 5 * outline, 3);
      c.rect(p.x + p.w + 1, p.y + p.h * t - 1.5, 5 * outline, 3);
    }
    c.fill();
  }

  // Cores wake in a wave: a white flash, then a warm hum that flickers under load.
  for (const k of p.cores) {
    const lt = (now - k.delay) / 1000;
    if (lt < 0) {
      c.strokeStyle = "rgba(255,150,70,0.12)";
      c.lineWidth = 1;
      c.strokeRect(k.x, k.y, k.w, k.h);
      continue;
    }
    const flash = clamp(1 - lt / 0.22);
    const hum = 0.28 + 0.32 * k.busy * (0.5 + 0.5 * Math.sin((now / 1000) * (4 + k.busy * 8) + k.ph));
    c.fillStyle = flash > 0 ? `rgba(255,245,225,${0.4 + 0.6 * flash})` : `rgba(255,${120 + Math.round(k.busy * 90)},50,${hum})`;
    c.fillRect(k.x, k.y, k.w, k.h);
  }

  // Memory fills up in steps (HBM stacks on the GPU, the shared cache on the CPU).
  for (const m of p.memory) {
    c.strokeStyle = "rgba(255,190,110,0.7)";
    c.lineWidth = 1.2;
    c.strokeRect(m.x, m.y, m.w, m.h);
    const fill = ease((now - m.delay) / 700);
    const bars = 6;
    c.fillStyle = "rgba(247,185,85,0.55)";
    for (let b = 0; b < bars && fill * bars > b; b++) {
      if (gpu) {
        const bh = (m.h - 6) / bars;
        c.fillRect(m.x + 3, m.y + m.h - 3 - (b + 1) * bh + 1.5, m.w - 6, bh - 3);
      } else {
        const bw = (m.w - 6) / bars;
        c.fillRect(m.x + 3 + b * bw + 1.5, m.y + 3, bw - 3, m.h - 6);
      }
    }
  }

  const size = Math.max(9, p.w * (gpu ? 0.024 : 0.06));
  c.font = `600 ${size}px ${mono}`;
  c.fillStyle = `rgba(255,190,120,${0.8 * outline})`;
  c.fillText(p.label, p.x + 10, p.y + p.h - 9);

  // Live readouts count up next to the chip.
  const k = ease((now - p.at - 250) / 1500);
  if (k <= 0) return;
  const top = p.statsBelow ? p.y + p.h + 26 : p.y - (gpu ? 62 : 46);
  const step = Math.max(p.w / p.stats.length, w < 720 ? 64 : 82);
  p.stats.forEach(([label, to, format], i) => {
    const x = p.x + i * step;
    c.font = `500 ${Math.max(9, size * 0.95)}px ${mono}`;
    c.fillStyle = "rgba(190,170,155,0.9)";
    c.fillText(label, x, top);
    c.font = `600 ${Math.max(12, size * 1.6)}px ${mono}`;
    c.fillStyle = "rgba(247,185,85,1)";
    c.fillText(format(to * k), x, top + Math.max(16, size * 2));
  });
}

function drawRig(c: CanvasRenderingContext2D, r: Rig, now: number) {
  const age = now - r.start;
  if (age > RIG_END) {
    rig = null;
    return;
  }
  // Everything fades out together at the end.
  c.save();
  c.globalAlpha = age > RIG_FADE_START ? 1 - (age - RIG_FADE_START) / (RIG_END - RIG_FADE_START) : 1;
  for (const tr of r.traces) drawTrace(c, tr, now, 1.3);
  for (const b of r.buses) drawTrace(c, b, now, 1.1);
  for (const p of r.chips) drawProcessor(c, p, now);
  c.restore();
}

// ---------- The frame loop ----------

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
    const a = Math.sin(Math.PI * clamp(t)) * 0.9;
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
    c.lineWidth = r.width * (1 - t) + 1;
    c.strokeStyle = `rgba(255,190,110,${0.85 * (1 - t)})`;
    c.beginPath();
    c.arc(r.x, r.y, r.max * ease(t), 0, TAU);
    c.stroke();
  }

  if (rig) drawRig(c, rig, now);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const t = (now - p.born) / p.life;
    if (t >= 1) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18; // sparks fall
    p.vx *= 0.96;
    glow(c, p.x, p.y, p.size * (1 - t), 1 - t);
  }

  for (const b of bolts) drawBolt(c, b, now);
  for (let i = bolts.length - 1; i >= 0; i--) if (now > bolts[i].born + bolts[i].life) bolts.splice(i, 1);
  for (let i = rings.length - 1; i >= 0; i--) if (now > rings[i].born + rings[i].life) rings.splice(i, 1);

  const busy = rig || bolts.length || particles.length || rings.length || now < flashUntil || now < frameUntil;
  if (busy) raf = requestAnimationFrame(frame);
  else teardown();
}

function burst(x: number, y: number, now: number, count: number, speed: number, life: [number, number], size: [number, number]) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const v = rand(speed * 0.3, speed);
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born: now, life: rand(...life), size: rand(...size) });
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

/**
 * Play a power effect from a point on screen (usually the center of the button pressed).
 * r = the button's radius, where traces and buses leave it.
 */
export function surge(x: number, y: number, mode: Mode = "surge", r = 40) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const soft = document.createElement("div");
    soft.className = "power-glow";
    soft.style.setProperty("--x", `${x}px`);
    soft.style.setProperty("--y", `${y}px`);
    document.body.appendChild(soft);
    window.setTimeout(() => soft.remove(), 900);
    return;
  }
  ensureCanvas();
  const now = performance.now();

  if (mode === "spark") {
    rings.push({ x, y, born: now, life: 520, max: 120, width: 5 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + rand(-0.4, 0.4);
      const len = rand(60, 150);
      addBolt([x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len], now + i * 45, rand(160, 240), 1.4);
    }
    burst(x, y, now, 38, 7, [400, 800], [8, 16]);
  } else if (mode === "down") {
    rings.push({ x, y, born: now, life: 600, max: 90, width: 3 });
    for (let i = 0; i < 3; i++) {
      const a = rand(0, TAU);
      addBolt([x + Math.cos(a) * 80, y + Math.sin(a) * 80], [x, y], now + i * 90, 160, 1);
    }
    burst(x, y, now, 14, 3, [500, 900], [6, 12]);
  } else {
    flashStart = now;
    flashUntil = now + 420;
    frameStart = now + 250;
    frameUntil = now + 2300;
    const far = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    rings.push({ x, y, born: now, life: 900, max: far, width: 14 }, { x, y, born: now + 140, life: 1100, max: far, width: 6 });
    // The strike: forks from the button to every edge, in two thunderclaps.
    for (let i = 0; i < 12; i++) {
      const born = now + (i < 7 ? i * 35 : 480 + (i - 7) * 60);
      addBolt([x, y], edgePoint(), born, rand(240, 400), i < 7 ? 2.6 : 1.8);
    }
    burst(x, y, now, 50, 12, [600, 1100], [8, 18]);
    rig = buildRig([x, y], r + 4, now);
    shake();
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

/** The center of an element, for surge(). */
export function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}
