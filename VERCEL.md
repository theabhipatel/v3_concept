# Deploy to Vercel (from zero)

The whole app is **two Vercel projects from this one repo**, plus a free Neon database:

| Project | What it is | Root Directory |
| --- | --- | --- |
| Agent | ABI's brain (Python, FastAPI) | repo root (uses `vercel.json`) |
| Website | The site (Next.js) | `apps/web` (uses `apps/web/vercel.json`) |

Tables are created automatically: the agent makes its own when it starts, the website makes its
own on every build. You only fill in env vars and click deploy.

## 1. Get the keys (once)

| What | Where | Needed for |
| --- | --- | --- |
| Neon database URL (pooled) | neon.tech, new project, "Connection string" | both projects |
| Groq API key | console.groq.com | agent (chat, voice) |
| Gemini API key | aistudio.google.com | agent (search embeddings) |
| Gmail app password | Google account, Security, App passwords | website (contact form, account emails) |
| Google OAuth client ID and secret | console.cloud.google.com, Credentials | website (Google sign-in, optional) |
| GitHub token | github.com, Settings, Tokens | agent (optional) |

Make three random secrets (run it three times, keep each value):

```bash
openssl rand -base64 32
```

Call them `AUTH_SECRET`, `KEY_SECRET` and `POWER_SECRET` below.

## 2. Agent project

1. Vercel, **Add New Project**, import this repo. Root Directory: **repo root**. Framework: **Other**.
2. Env vars:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon URL |
   | `GROQ_API_KEY` | Groq key |
   | `GEMINI_API_KEY` | Gemini key |
   | `ABI_CHAT_MODEL` | `openai/gpt-oss-120b` |
   | `ABI_FAST_MODEL` | `openai/gpt-oss-20b` |
   | `ABI_EMBED_MODEL` | `gemini-embedding-001` |
   | `ABI_EMBED_DIM` | `768` |
   | `ABI_POWER_SECRET` | `POWER_SECRET` |
   | `GITHUB_TOKEN`, `BOOKING_URL` | optional |

3. Deploy. Then **Settings, Deployment Protection: off** (the website must reach it).
4. Check `https://<agent>.vercel.app/api/agent/health` says `ok`.
5. Load ABI's knowledge into Neon (once, and again whenever `content/` changes):

   ```bash
   cd apps/agent
   DATABASE_URL="<Neon URL>" uv run python -m app.rag.ingest
   ```

## 3. Website project

1. **Add New Project**, import the same repo. Root Directory: **`apps/web`**. Framework: **Next.js**.
   Turn on **"Include files outside the root directory"** (the site reads `content/`).
2. Env vars:

   | Name | Value |
   | --- | --- |
   | `AGENT_URL` | `https://<agent>.vercel.app` |
   | `DATABASE_URL` | Neon URL (same as the agent) |
   | `BETTER_AUTH_URL` | the site URL, e.g. `https://<website>.vercel.app` |
   | `BETTER_AUTH_SECRET` | `AUTH_SECRET` |
   | `ABI_KEY_SECRET` | `KEY_SECRET` (never change it later: saved user keys depend on it) |
   | `ABI_POWER_SECRET` | `POWER_SECRET` (same as the agent) |
   | `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `465` |
   | `SMTP_USER` / `SMTP_PASS` | Gmail address / app password |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional; without them the Google button hides |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your admin login (a strong password, never `1234`) |

3. Deploy. The build creates all tables and the admin account by itself.
4. **Settings, Deployment Protection: off** (so the site is public).

## 4. Google sign-in (only if you set the Google vars)

In the OAuth client, add:
- Authorized JavaScript origin: `https://<website>.vercel.app`
- Authorized redirect URI: `https://<website>.vercel.app/api/auth/callback/google`

## 5. Check it works

- Home page loads; ask ABI a question and the answer streams with sources.
- Sign in at `/signin` with the admin, then open `/admin`.
- Settings: add an OpenAI key, flip the power switch, talk to ABI.

## Later

- **Deploy updates:** connect the repo in each project (Settings, Git) and every push to `main`
  deploys. Or from the repo root with the CLI:

  ```bash
  export VERCEL_ORG_ID=<team id>
  VERCEL_PROJECT_ID=<agent project id> vercel deploy --prod --yes
  VERCEL_PROJECT_ID=<website project id> vercel deploy --prod --yes --local-config apps/web/vercel.json
  ```

  The ids are in each project's Settings, General.
- **Change an env var:** edit it in Vercel, then redeploy that project.
- **Custom domain:** add it to the website project (Settings, Domains), set `BETTER_AUTH_URL` to it,
  add it in the Google OAuth client, redeploy the website.

More detail and troubleshooting: `DEPLOYMENT.md`.
