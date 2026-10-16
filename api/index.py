"""Vercel entry point for ABI's agent API (the FastAPI app in apps/agent).

Local development never loads this file: it runs `uv run uvicorn app.main:app` in apps/agent.
On Vercel the very same app object runs as one Python function.

How the agent deployment fits together (vercel.json can't hold comments, so they live here):

- This repo has two Vercel projects. The website (Root Directory: apps/web) and this agent
  (Root Directory: the repo root, using the root vercel.json, api/ and requirements.txt).
- Vercel turns api/index.py into a function; vercel.json rewrites every path to it. FastAPI
  still sees the original path (/api/agent/chat, ...), so routes match local development.
- The website reaches the agent through its /api/agent/* rewrite (AGENT_URL), so visitors only
  ever see the website's domain.
- Packages: installed from requirements.txt at the repo root, exported from apps/agent/uv.lock.
- The shared content/ folder is bundled with the function (the agent's tools read it).

Environment variables (agent project): GROQ_API_KEY, GEMINI_API_KEY, DATABASE_URL (Neon pooled
URL), ABI_CHAT_MODEL, ABI_FAST_MODEL, and optionally BOOKING_URL and GITHUB_TOKEN.
"""

import sys
from pathlib import Path

# The agent lives in apps/agent and isn't pip-installed; its files are part of the function
# bundle, so make the `app` package importable directly.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "apps" / "agent"))

from app.main import app  # noqa: E402

__all__ = ["app"]
