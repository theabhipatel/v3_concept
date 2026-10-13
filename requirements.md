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
- Switch light/dark theme.

### 5.3 Operating the portfolio
- Visitors can say or type "show me your AI projects" and watch ABI do it.
- A visible **agent cursor** shows what ABI is clicking/scrolling, so actions are transparent.
- UI actions are client-side tools the agent calls; the page performs them.

### 5.4 Generative UI and transparency
- ABI answers with real components (project cards, skill charts, timeline), not only text.
- "How I answered" panel: retrieved sources and tools used. This showcases AI engineering.
- Suggested follow-up questions after each answer. Session memory within a visit.

### 5.5 Voice (speech in, speech out)
- Push-to-talk pipeline: browser records -> Groq speech-to-text (Whisper) -> ABI -> browser
  Web Speech API speaks the answer. Live captions, and the visitor can interrupt ABI mid-answer.
- Ask for mic permission with a short privacy note. Never store voice recordings.
- Later (section 11): OpenAI Realtime speech-to-speech for owner mode.

## 6. Home page and design concept

**Concept: the site is an AI pipeline.** Scrolling the home page follows a request through an
AI system, so visitors want to reach the "answer" at the end:

**Prompt -> Retrieve -> Reason -> Act -> Deliver**
(Hero -> About -> Skills -> Projects -> Contact/Footer)

- **Hero:** no classic hero. A large command bar "Ask ABI anything about Abhishek..." with
  sample questions typing themselves, in front of a 3D **neural core** that reacts to the pointer
  and opens up as the user scrolls. The opening core is the hook to keep scrolling.
- Each stage visibly "processes" and hands data to the next, driven by scroll.
- Animations are unique to this portfolio, smooth, and optimized (section 9).

### 6.1 Nudging visitors to try ABI
- After about 20 seconds or 40% scroll, ABI comments on what the visitor is looking at
  (for example on projects: "Want me to compare these 3 for you?").
- "Ask ABI about this" on hover/tap of any project, skill or job.
- A short ghost-cursor demo where ABI briefly drives the page to show what it can do.
- Recruiter hook: "Paste a job description and I'll show you why Abhishek fits."
- Nudges must feel attractive, never spammy: each shows at most once per visit and can be
  dismissed.

### 6.2 Navigation (not a traditional navbar)
- **The ABI orb is the navbar:** a small glowing orb that stays on screen.
  - Click: a radial menu of pages.
  - Cmd/Ctrl + K: command bar ("go to projects", "open Secure Vault").
  - Hold Space or the mic button: talk to ABI.
- On the home page, a thin progress rail shows the current pipeline stage.
- Must stay fully keyboard and screen-reader accessible, with a visible text fallback.

## 7. Theme

- Related to v2 but not the same. v2 used a near-black navy (`hsl(222 47% 5%)`) with brand blue
  (`hsl(217 91% 60%)`) and indigo (`hsl(243 75% 59%)`).
- v3 direction: deeper ink background, electric indigo + cyan as brand colors, plus **one new
  accent** (mint or soft amber) used **only** when ABI is active, so AI moments stand out.
- New typography (not Inter + Orbitron like v2).
- All tokens in **one file** (CSS variables, mapped into Tailwind `@theme`). Changing a token
  there changes it everywhere, for both themes.
- Both themes meet WCAG AA contrast.

## 8. Tech stack

| Area | Choice |
|---|---|
| Web framework | Next.js (App Router), TypeScript, static/server rendering for SEO |
| UI | Tailwind CSS v4 + shadcn/ui (Radix), customized so it looks unique |
| Theming | CSS-variable tokens in one file + `next-themes` for light/dark |
| Motion | GSAP ScrollTrigger + Lenis smooth scroll; Motion for small UI transitions |
| 3D | React Three Fiber, one canvas only |
| AI in the browser | Vercel AI SDK (streaming, tool calls, generative UI) |
| Agent backend | Python FastAPI + LangGraph |
| Data / RAG | PostgreSQL + pgvector (Neon or Supabase free tier), free embeddings API (for example Gemini, decided in Phase 2) |
| Models | Groq free tier for chat and STT, browser Web Speech API for TTS (IDs in env vars) |
| Observability | Langfuse tracing + a small eval set for answer accuracy |
| Email | Contact form sends email to theabhipatel.co@gmail.com, subject starts with `[Portfolio v3]` |
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
- Pause every animation and the 3D canvas when off-screen or when the tab is hidden.
- Only one WebGL canvas on the page. Lower its quality on weak devices.
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

Ideas parked for later (not decided):
- **Owner mode:** a secret unlock link sets a signed cookie so only Abhishek gets paid OpenAI
  features (Realtime voice, stronger model) when showcasing. OpenAI project budget as backstop.
- **BYOK:** visitors paste their own OpenAI key for premium features.
- Bot protection (Cloudflare Turnstile or Vercel BotID), Google sign-in.

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
- [x] **Phase 4 - Home experience:** pipeline scroll story, neural core, orb navigation.
- [x] **Phase 5 - Agent actions:** tools, agent cursor, generative UI, "How I answered".
- [x] **Phase 6 - Voice:** push-to-talk (hold Space or mic) + Groq Whisper + browser speech,
      captions, interrupt. Mic privacy note before first use.
- [x] **Phase 7 - Safety and cost:** see section 11.
- [ ] **Phase 8 - Polish and launch:** nudges, performance budget and accessibility are done
      and checked locally (no console errors, LCP 0.2 s / CLS 0 unthrottled, AI and 3D code
      lazy-loaded). Remaining: deploy to Vercel (needs Vercel login + Neon `DATABASE_URL`,
      then run ingest against Neon), SMTP credentials for the contact form, a real-device
      Lighthouse run.

Run locally: Docker `abi_pg` (port 5434), then `uv run uvicorn app.main:app --port 8000` in
`apps/agent` and `npm run build && npm start` in `apps/web` (http://localhost:3000).

Tick a phase here when it is done.
