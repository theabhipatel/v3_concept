"use client";

import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Loader2, MailCheck, RotateCw, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { powerStore, usePower } from "./power-store";
import { centerOf, surge } from "./surge";

type Mode = "signin" | "signup";

const LINK_ERRORS: Record<string, string> = {
  token_expired: "That confirmation link has expired. Sign in and we'll send you a fresh one.",
  invalid_token: "That confirmation link isn't valid anymore. Sign in and we'll send you a fresh one.",
};

/**
 * After sign-up (or signing in before confirming): the email is on its way. A charged envelope,
 * the address, a resend button with a short cooldown and a way back.
 */
type Sent = { error?: { message?: string } | null };
type Inbox = { email: string; note: string; kind: "verify" | "reset" };

const resendFor = (kind: Inbox["kind"], email: string): Promise<Sent> =>
  kind === "verify"
    ? authClient.sendVerificationEmail({ email, callbackURL: "/settings" })
    : authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });

function CheckInbox({ email, note, kind, onBack }: Inbox & { onBack: () => void }) {
  const [wait, setWait] = useState(30);
  const [sent, setSent] = useState("");

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  async function resend() {
    setWait(30);
    const res = await resendFor(kind, email);
    setSent(res.error ? (res.error.message ?? "Couldn't send it. Try again in a minute.") : "Sent. Check your inbox again.");
  }

  return (
    <div className="inbox text-center" role="status" aria-live="polite">
      <span className="inbox__icon relative mx-auto grid size-20 place-items-center rounded-full">
        <span className="inbox__ring" aria-hidden />
        <MailCheck className="relative size-8" aria-hidden />
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">Check your inbox.</h2>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
      <p className="mt-4 inline-block max-w-full truncate rounded-full border bg-background/60 px-4 py-2 font-mono text-sm font-semibold">{email}</p>
      <p className="mt-4 text-xs text-subtle-foreground">The link works for 1 hour. Not there? Check spam or promotions.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={resend}
          disabled={wait > 0}
          className="inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors hover:border-brand/50 disabled:opacity-60"
        >
          <RotateCw className="size-4" aria-hidden /> {wait > 0 ? `Resend in ${wait}s` : "Resend link"}
        </button>
        <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back
        </button>
      </div>
      {sent && <p className="mt-3 text-sm font-semibold text-success">{sent}</p>}
    </div>
  );
}

/** Forgot password: ask for the email and send a one-hour reset link. */
function ForgotPassword({ onSent, onBack }: { onSent: (email: string) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setBusy(true);
    setError("");
    const res = await resendFor("reset", email);
    setBusy(false);
    if (res.error) setError(res.error.message ?? "Couldn't send the link. Try again in a minute.");
    else onSent(email);
  }

  return (
    <div className="inbox">
      <span className="inbox__icon relative grid size-14 place-items-center rounded-2xl">
        <KeyRound className="relative size-6" aria-hidden />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">Forgot your password?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter your account email and we&apos;ll send you a link to choose a new one.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="field">
          <input id="forgot-email" name="email" type="email" required autoComplete="email" placeholder=" " className="field__input" />
          <label htmlFor="forgot-email" className="field__label">
            Email
          </label>
          <span className="field__glow" aria-hidden />
        </div>
        {error && (
          <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="send group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-semibold disabled:opacity-80">
          {busy ? <Loader2 className="relative size-4 animate-spin" aria-hidden /> : <MailCheck className="relative size-4" aria-hidden />}
          <span className="relative">Send reset link</span>
        </button>
      </form>
      <button type="button" onClick={onBack} className="mt-4 inline-flex h-10 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </button>
    </div>
  );
}

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
  const [error, setError] = useState(() => LINK_ERRORS[params.get("error")?.toLowerCase() ?? ""] ?? "");
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [forgot, setForgot] = useState(params.get("mode") === "forgot");
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
        ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0], callbackURL: "/settings" })
        : await authClient.signIn.email({ email, password, callbackURL: "/settings" });
    if (res.error?.code === "EMAIL_NOT_VERIFIED") {
      setBusy("");
      setInbox({ email, kind: "verify", note: "Confirm your email before signing in. We just sent you a fresh link." });
      return;
    }
    if (res.error) {
      setBusy("");
      setError(
        res.error.status === 401 || res.error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "That email and password don't match. Try again."
          : (res.error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    // New email accounts confirm first; the link signs them in and opens settings.
    if (mode === "signup" && !res.data?.token) {
      setBusy("");
      setInbox({ email, kind: "verify", note: "We sent a confirmation link to your email. Click it to finish creating your account." });
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

  if (inbox || forgot)
    return (
      <div className="auth-card relative rounded-[1.75rem] border bg-card/90 p-6 shadow-2xl backdrop-blur sm:p-8">
        <span className="auth-card__edge" aria-hidden />
        {inbox ? (
          <CheckInbox
            {...inbox}
            onBack={() => {
              setInbox(null);
              setForgot(false);
              setMode("signin");
            }}
          />
        ) : (
          <ForgotPassword
            onSent={(email) => setInbox({ email, kind: "reset", note: "If an account exists for this email, a link to choose a new password is on its way." })}
            onBack={() => setForgot(false)}
          />
        )}
      </div>
    );

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
        {mode === "signin" ? "Pick up where you left off with ABI." : "Free account. We'll email you a link to confirm it's you."}
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

        {mode === "signin" && (
          <p className="-mt-1 text-right">
            <button
              type="button"
              onClick={() => {
                setForgot(true);
                setError("");
              }}
              className="text-sm font-semibold text-brand-text hover:underline"
            >
              Forgot password?
            </button>
          </p>
        )}

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
