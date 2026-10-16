# Deployment

Everything runs on free tiers:

| Part | Host | Notes |
| --- | --- | --- |
| Website (`apps/web`) | Vercel (Hobby) | Next.js project |
| Agent (`apps/agent`) | Vercel (Hobby) | FastAPI as a Python function |
| Database | Neon (Free) | Postgres + pgvector |
| Chat, voice, guard | Groq (Free) | API key |
| Embeddings | Gemini (Free) | API key |

The site calls the agent through the `/api/agent/*` rewrite in `apps/web/next.config.ts`, so
visitors only ever see one domain.

## 1. Database (Neon)

1. Create a project at [neon.tech](https://neon.tech). Pick a region close to your Vercel region
   (for example AWS `ap-south-1` Mumbai, or the US region Vercel uses).
2. Copy the **pooled** connection string. It looks like:
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
3. Load ABI's knowledge base into it from your machine. This also creates the tables and turns
   on pgvector:

   ```bash
   cd apps/agent
   DATABASE_URL="<neon pooled url>" uv run python -m app.rag.ingest
   ```

## 2. Agent (Vercel project 1)

1. In Vercel, **Add New > Project**, import the repo, and set **Root Directory** to `apps/agent`.
2. Framework preset: **FastAPI** (Vercel detects `app/main.py`). If it is not detected, add this
   to `apps/agent/pyproject.toml` and redeploy:

   ```toml
   [project.scripts]
   app = "app.main:app"
   ```

3. Keep **"Include files outside the root directory"** turned on (Settings > Build and
   Deployment). The agent reads the shared `content/` folder.
4. Environment variables:

   | Name | Value |
   | --- | --- |
   | `GROQ_API_KEY` | your Groq key |
   | `GEMINI_API_KEY` | your Gemini key |
   | `DATABASE_URL` | the Neon pooled URL |
   | `ABI_CHAT_MODEL` | `openai/gpt-oss-120b` |
   | `ABI_FAST_MODEL` | `openai/gpt-oss-20b` |
   | `BOOKING_URL` | optional, e.g. a Cal.com link |
   | `GITHUB_TOKEN` | optional |

5. Deploy, then check `https://<agent-project>.vercel.app/api/agent/health`. It should return
   `{"status":"ok", ...}`.

## 3. Website (Vercel project 2)

1. **Add New > Project** again with the same repo, and set **Root Directory** to `apps/web`.
   Framework preset: **Next.js**.
2. Keep **"Include files outside the root directory"** turned on. The site imports `content/`.
3. Environment variables:

   | Name | Value |
   | --- | --- |
   | `AGENT_URL` | `https://<agent-project>.vercel.app` (no trailing slash) |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | your Gmail address |
   | `SMTP_PASS` | a Gmail [app password](https://myaccount.google.com/apppasswords) |

4. Deploy, then add your domain (`theabhipatel.com`) under **Settings > Domains** and point DNS
   as Vercel shows.

## 4. Check it works

- Home page loads, and switching roles (Recruiter, Founder, Developer) works.
- Ask ABI a question: the answer streams with sources and follow-up chips.
- Hold the mic button and speak: the question is transcribed.
- Send the contact form: the email arrives.
- `https://<your-domain>/llms.txt`, `/sitemap.xml` and `/robots.txt` load.
- Run Lighthouse on a real phone.

## Updating later

- **Code:** push to `main`. Both Vercel projects redeploy automatically.
- **Content (`content/*.json`):** push, then run the ingest command from step 1 again against
  Neon so ABI learns the change. Only changed chunks are embedded.
- **Models:** change `ABI_CHAT_MODEL` / `ABI_FAST_MODEL` in the agent's Vercel env and redeploy.
  Never hardcode model IDs.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| ABI says it is busy | Groq free limit (about 8K tokens/min per model). Wait a minute. |
| ABI answers with no sources | Ingest was not run against Neon. Run step 1.3. |
| `/api/agent/*` returns 404 | `AGENT_URL` is missing or has a trailing slash. Redeploy the web app after fixing it. |
| Agent fails to start | Check `DATABASE_URL` uses the pooled Neon URL with `sslmode=require`. |
| Contact form says "email directly" | `SMTP_USER` or `SMTP_PASS` is not set. |
