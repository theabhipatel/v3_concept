"use client";

import { Mic, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AbiBot } from "@/components/abi/abi-bot";
import { abi, PTT_RELEASE, useAbi } from "@/components/abi/abi-store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { getLenis } from "./smooth-scroll";

// Radial layout: two arcs fanning up-left from the orb (3 inner, 5 outer), labels under icons.
const ITEMS = [...NAV_ITEMS, { href: "#ask", label: "Ask ABI", icon: Sparkles }];
const INNER = 3;
function position(i: number) {
  const inner = i < INNER;
  const t = inner ? i / (INNER - 1) : (i - INNER) / (ITEMS.length - INNER - 1);
  const radius = inner ? 118 : 232;
  const start = Math.PI * (193 / 180); // just above horizontal, so bottom labels stay on screen
  const angle = start + t * (Math.PI * 1.5 - start); // -> 270deg (up)
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
}

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
}

/** The ABI orb is the navbar: click for a radial page menu over a dimmed screen, hold Space or the mic to talk. */
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
    if (!menuOpen) return;
    firstItem.current?.focus();
    // Freeze the page behind the menu while it is open.
    const lenis = getLenis();
    lenis?.stop();
    return () => lenis?.start();
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
      {/* Full-screen backdrop: dims the page so the menu is the only thing in focus */}
      <div
        aria-hidden
        onClick={() => setMenuOpen(false)}
        className={cn("orb-backdrop", menuOpen ? "orb-backdrop--open" : "pointer-events-none")}
      >
        <span className="orb-backdrop__glow" />
        <span className="orb-backdrop__ring" />
        <span className="orb-backdrop__ring" style={{ animationDelay: "-1.6s" }} />
        <span className="orb-backdrop__ring" style={{ animationDelay: "-3.2s" }} />
      </div>

      <nav aria-label="Main" className={cn("absolute bottom-7 right-7 size-0", !menuOpen && "pointer-events-none")}>
        <ul>
          {ITEMS.map((item, i) => {
            const { x, y } = position(i);
            const Icon = item.icon;
            const current = item.href === pathname;
            const ask = item.href === "#ask";
            const className = cn(
              "group absolute left-0 top-0 flex w-24 flex-col items-center gap-1.5 outline-none transition-[translate,scale,opacity] duration-500 ease-out-expo",
              menuOpen ? "opacity-100" : "scale-50 opacity-0",
            );
            const style = {
              translate: menuOpen ? `calc(-50% + ${x}px) calc(-26px + ${y}px)` : "-50% -26px",
              transitionDelay: menuOpen ? `${60 + i * 35}ms` : "0ms",
            };
            const content = (
              <>
                <span
                  className={cn(
                    "grid size-13 place-items-center rounded-full border shadow-lg transition-[background-color,border-color,color,scale] duration-(--duration-base) group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-ring",
                    current
                      ? "border-primary bg-primary text-primary-foreground"
                      : ask
                        ? "border-abi/70 bg-popover text-abi-text group-hover:border-abi"
                        : "border-border-strong bg-popover text-foreground group-hover:border-brand group-hover:text-brand-text",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="whitespace-nowrap rounded-full bg-popover/90 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
                  {item.label}
                </span>
              </>
            );
            return (
              <li key={item.href}>
                {ask ? (
                  <button
                    type="button"
                    tabIndex={menuOpen ? 0 : -1}
                    className={className}
                    style={style}
                    onClick={() => {
                      setMenuOpen(false);
                      abi.open();
                    }}
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    ref={i === 0 ? firstItem : undefined}
                    tabIndex={menuOpen ? 0 : -1}
                    aria-current={current ? "page" : undefined}
                    className={className}
                    style={style}
                  >
                    {content}
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
          className="abi-orb relative grid size-14 place-items-center"
        >
          <AbiBot state={menuOpen ? "menu" : listening ? "listening" : speaking ? "speaking" : active ? "active" : "idle"} size={56} />
        </button>
      </div>
    </div>
  );
}
