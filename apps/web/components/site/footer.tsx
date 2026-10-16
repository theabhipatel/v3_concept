import Link from "next/link";
import { NamedIcon } from "@/components/icons";
import { profile } from "@/lib/content";
import { NAV_ITEMS } from "./nav-items";

export function Footer() {
  return (
    <footer className="relative border-t bg-background-deep">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="font-display text-xl font-semibold">{profile.brand}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {profile.name}, {profile.title} in {profile.location.city}, {profile.location.country}. This site is
            run by ABI (Abhi&apos;s Brain Interface), an AI agent grounded in real data.
          </p>
          <a href={`mailto:${profile.email}`} className="inline-block text-sm font-medium text-brand-text hover:underline">
            {profile.email}
          </a>
        </div>
        <nav aria-label="Site">
          <p className="font-medium mb-3 text-xs text-subtle-foreground">Pages</p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="font-medium mb-3 text-xs text-subtle-foreground">Elsewhere</p>
          <ul className="flex flex-wrap gap-2">
            {profile.socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                >
                  <NamedIcon name={s.icon} className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 font-mono text-xs text-subtle-foreground sm:px-8">
          (c) {profile.brand}. Press Ctrl/Cmd + K to search, or hold Space to talk to ABI.
        </p>
      </div>
    </footer>
  );
}
