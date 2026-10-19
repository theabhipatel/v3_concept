import { profile } from "@/lib/content";

// The email Abhishek receives for each contact form message, styled like the website: a dark
// hero with an orange glow, the brief as a chat bubble, a "build receipt" with the details, a
// small terminal and the green activity grid from the footer.
//
// Email clients (Gmail included) ignore CSS variables and most <style> rules, so this uses
// tables and inline styles only. Colors are fixed hex copies of the theme tokens
// (styles/tokens.css); every gradient has a solid bgcolor fallback.

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
  brandSoft: "#fff0e4",
  brandInk: "#b4440a",
  amber: "#f7b733",
  green: "#3fbf7f",
  greenSoft: "#e3f6ec",
};

export interface ContactEmail {
  name: string;
  email: string;
  subject: string;
  message: string;
  intent?: string;
  /** Where it was sent from (kept from the v2 email): visitor IP and browser. */
  ip?: string;
  device?: string;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const sans = "font-family:'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
const mono = "font-family:'Geist Mono',SFMono-Regular,Menlo,Consolas,monospace;";

function stamp() {
  const now = new Date();
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(now);
  return {
    date: fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: fmt({ hour: "numeric", minute: "2-digit" }),
    year: fmt({ year: "numeric" }),
    // A short receipt number, like the footer's "No. TAP-2026".
    no: `${now.getTime().toString(36).slice(-5).toUpperCase()}`,
  };
}

/** The footer's activity grid: a strip of small green squares of varying strength. */
function activity() {
  const shades = ["#dcefe4", "#b9e3cb", "#8fd3ad", "#5ec28a", C.green];
  const cells = Array.from({ length: 18 }, (_, i) => shades[(i * 7 + (i % 3) * 5) % shades.length]);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${cells
    .map((c) => `<td style="padding:0 2px 0 0;"><div style="width:8px;height:8px;border-radius:2px;background:${c};font-size:0;line-height:0;">&nbsp;</div></td>`)
    .join("")}</tr></table>`;
}

/** "Chrome on Windows" from a user agent string, or "" when it is not recognisable. */
export function describeDevice(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return [browser, os].filter(Boolean).join(" on ");
}

/** One row of the receipt. */
const row = (label: string, value: string) =>
  `<tr>
    <td class="label" style="padding:10px 0;width:104px;border-bottom:1px dashed ${C.line};${mono}font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.subtle};vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px dashed ${C.line};font-size:14px;color:${C.ink};vertical-align:top;word-break:break-word;">${value}</td>
  </tr>`;

export function contactEmailHtml(m: ContactEmail) {
  const s = stamp();
  const subject = m.subject || "New message";
  const first = m.name.trim().split(/\s+/)[0] || m.name;
  const initial = escape(m.name.trim()[0]?.toUpperCase() ?? "?");
  const reply = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`;
  const site = profile.site.replace(/^https?:\/\//, "");
  const words = m.message.trim().split(/\s+/).length;
  const paragraphs = escape(m.message.trim())
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(subject)}</title>
<style>
  @media only screen and (max-width: 520px) {
    .pad { padding: 22px 18px !important; }
    .hero-title { font-size: 24px !important; }
    .full { display: block !important; width: 100% !important; margin-left: 0 !important; box-sizing: border-box !important; text-align: center !important; }
    table.full tbody, table.full tr { display: block !important; width: 100% !important; }
    .stack { display: block !important; width: 100% !important; text-align: left !important; }
    .stack-gap { padding-top: 10px !important; }
    .label { width: 84px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};${sans}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(first)} wrote: ${escape(m.message.slice(0, 140))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:28px 12px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;">

<!-- ============ Hero: dark, with the orange glow from the website ============ -->
<tr><td bgcolor="${C.night}" style="background-color:${C.night};background-image:radial-gradient(ellipse at 15% 0%,rgba(240,106,29,.45),rgba(240,106,29,0) 55%),radial-gradient(ellipse at 100% 20%,rgba(247,183,51,.22),rgba(247,183,51,0) 50%);border-radius:24px 24px 0 0;padding:26px 28px 30px;" class="pad">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td bgcolor="${C.brand}" style="width:30px;height:30px;border-radius:999px;background:${C.brand};text-align:center;vertical-align:middle;">
            <div style="width:11px;height:11px;margin:0 auto;border-radius:999px;background:${C.night};font-size:0;line-height:0;">&nbsp;</div>
          </td>
          <td style="padding-left:10px;font-size:15px;font-weight:700;color:${C.nightText};">${escape(profile.brand)}</td>
        </tr></table>
      </td>
      <td align="right" style="vertical-align:middle;">
        <span style="display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid ${C.nightLine};background:${C.night2};font-size:12px;color:${C.nightText};">
          <span style="display:inline-block;width:7px;height:7px;border-radius:999px;background:${C.green};vertical-align:middle;margin-right:6px;"></span>New message
        </span>
      </td>
    </tr>
  </table>

  <p style="margin:34px 0 8px;${mono}font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.amber};">Incoming brief${m.intent ? ` &middot; ${escape(m.intent)}` : ""}</p>
  <h1 class="hero-title" style="margin:0;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-.02em;color:${C.nightText};">${escape(subject)}</h1>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${C.nightMuted};">
    <span style="color:${C.nightText};font-weight:600;">${escape(m.name)}</span> reached out through your website. Here is everything they wrote.
  </p>

  <!-- The step rail from the home page: brief received, next step is yours -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
    <tr>
      <td style="width:25%;padding-right:6px;"><div style="height:3px;border-radius:9px;background:${C.brand};font-size:0;line-height:0;">&nbsp;</div></td>
      <td style="width:25%;padding-right:6px;"><div style="height:3px;border-radius:9px;background:${C.brand};font-size:0;line-height:0;">&nbsp;</div></td>
      <td style="width:25%;padding-right:6px;"><div style="height:3px;border-radius:9px;background:${C.nightLine};font-size:0;line-height:0;">&nbsp;</div></td>
      <td style="width:25%;"><div style="height:3px;border-radius:9px;background:${C.nightLine};font-size:0;line-height:0;">&nbsp;</div></td>
    </tr>
    <tr>
      <td style="padding-top:8px;font-size:11px;font-weight:600;color:${C.nightText};">Sent</td>
      <td style="padding-top:8px;font-size:11px;font-weight:600;color:${C.nightText};">Received</td>
      <td style="padding-top:8px;font-size:11px;color:${C.nightMuted};">Reply</td>
      <td style="padding-top:8px;font-size:11px;color:${C.nightMuted};">Build</td>
    </tr>
  </table>
</td></tr>

<!-- ============ Body card ============ -->
<tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-top:0;border-radius:0 0 24px 24px;padding:28px;" class="pad">

  <!-- The brief, as a chat bubble -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="width:44px;vertical-align:top;padding-top:2px;">
        <div style="width:40px;height:40px;border-radius:999px;background:${C.brand};background-image:linear-gradient(135deg,${C.brand},${C.amber});color:#fff;font-size:17px;font-weight:800;line-height:40px;text-align:center;">${initial}</div>
      </td>
      <td style="padding-left:12px;vertical-align:top;">
        <p style="margin:0 0 6px;font-size:14px;"><span style="font-weight:700;color:${C.ink};">${escape(m.name)}</span>
          <span style="color:${C.subtle};">&nbsp;&middot;&nbsp;${escape(s.time)} IST</span></p>
        <div style="background:${C.soft};border:1px solid ${C.line};border-radius:4px 18px 18px 18px;padding:16px 18px 6px;font-size:15px;line-height:1.7;color:${C.ink};">${paragraphs}</div>
        <p style="margin:8px 0 0;${mono}font-size:11px;color:${C.subtle};">${words} words</p>
      </td>
    </tr>
  </table>

  <!-- Reply -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="full" style="margin:24px 0 0 56px;">
    <tr>
      <td align="center" class="full" bgcolor="${C.brand}" style="border-radius:999px;background:${C.brand};background-image:linear-gradient(135deg,${C.brand},${C.brandDeep});box-shadow:0 10px 24px -10px ${C.brand};">
        <a href="${reply}" class="full" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;white-space:nowrap;">Reply to ${escape(first)} &rarr;</a>
      </td>
    </tr>
  </table>
  <p class="full" style="margin:10px 0 0 56px;font-size:12px;color:${C.subtle};word-break:break-all;">or write to <a href="mailto:${escape(m.email)}" style="color:${C.brandInk};text-decoration:none;font-weight:600;">${escape(m.email)}</a></p>

  <!-- Build receipt, like the website footer -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;border:1px solid ${C.line};border-radius:18px;">
    <tr><td style="padding:14px 18px 10px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-size:14px;font-weight:700;color:${C.ink};">Message receipt</td>
        <td align="right" style="${mono}font-size:11px;color:${C.subtle};">No. TAP-${escape(s.year)}-${escape(s.no)}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px dashed ${C.line};">
        ${row("From", `${escape(m.name)}`)}
        ${row("Email", `<a href="mailto:${escape(m.email)}" style="color:${C.brandInk};text-decoration:none;">${escape(m.email)}</a>`)}
        ${m.intent ? row("Looking for", `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${C.brandSoft};color:${C.brandInk};font-size:12px;font-weight:700;">${escape(m.intent)}</span>`) : ""}
        ${row("Subject", escape(subject))}
        ${row("Received", `${escape(s.date)}, ${escape(s.time)} IST`)}
        ${row("IP address", `<span style="${mono}font-size:13px;">${escape(m.ip || "unknown")}</span>`)}
        ${m.device ? row("Device", escape(m.device)) : ""}
      </table>
    </td></tr>
    <tr><td style="padding:14px 18px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td class="stack" style="vertical-align:middle;font-size:12px;font-weight:600;color:${C.ink};white-space:nowrap;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${C.green};vertical-align:middle;margin-right:6px;"></span>Online and building
        </td>
        <td class="stack stack-gap" align="right" style="vertical-align:middle;">${activity()}</td>
      </tr></table>
    </td></tr>
  </table>

  <!-- A small terminal, like the one in the website footer -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border-radius:16px;" bgcolor="${C.night}">
    <tr><td style="padding:10px 16px;border-bottom:1px solid ${C.nightLine};">
      <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#3a2c24;margin-right:4px;"></span><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#3a2c24;margin-right:4px;"></span><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#3a2c24;margin-right:10px;"></span>
      <span style="${mono}font-size:11px;color:${C.nightMuted};">~/inbox</span>
    </td></tr>
    <tr><td style="padding:12px 16px 14px;${mono}font-size:12px;line-height:1.8;color:${C.nightText};word-break:break-word;">
      <span style="color:${C.brand};">$</span> contact --from "${escape(first)}"<br>
      <span style="color:${C.green};">ok</span> <span style="color:${C.nightMuted};">message received, ${words} words, ${escape(s.time)} IST</span><br>
      <span style="color:${C.green};">ok</span> <span style="color:${C.nightMuted};">promised reply: within 24 hours</span><br>
      <span style="color:${C.brand};">$</span> <span style="display:inline-block;width:7px;height:13px;background:${C.brand};vertical-align:middle;"></span>
    </td></tr>
  </table>
</td></tr>

<!-- ============ Footer ============ -->
<tr><td align="center" style="padding:24px 8px 0;">
  <p style="margin:0;font-size:16px;font-weight:800;letter-spacing:-.01em;color:${C.ink};">Ideas in. <span style="color:${C.brandDeep};">Working products out.</span></p>
  <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:${C.subtle};">
    Sent by the contact form on <a href="${profile.site}/contact" style="color:${C.muted};">${escape(site)}</a>. It works even when ABI is offline.
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Plain text version for clients that do not show HTML. */
export function contactEmailText(m: ContactEmail) {
  const s = stamp();
  return [
    `New message from your website${m.intent ? ` (${m.intent})` : ""}`,
    "",
    `From: ${m.name} <${m.email}>`,
    `Subject: ${m.subject || "New message"}`,
    "",
    m.message.trim(),
    "",
    `Received ${s.date}, ${s.time} IST via ${profile.site}/contact`,
    `IP address: ${m.ip || "unknown"}${m.device ? `, device: ${m.device}` : ""}`,
  ].join("\n");
}
