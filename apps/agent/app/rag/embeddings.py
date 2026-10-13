"""Gemini embeddings over plain REST (no SDK, keeps the Vercel bundle small)."""

import asyncio
import math

import httpx

from app.config import get_settings

API = "https://generativelanguage.googleapis.com/v1beta/models"
BATCH = 20
RETRIES = 6


def _normalize(v: list[float]) -> list[float]:
    # Gemini only normalizes the full-size output; smaller dimensions must be normalized here.
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


async def embed(texts: list[str], task: str) -> list[list[float]]:
    """task: RETRIEVAL_DOCUMENT for chunks, RETRIEVAL_QUERY for questions."""
    s = get_settings()
    out: list[list[float]] = []
    async with httpx.AsyncClient(timeout=30, headers={"x-goog-api-key": s.gemini_api_key}) as client:
        for i in range(0, len(texts), BATCH):
            body = {
                "requests": [
                    {
                        "model": f"models/{s.abi_embed_model}",
                        "content": {"parts": [{"text": t}]},
                        "taskType": task,
                        "outputDimensionality": s.abi_embed_dim,
                    }
                    for t in texts[i : i + BATCH]
                ]
            }
            for attempt in range(RETRIES):
                res = await client.post(f"{API}/{s.abi_embed_model}:batchEmbedContents", json=body)
                if res.status_code != 429 or attempt == RETRIES - 1:
                    break
                await asyncio.sleep(15 * (attempt + 1))  # free tier per-minute limit
            res.raise_for_status()
            out.extend(_normalize(e["values"]) for e in res.json()["embeddings"])
    return out


async def embed_query(text: str) -> list[float]:
    return (await embed([text], "RETRIEVAL_QUERY"))[0]
