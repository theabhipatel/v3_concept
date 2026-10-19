# TheAbhiPatel Portfolio v3 - Requirements

> The single source of truth for v3. Read this before starting any task and check your work
> against it when you finish. If a decision changes, update this file in the same change.

## 1. Goal

An **AI-first portfolio** that presents Abhishek Patel (TheAbhiPatel) as a **Full Stack AI
Engineer**. The site is itself the proof of skill: a beautiful, fast, multi-page website with a
real AI agent, **ABI**, that can answer anything about Abhishek and operate the portfolio for
the visitor, by text or voice.

Success means:
- A visitor who lands on the hero wants to scroll all the way to the footer.
- Most visitors try ABI at least once, because the site invites them in an attractive way.
- Every answer ABI gives is accurate and grounded in real data.
- The site stays smooth on low-end phones and fully usable when the AI is down.

## 2. Hard rules

1. **v3 is a completely new experience.** Do not reuse v2 concepts: no DevOps-themed SVG
   backgrounds, no fluid WebGL cursor, no footer sparkles, no bottom pill navbar, no v2 layouts.
   Only the **data** comes from v2.
2. **Never use em dashes or en dashes** (Unicode U+2014 and U+2013) anywhere: code, copy, metadata, docs, commit
   messages. Use a normal hyphen (-).
3. **One central theme.** Every color, font, radius, shadow and motion value comes from a single
   tokens file. No hardcoded colors in components.
4. **Light and dark themes are both first-class.** Design the light theme on its own, never as an
   inverted dark theme. Both must look modern, clean and attractive.
5. **Free tools first.** Hosting and AI use free tiers: Groq for chat and speech-to-text, the
   browser's Web Speech API for text-to-speech, a free embeddings API, Vercel free plan. Model IDs
   live in environment variables, never hardcoded. Paid OpenAI is deferred (see section 11).
6. **The site works without AI.** If the agent or OpenAI is down, every page, link and the
   contact form still works.
7. **Performance budget is a requirement, not a nice-to-have** (see section 9).
8. Do not modify the v2 project. Read from it only.

## 3. Identity and content

- Name: **Abhishek Patel**, brand **TheAbhiPatel**, site **www.theabhipatel.com** (always use `www`).
- Main title: **Full Stack AI Engineer**. DevOps stays as a strong skill (Docker, Kubernetes,
  AWS, CI/CD) and is mentioned in descriptions and keywords, but is not the title.
- Location: Indore, India. Experience: 4+ years. Email: theabhipatel.co@gmail.com.
- **Source data lives in v2** at `../v2` (sibling folder). Port it once into `content/`:
  - `../v2/constants/projects.ts` - projects (Secure Vault is first)
  - `../v2/constants/skills.ts` - skills, including the AI category
  - `../v2/constants/experience.ts` - work history (IBR Infotech: Full Stack AI Engineer)
  - `../v2/constants/about.ts`, `contact.ts`, `stats.ts`
  - `../v2/systemPrompt.md` - facts about Abhishek used by the v2 chatbot
  - `../v2/public/assets/` - project images, avatar, logos
  - `../v2/app/**/page.tsx` and `layout.tsx` - SEO titles, descriptions, keywords, JSON-LD
- After porting, `content/` is the single source of truth for **both** the website and ABI's
  knowledge base. Never duplicate facts in two places.

## 4. Pages

| Route | Purpose |
|---|---|
| `/` | Home: the scroll story (section 6) |
| `/skills` | All skills, grouped, with "Ask ABI about this" on each |
| `/projects` | All projects, filterable |
| `/projects/[slug]` | One page per project: case study, stack, links, images |
| `/about` | Story, experience timeline, education, values |
| `/contact` | Contact form + ways to reach Abhishek |
| `/abi` | Full-screen "Talk to ABI" workspace for long chats and voice |
| `/lab` | Small live AI demos built by Abhishek, as proof of skill |
| `/signin` | Power users: sign in or create an account (noindex) |
| `/settings` | Power users: power switch, OpenAI key, models, saved conversations (noindex) |
| `/admin` | Admins: accounts, sign-ups, user management (noindex) |

Every page is server-rendered or static for SEO. AI features hydrate on top.

## 5. The ABI agent

**Name:** ABI. **Full name:** **ABI (Abhi's Brain Interface)**. When asked its name, ABI always
gives the full name. Show the full name in the UI (orb tooltip, `/abi` header, about ABI panel).

### 5.1 Knowledge: advanced RAG
- Sources: everything in `content/`, plus Abhishek's public GitHub READMEs.
- Hybrid retrieval: vector search (pgvector) + keyword search + title match, fused with RRF,
  then a light rerank. Embeddings: Gemini free tier (768 dims).
- Answers cite their sources and link to the exact page, project or section.
- Never invents facts. If something is not in the data, ABI says so and offers the contact form.

### 5.2 Tools (ABI can act, not just talk)
- Navigate to any page, scroll to and highlight a section.
- Filter projects/skills, open a project, compare projects side by side.
- Show real code snippets from Abhishek's public repos.
- Read live GitHub stats.
- Job-description match: paste a JD, get a fit summary and a walkthrough of relevant work.
- Generate a tailored resume PDF for a JD (opens `/resume`; "Download PDF" uses the browser's
  print to PDF, free).
- Book a call (scheduling link from `BOOKING_URL`; empty = contact form) and draft a contact
  message the visitor reviews and sends (never sent without a click).
- Switch the theme: light, dark or system.

**Most awaited tools (built 2026-10-19).** Clear phrasings run instantly in the browser
(`components/abi/commands.ts`, no tokens); the agent and the Realtime/GPT-Live voice have the same
tools for everything else. Every chat request now also sends the visitor's current page.
- [x] System theme: light, dark or "use system theme" (follows the device).
- [x] Find on page: "find Docker" highlights every match (CSS Custom Highlight API) and goes to
      the first; "next" steps through them. Agent tool `find_on_page`.
- [x] Summarize this page: "summarize this page", "what is this page about", "tldr". The page's
      text goes with that one request (`pageText`, max 5,000 characters, only in that turn's
      system prompt, never kept in history).
- [x] Share: phone share sheet, or copies the link.
- [x] QR code: "show QR code" pops up a scannable QR of the current page (the live site URL when running locally); "close it" / "close the QR code" closes it.
- [x] Voice chimes: an energetic rising chime when a live voice conversation starts listening, a falling one when it ends (Web Audio, no files).
- [x] Profiles: "open his LinkedIn / GitHub / X / LeetCode"; WhatsApp only when asked directly.
- [x] Reading comfort: bigger or smaller text (zoom), and calm mode ("reduce motion": animations
      settle instantly, remembered in the browser, applied before first paint).
- [x] Voice settings: mute or unmute (also a speaker button in ABI's panel), speak slower, faster
      or normally (remembered in the browser; Realtime voice honours mute).
- [x] Print or save the page as PDF (browser print).
- [x] Clear chat: "clear the chat", "start fresh", "new chat" starts a new session (a signed-in
      user's earlier conversation stays saved).
- [x] Highlight: "highlight / point at / show me where X" spotlights it (the page dims around it)
      without clicking.

### 5.3 Operating the portfolio
- Visitors can say or type "show me your AI projects" and watch ABI do it.
- A visible **agent cursor** shows what ABI is clicking/scrolling, so actions are transparent.
- UI actions are client-side tools the agent calls; the page performs them.

### 5.4 Generative UI and transparency
- ABI answers with real components (project cards, skill charts, timeline), not only text.
- "How I answered" panel: retrieved sources and tools used. This showcases AI engineering.
- Suggested follow-up questions after each answer. Session memory within a visit.

### 5.5 Voice (speech in, speech out)
- Push-to-talk pipeline: browser records -> Groq speech-to-text (Whisper) -> ABI -> spoken
  answer. Voice: Groq Orpheus TTS (`canopylabs/orpheus-v1-english`, voice "troy", free tier:
  about 100 requests/day, 1,200 characters/min, 200 characters per request) via
  `GET /api/agent/speak`, played in-page, split into <=190-character parts fetched ahead,
  identical phrases cached by the CDN for 30 days. Any failure (limit, outage) switches to the
  free browser Web Speech voice for 10 minutes, mid-answer if needed. Live captions, and the visitor can interrupt ABI mid-answer.
- Ask for mic permission with a short privacy note. Never store voice recordings.
- **Two voice modes** in every ask box: the mic button = push-to-talk (speak once, transcribed,
  sent); the waveform button (shown when the box is empty, the send arrow when text is typed) =
  **live conversation**, a hands-free loop: Silero VAD (`@ricky0123/vad-web`, runs in the
  browser; model and WASM self-hosted in `public/vad/<versions>/` by
  `scripts/copy-vad-assets.mjs`, cached for a year, warmed in the background after page load
  unless data saver or a slow connection) detects when the visitor starts and stops
  talking -> Whisper -> ABI acts -> ABI speaks -> listens again. The mic pauses while ABI thinks.
  While ABI speaks with the Groq voice (played in-page, so echo cancellation removes it) the mic
  stays open with a stricter VAD setting, and clear speech from the visitor stops ABI
  (barge-in). With the browser fallback voice the mic stays paused (it would hear itself).
  Groq free voice limit is about 3,600 characters a day. "Skip" cuts the spoken answer short; End or closing the panel
  releases the mic. Code: `components/abi/live.ts`.
- **Voice navigation** (typed works too): "open the projects page", "scroll a little / more / one
  page / to the top", "go back", "dark mode", "click on Recruiter", "open Secure Vault".
  - Clear commands are parsed in the browser (`components/abi/commands.ts`) and run instantly
    with no AI call. Everything else goes to the agent, which has `scroll_page` and `click_on`.
  - One page = the current screen height; scrolling is smooth (Lenis).
  - Also: type into any field ("type ... in the message box"), "search for ...", fill the
    contact form (agent: `fill_contact_form`; the visitor still presses Send), jump to a section,
    ABI's panel (full screen, dock, float, wider, narrower, close), the site menu, forward/back,
    zoom, read the visible page aloud, copy his email or the page link, stop, end live mode
    (agent: `type_text`, `control`). External links open in a new tab, or ABI hands over the
    link when the browser blocks it. Not possible by design: real mouse hover (browsers do not
    allow faking it). Every clickable element has a text or aria name, so ABI can click it.
  - Page tour: "show me this whole page, top to bottom" goes back to the top, then glides down
    section by section, pausing on each heading with ABI's cursor. Scrolling, clicking, a key
    press or "stop" ends it. Agent tool: `tour_page`.
  - Clicks find the visible button or link by its text. ABI's cursor glides there along a soft
    arc from its last position with a sparkle trail, then clicks with rings of light, a burst
    of sparks and a glow on the target.
- Later (section 11): OpenAI Realtime speech-to-speech for owner mode.

### 5.6 Power users (built 2026-10-19)
Visitors use ABI as before (free Groq models). Anyone can sign up and bring their own OpenAI key;
only that user's ABI runs on it.
- **Accounts:** Better Auth in the web app (email and password, Google when `GOOGLE_CLIENT_ID`
  is set), tables in the same Postgres. `npm run db:setup` (also run on every build) creates them (plus `abi_power`,
  `abi_conversation`). Normal visitors never call the server for this: `/api/me` is only asked
  once this browser has signed in.
- **Email accounts must confirm their email** (built 2026-10-19): sign-up sends a "Confirm your
  email" message through the contact form's SMTP (`lib/server/mailer.ts`, template
  `lib/server/auth-email.ts`); signing in unconfirmed sends a fresh link; the link (1 hour) signs
  the user in and opens `/settings`. Google accounts are already confirmed.
- **Forgot password:** "Forgot password?" on `/signin` sends a one-hour reset link (same reply for
  unknown emails, so accounts can't be discovered) to `/reset-password` (new password typed
  twice). A reset signs the user out on every device (no session cookie cache).
- **Sign in button** top right of the header: pressing it charges the button and throws a small
  spark of lightning before `/signin` opens. Signed in, it becomes the user's chip with a bolt
  (lit while power is on), linking to `/settings`.
- **OpenAI key:** tested against OpenAI (list models) before saving, sealed with AES-256-GCM
  (`ABI_KEY_SECRET`, user id bound in), never sent back to the browser (only a hint like
  `sk-...abcd`). "Delete key" removes it from the row and turns power off.
- **Power switch** (`/settings`): flips ABI to OpenAI. Turning it on plays the surge
  (`components/power/surge.ts`): lightning forks from the button to every edge, a shockwave, a
  thunderclap shake and edge glow; then copper circuit traces route out of the button to chips
  and pads, and two buses power a GPU (cores wake in a wave, HBM fills, clock/TFLOPS/memory
  count up) and a CPU (16 cores, cache, boost clock); everything fades out after about 4 seconds.
  No flames (decided 2026-10-19). While on, ABI's orb carries a
  ring of current.
- **What moves to OpenAI:** chat, rewrite, follow-ups, JD match and resume (main model, default
  `gpt-6-luna`, via the agent with the key forwarded server to server behind
  `ABI_POWER_SECRET`, guard skipped for power users); push-to-talk (`gpt-4o-mini-transcribe`) and
  spoken answers (`gpt-4o-mini-tts`, the chosen voice); live conversation becomes OpenAI
  voice: GPT-Live by default (`gpt-live-1`, decided 2026-10-19) or an OpenAI Realtime model over WebRTC (voice `marin`) with page tools and `ask_abi`
  delegation to the full agent (`components/abi/realtime.ts`, tools in `lib/realtime-tools.ts`).
  If Realtime can't start, the normal voice loop takes over.
- **Embeddings stay Gemini** (`gemini-embedding-001`, locked): the knowledge base was built with it.
- **GPT-Live** (`gpt-live-1`, $0.05/min) is the default voice model and always offered: the server opens
  the session from the browser's offer (`/api/power/live`), the voice layer delegates to the
  user's main model (Responses delegation) whose tool calls run in the browser. It has its own
  22 voices; Realtime models use all 10 Realtime voices (`liveVoice` and `voice` are saved apart).
- **Settings layout:** power switch, then key and conversations, then a full-width "Models and
  voice" section: "In use now" cards (default badge or "Use default") on top, tabs below
  (main model, voice model, voice) with search, family filters and price chips.
- **Models list** comes live from the user's key; prices come from `lib/openai-models.ts`
  (copied from OpenAI's pricing page 2026-10-19, update when prices change).
- **Conversations** of signed-in users are saved after every answer and listed in `/settings`
  (Continue reopens one with the agent's memory, Delete removes it).

### 5.6.1 Admin dashboard (built 2026-10-19)
`/admin`, admins only (Better Auth `admin` plugin: `role`, `banned` columns). Shows accounts,
verified, with OpenAI key, power on, saved chats, new this week, a 14-day sign-up chart, and every
user (search, filters: power users, unverified, banned, admins) with sign-in method, status,
models, chats and last activity. Actions: make or remove admin, sign out everywhere, remove
their OpenAI key, ban (with reason; they can't sign in) or unban, delete. Admins can't ban, delete
or demote themselves. It never shows keys or conversation text. "Admin dashboard" link on
`/settings` for admins. Seed: `npm run db:seed-admin` (test default admin@gmail.com / 1234,
below the 8-character minimum; set `ADMIN_EMAIL` / `ADMIN_PASSWORD` for production).

### 5.7 Next: ABI Chat app (planned, not built)
After the realtime features are proven, grow `/abi` into a full chat application **for signed-in
users only** (visitors keep today's `/abi`): a sidebar of saved conversations (new, rename,
search, delete), full-height chat, model picker in the composer, voice and realtime built in,
attachments later. Remind Abhishek when realtime work is done.

## 6. Home page and design concept

**Not a portfolio.** Decided 2026-10-19: v3 is an animated website that introduces Abhishek and
shows his work happening, instead of listing it. The presentation idea (not the design) comes
from github.com/theabhipatel/dockwell: a hero that tells the story as a live loop, a small
animated scene per section, and a footer with its own metaphor. Never call the site or its copy
a "portfolio". Replaced "Ask first, built for you" (roles picker, removed). No photo on the home page.

- **Hero:** name pill, headline "I turn ideas into AI products that ship.", ABI's ask box (text,
  mic, live voice, suggestion chips, "Paste a job description"), then the **Build loop**: one
  real project per loop goes Brief (request types itself) > Plan (architecture blocks light up)
  > Build (code streams, checks pass) > Ship (address types in, product goes live), with a step
  rail. Phones show only the current step. Code: `components/home/build-loop.tsx`.
- **Sections:** toolbox marquee (two rows, opposite directions) > What I do (three cards, each
  with its own looping CSS scene: agent, product dashboard, ship pipeline) > Things I have
  shipped (designed name banners, `components/projects/project-banner.tsx`) > The road so far
  (count-up numbers, self-drawing timeline) > Meet ABI (four steps lighting up in turn) > call
  to action.
- **Project banners, not screenshots:** each project has a stable tint (`--tone-1..6`) and
  pattern from its slug, its name set large, a giant outlined initial, tags and a hover lift.
- **Footer "Workshop":** a lane of every project as a commit gliding past, a build receipt
  (who, where, open to, replies, copyable email, "Online and building", activity grid), link
  groups as branches (main / work / connect), "Now" and "Latest ship" cards, Ask ABI card,
  back to top.
- **Motion rules:** one `MotionObserver` (reveals via `data-reveal`, count-ups via `data-count`,
  `data-motion` loops paused off screen). The hero intro is CSS only (fast LCP). Reduced motion
  shows the finished, still picture. Styles: `styles/site.css`.
- **Home shows only hobby projects** (`type: "personal"`), also in the footer. Client work is
  shown only on `/projects`.
- **Projects (built):** header with counting facts, category chips with counts, a sliding
  "All work / Built for fun / Professional work" switch (hobby projects listed first), and a grid of banners. Filtering animates
  with React `<ViewTransition>` (leaving banners shrink away, the rest glide into place).
- **Project page (built):** the clicked banner grows into the page hero (shared `ViewTransition`
  name `banner-<slug>`), then facts, the story, features, how it works (self-drawing steps), a
  framed screenshot, stack, Ask ABI and "Up next" banners. Extra details come from
  `content/project-details.json`, written from each project's GitHub README.
- **About (built):** intro with a live local-time pill, "I build ___" rotating words and a
  tilted photo card (photo is allowed here, not on home); counting numbers; the story in four
  chapters with a sticky rail that lights the chapter being read; the journey from college to
  today as a self-drawing timeline; values and services; floating interests; call to action.
- **Skills (built):** hero with level counts and an orbit of tools (expert ones on the inner
  rings, CSS only, paused off screen); a sticky category rail (sliding tabs, faded edges when
  it scrolls) plus search; skill cards tinted by category (`components/skills/skill-meta.ts`)
  with the logo inside a full, softly glowing ring in its category color that draws as the card scrolls in (CSS scroll-driven
  animation), a pointer-following tilt and spotlight, and Ask ABI. Filtering animates with
  `ViewTransition`.
- **Contact (built):** live "Available now / Away" status from the IST schedule; a paper plane
  flying a dashed route into a bouncing inbox (SVG motion, paused off screen); a compose form
  with intent cards that fill the subject, floating labels with a glowing underline, a character
  counter, a send button whose plane takes off, an animated success check, and typed values kept
  after a failed send (ids stay name/email/subject/message for ABI); direct contact cards; a week
  chart with a "now" marker; "Draft it with ABI"; FAQ that opens smoothly.
- **AI Lab (built):** "Take ABI apart": an x-ray of the pipeline (question, guard, retrieve,
  agent, answer) with a travelling packet and a scan line; three stations, each with controls
  and a dark output console: 01 "Try to trick ABI" (attack and safe presets, a risk gauge with
  a swinging needle, blocked/safe verdict), 02 "See what ABI reads" (preset queries, fused-rank
  hits that slide in with growing score bars), 03 "Match a job description" (sample role, steps
  that light up, hands off to ABI); then the free-tier stack ABI runs on.
- **Talk to ABI (built):** a studio. Left: ABI's presence (the robot inside rings and orbiting
  dots that react to its state: breathing idle, rippling green while listening, a fast orbit
  while thinking, a pulsing glow while speaking), a live status pill, "I can ___" rotating
  capabilities, "Start talking" (hands-free live mode) and "Match a job". Right: the same chat as
  the side panel in a glass card, with animated starter cards on the page layout.
- **Resume (built):** a paper sheet (paper tokens, same in both themes) that prints out of a
  printer slot on load, its parts fading in; a rubber stamp ("Tailored by ABI" or "Real data
  only") thumps on; a side desk with Download PDF (browser print, only the sheet prints),
  quick numbers and "Tailor it for a job" (sends the JD to ABI's `tailored_resume`).
- **404 (built):** ABI sweeps a flashlight across a giant "404" that lights up under the beam
  (`@property --sx`), with four ways back and "Ask ABI to find it" (sends the broken path).
- All pages are now in the new style.

### 6.1 Nudging visitors to try ABI
- After about 20 seconds or 40% scroll, ABI comments on what the visitor is looking at
  (for example on projects: "Want me to compare these 3 for you?").
- "Ask ABI about this" on hover/tap of any project, skill or job.
- A short ghost-cursor demo where ABI briefly drives the page to show what it can do.
- Recruiter hook: "Paste a job description and I'll show you why Abhishek fits."
- Nudges must feel attractive, never spammy: each shows at most once per visit and can be
  dismissed.

### 6.2 Navigation (not a traditional navbar)
- **The ABI orb is the navbar:** an animated robot button (AbiBot) that stays on screen.
  - Click: a radial menu of pages (icons with labels) over a dimmed full-screen backdrop with a
    slow glow and ripples from the orb. Click the backdrop or press Esc to close.
  - Cmd/Ctrl + K: command bar ("go to projects", "open Secure Vault").
  - Hold Space or the mic button: talk to ABI.
- **ABI panel layouts** (remembered per visitor): docked as a right sidebar that pushes the page
  aside (drag its edge to resize, double-click to reset), floating as a draggable, resizable
  window, or full screen. Phones always use full screen.
- Must stay fully keyboard and screen-reader accessible, with a visible text fallback.

## 7. Theme

- Palette: **orange** brand (warm, energetic) with **amber** as its partner, used for ABI moments,
  on warm neutrals. Clean and readable; soft brand glows only for live or active moments.
- Light: warm cream paper, white cards, warm ink text. Dark: almost pure black (`oklch(0.095 0.008 45)`, about #040202) with a faint dark-orange tint, so orange accents pop.
- Font: **Plus Jakarta Sans** for headings and body (clean and very readable), Geist Mono only
  for code.
- All tokens in **one file** (`apps/web/styles/tokens.css`, CSS variables mapped into Tailwind
  `@theme`). Changing a token there changes it everywhere, for both themes.
- Both themes meet WCAG AA contrast.

## 8. Tech stack

| Area | Choice |
|---|---|
| Web framework | Next.js (App Router), TypeScript, static/server rendering for SEO |
| UI | Tailwind CSS v4 + shadcn/ui (Radix), customized so it looks unique |
| Theming | CSS-variable tokens in one file + `next-themes` for light/dark |
| Motion | Lenis smooth scroll + CSS/IntersectionObserver reveals (GSAP and 3D removed with the old hero) |
| AI in the browser | Vercel AI SDK (streaming, tool calls, generative UI) |
| Agent backend | Python FastAPI + LangGraph |
| Data / RAG | PostgreSQL + pgvector (Neon or Supabase free tier), free embeddings API (for example Gemini, decided in Phase 2) |
| Models | Groq free tier for chat and STT, browser Web Speech API for TTS (IDs in env vars) |
| Observability | Langfuse tracing + a small eval set for answer accuracy |
| Email | Contact form sends email to theabhipatel.co@gmail.com, subject starts with `[Portfolio v3]` |
| Accounts | Better Auth (email/password + Google), Postgres via `pg` |
| Hosting | **Vercel free plan for both**: Next.js app and the FastAPI agent (Python on Vercel) |

### 8.1 Vercel notes for the Python agent
- Deploy `apps/agent` as its own Vercel project (or Python functions), reached from the web app
  through a rewrite such as `/api/agent/*`.
- Keep the Python bundle small: no heavy ML libraries (no torch); embeddings come from a
  hosted API.
- Stream responses; keep each request within Vercel function time limits.
- Store LangGraph checkpoints/session state in Postgres, not in memory.

## 9. Performance budget (lessons from v2)

v2 lagged on low/mid devices because of off-screen infinite animations, a never-sleeping WebGL
loop and an always-running particles canvas. v3 must avoid all of that:
- Pause every animation when off-screen or when the tab is hidden. No WebGL on the site.
- Respect `prefers-reduced-motion` with a calm, still-beautiful version.
- Load the AI/voice code only when the visitor first interacts with ABI.
- Targets on mobile Lighthouse: Performance 90+, LCP under 2.5s, CLS under 0.1, TBT under 200ms.
- Smooth 60 FPS scrolling on a mid-range phone.

## 10. SEO

- Unique title, description, canonical URL and OG image per page (project pages too).
- JSON-LD: Person, WebSite, and each project.
- `sitemap.xml`, `robots.txt`, and `llms.txt` so AI crawlers understand the site.
- Keep v2's keywords (including DevOps ones) and add AI ones.

## 11. Abuse prevention and costs (DEFERRED)

Decided for now: build everything on free tiers (Groq + browser voice). Groq's free limits act as
a natural spend cap (8K tokens/min per model); when they run out, ABI says it is busy and points to
the contact form. Built:
- Every chat message is screened by Llama Prompt Guard (block at score >= 0.9).
- Postgres fixed-window rate limits per IP: 30 requests / 10 min each for chat, voice and lab.
- Message cap 6,000 characters (room for a JD), max 3 tool rounds per turn, audio cap 4 MB / 30 s.
- System prompt treats retrieved content and tool results as data; output is cleaned (citations,
  no em/en dashes).
- Contact form: honeypot field + 3 messages per hour per IP; works without AI.

- **Power users (built, section 5.6):** bring-your-own OpenAI key behind sign-in replaced the
  "owner mode" idea. Each user pays for their own usage; set a budget on the OpenAI project.

Ideas parked for later (not decided):
- Bot protection (Cloudflare Turnstile or Vercel BotID).

## 12. Repo layout

New repo in this folder (`v3`, sibling of `../v2`):

```
v3/
  requirements.md   <- this file
  CLAUDE.md         <- instructions for Claude sessions
  apps/web/         <- Next.js site
  apps/agent/       <- FastAPI + LangGraph agent
  content/          <- ported v2 data (JSON), single source of truth
```

- `content/*.json` is read by the web app through `apps/web/lib/content.ts` (alias `@content/*`)
  and by the agent's ingestion. Images live in `apps/web/public/assets/`.
- Theme tokens: `apps/web/styles/tokens.css` (the one tokens file).
- Agent routes live under `/api/agent/*`; the web app rewrites that path to `AGENT_URL`.

## 13. Build plan

- [x] **Phase 1 - Foundation:** scaffold `apps/web` and `apps/agent`, port v2 data into
      `content/`, theme tokens for light + dark.
- [x] **Phase 2 - ABI brain:** RAG ingestion + retrieval, agent answering accurately with
      citations, eval set. Evals 16/16 on local DB. Ingest: `uv run python -m app.rag.ingest`,
      evals: `uv run python -m evals.run` (in `apps/agent`). Local test DB: Docker container
      `abi_pg` on port 5434. Models: `openai/gpt-oss-120b` (answers), `openai/gpt-oss-20b`
      (follow-up rewrite). Groq also offers Orpheus TTS and Prompt Guard models: consider them
      for voice (Phase 6) and injection checks (Phase 7). Neon is used at deploy time.
- [x] **Phase 3 - Pages:** all pages with real content and SEO, contact form. Per-page OG
      images, JSON-LD (Person, WebSite, ItemList, each project), sitemap, robots, llms.txt.
- [x] **Phase 4 - Home experience:** redone as "The Interview" (section 6) with the new theme
      (section 7); orb navigation kept, restyled.
- [x] **Phase 5 - Agent actions:** tools, agent cursor, generative UI, "How I answered".
- [x] **Phase 6 - Voice:** push-to-talk (hold Space or mic) + Groq Whisper + browser speech,
      captions, interrupt. Mic privacy note before first use.
- [x] **Phase 7 - Safety and cost:** see section 11.
- [ ] **Phase 8 - Polish and launch:** nudges, performance budget and accessibility are done.
      Deployed 2026-10-16 on Vercel (website `theabhipatel-v3`, agent `theabhipatel-v3-abi`)
      with Neon; see DEPLOYMENT.md. Remaining: SMTP credentials for the contact form, a custom
      domain, a real-device Lighthouse run.
- [x] **Phase 9 - Power users (section 5.6):** accounts, encrypted OpenAI keys, power switch with
      surge animation, OpenAI models with prices, Realtime voice, saved conversations. Tested
      locally with a fake key (the whole chain up to OpenAI's rejection); needs a real key, Google
      OAuth and production env vars to finish.
- [x] **Phase 9b - Email verification, forgot password, ABI tools (5.2), admin dashboard (5.6.1).**
- [ ] **Phase 10 - ABI Chat app (section 5.7):** full chat app on `/abi` for signed-in users.

Run locally: Docker `abi_pg` (port 5434), then `uv run uvicorn app.main:app --port 8000` in
`apps/agent` and `npm run build && npm start` in `apps/web` (http://localhost:3000).

Tick a phase here when it is done.
