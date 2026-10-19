import "server-only";
import nodemailer from "nodemailer";
import { profile } from "@/lib/content";

// One SMTP setup for every email the site sends (contact form, account emails).
// Gmail app password locally; same SMTP_* variables in production.

export const smtpReady = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendMail(mail: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error("SMTP is not configured");
  const port = Number(SMTP_PORT || 465);
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transport.sendMail({ from: `"${profile.brand} Website" <${SMTP_USER}>`, ...mail });
}
