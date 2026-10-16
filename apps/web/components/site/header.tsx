import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { profile } from "@/lib/content";
import { PaletteTrigger } from "./command-palette";

/** Not a navbar: a quiet wordmark and utilities. Navigation lives in the ABI orb. */
export function Header() {
  return (
    <header className="abi-shift absolute left-0 right-(--abi-dock) top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-full font-display text-base font-semibold tracking-tight"
          aria-label={`${profile.brand} home`}
        >
          <span className="relative grid size-7 place-items-center rounded-full bg-brand">
            <span className="size-2.5 rounded-full bg-background/90 transition-transform duration-(--duration-base) group-hover:scale-125" />
          </span>
          {profile.brand}
        </Link>
        <div className="flex items-center gap-2">
          <PaletteTrigger />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
