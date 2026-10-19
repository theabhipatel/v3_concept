"use client";

import { ArrowRight, Check, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { centerOf, surge } from "./surge";

const RULES = [
  { test: (p: string) => p.length >= 8, label: "8+ characters" },
  { test: (p: string) => /[A-Za-z]/.test(p) && /\d/.test(p), label: "Letters and numbers" },
];

/**
 * The page the reset email links to: choose a new password (typed twice), then sign in again.
 * Every other device is signed out. An expired or used link offers a fresh one.
 */
export function ResetCard() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const linkError = params.get("error");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const submit = useRef<HTMLButtonElement>(null);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (mismatch) return setError("The two passwords don't match.");
    setBusy(true);
    setError("");
    const res = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (res.error) {
      setError(
        res.error.code === "INVALID_TOKEN" ? "This link expired or was already used. Ask for a new one." : (res.error.message ?? "Couldn't change the password."),
      );
      return;
    }
    if (submit.current) surge(...centerOf(submit.current), "spark");
    setDone(true);
  }

  const card = "auth-card relative rounded-[1.75rem] border bg-card/90 p-6 shadow-2xl backdrop-blur sm:p-8";

  if (!token || linkError)
    return (
      <div className={card}>
        <span className="auth-card__edge" aria-hidden />
        <div className="inbox text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <X className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">This link doesn&apos;t work anymore.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Reset links work once, for 1 hour. Ask for a new one and use the newest email.</p>
          <Link href="/signin?mode=forgot" className="send group relative mt-6 inline-flex h-12 items-center gap-2 overflow-hidden rounded-full px-6 text-sm font-semibold">
            <span className="relative">Send a new link</span> <ArrowRight className="relative size-4" aria-hidden />
          </Link>
        </div>
      </div>
    );

  if (done)
    return (
      <div className={card}>
        <span className="auth-card__edge" aria-hidden />
        <div className="inbox text-center" role="status">
          <span className="sent__check mx-auto grid size-16 place-items-center rounded-full">
            <Check className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Password changed.</h1>
          <p className="mt-2 text-sm text-muted-foreground">For safety we signed you out everywhere. Sign in with your new password.</p>
          <Link href="/signin" className="send group relative mt-6 inline-flex h-12 items-center gap-2 overflow-hidden rounded-full px-6 text-sm font-semibold">
            <span className="relative">Sign in</span> <ArrowRight className="relative size-4" aria-hidden />
          </Link>
        </div>
      </div>
    );

  return (
    <div className={card}>
      <span className="auth-card__edge" aria-hidden />
      <span className="inbox__icon relative grid size-14 place-items-center rounded-2xl">
        <KeyRound className="relative size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Choose a new password.</h1>
      <p className="mt-1 text-sm text-muted-foreground">You&apos;ll use it to sign in from now on.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="field">
          <input
            id="new-password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder=" "
            className="field__input pr-12"
          />
          <label htmlFor="new-password" className="field__label">
            New password
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
        <div className="field">
          <input
            id="confirm-password"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder=" "
            aria-invalid={mismatch || undefined}
            className="field__input"
          />
          <label htmlFor="confirm-password" className="field__label">
            Type it again
          </label>
          <span className="field__glow" aria-hidden />
        </div>
        <ul className="flex flex-wrap gap-2 text-xs font-semibold">
          {RULES.map((r) => (
            <li key={r.label} className={cn("rounded-full border px-3 py-1 transition-colors", r.test(password) ? "border-success/40 bg-success/10 text-success" : "text-muted-foreground")}>
              {r.test(password) ? "✓" : "○"} {r.label}
            </li>
          ))}
          {confirm && (
            <li className={cn("rounded-full border px-3 py-1", mismatch ? "border-destructive/40 text-destructive" : "border-success/40 bg-success/10 text-success")}>
              {mismatch ? "Doesn't match yet" : "✓ Matches"}
            </li>
          )}
        </ul>
        {error && (
          <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}
        <button ref={submit} type="submit" disabled={busy} className="send group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-semibold disabled:opacity-80">
          {busy ? <Loader2 className="relative size-4 animate-spin" aria-hidden /> : <KeyRound className="relative size-4" aria-hidden />}
          <span className="relative">Save new password</span>
        </button>
      </form>
    </div>
  );
}
