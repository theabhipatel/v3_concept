"use client";

import { Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePower } from "./power-store";
import { centerOf, surge } from "./surge";

/**
 * Top right of every page. Visitors see "Sign in": pressing it charges the button (a ring of
 * current races around it, sparks fly) before the sign-in page opens. Signed-in users see their
 * initial with a bolt that is lit while power mode is on.
 */
export function AccountButton() {
  const router = useRouter();
  const ready = usePower((s) => s.ready);
  const user = usePower((s) => s.user);
  const powered = usePower((s) => Boolean(s.power?.enabled && s.power.hasKey));
  const ref = useRef<HTMLButtonElement>(null);
  const [charging, setCharging] = useState(false);

  if (!ready) return <span className="h-10 w-[5.5rem]" aria-hidden />;

  if (user)
    return (
      <Link
        href="/settings"
        className="account-chip group relative inline-flex h-10 items-center gap-2 rounded-full border bg-card/80 pl-1 pr-3 text-sm font-semibold backdrop-blur transition-colors hover:border-brand/50"
        data-powered={powered || undefined}
        aria-label={`ABI settings for ${user.name}${powered ? ", power mode on" : ""}`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-bold uppercase text-primary-foreground">
          {(user.name || user.email).slice(0, 1)}
        </span>
        <Zap className={cn("account-chip__bolt size-4", powered ? "text-brand-text" : "text-muted-foreground")} aria-hidden fill={powered ? "currentColor" : "none"} />
        <span className="hidden sm:inline">{powered ? "Powered" : "Settings"}</span>
      </Link>
    );

  return (
    <button
      ref={ref}
      type="button"
      data-charging={charging || undefined}
      onPointerEnter={() => router.prefetch("/signin")}
      onClick={() => {
        if (charging) return;
        setCharging(true);
        const [x, y] = centerOf(ref.current!);
        surge(x, y, "spark");
        window.setTimeout(() => router.push("/signin"), 560);
        window.setTimeout(() => setCharging(false), 1200);
      }}
      className="signin-btn group relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-full px-4 text-sm font-semibold"
    >
      <span className="signin-btn__charge" aria-hidden />
      <Zap className="signin-btn__bolt relative size-4" aria-hidden />
      <span className="relative">Sign in</span>
    </button>
  );
}
