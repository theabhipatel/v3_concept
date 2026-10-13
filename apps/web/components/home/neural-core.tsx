"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Resolve a CSS color token (oklch etc.) to a THREE.Color through a 1px canvas. */
function tokenColor(name: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "white";
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color(r / 255, g / 255, b / 255);
}

/** Soft round sprite used as an alpha mask for points (color comes from the tokens). */
function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

interface Shell {
  points: Float32Array;
  lines: Float32Array;
  colors: Float32Array;
}

/** Fibonacci sphere with jitter, plus links to each point's two nearest neighbours. */
function buildShell(count: number, radius: number, jitter: number, a: THREE.Color, b: THREE.Color): Shell {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const k = radius * (1 + (Math.random() - 0.5) * jitter);
    pts.push(new THREE.Vector3(Math.cos(t) * r * k, y * k, Math.sin(t) * r * k));
  }
  const points = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const tmp = new THREE.Color();
  pts.forEach((p, i) => {
    p.toArray(points, i * 3);
    tmp.copy(a).lerp(b, (p.y / radius + 1) / 2);
    tmp.toArray(colors, i * 3);
  });
  const segs: number[] = [];
  for (let i = 0; i < count; i++) {
    const near = pts
      .map((p, j) => ({ j, d: j === i ? Infinity : p.distanceToSquared(pts[i]) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 2);
    for (const { j } of near) if (j > i) segs.push(...pts[i].toArray(), ...pts[j].toArray());
  }
  return { points, lines: new Float32Array(segs), colors };
}

function Core({ quality }: { quality: "high" | "low" }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [palette, setPalette] = useState(() => ({
    brand: tokenColor("--brand"),
    brand2: tokenColor("--brand-2"),
    abi: tokenColor("--abi"),
    dark: document.documentElement.classList.contains("dark"),
  }));

  // Re-read colors when the theme changes (tokens are the single source of color).
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setPalette({
        brand: tokenColor("--brand"),
        brand2: tokenColor("--brand-2"),
        abi: tokenColor("--abi"),
        dark: document.documentElement.classList.contains("dark"),
      }),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const move = (e: PointerEvent) => {
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener("pointermove", move);
    };
  }, []);

  const n = quality === "high" ? 520 : 240;
  const shells = useMemo(
    () => ({
      inner: buildShell(Math.round(n * 0.55), 1.15, 0.25, palette.brand, palette.brand2),
      outer: buildShell(n, 1.9, 0.35, palette.brand2, palette.brand),
    }),
    [n, palette],
  );
  const texture = useMemo(() => dotTexture(), []);
  const blending = palette.dark ? THREE.AdditiveBlending : THREE.NormalBlending;

  useFrame((state, delta) => {
    if (!group.current || !inner.current || !outer.current || !glow.current) return;
    const p = Math.min(window.scrollY / (window.innerHeight * 1.1), 1.4); // 0 = closed, 1 = open
    const ease = 1 - Math.pow(1 - Math.min(p, 1), 3);
    const t = state.clock.elapsedTime;

    group.current.rotation.y += (pointer.current.x * 0.5 - group.current.rotation.y) * Math.min(delta * 2, 1);
    group.current.rotation.x += (pointer.current.y * 0.3 - group.current.rotation.x) * Math.min(delta * 2, 1);
    inner.current.rotation.y = t * (0.12 + ease * 0.5);
    inner.current.rotation.z = t * 0.05;
    outer.current.rotation.y = -t * (0.06 + ease * 0.2);
    inner.current.scale.setScalar(1 + ease * 0.9);
    outer.current.scale.setScalar(1 + ease * 1.8 + Math.sin(t * 0.8) * 0.015);
    const glowScale = 1.6 + ease * 1.4 + Math.sin(t * 1.6) * 0.06;
    glow.current.scale.setScalar(glowScale);
    glow.current.material.opacity = (palette.dark ? 0.28 : 0.4) + ease * 0.35;
  });

  return (
    <group ref={group}>
      <sprite ref={glow}>
        <spriteMaterial map={texture} color={palette.abi} transparent opacity={0.3} blending={blending} depthWrite={false} />
      </sprite>
      {(["inner", "outer"] as const).map((key) => (
        <group key={`${key}-${n}-${palette.dark}`} ref={key === "inner" ? inner : outer}>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[shells[key].points, 3]} />
              <bufferAttribute attach="attributes-color" args={[shells[key].colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
              size={key === "inner" ? 0.07 : 0.055}
              map={texture}
              vertexColors
              transparent
              depthWrite={false}
              blending={blending}
              sizeAttenuation
            />
          </points>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[shells[key].lines, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={key === "inner" ? palette.brand : palette.brand2} transparent opacity={palette.dark ? 0.22 : 0.3} depthWrite={false} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

/**
 * The only WebGL canvas on the site. Renders only while visible and the tab is active,
 * stays still for reduced motion, and lowers quality on weak devices.
 */
export default function NeuralCore() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [quality] = useState<"high" | "low">(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || window.innerWidth < 640;
    return weak ? "low" : "high";
  });

  useEffect(() => {
    const onScroll = () => {
      const p = window.scrollY / window.innerHeight;
      if (wrap.current) wrap.current.style.opacity = String(Math.max(0, Math.min(1, 1.35 - p * 0.9)));
      setVisible(p < 1.55);
    };
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const frameloop = reduced ? "demand" : visible && tabVisible ? "always" : "never";

  return (
    <div ref={wrap} className="pointer-events-none fixed inset-0 -z-0 transition-opacity duration-300" aria-hidden>
      <Canvas
        frameloop={frameloop}
        dpr={quality === "high" ? [1, 1.5] : 1}
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <Core quality={quality} />
      </Canvas>
    </div>
  );
}
