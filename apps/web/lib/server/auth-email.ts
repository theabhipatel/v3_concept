import "server-only";
import { profile } from "@/lib/content";

// Account emails ("Confirm your email", "Reset your password"), in the same look as the contact email:
// a dark hero with an orange glow and a charged bolt, one big button, the plain link as a
// fallback. Tables and inline styles only (email clients ignore most CSS); the <style> block is
// only the phone tweak that clients which support it pick up.

const C = {
  night: "#0b0706",
  night2: "#17100c",
  nightLine: "#2b201a",
  nightText: "#f5ede4",
  nightMuted: "#b3a497",
  page: "#f3ede6",
  card: "#ffffff",
  ink: "#24180f",
  muted: "#75655a",
  subtle: "#9d8d80",
  line: "#ece3d8",
  soft: "#faf6f1",
  brand: "#f06a1d",
  brandDeep: "#d4520c",
  amber: "#f7b733",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

type Kind = "verify" | "reset";

const COPY = {
  verify: {
    subject: "Confirm your email to power up ABI",
    title: "Confirm your email,",
    lead: "One click and your account is ready. Then add your OpenAI key and flip the power switch.",
    button: "Confirm email and power up",
    steps: ["Account created", "Confirm email", "Add your OpenAI key", "Power on"],
    ignore: "If you didn't create an account on {brand}, you can ignore this email and nothing will happen.",
  },
  reset: {
    subject: "Reset your ABI password",
    title: "New password,",
    lead: "Someone, hopefully you, asked to reset the password for this account. Choose a new one below.",
    button: "Choose a new password",
    steps: ["Request received", "Choose a new password", "Sign in again"],
    ignore: "If you didn't ask for this, ignore this email. Your password stays the same.",
  },
} satisfies Record<Kind, object>;

export const authEmailSubject = (kind: Kind) => COPY[kind].subject;

export function authEmailHtml({ kind, name, url }: { kind: Kind; name: string; url: string }) {
  const copy = COPY[kind];
  const first = esc(name.split(" ")[0] || "there");
  const link = esc(url);
  const steps = copy.steps;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${copy.subject}</title>
<style>
  @media (max-width: 520px) {
    .wrap { padding: 12px !important; }
    .pad { padding-left: 22px !important; padding-right: 22px !important; }
    .hero h1 { font-size: 26px !important; }
    .full, .full tbody, .full tr, .full td, .full a { display: block !important; width: 100% !important; box-sizing: border-box; text-align: center !important; }
    .step { display: block !important; width: 100% !important; padding: 4px 0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;">${copy.subject}. The link works for 1 hour.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
<tr><td class="wrap" align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:${FONT};">

  <tr><td class="hero pad" bgcolor="${C.night}" style="background:${C.night};background-image:radial-gradient(circle at 18% 0%, rgba(240,106,29,0.45), rgba(11,7,6,0) 60%);border-radius:24px 24px 0 0;padding:34px 36px 30px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="44" height="44" align="center" valign="middle" bgcolor="${C.brand}" style="width:44px;height:44px;border-radius:22px;background:${C.brand};box-shadow:0 0 0 6px rgba(240,106,29,0.18),0 0 30px rgba(240,106,29,0.6);font-size:22px;line-height:44px;color:#ffffff;">&#9889;</td>
      <td style="padding-left:12px;font-size:15px;font-weight:700;color:${C.nightText};">${esc(profile.brand)}<br><span style="font-size:12px;font-weight:500;color:${C.nightMuted};">ABI power users</span></td>
    </tr></table>
    <h1 style="margin:26px 0 8px;font-size:32px;line-height:1.1;letter-spacing:-0.5px;color:${C.nightText};">${copy.title} <span style="color:${C.amber};">${first}.</span></h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${C.nightMuted};">${copy.lead}</p>
  </td></tr>

  <tr><td class="pad" bgcolor="${C.night2}" style="background:${C.night2};border-top:1px solid ${C.nightLine};padding:14px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      ${steps
        .map(
          (s, i) => `<td class="step" style="font-family:${MONO};font-size:11px;letter-spacing:0.4px;color:${i < 1 ? "#3fbf7f" : i === 1 ? C.amber : C.nightMuted};padding-right:8px;white-space:nowrap;">${i < 1 ? "&#10003;" : i === 1 ? "&#9679;" : "&#9675;"} ${s}</td>`,
        )
        .join("")}
    </tr></table>
  </td></tr>

  <tr><td class="pad" bgcolor="${C.card}" style="background:${C.card};padding:32px 36px 10px;">
    <table role="presentation" class="full" cellpadding="0" cellspacing="0" border="0"><tr>
      <td bgcolor="${C.brand}" style="border-radius:999px;background:${C.brand};background-image:linear-gradient(135deg, ${C.amber}, ${C.brand} 55%, ${C.brandDeep});box-shadow:0 12px 26px -12px ${C.brand};">
        <a href="${link}" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">&#9889; ${copy.button}</a>
      </td>
    </tr></table>
    <p style="margin:22px 0 6px;font-size:13px;color:${C.muted};">Button not working? Paste this link into your browser:</p>
    <p style="margin:0;padding:12px 14px;background:${C.soft};border:1px solid ${C.line};border-radius:12px;font-family:${MONO};font-size:12px;line-height:1.5;color:${C.ink};word-break:break-all;"><a href="${link}" style="color:${C.brandDeep};text-decoration:none;">${link}</a></p>
  </td></tr>

  <tr><td class="pad" bgcolor="${C.card}" style="background:${C.card};padding:18px 36px 30px;border-radius:0 0 24px 24px;">
    <p style="margin:0;font-size:13px;line-height:1.6;color:${C.subtle};">The link works for 1 hour. ${copy.ignore.replace("{brand}", esc(profile.brand))}</p>
  </td></tr>

  <tr><td align="center" style="padding:20px 10px 0;font-size:12px;color:${C.subtle};">${esc(profile.brand)} - ${esc(profile.site.replace("https://", ""))}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function authEmailText({ kind, name, url }: { kind: Kind; name: string; url: string }) {
  const copy = COPY[kind];
  return `Hi ${name.split(" ")[0] || "there"},

${copy.lead}
${copy.button}: ${url}

The link works for 1 hour. ${copy.ignore.replace("{brand}", profile.brand)}

${profile.brand} - ${profile.site.replace("https://", "")}`;
}
