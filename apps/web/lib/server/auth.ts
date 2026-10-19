import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { authEmailHtml, authEmailSubject, authEmailText } from "./auth-email";
import { pool } from "./db";
import { sendMail } from "./mailer";

async function mail(kind: "verify" | "reset", user: { name: string; email: string }, url: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[auth] ${kind} link for ${user.email}: ${url}`);
  await sendMail({
    to: user.email,
    subject: authEmailSubject(kind),
    html: authEmailHtml({ kind, name: user.name, url }),
    text: authEmailText({ kind, name: user.name, url }),
  });
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

/** Accounts for power users: email and password, or Google. Tables live in the shared Postgres. */
export const auth = betterAuth({
  database: pool,
  // Email sign-ups must confirm their address before they can sign in (Google ones already are).
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    // Forgot password: a one-hour link to /reset-password; a new password signs out every device.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await mail("reset", user, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true, // signing in unconfirmed sends a fresh link
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      await mail("verify", user, url);
    },
  },
  socialProviders: google,
  // No cookie cache: a password reset or sign-out must end other sessions right away.
  session: { expiresIn: 60 * 60 * 24 * 30 },
  rateLimit: { enabled: true, window: 60, max: 20 },
  plugins: [nextCookies()],
});

export const googleEnabled = Boolean(google);

/** The signed-in user for this request, or null. */
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
