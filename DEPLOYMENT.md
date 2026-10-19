# Deployment

Live on free tiers:

| Part | Host | URL |
| --- | --- | --- |
| Website (`apps/web`) | Vercel project `theabhipatel-v3` | https://theabhipatel-v3.vercel.app |
| Agent (`apps/agent`) | Vercel project `theabhipatel-v3-abi` | https://theabhipatel-v3-abi.vercel.app/api/agent/health |
| Database | Neon (Free), AWS US East | Postgres + pgvector |
| Chat, voice, guard | Groq (Free) | API key |
| Embeddings | Gemini (Free) | API key |

The website calls the agent through the `/api/agent/*` rewrite in `apps/web/next.config.ts`
(`AGENT_URL`), so visitors only ever see the website's domain.

## How the two projects are set up

| | Website | Agent |
| --- | --- | --- |
| Root Directory | `apps/web` | repo root |
| Config | `apps/web/vercel.json` (Next.js) | `vercel.json` at the repo root |
| Code entry | Next.js | `api/index.py` (imports `apps/agent/app/main.py`) |
| Packages | `apps/web/package.json` | `requirements.txt` at the repo root |
| Env vars | `AGENT_URL`, optional `SMTP_*`, power users: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ABI_KEY_SECRET`, `ABI_POWER_SECRET`, optional `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `ABI_POWER_SECRET` (same value as the website's), `GROQ_API_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`, `ABI_CHAT_MODEL`, `ABI_FAST_MODEL`, `ABI_EMBED_MODEL`, `ABI_EMBED_DIM`, optional `BOOKING_URL`, `GITHUB_TOKEN` |

- Both projects read the shared `content/` folder ("Include files outside the root directory"
  is on for the website; the agent bundles `content/**`).
- Deployment Protection is **off** for both projects, so the site is public and the website
  can reach the agent. New Vercel projects turn it on by default.
- `.vercelignore` keeps `.env` files, `node_modules`, `.venv` and build output on your machine.
- Region: Vercel functions run in `iad1` (US East), next to Neon and Groq.

## Deploy from your machine (Vercel CLI)

Run from the **repo root**. The CLI picks the project from these two variables:

```bash
export VERCEL_ORG_ID=team_liMFqMOLiKAxaIovPvcPF5vy

# Agent
VERCEL_PROJECT_ID=prj_sR2RpVJT9ae4FzN7hk8XreCc6w15 vercel deploy --prod --yes

# Website (its own vercel.json, so the root one, which is the agent's, is not used)
VERCEL_PROJECT_ID=prj_kOKhcZlFx6sMkxYRi0WWTtHiFhM2 vercel deploy --prod --yes --local-config apps/web/vercel.json
```

Change an env var with `vercel env add NAME production` (same two variables set), then redeploy
that project.

## When things change

- **Content (`content/*.json`):** redeploy both, then refresh ABI's knowledge in Neon (only
  changed chunks are embedded):

  ```bash
  cd apps/agent
  DATABASE_URL="<Neon pooled URL>" uv run python -m app.rag.ingest
  ```

- **Agent Python packages:** after changing `apps/agent/pyproject.toml`, regenerate the root
  `requirements.txt` (the command is in its header), then redeploy the agent.
- **Models:** change `ABI_CHAT_MODEL` / `ABI_FAST_MODEL` in the agent's env and redeploy.

## Power users (accounts)

- Database setup is automatic: every website build runs `scripts/db-setup.mjs` (all tables, safe to
  repeat), and seeds the admin when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set on the project.
  No `DATABASE_URL` (preview builds) = skipped. By hand: `cd apps/web && npm run db:setup`
  (reads `.env.local`), or `DATABASE_URL="<url>" node scripts/db-setup.mjs`.
  (never the test password 1234 in production).
- `BETTER_AUTH_URL` is the site's public URL. `ABI_KEY_SECRET` must never change once users have
  saved keys (they would have to add them again). `ABI_POWER_SECRET` must match on both projects.
- Account emails (confirm email, reset password) use the same `SMTP_*` variables as the contact
  form, so they are required once accounts are live.
- Google sign-in: OAuth client in Google Cloud console, authorized redirect URI
  `<site>/api/auth/callback/google`. Without the two variables the Google button is hidden.

## Still to do

Power users (deployed 2026-10-19; set on Vercel already: `BETTER_AUTH_SECRET`, `ABI_KEY_SECRET`,
`ABI_POWER_SECRET` on both projects, `BETTER_AUTH_URL=https://theabhipatel-v3.vercel.app`). Left:
- Website env: done 2026-10-19 (`DATABASE_URL`, `SMTP_*`, `GOOGLE_*`, test values) and redeployed.
  Neon tables and the test admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD` on Vercel) created by the build.
- Google console: redirect URI `https://theabhipatel-v3.vercel.app/api/auth/callback/google`.
- Rotate the secrets that were shared in chat (Gmail app password, Google client secret, Neon password).

- Custom domain: add it to the website project under Settings > Domains.
- Optional: connect the GitHub repo to both projects for automatic deploys on push.

## Check it works

- The home page loads, and switching roles works.
- Ask ABI a question: the answer streams with sources.
- Live conversation (waveform button): speak, and ABI answers and listens again.
- `/llms.txt`, `/sitemap.xml` and `/robots.txt` load.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Website shows 404 everywhere | It was deployed without `--local-config apps/web/vercel.json`. Redeploy with it. |
| ABI says it is busy | Groq free limit (about 8K tokens/min per model). Wait a minute. |
| ABI answers with no sources | Ingest was not run against Neon. Run the ingest command above. |
| `/api/agent/*` returns 401 or 404 | Deployment Protection is on, or `AGENT_URL` is wrong. Fix it, then redeploy the website. |
| Contact form says "email directly" | `SMTP_USER` or `SMTP_PASS` is not set on the website project. |
