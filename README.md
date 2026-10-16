# TheAbhiPatel - Portfolio v3

An AI-first portfolio for Abhishek Patel, Full Stack AI Engineer. Visitors talk to **ABI
(Abhi's Brain Interface)**, an AI agent that answers questions about his work with sources,
operates the site, speaks by voice and matches job descriptions.

The full spec and decisions are in [requirements.md](requirements.md). Deployment steps are in
[DEPLOYMENT.md](DEPLOYMENT.md).

## Project layout

```
apps/web     Next.js 16 site (App Router, Tailwind v4, AI SDK chat UI)
apps/agent   FastAPI + LangGraph agent (Groq models, Gemini embeddings, pgvector search)
content/     Shared data (profile, projects, skills, experience, contact, SEO), used by both
```

## Requirements

- **Node.js** 22 or newer, with npm
- **Python** 3.12 or newer, with [uv](https://docs.astral.sh/uv/)
- **Docker** (for the local Postgres + pgvector database)
- Free API keys:
  - **Groq** ([console.groq.com](https://console.groq.com)): chat, voice transcription, prompt guard
  - **Gemini** ([aistudio.google.com](https://aistudio.google.com)): embeddings for search

## Run it locally

### 1. Start the database

```bash
docker run -d --name abi_pg -p 5434:5432 \
  -e POSTGRES_USER=abi -e POSTGRES_PASSWORD=abi -e POSTGRES_DB=abi \
  pgvector/pgvector:0.8.6-pg16-trixie
```

Later, `docker start abi_pg` is enough.

### 2. Start the agent (port 8000)

```bash
cd apps/agent
cp .env.example .env    # then fill in the values below
uv sync
uv run python -m app.rag.ingest       # first time, and whenever content/ changes
uv run uvicorn app.main:app --port 8000
```

Set these in `apps/agent/.env`:

```
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
DATABASE_URL=postgresql://abi:abi@localhost:5434/abi
```

The model names in `.env.example` already work. Ingest only embeds new or changed content, so
re-running it is cheap. Check the agent at http://localhost:8000/api/agent/health.

### 3. Start the website (port 3000)

```bash
cd apps/web
cp .env.example .env.local    # AGENT_URL=http://localhost:8000 is already set
npm install
npm run dev                   # or: npm run build && npm start
```

Open **http://localhost:3000**.

The contact form needs `SMTP_USER` and `SMTP_PASS` (for example a Gmail app password). Without
them, the form asks visitors to email directly. Everything else works.

## Useful commands

| Where | Command | What it does |
| --- | --- | --- |
| `apps/web` | `npm run lint` | Lint the site |
| `apps/web` | `npm run build` | Production build |
| `apps/agent` | `uv run python -m app.rag.ingest` | Rebuild ABI's knowledge base |
| `apps/agent` | `uv run python -m app.rag.ingest --no-readmes` | Same, without fetching GitHub READMEs |
| `apps/agent` | `uv run python -m evals.run` | Run the answer-quality evals (uses Groq tokens) |

## Updating content

Edit the JSON files in `content/`. The site picks them up on the next build. Run the ingest
command again so ABI knows about the change.

## Notes

- API keys live only in `.env` files, which are gitignored. Never commit them.
- Groq's free tier allows about 8K tokens per minute per model. When it is busy, ABI says so
  and asks the visitor to try again shortly.
