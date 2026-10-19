import { AudioLines, Cpu, History, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/power/auth-card";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to power ABI with your own OpenAI key.",
  robots: { index: false, follow: false },
};

const PERKS = [
  { icon: AudioLines, title: "Realtime voice", text: "Talk to ABI speech to speech, and it acts while you talk." },
  { icon: Cpu, title: "The newest models", text: "GPT-6 Luna by default, or any model your key can use." },
  { icon: History, title: "Your conversations", text: "Saved to your account, ready to continue." },
  { icon: ShieldCheck, title: "Your key, sealed", text: "Encrypted, used only for you, deleted on request." },
];

/** The ignition: a reactor charges on the left while you sign in on the right. */
export default function SignInPage() {
  return (
    <section aria-labelledby="signin-title" className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-8 sm:pt-32">
      <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p data-intro className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <Zap className="size-3.5 text-brand-text" aria-hidden /> Power users
          </p>
          <h1 id="signin-title" data-intro style={{ "--d": 1 } as React.CSSProperties} className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Power up <span className="text-brand-text">ABI.</span>
          </h1>
          <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Everyone gets ABI on free models. Sign in, add your own OpenAI key and flip the switch: the whole agent runs on
            OpenAI, just for you.
          </p>

          <div data-intro="scale" data-motion style={{ "--d": 3 } as React.CSSProperties} className="reactor relative mx-auto my-10 aspect-square w-full max-w-[17rem] lg:mx-0" aria-hidden>
            <span className="reactor__ring reactor__ring--1" />
            <span className="reactor__ring reactor__ring--2" />
            <span className="reactor__ring reactor__ring--3" />
            <span className="reactor__arc" />
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className="reactor__mote" style={{ "--a": `${i * 36}deg`, "--d": `${(i * 0.37) % 2.4}s` } as React.CSSProperties} />
            ))}
            <span className="reactor__core grid place-items-center rounded-full">
              <Zap className="size-9" fill="currentColor" />
            </span>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {PERKS.map((p, i) => (
              <li key={p.title} data-intro style={{ "--d": 4 + i * 0.5 } as React.CSSProperties} className="flex gap-3 rounded-2xl border bg-card/70 p-4 backdrop-blur">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand-text">
                  <p.icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{p.title}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div data-intro="scale" style={{ "--d": 2 } as React.CSSProperties} className="mx-auto w-full max-w-md">
          <Suspense>
            <AuthCard />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
