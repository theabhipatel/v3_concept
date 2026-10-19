"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { powerStore, usePower } from "./power-store";
import { centerOf, surge } from "./surge";

type Mode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

/** Sign in or create an account: Google, or email and password. Opens ABI settings after. */
export function AuthCard() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"" | "email" | "google">("");
  const [error, setError] = useState("");
  const submit = useRef<HTMLButtonElement>(null);
  const googleEnabled = usePower((s) => s.googleEnabled);
  const user = usePower((s) => s.user);
  const ready = usePower((s) => s.ready);

  // Ask the server once even on a fresh browser: it says whether Google sign-in is set up.
  useEffect(() => void powerStore.load(true), []);
  useEffect(() => {
    if (ready && user) router.replace("/settings");
  }, [ready, user, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    setError("");
    setBusy("email");
    const res =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0] })
        : await authClient.signIn.email({ email, password });
    if (res.error) {
      setBusy("");
      setError(
        res.error.status === 401 || res.error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "That email and password don't match. Try again."
          : (res.error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    if (submit.current) surge(...centerOf(submit.current), "spark");
    await powerStore.load(true);
    router.push("/settings");
  }

  async function google() {
    setError("");
    setBusy("google");
    const res = await authClient.signIn.social({ provider: "google", callbackURL: "/settings" });
    if (res.error) {
      setBusy("");
      setError(res.error.message ?? "Google sign-in is not available right now.");
    }
  }

  return (
    <div className="auth-card relative rounded-[1.75rem] border bg-card/90 p-6 shadow-2xl backdrop-blur sm:p-8">
      <span className="auth-card__edge" aria-hidden />
      <div className="auth-tabs relative grid grid-cols-2 rounded-full border bg-background/60 p-1" data-mode={mode} role="tablist" aria-label="Account">
        <span className="auth-tabs__pill" aria-hidden />
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={cn("relative z-10 h-10 rounded-full text-sm font-semibold transition-colors", mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h2 className="mt-7 text-2xl font-bold tracking-tight">{mode === "signin" ? "Welcome back." : "Become a power user."}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signin" ? "Pick up where you left off with ABI." : "Free account. Bring your own OpenAI key when you're ready."}
      </p>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={Boolean(busy)}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border bg-background text-sm font-semibold transition-colors hover:border-brand/50 disabled:opacity-60"
          >
            {busy === "google" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <GoogleIcon />}
            Continue with Google
          </button>
          <p className="my-5 flex items-center gap-3 text-xs text-subtle-foreground">
            <span className="h-px flex-1 bg-border" aria-hidden /> or with email <span className="h-px flex-1 bg-border" aria-hidden />
          </p>
        </>
      )}

      <form onSubmit={onSubmit} className={cn("space-y-4", !googleEnabled && "mt-6")} noValidate={false}>
        {mode === "signup" && (
          <div className="field auth-field-in">
            <input id="auth-name" name="name" autoComplete="name" placeholder=" " maxLength={80} className="field__input" />
            <label htmlFor="auth-name" className="field__label">
              Your name
            </label>
            <span className="field__glow" aria-hidden />
          </div>
        )}
        <div className="field">
          <input id="auth-email" name="email" type="email" required autoComplete="email" placeholder=" " className="field__input" />
          <label htmlFor="auth-email" className="field__label">
            Email
          </label>
          <span className="field__glow" aria-hidden />
        </div>
        <div className="field">
          <input
            id="auth-password"
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder=" "
            className="field__input pr-12"
          />
          <label htmlFor="auth-password" className="field__label">
            Password{mode === "signup" ? " (8+ characters)" : ""}
          </label>
          <span className="field__glow" aria-hidden />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          ref={submit}
          type="submit"
          disabled={Boolean(busy)}
          className="send group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-semibold disabled:opacity-80"
        >
          {busy === "email" ? <Loader2 className="relative size-4 animate-spin" aria-hidden /> : <Zap className="relative size-4" aria-hidden />}
          <span className="relative">{mode === "signin" ? "Sign in" : "Create account"}</span>
          <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-subtle-foreground">
        Your OpenAI key is encrypted, used only for you, and deleted the moment you remove it.
      </p>
    </div>
  );
}
