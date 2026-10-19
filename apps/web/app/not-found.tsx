import { ArrowRight, FolderGit2, Home, Layers, UserRound } from "lucide-react";
import Link from "next/link";
import { AbiBot } from "@/components/abi/abi-bot";
import { AskWhereItWent } from "@/components/site/ask-where";

const WAYS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/skills", label: "Skills", icon: Layers },
  { href: "/about", label: "About me", icon: UserRound },
];

/**
 * 404: ABI is out searching with a flashlight. Its beam sweeps across a giant "404" and lights
 * it up as it passes; the ways back are right below.
 */
export default function NotFound() {
  return (
    <section aria-labelledby="nf-title" className="relative overflow-hidden px-4 pb-24 pt-28 sm:pt-36">
      <div data-motion className="lost relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="lost__stage relative w-full" aria-hidden>
          <p className="lost__digits lost__digits--dim select-none font-display font-extrabold leading-none tracking-[-0.06em]">404</p>
          <p className="lost__digits lost__digits--lit absolute inset-0 select-none font-display font-extrabold leading-none tracking-[-0.06em]">404</p>
          <span className="lost__bot absolute">
            <span className="lost__beam absolute" />
            <AbiBot state="listening" size={64} />
          </span>
        </div>

        <p data-intro className="mt-8 text-sm font-semibold text-brand-text">
          Page not found
        </p>
        <h1 id="nf-title" data-intro style={{ "--d": 1 } as React.CSSProperties} className="mt-3 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          You&apos;ve ventured into an unknown digital realm.
        </h1>
        <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mt-4 max-w-xl text-lg text-muted-foreground">
          Even ABI&apos;s flashlight can&apos;t find this one. You&apos;ve gone off the map, but every road below leads somewhere real.
        </p>

        <ul data-intro style={{ "--d": 3 } as React.CSSProperties} className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {WAYS.map((w) => (
            <li key={w.href}>
              <Link href={w.href} className="way group flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-sm font-semibold">
                <span className="way__icon grid size-10 place-items-center rounded-xl">
                  <w.icon className="size-4" aria-hidden />
                </span>
                {w.label}
              </Link>
            </li>
          ))}
        </ul>
        <div data-intro style={{ "--d": 4 } as React.CSSProperties} className="mt-6 flex flex-wrap justify-center gap-3">
          <AskWhereItWent />
          <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors hover:bg-muted">
            Back to home <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
