"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useActionState } from "react";
import { sendContactMessage } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-shadow placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive";

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${name}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Works without AI and without JavaScript-heavy features: a plain server action. */
export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, null);
  const e = state?.errors ?? {};

  if (state?.ok) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border border-success/40 bg-card p-6" role="status">
        <Check className="mt-0.5 size-5 text-success" aria-hidden />
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" error={e.name}>
          <input id="name" name="name" autoComplete="name" required className={field} aria-invalid={!!e.name} aria-describedby={e.name ? "name-error" : undefined} />
        </Field>
        <Field label="Email" name="email" error={e.email}>
          <input id="email" name="email" type="email" autoComplete="email" required className={field} aria-invalid={!!e.email} aria-describedby={e.email ? "email-error" : undefined} />
        </Field>
      </div>
      <Field label="Subject (optional)" name="subject" error={e.subject}>
        <input id="subject" name="subject" className={field} placeholder="Job opportunity, freelance project, hello..." />
      </Field>
      <Field label="Message" name="message" error={e.message}>
        <textarea id="message" name="message" rows={6} required className={cn(field, "resize-y")} aria-invalid={!!e.message} aria-describedby={e.message ? "message-error" : undefined} />
      </Field>
      {/* Honeypot for bots. Hidden from people and screen readers. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state && !state.ok && <p className="text-sm text-destructive" role="alert">{state.message}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        Send message
      </Button>
    </form>
  );
}
