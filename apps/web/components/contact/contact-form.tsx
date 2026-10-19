"use client";

import { Briefcase, Coffee, Handshake, Loader2, Rocket, Send } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { sendContactMessage } from "@/app/contact/actions";
import { cn } from "@/lib/utils";

const INTENTS = [
  { id: "job", label: "Hire me full-time", icon: Briefcase, subject: "Job opportunity" },
  { id: "freelance", label: "A freelance project", icon: Rocket, subject: "Freelance project" },
  { id: "consulting", label: "AI or full stack consulting", icon: Handshake, subject: "Consulting" },
  { id: "hello", label: "Just saying hi", icon: Coffee, subject: "Hello" },
] as const;

const MAX = 5000;

/** An input whose label floats up when focused or filled, with a glowing underline. */
function Field({
  label,
  name,
  error,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("field", className)}>
      {children}
      <label htmlFor={name} className="field__label">
        {label}
      </label>
      <span className="field__glow" aria-hidden />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Works without AI: a plain server action. The ids stay name/email/subject/message for ABI. */
export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, null);
  const [intent, setIntent] = useState<string | null>(null);
  const [chars, setChars] = useState(0);
  const subject = useRef<HTMLInputElement>(null);
  const e = state?.errors ?? {};
  // After a failed send the form resets to these, so nothing the visitor typed is lost.
  const v = state?.values ?? {};

  if (state?.ok) {
    return (
      <div className="sent relative overflow-hidden rounded-3xl border bg-card p-10 text-center" role="status">
        <span className="sent__burst pointer-events-none absolute inset-0" aria-hidden />
        <span className="sent__check mx-auto grid size-20 place-items-center rounded-full">
          <svg viewBox="0 0 52 52" className="size-10" aria-hidden>
            <path d="M14 27 L23 36 L39 17" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
          </svg>
        </span>
        <p className="mt-6 text-2xl font-bold tracking-tight">Message on its way.</p>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="compose relative space-y-6 rounded-3xl border bg-card p-6 shadow-lg sm:p-8" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold">What brings you here?</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INTENTS.map((it) => {
            const on = intent === it.id;
            return (
              <button
                key={it.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const prev = INTENTS.find((x) => x.id === intent)?.subject ?? "";
                  setIntent(on ? null : it.id);
                  // Fill the subject unless the visitor already wrote their own.
                  if (subject.current && (!subject.current.value || subject.current.value === prev)) subject.current.value = on ? "" : it.subject;
                }}
                className={cn("intent flex flex-col items-start gap-3 rounded-2xl border p-3.5 text-left text-sm font-medium", on && "intent--on")}
              >
                <span className="intent__icon grid size-9 place-items-center rounded-xl">
                  <it.icon className="size-4" aria-hidden />
                </span>
                {it.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" name="name" error={e.name}>
          <input
            id="name"
            name="name"
            defaultValue={v.name}
            autoComplete="name"
            required
            placeholder=" "
            className="field__input"
            aria-invalid={!!e.name}
            aria-describedby={e.name ? "name-error" : undefined}
          />
        </Field>
        <Field label="Email" name="email" error={e.email}>
          <input
            id="email"
            name="email"
            defaultValue={v.email}
            type="email"
            autoComplete="email"
            required
            placeholder=" "
            className="field__input"
            aria-invalid={!!e.email}
            aria-describedby={e.email ? "email-error" : undefined}
          />
        </Field>
      </div>
      <Field label="Subject (optional)" name="subject" error={e.subject}>
        <input ref={subject} id="subject" name="subject" defaultValue={v.subject} placeholder=" " className="field__input" />
      </Field>
      <Field label="Message" name="message" error={e.message}>
        <textarea
          id="message"
          name="message"
          defaultValue={v.message}
          rows={6}
          required
          maxLength={MAX}
          placeholder=" "
          onInput={(ev) => setChars(ev.currentTarget.value.length)}
          className="field__input resize-y"
          aria-invalid={!!e.message}
          aria-describedby={e.message ? "message-error" : undefined}
        />
      </Field>
      {/* Honeypot for bots. Hidden from people and screen readers. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state && !state.ok && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-subtle-foreground">
          <span className="tabular-nums">{chars || v.message?.length || 0}</span> / {MAX} characters. Works even when the AI is offline.
        </p>
        <button type="submit" disabled={pending} data-pending={pending || undefined} className="send group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full px-6 text-sm font-semibold">
          <span className="relative">{pending ? "Sending..." : "Send message"}</span>
          {pending ? <Loader2 className="relative size-4 animate-spin" aria-hidden /> : <Send className="send__plane relative size-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}

