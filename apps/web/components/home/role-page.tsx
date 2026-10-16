"use client";

import { Briefcase, Check, Code2, Compass, Rocket } from "lucide-react";
import { useState } from "react";
import { scrollToElement } from "@/components/site/smooth-scroll";
import { useQueryParam } from "@/lib/use-query-param";
import { cn } from "@/lib/utils";
import { ROLE_IDS, ROLE_PARAM, ROLES, type Role } from "./roles";
import { StreamedText } from "./streamed-text";

const ICONS = { everyone: Compass, recruiter: Briefcase, founder: Rocket, developer: Code2 } as const;

/** "Who are you?" The choice lives in the URL (?for=recruiter), so a tailored page can be shared. */
export function RolePicker() {
  const [role, setRole] = useQueryParam<Role>(ROLE_PARAM, "everyone", ROLE_IDS);

  return (
    <div role="radiogroup" aria-label="Who are you?" className="flex flex-wrap justify-center gap-2">
      {ROLES.map((r) => {
        const Icon = ICONS[r.id];
        const active = r.id === role;
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              setRole(r.id);
              requestAnimationFrame(() => {
                const el = document.getElementById("for-you");
                if (el) scrollToElement(el, -16);
              });
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:border-border-strong hover:bg-accent",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

export interface RoleSection {
  id: string;
  title: string;
  node: React.ReactNode;
}

/** The page below the hero, arranged for the chosen role. Pre-built, so switching is instant and free. */
export function RoleSections({
  sections,
  orders,
  intros,
}: {
  sections: Record<string, RoleSection>;
  orders: Record<Role, string[]>;
  intros: Record<Role, string>;
}) {
  const [role] = useQueryParam<Role>(ROLE_PARAM, "everyone", ROLE_IDS);
  // Play the "building" animation only when the role changes, not on first load.
  const [prev, setPrev] = useState(role);
  const [built, setBuilt] = useState(false);
  if (prev !== role) {
    setPrev(role);
    setBuilt(true);
  }

  const list = orders[role].map((id) => sections[id]);
  const plural = ROLES.find((r) => r.id === role)!.plural;

  return (
    <div key={role} className={cn(built && "is-building")}>
      <section id="for-you" aria-labelledby="for-you-title" className="scroll-mt-4 border-t bg-background-deep py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="flex items-center gap-2 text-sm font-medium text-abi-text">
            <span className="size-2 rounded-full bg-abi" aria-hidden /> ABI arranged this page
          </p>
          <h2 id="for-you-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for {plural}
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            <StreamedText text={intros[role]} />
          </p>
          <ol className="mt-6 flex flex-wrap gap-2" aria-label="Sections on this page">
            {list.map((s, i) => (
              <li key={s.id} className="build-step" style={{ "--i": i } as React.CSSProperties}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    const el = document.getElementById(s.id);
                    if (!el) return;
                    e.preventDefault();
                    scrollToElement(el, -16);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-border-strong"
                >
                  <Check className="size-3.5 text-success" aria-hidden />
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>
      {list.map((s, i) => (
        <div key={s.id} className="build-block" style={{ "--i": i } as React.CSSProperties}>
          {s.node}
        </div>
      ))}
    </div>
  );
}
