"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { z } from "zod";
import { profile } from "@/lib/content";

export interface ContactState {
  ok: boolean;
  message: string;
  errors?: Partial<Record<"name" | "email" | "subject" | "message", string>>;
  /** What the visitor typed, sent back on failure so the form can restore it. */
  values?: Partial<Record<"name" | "email" | "subject" | "message", string>>;
}

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email").max(200),
  subject: z.string().trim().max(150).optional().default(""),
  message: z.string().trim().min(10, "Please write at least a few words").max(5000),
  website: z.string().max(0).optional(), // honeypot: real visitors leave it empty
});

// Basic per-IP limit (per server instance). Section 11 keeps abuse prevention light for now.
const recent = new Map<string, number[]>();
const LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

function limited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.set(ip, [...hits, now]);
  return hits.length >= LIMIT;
}

export async function sendContactMessage(_prev: ContactState | null, form: FormData): Promise<ContactState> {
  const result = await send(form);
  if (result.ok) return result;
  const field = (k: string) => String(form.get(k) ?? "").slice(0, 5000);
  return { ...result, values: { name: field("name"), email: field("email"), subject: field("subject"), message: field("message") } };
}

async function send(form: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["errors"]>;
      if (key && key !== ("website" as never)) errors[key] ??= issue.message;
    }
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "Thanks! Message sent." };
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return { ok: false, message: "You've sent a few messages already. Please try again later." };

  const { name, email, subject, message } = parsed.data;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return { ok: false, message: `Email isn't configured yet. Please write to ${profile.email} directly.` };
  }

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 465),
      secure: Number(SMTP_PORT || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: `"${profile.brand} Portfolio" <${SMTP_USER}>`,
      to: profile.email,
      replyTo: `"${name}" <${email}>`,
      subject: `[Portfolio v3] ${subject || "New message"} - from ${name}`,
      text: `${message}\n\n- ${name} <${email}>`,
    });
    return { ok: true, message: "Thanks! Your message is on its way. Abhishek usually replies within 24 hours." };
  } catch {
    return { ok: false, message: `Sending failed. Please write to ${profile.email} directly.` };
  }
}
