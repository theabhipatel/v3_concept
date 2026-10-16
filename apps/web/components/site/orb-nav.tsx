"use client";

import { Mic, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { abi, PTT_RELEASE, useAbi } from "@/components/abi/abi-store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

// Radial layout: two arcs fanning up-left from the orb in the bottom-right corner.
const ITEMS = [...NAV_ITEMS, { href: "#ask", label: "Ask ABI", icon: Sparkles }];
function position(i: number) {
  const inner = i < 4;
  const idx = inner ? i : i - 4;
  const radius = inner ? 92 : 162;
  const angle = Math.PI + (idx / 3) * (Math.PI / 2); // 180deg (left) -> 270deg (up)
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
}

/** The ABI orb is the navbar: click for a radial page menu, hold Space or the mic to talk. */
export function OrbNav() {
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;
  const setMenuOpen = (open: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof open === "function" ? open(menuOpen) : open) ? pathname : null);
  const panelOpen = useAbi((s) => s.open);
  const listening = useAbi((s) => s.listening);
  const speaking = useAbi((s) => s.speaking);
  const firstItem = useRef<HTMLAnchorElement>(null);
  const active = panelOpen || listening || speaking;

  useEffect(() => {
    if (menuOpen) firstItem.current?.focus();
  }, [menuOpen]);

  // Hold Space (outside text fields) to talk to ABI.
  useEffect(() => {
    let timer: number | undefined;
    let holding = false;
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (holding) {
        e.preventDefault();
        return;
      }
      if (e.repeat || timer) return;
      timer = window.setTimeout(() => {
        holding = true;
        abi.requestListen();
      }, 350);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      window.clearTimeout(timer);
      timer = undefined;
      if (holding) {
        holding = false;
        window.dispatchEvent(new Event(PTT_RELEASE));
      }
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("keydown", esc);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7" data-abi-target="orb">
      <nav aria-label="Main" className={cn("absolute bottom-7 right-7 size-0", !menuOpen && "pointer-events-none")}>
        <ul>
          {ITEMS.map((item, i) => {
            const { x, y } = position(i);
            const Icon = item.icon;
            const current = item.href === pathname;
            const common = cn(
              "group absolute left-1/2 top-1/2 grid size-12 place-items-center rounded-full border bg-popover/95 text-muted-foreground shadow-md backdrop-blur transition-[transform,opacity,color] duration-(--duration-base) ease-out-expo hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
              current && "border-brand/50 text-brand-text",
              menuOpen ? "opacity-100" : "opacity-0",
            );
            const style = {
              transform: menuOpen
                ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                : "translate(-50%, -50%) scale(0.4)",
              transitionDelay: menuOpen ? `${i * 25}ms` : "0ms",
            };
            const label = (
              <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-full border bg-popover px-2.5 py-1 text-xs font-medium text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {item.label}
              </span>
            );
            return (
              <li key={item.href}>
                {item.href === "#ask" ? (
                  <button
                    type="button"
                    tabIndex={menuOpen ? 0 : -1}
                    aria-label="Ask ABI"
                    className={cn(common, "text-abi-text")}
                    style={style}
                    onClick={() => {
                      setMenuOpen(false);
                      abi.open();
                    }}
                  >
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    ref={i === 0 ? firstItem : undefined}
                    tabIndex={menuOpen ? 0 : -1}
                    aria-label={item.label}
                    aria-current={current ? "page" : undefined}
                    className={common}
                    style={style}
                  >
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          aria-label={listening ? "Release to send" : "Hold to talk to ABI"}
          title="Hold to talk (or hold Space)"
          onPointerDown={(e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            abi.requestListen();
          }}
          onPointerUp={() => window.dispatchEvent(new Event(PTT_RELEASE))}
          onPointerLeave={() => listening && window.dispatchEvent(new Event(PTT_RELEASE))}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            if (listening) window.dispatchEvent(new Event(PTT_RELEASE));
            else abi.requestListen();
          }}
          className={cn(
            "grid size-10 touch-none select-none place-items-center rounded-full border bg-popover/90 text-muted-foreground shadow-md backdrop-blur transition-[color,opacity] hover:text-foreground",
            listening && "border-abi/60 bg-abi-soft text-abi-text",
            menuOpen && "pointer-events-none opacity-0",
          )}
        >
          <Mic className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          title="ABI (Abhi's Brain Interface)"
          onClick={() => setMenuOpen((o) => !o)}
          className={cn("abi-orb relative grid size-14 place-items-center rounded-full", active && "abi-orb--active")}
        >
          <span className="abi-orb__core" aria-hidden />
          {menuOpen && <X className="relative size-5 text-primary-foreground" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
